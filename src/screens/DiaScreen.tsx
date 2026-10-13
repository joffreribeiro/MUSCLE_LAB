import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavBar } from '../components/NavBar';
import { ProgressRing } from '../components/ProgressRing';
import { ExerciseMedia } from '../components/ExerciseMedia';
import { Icon } from '../components/icons/Icon';
import { PrimaryButton } from '../components/PrimaryButton';
import { EditPrescriptionSheet } from '../components/EditPrescriptionSheet';
import { Toast, useToast } from '../components/Toast';
import { colors, minTouchTarget, radii, screenPaddingHorizontal } from '../theme/tokens';
import { findMetodo } from '../data/metodos';
import { groupAt, groupLabel } from '../data/superset';
import { useWorkout } from '../context/WorkoutContext';
import { formatKg, suggestNext } from '../data/progression';
import { DayExercise } from '../types';

function prescricao(e: DayExercise): string {
  if (e.type === 'cardio') return `${e.minutes}min, ${e.bpmRange}`;
  if (e.weight === 0) return `${e.sets}x${e.reps} · peso corporal`;
  return `${e.sets}x${e.reps}x${e.weight != null ? formatKg(e.weight) : '—'} kg`;
}

export function DiaScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    activeWorkout,
    dayExercises,
    sessions,
    dayPercent,
    totalDone,
    totalPrescribed,
    doneCount,
    startWorkout,
    goToExercise,
    renameWorkout,
    deleteWorkout,
    removeDayExerciseAt,
    insertDayExerciseAt,
    moveDayExercise,
    toggleLinkWithNext,
    updatePrescription,
  } = useWorkout();
  const { toast, show: showToast, hide: hideToast } = useToast();

  const [editing, setEditing] = useState<boolean>(!!route.params?.editing);
  const [name, setName] = useState(activeWorkout?.name ?? '');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setName(activeWorkout?.name ?? '');
  }, [activeWorkout?.id]);

  // Abrir pelo "Novo treino" já entra em edição; o parâmetro é consumido uma vez.
  useEffect(() => {
    if (route.params?.editing) {
      setEditing(true);
      navigation.setParams({ editing: undefined });
    }
  }, [route.params?.editing]);

  if (!activeWorkout) {
    return (
      <View style={styles.screen}>
        <NavBar
          left={
            <Pressable onPress={() => navigation.navigate('Painel')}>
              <Text style={styles.backLink}>← Voltar</Text>
            </Pressable>
          }
          title="Treino"
          right={<View style={{ width: 52 }} />}
        />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nenhum treino selecionado.</Text>
        </View>
      </View>
    );
  }

  const commitName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== activeWorkout.name) renameWorkout(activeWorkout.id, trimmed);
    else setName(activeWorkout.name);
  };

  const finishEditing = () => {
    commitName();
    setEditing(false);
    setConfirmDelete(false);
  };

  const handleRemove = (index: number) => {
    const removed = dayExercises[index];
    removeDayExerciseAt(index);
    showToast(
      {
        message: `${removed.name} removido`,
        actionLabel: 'Desfazer',
        onAction: () => insertDayExerciseAt(index, removed),
      },
      4000,
    );
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteWorkout(activeWorkout.id);
    navigation.navigate('Painel');
  };

  const isEmpty = dayExercises.length === 0;
  const editingExercise = editingIndex !== null ? dayExercises[editingIndex] ?? null : null;

  return (
    <View style={styles.screen}>
      <NavBar
        left={
          <Pressable onPress={() => navigation.navigate('Painel')}>
            <Text style={styles.backLink}>← Voltar</Text>
          </Pressable>
        }
        title={editing ? 'Editar treino' : 'Treino'}
        right={
          <Pressable onPress={editing ? finishEditing : () => setEditing(true)} hitSlop={8}>
            <Text style={styles.headerAction}>{editing ? 'Concluir' : 'Editar'}</Text>
          </Pressable>
        }
      />
      <ScrollView style={styles.body}>
        <View style={styles.header}>
          {editing ? (
            <View style={styles.flex1}>
              <Text style={styles.fieldLabel}>NOME DO TREINO</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                onBlur={commitName}
                onSubmitEditing={commitName}
                placeholder="Ex.: Treino A · peito e tríceps"
                style={styles.nameInput}
                returnKeyType="done"
              />
              <Text style={styles.headerMeta}>
                {dayExercises.length} {dayExercises.length === 1 ? 'exercício' : 'exercícios'} · toque em um para
                ajustar séries, repetições e carga
              </Text>
            </View>
          ) : (
            <>
              <ProgressRing
                size={52}
                radius={21}
                strokeWidth={5}
                pct={dayPercent / 100}
                color={colors.teal500}
                label={`${dayPercent}%`}
                labelFontSize={12}
              />
              <View style={styles.flex1}>
                <Text style={styles.headerTitle}>{activeWorkout.name}</Text>
                <Text style={styles.headerMeta}>
                  {totalDone} de {totalPrescribed} séries registradas
                </Text>
              </View>
            </>
          )}
        </View>

        {isEmpty ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Este treino ainda não tem exercícios</Text>
            <Text style={styles.emptyText}>Adicione pela biblioteca ou escolhendo um músculo no corpo.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {dayExercises.map((e, i) => {
              const done = Math.min(doneCount(e.exerciseId), e.sets);
              const pct = Math.round((100 * done) / e.sets);
              // Só mostra quando a sugestão muda a carga; "manter" não precisa de destaque.
              const suggestion = e.type === 'cardio' ? null : suggestNext(e.exerciseId, e.reps, sessions);
              const change =
                suggestion && suggestion.weight !== undefined && suggestion.kind !== 'manter' && suggestion.weight !== e.weight
                  ? suggestion
                  : null;
              return (
                <Pressable
                  key={e.exerciseId}
                  style={[styles.row, i > 0 && styles.rowDivider]}
                  onPress={() => {
                    if (editing) {
                      setEditingIndex(i);
                      return;
                    }
                    goToExercise(i);
                    navigation.navigate('Exec');
                  }}
                >
                  <View style={styles.thumb}>
                    <ExerciseMedia exerciseId={e.exerciseId} placeholderWidth={20} placeholderHeight={28} />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.rowName}>{e.name}</Text>
                    <Text style={[styles.rowPrescr, editing && styles.rowPrescrEditable]}>
                      {prescricao(e)}
                      {e.method && findMetodo(e.method) ? ` · ${findMetodo(e.method)!.nome}` : ''}
                      {editing ? '  ✎' : ''}
                    </Text>
                    {(() => {
                      const g = groupAt(dayExercises, i);
                      if (!g) return null;
                      const partners = g.indices.filter((j) => j !== i).map((j) => dayExercises[j].name);
                      return (
                        <Text style={styles.supersetTag} numberOfLines={1}>
                          {groupLabel(g.indices.length)} com {partners.join(' e ')}
                        </Text>
                      );
                    })()}
                    {!editing && change ? (
                      <Text style={[styles.rowSuggest, change.kind === 'reduzir' && { color: colors.red500 }]}>
                        {change.kind === 'aumentar' ? '↑' : '↓'} sugestão: {formatKg(change.weight!)} kg
                      </Text>
                    ) : null}
                  </View>
                  {editing ? (
                    <View style={styles.editActions}>
                      <IconButton label="↑" disabled={i === 0} onPress={() => moveDayExercise(i, -1)} a11y="Mover para cima" />
                      <IconButton
                        label="↓"
                        disabled={i === dayExercises.length - 1}
                        onPress={() => moveDayExercise(i, 1)}
                        a11y="Mover para baixo"
                      />
                      <IconButton
                        icon="link"
                        disabled={i === dayExercises.length - 1 || e.type === 'cardio' || dayExercises[i + 1].type === 'cardio'}
                        active={!!e.supersetId && e.supersetId === dayExercises[i + 1]?.supersetId}
                        onPress={() => toggleLinkWithNext(i)}
                        a11y={e.supersetId && e.supersetId === dayExercises[i + 1]?.supersetId ? 'Separar do próximo exercício' : 'Ligar ao próximo exercício (bi-set)'}
                      />
                      <IconButton icon="close" danger onPress={() => handleRemove(i)} a11y="Remover do treino" />
                    </View>
                  ) : (
                    <>
                      <Text style={styles.rowPct}>{pct}%</Text>
                      <Text style={styles.chevron}>›</Text>
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.footer}>
          {editing || isEmpty ? (
            <Pressable style={styles.addButton} onPress={() => navigation.navigate('Exercicios')}>
              <Text style={styles.addButtonLabel}>+ Adicionar exercício</Text>
            </Pressable>
          ) : null}

          {!editing && !isEmpty ? (
            <PrimaryButton
              label="Iniciar exercício"
              onPress={() => {
                startWorkout();
                navigation.navigate('Exec');
              }}
            />
          ) : null}

          {editing ? (
            <Pressable style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonLabel}>
                {confirmDelete ? 'Toque de novo para excluir o treino' : 'Excluir treino'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <EditPrescriptionSheet
        visible={editingIndex !== null}
        exercise={editingExercise}
        onClose={() => setEditingIndex(null)}
        onSave={(patch) => {
          if (editingIndex !== null) updatePrescription(editingIndex, patch);
        }}
      />
      <Toast toast={toast} onHide={hideToast} />
    </View>
  );
}

function IconButton({
  label,
  icon,
  onPress,
  disabled,
  danger,
  active,
  a11y,
}: {
  label?: string;
  active?: boolean;
  icon?: 'close' | 'link';
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
  a11y: string;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[styles.iconButton, disabled && styles.iconButtonDisabled, active && styles.iconButtonActive]}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled }}
      hitSlop={4}
    >
      {icon ? (
        <Icon name={icon} color={danger ? colors.red500 : active ? colors.surface : colors.navy700} size={14} strokeWidth={2.2} />
      ) : (
        <Text style={[styles.iconButtonLabel, danger && { color: colors.red500 }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill50 },
  iconButtonActive: { backgroundColor: colors.teal500, borderColor: colors.teal500 },
  supersetTag: { fontSize: 11, fontWeight: '700', color: colors.teal600, marginTop: 2 },
  body: { flex: 1 },
  flex1: { flex: 1, minWidth: 0 },
  backLink: { fontSize: 15, color: colors.teal500 },
  headerAction: { fontSize: 15, fontWeight: '600', color: colors.teal500 },
  header: {
    backgroundColor: colors.surface,
    padding: 14,
    paddingHorizontal: screenPaddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.ink },
  headerMeta: { fontSize: 12, color: colors.gray500, marginTop: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, color: colors.gray500, marginBottom: 6 },
  nameInput: {
    height: 44,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.fill25,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  list: { backgroundColor: colors.surface, marginTop: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingLeft: screenPaddingHorizontal,
    paddingRight: 14,
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
  rowName: { fontSize: 15, fontWeight: '600', lineHeight: 19, color: colors.ink },
  rowPrescr: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  rowPrescrEditable: { color: colors.teal500, fontWeight: '600' },
  rowSuggest: { fontSize: 12, fontWeight: '700', color: colors.teal500, marginTop: 2 },
  rowPct: { fontSize: 13, fontWeight: '600', color: colors.teal500 },
  chevron: { color: colors.gray300, fontSize: 17 },
  editActions: { flexDirection: 'row', gap: 6 },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.fill100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDisabled: { opacity: 0.35 },
  iconButtonLabel: { fontSize: 14, fontWeight: '700', color: colors.navy700 },
  empty: { alignItems: 'center', padding: 32, gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.ink, textAlign: 'center' },
  emptyText: { fontSize: 13, color: colors.gray500, textAlign: 'center' },
  footer: { padding: screenPaddingHorizontal, gap: 10 },
  addButton: {
    minHeight: minTouchTarget,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.teal500,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  addButtonLabel: { fontSize: 15, fontWeight: '700', color: colors.teal500 },
  deleteButton: { alignItems: 'center', paddingVertical: 12 },
  deleteButtonLabel: { fontSize: 14, fontWeight: '600', color: colors.red500 },
});
