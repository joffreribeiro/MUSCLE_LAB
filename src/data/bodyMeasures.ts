import type { MeasureEntry, MeasureKey } from '../types';
import { dayKey } from './stats';

// Medidas corporais (cm). Funções puras. Uma anotação por dia; cada medida é opcional.

export interface MeasureDef {
  key: MeasureKey;
  label: string;
  /** Rótulo curto para espaços pequenos (cartão do Painel). */
  short: string;
}

export const MEASURES: MeasureDef[] = [
  { key: 'pescoco', label: 'Pescoço', short: 'Pescoço' },
  { key: 'ombros', label: 'Ombros', short: 'Ombros' },
  { key: 'peito', label: 'Peito', short: 'Peito' },
  { key: 'cintura', label: 'Cintura', short: 'Cintura' },
  { key: 'quadril', label: 'Quadril', short: 'Quadril' },
  { key: 'bracoEsq', label: 'Braço esquerdo', short: 'Braço esq.' },
  { key: 'bracoDir', label: 'Braço direito', short: 'Braço dir.' },
  { key: 'antebracoEsq', label: 'Antebraço esquerdo', short: 'Antebraço esq.' },
  { key: 'antebracoDir', label: 'Antebraço direito', short: 'Antebraço dir.' },
  { key: 'pulsoEsq', label: 'Pulso esquerdo', short: 'Pulso esq.' },
  { key: 'pulsoDir', label: 'Pulso direito', short: 'Pulso dir.' },
  { key: 'coxaEsq', label: 'Coxa esquerda', short: 'Coxa esq.' },
  { key: 'coxaDir', label: 'Coxa direita', short: 'Coxa dir.' },
  { key: 'panturrilhaEsq', label: 'Panturrilha esquerda', short: 'Panturrilha esq.' },
  { key: 'panturrilhaDir', label: 'Panturrilha direita', short: 'Panturrilha dir.' },
  { key: 'tornozeloEsq', label: 'Tornozelo esquerdo', short: 'Tornozelo esq.' },
  { key: 'tornozeloDir', label: 'Tornozelo direito', short: 'Tornozelo dir.' },
];

/** Linhas do formulário: partes do corpo com um campo, ou com dois (esquerdo e direito). */
export interface MeasureGroup {
  label: string;
  keys: MeasureKey[];
}

export const MEASURE_GROUPS: MeasureGroup[] = [
  { label: 'Pescoço', keys: ['pescoco'] },
  { label: 'Ombros', keys: ['ombros'] },
  { label: 'Peito', keys: ['peito'] },
  { label: 'Cintura', keys: ['cintura'] },
  { label: 'Quadril', keys: ['quadril'] },
  { label: 'Braço', keys: ['bracoEsq', 'bracoDir'] },
  { label: 'Antebraço', keys: ['antebracoEsq', 'antebracoDir'] },
  { label: 'Pulso', keys: ['pulsoEsq', 'pulsoDir'] },
  { label: 'Coxa', keys: ['coxaEsq', 'coxaDir'] },
  { label: 'Panturrilha', keys: ['panturrilhaEsq', 'panturrilhaDir'] },
  { label: 'Tornozelo', keys: ['tornozeloEsq', 'tornozeloDir'] },
];

const DEF = new Map(MEASURES.map((m) => [m.key, m]));

export const measureLabel = (key: MeasureKey): string => DEF.get(key)!.label;
export const measureShort = (key: MeasureKey): string => DEF.get(key)!.short;

export const MIN_MEASURE_CM = 10;
export const MAX_MEASURE_CM = 250;

/** Converte "82,5" ou "82.5" em cm; null se vazio ou fora de uma faixa plausível. */
export function parseMeasure(text: string): number | null {
  const n = Number(text.trim().replace(',', '.'));
  if (!Number.isFinite(n) || n < MIN_MEASURE_CM || n > MAX_MEASURE_CM) return null;
  return Math.round(n * 10) / 10;
}

// ── Migração ────────────────────────────────────────────────────────────────

