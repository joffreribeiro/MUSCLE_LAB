import type { MeasureEntry, WeightEntry } from '../types';

// Lembrete de atualizar peso e medidas no Painel. Funções puras: recebem "hoje" como parâmetro.

/** Dias sem pesagem para o lembrete aparecer. */
export const WEIGHT_STALE_DAYS = 14;
/** Dias sem medidas para o lembrete aparecer. */
export const MEASURES_STALE_DAYS = 30;
/** "Depois" esconde o lembrete por este tempo. */
export const SNOOZE_DAYS = 3;

export interface UpdateReminder {
  needsWeight: boolean;
  needsMeasures: boolean;
  /** Dias desde o último registro de peso ou medidas (ou desde que começou a usar o app); a data mais recente vale. */
  daysSince: number;
  /** Nunca registrou nada (só desde que começou a usar o app). */
  neverRecorded: boolean;
}

const dayMs = 86400000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const daysBetween = (fromISO: string, to: Date) => Math.max(0, Math.round((startOfDay(to) - startOfDay(new Date(fromISO))) / dayMs));
const latest = (isos: string[]) => (isos.length ? [...isos].sort().pop()! : null);
const earliest = (isos: string[]) => (isos.length ? [...isos].sort()[0] : null);

/**
 * `usageStartISO` é o início do uso do app (primeiro treino ou início do programa): sem ele e sem
 * nenhum registro não há lembrete, para não incomodar quem acabou de instalar.
 * `snoozedUntilISO` é a data até a qual o usuário pediu para não ser lembrado.
 */
export function updateReminder(
  weights: WeightEntry[],
  measures: MeasureEntry[],
  usageStartISO: string | null,
  today: Date,
  snoozedUntilISO?: string,
): UpdateReminder | null {
  if (snoozedUntilISO && startOfDay(today) < startOfDay(new Date(snoozedUntilISO))) return null;

  const lastWeight = latest(weights.map((w) => w.dateISO));
  const lastMeasure = latest(measures.map((m) => m.dateISO));
  const start = earliest([usageStartISO, lastWeight, lastMeasure].filter((x): x is string => !!x));
  if (!start) return null;

  const weightDays = daysBetween(lastWeight ?? start, today);
  const measureDays = daysBetween(lastMeasure ?? start, today);
  const needsWeight = weightDays >= WEIGHT_STALE_DAYS;
  const needsMeasures = measureDays >= MEASURES_STALE_DAYS;
  if (!needsWeight && !needsMeasures) return null;

  return {
    needsWeight,
    needsMeasures,
    daysSince: daysBetween(latest([lastWeight, lastMeasure].filter((x): x is string => !!x)) ?? start, today),
    neverRecorded: !lastWeight && !lastMeasure,
  };
}

export function reminderTitle(r: UpdateReminder): string {
  if (r.needsWeight && r.needsMeasures) return 'Hora de atualizar peso e medidas';
  return r.needsWeight ? 'Hora de registrar seu peso' : 'Hora de atualizar suas medidas';
}

export function reminderText(r: UpdateReminder): string {
  if (r.neverRecorded) return 'Você ainda não registrou nada. Acompanhar o corpo ajuda a ver o resultado do treino.';
  const when = r.daysSince === 0 ? 'foi hoje' : `foi há ${r.daysSince} ${r.daysSince === 1 ? 'dia' : 'dias'}`;
  return `Seu último registro ${when}. Acompanhar o corpo ajuda a ver o resultado do treino.`;
}

/** Data (ISO) até a qual o lembrete fica escondido depois de tocar em "Depois". */
export function snoozeUntil(today: Date): string {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + SNOOZE_DAYS).toISOString();
}
