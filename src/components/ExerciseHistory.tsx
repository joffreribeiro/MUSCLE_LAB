import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from './EmptyState';
import { colors, radii } from '../theme/tokens';
import { useWorkout } from '../context/WorkoutContext';
import { formatSessionDate } from '../utils/format';

/** Séries já feitas de um exercício, treino a treino (do mais recente ao mais antigo). */
export function ExerciseHistory({ exerciseId }: { exerciseId: string }) {
  const { sessions } = useWorkout();
  const groups = useMemo(
    () =>
      sessions
        .map((s) => ({ s, sets: s.sets.filter((l) => l.exerciseId === exerciseId) }))
        .filter(({ sets }) => sets.length > 0),
    [sessions, exerciseId],
  );

  if (groups.length === 0) {
    return <EmptyState title="O histórico está vazio por enquanto" text="Aqui você verá o histórico de séries concluídas e peso levantado." />;
  }

  return (
    <View style={styles.card}>
      {groups.map(({ s, sets }, gi) => (
        <View key={s.id} style={gi > 0 && styles.groupDivider}>
          <Text style={styles.date}>{formatSessionDate(new Date(s.finishedAtISO))}</Text>
          {sets.map((l, i) => (
            <View key={l.loggedAtISO + i} style={styles.row}>
              <Text style={styles.n}>Nº{i + 1}</Text>
              <Text style={styles.label}>{l.label}</Text>
              <Text style={styles.time}>{l.loggedAt}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.card, paddingHorizontal: 14, paddingBottom: 6 },
  groupDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  date: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, color: colors.gray500, paddingTop: 12, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 },
  n: { width: 34, fontSize: 13, color: colors.gray500 },
  label: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink },
  time: { fontSize: 12, color: colors.gray500 },
});
