import { allExercises, findExerciseById } from './catalog';
import { buildDayExerciseFromExercise } from './dayProgram';
import { EXERCISE_KINESIOLOGY, Kinesiology, regionsOf } from './muscles';
import { formatKg, suggestNext } from './progression';
import { estimateLoad } from './programGenerator';
import { DayExercise, Exercise, MuscleKey, Profile, Session } from '../types';

// Troca de exercício: só entram como alternativa os exercícios parecidos, isto é, do mesmo grupo e
// que têm como alvo principal o mesmo músculo (pelos mapas de cinesiologia). Funções puras.

const regionSet = (items: Kinesiology['primarios']): Set<MuscleKey> => new Set(items.flatMap((i) => regionsOf(i)));

/** Regiões do corpo que são alvo principal / secundário do exercício (vazio se não há mapa dele). */
function regionsOfExercise(id: string): { primary: Set<MuscleKey>; secondary: Set<MuscleKey> } {
  const k = EXERCISE_KINESIOLOGY[id];
  return k ? { primary: regionSet(k.primarios), secondary: regionSet(k.secundarios) } : { primary: new Set(), secondary: new Set() };
}

const intersect = <T,>(a: Set<T>, b: Set<T>) => [...a].filter((x) => b.has(x));
const jaccard = <T,>(a: Set<T>, b: Set<T>) => {
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersect(a, b).length / union;
};

export interface SimilarResult {
  /** Mesmo grupo e mesmo músculo principal, os mais parecidos primeiro. */
  similar: Exercise[];
  /** Resto do grupo: outros exercícios que não miram o mesmo músculo. */
  others: Exercise[];
}

/** Movimentos articulares do exercício (ex.: "Adução do ombro"), para separar puxada vertical de remada. */
const movementsOf = (id: string): Set<string> => new Set(EXERCISE_KINESIOLOGY[id]?.movimentos ?? []);
const planeOf = (id: string): string | undefined => EXERCISE_KINESIOLOGY[id]?.plano;

/**
 * Alternativas ao exercício `exerciseId`. Parecido = mesmo grupo e ao menos uma região principal em comum;
 * ordem: mais regiões principais em comum, depois o mesmo tipo de movimento (articulações e plano), depois
 * secundárias parecidas e, por fim, o mesmo equipamento.
 * Exercício sem mapa de cinesiologia (ou sem região própria) não tem como medir o músculo: todo o grupo
 * entra como parecido, o de mesmo equipamento primeiro.
 */
export function similarExercises(exerciseId: string): SimilarResult {
  const base = findExerciseById(exerciseId);
  if (!base) return { similar: [], others: [] };

  const baseRegions = regionsOfExercise(base.id);
  const group = allExercises.filter((e) => e.muscleGroup === base.muscleGroup && e.id !== base.id);
  const byName = (a: Exercise, b: Exercise) => a.name.localeCompare(b.name);
  const sameEquipment = (e: Exercise) => (e.equipment === base.equipment ? 1 : 0);

  if (baseRegions.primary.size === 0) {
    return { similar: [...group].sort((a, b) => sameEquipment(b) - sameEquipment(a) || byName(a, b)), others: [] };
  }

  const scored = group.map((e) => {
    const r = regionsOfExercise(e.id);
    const shared = intersect(baseRegions.primary, r.primary).length;
    const movement = jaccard(movementsOf(base.id), movementsOf(e.id)) * 4 + (planeOf(base.id) !== undefined && planeOf(base.id) === planeOf(e.id) ? 1 : 0);
    const score = jaccard(baseRegions.primary, r.primary) * 10 + movement + jaccard(baseRegions.secondary, r.secondary) * 3 + sameEquipment(e);
    return { e, shared, score };
  });

  const similar = scored.filter((s) => s.shared > 0).sort((a, b) => b.score - a.score || byName(a.e, b.e));
  const others = scored.filter((s) => s.shared === 0).sort((a, b) => byName(a.e, b.e));
  return { similar: similar.map((s) => s.e), others: others.map((s) => s.e) };
}

/**
 * Carga do exercício que entra no lugar de outro: a carga do antigo não vale para um movimento diferente,
 * então usa a do histórico do novo, senão a estimada pelo perfil, senão o padrão da biblioteca.
 */
export function substituteWeight(exercise: Exercise, reps: number | undefined, sessions: Session[], profile: Profile | null): number {
  const history = suggestNext(exercise.id, reps, sessions);
  if (history !== null) return history.weight ?? history.lastWeight;
  if (exercise.equipment === 'peso-corporal') return 0;
  const estimated = profile ? estimateLoad(exercise.id, profile.weightKg, profile.level) : null;
  return estimated ?? buildDayExerciseFromExercise(exercise).weight ?? 0;
}

/** Prescrição que o exercício terá se entrar no lugar de `original`, ex.: "4x12x65 kg" (cardio: "8 min"). */
export function substitutePrescription(original: DayExercise, exercise: Exercise, sessions: Session[], profile: Profile | null): string {
  if (original.type === 'cardio') return original.minutes != null ? `${original.minutes} min` : '';
  const weight = substituteWeight(exercise, original.reps, sessions, profile);
  const base = `${original.sets}x${original.reps ?? '-'}`;
  return weight > 0 ? `${base}x${formatKg(weight)} kg` : `${base} (peso corporal)`;
}
