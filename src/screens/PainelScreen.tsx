import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Defs, LinearGradient, Pattern, Rect, Stop } from 'react-native-svg';
import { NavBar } from '../components/NavBar';
import { Chip } from '../components/Chip';
import { ProgressRing } from '../components/ProgressRing';
import { TrendChart } from '../components/TrendChart';
import { WeeklyGroupGrid } from '../components/WeeklyGroupGrid';
import { MuscleLoadMap } from '../components/MuscleLoadMap';
import { SessionBars } from '../components/SessionBars';
import { RecommendationsSection } from '../components/RecommendationsSection';
import { Icon } from '../components/icons/Icon';
import { MenuItem, MenuSheet } from '../components/MenuSheet';
import { ExercisePlaceholder } from '../components/icons/ExercisePlaceholder';
import { colors, minTouchTarget, radii, screenPaddingHorizontal } from '../theme/tokens';
import { useWorkout } from '../context/WorkoutContext';
import { findExerciseById, catalog } from '../data/catalog';
import {
  CalendarCell,
  GroupShareItem,
  groupShare,
  monthCalendar,
  sessionsThisWeek,
  volumeBuckets,
  weeklyGroupSets,
} from '../data/stats';
import { formatCm, formatDelta, latestMeasures, measureShort } from '../data/bodyMeasures';
import { muscleLoad } from '../data/muscleLoad';
import { average, durationMinutes, kindShare, sessionKcal, sessionsInPeriod } from '../data/sessionStats';
import { snoozeUntil, updateReminder } from '../data/updateReminder';
import { buildRecommendations, findLoadUps, missedPlannedDays, RecommendationAction, RecommendationId, snoozeRecommendation } from '../data/recommendations';
import { isTrainingDay, nextTrainingDate, resolveTrainingDays, toggleTrainingDay, WEEK_DISPLAY_ORDER, weekdayLong, weekdayShort } from '../data/trainingDays';
import { firstPeriodWidget, resolveWidgets } from '../data/painelWidgets';
import { deloadSignal } from '../data/deload';
import { nextWorkout } from '../data/nextWorkout';
import { findProgramSpec } from '../data/programCatalog';
import { programProgress } from '../data/programProgress';
import { formatKgPtBR, parseWeight, weightDelta, weightSeries } from '../data/bodyWeight';
import { formatNumberPtBR, formatShortDate } from '../utils/format';
import { GOAL_TITLE } from '../data/programGenerator';
import { Level, PainelWidgetId } from '../types';

const LEVEL_LABEL: Record<Level, { stars: string; label: string }> = {
  iniciante: { stars: '★☆☆', label: 'Iniciante' },
  intermediario: { stars: '★★☆', label: 'Intermediário' },
  avancado: { stars: '★★★', label: 'Avançado' },
};
const DEFAULT_FREQUENCY = 3;
/** Semanas mostradas no mapa de séries por músculo. */
const GRID_WEEKS = 6;

/** Período dos gráficos de análise: dias, ou null para todo o histórico. */
type Period = 7 | 30 | null;
const PERIODS: { value: Period; label: string }[] = [
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: null, label: 'Sempre' },
];
const PERIOD_EMPTY: Record<string, string> = {
  '7': 'nos últimos 7 dias',
  '30': 'nos últimos 30 dias',
  all: 'ainda',
};

// Cores do gráfico de grupos, da maior fatia para a menor; "Outros" fica em cinza.
const SHARE_COLORS = [colors.teal500, colors.navy700, colors.red500, colors.green500, colors.amber];
const shareColor = (item: GroupShareItem, i: number) => (item.key === 'outros' ? colors.gray300 : SHARE_COLORS[i % SHARE_COLORS.length]);

/** Altura máxima da barra mais alta do gráfico de peso levantado. */
const MAX_BAR_HEIGHT = 84;
const MIN_BAR_HEIGHT = 4;

const groupOf = (exerciseId: string) => {
  const exercise = findExerciseById(exerciseId);
  if (!exercise || exercise.muscleGroup === 'cardio') return null;
  return { key: exercise.muscleGroup, label: catalog[exercise.muscleGroup].name };
};

