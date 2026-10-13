import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavBar } from '../components/NavBar';
import { ExerciseMedia } from '../components/ExerciseMedia';
import { ProgressRing } from '../components/ProgressRing';
import { SubstituteSheet } from '../components/SubstituteSheet';
import { EditSetSheet } from '../components/EditSetSheet';
import { CommentSheet } from '../components/CommentSheet';
import { SwipeableHistoryRow } from '../components/SwipeableHistoryRow';
import { RestOverlay } from '../components/RestOverlay';
import { RirPicker } from '../components/RirPicker';
import { Icon } from '../components/icons/Icon';
import { ProgressionHint } from '../components/ProgressionHint';
import { BottomSheet } from '../components/BottomSheet';
import { PlateCalculator } from '../components/PlateCalculator';
import { MethodCard } from '../components/MethodCard';
import { WarmupCard } from '../components/WarmupCard';
import { findMetodo } from '../data/metodos';
import { afterSet, groupAt, groupLabel } from '../data/superset';
import { warmupSets } from '../data/warmup';
import { Toast, useToast } from '../components/Toast';
import { colors, minTouchTarget, radii, screenPaddingHorizontal } from '../theme/tokens';
import { useWorkout } from '../context/WorkoutContext';
import { formatKg, suggestNext } from '../data/progression';
import { formatMinSec } from '../utils/format';
import { Exercise, SetLog } from '../types';

export function ExecScreen() {
  const navigation = useNavigation<any>();
  const { currentExercise } = useWorkout();

  if (!currentExercise) {
    return (
      <View style={styles.screen}>
        <NavBar
          left={
            <Pressable onPress={() => navigation.navigate('Dia')}>
              <Text style={styles.backArrow}>←</Text>
            </Pressable>
          }
          title="Execução"
          right={<View style={{ width: 52 }} />}
        />
        <Text style={styles.emptyExec}>Este treino não tem exercícios. Adicione algum na tela do treino.</Text>
      </View>
    );
  }
  return <ExecBody />;
}

