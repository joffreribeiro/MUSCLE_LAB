import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { ExerciseMedia } from './ExerciseMedia';
import { colors, minTouchTarget, radii } from '../theme/tokens';
import { catalog } from '../data/catalog';
import { DayExercise, Exercise } from '../types';

interface SubstituteSheetProps {
  visible: boolean;
  dayExercise: DayExercise;
  onClose: () => void;
  onSubstitute: (exercise: Exercise, scope: 'hoje' | 'programa') => void;
}

// ROADMAP item 2 — substituir exercício (bottom sheet acionado pelo botão ⟳ da execução).
export function SubstituteSheet({ visible, dayExercise, onClose, onSubstitute }: SubstituteSheetProps) {
  const alternatives = catalog[dayExercise.groupKey].items.filter((e) => e.id !== dayExercise.exerciseId);
  const [selectedId, setSelectedId] = useState<string | undefined>(alternatives[0]?.id);

  useEffect(() => {
    if (visible) setSelectedId(alternatives[0]?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, dayExercise.exerciseId]);

  const selected = alternatives.find((e) => e.id === selectedId);

  const handleSubstitute = (scope: 'hoje' | 'programa') => {
    if (!selected) return;
    onSubstitute(selected, scope);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Substituir exercício</Text>
      <Text style={styles.subtitle}>Alternativas para {dayExercise.groupLabel}</Text>

      <View style={styles.list}>
        {alternatives.map((e, i) => {
          const active = e.id === selectedId;
          return (
            <Pressable
              key={e.id}
              style={[styles.row, i > 0 && styles.rowDivider, active && styles.rowActive]}
              onPress={() => setSelectedId(e.id)}
            >
              <View style={styles.thumb}>
                <ExerciseMedia exerciseId={e.id} placeholderWidth={20} placeholderHeight={28} placeholderHighlighted />
              </View>
              <Text style={styles.rowName}>{e.name}</Text>
              {i < 2 ? (
                <View style={styles.similarBadge}>
                  <Text style={styles.similarBadgeLabel}>similar</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.scopeNote}>
        <Text style={styles.scopeBold}>Só hoje:</Text> o exercício original volta quando você concluir o treino.{' '}
        <Text style={styles.scopeBold}>No programa:</Text> a troca fica definitiva.
      </Text>

      <View style={styles.footerRow}>
        <Pressable style={styles.secondaryButton} onPress={() => handleSubstitute('hoje')}>
          <Text style={styles.secondaryButtonLabel}>Substituir só hoje</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={() => handleSubstitute('programa')}>
          <Text style={styles.primaryButtonLabel}>Substituir no programa</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, fontWeight: '600', color: colors.ink },
  subtitle: { fontSize: 13, color: colors.gray500, marginTop: 4 },
  list: { marginTop: 16, borderRadius: radii.card, overflow: 'hidden', backgroundColor: colors.fill50 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 11, paddingHorizontal: 14 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  rowActive: { backgroundColor: colors.teal100 },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radii.card,
    backgroundColor: colors.fill100,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowName: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink },
  similarBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: radii.chip, backgroundColor: colors.teal500 },
  similarBadgeLabel: { fontSize: 11, fontWeight: '600', color: colors.surface },
  scopeNote: { fontSize: 12, lineHeight: 17, color: colors.gray500, marginTop: 12 },
  scopeBold: { fontWeight: '700', color: colors.ink },
  footerRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  secondaryButton: {
    flex: 1,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchTarget,
    paddingHorizontal: 8,
  },
  secondaryButtonLabel: { fontSize: 13, fontWeight: '600', color: colors.navy700, textAlign: 'center' },
  primaryButton: {
    flex: 1,
    borderRadius: radii.card,
    backgroundColor: colors.teal500,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchTarget,
    paddingHorizontal: 8,
  },
  primaryButtonLabel: { fontSize: 13, fontWeight: '600', color: colors.surface, textAlign: 'center' },
});
