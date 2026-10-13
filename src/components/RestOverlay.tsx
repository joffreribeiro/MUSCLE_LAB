import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, minTouchTarget, radii } from '../theme/tokens';
import { formatMinSec } from '../utils/format';

interface RestOverlayProps {
  visible: boolean;
  secondsLeft: number;
  nextExerciseName: string | null;
  onExtend: () => void;
  onSkip: () => void;
}

// ROADMAP item 6 — descanso em tela cheia (opcional), aberto ao registrar uma série.
export function RestOverlay({ visible, secondsLeft, nextExerciseName, onExtend, onSkip }: RestOverlayProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
      <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.label}>Descanso</Text>
        <Text style={styles.counter}>{formatMinSec(secondsLeft)}</Text>
        {nextExerciseName ? (
          <Text style={styles.next}>Próximo: {nextExerciseName}</Text>
        ) : null}
        <View style={styles.footer}>
          <Pressable style={styles.secondaryButton} onPress={onExtend}>
            <Text style={styles.secondaryButtonLabel}>+30s</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={onSkip}>
            <Text style={styles.primaryButtonLabel}>Pular descanso</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.navy700,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  label: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.6 },
  counter: { fontSize: 72, fontWeight: '700', color: colors.surface, marginTop: 12 },
  next: { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 16 },
  footer: { flexDirection: 'row', gap: 12, marginTop: 'auto', width: '100%' },
  secondaryButton: {
    flex: 1,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchTarget,
  },
  secondaryButtonLabel: { fontSize: 15, fontWeight: '700', color: colors.surface },
  primaryButton: {
    flex: 2,
    borderRadius: radii.card,
    backgroundColor: colors.teal500,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchTarget,
  },
  primaryButtonLabel: { fontSize: 15, fontWeight: '700', color: colors.surface, textTransform: 'uppercase', letterSpacing: 0.6 },
});
