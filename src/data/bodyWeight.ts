import type { WeightEntry } from '../types';
import { dayKey } from './stats';

// Registro de peso corporal. Funções puras: recebem "hoje" como parâmetro.

export const MIN_WEIGHT_KG = 20;
export const MAX_WEIGHT_KG = 400;

/** Converte o texto digitado ("78,5" ou "78.5") em kg; null se vazio ou fora de uma faixa plausível. */
export function parseWeight(text: string): number | null {
  const n = Number(text.trim().replace(',', '.'));
  if (!Number.isFinite(n) || n < MIN_WEIGHT_KG || n > MAX_WEIGHT_KG) return null;
  return Math.round(n * 10) / 10;
}

const byDate = (a: WeightEntry, b: WeightEntry) => a.dateISO.localeCompare(b.dateISO);

/** Grava a pesagem; se já existe uma no mesmo dia, ela é substituída. Lista ordenada por data. */
export function upsertWeight(entries: WeightEntry[], entry: WeightEntry): WeightEntry[] {
  const key = dayKey(new Date(entry.dateISO));
  return [...entries.filter((e) => dayKey(new Date(e.dateISO)) !== key), entry].sort(byDate);
}

export const removeWeight = (entries: WeightEntry[], dateISO: string): WeightEntry[] =>
  entries.filter((e) => e.dateISO !== dateISO);

/** Pesagens dos últimos `days` dias (null = todas), da mais antiga para a mais recente. */
export function weightSeries(entries: WeightEntry[], today: Date, days: number | null): WeightEntry[] {
  const sorted = [...entries].sort(byDate);
  if (days === null) return sorted;
  const since = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1)).getTime();
  return sorted.filter((e) => new Date(e.dateISO).getTime() >= since);
}

/** Variação entre a primeira e a última pesagem; null com menos de duas. */
export function weightDelta(series: WeightEntry[]): number | null {
  if (series.length < 2) return null;
  return Math.round((series[series.length - 1].kg - series[0].kg) * 10) / 10;
}

/** "78,5" — kg com uma casa e vírgula; inteiros ficam sem decimal. */
export function formatKgPtBR(kg: number): string {
  const rounded = Math.round(kg * 10) / 10;
  return String(rounded).replace('.', ',');
}