export function PainelScreen() {
  const navigation = useNavigation<any>();
  const {
    workouts,
    activeWorkout,
    sessions,
    logs,
    profile,
    dayPercent,
    settings,
    selectWorkout,
    createWorkout,
    lastSessionFor,
    weights,
    measures,
    activeProgram,
    totalSetsLogged,
    applyDeload,
    applyLoads,
    updateSettings,
    currentWeightKg,
    logWeight,
    deleteWeight,
  } = useWorkout();
  const [period, setPeriod] = useState<Period>(7);
  const [weightText, setWeightText] = useState('');
  const [weightError, setWeightError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Séries concluídas + as do treino em andamento (ainda não arquivadas).
  const allSets = useMemo(() => [...sessions.flatMap((s) => s.sets), ...Object.values(logs).flat()], [sessions, logs]);
  const today = new Date();
  const todayKey = today.toDateString();
  const weekCount = useMemo(() => sessionsThisWeek(sessions, new Date()), [sessions, todayKey]);
  const share = useMemo(() => groupShare(allSets, new Date(), period, groupOf), [allSets, period, todayKey]);
  const loadMap = useMemo(() => muscleLoad(allSets, new Date(), period), [allSets, period, todayKey]);
  // Treinos concluídos no período (mais antigo → mais recente): base de duração, calorias e tipos.
  const periodSessions = useMemo(() => sessionsInPeriod(sessions, new Date(), period), [sessions, period, todayKey]);
  const durationBars = useMemo(
    () => periodSessions.map((s) => ({ label: formatShortDate(new Date(s.finishedAtISO)), value: durationMinutes(s) })),
    [periodSessions],
  );
  const kcalBars = useMemo(
    () => periodSessions.map((s) => ({ label: formatShortDate(new Date(s.finishedAtISO)), value: sessionKcal(s, weights, currentWeightKg) })),
    [periodSessions, weights, currentWeightKg],
  );
  const kinds = useMemo(() => kindShare(periodSessions, (id) => findExerciseById(id)?.muscleGroup === 'cardio'), [periodSessions]);
  const bars = useMemo(() => volumeBuckets(allSets, new Date(), period), [allSets, period, todayKey]);
  const maxVolume = Math.max(...bars.map((b) => b.volume));
  // Grupos do programa atual entram no mapa mesmo sem séries, para mostrar o que está ficando de fora.
  const plannedGroups = useMemo(() => {
    const seen = new Map<string, { key: string; label: string }>();
    for (const e of workouts.flatMap((w) => w.exercises)) {
      const g = groupOf(e.exerciseId);
      if (g) seen.set(g.key, g);
    }
    return [...seen.values()];
  }, [workouts]);
  const weeklyGrid = useMemo(
    () => weeklyGroupSets(allSets, new Date(), GRID_WEEKS, groupOf, plannedGroups),
    [allSets, plannedGroups, todayKey],
  );
  const measureSummary = useMemo(() => latestMeasures(measures), [measures]);
  const periodKey = period === null ? 'all' : String(period);
  const weightInPeriod = useMemo(() => weightSeries(weights, new Date(), period), [weights, period, todayKey]);
  const delta = weightDelta(weightInPeriod);

  const submitWeight = () => {
    const kg = parseWeight(weightText);
    setWeightError(kg === null);
    if (kg === null) return;
    logWeight(kg);
    setWeightText('');
  };

  const frequency = profile?.frequencyPerWeek ?? DEFAULT_FREQUENCY;
  const level = LEVEL_LABEL[profile?.level ?? 'iniciante'];
  const programSpec = activeProgram ? findProgramSpec(activeProgram.specId) : undefined;
  const goalTitle = programSpec?.title ?? GOAL_TITLE[profile?.goal ?? 'ganhar-massa'];
  const next = useMemo(() => nextWorkout(workouts, sessions, new Date()), [workouts, sessions, todayKey]);
  // Séries já registradas e não concluídas: o treino ativo está em andamento.
  const inProgress = totalSetsLogged > 0 && !!activeWorkout;
  // A bolinha da lista marca o treino de hoje (ou o que está em andamento).
  const highlightId = inProgress ? activeWorkout!.id : next?.workout.id;
  const deload = useMemo(() => deloadSignal(sessions, new Date()), [sessions, todayKey]);
  const progress = activeProgram ? programProgress(activeProgram.startedISO, activeProgram.weeks, new Date()) : null;
  const weekPct = Math.min(1, weekCount / frequency);

  // Dias planejados: os escolhidos pelo usuário ou o padrão da frequência do programa.
  const trainingDays = resolveTrainingDays(settings.diasTreino, frequency);
  const plannedToday = isTrainingDay(trainingDays, new Date());
  const restDay = !!next && !inProgress && !next.trainedToday && !plannedToday;
  const nextDate = restDay ? nextTrainingDate(trainingDays, new Date()) : null;
  // O plano começa no início do programa ou no primeiro treino registrado: antes disso não há dia "perdido".
  const planSince = useMemo(() => {
    const starts = [activeProgram?.startedISO, ...sessions.map((s) => s.finishedAtISO)].filter((x): x is string => !!x).sort();
    return starts.length ? new Date(starts[0]) : null;
  }, [activeProgram, sessions]);
  const calendar = useMemo(
    () => monthCalendar(sessions, new Date(), trainingDays, planSince),
    [sessions, trainingDays.join(','), planSince, todayKey],
  );

  // Lembrete de peso e medidas: some sozinho depois de registrar, ou por 3 dias ao tocar em "Depois".
  const reminder = useMemo(
    () => updateReminder(weights, measures, planSince ? planSince.toISOString() : null, new Date(), settings.lembreteAdiadoAte),
    [weights, measures, planSince, settings.lembreteAdiadoAte, todayKey],
  );


  const showDeload =
    !!deload && settings.descargaDispensadaEm !== deload.latestSessionId && !(progress && !progress.finished && progress.phase.name === 'Descarga');
  const dismissDeload = () => {
    if (deload) updateSettings({ descargaDispensadaEm: deload.latestSessionId });
  };

  // Exercícios em que o RIR das últimas sessões pede mais carga (e que ainda não estão com ela).
  const loadUps = useMemo(() => findLoadUps(workouts, sessions), [workouts, sessions]);

  const recommendations = buildRecommendations({
    today: new Date(),
    deloadRirs: showDeload ? deload!.rirs : null,
    reminder,
    finishedProgramWeeks: progress?.finished ? progress.weeks : null,
    missedPlanned: missedPlannedDays(sessions, new Date(), trainingDays, planSince),
    idleGroups: weeklyGrid.idle.map((g) => g.label),
    loadUps,
    snoozed: settings.recomendacoesAdiadas,
  });

  const dismissRecommendation = (id: RecommendationId) => {
    if (id === 'descarga') dismissDeload();
    else if (id === 'lembrete') updateSettings({ lembreteAdiadoAte: snoozeUntil(new Date()) });
    else updateSettings({ recomendacoesAdiadas: { ...settings.recomendacoesAdiadas, [id]: snoozeRecommendation(new Date()) } });
  };

  const handleRecommendationAction = (kind: RecommendationAction, id: RecommendationId) => {
    if (kind === 'deload') {
      applyDeload();
      dismissRecommendation(id);
    } else if (kind === 'cargas') {
      applyLoads(loadUps.map((l) => ({ exerciseId: l.exerciseId, weight: l.to })));
    } else if (kind === 'medidas') navigation.navigate('Medidas');
    else navigation.navigate('Programas');
  };

  const openWorkout = (id: string) => {
    selectWorkout(id);
    navigation.navigate('Dia');
  };

  const handleNewWorkout = () => {
    createWorkout(`Treino ${String.fromCharCode(65 + (workouts.length % 26))}`);
    navigation.navigate('Dia', { editing: true });
  };

  const menuItems: MenuItem[] = [
    {
      label: 'Histórico de treinos',
      hint: `${sessions.length} ${sessions.length === 1 ? 'treino concluído' : 'treinos concluídos'}`,
      onPress: () => navigation.navigate('Historico'),
    },
    { label: 'Editar Painel', hint: 'Mostrar, ocultar e reordenar ferramentas', onPress: () => navigation.navigate('EditarPainel') },
    { label: 'Medidas corporais', hint: 'Cintura, braço, coxa e mais', onPress: () => navigation.navigate('Medidas') },
    { label: 'Programas de treino', hint: 'Escolha outro programa pronto', onPress: () => navigation.navigate('Programas') },
    { label: 'Novo treino', hint: 'Monte um treino do zero', onPress: handleNewWorkout },
    { label: 'Biblioteca de exercícios', hint: 'Busque por nome, grupo ou músculo', onPress: () => navigation.navigate('Exercicios') },
    { label: 'Métodos de treino', hint: 'Drop-set, bi-set, pirâmide…', onPress: () => navigation.navigate('ManualTab', { screen: 'Metodos', initial: false }) },
    { label: 'Glossário', hint: 'RIR, concêntrica, plano sagital…', onPress: () => navigation.navigate('ManualTab', { screen: 'Glossario', initial: false }) },
    { label: 'Perfil e preferências', onPress: () => navigation.navigate('MaisTab') },
  ];

  const widgetPrefs = resolveWidgets(settings.painelWidgets, settings.mostrarAnalytics);
  const periodAnchor = firstPeriodWidget(widgetPrefs);
  const widgetBlocks: Record<PainelWidgetId, React.ReactNode> = {
    calendario: (
      <>
        <Text style={styles.cardTitle}>Calendário de treinos</Text>
        <View style={styles.card}>
          <Text style={styles.calendarMonth}>{calendar.label}</Text>
          <View style={styles.calendarWeekRow}>
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
              <Text key={d} style={styles.calendarWeekLabel}>
                {d}
              </Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {Array.from({ length: calendar.padding }, (_, i) => (
              <View key={`pad-${i}`} style={styles.calendarCell} />
            ))}
            {calendar.cells.map((c) => (
              <View key={c.n} style={[styles.calendarCell, calendarCellStyle(c)]}>
                <Text style={calendarTextStyle(c)}>{c.n}</Text>
              </View>
            ))}
          </View>
          <View style={styles.calendarLegend}>
            <LegendDot color={colors.teal500} label="Treinou" />
            <LegendDot color={PLANNED_BG} border={colors.teal300} label="Planejado" />
            <LegendDot color={colors.red50} border={colors.red500} label="Perdido" />
          </View>
          <Text style={styles.calendarSummary}>
            {calendar.daysTrained === 0
              ? 'Nenhum treino registrado neste mês ainda.'
              : `${calendar.daysTrained} ${calendar.daysTrained === 1 ? 'dia treinado' : 'dias treinados'} neste mês`}
            {calendar.daysMissed > 0 ? ` · ${calendar.daysMissed} ${calendar.daysMissed === 1 ? 'planejado perdido' : 'planejados perdidos'}` : ''}
          </Text>
          <View style={styles.daysBox}>
            <Text style={styles.daysTitle}>DIAS DE TREINO</Text>
            <View style={styles.daysRow}>
              {WEEK_DISPLAY_ORDER.map((d) => {
                const on = trainingDays.includes(d);
                return (
                  <Pressable
                    key={d}
                    onPress={() => updateSettings({ diasTreino: toggleTrainingDay(trainingDays, d) })}
                    style={[styles.dayChip, on && styles.dayChipOn]}
                    accessibilityRole="button"
                    accessibilityLabel={`Treinar ${weekdayLong(d)}`}
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.dayChipLabel, on && styles.dayChipLabelOn]}>{weekdayShort(d)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.daysHint}>
              {trainingDays.length} {trainingDays.length === 1 ? 'dia' : 'dias'} por semana
              {trainingDays.length === frequency ? '' : ` · seu programa pede ${frequency}x`}
            </Text>
          </View>
        </View>

      </>
    ),
    corpo: (
      <>
        <Text style={styles.cardTitle}>Mapa do corpo</Text>
        <View style={[styles.card, styles.gridCard]}>
          <MuscleLoadMap data={loadMap} emptyText={`Nenhuma série registrada ${PERIOD_EMPTY[periodKey]}. Os músculos aparecem pintados conforme você treina.`} />
        </View>
      </>
    ),
    grupos: (
      <>
            <Text style={styles.cardTitle}>Séries por grupo muscular</Text>
            <View style={styles.card}>
              {share.total === 0 ? (
                <Text style={styles.emptyCardText}>
                  Registre séries nos treinos para ver como elas se dividem entre os grupos musculares.
                </Text>
              ) : (
                <View style={styles.donutRow}>
                  <DonutChart items={share.items} />
                  <View style={styles.legend}>
                    {share.items.map((s, i) => (
                      <View key={s.key} style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: shareColor(s, i) }]} />
                        <Text style={styles.legendLabel}>{s.label}</Text>
                        <Text style={styles.legendPct}>{s.pct}%</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

      </>
    ),
    pesoLevantado: (
      <>
            <Text style={styles.cardTitle}>Peso levantado, kg</Text>
            <View style={[styles.card, styles.barsCard]}>
              <View style={styles.barsRow}>
                {bars.map((b, i) => (
                  <View key={`${b.label}-${i}`} style={styles.flex1AlignCenter}>
                    <Text style={[styles.barValue, b.today && { color: colors.teal500 }]}>
                      {b.volume ? formatNumberPtBR(b.volume) : ''}
                    </Text>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: b.volume ? Math.max(MIN_BAR_HEIGHT, (b.volume / maxVolume) * MAX_BAR_HEIGHT) : MIN_BAR_HEIGHT,
                          backgroundColor: b.volume ? (b.today ? colors.teal500 : colors.teal300) : colors.fill100,
                        },
                      ]}
                    />
                    <Text style={[styles.barLabel, b.today && { color: colors.teal500, fontWeight: '700' }]}>
                      {b.today ? 'Hoje' : b.label}
                    </Text>
                  </View>
                ))}
              </View>
              {maxVolume === 0 ? <Text style={styles.barsEmpty}>Nenhuma série registrada {PERIOD_EMPTY[periodKey]}.</Text> : null}
            </View>

      </>
    ),
    duracao: (
      <>
        <Text style={styles.cardTitle}>Duração dos treinos, min</Text>
        <View style={[styles.card, styles.barsCard]}>
          {durationBars.length === 0 ? (
            <Text style={styles.emptyCardText}>Nenhum treino concluído {PERIOD_EMPTY[periodKey]}.</Text>
          ) : (
            <>
              <Text style={styles.blockSummary}>
                Média de {average(durationBars.map((b) => b.value))} min por treino · {durationBars.length} {durationBars.length === 1 ? 'treino' : 'treinos'}
              </Text>
              <SessionBars items={durationBars} format={(v) => String(v)} />
            </>
          )}
        </View>
      </>
    ),
    calorias: (
      <>
        <Text style={styles.cardTitle}>Calorias estimadas, kcal</Text>
        <View style={[styles.card, styles.barsCard]}>
          {kcalBars.length === 0 ? (
            <Text style={styles.emptyCardText}>Nenhum treino concluído {PERIOD_EMPTY[periodKey]}.</Text>
          ) : (
            <>
              <Text style={styles.blockSummary}>
                Média de {formatNumberPtBR(average(kcalBars.map((b) => b.value)))} kcal por treino · {formatNumberPtBR(kcalBars.reduce((a, b) => a + b.value, 0))} no total
              </Text>
              <SessionBars items={kcalBars} format={(v) => formatNumberPtBR(v)} />
              <Text style={styles.blockNote}>Estimativa pela duração do treino e pelo seu peso na data. Serve para comparar treinos, não como valor exato.</Text>
            </>
          )}
        </View>
      </>
    ),
    tipos: (
      <>
        <Text style={styles.cardTitle}>Tipo de exercício</Text>
        <View style={styles.card}>
          {kinds.total === 0 ? (
            <Text style={styles.emptyCardText}>Nenhum treino concluído {PERIOD_EMPTY[periodKey]}.</Text>
          ) : (
            <View style={styles.donutRow}>
              <DonutChart items={kinds.items} />
              <View style={styles.legend}>
                {kinds.items.map((s, i) => (
                  <View key={s.key} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: shareColor(s, i) }]} />
                    <Text style={styles.legendLabel}>{s.label}</Text>
                    <Text style={styles.legendPct}>{s.pct}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {kinds.total > 0 ? <Text style={[styles.blockNote, styles.blockNotePadded]}>Cada exercício conta uma vez por treino, não por série.</Text> : null}
        </View>
      </>
    ),
    medidas: (
      <>
            <Text style={styles.cardTitle}>Medidas corporais</Text>
            <Pressable style={[styles.card, styles.measuresCard]} onPress={() => navigation.navigate('Medidas')} accessibilityRole="button">
              {measureSummary.length === 0 ? (
                <Text style={styles.measuresEmpty}>Registre cintura, braço, coxa e outras medidas para acompanhar a evolução do corpo.</Text>
              ) : (
                <View style={styles.measuresGrid}>
                  {measureSummary.slice(0, 4).map((m) => (
                    <View key={m.key} style={styles.measureItem}>
                      <Text style={styles.measureValue}>{formatCm(m.latest.cm)} cm</Text>
                      <Text style={styles.measureLabel}>
                        {measureShort(m.key)}
                        {m.delta !== null && m.delta !== 0 ? ` · ${formatDelta(m.delta)}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              <Text style={styles.measuresLink}>{measureSummary.length === 0 ? 'Registrar medidas ›' : 'Ver evolução e registrar ›'}</Text>
            </Pressable>

      </>
    ),
    seriesSemana: (
      <>
            <Text style={styles.cardTitle}>Séries por músculo, por semana</Text>
            <View style={[styles.card, styles.gridCard]}>
              <WeeklyGroupGrid data={weeklyGrid} showIdle={false} />
            </View>

      </>
    ),
    peso: (
      <>
            <Text style={styles.cardTitle}>Meu peso</Text>
            <View style={styles.card}>
              <View style={styles.weightHead}>
                <View style={styles.flex1}>
                  <Text style={styles.weightNow}>{formatKgPtBR(currentWeightKg)} kg</Text>
                  <Text style={styles.weightSub}>
                    {delta === null
                      ? 'Registre seu peso para acompanhar a evolução.'
                      : delta === 0
                        ? 'Sem variação no período'
                        : `${delta > 0 ? '+' : '−'}${formatKgPtBR(Math.abs(delta))} kg no período`}
                  </Text>
                </View>
              </View>
              <TrendChart series={weightInPeriod.map((w) => ({ dateISO: w.dateISO, value: w.kg }))} format={formatKgPtBR} />
              <View style={styles.weightForm}>
                <TextInput
                  value={weightText}
                  onChangeText={(t) => {
                    setWeightText(t);
                    setWeightError(false);
                  }}
                  onSubmitEditing={submitWeight}
                  placeholder="Peso de hoje (kg)"
                  placeholderTextColor={colors.gray400}
                  keyboardType="decimal-pad"
                  style={[styles.weightInput, weightError && styles.weightInputError]}
                  accessibilityLabel="Peso de hoje em quilos"
                />
                <Pressable style={styles.weightButton} onPress={submitWeight} accessibilityRole="button">
                  <Text style={styles.weightButtonLabel}>Registrar</Text>
                </Pressable>
              </View>
              {weightError ? <Text style={styles.weightErrorText}>Digite um peso entre 20 e 400 kg.</Text> : null}
              {weights.slice(-3).reverse().map((w) => (
                <View key={w.dateISO} style={styles.weightRow}>
                  <Text style={[styles.flex1, styles.weightRowDate]}>{formatShortDate(new Date(w.dateISO))}</Text>
                  <Text style={styles.weightRowKg}>{formatKgPtBR(w.kg)} kg</Text>
                  <Pressable onPress={() => deleteWeight(w.dateISO)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Apagar pesagem">
                    <Icon name="close" color={colors.gray400} size={14} />
                  </Pressable>
                </View>
              ))}
              <View style={{ height: 14 }} />
            </View>
      </>
    ),
  };

  return (
    <View style={styles.screen}>
      <NavBar
        left={
          <Pressable
            onPress={() => navigation.navigate('Historico')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Histórico de treinos"
          >
            <View style={styles.headerIcon}><Icon name="clock" color={colors.gray500} size={22} /></View>
          </Pressable>
        }
        title="Painel"
        right={
          <Pressable onPress={() => setMenuOpen(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Menu">
            <View style={styles.headerIcon}><Icon name="menu" color={colors.gray500} size={22} /></View>
          </Pressable>
        }
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
          <Chip label="Painel" active onPress={() => {}} />
          <View style={styles.chipGap} />
          <Chip label="Exercícios" onPress={() => navigation.navigate('Exercicios')} />
          <View style={styles.chipGap} />
          <Chip label="Dieta" onPress={() => navigation.navigate('Stub', { title: 'Dieta e nutrição' })} />
          <View style={styles.chipGap} />
          <Chip
            label="Nutrição esportiva"
            onPress={() => navigation.navigate('Stub', { title: 'Dieta e nutrição' })}
          />
        </ScrollView>
      </NavBar>

      {workouts.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIllustration}>
            <ExercisePlaceholder width={56} height={78} limbColor={colors.gray300} />
          </View>
          <Text style={styles.emptyTitle}>Monte seu primeiro treino para começar</Text>
          <Pressable style={styles.emptyButton} onPress={handleNewWorkout}>
            <Text style={styles.emptyButtonLabel}>Criar treino</Text>
          </Pressable>
        </View>
      ) : (
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.programCard}>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <Pattern id="programStripes" width={28} height={28} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <Rect width={28} height={28} fill={colors.navy700} />
                <Rect width={14} height={28} fill={colors.navy600} />
              </Pattern>
              <LinearGradient id="programFade" x1="0" y1="1" x2="0" y2="0">
                <Stop offset="0%" stopColor="#0A141E" stopOpacity={0.78} />
                <Stop offset="62%" stopColor="#0A141E" stopOpacity={0.15} />
                <Stop offset="100%" stopColor="#0A141E" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#programStripes)" />
            <Rect width="100%" height="100%" fill="url(#programFade)" />
          </Svg>
          <View style={styles.programContent}>
            <Text style={styles.programTitle}>{goalTitle}</Text>
            <View style={styles.programMetaRow}>
              <Text style={styles.programMetaText}>{frequency}x por semana</Text>
              <Text style={styles.programMetaDot}>·</Text>
              <Text style={styles.programStars}>{level.stars}</Text>
              <Text style={styles.programMetaText}>{level.label}</Text>
            </View>
            <Text style={styles.programDays}>
              {weekCount} de {frequency} {frequency === 1 ? 'treino' : 'treinos'} nesta semana
            </Text>
            <View style={styles.programTrack}>
              <View style={[styles.programFill, { width: `${weekPct * 100}%` }]} />
            </View>
            {progress ? (
              <View style={styles.programWeek}>
                <Text style={styles.programWeekTitle}>
                  {progress.finished
                    ? `Programa concluído · ${progress.weeks} semanas`
                    : `Semana ${progress.week} de ${progress.weeks} · ${progress.phase.name}`}
                </Text>
                <View style={styles.programTrack}>
                  <View style={[styles.programFill, { width: `${progress.pct * 100}%` }]} />
                </View>
                <Text style={styles.programTip}>
                  {progress.finished ? 'Escolha o próximo programa para continuar evoluindo.' : progress.phase.tip}
                </Text>
              </View>
            ) : null}
            <Text style={styles.programCompleted}>
              Treinos concluídos: {sessions.length}
            </Text>
            <Pressable
              onPress={() => navigation.navigate('Programas')}
              style={styles.programSwitch}
              accessibilityRole="button"
              accessibilityLabel="Trocar de programa"
            >
              <Text style={styles.programSwitchLabel}>Trocar de programa</Text>
            </Pressable>
          </View>
        </View>

        {next ? (
          <View style={styles.todayCard}>
            <Text style={styles.todayEyebrow}>
              {inProgress ? 'TREINO EM ANDAMENTO' : next.trainedToday ? 'VOCÊ JÁ TREINOU HOJE' : restDay ? 'DIA DE DESCANSO' : 'TREINO DE HOJE'}
            </Text>
            <Text style={styles.todayTitle} numberOfLines={2}>
              {inProgress ? activeWorkout!.name : restDay ? 'Hoje é dia de descanso' : next.workout.name}
            </Text>
            <Text style={styles.todayMeta}>
              {inProgress
                ? `${dayPercent}% concluído`
                : restDay
                  ? `Próximo treino: ${next.workout.name}${nextDate ? ` · ${weekdayLong(nextDate.getDay())}, ${formatShortDate(nextDate)}` : ''}`
                  : [
                    `${next.workout.exercises.length} ${next.workout.exercises.length === 1 ? 'exercício' : 'exercícios'}`,
                    next.lastDone ? `depois de ${next.lastDone.workout.name}` : 'primeiro treino do programa',
                  ].join(' · ')}
            </Text>
            <Pressable
              style={styles.todayButton}
              onPress={() => openWorkout(inProgress ? activeWorkout!.id : next.workout.id)}
              accessibilityRole="button"
            >
              <Text style={styles.todayButtonLabel}>
                {inProgress ? 'Continuar treino' : next.trainedToday || restDay ? 'Treinar mesmo assim' : 'Começar treino'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <RecommendationsSection items={recommendations} onAction={handleRecommendationAction} onDismiss={dismissRecommendation} />

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeader, styles.flex1]}>Meus treinos</Text>
          <Pressable onPress={handleNewWorkout} hitSlop={8} accessibilityRole="button">
            <Text style={styles.sectionAction}>+ Novo treino</Text>
          </Pressable>
        </View>
        <View style={styles.card}>
          {workouts.map((w, i) => {
            const active = w.id === activeWorkout?.id;
            const last = lastSessionFor(w.id);
            const count = w.exercises.length;
            const meta = [
              `${count} ${count === 1 ? 'exercício' : 'exercícios'}`,
              last ? `último em ${formatShortDate(new Date(last.finishedAtISO))}` : 'ainda não feito',
            ].join(' · ');
            return (
              <Pressable
                key={w.id}
                style={[styles.nextDayRow, i > 0 && styles.rowDivider]}
                onPress={() => openWorkout(w.id)}
              >
                <ProgressRing
                  size={38}
                  radius={15}
                  strokeWidth={4}
                  pct={active ? dayPercent / 100 : 0}
                  color={active && dayPercent ? colors.teal500 : colors.gray300}
                  label={active ? `${dayPercent}%` : String(i + 1)}
                  labelFontSize={10}
                  labelColor={active ? undefined : colors.gray500}
                />
                <View style={styles.flex1}>
                  <Text style={styles.nextDayTitle} numberOfLines={1}>
                    {w.name}
                  </Text>
                  <Text style={styles.nextDaySub}>{meta}</Text>
                </View>
                {w.id === highlightId ? <View style={styles.todayDot} /> : null}
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          })}
        </View>

        {widgetPrefs
          .filter((w) => w.visible)
          .map((w) => (
            <React.Fragment key={w.id}>
              {w.id === periodAnchor ? (
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeader, styles.flex1]}>Período dos gráficos</Text>
                <View style={[styles.periodToggle, styles.periodToggleHeader]}>
                  {PERIODS.map((p) => (
                    <Pressable
                      key={p.label}
                      onPress={() => setPeriod(p.value)}
                      style={[styles.periodChip, period === p.value && styles.periodChipActive]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: period === p.value }}
                    >
                      <Text style={[styles.periodChipLabel, period === p.value && styles.periodChipLabelActive]}>{p.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              ) : null}
              {widgetBlocks[w.id]}
            </React.Fragment>
          ))}

        <Pressable onPress={() => navigation.navigate('EditarPainel')} style={styles.editPainel} hitSlop={8} accessibilityRole="button">
          <Text style={styles.editPainelLabel}>Editar Painel</Text>
        </Pressable>
      </ScrollView>
      )}
      <MenuSheet visible={menuOpen} items={menuItems} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

function DonutChart({ items }: { items: GroupShareItem[] }) {
  // Perímetro do círculo r=15.9 ≈ 100, então o percentual vira o comprimento do traço.
  // O offset 25 começa o primeiro segmento no topo; cada um avança o que os anteriores ocuparam.
  let used = 0;
  const segments = items.map((item, i) => {
    const segment = {
      color: shareColor(item, i),
      dash: `${item.exact} ${100 - item.exact}`,
      offset: 25 - used,
    };
    used += item.exact;
    return segment;
  });
  return (
    <View style={{ width: 112, height: 112 }}>
      <Svg width={112} height={112} viewBox="0 0 42 42">
        <Circle cx={21} cy={21} r={15.9} fill="none" stroke={colors.fill50} strokeWidth={7} />
        {segments.map((s, i) => (
          <Circle
            key={i}
            cx={21}
            cy={21}
            r={15.9}
            fill="none"
            stroke={s.color}
            strokeWidth={7}
            strokeDasharray={s.dash}
            strokeDashoffset={s.offset}
          />
        ))}
      </Svg>
    </View>
  );
}

const PLANNED_BG = '#E3F4F4';

/** Legenda do calendário: bolinha colorida (com contorno opcional) e o nome. */
function LegendDot({ color, border, label }: { color: string; border?: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.calendarLegendDot, { backgroundColor: color }, border ? { borderWidth: 1, borderColor: border } : null]} />
      <Text style={styles.calendarLegendLabel}>{label}</Text>
    </View>
  );
}

// Treinou = preenchido; perdido = vermelho claro; planejado = verde-água claro; hoje = contorno
// (também quando já treinou hoje).
function calendarCellStyle(c: CalendarCell) {
  if (c.done) {
    return c.today
      ? { backgroundColor: colors.teal500, borderWidth: 2, borderColor: colors.navy700 }
      : { backgroundColor: colors.teal500 };
  }
  if (c.today) return { backgroundColor: c.planned ? PLANNED_BG : colors.fill25, borderWidth: 1.5, borderColor: colors.teal500 };
  if (c.missed) return { backgroundColor: colors.red50 };
  if (c.planned) return { backgroundColor: PLANNED_BG };
  return { backgroundColor: colors.fill25 };
}

function calendarTextStyle(c: CalendarCell) {
  const base = { fontSize: 12, fontWeight: '600' as const };
  if (c.done) return { ...base, color: colors.surface };
  if (c.today) return { ...base, color: colors.teal500 };
  if (c.missed) return { ...base, color: colors.red500 };
  if (c.planned) return { ...base, color: colors.teal600 };
  return { ...base, fontWeight: '400' as const, color: colors.gray400 };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill50 },
  headerIcon: { width: 32, alignItems: 'center' },
  headerGlyph: { fontSize: 16, color: colors.gray500, width: 32, textAlign: 'center' },
  chipsRow: { marginTop: 2, paddingTop: 10, paddingBottom: 0 },
  chipGap: { width: 8 },
  body: { flex: 1 },
  bodyContent: { padding: screenPaddingHorizontal, paddingBottom: 24 },
  flex1: { flex: 1, minWidth: 0 },
  flex1AlignCenter: { flex: 1, alignItems: 'center', gap: 6 },

  programCard: {
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: colors.navy700,
    minHeight: 168,
    justifyContent: 'flex-end',
  },
  programContent: { padding: 16 },
  programTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 21,
    color: colors.surface,
    textTransform: 'uppercase',
  },
  programMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  programMetaText: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  programMetaDot: { color: 'rgba(255,255,255,0.35)' },
  programStars: { letterSpacing: 1, color: colors.amber, fontSize: 13 },
  programDays: { marginTop: 8, fontSize: 13, color: colors.teal300 },
  programTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)', marginTop: 8, overflow: 'hidden' },
  programFill: { height: 6, borderRadius: 3, backgroundColor: colors.teal300 },
  programWeek: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.18)' },
  programWeekTitle: { fontSize: 13, fontWeight: '700', color: colors.surface },
  programTip: { marginTop: 8, fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.75)' },
  programCompleted: { marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  programSwitch: { alignSelf: 'flex-start', marginTop: 12, paddingVertical: 8, paddingHorizontal: 14, borderRadius: radii.chip, backgroundColor: 'rgba(255,255,255,0.18)' },
  programSwitchLabel: { fontSize: 13, fontWeight: '700', color: colors.surface },

  todayCard: { marginTop: 12, backgroundColor: colors.surface, borderRadius: radii.card, padding: 16, borderLeftWidth: 4, borderLeftColor: colors.teal500 },
  todayEyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, color: colors.teal600 },
  todayTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, marginTop: 4 },
  todayMeta: { fontSize: 13, color: colors.gray500, marginTop: 3 },
  todayButton: { marginTop: 12, minHeight: minTouchTarget, borderRadius: radii.card, backgroundColor: colors.teal500, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  todayButtonLabel: { fontSize: 15, fontWeight: '700', color: colors.surface },


  sectionHeader: { marginTop: 22, marginBottom: 10, fontSize: 15, fontWeight: '700', color: colors.navy700 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  sectionAction: { marginTop: 22, marginBottom: 10, fontSize: 14, fontWeight: '600', color: colors.teal500 },

  card: { backgroundColor: colors.surface, borderRadius: radii.card },
  nextDayRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 14 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  nextDaySub: { fontSize: 11, color: colors.gray500 },
  nextDayTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  todayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green500 },
  chevron: { color: colors.gray300, fontSize: 17 },

  calendarMonth: { textAlign: 'center', padding: 14, paddingBottom: 0, fontSize: 15, fontWeight: '600', color: colors.navy700 },
  calendarWeekRow: { flexDirection: 'row', paddingHorizontal: 14, marginTop: 12, gap: 6 },
  calendarWeekLabel: { flex: 1, fontSize: 10, color: colors.gray500, textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, paddingBottom: 14, marginTop: 6, gap: 6 },
  calendarCell: {
    width: '12.7%',
    height: 34,
    borderRadius: radii.calendarCell,
    alignItems: 'center',
    justifyContent: 'center',
  },

  calendarLegend: { flexDirection: 'row', justifyContent: 'center', gap: 14, paddingBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  calendarLegendDot: { width: 10, height: 10, borderRadius: 3 },
  calendarLegendLabel: { fontSize: 11, color: colors.gray500 },
  daysBox: { borderTopWidth: 1, borderTopColor: colors.divider, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14 },
  daysTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, color: colors.gray500, marginBottom: 8 },
  daysRow: { flexDirection: 'row', gap: 6 },
  dayChip: { flex: 1, height: 36, borderRadius: radii.chip, backgroundColor: colors.fill100, alignItems: 'center', justifyContent: 'center' },
  dayChipOn: { backgroundColor: colors.navy700 },
  dayChipLabel: { fontSize: 11, fontWeight: '600', color: colors.gray500 },
  dayChipLabelOn: { color: colors.surface },
  daysHint: { fontSize: 12, color: colors.gray500, marginTop: 8 },
  calendarSummary: { textAlign: 'center', fontSize: 12, color: colors.gray500, paddingBottom: 14 },

  editPainel: { alignSelf: 'center', paddingVertical: 18 },
  editPainelLabel: { fontSize: 14, fontWeight: '600', color: colors.teal500 },
  cardTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, color: colors.gray500, marginTop: 14, marginBottom: 6, textTransform: 'uppercase' },
  periodToggle: { flexDirection: 'row', gap: 6 },
  periodToggleHeader: { marginTop: 22, marginBottom: 10 },
  periodChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radii.chip, backgroundColor: colors.fill100 },
  periodChipActive: { backgroundColor: colors.navy700 },
  periodChipLabel: { fontSize: 11, fontWeight: '600', color: colors.gray500 },
  periodChipLabelActive: { color: colors.surface },
  emptyCardText: { fontSize: 13, lineHeight: 18, color: colors.gray500, padding: 14 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 18, padding: 14, paddingTop: 14 },
  legend: { flex: 1, gap: 7 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 9, height: 9, borderRadius: 2 },
  legendLabel: { flex: 1, fontSize: 12, color: colors.ink },
  legendPct: { fontSize: 12, fontWeight: '600', color: colors.gray500 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyIllustration: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.fill100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 15, color: colors.gray500, textAlign: 'center' },
  emptyButton: {
    marginTop: 8,
    backgroundColor: colors.teal500,
    borderRadius: radii.card,
    paddingHorizontal: 20,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonLabel: { fontSize: 15, fontWeight: '700', color: colors.surface, textTransform: 'uppercase', letterSpacing: 0.6 },
  weightHead: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 4 },
  weightNow: { fontSize: 22, fontWeight: '700', color: colors.navy700 },
  weightSub: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  weightForm: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingTop: 10 },
  weightInput: { flex: 1, minHeight: minTouchTarget, borderRadius: radii.card, backgroundColor: colors.fill50, paddingHorizontal: 12, fontSize: 15, color: colors.ink },
  weightInputError: { borderWidth: 1.5, borderColor: colors.red500 },
  weightButton: { minHeight: minTouchTarget, paddingHorizontal: 16, borderRadius: radii.card, backgroundColor: colors.teal500, alignItems: 'center', justifyContent: 'center' },
  weightButtonLabel: { fontSize: 14, fontWeight: '700', color: colors.surface },
  weightErrorText: { fontSize: 12, color: colors.red500, paddingHorizontal: 14, paddingTop: 6 },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingTop: 10 },
  weightRowDate: { fontSize: 13, color: colors.gray500 },
  weightRowKg: { fontSize: 13, fontWeight: '600', color: colors.ink },
  measuresCard: { padding: 14 },
  measuresEmpty: { fontSize: 13, lineHeight: 18, color: colors.gray500 },
  measuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  measureItem: { width: '48%', backgroundColor: colors.fill50, borderRadius: radii.card, paddingVertical: 10, paddingHorizontal: 10 },
  measureValue: { fontSize: 16, fontWeight: '700', color: colors.navy700 },
  measureLabel: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  measuresLink: { fontSize: 13, fontWeight: '600', color: colors.teal500, marginTop: 12 },
  blockSummary: { fontSize: 13, color: colors.gray500, marginBottom: 12 },
  blockNote: { fontSize: 11, lineHeight: 15, color: colors.gray400, marginTop: 10 },
  blockNotePadded: { paddingHorizontal: 14, paddingBottom: 12, marginTop: 0 },
  gridCard: { padding: 14 },
  barsCard: { padding: 14, paddingTop: 16 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 130 },
  barsEmpty: { fontSize: 12, color: colors.gray500, textAlign: 'center', marginTop: 10 },
  bar: { width: 10, borderRadius: 5 },
  barValue: { fontSize: 10, fontWeight: '600', color: colors.gray500 },
  barLabel: { fontSize: 10, color: colors.gray500 },
});
