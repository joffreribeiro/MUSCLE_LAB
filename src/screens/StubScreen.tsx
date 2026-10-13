import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/tokens';

// Tela genérica para áreas ainda não disponíveis (Dieta, Nutrição esportiva, Artigos).
export function StubScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const title: string = route.params?.title ?? 'Em breve';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>Esta área ainda não está disponível. Em breve.</Text>
      <Pressable
        style={styles.link}
        onPress={() => navigation.navigate('TreinosTab', { screen: 'Painel' })}
      >
        <Text style={styles.linkText}>Voltar aos treinos</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 40,
    backgroundColor: colors.fill50,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.navy700,
  },
  body: {
    fontSize: 14,
    color: colors.gray500,
    textAlign: 'center',
  },
  link: {
    marginTop: 12,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.teal500,
  },
});
