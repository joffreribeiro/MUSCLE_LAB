import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, minTouchTarget, radii, screenPaddingHorizontal } from '../theme/tokens';
import { useWorkout } from '../context/WorkoutContext';
import { RestoreBackupPanel } from '../components/RestoreBackupPanel';
import { generateProgram, workoutGroups } from '../data/programGenerator';
import { resolveTrainingDays, toggleTrainingDay, WEEK_DISPLAY_ORDER, weekdayLong, weekdayShort } from '../data/trainingDays';
import { Goal, Level, Profile, Sex } from '../types';

interface Draft {
  goal: Goal;
  level: Level;
  weightKg: string;
  heightCm: string;
  age: string;
  sex: Sex;
  frequencyPerWeek: number;
  /** Dias da semana escolhidos (0 = domingo); null = o padrão da frequência. */
  trainingDays: number[] | null;
}

const TOTAL_STEPS = 6;

const goalOptions: { value: Goal; label: string }[] = [
  { value: 'ganhar-massa', label: 'Ganhar massa' },
  { value: 'perder-gordura', label: 'Perder gordura' },
  { value: 'manter-forma', label: 'Manter forma' },
];

const levelOptions: { value: Level; label: string; desc: string }[] = [
  { value: 'iniciante', label: 'Iniciante', desc: 'Pouca ou nenhuma experiência com musculação.' },
  { value: 'intermediario', label: 'Intermediário', desc: 'Já treina há alguns meses com regularidade.' },
  { value: 'avancado', label: 'Avançado', desc: 'Treina há anos e domina os movimentos básicos.' },
];

const sexOptions: { value: Sex; label: string }[] = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'prefiro-nao-dizer', label: 'Prefiro não dizer' },
];

