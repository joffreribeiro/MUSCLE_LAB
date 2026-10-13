import type { Session, Workout } from '../types';
import { dayKey } from './stats';

// Qual treino fazer hoje: o seguinte ao último concluído, na ordem do programa.
// Funções puras: recebem "hoje" como parâmetro.

export interface NextWorkout {
  workout: Workout;
  /** Último treino concluído deste programa, se houver. */
  lastDone: { workout: Workout; finishedAtISO: string } | null;
  /** Já houve um treino concluído hoje. */
  trainedToday: boolean;
}

/** Null só quando não há treinos. Sessões de treinos que não existem mais (programa trocado) são ignoradas. */
export function nextWorkout(workouts: Workout[], sessions: Session[], today: Date): NextWorkout | null {
  if (workouts.length === 0) return null;

  let latest: Session | null = null;
  for (const s of sessions) {
    if (!workouts.some((w) => w.id === s.workoutId)) continue;
    if (!latest || s.finishedAtISO > latest.finishedAtISO) latest = s;
  }

  const lastIndex = latest ? workouts.findIndex((w) => w.id === latest!.workoutId) : -1;
  const todayKey = dayKey(today);
  return {
    workout: workouts[(lastIndex + 1) % workouts.length],
    lastDone: latest ? { workout: workouts[lastIndex], finishedAtISO: latest.finishedAtISO } : null,
    trainedToday: sessions.some((s) => dayKey(new Date(s.finishedAtISO)) === todayKey),
  };
}
