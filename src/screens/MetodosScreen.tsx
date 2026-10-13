import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from '../components/icons/Icon';
import { NavBar } from '../components/NavBar';
import { colors, radii, screenPaddingHorizontal } from '../theme/tokens';
import { METODOS, Metodo, MetodoNivel } from '../data/metodos';

const NIVEL_COLOR: Record<MetodoNivel, string> = {
  Iniciante: colors.green500,
  Intermediário: colors.amber,
  Avançado: colors.red500,
};

const NIVEIS: (MetodoNivel | 'Todos')[] = ['Todos', 'Iniciante', 'Intermediário', 'Avançado'];

export function MetodosScreen() {
  const navigation = useNavigation<any>();
  const [open, setOpen] = useState<string | null>(null);
  const [nivel, setNivel] = useState<MetodoNivel | 'Todos'>('Todos');

  const list = nivel === 'Todos' ? METODOS : METODOS.filter((m) => m.nivel === nivel);

  return (
    <View style={styles.screen}>
      <NavBar
        left={
          <Pressable onPress={() => (navigation.getState().index > 0 ? navigation.goBack() : navigation.navigate('Manual'))}>
            <Text style={styles.backLink}>← Manual</Text>
          </Pressable>
        }
        title="Métodos de treino"
        right={<View style={{ width: 64 }} />}
      >
        <View style={styles.chips}>
          {NIVEIS.map((n) => (
            <Pressable key={n} onPress={() => setNivel(n)} style={[styles.chip, nivel === n && styles.chipActive]}>
              <Text style={[styles.chipLabel, nivel === n && styles.chipLabelActive]}>{n}</Text>
            </Pressable>
          ))}
        </View>
      </NavBar>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.intro}>
          Técnicas para variar o estímulo. Use uma ou duas por treino, de preferência nos últimos exercícios.
        </Text>
        {list.map((m) => (
          <MetodoCard key={m.id} metodo={m} open={open === m.id} onToggle={() => setOpen(open === m.id ? null : m.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

function MetodoCard({ metodo: m, open, onToggle }: { metodo: Metodo; open: boolean; onToggle: () => void }) {
  return (
    <View style={styles.card}>
      <Pressable style={styles.cardHeader} onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <View style={styles.flex1}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>{m.nome}</Text>
            <View style={[styles.badge, { backgroundColor: NIVEL_COLOR[m.nivel] }]}>
              <Text style={[styles.badgeLabel, m.nivel === 'Intermediário' && { color: colors.ink }]}>{m.nivel}</Text>
            </View>
          </View>
          <Text style={styles.cardSummary}>{m.resumo}</Text>
        </View>
        <Text style={styles.chevron}>{open ? '˄' : '˅'}</Text>
      </Pressable>
      {open ? (
        <View style={styles.cardBody}>
          <Text style={styles.label}>OBJETIVO</Text>
          <Text style={styles.text}>{m.objetivo}</Text>

          <Text style={styles.label}>COMO FAZER</Text>
          {m.passos.map((p, i) => (
            <View key={p} style={styles.stepRow}>
              <Text style={styles.stepNum}>{i + 1}</Text>
              <Text style={[styles.text, styles.flex1]}>{p}</Text>
            </View>
          ))}

          <Text style={styles.label}>EXEMPLO</Text>
          <Text style={styles.text}>{m.exemplo}</Text>

          <Text style={styles.label}>DESCANSO</Text>
          <Text style={styles.text}>{m.descanso}</Text>

          <View style={styles.tip}>
            <View style={styles.tipTitleRow}>
              <Icon name="star" color="#9A7413" size={14} />
              <Text style={styles.tipTitle}>DICA</Text>
            </View>
            <Text style={styles.text}>{m.dica}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill50 },
  backLink: { fontSize: 15, color: colors.teal500 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: radii.chip, backgroundColor: colors.fill100 },
  chipActive: { backgroundColor: colors.navy700 },
  chipLabel: { fontSize: 13, fontWeight: '600', color: colors.gray500 },
  chipLabelActive: { color: colors.surface },
  body: { flex: 1 },
  bodyContent: { padding: screenPaddingHorizontal, paddingBottom: 32, gap: 10 },
  intro: { fontSize: 13, lineHeight: 18, color: colors.gray500, marginBottom: 4 },
  flex1: { flex: 1, minWidth: 0 },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: radii.chip },
  badgeLabel: { fontSize: 11, fontWeight: '700', color: colors.surface },
  cardSummary: { fontSize: 13, lineHeight: 18, color: colors.gray500, marginTop: 4 },
  chevron: { fontSize: 16, color: colors.gray400 },
  cardBody: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: colors.divider },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, color: colors.gray500, marginTop: 12, marginBottom: 4 },
  text: { fontSize: 14, lineHeight: 20, color: colors.ink },
  stepRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.teal500,
    color: colors.surface,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
    overflow: 'hidden',
  },
  tip: { marginTop: 14, padding: 12, borderRadius: radii.card, backgroundColor: '#FEF6E0', borderLeftWidth: 3, borderLeftColor: colors.amber },
  tipTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  tipTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, color: '#9A7413', marginBottom: 4 },
});
