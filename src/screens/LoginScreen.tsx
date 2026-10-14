import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthForm } from '../components/AuthForm';
import { colors, radii, screenPaddingHorizontal } from '../theme/tokens';

/** Primeira tela quando a conta na nuvem está configurada: é preciso entrar para usar o app. */
export function LoginScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Muscle Lab</Text>
        <Text style={styles.tagline}>Ciência do treino</Text>

        <View style={styles.card}>
          <Text style={styles.title}>Entrar</Text>
          <Text style={styles.text}>Entre com sua conta para abrir seus treinos e histórico, em qualquer aparelho.</Text>
          <AuthForm />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill50 },
  content: { paddingHorizontal: screenPaddingHorizontal, gap: 6 },
  brand: { fontSize: 30, fontWeight: '700', color: colors.navy700, textAlign: 'center' },
  tagline: { fontSize: 14, color: colors.gray500, textAlign: 'center', marginBottom: 26 },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: 16, gap: 10 },
  title: { fontSize: 18, fontWeight: '700', color: colors.ink },
  text: { fontSize: 14, lineHeight: 20, color: colors.gray500 },
});
