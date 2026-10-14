import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, screenPaddingHorizontal } from '../theme/tokens';
import { useUpdate } from '../context/UpdateContext';

/** Aviso no topo quando há um APK mais novo publicado: baixa a atualização ou dispensa até a próxima abertura. */
export function UpdateBanner() {
  const { updateAvailable, latestVersion, apkUrl, dismiss } = useUpdate();
  const insets = useSafeAreaInsets();
  if (!updateAvailable || !apkUrl) return null;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.card}>
        <View style={styles.texts}>
          <Text style={styles.title}>Nova versão disponível{latestVersion ? ` (${latestVersion})` : ''}</Text>
          <Text style={styles.sub}>Baixe e instale o APK para atualizar. Seus dados ficam guardados.</Text>
        </View>
        <Pressable style={styles.action} onPress={() => void Linking.openURL(apkUrl).catch(() => {})} accessibilityRole="button">
          <Text style={styles.actionLabel}>Atualizar</Text>
        </Pressable>
        <Pressable onPress={dismiss} hitSlop={10} accessibilityRole="button" accessibilityLabel="Dispensar o aviso de atualização">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.fill50, paddingHorizontal: screenPaddingHorizontal, paddingBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.teal500, borderRadius: radii.card, paddingVertical: 10, paddingHorizontal: 12 },
  texts: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  sub: { fontSize: 12, lineHeight: 16, color: '#E6F7F7' },
  action: { backgroundColor: '#FFFFFF', borderRadius: radii.card, paddingVertical: 8, paddingHorizontal: 12 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: colors.teal500 },
  close: { fontSize: 16, color: '#FFFFFF', paddingHorizontal: 2 },
});
