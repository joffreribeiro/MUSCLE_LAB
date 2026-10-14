import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from './icons/Icon';
import { EmptyState } from './EmptyState';
import { TrendChart } from './TrendChart';
import { colors, radii } from '../theme/tokens';
import { useWorkout } from '../context/WorkoutContext';
import { exerciseEvolution } from '../data/records';
import { formatKg } from '../data/progression';
import { formatShortDate } from '../utils/format';

/** "Minha evolução" na ficha do exercício: recordes e gráfico, a partir do histórico de treinos. */
export function EvolutionSection({ exerciseId, showEmpty }: { exerciseId: string; showEmpty?: boolean }) {
  const { sessions } = useWorkout();
  const evolution = useMemo(() => exerciseEvolution(exerciseId, sessions), [exerciseId, sessions]);
  const { points, records, bodyweight } = evolution;
  if (points.length === 0) {
    return showEmpty ? <EmptyState title="Sem evolução ainda" text="Faça este exercício em um treino para ver seus recordes e o gráfico de evolução." /> : null;
  }

  const chart = bodyweight
    ? points.map((p) => ({ dateISO: p.dateISO, value: p.topReps }))
    : points.filter((p) => p.e1rm !== null).map((p) => ({ dateISO: p.dateISO, value: p.e1rm as number }));

  return (
    <>
      <View style={styles.sectionHeader}>
        <Icon name="star" color={colors.navy700} size={18} />
        <Text style={styles.sectionTitle}>Minha evolução</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.tiles}>
          {bodyweight ? (
            <Tile label="Máx. repetições" value={String(records.maxReps?.reps ?? 0)} note={records.maxReps ? formatShortDate(new Date(records.maxReps.dateISO)) : ''} />
          ) : (
            <>
              <Tile
                label="Carga máxima"
                value={records.maxWeight ? `${formatKg(records.maxWeight.kg)} kg` : '-'}
                note={records.maxWeight ? `${records.maxWeight.reps} rep · ${formatShortDate(new Date(records.maxWeight.dateISO))}` : ''}
              />
              <Tile
                label="1RM estimado"
                value={records.best1RM ? `${formatKg(records.best1RM.kg)} kg` : '-'}
                note={records.best1RM ? formatShortDate(new Date(records.best1RM.dateISO)) : 'Séries até 12 rep'}
              />
            </>
          )}
          <Tile label="Treinos" value={String(points.length)} note={`último ${formatShortDate(new Date(points[points.length - 1].dateISO))}`} />
        </View>
        {chart.length >= 2 ? (
          <>
            <Text style={styles.chartTitle}>{bodyweight ? 'Repetições por treino' : '1RM estimado por treino, kg'}</Text>
            <TrendChart series={chart} format={bodyweight ? String : formatKg} />
          </>
        ) : (
          <Text style={styles.hint}>Faça este exercício em mais um treino para ver o gráfico de evolução.</Text>
        )}
      </View>
    </>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
      {note ? <Text style={styles.tileNote}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.navy700 },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: 14 },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, backgroundColor: colors.fill50, borderRadius: radii.card, paddingVertical: 10, paddingHorizontal: 8 },
  tileValue: { fontSize: 16, fontWeight: '700', color: colors.navy700 },
  tileLabel: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  tileNote: { fontSize: 10, color: colors.gray400, marginTop: 2 },
  chartTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, color: colors.gray500, textTransform: 'uppercase', marginTop: 14 },
  hint: { fontSize: 13, lineHeight: 18, color: colors.gray500, marginTop: 12 },
});
