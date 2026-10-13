import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavBar } from '../components/NavBar';
import { colors, minTouchTarget, radii, screenPaddingHorizontal } from '../theme/tokens';
import { useWorkout } from '../context/WorkoutContext';
import { defaultWidgetPrefs, moveWidget, resolveWidgets, setWidgetVisible, widgetInfo } from '../data/painelWidgets';
import { PainelWidgetId } from '../types';

export function EditarPainelScreen() {
  const navigation = useNavigation<any>();
  const { settings, updateSettings } = useWorkout();
  const prefs = useMemo(() => resolveWidgets(settings.painelWidgets, settings.mostrarAnalytics), [settings.painelWidgets, settings.mostrarAnalytics]);

  const save = (next: typeof prefs) => updateSettings({ painelWidgets: next });
  const isDefault = JSON.stringify(prefs) === JSON.stringify(defaultWidgetPrefs());

  return (
    <View style={styles.screen}>
      <NavBar
        left={
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={styles.backLink}>← Painel</Text>
          </Pressable>
        }
        title="Editar Painel"
      />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.intro}>
          Escolha o que aparece no Painel e a ordem. O cartão do programa, o treino de hoje e a lista de treinos ficam sempre no topo.
        </Text>

        <View style={styles.card}>
          {prefs.map((p, i) => {
            const info = widgetInfo(p.id);
            return (
              <View key={p.id} style={[styles.row, i > 0 && styles.rowDivider]}>
                <View style={styles.arrows}>
                  <Arrow label={`Subir ${info.label}`} glyph="˄" disabled={i === 0} onPress={() => save(moveWidget(prefs, p.id as PainelWidgetId, -1))} />
                  <Arrow label={`Descer ${info.label}`} glyph="˅" disabled={i === prefs.length - 1} onPress={() => save(moveWidget(prefs, p.id as PainelWidgetId, 1))} />
                </View>
                <View style={styles.flex1}>
                  <Text style={[styles.label, !p.visible && styles.labelOff]}>{info.label}</Text>
                  <Text style={styles.hint}>{info.hint}</Text>
                </View>
                <Switch
                  value={p.visible}
                  onValueChange={(v) => save(setWidgetVisible(prefs, p.id, v))}
                  trackColor={{ true: colors.teal500, false: colors.fill100 }}
                  accessibilityLabel={`Mostrar ${info.label}`}
                />
              </View>
            );
          })}
        </View>

        <Pressable
          style={[styles.resetButton, isDefault && styles.resetOff]}
          disabled={isDefault}
          onPress={() => save(defaultWidgetPrefs())}
          accessibilityRole="button"
        >
          <Text style={[styles.resetLabel, isDefault && styles.resetLabelOff]}>Restaurar padrão</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Arrow({ glyph, label, disabled, onPress }: { glyph: string; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={[styles.arrow, disabled && styles.arrowOff]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.arrowGlyph, disabled && styles.arrowGlyphOff]}>{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill50 },
  backLink: { fontSize: 15, color: colors.teal500 },
  body: { flex: 1 },
  bodyContent: { padding: screenPaddingHorizontal, paddingBottom: 32 },
  flex1: { flex: 1, minWidth: 0 },
  intro: { fontSize: 13, lineHeight: 18, color: colors.gray500, marginBottom: 12 },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 64, paddingVertical: 8 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  arrows: { gap: 4 },
  arrow: { width: 30, height: 26, borderRadius: 6, backgroundColor: colors.fill100, alignItems: 'center', justifyContent: 'center' },
  arrowOff: { opacity: 0.35 },
  arrowGlyph: { fontSize: 14, fontWeight: '700', color: colors.navy700 },
  arrowGlyphOff: { color: colors.gray400 },
  label: { fontSize: 15, fontWeight: '600', color: colors.ink },
  labelOff: { color: colors.gray400 },
  hint: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  resetButton: {
    marginTop: 18,
    minHeight: minTouchTarget,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.teal500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetOff: { borderColor: colors.fill100 },
  resetLabel: { fontSize: 14, fontWeight: '700', color: colors.teal500 },
  resetLabelOff: { color: colors.gray400 },
});
