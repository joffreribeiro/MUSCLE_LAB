import type { DayExercise, Exercise, Workout } from '../types';

// Substituir "só hoje" troca o exercício agora e o devolve ao original quando o treino
// termina (ou no dia seguinte, se o treino ficou pela metade). "No programa" é permanente.

export interface PendingSub {
  workoutId: string;
  /** Posição do exercício no treino. */
  index: number;
  /** Exercício que estava no lugar antes da troca. */
  original: DayExercise;
  /** Exercício colocado no lugar; só reverte se ainda for este (o treino pode ter sido editado). */
  replacementId: string;
  /** Dia da troca (chave local, ex.: "2026-10-12"). */
  day: string;
}

/**
 * Registra uma troca "só hoje". Trocar de novo o mesmo lugar preserva o original mais antigo,
 * para a reversão devolver o exercício do programa e não um intermediário.
 */
export function recordSub(subs: PendingSub[], next: PendingSub): PendingSub[] {
  const prev = subs.find((s) => s.workoutId === next.workoutId && s.index === next.index);
  const kept = subs.filter((s) => s !== prev);
  return [...kept, prev ? { ...next, original: prev.original } : next];
}

/** Tira o lugar da lista de reversões: a troca vira permanente. */
export function dropSub(subs: PendingSub[], workoutId: string, index: number): PendingSub[] {
  return subs.filter((s) => !(s.workoutId === workoutId && s.index === index));
}

/**
 * Devolve os originais das trocas que `shouldRevert` aceitar. Se o exercício do lugar não é mais o
 * que foi colocado (foi removido, reordenado ou trocado de novo), a troca é descartada sem mexer no treino.
 */
export function applyReverts(
  workouts: Workout[],
  subs: PendingSub[],
  shouldRevert: (sub: PendingSub) => boolean,
): { workouts: Workout[]; remaining: PendingSub[] } {
  const remaining: PendingSub[] = [];
  let next = workouts;
  for (const sub of subs) {
    if (!shouldRevert(sub)) {
      remaining.push(sub);
      continue;
    }
    next = next.map((w) => {
      if (w.id !== sub.workoutId || w.exercises[sub.index]?.exerciseId !== sub.replacementId) return w;
      const exercises = [...w.exercises];
      exercises[sub.index] = sub.original;
      return { ...w, exercises };
    });
  }
  return { workouts: next, remaining };
}

/**
 * Exercício que entra no lugar de outro: mantém séries e repetições, e usa a `weight` informada
 * (a carga do exercício antigo não serve para um movimento diferente).
 */
export function buildSubstitute(original: DayExercise, exercise: Exercise, weight: number): DayExercise {
  const base = { ...original, exerciseId: exercise.id, name: exercise.name, barNote: undefined };
  return original.type === 'cardio' ? base : { ...base, weight };
}
