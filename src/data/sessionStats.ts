import type { Session, WeightEntry } from '../types';
import { buildShareItems, ShareResult } from './stats';

// Estatísticas por treino concluído: duração, calorias estimadas e tipo de exercício.
// Funções puras: recebem "hoje" como parâmetro.

/** Quantos treinos aparecem nos gráficos por treino. */
export const MAX_SESSIONS_SHOWN = 12;

/** MET da musculação vigorosa, usado na estimativa de calorias. */
export const STRENGTH_MET = 6;

/** Treinos concluídos nos últimos `days` dias (null = todos), do mais antigo para o mais recente, no máximo MAX_SESSIONS_SHOWN. */
export function sessionsInPeriod(sessions: Session[], today: Date, days: number | null): Session[] {
  const since = days === null ? -Infinity : new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1)).getTime();
  return sessions
    .filter((s) => new Date(s.finishedAtISO).getTime() >= since)
    .sort((a, b) => a.finishedAtISO.localeCompare(b.finishedAtISO))
    .slice(-MAX_SESSIONS_SHOWN);
}

/** Duração em minutos inteiros. */
export const durationMinutes = (s: Session): number => Math.round(Math.max(0, s.durationSec) / 60);

/** Calorias estimadas: MET × peso (kg) × horas. */
export const estimateKcal = (durationSec: number, weightKg: number): number =>
  Math.round(STRENGTH_MET * weightKg * (Math.max(0, durationSec) / 3600));

/** Peso na data do treino: a pesagem mais recente até esse dia; sem nenhuma, o peso de reserva. */
export function weightOn(weights: WeightEntry[], dateISO: string, fallbackKg: number): number {
  const end = new Date(dateISO);
  end.setHours(23, 59, 59, 999);
  let found: WeightEntry | null = null;
  for (const w of weights) {
    if (new Date(w.dateISO).getTime() > end.getTime()) continue;
    if (!found || w.dateISO > found.dateISO) found = w;
  }
  return found ? found.kg : fallbackKg;
}

export const sessionKcal = (s: Session, weights: WeightEntry[], fallbackKg: number): number =>
  estimateKcal(s.durationSec, weightOn(weights, s.finishedAtISO, fallbackKg));

/** Média arredondada; 0 sem valores. */
export const average = (values: number[]): number => (values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0);

// ── Tipo de exercício ───────────────────────────────────────────────────────

export type ExerciseKind = 'forca' | 'cardio' | 'aquecimento';

export const KIND_LABEL: Record<ExerciseKind, string> = { forca: 'Força', cardio: 'Cardio', aquecimento: 'Aquecimento' };

/** Bicicleta é o aquecimento padrão dos programas; qualquer outro cardio é cardio. */
export function exerciseKind(exerciseId: string, isCardio: boolean): ExerciseKind {
  if (!isCardio) return 'forca';
  return exerciseId === 'bike' ? 'aquecimento' : 'cardio';
}

/** Exercícios feitos por tipo (cada exercício conta uma vez por treino, não por série). */
export function kindShare(sessions: Session[], isCardio: (exerciseId: string) => boolean): ShareResult {
  const counts: Record<ExerciseKind, number> = { forca: 0, cardio: 0, aquecimento: 0 };
  for (const s of sessions) {
    for (const id of new Set(s.sets.map((x) => x.exerciseId))) counts[exerciseKind(id, isCardio(id))] += 1;
  }
  return buildShareItems((Object.keys(counts) as ExerciseKind[]).filter((k) => counts[k] > 0).map((k) => ({ key: k, label: KIND_LABEL[k], count: counts[k] })));
}
