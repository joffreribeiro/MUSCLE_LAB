import type { MuscleKey, SetLog } from '../types';
import { getKinesiology, regionRoles } from './muscles';

// Carga por músculo: quanto cada região do corpo foi trabalhada no período. Cada série conta
// pelo papel do músculo no exercício (mapas de cinesiologia): primário 1, secundário 0,5.
// Estabilizadores não entram. Funções puras: recebem "hoje" como parâmetro.

const ROLE_WEIGHT = { primario: 1, secundario: 0.5, estabilizador: 0 } as const;

export type MuscleLoad = Partial<Record<MuscleKey, number>>;

export interface MuscleLoadResult {
  /** Séries "efetivas" por região (uma série de supino conta 1 para o peitoral e 0,5 para o tríceps). */
  load: MuscleLoad;
  /** Maior valor entre as regiões; 0 se não houve nada. */
  max: number;
}

/** `days` = null: todo o histórico. */
export function muscleLoad(sets: SetLog[], today: Date, days: number | null): MuscleLoadResult {
  const since = days === null ? -Infinity : new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1)).getTime();
  const load: MuscleLoad = {};
  const cache = new Map<string, ReturnType<typeof regionRoles> | null>();

  for (const s of sets) {
    if (new Date(s.loggedAtISO).getTime() < since) continue;
    if (!(s.reps > 0) || s.minutes) continue;
    let roles = cache.get(s.exerciseId);
    if (roles === undefined) {
      const k = getKinesiology(s.exerciseId);
      roles = k ? regionRoles(k) : null;
      cache.set(s.exerciseId, roles);
    }
    if (!roles) continue;
    for (const key of Object.keys(roles) as MuscleKey[]) {
      const w = ROLE_WEIGHT[roles[key]!];
      if (w > 0) load[key] = (load[key] ?? 0) + w;
    }
  }
  const max = Math.max(0, ...Object.values(load));
  return { load, max };
}

export interface LoadBand {
  /** Faixa em % da região mais trabalhada. */
  from: number;
  to: number;
  label: string;
}

export const LOAD_BANDS: LoadBand[] = [
  { from: 1, to: 19, label: '1-19%' },
  { from: 20, to: 49, label: '20-49%' },
  { from: 50, to: 79, label: '50-79%' },
  { from: 80, to: 100, label: '80-100%' },
];

/** Percentual (0 a 100) de uma região em relação à mais trabalhada. */
export const loadPercent = (value: number, max: number): number =>
  max > 0 && value > 0 ? Math.max(1, Math.round((value / max) * 100)) : 0;

/** Índice da faixa (0 a 3) para um percentual; -1 se a região não foi trabalhada. */
export function bandIndex(percent: number): number {
  if (percent < 1) return -1;
  return LOAD_BANDS.findIndex((b) => percent <= b.to);
}
