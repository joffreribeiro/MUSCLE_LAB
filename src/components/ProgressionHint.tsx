import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, minTouchTarget, radii } from '../theme/tokens';
import { Suggestion, SuggestionKind, formatKg } from '../data/progression';
import { formatShortDate } from '../utils/format';

interface ProgressionHintProps {
  suggestion: Suggestion;
  /** Carga atualmente digitada no campo; o botão some quando já é a sugerida. */
  currentWeight: string;
  onApply: (weight: number) => void;
}

const LOOK: Record<SuggestionKind, { glyph: string; accent: string; bg: string; title: string }> = {
  aumentar: { glyph: '↑', accent: colors.teal500, bg: colors.teal100, title: 'Subir a carga' },
  manter: { glyph: '=', accent: colors.navy600, bg: colors.fill100, title: 'Manter a carga' },
  reduzir: { glyph: '↓', accent: colors.red500, bg: colors.red50, title: 'Reduzir a carga' },
  'sem-rir': { glyph: 'i', accent: colors.gray500, bg: colors.fill100, title: 'Sem RIR na última vez' },
};

// Sugestão de carga para hoje, baseada na última sessão deste exercício.
export function ProgressionHint({ suggestion, currentWeight, onApply }: ProgressionHintProps) {
  const look = LOOK[suggestion.kind];
  const typed = Number(currentWeight.replace(',', '.'));
  const canApply = suggestion.weight !== undefined && typed !== suggestion.weight;

  return (
    <View style={[styles.card, { backgroundColor: look.bg, borderLeftColor: look.accent }]}>
      <View style={styles.header}>
        <View style={[styles.glyphCircle, { backgroundColor: look.accent }]}>
          <Text style={styles.glyph}>{look.glyph}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{look.title}</Text>
          <Text style={styles.last}>
            Última vez ({formatShortDate(new Date(suggestion.lastDateISO))}): {suggestion.lastSets} ×{' '}
            {formatKg(suggestion.lastWeight)} kg
          </Text>
        </View>
      </View>
      <Text style={styles.message}>{suggestion.message}</Text>
      {canApply ? (
        <Pressable
          style={[styles.button, { backgroundColor: look.accent }]}
          onPress={() => onApply(suggestion.weight!)}
          accessibilityRole="button"
          accessibilityLabel={`Usar ${formatKg(suggestion.weight!)} quilogramas`}
        >
          <Text style={styles.buttonLabel}>Usar {formatKg(suggestion.weight!)} kg</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    padding: 12,
    borderRadius: radii.card,
    borderLeftWidth: 4,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  glyphCircle: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: 14, fontWeight: '800', color: colors.surface },
  headerText: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: colors.ink },
  last: { fontSize: 12, color: colors.gray500, marginTop: 1 },
  message: { fontSize: 13, lineHeight: 18, color: colors.ink, marginTop: 8 },
  button: {
    marginTop: 10,
    minHeight: minTouchTarget,
    borderRadius: radii.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { fontSize: 14, fontWeight: '700', color: colors.surface },
});
