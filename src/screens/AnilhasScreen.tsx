import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavBar } from '../components/NavBar';
import { PlateCalculator } from '../components/PlateCalculator';
import { colors, radii, screenPaddingHorizontal } from '../theme/tokens';

export function AnilhasScreen() {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.screen}>
      <NavBar
        left={
          <Pressable onPress={() => (navigation.getState().index > 0 ? navigation.goBack() : navigation.navigate('Manual'))} hitSlop={8}>
            <Text style={styles.backLink}>← Manual</Text>
          </Pressable>
        }
        title="Calculadora de anilhas"
      />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <PlateCalculator />
        </View>
        <Text style={styles.note}>
          Considera anilhas de 25, 20, 15, 10, 5, 2,5 e 1,25 kg, iguais nos dois lados da barra. A barra escolhida fica salva para a próxima vez.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill50 },
  backLink: { fontSize: 15, color: colors.teal500 },
  body: { flex: 1 },
  bodyContent: { padding: screenPaddingHorizontal, paddingBottom: 32 },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: 14 },
  note: { fontSize: 12, lineHeight: 17, color: colors.gray500, marginTop: 12 },
});
