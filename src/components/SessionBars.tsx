import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/tokens';

export interface SessionBar {
  /** Rótulo embaixo da barra (data curta). */
  label: string;
  value: number;
}

const MAX_BAR_HEIGHT = 96;
const MIN_BAR_HEIGHT = 4;

/** Barras verticais, uma por treino. A última (treino mais recente) fica em destaque. */
export function SessionBars({ items, format }: { items: SessionBar[]; format: (value: number) => string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const crowded = items.length > 8;

  return (
    <View style={styles.row}>
      {items.map((item, i) => {
        const latest = i === items.length - 1;
        return (
          <View key={`${item.label}-${i}`} style={styles.col}>
            <Text style={[styles.value, latest && styles.valueLatest, crowded && styles.valueSmall]} numberOfLines={1}>
              {item.value > 0 ? format(item.value) : ''}
            </Text>
            <View
              style={[
                styles.bar,
                { height: item.value > 0 ? Math.max(MIN_BAR_HEIGHT, (item.value / max) * MAX_BAR_HEIGHT) : MIN_BAR_HEIGHT },
                { backgroundColor: item.value > 0 ? (latest ? colors.teal500 : colors.teal300) : colors.fill100 },
              ]}
            />
            <Text style={[styles.label, latest && styles.labelLatest, crowded && styles.labelSmall]} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 140 },
  col: { flex: 1, alignItems: 'center', gap: 6, minWidth: 0 },
  bar: { width: '70%', maxWidth: 22, borderRadius: 5 },
  value: { fontSize: 10, fontWeight: '600', color: colors.gray500 },
  valueLatest: { color: colors.teal600 },
  valueSmall: { fontSize: 8 },
  label: { fontSize: 10, color: colors.gray500 },
  labelLatest: { fontWeight: '700', color: colors.teal600 },
  labelSmall: { fontSize: 8 },
});
