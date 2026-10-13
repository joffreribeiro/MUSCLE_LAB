import { allExercises } from './catalog';
import { EXERCISE_KINESIOLOGY, Kinesiology, regionRoles, regionsOf } from './muscles';
import { Exercise, MuscleKey } from '../types';

export interface RankedExercise {
  exercise: Exercise;
  /** Quantas regiões diferentes o exercício tem como alvo principal (1 = isolado). */
  primaryRegions: number;
}

export interface MuscleRanking {
  /** O músculo é alvo principal. Os mais isolados primeiro. */
  primary: RankedExercise[];
  /** O músculo ajuda, mas não é o alvo. */
  secondary: RankedExercise[];
}

const primaryRegionCount = (k: Kinesiology) => new Set(k.primarios.flatMap((i) => regionsOf(i))).size;

/** Posição do primeiro item da lista que pinta a região (quanto antes, mais central no exercício). */
const firstIndex = (items: Kinesiology['primarios'], muscle: MuscleKey) => {
  const i = items.findIndex((item) => regionsOf(item).includes(muscle));
  return i === -1 ? items.length : i;
};

/**
 * Exercícios que mais ativam um músculo, a partir dos mapas de cinesiologia.
 * Primeiro os que têm o músculo como alvo principal, do mais isolado ao mais composto;
 * depois os que o usam como secundário. Estabilizadores e cardio ficam de fora.
 */
export function rankExercisesForMuscle(muscle: MuscleKey): MuscleRanking {
  const primary: (RankedExercise & { pos: number })[] = [];
  const secondary: (RankedExercise & { pos: number })[] = [];

  for (const exercise of allExercises) {
    // Cardio ativa pernas, mas não é o que se procura ao escolher um músculo para fortalecer.
    if (exercise.muscleGroup === 'cardio') continue;
    const k = EXERCISE_KINESIOLOGY[exercise.id];
    if (!k) continue;
    const role = regionRoles(k)[muscle];
    const entry = { exercise, primaryRegions: primaryRegionCount(k) };
    if (role === 'primario') primary.push({ ...entry, pos: firstIndex(k.primarios, muscle) });
    else if (role === 'secundario') secondary.push({ ...entry, pos: firstIndex(k.secundarios, muscle) });
  }

  const byFocus = (a: RankedExercise & { pos: number }, b: RankedExercise & { pos: number }) =>
    a.primaryRegions - b.primaryRegions || a.pos - b.pos || a.exercise.name.localeCompare(b.exercise.name);

  primary.sort(byFocus);
  secondary.sort((a, b) => a.pos - b.pos || a.exercise.name.localeCompare(b.exercise.name));

  const strip = ({ pos: _pos, ...rest }: RankedExercise & { pos: number }) => rest;
  return { primary: primary.map(strip), secondary: secondary.map(strip) };
}
