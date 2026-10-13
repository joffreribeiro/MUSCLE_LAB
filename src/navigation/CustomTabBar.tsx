import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';
import { ManualIcon, MaisIcon, TreinosIcon } from '../components/icons/TabIcons';

const TAB_META: Record<
  string,
  { label: string; Icon: React.ComponentType<{ color: string; size?: number }>; rootScreen?: string }
> = {
  TreinosTab: { label: 'Treinos', Icon: TreinosIcon, rootScreen: 'Painel' },
  ManualTab: { label: 'Manual', Icon: ManualIcon, rootScreen: 'Manual' },
  MaisTab: { label: 'Mais', Icon: MaisIcon, rootScreen: 'Perfil' },
};

// Tab bar com ícones outline de 22px (traço 1.8). Sem Feed e Mensagens: não há comunidade no produto.
export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) + 8 }]}>
      {state.routes.map((route, index) => {
        const meta = TAB_META[route.name];
        if (!meta) return null;
        const focused = state.index === index;
        const color = focused ? colors.teal500 : colors.gray500;
        return (
          <Pressable
            key={route.key}
            style={styles.item}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (event.defaultPrevented) return;
              if (!focused) {
                navigation.navigate(route.name);
              } else if (meta.rootScreen) {
                // Reaperta a aba já ativa: volta para a tela raiz dela (ex: Painel, Manual).
                navigation.navigate(route.name, { screen: meta.rootScreen });
              }
            }}
          >
            <meta.Icon color={color} size={22} />
            <Text style={[styles.label, { color }]}>{meta.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 10, fontWeight: '600' },
});
