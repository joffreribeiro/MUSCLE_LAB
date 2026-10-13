import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, minTouchTarget, radii } from '../theme/tokens';
import { RIR_EXPLANATION, RIR_VALUES, rirChipLabel, rirHint } from '../data/rir';

interface RirPickerProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

// Seletor opcional de RIR. Tocar no valor já selecionado limpa a escolha.
export function RirPicker({ value, onChange }: RirPickerProps) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>RIR · repetições em reserva</Text>
        <Pressable onPress={() => setInfoOpen((o) => !o)} hitSlop={10}>
          <Text style={styles.info}>ⓘ</Text>
        </Pressable>
      </View>

      <View style={styles.chips}>
        {RIR_VALUES.map((n) => {
          const active = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(active ? null : n)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`RIR ${rirChipLabel(n)}`}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{rirChipLabel(n)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.hint}>
        {value === null ? 'Opcional: toque no número que representa como foi a série.' : rirHint(value)}
      </Text>
      {infoOpen ? <Text style={styles.explanation}>{RIR_EXPLANATION}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 12, fontWeight: '700', letterSpacing: 0.96, color: colors.gray500, textTransform: 'uppercase' },
  info: { fontSize: 14, color: colors.teal500 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    minHeight: minTouchTarget,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.teal500, borderColor: colors.teal500 },
  chipLabel: { fontSize: 16, fontWeight: '700', color: colors.navy700 },
  chipLabelActive: { color: colors.surface },
  hint: { fontSize: 12, color: colors.gray500, marginTop: 8, lineHeight: 16 },
  explanation: {
    fontSize: 12,
    color: colors.ink,
    lineHeight: 17,
    marginTop: 8,
    padding: 10,
    borderRadius: radii.card,
    backgroundColor: colors.fill100,
  },
});
