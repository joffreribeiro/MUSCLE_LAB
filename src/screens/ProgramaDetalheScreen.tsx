import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavBar } from '../components/NavBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radii, screenPaddingHorizontal } from '../theme/tokens';
import { useWorkout } from '../context/WorkoutContext';
import {
  buildCatalogProgram,
  DEFAULT_WEIGHT_KG,
  findProgramSpec,
  GOAL_LABEL,
  isCurrentProgram,
  LEVEL_INFO,
  profileForProgram,
  restLabel,
} from '../data/programCatalog';
import { FOCUS_LABEL } from '../data/programGenerator';
import { programPhases } from '../data/programProgress';
import { daysAfterFrequencyChange } from '../data/trainingDays';
import { DayExercise } from '../types';

const num = (n: number) => String(n).replace('.', ',');

/** "4×8 · 40 kg", "3×15 · peso corporal" ou "5 min" (cardio). */
function prescription(e: DayExercise): string {
  if (e.type === 'cardio') return `${e.minutes ?? 0} min`;
  const sets = `${e.sets}×${e.reps ?? '?'}`;
  return e.weight && e.weight > 0 ? `${sets} · ${num(e.weight)} kg` : `${sets} · peso corporal`;
}

export function ProgramaDetalheScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { profile, settings, activeProgram, applyProgram, completeOnboarding, updateSettings } = useWorkout();
  const [confirming, setConfirming] = useState(false);

  const spec = findProgramSpec(route.params?.programId);
  const weight = profile?.weightKg ?? DEFAULT_WEIGHT_KG;
  // Gerado uma vez por abertura da tela: o que aparece na prévia é exatamente o que será aplicado.
  const program = useMemo(() => (spec ? buildCatalogProgram(spec, weight) : null), [spec?.id, weight]);

  if (!spec || !program) return null;

  const info = LEVEL_INFO[spec.level];
  const current = isCurrentProgram(spec, profile, activeProgram);
  const cardioMinutes = program.workouts[0].exercises.filter((e) => e.type === 'cardio').slice(1)[0]?.minutes;

  const handleUse = () => {
    applyProgram(program.workouts, program.restSeconds, { specId: spec.id, weeks: spec.weeks });
    const days = daysAfterFrequencyChange(settings.diasTreino, profile?.frequencyPerWeek ?? spec.frequency, spec.frequency);
    if (days) updateSettings({ diasTreino: days });
    completeOnboarding(profileForProgram(spec, profile));
    navigation.navigate('Painel');
  };

  return (
    <View style={styles.screen}>
      <NavBar
        left={
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={styles.backLink}>← Programas</Text>
          </Pressable>
        }
        title="Programa de treino"
      />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.hero}>
          <Text style={styles.heroGoal}>{GOAL_LABEL[spec.goal].toUpperCase()}</Text>
          <Text style={styles.heroTitle}>{spec.title}</Text>
          <View style={styles.heroMeta}>
            <Text style={styles.heroStars}>{info.stars}</Text>
            <Text style={styles.heroMetaText}>{info.label}</Text>
            <Text style={styles.heroDot}>·</Text>
            <Text style={styles.heroMetaText}>{spec.frequency}x por semana</Text>
            <Text style={styles.heroDot}>·</Text>
            <Text style={styles.heroMetaText}>{spec.weeks} semanas</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Bullet text={`Duração: ${spec.weeks} semanas, com ${program.workouts.length} treinos por semana (${program.split})`} />
          {spec.focus ? <Bullet text={`Foco: ${FOCUS_LABEL[spec.focus].toLowerCase()}, com exercícios extras nos dias em que o músculo já é treinado`} /> : null}
          <Bullet text={`Descanso entre séries: ${restLabel(spec.goal)}`} />
          {cardioMinutes ? <Bullet text={`Cardio no final de cada treino: ${cardioMinutes} min`} /> : null}
          <Bullet text="Aquecimento de 5 min na bicicleta antes de cada treino" />
        </View>

        <Text style={styles.sectionTitle}>Para quem é</Text>
        <View style={styles.cardPadded}>
          <Text style={styles.body15}>{spec.description}</Text>
          <Text style={[styles.body15, styles.note]}>{program.note}</Text>
        </View>

        <Text style={styles.sectionTitle}>Como o programa evolui</Text>
        <View style={styles.cardPadded}>
          {programPhases(spec.weeks).map((phase, i) => (
            <View key={phase.name} style={[styles.phaseRow, i > 0 && styles.exDivider]}>
              <Text style={styles.phaseWeeks}>
                {phase.from === phase.to ? `Semana ${phase.from}` : `Semanas ${phase.from} a ${phase.to}`}
              </Text>
              <Text style={styles.phaseName}>{phase.name}</Text>
              <Text style={styles.phaseTip}>{phase.tip}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Treinos do programa</Text>
        {program.workouts.map((workout) => (
          <View key={workout.id} style={styles.workoutCard}>
            <Text style={styles.workoutName}>{workout.name}</Text>
            {workout.exercises.map((e, i) => (
              <Pressable
                key={`${e.exerciseId}-${i}`}
                style={[styles.exRow, i > 0 && styles.exDivider]}
                onPress={() => navigation.navigate('Ficha', { exerciseId: e.exerciseId })}
                accessibilityRole="button"
                accessibilityLabel={`Ver exercício ${e.name}`}
              >
                <Text style={styles.exName} numberOfLines={2}>{e.name}</Text>
                <Text style={styles.exPrescription}>{prescription(e)}</Text>
              </Pressable>
            ))}
          </View>
        ))}
        <Text style={styles.footnote}>
          As cargas iniciais são estimadas pelo seu peso corporal ({num(weight)} kg). Toque em um exercício para ver como se faz.
        </Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {confirming ? (
          <View>
            <Text style={styles.confirmText}>
              Isso substitui seus treinos atuais e o descanso entre séries passa a ser {restLabel(spec.goal)}. Um treino em andamento
              é descartado. Seu histórico de treinos é mantido.
            </Text>
            <PrimaryButton label="Confirmar troca" onPress={handleUse} />
            <Pressable onPress={() => setConfirming(false)} style={styles.cancel} hitSlop={8}>
              <Text style={styles.cancelLabel}>Cancelar</Text>
            </Pressable>
          </View>
        ) : current ? (
          <View style={styles.currentBox}>
            <Text style={styles.currentLabel}>Este é o seu programa atual</Text>
          </View>
        ) : (
          <PrimaryButton label="Usar este programa" onPress={() => setConfirming(true)} />
        )}
      </View>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill50 },
  backLink: { fontSize: 15, color: colors.teal500 },
  body: { flex: 1 },
  bodyContent: { padding: screenPaddingHorizontal, paddingBottom: 24 },
  hero: { backgroundColor: colors.navy700, borderRadius: radii.card, padding: 18 },
  heroGoal: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, color: colors.teal300 },
  heroTitle: { fontSize: 22, fontWeight: '700', lineHeight: 26, color: colors.surface, marginTop: 6 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  heroStars: { fontSize: 14, color: colors.amber },
  heroMetaText: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  heroDot: { color: 'rgba(255,255,255,0.35)' },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, paddingHorizontal: 14, paddingVertical: 6, marginTop: 12 },
  cardPadded: { backgroundColor: colors.surface, borderRadius: radii.card, padding: 14 },
  bulletRow: { flexDirection: 'row', gap: 10, paddingVertical: 8 },
  bulletDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.teal500, marginTop: 7 },
  bulletText: { flex: 1, fontSize: 15, lineHeight: 22, color: colors.ink },
  sectionTitle: { marginTop: 22, marginBottom: 10, fontSize: 15, fontWeight: '700', color: colors.navy700 },
  body15: { fontSize: 15, lineHeight: 22, color: colors.ink },
  note: { color: colors.gray500, marginTop: 10 },
  workoutCard: { backgroundColor: colors.surface, borderRadius: radii.card, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4, marginBottom: 12 },
  workoutName: { fontSize: 15, fontWeight: '700', color: colors.navy800, marginBottom: 6 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  exDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  exName: { flex: 1, fontSize: 14, lineHeight: 19, color: colors.ink },
  exPrescription: { fontSize: 13, fontWeight: '600', color: colors.gray500 },
  phaseRow: { paddingVertical: 10 },
  phaseWeeks: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, color: colors.teal600, textTransform: 'uppercase' },
  phaseName: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 2 },
  phaseTip: { fontSize: 13, lineHeight: 19, color: colors.gray500, marginTop: 2 },
  footnote: { fontSize: 12, lineHeight: 17, color: colors.gray500, marginTop: 4 },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 12,
  },
  confirmText: { fontSize: 14, lineHeight: 20, color: colors.ink, marginBottom: 12 },
  cancel: { alignSelf: 'center', paddingVertical: 12 },
  cancelLabel: { fontSize: 15, fontWeight: '600', color: colors.gray500 },
  currentBox: { alignItems: 'center', justifyContent: 'center', minHeight: 44, borderRadius: radii.card, backgroundColor: colors.fill100 },
  currentLabel: { fontSize: 15, fontWeight: '600', color: colors.navy700 },
});
