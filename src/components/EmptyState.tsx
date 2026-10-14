import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from './icons/Icon';
import { colors } from '../theme/tokens';

/** Aviso centralizado para listas ainda vazias (ex.: histórico de um exercício). */
export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.wrap}>
      <Icon name="clipboard" color={colors.gray300} size={56} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 8 },
  title: { fontSize: 16, fontWeight: '600', color: colors.ink, textAlign: 'center', marginTop: 8 },
  text: { fontSize: 14, lineHeight: 20, color: colors.gray500, textAlign: 'center' },
});
