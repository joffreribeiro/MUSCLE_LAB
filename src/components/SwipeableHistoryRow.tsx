import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { colors } from '../theme/tokens';
import { SeedHistoryRow } from '../types';

interface SwipeableHistoryRowProps {
  row: SeedHistoryRow;
  onEdit: (logIndex: number) => void;
  onDelete: (logIndex: number) => void;
}

// ROADMAP item 3 — swipe para a esquerda revela Editar/Excluir nas linhas de "Hoje".
export function SwipeableHistoryRow({ row, onEdit, onDelete }: SwipeableHistoryRowProps) {
  const logIndex = row.logIndex;
  if (logIndex === undefined) {
    return <HistoryRowContent row={row} />;
  }

  return (
    <Swipeable
      renderRightActions={(_progress, _dragX, swipeable) => (
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.navy700 }]}
            onPress={() => {
              swipeable.close();
              onEdit(logIndex);
            }}
          >
            <Text style={styles.actionLabel}>Editar</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.red500 }]}
            onPress={() => {
              swipeable.close();
              onDelete(logIndex);
            }}
          >
            <Text style={styles.actionLabel}>Excluir</Text>
          </Pressable>
        </View>
      )}
    >
      <HistoryRowContent row={row} />
    </Swipeable>
  );
}

function HistoryRowContent({ row }: { row: SeedHistoryRow }) {
  return (
    <View style={styles.row}>
      <Text style={styles.n}>{row.n}</Text>
      <Text style={styles.label}>{row.label}</Text>
      <Text style={styles.time}>{row.time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  n: { fontSize: 13, fontWeight: '600', color: colors.navy700, width: 30 },
  label: { flex: 1, fontSize: 14, color: colors.ink },
  time: { fontSize: 12, color: colors.gray500 },
  actions: { flexDirection: 'row' },
  actionButton: { width: 72, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 13, fontWeight: '600', color: colors.surface },
});
