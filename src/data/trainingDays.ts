// Dias da semana em que o usuário planeja treinar. Números como em Date.getDay():
// 0 = domingo, 1 = segunda … 6 = sábado. Funções puras: recebem "hoje" como parâmetro.

/** Ordem de exibição: a semana começa na segunda. */
export const WEEK_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

const SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const LONG = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

export const weekdayShort = (d: number): string => SHORT[d];
export const weekdayLong = (d: number): string => LONG[d];

/** Distribuição padrão para N treinos por semana, deixando dias de descanso entre os treinos. */
export function defaultTrainingDays(frequency: number): number[] {
  switch (Math.min(6, Math.max(2, Math.round(frequency)))) {
    case 2:
      return [1, 4];
    case 3:
      return [1, 3, 5];
    case 4:
      return [1, 2, 4, 5];
    case 5:
      return [1, 2, 3, 4, 5];
    default:
      return [1, 2, 3, 4, 5, 6];
  }
}

const sortByWeek = (days: number[]) => [...days].sort((a, b) => WEEK_DISPLAY_ORDER.indexOf(a as 0) - WEEK_DISPLAY_ORDER.indexOf(b as 0));

/** Dias salvos, se válidos; senão o padrão da frequência. Sempre em ordem de segunda a domingo. */
export function resolveTrainingDays(saved: number[] | undefined, frequency: number): number[] {
  const valid = Array.isArray(saved) && saved.length > 0 && saved.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  return sortByWeek(valid ? [...new Set(saved)] : defaultTrainingDays(frequency));
}

/** Liga ou desliga um dia. Nunca deixa a lista vazia: o último dia não pode ser removido. */
export function toggleTrainingDay(days: number[], day: number): number[] {
  if (!days.includes(day)) return sortByWeek([...days, day]);
  return days.length === 1 ? days : days.filter((d) => d !== day);
}

export const isTrainingDay = (days: number[], date: Date): boolean => days.includes(date.getDay());

/** Próximo dia de treino depois de hoje (de amanhã em diante); null se a lista está vazia. */
export function nextTrainingDate(days: number[], today: Date): Date | null {
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    if (days.includes(d.getDay())) return d;
  }
  return null;
}

/**
 * Dias de treino depois de mudar a frequência semanal. Se os dias salvos acompanhavam a frequência
 * antiga (mesma quantidade), vira o padrão da nova; se o usuário montou outro plano, mantém os dele.
 * Devolve undefined quando nada precisa mudar.
 */
export function daysAfterFrequencyChange(saved: number[] | undefined, oldFrequency: number, newFrequency: number): number[] | undefined {
  if (oldFrequency === newFrequency) return undefined;
  const current = resolveTrainingDays(saved, oldFrequency);
  return current.length === oldFrequency ? defaultTrainingDays(newFrequency) : undefined;
}