function ExecBody() {
  const navigation = useNavigation<any>();
  const {
    dayExercises,
    exIndex,
    goToExercise,
    currentExercise,
    logs,
    doneCount,
    rest,
    restTotal,
    restRunning,
    settings,
    addSet,
    updateSet,
    deleteSet,
    undoDeleteSet,
    toggleRest,
    extendRest,
    skipRest,
    prevEx,
    nextEx,
    historyForCurrentExercise,
    substituteDayExercise,
    commentFor,
    setComment,
    finishWorkout,
    sessions,
    updatePrescription,
  } = useWorkout();
  // ExecScreen só renderiza ExecBody quando há exercício atual.
  const ex = currentExercise!;

  const [wInput, setWInput] = useState('');
  const [rInput, setRInput] = useState('');
  const [minInput, setMinInput] = useState('');
  const [rirInput, setRirInput] = useState<number | null>(null);
  const [substituteOpen, setSubstituteOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [editingLogIndex, setEditingLogIndex] = useState<number | null>(null);
  const [restOverlayOpen, setRestOverlayOpen] = useState(false);
  const { toast, show: showToast, hide: hideToast } = useToast();

  const isCardio = ex.type === 'cardio';
  const n = Math.min(doneCount(ex.exerciseId), ex.sets);
  const isLast = exIndex >= dayExercises.length - 1;

  // Fecha sozinho ao zerar o descanso.
  useEffect(() => {
    if (restOverlayOpen && rest <= 0) setRestOverlayOpen(false);
  }, [rest, restOverlayOpen]);

  // Pré-preenche com os valores prescritos ao trocar de exercício — o app já usa esses
  // valores como fallback quando os campos ficam vazios, então deixamos isso visível.
  useEffect(() => {
    setWInput(ex.weight ? String(ex.weight) : '');
    setRInput(ex.reps != null ? String(ex.reps) : '');
    setMinInput(ex.minutes != null ? String(ex.minutes) : '');
    setRirInput(null);
  }, [ex.exerciseId]);

  // Carga 0 = exercício de peso corporal: o campo fica vazio e a série é registrada sem carga.
  const bodyweight = ex.weight === 0;
  const execRec = isCardio
    ? `Tempo recomendado: ${ex.minutes}min, ${ex.bpmRange}`
    : bodyweight
      ? 'Peso corporal: se quiser, adicione carga extra no campo abaixo'
      : `Peso recomendado: ${ex.weight != null ? formatKg(ex.weight) : '—'} kg${ex.barNote ? `, ${ex.barNote}` : ''}`;

  // Cronômetro: descanso entre séries (força) ou contagem regressiva dos minutos prescritos (cardio).
  const timerDefault = isCardio ? (ex.minutes ?? 5) * 60 : settings.descansoSegundos;
  const timerTotal = restTotal || timerDefault;
  const timerIdle = !restRunning && rest === 0;
  const restLabel = isCardio && timerIdle ? '▶' : formatMinSec(rest || timerDefault);
  const restTitle = isCardio ? 'Cronômetro' : 'Descanso';
  const restPct = Math.max(0, Math.min(1, rest / timerTotal));
  const timerAction = restRunning ? 'Pausar' : rest > 0 ? 'Retomar' : isCardio ? 'Iniciar' : 'Descanso';

  const handleTimer = () => {
    toggleRest(timerDefault);
    // Descanso manual abre a tela cheia, como ao registrar uma série; o cardio fica na tela do exercício.
    if (!isCardio && timerIdle) setRestOverlayOpen(true);
  };

  // Aviso quando a contagem do cardio chega a zero (o descanso já tem a tela cheia que fecha sozinha).
  const prevRest = useRef(rest);
  useEffect(() => {
    if (isCardio && prevRest.current > 0 && rest === 0) showToast({ message: 'Tempo concluído. Registre os minutos.' }, 4000);
    prevRest.current = rest;
  }, [rest, isCardio]);
  const setsTitle = isCardio ? 'Minutos feitos' : 'Conjuntos feitos';
  const setsColor = n >= ex.sets ? colors.teal500 : colors.red500;
  const setsPct = ex.sets > 0 ? n / ex.sets : 0;
  const execTarget = isCardio ? 'Não' : String(ex.reps);
  const execTargetLabel = isCardio ? 'Repetições' : 'Repetições necessárias';
  const comment = commentFor(ex.exerciseId);
  const suggestion = useMemo(
    () => (isCardio ? null : suggestNext(ex.exerciseId, ex.reps, sessions)),
    [isCardio, ex.exerciseId, ex.reps, sessions],
  );

  // Aplica a carga sugerida no campo e no treino, para o "peso recomendado" acompanhar a progressão.
  const [platesOpen, setPlatesOpen] = useState(false);
  // Aquecimento marcado por exercício, só durante este treino (é um guia, não vai para o histórico).
  const [warmupDone, setWarmupDone] = useState<Record<string, number[]>>({});
  const toggleWarmup = (index: number) =>
    setWarmupDone((prev) => {
      const cur = prev[ex.exerciseId] ?? [];
      return { ...prev, [ex.exerciseId]: cur.includes(index) ? cur.filter((i) => i !== index) : [...cur, index] };
    });

  const applySuggestion = (weight: number) => {
    setWInput(String(weight));
    if (weight !== ex.weight) updatePrescription(exIndex, { weight });
  };

  const handleAddSet = () => {
    // Em bi-set/tri-set, segue para o próximo exercício da rodada sem descansar; o descanso vem ao fim dela.
    const plan = isCardio ? { goTo: null, rest: true } : afterSet(dayExercises, exIndex, (id) => doneCount(id) + (id === ex.exerciseId ? 1 : 0));
    addSet({ weight: wInput, reps: rInput, minutes: minInput, rir: isCardio ? null : rirInput, skipRest: !plan.rest });
    if (!isCardio && plan.rest) setRestOverlayOpen(true);
    if (plan.goTo !== null) {
      goToExercise(plan.goTo);
      showToast({ message: `Agora: ${dayExercises[plan.goTo].name}` }, 2500);
    }
    setWInput(ex.weight ? String(ex.weight) : '');
    setRInput(ex.reps != null ? String(ex.reps) : '');
    setMinInput(ex.minutes != null ? String(ex.minutes) : '');
    // O RIR muda de série para série, então não é carregado para a próxima.
    setRirInput(null);
  };

  const handleNext = () => {
    const result = nextEx();
    if (result === 'finished') {
      finishWorkout();
      navigation.replace('Resumo');
    }
  };

  const handleSubstitute = (exercise: Exercise, scope: 'hoje' | 'programa') => {
    substituteDayExercise(exIndex, exercise, scope);
    showToast({
      message: scope === 'hoje' ? `Só hoje: ${exercise.name}` : `Substituído no programa por ${exercise.name}`,
    });
  };

  const handleDeleteSet = (logIndex: number) => {
    deleteSet(ex.exerciseId, logIndex);
    showToast({ message: 'Série excluída', actionLabel: 'Desfazer', onAction: undoDeleteSet }, 4000);
  };

  const history = historyForCurrentExercise();
  const editingEntry: SetLog | null =
    editingLogIndex !== null ? logs[ex.exerciseId]?.[editingLogIndex] ?? null : null;

  return (
    <View style={styles.screen}>
      <NavBar
        left={
          <Pressable onPress={() => navigation.navigate('Dia')}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
        }
        title={`${exIndex + 1}/${dayExercises.length}  ${ex.groupLabel}`}
        right={
          <Pressable onPress={handleTimer} accessibilityRole="button" accessibilityLabel={`Cronômetro: ${timerAction}`}>
            <Text style={styles.startLink}>{timerAction}</Text>
          </Pressable>
        }
      />
      <ScrollView style={styles.body}>
        <View style={styles.media}>
          <ExerciseMedia
            exerciseId={ex.exerciseId}
            placeholderWidth={66}
            placeholderHeight={92}
            placeholderCaption="SEM ANIMAÇÃO DISPONÍVEL"
            placeholderHighlighted
            placeholderLimbColor={colors.gray200}
          />
          <View style={styles.mediaButtons}>
            <Pressable style={styles.mediaButton} onPress={() => setSubstituteOpen(true)}>
              <Icon name="swap" color={colors.navy700} size={18} />
            </Pressable>
            <Pressable
              style={styles.mediaButton}
              onPress={() => navigation.navigate('Ficha', { exerciseId: ex.exerciseId })}
            >
              <Text style={styles.mediaButtonIconTeal}>i</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.execName}>{ex.name}</Text>
          <Text style={styles.execRec}>
            {execRec} <Text style={styles.infoGlyph}>ⓘ</Text>
          </Text>

          <View style={styles.ringsRow}>
            <View style={styles.ringCol}>
              <View style={[styles.ring, { borderWidth: 3, borderColor: colors.teal500 }]}>
                <Text style={styles.ringNumber}>{execTarget}</Text>
              </View>
              <Text style={styles.ringLabel}>{execTargetLabel}</Text>
            </View>
            <Pressable style={styles.ringCol} onPress={handleTimer}>
              <View style={styles.ringBg}>
                <ProgressRing
                  size={78}
                  radius={33}
                  strokeWidth={5}
                  pct={restPct}
                  color={colors.teal500}
                  label={restLabel}
                  labelFontSize={19}
                />
              </View>
              <Text style={styles.ringLabel}>{restTitle}</Text>
            </Pressable>
            <View style={styles.ringCol}>
              <View style={styles.ringBg}>
                <ProgressRing
                  size={78}
                  radius={37.5}
                  strokeWidth={3}
                  pct={setsPct}
                  color={setsColor}
                  label={`${n}/${ex.sets}`}
                  labelFontSize={20}
                  labelColor={colors.ink}
                />
              </View>
              <Text style={styles.ringLabel}>{setsTitle}</Text>
            </View>
          </View>

          {suggestion ? (
            <ProgressionHint suggestion={suggestion} currentWeight={wInput} onApply={applySuggestion} />
          ) : null}

          {(() => {
            const g = groupAt(dayExercises, exIndex);
            if (!g || isCardio) return null;
            const partners = g.indices.filter((j) => j !== exIndex).map((j) => dayExercises[j].name);
            return (
              <View style={styles.supersetBanner}>
                <Text style={styles.supersetEyebrow}>{groupLabel(g.indices.length).toUpperCase()}</Text>
                <Text style={styles.supersetText}>
                  Alterne com {partners.join(' e ')}, sem descanso entre eles. O descanso vem ao fim de cada rodada.
                </Text>
              </View>
            );
          })()}

          {!isCardio && ex.method && findMetodo(ex.method) ? <MethodCard key={ex.exerciseId} metodo={findMetodo(ex.method)!} /> : null}

          {!isCardio && n === 0 && !bodyweight ? (
            <WarmupCard sets={warmupSets(Number(wInput.replace(',', '.')) || ex.weight || 0)} done={warmupDone[ex.exerciseId] ?? []} onToggle={toggleWarmup} />
          ) : null}

          {/* Os campos vêm preenchidos com a prescrição; o rótulo evita confundir carga com repetições. */}
          <View style={styles.inputLabelsRow}>
            {isCardio ? (
              <Text style={styles.inputLabel}>Minutos</Text>
            ) : (
              <>
                <Pressable style={styles.inputLabelBox} onPress={() => setPlatesOpen(true)} hitSlop={6} accessibilityRole="button" accessibilityLabel="Abrir calculadora de anilhas">
                  <Text style={styles.inputLabel}>Carga (kg)</Text>
                  <Text style={styles.platesLink}>Anilhas</Text>
                </Pressable>
                <Text style={styles.inputLabel}>Repetições</Text>
              </>
            )}
            <View style={styles.addButtonSpacer} />
          </View>
          <View style={styles.inputsRowLabeled}>
            {isCardio ? (
              <TextInput
                value={minInput}
                onChangeText={setMinInput}
                placeholder="Minutos"
                keyboardType="numeric"
                style={styles.input}
              />
            ) : (
              <>
                <TextInput
                  value={wInput}
                  onChangeText={setWInput}
                  placeholder={bodyweight ? 'Peso corporal' : 'Quilogramas'}
                  keyboardType="numeric"
                  style={styles.input}
                />
                <TextInput
                  value={rInput}
                  onChangeText={setRInput}
                  placeholder="Repetições"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </>
            )}
            <Pressable
              style={styles.addButton}
              onPress={handleAddSet}
              accessibilityRole="button"
              accessibilityLabel="Registrar série"
            >
              <Text style={styles.addButtonLabel}>+</Text>
            </Pressable>
          </View>

          {isCardio ? null : <RirPicker value={rirInput} onChange={setRirInput} />}

          {comment ? (
            <View style={styles.commentRow}>
              <Text style={styles.commentText} numberOfLines={2}>
                {comment}
              </Text>
              <Pressable onPress={() => setCommentOpen(true)}>
                <Text style={styles.commentEditLink}>Editar</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setCommentOpen(true)}>
              <Text style={styles.commentLink}>Adicionar comentário</Text>
            </Pressable>
          )}

          <Text style={styles.historyLabel}>HISTÓRICO</Text>
          {history.length === 0 ? (
            <Text style={styles.historyEmpty}>Primeira vez neste exercício. Registre a primeira série.</Text>
          ) : (
          <View style={styles.historyCard}>
            {history.map((g) => (
              <View key={g.date}>
                <Text style={styles.historyGroupHeader}>{g.date}</Text>
                {g.rows.map((r) => (
                  <SwipeableHistoryRow
                    key={r.n + r.time}
                    row={r}
                    onEdit={(logIndex) => setEditingLogIndex(logIndex)}
                    onDelete={handleDeleteSet}
                  />
                ))}
              </View>
            ))}
          </View>
          )}

          <View style={styles.footerRow}>
            <Pressable style={styles.prevButton} onPress={prevEx}>
              <Text style={styles.prevButtonLabel}>‹ Anterior</Text>
            </Pressable>
            <Pressable style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonLabel}>{isLast ? 'Concluir treino' : 'Próximo ›'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <SubstituteSheet
        visible={substituteOpen}
        dayExercise={ex}
        onClose={() => setSubstituteOpen(false)}
        onSubstitute={handleSubstitute}
      />
      <CommentSheet
        visible={commentOpen}
        initialText={comment}
        onClose={() => setCommentOpen(false)}
        onSave={(text) => setComment(ex.exerciseId, text)}
      />
      <EditSetSheet
        visible={editingLogIndex !== null}
        entry={editingEntry}
        onClose={() => setEditingLogIndex(null)}
        onSave={(patch) => {
          if (editingLogIndex !== null) updateSet(ex.exerciseId, editingLogIndex, patch);
        }}
      />
      <RestOverlay
        visible={restOverlayOpen}
        secondsLeft={rest}
        nextExerciseName={dayExercises[exIndex + 1]?.name ?? null}
        onExtend={() => extendRest(30)}
        onSkip={() => {
          skipRest();
          setRestOverlayOpen(false);
        }}
      />
      <BottomSheet visible={platesOpen} onClose={() => setPlatesOpen(false)}>
        <Text style={styles.platesTitle}>Calculadora de anilhas</Text>
        <PlateCalculator initialKg={Number(wInput.replace(',', '.')) || undefined} />
      </BottomSheet>
      <Toast toast={toast} onHide={hideToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill50 },
  body: { flex: 1 },
  backArrow: { fontSize: 17, color: colors.teal500 },
  startLink: { fontSize: 15, fontWeight: '600', color: colors.teal500 },

  media: {
    height: 190,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    overflow: 'hidden',
  },
  mediaButtons: { position: 'absolute', right: 14, top: 44, gap: 10 },
  mediaButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.fill50,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaButtonIconNavy: { fontSize: 16, color: colors.navy700 },
  mediaButtonIconTeal: { fontSize: 14, fontWeight: '700', color: colors.teal500 },

  content: { padding: screenPaddingHorizontal },
  execName: { fontSize: 20, fontWeight: '700', lineHeight: 24, color: colors.ink },
  execRec: { fontSize: 13, color: colors.gray500, marginTop: 6 },
  infoGlyph: { color: colors.teal500 },

  ringsRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  ringCol: { flex: 1, alignItems: 'center', gap: 7 },
  ring: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  ringBg: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.surface,
  },
  ringNumber: { fontSize: 20, fontWeight: '700', color: colors.ink },
  ringLabel: { fontSize: 11, color: colors.gray500, textAlign: 'center', lineHeight: 14 },

  supersetBanner: { marginTop: 16, padding: 12, borderRadius: radii.card, backgroundColor: colors.fill100, borderLeftWidth: 4, borderLeftColor: colors.teal500 },
  supersetEyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, color: colors.teal600 },
  supersetText: { fontSize: 13, lineHeight: 18, color: colors.ink, marginTop: 4 },
  platesTitle: { fontSize: 17, fontWeight: '600', color: colors.ink, marginBottom: 10 },
  inputLabelBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  platesLink: { fontSize: 11, fontWeight: '700', color: colors.teal500, textDecorationLine: 'underline' },
  inputLabelsRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  inputLabel: { flex: 1, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, color: colors.gray500, textTransform: 'uppercase' },
  addButtonSpacer: { width: 52 },
  inputsRowLabeled: { flexDirection: 'row', gap: 8, marginTop: 6, alignItems: 'stretch' },
  emptyExec: { fontSize: 15, color: colors.gray500, textAlign: 'center', padding: 32 },
  input: {
    flex: 1,
    height: 46,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.ink,
    minWidth: 0,
  },
  addButton: {
    width: 52,
    height: 46,
    borderRadius: radii.card,
    backgroundColor: colors.teal500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonLabel: { color: colors.surface, fontSize: 24, fontWeight: '600' },

  commentLink: { marginTop: 14, fontSize: 14, color: colors.teal500 },
  commentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  commentText: { flex: 1, fontSize: 14, color: colors.ink },
  commentEditLink: { fontSize: 14, fontWeight: '600', color: colors.teal500 },

  historyLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.96, color: colors.gray500, marginTop: 24, marginBottom: 8 },
  historyCard: { backgroundColor: colors.surface, borderRadius: radii.card, overflow: 'hidden' },
  historyGroupHeader: { paddingVertical: 9, paddingHorizontal: 14, backgroundColor: colors.fill25, fontSize: 12, fontWeight: '600', color: colors.gray500 },
  historyEmpty: { fontSize: 14, color: colors.gray500, textAlign: 'center', paddingVertical: 16 },

  footerRow: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 20 },
  prevButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minHeight: minTouchTarget,
    justifyContent: 'center',
  },
  prevButtonLabel: { fontSize: 14, fontWeight: '600', color: colors.navy700 },
  nextButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radii.card,
    backgroundColor: colors.teal500,
    alignItems: 'center',
    minHeight: minTouchTarget,
    justifyContent: 'center',
  },
  nextButtonLabel: { fontSize: 14, fontWeight: '600', color: colors.surface },
});
