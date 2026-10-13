// Mensagens de erro da conta e da sincronização, em português claro. Funções puras.

/** Traduz erros comuns do login e da rede; o que não for conhecido vira uma mensagem genérica. */
export function friendlyCloudError(raw: unknown): string {
  const message = (raw instanceof Error ? raw.message : typeof raw === 'string' ? raw : '').toLowerCase();
  if (!message) return 'Algo deu errado. Tente de novo.';
  if (message.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('email not confirmed')) return 'Confirme seu e-mail pelo link que enviamos e entre de novo.';
  if (message.includes('already registered') || message.includes('already been registered')) return 'Este e-mail já tem conta. Use "Entrar".';
  if (message.includes('at least') && message.includes('character')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (message.includes('valid email') || message.includes('invalid email') || message.includes('unable to validate email'))
    return 'Digite um e-mail válido.';
  if (message.includes('rate limit') || message.includes('too many requests')) return 'Muitas tentativas. Espere um pouco e tente de novo.';
  if (message.includes('network') || message.includes('failed to fetch') || message.includes('fetch failed') || message.includes('timeout'))
    return 'Sem conexão com a internet. Tente de novo quando estiver online.';
  if (message.includes('row-level security') || message.includes('permission denied') || message.includes('relation') && message.includes('does not exist'))
    return 'A nuvem não está preparada para este app (tabela ou permissões ausentes). Rode o arquivo supabase/schema.sql no seu projeto.';
  // Mensagens nossas (CloudDataError) já vêm em português.
  if (/[ãáâéêíóôõúç]/.test(message)) return typeof raw === 'string' ? raw : (raw as Error).message;
  return 'Algo deu errado. Tente de novo.';
}

/** Valida e-mail e senha do formulário antes de ir à rede; devolve a mensagem do problema ou null. */
export function validateCredentials(email: string, password: string): string | null {
  const e = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'Digite um e-mail válido.';
  if (password.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
  return null;
}
