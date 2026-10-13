import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavBar } from '../components/NavBar';
import { Icon } from '../components/icons/Icon';
import { TrendChart } from '../components/TrendChart';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, minTouchTarget, radii, screenPaddingHorizontal } from '../theme/tokens';
import { useWorkout } from '../context/WorkoutContext';
import {
  formatCm,
  formatDelta,
  latestMeasures,
  measureLabel,
  MEASURE_GROUPS,
  measureSeries,
  parseMeasure,
} from '../data/bodyMeasures';
import { clampDaysAgo, describeEntryDay, entryDateISO } from '../data/entryDate';
import { formatKgPtBR, parseWeight } from '../data/bodyWeight';
import { MeasureKey } from '../types';
import { formatShortDate } from '../utils/format';

const SIDE_LABEL = ['Esq.', 'Dir.'];

export function MedidasScreen() {
  const navigation = useNavigation<any>();
  const { measures, logMeasures, deleteMeasure, currentWeightKg, logWeight } = useWorkout();
  const [daysAgo, setDaysAgo] = useState(0);
  const [drafts, setDrafts] = useState<Partial<Record<MeasureKey, string>>>({});
  const [invalid, setInvalid] = useState<MeasureKey[]>([]);
  const [weightDraft, setWeightDraft] = useState('');
  const [weightInvalid, setWeightInvalid] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selected, setSelected] = useState<MeasureKey | null>(null);

  const now = new Date();
  const latest = useMemo(() => latestMeasures(measures), [measures]);
  const lastByKey = useMemo(
    () => Object.fromEntries(latest.map((l) => [l.key, l.latest.cm])) as Partial<Record<MeasureKey, number>>,
    [latest],
  );
  // A medida do gráfico: a escolhida, se ainda tem registro; senão a primeira que tiver.
  const shown: MeasureKey | null = selected && latest.some((l) => l.key === selected) ? selected : latest[0]?.key ?? null;
  const series = useMemo(() => (shown ? measureSeries(measures, shown) : []), [measures, shown]);

  const markDirty = () => setSaved(false);

  const handleSave = () => {
    const values: Partial<Record<MeasureKey, number>> = {};
    const bad: MeasureKey[] = [];
    for (const group of MEASURE_GROUPS) {
      for (const key of group.keys) {
        const text = drafts[key];
        if (!text || !text.trim()) continue;
        const cm = parseMeasure(text);
        if (cm === null) bad.push(key);
        else values[key] = cm;
      }
    }
    const kg = weightDraft.trim() ? parseWeight(weightDraft) : undefined;
    setInvalid(bad);
    setWeightInvalid(kg === null);
    markDirty();
    if (bad.length > 0 || kg === null) return;
    if (kg === undefined && Object.keys(values).length === 0) return;

    const date = entryDateISO(daysAgo, new Date());
    if (kg !== undefined) logWeight(kg, date);
    if (Object.keys(values).length > 0) logMeasures(values, date);
    setDrafts({});
    setWeightDraft('');
    setSaved(true);
  };

  const field = (key: MeasureKey, placeholder: string) => (
    <TextInput
      value={drafts[key] ?? ''}
      onChangeText={(t) => {
        setDrafts((d) => ({ ...d, [key]: t }));
        setInvalid((v) => v.filter((k) => k !== key));
        markDirty();
      }}
      placeholder={lastByKey[key] !== undefined ? formatCm(lastByKey[key]!) : placeholder}
      placeholderTextColor={colors.gray400}
      keyboardType="decimal-pad"
      style={[styles.input, invalid.includes(key) && styles.inputError]}
      accessibilityLabel={`${measureLabel(key)} em centímetros`}
    />
  );

  return (
    <View style={styles.screen}>
      <NavBar
        left={
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={styles.backLink}>← Treinos</Text>
          </Pressable>
        }
        title="Peso e medidas"
      />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>REGISTRAR</Text>
        <View style={styles.card}>
          <View style={styles.dateRow}>
            <Pressable
              onPress={() => {
                setDaysAgo((d) => clampDaysAgo(d + 1));
                markDirty();
              }}
              style={styles.dateButton}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Dia anterior"
            >
              <Text style={styles.dateButtonGlyph}>‹</Text>
            </Pressable>
            <View style={styles.dateCenter}>
              <Text style={styles.dateCaption}>DATA DO REGISTRO</Text>
              <Text style={styles.dateValue}>{describeEntryDay(daysAgo, now)}</Text>
            </View>
            <Pressable
              onPress={() => {
                setDaysAgo((d) => clampDaysAgo(d - 1));
                markDirty();
              }}
              disabled={daysAgo === 0}
              style={[styles.dateButton, daysAgo === 0 && styles.dateButtonOff]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Dia seguinte"
              accessibilityState={{ disabled: daysAgo === 0 }}
            >
              <Text style={[styles.dateButtonGlyph, daysAgo === 0 && styles.dateButtonGlyphOff]}>›</Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>Preencha só o que mediu, em centímetros. Meça sempre no mesmo ponto e no mesmo horário.</Text>

          <View style={[styles.inputRow, styles.rowDivider]}>
            <Text style={styles.inputLabel}>Peso (kg)</Text>
            <TextInput
              value={weightDraft}
              onChangeText={(t) => {
                setWeightDraft(t);
                setWeightInvalid(false);
                markDirty();
              }}
              placeholder={formatKgPtBR(currentWeightKg)}
              placeholderTextColor={colors.gray400}
              keyboardType="decimal-pad"
              style={[styles.input, weightInvalid && styles.inputError]}
              accessibilityLabel="Peso em quilos"
            />
          </View>
          {MEASURE_GROUPS.map((group) => (
            <View key={group.label} style={[styles.inputRow, styles.rowDivider]}>
              <Text style={styles.inputLabel}>{group.label}</Text>
              {group.keys.map((key, i) => (
                <View key={key} style={styles.fieldWrap}>
                  {group.keys.length > 1 ? <Text style={styles.sideLabel}>{SIDE_LABEL[i]}</Text> : null}
                  {field(key, group.keys.length > 1 ? SIDE_LABEL[i] : 'cm')}
                </View>
              ))}
            </View>
          ))}
          {weightInvalid ? <Text style={styles.error}>Digite um peso entre 20 e 400 kg.</Text> : null}
          {invalid.length > 0 ? <Text style={styles.error}>Digite um valor entre 10 e 250 cm em: {invalid.map(measureLabel).join(', ')}.</Text> : null}
          <PrimaryButton label="Salvar" onPress={handleSave} style={styles.saveButton} />
          {saved ? <Text style={styles.success}>Registro salvo.</Text> : null}
        </View>

        {latest.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>EVOLUÇÃO</Text>
            <View style={styles.card}>
              {latest.map((l, i) => (
                <Pressable
                  key={l.key}
                  onPress={() => setSelected(l.key)}
                  style={[styles.summaryRow, i > 0 && styles.rowDivider, shown === l.key && styles.summaryRowActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: shown === l.key }}
                >
                  <Text style={styles.summaryLabel}>{measureLabel(l.key)}</Text>
                  <Text style={styles.summaryValue}>{formatCm(l.latest.cm)} cm</Text>
                  <Text style={[styles.summaryDelta, l.delta === null && styles.summaryDeltaNone]}>
                    {l.delta === null ? '' : formatDelta(l.delta)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {shown ? (
              <>
                <Text style={styles.sectionLabel}>{measureLabel(shown).toUpperCase()}</Text>
                <View style={styles.card}>
                  {series.length >= 2 ? (
                    <TrendChart series={series.map((p) => ({ dateISO: p.dateISO, value: p.cm }))} format={formatCm} />
                  ) : (
                    <Text style={styles.hint}>Registre de novo mais tarde para ver o gráfico de evolução.</Text>
                  )}
                  {[...series].reverse().slice(0, 5).map((p) => (
                    <View key={p.dateISO} style={styles.historyRow}>
                      <Text style={styles.historyDate}>{formatShortDate(new Date(p.dateISO))}</Text>
                      <Text style={styles.historyValue}>{formatCm(p.cm)} cm</Text>
                      <Pressable onPress={() => deleteMeasure(p.dateISO, shown)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Apagar medida">
                        <Icon name="close" color={colors.gray400} size={14} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill50 },
  backLink: { fontSize: 15, color: colors.teal500 },
  body: { flex: 1 },
  bodyContent: { padding: screenPaddingHorizontal, paddingBottom: 32 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.96, color: colors.gray500, marginBottom: 8, marginTop: 8 },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: 14, marginBottom: 14 },
  hint: { fontSize: 13, lineHeight: 18, color: colors.gray500, marginBottom: 4, marginTop: 10 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.fill100, alignItems: 'center', justifyContent: 'center' },
  dateButtonOff: { opacity: 0.4 },
  dateButtonGlyph: { fontSize: 22, fontWeight: '700', color: colors.navy700, marginTop: -2 },
  dateButtonGlyphOff: { color: colors.gray400 },
  dateCenter: { flex: 1, alignItems: 'center' },
  dateCaption: { fontSize: 10, fontWeight: '700', letterSpacing: 0.9, color: colors.gray500 },
  dateValue: { fontSize: 16, fontWeight: '700', color: colors.navy700, marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: minTouchTarget },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  inputLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink },
  fieldWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sideLabel: { fontSize: 11, color: colors.gray500 },
  input: { width: 76, minHeight: 40, borderRadius: radii.card, backgroundColor: colors.fill50, paddingHorizontal: 10, fontSize: 15, color: colors.ink, textAlign: 'right' },
  inputError: { borderWidth: 1.5, borderColor: colors.red500 },
  error: { fontSize: 12, lineHeight: 17, color: colors.red500, marginTop: 8 },
  saveButton: { marginTop: 12 },
  success: { fontSize: 13, fontWeight: '600', color: colors.teal600, textAlign: 'center', marginTop: 10 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: minTouchTarget, paddingHorizontal: 4 },
  summaryRowActive: { backgroundColor: colors.fill50, borderRadius: radii.card },
  summaryLabel: { flex: 1, fontSize: 15, color: colors.ink },
  summaryValue: { fontSize: 15, fontWeight: '700', color: colors.navy700 },
  summaryDelta: { width: 48, fontSize: 12, fontWeight: '600', color: colors.gray500, textAlign: 'right' },
  summaryDeltaNone: { color: colors.gray300 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 10 },
  historyDate: { flex: 1, fontSize: 13, color: colors.gray500 },
  historyValue: { fontSize: 13, fontWeight: '600', color: colors.ink },
});
