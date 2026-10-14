import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavBar } from '../components/NavBar';
import { BodySelector } from '../components/BodySelector';
import { ExerciseThumb } from '../components/ExerciseThumb';
import { Toast, useToast } from '../components/Toast';
import { colors, radii, screenPaddingHorizontal } from '../theme/tokens';
import { useWorkout } from '../context/WorkoutContext';
import { catalog } from '../data/catalog';
import { muscleLabel, roleColor } from '../data/muscles';
import { RankedExercise, rankExercisesForMuscle } from '../data/muscleRanking';
import { equipmentLabel, MuscleKey } from '../types';

// Exercícios que mais ativam o músculo escolhido no corpo. Trocar de músculo
// tocando em outra região atualiza a lista na própria tela.
export function MusculoScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const canAdd: boolean = !!route.params?.canAdd;
  const [muscle, setMuscle] = useState<MuscleKey>(route.params.muscle);
  const { activeWorkout, dayExercises, addExerciseToDay, removeDayExerciseAt } = useWorkout();
  const { toast, show: showToast, hide: hideToast } = useToast();

  const ranking = useMemo(() => rankExercisesForMuscle(muscle), [muscle]);

  const handleAdd = (r: RankedExercise) => {
    const insertedAt = dayExercises.length;
    if (!addExerciseToDay(r.exercise)) {
      showToast({ message: `${r.exercise.name} já está em ${activeWorkout?.name ?? 'neste treino'}` });
      return;
    }
    showToast({
      message: `Adicionado a ${activeWorkout?.name ?? 'treino'}`,
      actionLabel: 'Desfazer',
      onAction: () => removeDayExerciseAt(insertedAt),
    });
  };

  const renderRow = (r: RankedExercise, i: number, accent: string, showIsolated: boolean) => (
    <Pressable
      key={r.exercise.id}
      style={[styles.row, i > 0 && styles.rowDivider]}
      onPress={() => navigation.navigate('Ficha', { exerciseId: r.exercise.id })}
    >
      <View style={[styles.rankBar, { backgroundColor: accent }]} />
      <ExerciseThumb exerciseId={r.exercise.id} />
      <View style={styles.flex1}>
        <Text style={styles.rowName}>{r.exercise.name}</Text>
        <Text style={styles.rowSubtitle}>
          {catalog[r.exercise.muscleGroup].name} · {equipmentLabel[r.exercise.equipment]}
          {showIsolated && r.primaryRegions === 1 ? ' · isolado' : ''}
        </Text>
      </View>
      {canAdd ? (
        <Pressable
          style={styles.addButton}
          onPress={() => handleAdd(r)}
          accessibilityRole="button"
          accessibilityLabel={`Adicionar ${r.exercise.name} ao treino`}
          hitSlop={6}
        >
          <Text style={styles.addButtonLabel}>+</Text>
        </Pressable>
      ) : (
        <Text style={styles.chevron}>›</Text>
      )}
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <NavBar
        left={
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>← Voltar</Text>
          </Pressable>
        }
        title="Por músculo"
        right={<View style={{ width: 52 }} />}
      />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.selectorCard}>
          <BodySelector selected={muscle} onSelect={setMuscle} width={112} />
        </View>

        <Text style={styles.sectionLabel}>
          ALVO PRINCIPAL · {ranking.primary.length} {ranking.primary.length === 1 ? 'EXERCÍCIO' : 'EXERCÍCIOS'}
        </Text>
        {ranking.primary.length ? (
          <View style={styles.list}>
            {ranking.primary.map((r, i) => renderRow(r, i, roleColor('primario'), true))}
          </View>
        ) : (
          <Text style={styles.empty}>Nenhum exercício do catálogo tem {muscleLabel[muscle].toLowerCase()} como alvo principal.</Text>
        )}

        {ranking.secondary.length ? (
          <>
            <Text style={styles.sectionLabel}>TAMBÉM TRABALHA · {ranking.secondary.length}</Text>
            <View style={styles.list}>
              {ranking.secondary.map((r, i) => renderRow(r, i, roleColor('secundario'), false))}
            </View>
          </>
        ) : null}

        <Text style={styles.footnote}>
          Ordem baseada nos mapas de cinesiologia: primeiro os exercícios em que o músculo é o alvo principal, dos
          mais isolados aos compostos.
        </Text>
      </ScrollView>
      <Toast toast={toast} onHide={hideToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill50 },
  body: { flex: 1 },
  bodyContent: { paddingBottom: 32 },
  backLink: { fontSize: 15, color: colors.teal500 },
  selectorCard: { backgroundColor: colors.surface, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.96,
    color: colors.gray500,
    marginHorizontal: screenPaddingHorizontal,
    marginTop: 20,
    marginBottom: 8,
  },
  list: { backgroundColor: colors.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingRight: 14 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  rankBar: { width: 4, alignSelf: 'stretch', borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  flex1: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 15, fontWeight: '600', color: colors.ink },
  rowSubtitle: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  chevron: { color: colors.gray300, fontSize: 17 },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.teal500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonLabel: { fontSize: 18, fontWeight: '700', color: colors.surface },
  empty: { fontSize: 14, color: colors.gray500, marginHorizontal: screenPaddingHorizontal },
  footnote: { fontSize: 11, lineHeight: 15, color: colors.gray500, marginHorizontal: screenPaddingHorizontal, marginTop: 16 },
});
