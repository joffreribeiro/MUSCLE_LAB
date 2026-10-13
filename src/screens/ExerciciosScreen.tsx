import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavBar } from '../components/NavBar';
import { ExerciseMedia } from '../components/ExerciseMedia';
import { BodySelector } from '../components/BodySelector';
import { Toast, useToast } from '../components/Toast';
import { colors, minTouchTarget, radii, screenPaddingHorizontal } from '../theme/tokens';
import { useWorkout } from '../context/WorkoutContext';
import { allExercises, catalog, equipmentOrder, groupOrder } from '../data/catalog';
import { equipmentLabel, Equipment, GroupKey } from '../types';

type GroupFilter = GroupKey | 'todos';
type EquipmentFilter = Equipment | 'todos';

// ROADMAP item 1 — biblioteca de Exercícios (montagem de treino), separada do Manual (leitura).
export function ExerciciosScreen() {
  const navigation = useNavigation<any>();
  const { activeWorkout, dayExercises, addExerciseToDay, removeDayExerciseAt } = useWorkout();
  const { toast, show: showToast, hide: hideToast } = useToast();

  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<GroupFilter>('todos');
  const [equipment, setEquipment] = useState<EquipmentFilter>('todos');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allExercises.filter((e) => {
      if (group !== 'todos' && e.muscleGroup !== group) return false;
      if (equipment !== 'todos' && e.equipment !== equipment) return false;
      if (q && !e.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, group, equipment]);

  // O corpo aparece no início da lista enquanto nenhum filtro/busca está ativo.
  const showBody = !search && group === 'todos' && equipment === 'todos';

  const clearFilters = () => {
    setSearch('');
    setGroup('todos');
    setEquipment('todos');
  };

  return (
    <View style={styles.screen}>
      <NavBar
        title="Exercícios"
        left={
          navigation.canGoBack() ? (
            <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
              <Text style={styles.backLink}>← Voltar</Text>
            </Pressable>
          ) : undefined
        }
        right={<View style={{ width: 52 }} />}
      >
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar exercício"
          style={styles.search}
        />
      </NavBar>

      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <FilterChip label="Todos" active={group === 'todos'} onPress={() => setGroup('todos')} />
          {groupOrder.map((key) => (
            <FilterChip key={key} label={catalog[key].name} active={group === key} onPress={() => setGroup(key)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <FilterChip label="Todos" active={equipment === 'todos'} onPress={() => setEquipment('todos')} />
          {equipmentOrder.map((key) => (
            <FilterChip key={key} label={equipmentLabel[key]} active={equipment === key} onPress={() => setEquipment(key)} />
          ))}
        </ScrollView>
      </View>

      <Text style={styles.resultCount}>{filtered.length} exercícios</Text>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nenhum exercício encontrado</Text>
          <Pressable onPress={clearFilters}>
            <Text style={styles.emptyLink}>Limpar filtros</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {showBody ? (
            <View style={styles.bodyCard}>
              <Text style={styles.bodyTitle}>Escolha pelo músculo</Text>
              <BodySelector
                selected={null}
                onSelect={(muscle) => navigation.navigate('Musculo', { muscle, canAdd: true })}
                width={104}
              />
            </View>
          ) : null}
          {filtered.map((e, i) => (
            <Pressable
              key={e.id}
              style={[styles.row, i > 0 && styles.rowDivider]}
              onPress={() => navigation.navigate('Ficha', { exerciseId: e.id })}
            >
              <View style={styles.thumb}>
                <ExerciseMedia exerciseId={e.id} placeholderWidth={20} placeholderHeight={28} />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.rowName}>{e.name}</Text>
                <Text style={styles.rowSubtitle}>
                  {catalog[e.muscleGroup].name} · {equipmentLabel[e.equipment]}
                </Text>
              </View>
              <Pressable
                style={styles.addButton}
                onPress={() => {
                  const insertedAt = dayExercises.length;
                  if (!addExerciseToDay(e)) {
                    showToast({ message: `${e.name} já está em ${activeWorkout?.name ?? 'neste treino'}` });
                    return;
                  }
                  showToast({
                    message: `Adicionado a ${activeWorkout?.name ?? 'treino'}`,
                    actionLabel: 'Desfazer',
                    onAction: () => removeDayExerciseAt(insertedAt),
                  });
                }}
                accessibilityRole="button"
                accessibilityLabel={`Adicionar ${e.name} ao treino`}
              >
                <Text style={styles.addButtonLabel}>+</Text>
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <Toast toast={toast} onHide={hideToast} />
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
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
    backgroundColor: colors.fill100,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  filters: { backgroundColor: colors.surface, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  chipsRow: { gap: 8, paddingHorizontal: screenPaddingHorizontal, paddingBottom: 10 },
  chip: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: radii.chip, backgroundColor: colors.fill100 },
  chipActive: { backgroundColor: colors.navy700 },
  chipLabel: { fontSize: 13, fontWeight: '600', color: colors.gray500 },
  chipLabelActive: { color: colors.surface },
  resultCount: { fontSize: 12, color: colors.gray500, paddingHorizontal: screenPaddingHorizontal, paddingVertical: 10 },
  list: { flex: 1 },
  bodyCard: {
    backgroundColor: colors.surface,
    paddingVertical: 14,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bodyTitle: { fontSize: 15, fontWeight: '700', color: colors.navy700, textAlign: 'center', marginBottom: 10 },
  flex1: { flex: 1, minWidth: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingLeft: screenPaddingHorizontal,
    paddingRight: 14,
    backgroundColor: colors.surface,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
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
  rowName: { fontSize: 15, fontWeight: '600', color: colors.ink },
  rowSubtitle: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.teal500,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: minTouchTarget > 32 ? 32 : minTouchTarget,
  },
  addButtonLabel: { fontSize: 18, fontWeight: '700', color: colors.surface },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
  emptyText: { fontSize: 15, color: colors.gray500, textAlign: 'center' },
  emptyLink: { fontSize: 14, fontWeight: '600', color: colors.teal500 },
});
