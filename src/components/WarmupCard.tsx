import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme/tokens';
import { WarmupSet } from '../data/warmup';
import { formatKg } from '../data/progression';

/** Aquecimento sugerido antes da primeira série de trabalho. É um guia: marcar as séries não grava nada. */
export function WarmupCard({ sets, done, onToggle }: { sets: WarmupSet[]; done: number[]; onToggle: (index: number) => void }) {
  if (sets.length === 0) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>AQUECIMENTO SUGERIDO</Text>
      {sets.map((s, i) => {
        const on = done.includes(i);
        return (
          <Pressable
            key={i}
            style={styles.row}
            onPress={() => onToggle(i)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={`Aquecimento ${i + 1}: ${s.reps} repetições com ${formatKg(s.kg)} quilos`}
          >
            <View style={[styles.box, on && styles.boxOn]}>{on ? <Text style={styles.tick}>✓</Text> : null}</View>
            <Text style={[styles.text, on && styles.textDone]}>
              {s.reps} × {formatKg(s.kg)} kg
            </Text>
          </Pressable>
        );
      })}
      <Text style={styles.note}>Séries leves, sem chegar perto da falha. Não entram no histórico.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16, padding: 12, borderRadius: radii.card, backgroundColor: colors.fill50, borderLeftWidth: 4, borderLeftColor: colors.amber },
  title: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, color: colors.gray500, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.gray300, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  boxOn: { backgroundColor: colors.teal500, borderColor: colors.teal500 },
  tick: { fontSize: 13, fontWeight: '800', color: colors.surface },
  text: { fontSize: 15, fontWeight: '600', color: colors.ink },
  textDone: { color: colors.gray400, textDecorationLine: 'line-through' },
  note: { fontSize: 11, color: colors.gray500, marginTop: 4 },
});
