import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii } from '../theme/tokens';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { backgroundColor: active ? colors.navy700 : colors.fill100 }]}
    >
      <Text style={[styles.label, { color: active ? colors.surface : colors.gray500 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexShrink: 0,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: radii.chip,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
