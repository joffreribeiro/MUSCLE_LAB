import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme/tokens';
import { WeeklyGroupSets } from '../data/stats';
import { formatShortDate } from '../utils/format';

/** Séries por semana consideradas boas para hipertrofia (faixa comum de 10 a 20 por músculo). */
export const WEEKLY_SETS_TARGET = 10;

const cellStyle = (n: number) => {
  if (n === 0) return { backgroundColor: colors.fill100, text: colors.gray400 };
  if (n < 6) return { backgroundColor: colors.teal100, text: colors.navy800 };
  if (n < WEEKLY_SETS_TARGET) return { backgroundColor: colors.teal300, text: colors.navy800 };
  return { backgroundColor: colors.teal500, text: colors.surface };
};

/** Mapa de calor: uma linha por grupo muscular, uma coluna por semana, o número é a quantidade de séries. */
/** `showIdle`: mostra o aviso de grupos parados (as Recomendações do Painel já trazem esse aviso). */
export function WeeklyGroupGrid({ data, showIdle = true }: { data: WeeklyGroupSets; showIdle?: boolean }) {
  const { weeks, rows, idle } = data;
  const last = weeks.length - 1;

  if (rows.length === 0) {
    return <Text style={styles.empty}>Registre séries nos treinos para ver quantas você faz por músculo a cada semana.</Text>;
  }

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.labelCol} />
        {weeks.map((w, i) => (
          <Text key={w.getTime()} style={[styles.weekLabel, i === last && styles.weekLabelNow]}>
            {i === last ? 'Atual' : formatShortDate(w)}
          </Text>
        ))}
      </View>
      {rows.map((r) => (
        <View key={r.key} style={styles.row}>
          <Text style={styles.groupLabel} numberOfLines={1}>
            {r.label}
          </Text>
          {r.counts.map((n, i) => {
            const c = cellStyle(n);
            return (
              <View key={i} style={[styles.cell, { backgroundColor: c.backgroundColor }]}>
                <Text style={[styles.cellText, { color: c.text }]}>{n || ''}</Text>
              </View>
            );
          })}
        </View>
      ))}

      <View style={styles.legend}>
        {[0, 3, 7, WEEKLY_SETS_TARGET].map((n) => (
          <View key={n} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: cellStyle(n).backgroundColor }]} />
            <Text style={styles.legendText}>{n === 0 ? '0' : n === 3 ? '1-5' : n === 7 ? '6-9' : `${WEEKLY_SETS_TARGET}+`}</Text>
          </View>
        ))}
      </View>

      {showIdle && idle.length > 0 ? (
        <View style={styles.idleBox}>
          <Text style={styles.idleText}>
            Sem séries nas últimas duas semanas: <Text style={styles.idleNames}>{idle.map((g) => g.label).join(', ')}</Text>.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  labelCol: { width: 68 },
  weekLabel: { flex: 1, fontSize: 10, color: colors.gray500, textAlign: 'center' },
  weekLabelNow: { fontWeight: '700', color: colors.teal600 },
  groupLabel: { width: 68, fontSize: 12, color: colors.ink },
  cell: { flex: 1, height: 28, borderRadius: radii.calendarCell, alignItems: 'center', justifyContent: 'center' },
  cellText: { fontSize: 12, fontWeight: '700' },
  legend: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 10, color: colors.gray500 },
  idleBox: { marginTop: 10, backgroundColor: '#FEF6E0', borderLeftWidth: 3, borderLeftColor: colors.amber, borderRadius: radii.card, padding: 10 },
  idleText: { fontSize: 12, lineHeight: 17, color: colors.ink },
  idleNames: { fontWeight: '700' },
  empty: { fontSize: 13, lineHeight: 18, color: colors.gray500 },
});
