import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { colors, minTouchTarget, radii } from '../theme/tokens';
import { RirPicker } from './RirPicker';
import { SetLog } from '../types';

interface EditSetSheetProps {
  visible: boolean;
  entry: SetLog | null;
  onClose: () => void;
  onSave: (patch: { weight?: string; reps?: string; minutes?: string; rir?: number | null }) => void;
}

// ROADMAP item 3 — editar série (aberto pelo swipe "Editar" no HISTÓRICO de hoje).
export function EditSetSheet({ visible, entry, onClose, onSave }: EditSetSheetProps) {
  const isCardio = entry ? entry.minutes !== undefined : false;
  const [wInput, setWInput] = useState('');
  const [rInput, setRInput] = useState('');
  const [minInput, setMinInput] = useState('');
  const [rirInput, setRirInput] = useState<number | null>(null);

  useEffect(() => {
    if (!entry) return;
    setWInput(String(entry.weight ?? ''));
    setRInput(String(entry.reps ?? ''));
    setMinInput(String(entry.minutes ?? ''));
    setRirInput(entry.rir ?? null);
  }, [entry]);

  const handleSave = () => {
    onSave(isCardio ? { minutes: minInput } : { weight: wInput, reps: rInput, rir: rirInput });
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Editar série</Text>
      <View style={styles.inputsRow}>
        {isCardio ? (
          <TextInput
            value={minInput}
            onChangeText={setMinInput}
            placeholder="Minutos"
            keyboardType="numeric"
            style={styles.input}
          />
        ) : (
          <>
            <TextInput
              value={wInput}
              onChangeText={setWInput}
              placeholder="Quilogramas"
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              value={rInput}
              onChangeText={setRInput}
              placeholder="Repetições"
              keyboardType="numeric"
              style={styles.input}
            />
          </>
        )}
      </View>
      {isCardio ? null : <RirPicker value={rirInput} onChange={setRirInput} />}
      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonLabel}>Salvar</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, fontWeight: '600', color: colors.ink, marginBottom: 16 },
  inputsRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    height: 46,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.ink,
  },
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
