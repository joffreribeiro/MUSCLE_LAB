import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavBar } from '../components/NavBar';
import { colors, radii, screenPaddingHorizontal } from '../theme/tokens';
import { GLOSSARIO, GLOSSARIO_CATEGORIAS } from '../data/glossario';

export function GlossarioScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const terms = q
      ? GLOSSARIO.filter((t) => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q))
      : GLOSSARIO;
    return GLOSSARIO_CATEGORIAS.map((cat) => ({ cat, terms: terms.filter((t) => t.categoria === cat) })).filter(
      (g) => g.terms.length > 0,
    );
  }, [search]);

  return (
    <View style={styles.screen}>
      <NavBar
        left={
          <Pressable onPress={() => (navigation.getState().index > 0 ? navigation.goBack() : navigation.navigate('Manual'))}>
            <Text style={styles.backLink}>← Manual</Text>
          </Pressable>
        }
        title="Glossário"
        right={<View style={{ width: 64 }} />}
      >
        <TextInput value={search} onChangeText={setSearch} placeholder="Buscar termo" style={styles.search} />
      </NavBar>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {groups.length === 0 ? <Text style={styles.empty}>Nenhum termo encontrado.</Text> : null}
        {groups.map((g) => (
          <View key={g.cat}>
            <Text style={styles.sectionLabel}>{g.cat.toUpperCase()}</Text>
            <View style={styles.card}>
              {g.terms.map((t, i) => (
                <View key={t.term} style={[styles.row, i > 0 && styles.rowDivider]}>
                  <Text style={styles.term}>{t.term}</Text>
                  <Text style={styles.definition}>{t.definition}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill50 },
  backLink: { fontSize: 15, color: colors.teal500 },
  search: {
    width: '100%',
    height: 38,
    marginTop: 12,
    borderRadius: radii.card,
    backgroundColor: colors.divider,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  body: { flex: 1 },
  bodyContent: { paddingBottom: 32 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.96,
    color: colors.gray500,
    marginHorizontal: screenPaddingHorizontal,
    marginTop: 20,
    marginBottom: 8,
  },
  card: { backgroundColor: colors.surface },
  row: { paddingVertical: 12, paddingHorizontal: screenPaddingHorizontal },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  term: { fontSize: 15, fontWeight: '700', color: colors.navy700 },
  definition: { fontSize: 14, lineHeight: 20, color: colors.ink, marginTop: 3 },
  empty: { fontSize: 14, color: colors.gray500, textAlign: 'center', marginTop: 32 },
});
