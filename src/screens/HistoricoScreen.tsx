import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavBar } from '../components/NavBar';
import { SessionNoteEditor } from '../components/SessionNoteEditor';
import { colors, minTouchTarget, radii, screenPaddingHorizontal } from '../theme/tokens';
import { useWorkout } from '../context/WorkoutContext';
import { findExerciseById } from '../data/catalog';
import { groupSetsByExercise, sessionVolume } from '../data/stats';
import { formatDuration, formatHHmm, formatNumberPtBR, formatSessionDate } from '../utils/format';
import { Session } from '../types';

// Histórico de treinos concluídos (botão ⏱ do Painel).
export function HistoricoScreen() {
  const navigation = useNavigation<any>();
  const { sessions, deleteSession, setSessionNote } = useWorkout();
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const totalVolume = sessions.reduce((a, s) => a + sessionVolume(s), 0);
  const totalSeconds = sessions.reduce((a, s) => a + s.durationSec, 0);

  const toggle = (id: string) => {
    setOpenId((cur) => (cur === id ? null : id));
    setConfirmId(null);
  };

  const handleDelete = (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    deleteSession(id);
    setConfirmId(null);
    setOpenId(null);
  };

  return (
    <View style={styles.screen}>
      <NavBar
        left={
          <Pressable onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Painel'))}>
            <Text style={styles.backLink}>← Voltar</Text>
          </Pressable>
        }
        title="Histórico"
        right={<View style={{ width: 52 }} />}
      />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {sessions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhum treino concluído ainda</Text>
            <Text style={styles.emptyText}>
              Quando você concluir um treino, ele aparece aqui com as séries, a carga e o RIR de cada exercício.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.summary}>
              <Summary value={String(sessions.length)} label={sessions.length === 1 ? 'treino' : 'treinos'} />
              <Summary value={formatNumberPtBR(totalVolume)} label="kg levantados" />
              <Summary value={formatDuration(totalSeconds)} label="de treino" />
            </View>

            {sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                open={openId === s.id}
                confirmDelete={confirmId === s.id}
                onToggle={() => toggle(s.id)}
                onDelete={() => handleDelete(s.id)}
                onSaveNote={(n) => setSessionNote(s.id, n)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Summary({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function SessionCard({
  session,
  open,
  confirmDelete,
  onToggle,
  onDelete,
  onSaveNote,
}: {
  session: Session;
  open: boolean;
  confirmDelete: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onSaveNote: (note: string | undefined) => void;
}) {
  const finished = new Date(session.finishedAtISO);
  const groups = groupSetsByExercise(session.sets);
  const volume = sessionVolume(session);

  return (
    <View style={styles.card}>
      <Pressable style={styles.cardHeader} onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <View style={styles.flex1}>
          <Text style={styles.date}>
            {formatSessionDate(finished)} · {formatHHmm(finished)}
          </Text>
          <Text style={styles.workoutName} numberOfLines={1}>
            {session.workoutName}
          </Text>
          <Text style={styles.meta}>
            {groups.length} {groups.length === 1 ? 'exercício' : 'exercícios'} · {session.sets.length}{' '}
            {session.sets.length === 1 ? 'série' : 'séries'}
            {volume > 0 ? ` · ${formatNumberPtBR(volume)} kg` : ''} · {formatDuration(session.durationSec)}
          </Text>
          {session.note ? (
            <Text style={styles.notePreview} numberOfLines={open ? undefined : 2}>
              {session.note}
            </Text>
          ) : null}
        </View>
        <Text style={styles.chevron}>{open ? '˄' : '˅'}</Text>
      </Pressable>

      {open ? (
        <View style={styles.cardBody}>
          {groups.map((g) => (
            <View key={g.exerciseId} style={styles.exerciseBlock}>
              <Text style={styles.exerciseName}>{findExerciseById(g.exerciseId)?.name ?? g.exerciseId}</Text>
              {g.sets.map((set, i) => (
                <View key={set.loggedAtISO + i} style={styles.setRow}>
                  <Text style={styles.setN}>Nº{i + 1}</Text>
                  <Text style={styles.setLabel}>{set.label}</Text>
                  <Text style={styles.setTime}>{set.loggedAt}</Text>
                </View>
              ))}
            </View>
          ))}
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>ANOTAÇÃO</Text>
            <SessionNoteEditor note={session.note} onSave={onSaveNote} />
          </View>
          <Pressable style={styles.deleteButton} onPress={onDelete} accessibilityRole="button">
            <Text style={styles.deleteLabel}>
              {confirmDelete ? 'Toque de novo para excluir do histórico' : 'Excluir do histórico'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill50 },
  backLink: { fontSize: 15, color: colors.teal500 },
  body: { flex: 1 },
  bodyContent: { padding: screenPaddingHorizontal, paddingBottom: 32, gap: 10 },
  flex1: { flex: 1, minWidth: 0 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  emptyText: { fontSize: 13, lineHeight: 18, color: colors.gray500, textAlign: 'center', paddingHorizontal: 16 },
  summary: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radii.card, paddingVertical: 14 },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: colors.navy700 },
  summaryLabel: { fontSize: 11, color: colors.gray500 },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  date: { fontSize: 12, color: colors.gray500 },
  workoutName: { fontSize: 16, fontWeight: '700', color: colors.ink, marginTop: 2 },
  meta: { fontSize: 12, lineHeight: 17, color: colors.gray500, marginTop: 3 },
  notePreview: { fontSize: 13, lineHeight: 18, fontStyle: 'italic', color: colors.navy700, marginTop: 6 },
  noteBox: { paddingTop: 14, paddingBottom: 4 },
  noteLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, color: colors.gray500, marginBottom: 8 },
  chevron: { fontSize: 16, color: colors.gray400 },
  cardBody: { borderTopWidth: 1, borderTopColor: colors.divider, paddingHorizontal: 14, paddingBottom: 6 },
  exerciseBlock: { paddingTop: 12 },
  exerciseName: { fontSize: 14, fontWeight: '700', color: colors.navy700, marginBottom: 4 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  setN: { width: 30, fontSize: 12, color: colors.gray500 },
  setLabel: { flex: 1, fontSize: 13, color: colors.ink },
  setTime: { fontSize: 12, color: colors.gray500 },
  deleteButton: { minHeight: minTouchTarget, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  deleteLabel: { fontSize: 13, fontWeight: '600', color: colors.red500 },
});