// Versões antigas guardavam uma medida só para braço, coxa e panturrilha. Ao migrar, o valor
// vale para os dois lados (até o usuário informar cada lado); um lado já informado tem prioridade.
const LEGACY: Record<string, [MeasureKey, MeasureKey]> = {
  braco: ['bracoEsq', 'bracoDir'],
  coxa: ['coxaEsq', 'coxaDir'],
  panturrilha: ['panturrilhaEsq', 'panturrilhaDir'],
};

/** Mantém só números de medidas conhecidas, convertendo as chaves antigas. */
export function migrateValues(values: Record<string, unknown>): MeasureEntry['values'] {
  const out: MeasureEntry['values'] = {};
  for (const [key, v] of Object.entries(values)) {
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;
    if (DEF.has(key as MeasureKey)) out[key as MeasureKey] = v;
  }
  for (const [key, [esq, dir]] of Object.entries(LEGACY)) {
    const v = values[key];
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;
    out[esq] ??= v;
    out[dir] ??= v;
  }
  return out;
}

/** Aplica a migração a uma lista de anotações; anotações que ficam sem nenhuma medida saem. */
export function migrateEntries(entries: MeasureEntry[]): MeasureEntry[] {
  return entries
    .map((e) => ({ ...e, values: migrateValues(e.values as Record<string, unknown>) }))
    .filter((e) => Object.keys(e.values).length > 0);
}

// ── Registro ────────────────────────────────────────────────────────────────

const byDate = (a: MeasureEntry, b: MeasureEntry) => a.dateISO.localeCompare(b.dateISO);

/** Grava as medidas de um dia, juntando com o que já havia nesse dia. Lista ordenada por data. */
export function upsertMeasures(entries: MeasureEntry[], dateISO: string, values: MeasureEntry['values']): MeasureEntry[] {
  const key = dayKey(new Date(dateISO));
  const sameDay = entries.find((e) => dayKey(new Date(e.dateISO)) === key);
  const merged: MeasureEntry = { dateISO: sameDay?.dateISO ?? dateISO, values: { ...sameDay?.values, ...values } };
  return [...entries.filter((e) => e !== sameDay), merged].sort(byDate);
}

/** Apaga uma medida de um dia; se o dia ficar sem nenhuma, a anotação some. */
export function removeMeasure(entries: MeasureEntry[], dateISO: string, key: MeasureKey): MeasureEntry[] {
  return entries
    .map((e) => {
      if (e.dateISO !== dateISO) return e;
      const { [key]: _removed, ...rest } = e.values;
      return { ...e, values: rest };
    })
    .filter((e) => Object.keys(e.values).length > 0);
}

export interface MeasurePoint {
  dateISO: string;
  cm: number;
}

/** Histórico de uma medida, da mais antiga para a mais recente. */
export function measureSeries(entries: MeasureEntry[], key: MeasureKey): MeasurePoint[] {
  return [...entries]
    .sort(byDate)
    .filter((e) => typeof e.values[key] === 'number')
    .map((e) => ({ dateISO: e.dateISO, cm: e.values[key] as number }));
}

export interface MeasureSummary {
  key: MeasureKey;
  latest: MeasurePoint;
  /** Variação em relação à medida anterior (cm); null se só há uma. */
  delta: number | null;
}

/** Última medida de cada parte do corpo que tem registro, na ordem de MEASURES. */
export function latestMeasures(entries: MeasureEntry[]): MeasureSummary[] {
  const out: MeasureSummary[] = [];
  for (const { key } of MEASURES) {
    const series = measureSeries(entries, key);
    if (series.length === 0) continue;
    const latest = series[series.length - 1];
    out.push({ key, latest, delta: series.length > 1 ? Math.round((latest.cm - series[series.length - 2].cm) * 10) / 10 : null });
  }
  return out;
}

/** "82,5" — cm com uma casa e vírgula; inteiros sem decimal. */
export const formatCm = (cm: number): string => String(Math.round(cm * 10) / 10).replace('.', ',');

/** "+1,5" / "−2" / "0" para variações. */
export function formatDelta(delta: number): string {
  if (delta === 0) return '0';
  return `${delta > 0 ? '+' : '−'}${formatCm(Math.abs(delta))}`;
}
