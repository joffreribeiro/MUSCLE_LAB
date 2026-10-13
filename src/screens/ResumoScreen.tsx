import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/icons/Icon';
import { PrimaryButton } from '../components/PrimaryButton';
import { SessionNoteEditor } from '../components/SessionNoteEditor';
import { colors, radii } from '../theme/tokens';
import { useWorkout } from '../context/WorkoutContext';
import { averageRir, rirAverageNote } from '../data/rir';
import { findExerciseById } from '../data/catalog';
import { formatKg, suggestNext } from '../data/progression';
import { newRecords, RecordKind } from '../data/records';
import { estimateKcal } from '../data/sessionStats';
import { formatMinSec, formatNumberPtBR } from '../utils/format';

export function ResumoScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { lastSession, sessions, dayExercises, currentWeightKg, setSessionNote, applyLoads } = useWorkout();
  const [loadsApplied, setLoadsApplied] = useState(false);

  const sets = lastSession?.sets ?? [];

  // Mudanças de carga sugeridas para a próxima vez, nos exercícios feitos agora.
  const nextLoads = [...new Set(sets.map((l) => l.exerciseId))]
    .map((id) => {
      const target = dayExercises.find((e) => e.exerciseId === id)?.reps;
      return { id, suggestion: suggestNext(id, target, sessions) };
    })
    .filter(({ suggestion: s }) => s && s.weight !== undefined && s.kind !== 'manter' && s.weight !== s.lastWeight);
  // Recordes batidos neste treino em relação aos anteriores (o próprio treino já está em `sessions`).
  const records = lastSession ? newRecords(lastSession, sessions.filter((s) => s.id !== lastSession.id)) : [];
  const elapsed = lastSession?.durationSec ?? 0;
  const volume = sets.reduce((a, l) => a + l.weight * l.reps, 0);
  const avgRir = averageRir(sets.map((l) => l.rir));
  // Estimativa com MET 6 (musculação vigorosa) sobre a duração real da sessão.
  const kcal = estimateKcal(elapsed, currentWeightKg);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
    >
      <View style={styles.center}>
        <View style={styles.checkCircle}>
          <Icon name="check" color={colors.surface} size={46} strokeWidth={2.6} />
        </View>
        <Text style={styles.title}>Treino concluído</Text>
        <Text style={styles.subtitle}>{lastSession?.workoutName ?? 'Treino'}</Text>
      </View>

      <View style={styles.grid}>
        <Metric value={volume ? formatNumberPtBR(volume) : '0'} label="Volume total, kg" color={colors.navy700} />
        <Metric value={formatMinSec(elapsed)} label="Duração" color={colors.navy700} />
        <Metric value={String(kcal)} label="Calorias, kcal" color={colors.red500} />
        <Metric value={String(sets.length)} label="Séries registradas" color={colors.teal500} />
      </View>

      {avgRir !== null ? (
        <View style={styles.rirCard}>
          <Text style={styles.rirValue}>{avgRir.toFixed(1).replace('.', ',')}</Text>
          <View style={styles.rirText}>
            <Text style={styles.rirTitle}>RIR médio</Text>
            <Text style={styles.rirNote}>{rirAverageNote(avgRir)}</Text>
          </View>
        </View>
      ) : null}

      {records.length > 0 ? (
        <View style={styles.recordCard}>
          <View style={styles.recordTitleRow}>
            <Icon name="star" color="#9A7413" size={15} />
            <Text style={styles.recordTitle}>
              {records.length === 1 ? 'NOVO RECORDE' : 'NOVOS RECORDES'}
            </Text>
          </View>
          {records.map((r, i) => (
            <View key={`${r.exerciseId}-${r.kind}`} style={[styles.nextRow, i > 0 && styles.recordDivider]}>
              <View style={styles.flex1}>
                <Text style={styles.nextName} numberOfLines={1}>{findExerciseById(r.exerciseId)?.name ?? r.exerciseId}</Text>
                <Text style={styles.recordKind}>{RECORD_LABEL[r.kind]}</Text>
              </View>
              <Text style={styles.recordValue}>
                {formatRecord(r.kind, r.previous)} → {formatRecord(r.kind, r.value)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {nextLoads.length > 0 ? (
        <View style={styles.nextCard}>
          <Text style={styles.nextTitle}>PARA A PRÓXIMA VEZ</Text>
          {nextLoads.map(({ id, suggestion: s }, i) => (
            <View key={id} style={[styles.nextRow, i > 0 && styles.nextRowDivider]}>
              <Text style={styles.nextName} numberOfLines={1}>
                {findExerciseById(id)?.name ?? id}
              </Text>
              <Text style={[styles.nextLoad, s!.kind === 'reduzir' && { color: colors.red500 }]}>
                {s!.kind === 'aumentar' ? '↑' : '↓'} {formatKg(s!.lastWeight)} → {formatKg(s!.weight!)} kg
              </Text>
            </View>
          ))}
          <Pressable
            style={[styles.applyButton, loadsApplied && styles.applyButtonDone]}
            disabled={loadsApplied}
            onPress={() => {
              applyLoads(nextLoads.map(({ id, suggestion: s }) => ({ exerciseId: id, weight: s!.weight! })));
              setLoadsApplied(true);
            }}
            accessibilityRole="button"
          >
            <Text style={[styles.applyLabel, loadsApplied && styles.applyLabelDone]}>
              {loadsApplied ? 'Cargas aplicadas nos treinos' : 'Aplicar nos treinos'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {lastSession && sets.length > 0 ? (
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>ANOTAÇÃO DO TREINO</Text>
          <SessionNoteEditor note={lastSession.note} onSave={(n) => setSessionNote(lastSession.id, n)} />
        </View>
      ) : null}

      {sets.length === 0 ? (
        <Text style={styles.note}>Nenhuma série foi registrada, então este treino não entrou no histórico.</Text>
      ) : null}

      <PrimaryButton
        label="Voltar ao painel"
        onPress={() => navigation.popToTop()}
        style={styles.button}
      />
    </ScrollView>
  );
}

const RECORD_LABEL: Record<RecordKind, string> = {
  carga: 'Carga máxima',
  '1rm': '1RM estimado',
  reps: 'Repetições numa série',
};

const formatRecord = (kind: RecordKind, value: number) => (kind === 'reps' ? `${value} rep` : `${formatKg(value)} kg`);

function Metric({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill50 },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  center: { alignItems: 'center' },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.teal500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkGlyph: { color: colors.surface, fontSize: 38 },
  title: { fontSize: 22, fontWeight: '700', marginTop: 18, color: colors.ink },
  subtitle: { fontSize: 14, color: colors.gray500, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 26 },
  metricCard: { width: '48%', backgroundColor: colors.surface, borderRadius: radii.card, padding: 16 },
  metricValue: { fontSize: 22, fontWeight: '700' },
  metricLabel: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  rirCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 16,
  },
  rirValue: { fontSize: 22, fontWeight: '700', color: colors.teal500 },
  rirText: { flex: 1 },
  rirTitle: { fontSize: 12, color: colors.gray500 },
  rirNote: { fontSize: 13, lineHeight: 18, color: colors.ink, marginTop: 2 },
  flex1: { flex: 1, minWidth: 0 },
  recordCard: { marginTop: 10, backgroundColor: '#FEF6E0', borderLeftWidth: 3, borderLeftColor: colors.amber, borderRadius: radii.card, padding: 16 },
  recordTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  recordTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, color: '#9A7413' },
  recordDivider: { borderTopWidth: 1, borderTopColor: 'rgba(154,116,19,0.2)' },
  recordKind: { fontSize: 11, color: colors.gray500, marginTop: 1 },
  recordValue: { fontSize: 14, fontWeight: '700', color: colors.navy700 },
  noteCard: { marginTop: 10, backgroundColor: colors.surface, borderRadius: radii.card, padding: 16 },
  noteTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, color: colors.gray500, marginBottom: 10 },
  applyButton: { marginTop: 12, minHeight: 44, borderRadius: radii.card, backgroundColor: colors.teal500, alignItems: 'center', justifyContent: 'center' },
  applyButtonDone: { backgroundColor: colors.fill100 },
  applyLabel: { fontSize: 14, fontWeight: '700', color: colors.surface },
  applyLabelDone: { color: colors.gray500 },
  nextCard: { marginTop: 10, backgroundColor: colors.surface, borderRadius: radii.card, padding: 16 },
  nextTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, color: colors.gray500, marginBottom: 6 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  nextRowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  nextName: { flex: 1, fontSize: 14, color: colors.ink },
  nextLoad: { fontSize: 14, fontWeight: '700', color: colors.teal500 },
  note: { fontSize: 13, color: colors.gray500, textAlign: 'center', marginTop: 14 },
  button: { marginTop: 22 },
});
