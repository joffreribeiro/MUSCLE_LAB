import { roundLoad } from './programGenerator';

// Séries de aquecimento sugeridas antes da primeira série de trabalho de um exercício de força.
// São uma orientação (não entram no histórico nem nas estatísticas). Funções puras.

/** Abaixo desta carga o aquecimento do próprio movimento (ou o da bicicleta) já basta. */
export const WARMUP_MIN_KG = 30;
/** A partir desta carga o aquecimento ganha uma série a mais. */
export const WARMUP_HEAVY_KG = 60;

export interface WarmupSet {
  kg: number;
  reps: number;
}

/** Percentuais da carga de trabalho e repetições: leve e mais repetições, subindo e diminuindo as repetições. */
const LIGHT: [number, number][] = [
  [0.5, 10],
  [0.75, 5],
];
const HEAVY: [number, number][] = [
  [0.4, 10],
  [0.6, 6],
  [0.8, 3],
];

/** Aquecimento para uma carga de trabalho `workingKg`; vazio para cargas leves. */
export function warmupSets(workingKg: number): WarmupSet[] {
  if (!Number.isFinite(workingKg) || workingKg < WARMUP_MIN_KG) return [];
  const plan = workingKg >= WARMUP_HEAVY_KG ? HEAVY : LIGHT;
  const out: WarmupSet[] = [];
  for (const [pct, reps] of plan) {
    const kg = roundLoad(workingKg * pct);
    const previous = out[out.length - 1];
    // O arredondamento pode repetir a carga anterior ou encostar na de trabalho: essas séries não ajudam.
    if (kg >= workingKg || (previous && kg <= previous.kg)) continue;
    out.push({ kg, reps });
  }
  return out;
}
