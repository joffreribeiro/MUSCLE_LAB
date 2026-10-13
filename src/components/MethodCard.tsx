import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme/tokens';
import { Metodo } from '../data/metodos';

/** Método de treino escolhido para o exercício: resumo sempre visível, passo a passo ao tocar. */
export function MethodCard({ metodo }: { metodo: Metodo }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.card}>
      <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <Text style={styles.eyebrow}>MÉTODO</Text>
        <Text style={styles.name}>{metodo.nome}</Text>
        <Text style={styles.summary}>{metodo.resumo}</Text>
        <Text style={styles.toggle}>{open ? 'Esconder passo a passo ˄' : 'Ver passo a passo ˅'}</Text>
      </Pressable>
      {open ? (
        <View style={styles.body}>
          {metodo.passos.map((p, i) => (
            <View key={p} style={styles.step}>
              <Text style={styles.stepNum}>{i + 1}</Text>
              <Text style={styles.stepText}>{p}</Text>
            </View>
          ))}
          <Text style={styles.extra}>
            <Text style={styles.extraLabel}>Descanso: </Text>
            {metodo.descanso}
          </Text>
          <Text style={styles.extra}>
            <Text style={styles.extraLabel}>Exemplo: </Text>
            {metodo.exemplo}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16, padding: 12, borderRadius: radii.card, backgroundColor: colors.teal100, borderLeftWidth: 4, borderLeftColor: colors.navy700 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, color: colors.navy700 },
  name: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 2 },
  summary: { fontSize: 13, lineHeight: 18, color: colors.ink, marginTop: 4 },
  toggle: { fontSize: 12, fontWeight: '700', color: colors.navy700, marginTop: 8 },
  body: { marginTop: 8, gap: 6 },
  step: { flexDirection: 'row', gap: 8 },
  stepNum: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.navy700, color: colors.surface, fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 20, overflow: 'hidden' },
  stepText: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.ink },
  extra: { fontSize: 13, lineHeight: 18, color: colors.ink },
  extraLabel: { fontWeight: '700' },
});
