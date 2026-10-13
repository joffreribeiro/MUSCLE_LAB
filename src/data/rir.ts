// RIR (repetições em reserva): quantas repetições ainda dava para fazer ao terminar a série.
// Escala de 0 a 4; o valor 4 representa "4 ou mais".

export const RIR_VALUES = [0, 1, 2, 3, 4] as const;
export type Rir = (typeof RIR_VALUES)[number];

export const rirChipLabel = (n: number) => (n >= 4 ? '4+' : String(n));

const RIR_HINTS: Record<number, string> = {
  0: 'Falha: não conseguiria fazer mais nenhuma repetição.',
  1: 'Pararia na próxima: dava para fazer só mais 1.',
  2: 'Dava para fazer mais 2. Faixa muito usada para hipertrofia.',
  3: 'Dava para fazer mais 3. Esforço moderado.',
  4: 'Dava para fazer 4 ou mais: série leve, longe da falha.',
};

export const rirHint = (n: number) => RIR_HINTS[Math.min(4, Math.max(0, n))];

export const RIR_EXPLANATION =
  'RIR é o número de repetições que você ainda conseguiria fazer ao terminar a série. ' +
  'Quanto mais perto de 0, mais perto da falha.';

/** Texto curto para o histórico, ex.: "RIR 2". */
export const rirTag = (n: number) => `RIR ${rirChipLabel(n)}`;

/** Média de RIR das séries que têm o dado; null se nenhuma foi registrada. */
export function averageRir(values: (number | undefined)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === 'number');
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Leitura da média, para o resumo do treino. */
export function rirAverageNote(avg: number): string {
  if (avg < 1) return 'Treino muito intenso: séries na falha ou quase.';
  if (avg < 2.5) return 'Boa faixa para hipertrofia: perto da falha, mas com técnica.';
  if (avg < 3.5) return 'Esforço moderado. Se o objetivo é crescer, dá para aproximar da falha.';
  return 'Séries folgadas. Considere aumentar a carga.';
}
