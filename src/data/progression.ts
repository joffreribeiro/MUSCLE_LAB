import type { Session, SetLog } from '../types';

// Sugestão de carga para o próximo treino, a partir da última sessão em que o
// exercício foi feito. Regras (progressão baseada em RIR, a faixa mais usada para hipertrofia):
//   RIR médio >= 3        sobrou bastante: subir a carga
//   RIR médio entre 1 e 3 faixa ideal: manter a carga e buscar mais uma repetição
//   RIR médio < 1         foi à falha: manter; se as repetições caíram muito, reduzir
// Só séries na carga de trabalho (a maior da sessão) entram na conta.

/** A partir deste RIR médio a carga está leve demais. */
export const RIR_RAISE_AT = 3;
/** Abaixo deste RIR médio a série foi (quase) até a falha. */
export const RIR_FAILURE_BELOW = 1;
/** Quantas repetições abaixo da meta, na falha, justificam reduzir a carga. */
export const REPS_SHORTFALL_TO_REDUCE = 2;

export type SuggestionKind = 'aumentar' | 'manter' | 'reduzir' | 'sem-rir';

export interface Suggestion {
  kind: SuggestionKind;
  /** Carga sugerida (igual à última em 'manter'); ausente em 'sem-rir'. */
  weight?: number;
  /** Carga de trabalho da última sessão. */
  lastWeight: number;
  /** Séries feitas nessa carga e média de repetições. */
  lastSets: number;
  lastReps: number;
  /** Média de RIR das séries na carga de trabalho; null se nenhuma tem RIR. */
  avgRir: number | null;
  lastDateISO: string;
  message: string;
}

/** Passo de carga: anilhas pequenas em cargas leves, saltos maiores em cargas altas. */
export function weightStep(weight: number): number {
  if (weight < 20) return 1;
  if (weight < 60) return 2.5;
  return 5;
}

const roundHalf = (n: number) => Math.round(n * 2) / 2;

/** Formata kg em pt-BR sem zeros à toa: 40 -> "40", 42.5 -> "42,5". */
export const formatKg = (n: number) => String(roundHalf(n)).replace('.', ',');

const fmtRir = (n: number) => n.toFixed(1).replace('.', ',');

/** Séries de força de um exercício dentro de uma sessão (cardio e séries zeradas ficam de fora). */
const strengthSets = (session: Session, exerciseId: string): SetLog[] =>
  session.sets.filter((s) => s.exerciseId === exerciseId && s.weight > 0 && s.reps > 0);

/**
 * Sugere a carga da próxima vez. `sessions` deve estar da mais recente para a mais antiga.
 * Retorna null se o exercício nunca foi feito.
 */
export function suggestNext(
  exerciseId: string,
  targetReps: number | undefined,
  sessions: Session[],
): Suggestion | null {
  const session = sessions.find((s) => strengthSets(s, exerciseId).length > 0);
  if (!session) return null;

  const all = strengthSets(session, exerciseId);
  const lastWeight = Math.max(...all.map((s) => s.weight));
  const working = all.filter((s) => s.weight === lastWeight);
  const lastReps = working.reduce((a, s) => a + s.reps, 0) / working.length;
  const rirValues = working.map((s) => s.rir).filter((r): r is number => typeof r === 'number');
  const avgRir = rirValues.length ? rirValues.reduce((a, b) => a + b, 0) / rirValues.length : null;

  const base = {
    lastWeight,
    lastSets: working.length,
    lastReps: Math.round(lastReps * 10) / 10,
    avgRir,
    lastDateISO: session.finishedAtISO,
  };
  const step = weightStep(lastWeight);

  if (avgRir === null) {
    return {
      ...base,
      kind: 'sem-rir',
      message: 'Registre o RIR das séries para receber uma sugestão de carga.',
    };
  }

  if (avgRir >= RIR_RAISE_AT) {
    const weight = roundHalf(lastWeight + step);
    return {
      ...base,
      kind: 'aumentar',
      weight,
      message: `Sobrou bastante (RIR médio ${fmtRir(avgRir)}). Suba para ${formatKg(weight)} kg.`,
    };
  }

  if (avgRir < RIR_FAILURE_BELOW) {
    const fellShort = targetReps !== undefined && lastReps <= targetReps - REPS_SHORTFALL_TO_REDUCE;
    if (fellShort) {
      const weight = roundHalf(Math.max(step, lastWeight - step));
      return {
        ...base,
        kind: 'reduzir',
        weight,
        message: `Foi à falha e ficou abaixo da meta de ${targetReps} repetições. Tente ${formatKg(weight)} kg.`,
      };
    }
    return {
      ...base,
      kind: 'manter',
      weight: lastWeight,
      message: `Foi até a falha. Repita ${formatKg(lastWeight)} kg e cuide da técnica.`,
    };
  }

  return {
    ...base,
    kind: 'manter',
    weight: lastWeight,
    message: `Boa faixa (RIR médio ${fmtRir(avgRir)}). Repita ${formatKg(lastWeight)} kg e tente uma repetição a mais por série.`,
  };
}