// ROADMAP item 5 — onboarding de 5 telas, uma pergunta por tela.
export function OnboardingFlow() {
  const insets = useSafeAreaInsets();
  const { profile: saved, settings, completeOnboarding, applyProgram, updateSettings } = useWorkout();
  // Refazer o onboarding: já existem treinos (e talvez histórico), então não substitui sem perguntar.
  const isRedo = saved !== null;
  const [step, setStep] = useState(1);
  // Celular novo: quem já tem um backup restaura em vez de responder as perguntas.
  const [restoring, setRestoring] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    goal: saved?.goal ?? 'ganhar-massa',
    level: saved?.level ?? 'iniciante',
    weightKg: saved ? String(saved.weightKg) : '',
    heightCm: saved ? String(saved.heightCm) : '',
    age: saved ? String(saved.age) : '',
    sex: saved?.sex ?? 'prefiro-nao-dizer',
    frequencyPerWeek: saved?.frequencyPerWeek ?? 3,
    trainingDays: settings.diasTreino ?? null,
  });

  const patch = (p: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...p }));

  const profile: Profile = {
    goal: draft.goal,
    level: draft.level,
    weightKg: Number(draft.weightKg) || 70,
    heightCm: Number(draft.heightCm) || 170,
    age: Number(draft.age) || 25,
    sex: draft.sex,
    frequencyPerWeek: draft.frequencyPerWeek,
  };

  // Gerado uma vez por combinação de respostas, para os ids dos treinos não mudarem entre renders.
  const program = useMemo(
    () => generateProgram(profile),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile.goal, profile.level, profile.weightKg, profile.frequencyPerWeek],
  );

  const days = resolveTrainingDays(draft.trainingDays ?? undefined, draft.frequencyPerWeek);

  const finish = (replaceWorkouts: boolean) => {
    if (replaceWorkouts) applyProgram(program.workouts, program.restSeconds);
    updateSettings({ diasTreino: days });
    completeOnboarding(profile);
  };

  if (restoring) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backLink} onPress={() => setRestoring(false)} accessibilityRole="button">
          <Text style={styles.backLinkLabel}>‹ Voltar</Text>
        </Pressable>
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.restoreTitle}>Restaurar backup</Text>
          <Text style={styles.restoreIntro}>
            Use o backup de outro aparelho ou de uma instalação anterior para recuperar seus treinos, histórico, pesagens e medidas.
          </Text>
          <RestoreBackupPanel replaceWarning={false} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.progressTrack, { marginTop: insets.top }]}>
        <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
      </View>

      {step > 1 ? (
        <Pressable style={styles.backLink} onPress={() => setStep((s) => s - 1)}>
          <Text style={styles.backLinkLabel}>‹ Voltar</Text>
        </Pressable>
      ) : null}

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {step === 1 && (
          <Step title="Qual é o seu objetivo?">
            {goalOptions.map((o) => (
              <SelectCard key={o.value} label={o.label} active={draft.goal === o.value} onPress={() => patch({ goal: o.value })} />
            ))}
            {!isRedo ? (
              <Pressable style={styles.restoreLink} onPress={() => setRestoring(true)} accessibilityRole="button">
                <Text style={styles.restoreLinkLabel}>Já tenho um backup</Text>
              </Pressable>
            ) : null}
          </Step>
        )}

        {step === 2 && (
          <Step title="Qual é o seu nível?">
            {levelOptions.map((o) => (
              <SelectCard
                key={o.value}
                label={o.label}
                desc={o.desc}
                active={draft.level === o.value}
                onPress={() => patch({ level: o.value })}
              />
            ))}
          </Step>
        )}

        {step === 3 && (
          <Step title="Seus dados">
            <TextInput
              value={draft.weightKg}
              onChangeText={(v) => patch({ weightKg: v })}
              placeholder="Peso (kg)"
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              value={draft.heightCm}
              onChangeText={(v) => patch({ heightCm: v })}
              placeholder="Altura (cm)"
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              value={draft.age}
              onChangeText={(v) => patch({ age: v })}
              placeholder="Idade"
              keyboardType="numeric"
              style={styles.input}
            />
            <View style={styles.chipsRow}>
              {sexOptions.map((o) => (
                <Pressable
                  key={o.value}
                  style={[styles.chip, draft.sex === o.value && styles.chipActive]}
                  onPress={() => patch({ sex: o.value })}
                >
                  <Text style={[styles.chipLabel, draft.sex === o.value && styles.chipLabelActive]}>{o.label}</Text>
                </Pressable>
              ))}
            </View>
          </Step>
        )}

        {step === 4 && (
          <Step title="Quantos dias por semana?">
            <View style={styles.chipsRow}>
              {[2, 3, 4, 5, 6].map((n) => (
                <Pressable
                  key={n}
                  style={[styles.freqChip, draft.frequencyPerWeek === n && styles.chipActive]}
                  onPress={() => patch({ frequencyPerWeek: n, trainingDays: null })}
                >
                  <Text style={[styles.chipLabel, draft.frequencyPerWeek === n && styles.chipLabelActive]}>{n}x</Text>
                </Pressable>
              ))}
            </View>
          </Step>
        )}

        {step === 5 && (
          <Step title="Em quais dias você treina?">
            <View style={styles.chipsRow}>
              {WEEK_DISPLAY_ORDER.map((d) => {
                const on = days.includes(d);
                return (
                  <Pressable
                    key={d}
                    style={[styles.dayChip, on && styles.chipActive]}
                    onPress={() => patch({ trainingDays: toggleTrainingDay(days, d) })}
                    accessibilityRole="button"
                    accessibilityLabel={`Treinar ${weekdayLong(d)}`}
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.chipLabel, on && styles.chipLabelActive]}>{weekdayShort(d)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.daysHint}>
              {days.length} {days.length === 1 ? 'dia' : 'dias'} por semana
              {days.length === draft.frequencyPerWeek ? '' : ` (você escolheu ${draft.frequencyPerWeek}x)`}. O calendário e o "Treino de hoje" usam esses dias, e você pode mudar depois no Painel.
            </Text>
          </Step>
        )}

        {step === 6 && (
          <Step title="Programa recomendado">
            <View style={styles.programCard}>
              <Text style={styles.programTitle}>{program.title}</Text>
              <Text style={styles.programMeta}>
                {draft.frequencyPerWeek}x por semana · {program.split}
              </Text>
              <Text style={styles.programMeta}>
                Para o seu objetivo ({goalOptions.find((o) => o.value === draft.goal)?.label.toLowerCase()}) e nível (
                {levelOptions.find((o) => o.value === draft.level)?.label.toLowerCase()}). {program.note}
              </Text>
            </View>

            {program.workouts.map((w) => (
              <View key={w.id} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{w.name}</Text>
                  <Text style={styles.dayCount}>{w.exercises.filter((e) => e.type === 'strength').length} exercícios</Text>
                </View>
                <Text style={styles.dayGroups}>{workoutGroups(w).join(' · ')}</Text>
                <Text style={styles.dayList}>
                  {w.exercises
                    .filter((e) => e.type === 'strength')
                    .map((e) => e.name)
                    .join(' · ')}
                </Text>
              </View>
            ))}

            <Text style={styles.programFootnote}>
              As cargas iniciais são estimativas pelo seu peso e começam leves de propósito. Ajuste na primeira série: o
              RIR que você registrar calibra as próximas.
            </Text>
            {isRedo ? (
              <Text style={styles.programFootnote}>
                Você já tem treinos. Escolha abaixo se quer manter os atuais ou trocar por este programa (o histórico é
                mantido).
              </Text>
            ) : null}
          </Step>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {step < TOTAL_STEPS ? (
          <Pressable style={styles.primaryButton} onPress={() => setStep((s) => s + 1)}>
            <Text style={styles.primaryButtonLabel}>Continuar</Text>
          </Pressable>
        ) : isRedo ? (
          <>
            <Pressable style={styles.primaryButton} onPress={() => finish(false)}>
              <Text style={styles.primaryButtonLabel}>Manter meus treinos</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => finish(true)}>
              <Text style={styles.secondaryButtonLabel}>Trocar pelo programa novo</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.primaryButton} onPress={() => finish(true)}>
            <Text style={styles.primaryButtonLabel}>Começar programa</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.stepTitle}>{title}</Text>
      <View style={styles.stepBody}>{children}</View>
    </View>
  );
}

function SelectCard({
  label,
  desc,
  active,
  onPress,
}: {
  label: string;
  desc?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.selectCard, active && styles.selectCardActive]} onPress={onPress}>
      <Text style={styles.selectCardLabel}>{label}</Text>
      {desc ? <Text style={styles.selectCardDesc}>{desc}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dayChip: { minWidth: 44, paddingVertical: 12, paddingHorizontal: 12, borderRadius: radii.chip, backgroundColor: colors.fill100, alignItems: 'center' },
  daysHint: { fontSize: 13, lineHeight: 19, color: colors.gray500, marginTop: 16 },
  restoreLink: { alignSelf: 'center', paddingVertical: 14, marginTop: 6 },
  restoreLinkLabel: { fontSize: 14, fontWeight: '600', color: colors.teal500 },
  restoreTitle: { fontSize: 22, fontWeight: '700', color: colors.navy700, marginBottom: 8 },
  restoreIntro: { fontSize: 14, lineHeight: 20, color: colors.gray500, marginBottom: 16 },
  screen: { flex: 1, backgroundColor: colors.fill50 },
  progressTrack: { height: 3, backgroundColor: colors.fill100, marginHorizontal: screenPaddingHorizontal, borderRadius: 2 },
  progressFill: { height: 3, backgroundColor: colors.teal500, borderRadius: 2 },
  backLink: { paddingHorizontal: screenPaddingHorizontal, paddingTop: 16 },
  backLinkLabel: { fontSize: 15, color: colors.teal500 },
  body: { flex: 1 },
  bodyContent: { padding: screenPaddingHorizontal, paddingTop: 24 },
  stepTitle: { fontSize: 22, fontWeight: '700', color: colors.ink, marginBottom: 20 },
  stepBody: { gap: 12 },
  selectCard: {
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
  },
  selectCardActive: { borderColor: colors.teal500 },
  selectCardLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  selectCardDesc: { fontSize: 13, color: colors.gray500, marginTop: 4 },
  input: {
    height: 46,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.ink,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: radii.chip, backgroundColor: colors.fill100 },
  freqChip: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.fill100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.navy700 },
  chipLabel: { fontSize: 13, fontWeight: '600', color: colors.gray500 },
  chipLabelActive: { color: colors.surface },
  programCard: { borderRadius: radii.card, backgroundColor: colors.navy700, padding: 16, gap: 6 },
  programTitle: { fontSize: 17, fontWeight: '700', color: colors.surface, textTransform: 'uppercase' },
  programMeta: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  dayCard: { borderRadius: radii.card, backgroundColor: colors.surface, padding: 14, gap: 4 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.ink },
  dayCount: { fontSize: 12, color: colors.gray500 },
  dayGroups: { fontSize: 12, fontWeight: '600', color: colors.teal600 },
  dayList: { fontSize: 12, lineHeight: 17, color: colors.gray500 },
  programFootnote: { fontSize: 12, lineHeight: 17, color: colors.gray500 },
  secondaryButton: {
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonLabel: { fontSize: 14, fontWeight: '600', color: colors.navy700 },
  footer: { padding: screenPaddingHorizontal, gap: 8 },
  primaryButton: {
    backgroundColor: colors.teal500,
    borderRadius: radii.card,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonLabel: { fontSize: 15, fontWeight: '700', color: colors.surface, textTransform: 'uppercase', letterSpacing: 0.6 },
});
