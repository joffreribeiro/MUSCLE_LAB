// Anotação livre de um treino concluído (ex.: "Dormi mal. Ombro incomodou."). Funções puras.

export const NOTE_MAX_LENGTH = 500;

/** Atalhos de uma toque para os registros mais comuns. */
export const NOTE_TAGS = ['Dormi mal', 'Sem energia', 'Incômodo ou dor', 'Treino ótimo'] as const;

/** Texto pronto para salvar: sem espaços nas pontas e no máximo NOTE_MAX_LENGTH; vazio vira undefined. */
export function normalizeNote(text: string): string | undefined {
  const trimmed = text.trim().slice(0, NOTE_MAX_LENGTH).trim();
  return trimmed === '' ? undefined : trimmed;
}

const SEPARATOR = '. ';

/** O atalho já está no texto. */
export const hasTag = (text: string, tag: string): boolean => text.toLowerCase().includes(tag.toLowerCase());

/** Liga ou desliga um atalho no texto: se já está, tira; senão, acrescenta ao final. */
export function toggleTag(text: string, tag: string): string {
  if (!hasTag(text, tag)) {
    const base = text.trim().replace(/[.\s]+$/, '');
    return base === '' ? tag : `${base}${SEPARATOR}${tag}`;
  }
  const at = text.toLowerCase().indexOf(tag.toLowerCase());
  const before = text.slice(0, at).trim().replace(/[.\s]+$/, '');
  const after = text.slice(at + tag.length).trim().replace(/^[.\s]+/, '');
  return [before, after].filter(Boolean).join(SEPARATOR);
}
