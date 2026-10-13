import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, minTouchTarget, radii } from '../theme/tokens';
import { hasTag, normalizeNote, NOTE_MAX_LENGTH, NOTE_TAGS, toggleTag } from '../data/sessionNote';

/** Campo de anotação do treino, com atalhos. `onSave` recebe o texto limpo (undefined = apagar). */
export function SessionNoteEditor({ note, onSave }: { note?: string; onSave: (note: string | undefined) => void }) {
  const [text, setText] = useState(note ?? '');
  const [saved, setSaved] = useState(false);
  const dirty = normalizeNote(text) !== note;

  const change = (next: string) => {
    setText(next);
    setSaved(false);
  };

  return (
    <View style={styles.box}>
      <View style={styles.tags}>
        {NOTE_TAGS.map((tag) => {
          const on = hasTag(text, tag);
          return (
            <Pressable
              key={tag}
              onPress={() => change(toggleTag(text, tag))}
              style={[styles.tag, on && styles.tagOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.tagLabel, on && styles.tagLabelOn]}>{tag}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        value={text}
        onChangeText={change}
        placeholder="Como foi o treino? Sono, energia, dores…"
        placeholderTextColor={colors.gray400}
        multiline
        maxLength={NOTE_MAX_LENGTH}
        style={styles.input}
        accessibilityLabel="Anotação do treino"
      />
      <View style={styles.footer}>
        <Text style={styles.saved}>{saved && !dirty ? 'Anotação salva.' : ''}</Text>
        <Pressable
          style={[styles.button, !dirty && styles.buttonOff]}
          disabled={!dirty}
          onPress={() => {
            onSave(normalizeNote(text));
            setSaved(true);
          }}
          accessibilityRole="button"
        >
          <Text style={[styles.buttonLabel, !dirty && styles.buttonLabelOff]}>Salvar anotação</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: radii.chip, backgroundColor: colors.fill100 },
  tagOn: { backgroundColor: colors.navy700 },
  tagLabel: { fontSize: 13, fontWeight: '600', color: colors.gray500 },
  tagLabelOn: { color: colors.surface },
  input: {
    minHeight: 72,
    maxHeight: 160,
    borderRadius: radii.card,
    backgroundColor: colors.fill50,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  saved: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.teal600 },
  button: { minHeight: minTouchTarget, paddingHorizontal: 16, borderRadius: radii.card, backgroundColor: colors.teal500, alignItems: 'center', justifyContent: 'center' },
  buttonOff: { backgroundColor: colors.fill100 },
  buttonLabel: { fontSize: 14, fontWeight: '700', color: colors.surface },
  buttonLabelOff: { color: colors.gray400 },
});
