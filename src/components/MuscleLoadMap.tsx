import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BodyFigure, REGIONS_BY_VIEW, RegionFill } from './BodyMap';
import { colors } from '../theme/tokens';
import { muscleLabel } from '../data/muscles';
import { bandIndex, LOAD_BANDS, loadPercent, MuscleLoadResult } from '../data/muscleLoad';
import { BodyView, MuscleKey } from '../types';

// Do mais claro ao mais forte: quanto mais escuro, mais trabalhado em relação ao melhor músculo.
const BAND_COLORS = [colors.teal100, colors.teal300, colors.teal500, colors.navy700];
const FILL_OPACITY = 0.78;

const fmt = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

/** Frente e costas pintadas pela carga de cada músculo; tocar numa região mostra os números dela. */
export function MuscleLoadMap({ data, width = 130, emptyText }: { data: MuscleLoadResult; width?: number; emptyText: string }) {
  const [selected, setSelected] = useState<MuscleKey | null>(null);

  const fillsByView = useMemo(() => {
    const out = {} as Record<BodyView, Partial<Record<MuscleKey, RegionFill>>>;
    for (const view of ['frente', 'costas'] as BodyView[]) {
      const fills: Partial<Record<MuscleKey, RegionFill>> = {};
      for (const key of REGIONS_BY_VIEW[view]) {
        const band = bandIndex(loadPercent(data.load[key] ?? 0, data.max));
        if (band >= 0) fills[key] = { color: BAND_COLORS[band], opacity: FILL_OPACITY };
      }
      out[view] = fills;
    }
    return out;
  }, [data]);

  const hasData = data.max > 0;
  const sel = selected && hasData ? { value: data.load[selected] ?? 0, pct: loadPercent(data.load[selected] ?? 0, data.max) } : null;

  return (
    <View>
      <View style={styles.pair}>
        {(['frente', 'costas'] as BodyView[]).map((view) => (
          <View key={view} style={styles.column}>
            <BodyFigure view={view} width={width} fills={fillsByView[view]} onPressRegion={setSelected} />
            <Text style={styles.viewLabel}>{view === 'frente' ? 'FRENTE' : 'COSTAS'}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.caption, selected && hasData && styles.captionSelected]}>
        {!hasData
          ? emptyText
          : sel && selected
            ? `${muscleLabel[selected]}: ${fmt(sel.value)} ${sel.value === 1 ? 'série efetiva' : 'séries efetivas'} (${sel.pct}%)`
            : 'Toque em um músculo para ver os números.'}
      </Text>

      <View style={styles.legend}>
        {LOAD_BANDS.map((b, i) => (
          <View key={b.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: BAND_COLORS[i] }]} />
            <Text style={styles.legendText}>{b.label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.note}>Cada série conta 1 para o músculo principal do exercício e 0,5 para os auxiliares. Percentual em relação ao músculo mais trabalhado.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  column: { alignItems: 'center' },
  viewLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: colors.gray500, marginTop: 6 },
  caption: { fontSize: 13, lineHeight: 18, color: colors.gray500, textAlign: 'center', marginTop: 10, paddingHorizontal: 8 },
  captionSelected: { fontSize: 14, fontWeight: '700', color: colors.teal600 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: colors.gray500 },
  note: { fontSize: 11, lineHeight: 15, color: colors.gray400, textAlign: 'center', marginTop: 8 },
});
