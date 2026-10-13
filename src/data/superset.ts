import type { DayExercise } from '../types';

// Bi-set e tri-set: 2 ou 3 exercícios seguidos feitos em sequência, sem descanso entre eles; o
// descanso vem só ao fim de cada rodada. Os exercícios do grupo ficam um ao lado do outro na lista
// e compartilham o mesmo `supersetId`. Funções puras.

/** Quantos exercícios cabem num grupo (bi-set = 2, tri-set = 3). */
export const MAX_GROUP_SIZE = 3;

export interface SupersetGroup {
  id: string;
  /** Posições dos exercícios na lista, em ordem. */
  indices: number[];
}

const linkable = (e: DayExercise | undefined): e is DayExercise => !!e && e.type !== 'cardio';

/** Grupo (com 2 ou mais exercícios seguidos de mesmo id) que contém a posição `index`, ou null. */
export function groupAt(exercises: DayExercise[], index: number): SupersetGroup | null {
  const id = exercises[index]?.supersetId;
  if (!id) return null;
  let start = index;
  while (start > 0 && exercises[start - 1].supersetId === id) start -= 1;
  let end = index;
  while (end < exercises.length - 1 && exercises[end + 1].supersetId === id) end += 1;
  if (end === start) return null;
  return { id, indices: Array.from({ length: end - start + 1 }, (_, i) => start + i) };
}

export const groupLabel = (size: number): string => (size >= 3 ? 'Tri-set' : 'Bi-set');

/**
 * Tira os vínculos que não valem mais: exercício sozinho, não contíguo, cardio ou grupo grande
 * demais. Chamada depois de qualquer mudança na lista (mover, remover, trocar).
 */
export function normalizeSupersets(exercises: DayExercise[]): DayExercise[] {
  let changed = false;
  const out = exercises.map((e, i) => {
    if (!e.supersetId) return e;
    const g = groupAt(exercises, i);
    const ok = linkable(e) && g !== null && g.indices.length <= MAX_GROUP_SIZE && g.indices.every((j) => linkable(exercises[j]));
    if (ok) return e;
    changed = true;
    const { supersetId: _drop, ...rest } = e;
    return rest as DayExercise;
  });
  return changed ? out : exercises;
}

/**
 * Liga ou separa o exercício `index` e o seguinte. Ligados: separa nesse ponto. Soltos: liga,
 * criando um grupo (`newId`) ou entrando no grupo vizinho, desde que não passe de MAX_GROUP_SIZE.
 */
export function toggleLink(exercises: DayExercise[], index: number, newId: string): DayExercise[] {
  const a = exercises[index];
  const b = exercises[index + 1];
  if (!linkable(a) || !linkable(b)) return exercises;

  const set = (list: DayExercise[], at: number, id: string | undefined) =>
    list.map((e, i) => {
      if (i !== at) return e;
      if (id === undefined) {
        const { supersetId: _drop, ...rest } = e;
        return rest as DayExercise;
      }
      return { ...e, supersetId: id };
    });

  // Já estão no mesmo grupo: separa. Os de trás ficam com o id antigo; os da frente ganham um novo.
  if (a.supersetId && a.supersetId === b.supersetId) {
    const g = groupAt(exercises, index)!;
    let next = exercises;
    for (const i of g.indices) if (i > index) next = set(next, i, newId);
    return normalizeSupersets(next);
  }

  const gA = groupAt(exercises, index);
  const gB = groupAt(exercises, index + 1);
  const sizeA = gA ? gA.indices.length : 1;
  const sizeB = gB ? gB.indices.length : 1;
  if (sizeA + sizeB > MAX_GROUP_SIZE) return exercises;

  const id = gA?.id ?? gB?.id ?? newId;
  let next = exercises;
  for (const i of [...(gA?.indices ?? [index]), ...(gB?.indices ?? [index + 1])]) next = set(next, i, id);
  return next;
}

export interface AfterSet {
  /** Posição do exercício para onde ir; null = ficar no atual. */
  goTo: number | null;
  /** Começa o descanso (fim da rodada). */
  rest: boolean;
}

/**
 * O que fazer depois de registrar uma série no exercício `index`. Fora de grupo: descansa e fica.
 * Em grupo: segue para o próximo exercício da rodada sem descansar; ao fim da rodada, descansa e
 * volta ao primeiro que ainda tem séries. `done(id)` já deve contar a série que acabou de ser registrada.
 */
export function afterSet(exercises: DayExercise[], index: number, done: (exerciseId: string) => number): AfterSet {
  const g = groupAt(exercises, index);
  if (!g) return { goTo: null, rest: true };
  const remaining = (i: number) => done(exercises[i].exerciseId) < exercises[i].sets;
  const pos = g.indices.indexOf(index);

  for (let j = pos + 1; j < g.indices.length; j++) {
    if (remaining(g.indices[j])) return { goTo: g.indices[j], rest: false };
  }
  for (let j = 0; j <= pos; j++) {
    if (remaining(g.indices[j])) return { goTo: g.indices[j] === index ? null : g.indices[j], rest: true };
  }
  return { goTo: null, rest: true };
}
