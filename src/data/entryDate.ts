import { formatSessionDate } from '../utils/format';

// Data de um registro (peso e medidas): hoje ou um dia anterior. Funções puras.

/** Até quantos dias atrás dá para registrar. */
export const MAX_DAYS_AGO = 365;

/**
 * Data do registro `daysAgo` dias antes de `now`. Hoje usa o instante atual; dias passados usam o
 * meio-dia local, para o dia não mudar por causa de fuso horário.
 */
export function entryDateISO(daysAgo: number, now: Date): string {
  if (daysAgo <= 0) return now.toISOString();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, 12).toISOString();
}

/** "Hoje", "Ontem" ou "Seg., 05.10.2026". */
export function describeEntryDay(daysAgo: number, now: Date): string {
  if (daysAgo <= 0) return 'Hoje';
  if (daysAgo === 1) return 'Ontem';
  return formatSessionDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo));
}

/** Mantém o recuo entre 0 e MAX_DAYS_AGO. */
export const clampDaysAgo = (n: number): number => Math.min(MAX_DAYS_AGO, Math.max(0, Math.round(n)));
