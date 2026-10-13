import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { colors, minTouchTarget, radii } from '../theme/tokens';

interface CommentSheetProps {
  visible: boolean;
  initialText: string;
  onClose: () => void;
  onSave: (text: string) => void;
}

// ROADMAP item 4 — comentário do exercício.
export function CommentSheet({ visible, initialText, onClose, onSave }: CommentSheetProps) {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    if (visible) setText(initialText);
  }, [visible, initialText]);

  const handleSave = () => {
    onSave(text.trim());
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Comentário</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Como foi a execução? Sensação, dor, ajuste de carga…"
        placeholderTextColor={colors.gray500}
        multiline
        numberOfLines={4}
        style={styles.textarea}
      />
      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonLabel}>Salvar</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, fontWeight: '600', color: colors.ink, marginBottom: 16 },
  textarea: {
    height: 96,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    fontSize: 15,
    color: colors.ink,
    textAlignVertical: 'top',
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
