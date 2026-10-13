import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { colors, minTouchTarget, radii } from '../theme/tokens';
import { PrescriptionPatch } from '../context/WorkoutContext';
import { METODOS } from '../data/metodos';
import { DayExercise } from '../types';

interface EditPrescriptionSheetProps {
  visible: boolean;
  exercise: DayExercise | null;
  onClose: () => void;
  onSave: (patch: PrescriptionPatch) => void;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

// Edita a prescrição de um exercício do treino (aberto pelo modo de edição da tela Treino).
export function EditPrescriptionSheet({ visible, exercise, onClose, onSave }: EditPrescriptionSheetProps) {
  const isCardio = exercise?.type === 'cardio';
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(12);
  const [weight, setWeight] = useState('');
  const [minutes, setMinutes] = useState(5);
  const [method, setMethod] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!exercise) return;
    setSets(exercise.sets);
    setReps(exercise.reps ?? 12);
    setWeight(exercise.weight != null ? String(exercise.weight) : '');
    setMinutes(exercise.minutes ?? 5);
    setMethod(exercise.method);
  }, [exercise]);

  const handleSave = () => {
    if (isCardio) {
      // No protótipo, cada bloco registrado de cardio conta como um "conjunto"; sets acompanha os minutos.
      onSave({ minutes, sets: minutes });
    } else {
      const kg = Number(weight.replace(',', '.'));
      onSave({ sets, reps, weight: Number.isFinite(kg) && kg >= 0 ? kg : exercise?.weight, method });
    }
    onClose();
  };

  const stepWeight = (delta: number) => {
    const kg = Number(weight.replace(',', '.')) || 0;
    setWeight(String(clamp(Math.round((kg + delta) * 2) / 2, 0, 999)));
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Editar exercício</Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {exercise?.name}
      </Text>

      {isCardio ? (
        <Stepper label="Minutos" value={String(minutes)} onMinus={() => setMinutes((m) => clamp(m - 1, 1, 120))} onPlus={() => setMinutes((m) => clamp(m + 1, 1, 120))} />
      ) : (
        <>
          <Stepper label="Séries" value={String(sets)} onMinus={() => setSets((s) => clamp(s - 1, 1, 10))} onPlus={() => setSets((s) => clamp(s + 1, 1, 10))} />
          <Stepper label="Repetições" value={String(reps)} onMinus={() => setReps((r) => clamp(r - 1, 1, 50))} onPlus={() => setReps((r) => clamp(r + 1, 1, 50))} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Carga (kg)</Text>
            <View style={styles.stepper}>
              <StepButton label="−" onPress={() => stepWeight(-2.5)} />
              <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                style={styles.weightInput}
                accessibilityLabel="Carga em quilogramas"
              />
              <StepButton label="+" onPress={() => stepWeight(2.5)} />
            </View>
          </View>
          <View style={styles.methodBlock}>
            <Text style={styles.rowLabel}>Método de treino</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.methodChips}>
              <MethodChip label="Normal" active={method === undefined} onPress={() => setMethod(undefined)} />
              {METODOS.map((m) => (
                <MethodChip key={m.id} label={m.nome} active={method === m.id} onPress={() => setMethod(m.id)} />
              ))}
            </ScrollView>
          </View>
        </>
      )}

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonLabel}>Salvar</Text>
      </Pressable>
    </BottomSheet>
  );
}

function Stepper({ label, value, onMinus, onPlus }: { label: string; value: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.stepper}>
        <StepButton label="−" onPress={onMinus} />
        <Text style={styles.value}>{value}</Text>
        <StepButton label="+" onPress={onPlus} />
      </View>
    </View>
  );
}

function MethodChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.methodChip, active && styles.methodChipOn]} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <Text style={[styles.methodChipLabel, active && styles.methodChipLabelOn]}>{label}</Text>
    </Pressable>
  );
}

function StepButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.stepButton} onPress={onPress} hitSlop={6} accessibilityRole="button" accessibilityLabel={label === '+' ? 'Aumentar' : 'Diminuir'}>
      <Text style={styles.stepButtonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, fontWeight: '600', color: colors.ink },
  subtitle: { fontSize: 13, color: colors.gray500, marginTop: 4, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.fill100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonLabel: { fontSize: 18, fontWeight: '700', color: colors.navy700 },
  value: { minWidth: 44, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.ink },
  weightInput: {
    width: 64,
    height: 36,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  methodBlock: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.divider, gap: 8 },
  methodChips: { gap: 8, paddingRight: 8 },
  methodChip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: radii.chip, backgroundColor: colors.fill100 },
  methodChipOn: { backgroundColor: colors.navy700 },
  methodChipLabel: { fontSize: 13, fontWeight: '600', color: colors.gray500 },
  methodChipLabelOn: { color: colors.surface },
  saveButton: {
    marginTop: 16,
    borderRadius: radii.card,
    backgroundColor: colors.teal500,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchTarget,
  },
  saveButtonLabel: { fontSize: 15, fontWeight: '700', color: colors.surface, textTransform: 'uppercase', letterSpacing: 0.6 },
});
