import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavBar } from '../components/NavBar';
import { Chip } from '../components/Chip';
import { colors, radii, screenPaddingHorizontal } from '../theme/tokens';
import { useWorkout } from '../context/WorkoutContext';
import {
  buildCatalogProgram,
  DEFAULT_WEIGHT_KG,
  FOCUS_ORDER,
  GOAL_LABEL,
  GOAL_ORDER,
  isCurrentProgram,
  LEVEL_INFO,
  LEVEL_ORDER,
  PROGRAM_CATALOG,
} from '../data/programCatalog';
import { FOCUS_LABEL, FocusKey } from '../data/programGenerator';
import { Goal, Level } from '../types';

const DAY_OPTIONS = [...new Set(PROGRAM_CATALOG.map((p) => p.frequency))].sort((a, b) => a - b);

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function ProgramasScreen() {
  const navigation = useNavigation<any>();
  const { profile, activeProgram } = useWorkout();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [days, setDays] = useState<number | null>(null);
  const [focus, setFocus] = useState<FocusKey | null>(null);

  const weight = profile?.weightKg ?? DEFAULT_WEIGHT_KG;

  // Quantos exercícios de musculação cada treino tem, para mostrar no cartão.
  const items = useMemo(
    () =>
      PROGRAM_CATALOG.map((spec) => {
        const program = buildCatalogProgram(spec, weight);
        const exercisesPerWorkout = Math.round(
          program.workouts.reduce((sum, w) => sum + w.exercises.filter((e) => e.type === 'strength').length, 0) /
            program.workouts.length,
        );
        return { spec, split: program.split, exercisesPerWorkout };
      }),
    [weight],
  );

  const visible = items.filter(
    ({ spec }) =>
      (goal === null || spec.goal === goal) &&
      (level === null || spec.level === level) &&
      (days === null || spec.frequency === days) &&
      (focus === null || spec.focus === focus),
  );
  const hasFilter = goal !== null || level !== null || days !== null || focus !== null;
  const clearFilters = () => {
    setGoal(null);
    setLevel(null);
    setDays(null);
    setFocus(null);
  };

  return (
    <View style={styles.screen}>
      <NavBar
        left={
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={styles.backLink}>← Treinos</Text>
          </Pressable>
        }
        title="Programas"
      >
        <FilterRow label="Objetivo">
          <Chip label="Todos" active={goal === null} onPress={() => setGoal(null)} />
          {GOAL_ORDER.map((g) => (
            <Chip key={g} label={GOAL_LABEL[g]} active={goal === g} onPress={() => setGoal(goal === g ? null : g)} />
          ))}
        </FilterRow>
        <FilterRow label="Nível">
          <Chip label="Todos" active={level === null} onPress={() => setLevel(null)} />
          {LEVEL_ORDER.map((l) => (
            <Chip key={l} label={LEVEL_INFO[l].label} active={level === l} onPress={() => setLevel(level === l ? null : l)} />
          ))}
        </FilterRow>
        <FilterRow label="Foco">
          <Chip label="Todos" active={focus === null} onPress={() => setFocus(null)} />
          {FOCUS_ORDER.map((f) => (
            <Chip key={f} label={FOCUS_LABEL[f]} active={focus === f} onPress={() => setFocus(focus === f ? null : f)} />
          ))}
        </FilterRow>
        <FilterRow label="Dias por semana">
          <Chip label="Todos" active={days === null} onPress={() => setDays(null)} />
          {DAY_OPTIONS.map((d) => (
            <Chip key={d} label={`${d}x`} active={days === d} onPress={() => setDays(days === d ? null : d)} />
          ))}
        </FilterRow>
      </NavBar>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.count}>
          {plural(visible.length, 'programa', 'programas')}
          {hasFilter ? ' com esses filtros' : ''}
        </Text>

        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhum programa com esses filtros</Text>
            <Pressable onPress={clearFilters} style={styles.emptyButton}>
              <Text style={styles.emptyButtonLabel}>Limpar filtros</Text>
            </Pressable>
          </View>
        ) : (
          visible.map(({ spec, split, exercisesPerWorkout }) => {
            const info = LEVEL_INFO[spec.level];
            const current = isCurrentProgram(spec, profile, activeProgram);
            return (
              <Pressable
                key={spec.id}
                style={styles.card}
                onPress={() => navigation.navigate('ProgramaDetalhe', { programId: spec.id })}
                accessibilityRole="button"
                accessibilityLabel={`Programa ${spec.title}`}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardGoal}>{GOAL_LABEL[spec.goal].toUpperCase()}</Text>
                  {current ? (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeLabel}>PROGRAMA ATUAL</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.cardTitle}>{spec.title}</Text>
                <Text style={styles.cardTagline}>{spec.tagline}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.stars}>{info.stars}</Text>
                  <Text style={styles.metaText}>{info.label}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>{spec.frequency}x por semana</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>{spec.weeks} semanas</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>{plural(exercisesPerWorkout, 'exercício', 'exercícios')} por treino</Text>
                </View>
                <Text style={styles.split}>{spec.focus ? `Foco em ${FOCUS_LABEL[spec.focus].toLowerCase()} · ${split}` : split}</Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterBlock}>
      <Text style={styles.filterLabel}>{label.toUpperCase()}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill50 },
  backLink: { fontSize: 15, color: colors.teal500 },
  filterBlock: { marginTop: 10 },
  filterLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, color: colors.gray500, marginBottom: 6 },
  filterChips: { gap: 8, paddingRight: 8 },
  body: { flex: 1 },
  bodyContent: { padding: screenPaddingHorizontal, paddingBottom: 32 },
  count: { fontSize: 13, color: colors.gray500, marginBottom: 10 },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardGoal: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, color: colors.teal600 },
  currentBadge: { backgroundColor: colors.teal100, borderRadius: radii.chip, paddingVertical: 3, paddingHorizontal: 9 },
  currentBadgeLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, color: colors.navy800 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, marginTop: 6 },
  cardTagline: { fontSize: 14, lineHeight: 20, color: colors.gray500, marginTop: 3 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 12 },
  stars: { fontSize: 13, color: colors.amber },
  metaText: { fontSize: 13, color: colors.ink },
  metaDot: { color: colors.gray300 },
  split: { fontSize: 12, color: colors.gray500, marginTop: 6 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 15, color: colors.gray500 },
  emptyButton: { marginTop: 14, paddingVertical: 10, paddingHorizontal: 18, borderRadius: radii.chip, backgroundColor: colors.fill100 },
  emptyButtonLabel: { fontSize: 14, fontWeight: '600', color: colors.navy700 },
});
