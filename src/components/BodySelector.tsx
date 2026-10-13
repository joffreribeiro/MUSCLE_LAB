import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BodyFigure, REGIONS_BY_VIEW, RegionFill } from './BodyMap';
import { colors } from '../theme/tokens';
import { muscleLabel } from '../data/muscles';
import { BodyView, MuscleKey } from '../types';

interface BodySelectorProps {
  selected: MuscleKey | null;
  onSelect: (muscle: MuscleKey) => void;
  /** Largura de cada figura (frente e costas). */
  width?: number;
  hint?: string;
}

const IDLE: RegionFill = { color: colors.teal500, opacity: 0.16 };
const ACTIVE: RegionFill = { color: colors.teal500, opacity: 0.62 };

// Frente + costas com cada músculo tocável. As regiões aparecem levemente tingidas
// para indicar que são clicáveis; a escolhida fica destacada.
export function BodySelector({ selected, onSelect, width = 120, hint }: BodySelectorProps) {
  return (
    <View>
      <View style={styles.pair}>
        {(['frente', 'costas'] as BodyView[]).map((view) => {
          const fills: Partial<Record<MuscleKey, RegionFill>> = {};
          for (const key of REGIONS_BY_VIEW[view]) fills[key] = key === selected ? ACTIVE : IDLE;
          return (
            <View key={view} style={styles.column}>
              <BodyFigure view={view} width={width} fills={fills} onPressRegion={onSelect} />
              <Text style={styles.viewLabel}>{view === 'frente' ? 'FRENTE' : 'COSTAS'}</Text>
            </View>
          );
        })}
      </View>
      <Text style={[styles.hint, selected && styles.hintSelected]}>
        {selected ? muscleLabel[selected] : hint ?? 'Toque em um músculo para ver os exercícios que mais o ativam'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  column: { alignItems: 'center' },
  viewLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: colors.gray500, marginTop: 6 },
  hint: { fontSize: 13, color: colors.gray500, textAlign: 'center', marginTop: 10, paddingHorizontal: 16 },
  hintSelected: { fontSize: 15, fontWeight: '700', color: colors.teal600 },
});
