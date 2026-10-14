import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { ExerciseThumb } from './ExerciseThumb';
import { colors, minTouchTarget, radii } from '../theme/tokens';
import { findExerciseById } from '../data/catalog';
import { getKinesiology, itemName } from '../data/muscles';
import { similarExercises, substitutePrescription } from '../data/similarExercises';
import { useWorkout } from '../context/WorkoutContext';
import { DayExercise, Exercise } from '../types';

interface SubstituteSheetProps {
  visible: boolean;
  dayExercise: DayExercise;
  onClose: () => void;
  onSubstitute: (exercise: Exercise, scope: 'hoje' | 'programa') => void;
}

// Substituir exercício (bottom sheet acionado pelo botão ⟳ da execução). Mostra só exercícios parecidos,
// do mesmo grupo e com o mesmo músculo como alvo principal; os demais do grupo ficam atrás de um link.
export function SubstituteSheet({ visible, dayExercise, onClose, onSubstitute }: SubstituteSheetProps) {
  const { sessions, profile } = useWorkout();
  const { similar, others } = useMemo(() => similarExercises(dayExercise.exerciseId), [dayExercise.exerciseId]);
  const [showOthers, setShowOthers] = useState(false);
  const alternatives = showOthers ? [...similar, ...others] : similar;
  const [selectedId, setSelectedId] = useState<string | undefined>((similar[0] ?? others[0])?.id);
  const current = findExerciseById(dayExercise.exerciseId);
  const target = (getKinesiology(dayExercise.exerciseId)?.primarios ?? []).slice(0, 2).map(itemName).join(' e ');

  useEffect(() => {
    if (visible) {
      setShowOthers(false);
      setSelectedId((similar[0] ?? others[0])?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, dayExercise.exerciseId]);

  const selected = [...similar, ...others].find((e) => e.id === selectedId);
  const prescription = (e: Exercise) => substitutePrescription(dayExercise, e, sessions, profile);

  const handleSubstitute = (scope: 'hoje' | 'programa') => {
    if (!selected) return;
    onSubstitute(selected, scope);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Substituição de exercício</Text>
      <Text style={styles.subtitle}>
        {target ? `Exercícios parecidos, que trabalham ${target.toLowerCase()}` : `Alternativas para ${dayExercise.groupLabel}`}
      </Text>

      <ScrollView style={styles.listScroll} contentContainerStyle={styles.list}>
        {current ? (
          <View style={styles.row}>
            <ExerciseThumb exerciseId={current.id} highlighted />
            <View style={styles.rowTexts}>
              <Text style={styles.rowName}>{current.name}</Text>
              <Text style={styles.rowSub}>
                Exercício atual
                {dayExercise.type === 'cardio' ? '' : ` · ${dayExercise.sets}x${dayExercise.reps ?? '-'}${dayExercise.weight ? `x${dayExercise.weight} kg` : ''}`}
              </Text>
            </View>
            <View style={styles.checkCircle}>
              <Text style={styles.checkGlyph}>✓</Text>
            </View>
          </View>
        ) : null}
        {alternatives.map((e) => {
          const active = e.id === selectedId;
          const isOther = !similar.includes(e);
          return (
            <Pressable
              key={e.id}
              style={[styles.row, styles.rowDivider, active && styles.rowActive]}
              onPress={() => setSelectedId(e.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <ExerciseThumb exerciseId={e.id} highlighted />
              <View style={styles.rowTexts}>
                <Text style={styles.rowName}>{e.name}</Text>
                <Text style={styles.rowSub}>
                  {prescription(e)}
                  {isOther ? ' · outro músculo' : ''}
                </Text>
              </View>
              {active ? <View style={styles.selectedDot} /> : null}
            </Pressable>
          );
        })}
        {similar.length === 0 && !showOthers ? <Text style={styles.emptyNote}>Não há exercícios parecidos a este no app.</Text> : null}
        {!showOthers && others.length > 0 ? (
          <Pressable style={styles.moreLink} onPress={() => setShowOthers(true)} accessibilityRole="button">
            <Text style={styles.moreLinkLabel}>Ver outros exercícios de {dayExercise.groupLabel.toLowerCase()}</Text>
          </Pressable>
        ) : null}
      </ScrollView>

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
  listScroll: { marginTop: 16, maxHeight: 320, borderRadius: radii.card, backgroundColor: colors.fill50 },
  list: { overflow: 'hidden' },
  rowTexts: { flex: 1, gap: 2 },
  rowSub: { fontSize: 12, color: colors.gray500 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.teal500, alignItems: 'center', justifyContent: 'center' },
  checkGlyph: { fontSize: 13, fontWeight: '700', color: colors.surface },
  selectedDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.teal500 },
  emptyNote: { fontSize: 13, color: colors.gray500, padding: 14 },
  moreLink: { padding: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.divider },
  moreLinkLabel: { fontSize: 13, fontWeight: '600', color: colors.teal500 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 11, paddingHorizontal: 14, backgroundColor: colors.fill50 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  rowActive: { backgroundColor: colors.teal100 },
  rowName: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink },
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
