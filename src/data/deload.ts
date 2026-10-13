import type { Session, Workout } from '../types';
import { averageRir } from './rir';
import { weightStep } from './progression';
import { roundLoad } from './programGenerator';

// Aviso de descarga: se o esforço ficou perto da falha por vários treinos seguidos, vale uma
// semana mais leve. Usa o RIR registrado (ver rir.ts). Funções puras: recebem "hoje" como parâmetro.

/** RIR médio abaixo disso = séries na falha ou quase (mesma leitura do Resumo do treino). */
export const DELOAD_RIR_BELOW = 1;
/** Quantos treinos seguidos precisam estar abaixo do limite. */
export const DELOAD_SESSIONS = 3;
/** O treino mais recente tem de ser deste período; senão você já descansou o bastante. */
export const DELOAD_MAX_AGE_DAYS = 14;
/** Redução de carga sugerida. */
export const DELOAD_FACTOR = 0.9;

export interface DeloadSignal {
  /** RIR médio de cada treino, do mais antigo para o mais recente. */
  rirs: number[];
  /** Treino mais recente considerado; serve para o aviso não voltar depois de dispensado. */
  latestSessionId: string;
}

const dayMs = 86400000;

/** Null quando não há motivo para sugerir descarga. */
export function deloadSignal(sessions: Session[], today: Date): DeloadSignal | null {
  // Só treinos com RIR registrado contam; os sem RIR não indicam esforço.
  const withRir = [...sessions]
    .sort((a, b) => b.finishedAtISO.localeCompare(a.finishedAtISO))
    .map((s) => ({ id: s.id, finishedAtISO: s.finishedAtISO, rir: averageRir(s.sets.filter((x) => x.weight > 0).map((x) => x.rir)) }))
    .filter((s): s is { id: string; finishedAtISO: string; rir: number } => s.rir !== null);

  const recent = withRir.slice(0, DELOAD_SESSIONS);
  if (recent.length < DELOAD_SESSIONS) return null;
  if (today.getTime() - new Date(recent[0].finishedAtISO).getTime() > DELOAD_MAX_AGE_DAYS * dayMs) return null;
  if (!recent.every((s) => s.rir < DELOAD_RIR_BELOW)) return null;
  return { rirs: recent.map((s) => s.rir).reverse(), latestSessionId: recent[0].id };
}

/** Cargas 10% menores em todos os treinos; exercícios sem carga e cardio ficam como estão. */
export function deloadWorkouts(workouts: Workout[]): Workout[] {
  return workouts.map((w) => ({
    ...w,
    exercises: w.exercises.map((e) => {
      if (e.type === 'cardio' || !e.weight || e.weight <= 0) return e;
      const lighter = roundLoad(e.weight * DELOAD_FACTOR);
      // Em cargas leves o arredondamento pode devolver o mesmo valor: nesse caso desce um passo.
      const weight = lighter < e.weight ? lighter : Math.max(0, e.weight - weightStep(e.weight));
      // Nunca zera a carga: 0 viraria "peso corporal".
      return weight > 0 ? { ...e, weight } : e;
    }),
  }));
}
