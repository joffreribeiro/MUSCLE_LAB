import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, minTouchTarget, radii } from '../theme/tokens';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  style?: object;
}

export function PrimaryButton({ label, onPress, style }: PrimaryButtonProps) {
  return (
    <Pressable onPress={onPress} style={[styles.button, style]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.teal500,
    borderRadius: radii.card,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchTarget,
  },
  label: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
