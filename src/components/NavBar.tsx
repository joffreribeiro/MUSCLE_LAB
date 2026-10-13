import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, screenPaddingHorizontal } from '../theme/tokens';

interface NavBarProps {
  title?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode;
}

// Réplica da navbar branca com borda inferior usada nas telas Dia/Exec/Manual/Grupo/Ficha.
// padding-top usa a safe area real do device em vez do valor fixo 56px do protótipo web.
export function NavBar({ title, left, right, children }: NavBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.row}>
        <View style={styles.side}>{left}</View>
        {title ? (
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        ) : (
          <View style={styles.flex} />
        )}
        <View style={[styles.side, styles.sideRight]}>{right}</View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexShrink: 0,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: screenPaddingHorizontal,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    minWidth: 52,
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  flex: {
    flex: 1,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: colors.navy800,
  },
});
