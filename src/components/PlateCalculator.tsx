import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, minTouchTarget, radii } from '../theme/tokens';
import { useWorkout } from '../context/WorkoutContext';
import { BARS, calcPlates, DEFAULT_BAR_KG, formatPlate, PLATE_COLOR, plateHeight } from '../data/plates';
import { formatKg } from '../data/progression';

const MAX_DRAWN_HEIGHT = 70;

/** Calculadora de anilhas: digite a carga total e veja o que colocar em cada lado da barra. */
export function PlateCalculator({ initialKg }: { initialKg?: number }) {
  const { settings, updateSettings } = useWorkout();
  const barKg = settings.barraKg ?? DEFAULT_BAR_KG;
  const [text, setText] = useState(initialKg && initialKg > 0 ? String(initialKg) : '');

  const target = Number(text.replace(',', '.'));
  const hasTarget = text.trim() !== '' && Number.isFinite(target) && target > 0;
  const result = hasTarget ? calcPlates(target, barKg) : null;

  return (
    <View style={styles.box}>
      <Text style={styles.label}>CARGA TOTAL (KG)</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Ex.: 82,5"
        placeholderTextColor={colors.gray400}
        keyboardType="decimal-pad"
        style={styles.input}
        accessibilityLabel="Carga total em quilos"
      />

      <Text style={styles.label}>BARRA</Text>
      <View style={styles.bars}>
        {BARS.map((b) => (
          <Pressable
            key={b.kg}
            onPress={() => updateSettings({ barraKg: b.kg })}
            style={[styles.barChip, barKg === b.kg && styles.barChipOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: barKg === b.kg }}
          >
            <Text style={[styles.barChipLabel, barKg === b.kg && styles.barChipLabelOn]}>{b.label}</Text>
          </Pressable>
        ))}
      </View>

      {result ? (
        result.belowBar ? (
          <Text style={styles.warn}>A carga é menor que a barra ({formatKg(barKg)} kg). Use uma barra mais leve ou halteres.</Text>
        ) : (
          <View style={styles.result}>
            <BarDrawing perSide={result.perSide} />
            {result.perSide.length === 0 ? (
              <Text style={styles.empty}>Só a barra ({formatKg(barKg)} kg), sem anilhas.</Text>
            ) : (
              <>
                <Text style={styles.perSide}>POR LADO</Text>
                {result.perSide.map((p) => (
                  <View key={p.plate} style={styles.row}>
                    <View style={[styles.dot, { backgroundColor: PLATE_COLOR[p.plate] ?? colors.gray400 }]} />
                    <Text style={styles.rowText}>
                      {p.count} × {formatPlate(p.plate)}
                    </Text>
                  </View>
                ))}
              </>
            )}
            <Text style={styles.total}>Total montado: {formatKg(result.achieved)} kg</Text>
            {result.missing > 0 ? (
              <Text style={styles.warn}>
                Com anilhas de 1,25 kg não dá exatamente {formatKg(target)} kg. A carga mais próxima abaixo é {formatKg(result.achieved)} kg.
              </Text>
            ) : null}
          </View>
        )
      ) : (
        <Text style={styles.empty}>Digite a carga para ver as anilhas.</Text>
      )}
    </View>
  );
}

/** Desenho da barra vista de lado, com as anilhas de um lado (do centro para fora). */
function BarDrawing({ perSide }: { perSide: { plate: number; count: number }[] }) {
  const plates = perSide.flatMap((p) => Array.from({ length: p.count }, () => p.plate));
  return (
    <View style={styles.drawing}>
      <View style={styles.collar} />
      <View style={styles.stack}>
        {plates.map((plate, i) => (
          <View
            key={i}
            style={[
              styles.plate,
              { height: MAX_DRAWN_HEIGHT * plateHeight(plate), backgroundColor: PLATE_COLOR[plate] ?? colors.gray400 },
              plate === 5 && styles.plateLight,
            ]}
          />
        ))}
        <View style={styles.sleeve} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 10 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, color: colors.gray500, marginTop: 4 },
  input: { minHeight: minTouchTarget, borderRadius: radii.card, backgroundColor: colors.fill50, paddingHorizontal: 12, fontSize: 18, fontWeight: '700', color: colors.ink },
  bars: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  barChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: radii.chip, backgroundColor: colors.fill100 },
  barChipOn: { backgroundColor: colors.navy700 },
  barChipLabel: { fontSize: 13, fontWeight: '600', color: colors.gray500 },
  barChipLabelOn: { color: colors.surface },
  result: { gap: 6, marginTop: 6 },
  drawing: { flexDirection: 'row', alignItems: 'center', height: MAX_DRAWN_HEIGHT + 16, marginBottom: 4 },
  collar: { width: 10, height: 26, borderRadius: 3, backgroundColor: colors.gray300 },
  stack: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  plate: { width: 12, borderRadius: 3 },
  plateLight: { borderWidth: 1, borderColor: colors.gray300 },
  sleeve: { flex: 1, height: 8, backgroundColor: colors.gray300, borderRadius: 4, marginLeft: 2 },
  perSide: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, color: colors.gray500, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
  rowText: { fontSize: 16, fontWeight: '600', color: colors.ink },
  total: { fontSize: 14, fontWeight: '700', color: colors.teal600, marginTop: 6 },
  empty: { fontSize: 13, color: colors.gray500, marginTop: 6 },
  warn: { fontSize: 13, lineHeight: 18, color: colors.red500, marginTop: 6 },
});
