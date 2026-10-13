import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavBar } from '../components/NavBar';
import { ExerciseMedia } from '../components/ExerciseMedia';
import { BodySelector } from '../components/BodySelector';
import { colors, radii, screenPaddingHorizontal } from '../theme/tokens';
import { catalog, groupOrder } from '../data/catalog';
import { METODOS } from '../data/metodos';
import { GLOSSARIO } from '../data/glossario';

export function ManualScreen() {
  const navigation = useNavigation<any>();

  const shortcuts = [
    {
      label: 'Exercícios',
      meta: 'Biblioteca completa',
      onPress: () => navigation.navigate('TreinosTab', { screen: 'Exercicios' }),
      teal: true,
    },
    { label: 'Métodos de treino', meta: `${METODOS.length} técnicas`, onPress: () => navigation.navigate('Metodos') },
    { label: 'Glossário', meta: `${GLOSSARIO.length} termos`, onPress: () => navigation.navigate('Glossario') },
    { label: 'Calculadora de anilhas', meta: 'Montar a barra', onPress: () => navigation.navigate('Anilhas') },
    {
      label: 'Nutrição esportiva',
      meta: 'Em breve',
      onPress: () => navigation.navigate('Stub', { title: 'Nutrição esportiva' }),
    },
  ];

  return (
    <View style={styles.screen}>
      <NavBar title="Manual" />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.bodyCard}>
          <Text style={styles.bodyTitle}>Explore pelo corpo</Text>
          <BodySelector
            selected={null}
            onSelect={(muscle) => navigation.navigate('Musculo', { muscle })}
            width={104}
          />
        </View>

        <View style={styles.shortcuts}>
          {shortcuts.map((s, i) => (
            <Pressable key={s.label} style={[styles.shortcutRow, i > 0 && styles.rowDivider]} onPress={s.onPress}>
              <Text style={s.teal ? styles.shortcutTeal : styles.shortcutLabel}>{s.label}</Text>
              <Text style={styles.shortcutMeta}>{s.meta}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>GRUPOS MUSCULARES</Text>
        <View style={styles.list}>
          {groupOrder.map((key, i) => {
            const group = catalog[key];
            return (
              <Pressable
                key={key}
                style={[styles.row, i > 0 && styles.rowDivider]}
                onPress={() => navigation.navigate('Grupo', { groupKey: key })}
              >
                <View style={styles.thumb}>
                  <ExerciseMedia exerciseId={group.items[0].id} placeholderWidth={20} placeholderHeight={28} />
                </View>
                <Text style={styles.rowName}>{group.name}</Text>
                <Text style={styles.rowCount}>{group.items.length} exercícios</Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill50 },
  body: { flex: 1 },
  bodyContent: { paddingBottom: 24 },
  bodyCard: { backgroundColor: colors.surface, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  bodyTitle: { fontSize: 15, fontWeight: '700', color: colors.navy700, textAlign: 'center', marginBottom: 10 },
  shortcuts: { backgroundColor: colors.surface, marginTop: 12 },
  shortcutRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: screenPaddingHorizontal },
  shortcutTeal: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.teal500 },
  shortcutLabel: { flex: 1, fontSize: 16, color: colors.ink },
  shortcutMeta: { fontSize: 13, color: colors.gray500 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.96, color: colors.gray500, marginHorizontal: screenPaddingHorizontal, marginTop: 22, marginBottom: 8 },
  list: { backgroundColor: colors.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingLeft: screenPaddingHorizontal, paddingRight: 14 },
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
  rowName: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.ink },
  rowCount: { fontSize: 13, color: colors.gray500 },
  chevron: { color: colors.gray300, fontSize: 17 },
});
