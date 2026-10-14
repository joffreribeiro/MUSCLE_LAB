import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavBar } from '../components/NavBar';
import { ExerciseThumb } from '../components/ExerciseThumb';
import { colors, radii, screenPaddingHorizontal } from '../theme/tokens';
import { catalog } from '../data/catalog';
import { GroupKey } from '../types';

export function GrupoScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const groupKey: GroupKey = route.params.groupKey;
  const group = catalog[groupKey];
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return group.items.filter((i) => i.name.toLowerCase().includes(q));
  }, [group, search]);

  return (
    <View style={styles.screen}>
      <NavBar
        left={
          <Pressable onPress={() => navigation.navigate('Manual')}>
            <Text style={styles.backLink}>← Manual</Text>
          </Pressable>
        }
        title={group.name}
        right={<View style={{ width: 64 }} />}
      >
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar exercício"
          style={styles.search}
        />
      </NavBar>
      <ScrollView style={styles.body}>
        <View style={styles.list}>
          {filtered.map((e, i) => (
            <Pressable
              key={e.id}
              style={[styles.row, i > 0 && styles.rowDivider]}
              onPress={() => navigation.navigate('Ficha', { exerciseId: e.id })}
            >
              <ExerciseThumb exerciseId={e.id} highlighted />
              <Text style={styles.rowName}>{e.name}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
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
  list: { backgroundColor: colors.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingLeft: screenPaddingHorizontal, paddingRight: 14 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  rowName: { flex: 1, fontSize: 15, fontWeight: '600', lineHeight: 19, color: colors.ink },
  chevron: { color: colors.gray300, fontSize: 17 },
});
