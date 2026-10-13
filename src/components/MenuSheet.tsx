import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { colors, minTouchTarget } from '../theme/tokens';

export interface MenuItem {
  label: string;
  hint?: string;
  onPress: () => void;
}

interface MenuSheetProps {
  visible: boolean;
  items: MenuItem[];
  onClose: () => void;
}

// Menu de atalhos (botão ☰ do Painel). Fecha antes de executar a ação.
export function MenuSheet({ visible, items, onClose }: MenuSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Menu</Text>
      <View style={styles.list}>
        {items.map((item, i) => (
          <Pressable
            key={item.label}
            style={[styles.row, i > 0 && styles.rowDivider]}
            onPress={() => {
              onClose();
              item.onPress();
            }}
            accessibilityRole="button"
          >
            <View style={styles.flex1}>
              <Text style={styles.label}>{item.label}</Text>
              {item.hint ? <Text style={styles.hint}>{item.hint}</Text> : null}
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, fontWeight: '600', color: colors.ink, marginBottom: 6 },
  list: {},
  flex1: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: minTouchTarget + 8, paddingVertical: 8 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  label: { fontSize: 16, fontWeight: '600', color: colors.ink },
  hint: { fontSize: 12, color: colors.gray500, marginTop: 1 },
  chevron: { fontSize: 18, color: colors.gray300 },
});
