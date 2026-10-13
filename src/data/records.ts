import type { Session, SetLog } from '../types';

// Evolução e recordes por exercício, a partir das sessões concluídas. Funções puras.
//   1RM estimado: fórmula de Epley, confiável até cerca de 12 repetições.
//   Exercícios sem carga (peso corporal) são comparados pelo máximo de repetições.

/** Acima disso a estimativa de 1RM perde confiança e a série não entra no cálculo. */
export const MAX_REPS_FOR_1RM = 12;

/** 1RM estimado (kg), arredondado a 0,5; null se a série não permite estimar. */
export function estimate1RM(weight: number, reps: number): number | null {
  if (weight <= 0 || reps <= 0 || reps > MAX_REPS_FOR_1RM) return null;
  const raw = reps === 1 ? weight : weight * (1 + reps / 30);
  return Math.round(raw * 2) / 2;
}

const isWorkSet = (s: SetLog) => s.reps > 0 && !s.minutes;

export interface EvolutionPoint {
  dateISO: string;
  /** Melhor 1RM estimado da sessão; null se nenhuma série permite estimar. */
  e1rm: number | null;
  topWeight: number;
  topReps: number;
  volume: number;
}

export interface ExerciseRecords {
  /** Maior carga já usada, com as repetições feitas nela. */
  maxWeight: { kg: number; reps: number; dateISO: string } | null;
  best1RM: { kg: number; dateISO: string } | null;
  /** Maior número de repetições numa série (usado em exercícios de peso corporal). */
  maxReps: { reps: number; dateISO: string } | null;
}

export interface ExerciseEvolution {
  /** Da sessão mais antiga para a mais recente. */
  points: EvolutionPoint[];
  records: ExerciseRecords;
  /** Exercício feito sem carga em todas as sessões. */
  bodyweight: boolean;
}

const setsOf = (session: Session, exerciseId: string) => session.sets.filter((s) => s.exerciseId === exerciseId && isWorkSet(s));

function recordsOf(sessions: Session[], exerciseId: string): ExerciseRecords {
  const records: ExerciseRecords = { maxWeight: null, best1RM: null, maxReps: null };
  for (const session of sessions) {
    for (const s of setsOf(session, exerciseId)) {
      const dateISO = session.finishedAtISO;
      if (s.weight > 0 && (!records.maxWeight || s.weight > records.maxWeight.kg || (s.weight === records.maxWeight.kg && s.reps > records.maxWeight.reps))) {
        records.maxWeight = { kg: s.weight, reps: s.reps, dateISO };
      }
      const e = estimate1RM(s.weight, s.reps);
      if (e !== null && (!records.best1RM || e > records.best1RM.kg)) records.best1RM = { kg: e, dateISO };
      if (!records.maxReps || s.reps > records.maxReps.reps) records.maxReps = { reps: s.reps, dateISO };
    }
  }
  return records;
}

/** `sessions` em qualquer ordem. */
export function exerciseEvolution(exerciseId: string, sessions: Session[]): ExerciseEvolution {
  const ordered = [...sessions].sort((a, b) => a.finishedAtISO.localeCompare(b.finishedAtISO));
  const points: EvolutionPoint[] = [];
  for (const session of ordered) {
    const sets = setsOf(session, exerciseId);
    if (sets.length === 0) continue;
    let e1rm: number | null = null;
    let top = sets[0];
    for (const s of sets) {
      const e = estimate1RM(s.weight, s.reps);
      if (e !== null && (e1rm === null || e > e1rm)) e1rm = e;
      if (s.weight > top.weight || (s.weight === top.weight && s.reps > top.reps)) top = s;
    }
    points.push({
      dateISO: session.finishedAtISO,
      e1rm,
      topWeight: top.weight,
      topReps: top.reps,
      volume: sets.reduce((sum, s) => sum + s.weight * s.reps, 0),
    });
  }
  return { points, records: recordsOf(ordered, exerciseId), bodyweight: points.length > 0 && points.every((p) => p.topWeight === 0) };
}

export type RecordKind = 'carga' | '1rm' | 'reps';

export interface NewRecord {
  exerciseId: string;
  kind: RecordKind;
  /** Valor novo e o recorde anterior (kg ou repetições). */
  value: number;
  previous: number;
}

/**
 * Recordes batidos em `session` em relação às sessões anteriores. Quem faz um exercício pela
 * primeira vez não bate recorde (não há o que superar). Por exercício, carga máxima e 1RM
 * são verificados separadamente; exercícios de peso corporal usam repetições.
 */
export function newRecords(session: Session, previous: Session[]): NewRecord[] {
  const out: NewRecord[] = [];
  const ids = [...new Set(session.sets.filter(isWorkSet).map((s) => s.exerciseId))];
  for (const exerciseId of ids) {
    const before = recordsOf(previous, exerciseId);
    const now = recordsOf([session], exerciseId);
    if (!before.maxReps) continue;

    if (now.maxWeight && before.maxWeight) {
      if (now.maxWeight.kg > before.maxWeight.kg) out.push({ exerciseId, kind: 'carga', value: now.maxWeight.kg, previous: before.maxWeight.kg });
      if (now.best1RM && before.best1RM && now.best1RM.kg > before.best1RM.kg) {
        out.push({ exerciseId, kind: '1rm', value: now.best1RM.kg, previous: before.best1RM.kg });
      }
    } else if (!now.maxWeight && !before.maxWeight && now.maxReps && now.maxReps.reps > before.maxReps.reps) {
      out.push({ exerciseId, kind: 'reps', value: now.maxReps.reps, previous: before.maxReps.reps });
    }
  }
  return out;
}
