// Calculadora de anilhas: quais discos colocar em cada lado da barra para chegar a uma carga.
// Funções puras.

/** Anilhas disponíveis na maioria das academias, em kg, da maior para a menor. */
export const DEFAULT_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

export interface BarOption {
  kg: number;
  label: string;
}

export const BARS: BarOption[] = [
  { kg: 20, label: 'Olímpica 20 kg' },
  { kg: 15, label: 'Feminina 15 kg' },
  { kg: 10, label: 'Curta 10 kg' },
];

export const DEFAULT_BAR_KG = 20;

export interface PlateCount {
  plate: number;
  count: number;
}

export interface PlateResult {
  /** Anilhas de cada lado, da maior (mais perto do centro) para a menor. */
  perSide: PlateCount[];
  /** Carga realmente montada (barra + anilhas dos dois lados). */
  achieved: number;
  /** Quanto falta para a carga pedida (0 quando dá certinho). */
  missing: number;
  /** A carga pedida é menor que a própria barra. */
  belowBar: boolean;
}

const EPS = 1e-9;
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Monta a carga `target` (kg, barra incluída) com as anilhas dadas, simétrica nos dois lados. Usa as
 * maiores primeiro. Se a carga não for exata com essas anilhas, devolve a mais próxima abaixo dela.
 */
export function calcPlates(target: number, barKg: number, plates: number[] = DEFAULT_PLATES): PlateResult {
  if (!Number.isFinite(target) || target < barKg) {
    return { perSide: [], achieved: Number.isFinite(barKg) ? barKg : 0, missing: 0, belowBar: Number.isFinite(target) && target < barKg };
  }
  const sorted = [...plates].filter((p) => p > 0).sort((a, b) => b - a);
  let rest = (target - barKg) / 2;
  const perSide: PlateCount[] = [];
  for (const plate of sorted) {
    const count = Math.floor(rest / plate + EPS);
    if (count > 0) {
      perSide.push({ plate, count });
      rest -= count * plate;
    }
  }
  const used = perSide.reduce((sum, p) => sum + p.plate * p.count, 0);
  const achieved = round2(barKg + 2 * used);
  return { perSide, achieved, missing: round2(Math.max(0, target - achieved)), belowBar: false };
}

/** "20 kg", "2,5 kg": anilha com vírgula. */
export const formatPlate = (plate: number): string => `${String(plate).replace('.', ',')} kg`;

/** Cor de cada anilha (padrão internacional de competição); fora da lista, cinza. */
export const PLATE_COLOR: Record<number, string> = {
  25: '#D64550',
  20: '#2F6FD0',
  15: '#E8B930',
  10: '#2E9E5B',
  5: '#E9EDF0',
  2.5: '#3A3F45',
  1.25: '#B5BCC4',
};

/** Altura relativa (0 a 1) de cada anilha no desenho: as maiores são mais altas. */
export const plateHeight = (plate: number): number => 0.35 + 0.65 * Math.min(1, plate / 25);
