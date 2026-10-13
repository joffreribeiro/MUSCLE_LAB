// Cronômetros do treino (descanso e duração). Funções puras.

/**
 * Segundos a descontar a cada tique do relógio de 1 s. Normalmente 1; se o JavaScript ficou
 * pausado (tela bloqueada, app em segundo plano), é o tempo real que passou desde o tique anterior.
 * Nunca menos de 1, mesmo se o relógio do aparelho voltar atrás.
 */
export function tickDelta(lastMs: number, nowMs: number): number {
  return Math.max(1, Math.round((nowMs - lastMs) / 1000));
}
