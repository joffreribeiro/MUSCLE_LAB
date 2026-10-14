// Mensagens de erro da conta e da sincronização, em português claro. Funções puras.

/** Traduz erros comuns do login e da rede; o que não for conhecido vira uma mensagem genérica. */
export function friendlyCloudError(raw: unknown): string {
  const message = (raw instanceof Error ? raw.message : typeof raw === 'string' ? raw : '').toLowerCase();
  if (!message) return 'Algo deu errado. Tente de novo.';
  if (message.includes('invalid-credential') || message.includes('wrong-password') || message.includes('user-not-found') || message.includes('invalid login credentials'))
    return 'E-mail ou senha incorretos.';
  if (message.includes('email-already-in-use') || message.includes('already registered')) return 'Este e-mail já tem conta. Use "Entrar".';
  if (message.includes('weak-password') || (message.includes('at least') && message.includes('character'))) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (message.includes('invalid-email') || message.includes('valid email') || message.includes('missing-email')) return 'Digite um e-mail válido.';
  if (message.includes('too-many-requests') || message.includes('rate limit')) return 'Muitas tentativas. Espere um pouco e tente de novo.';
  if (message.includes('user-disabled')) return 'Esta conta foi desativada.';
  if (message.includes('network') || message.includes('failed to fetch') || message.includes('fetch failed') || message.includes('timeout') || message.includes('unavailable') || message.includes('offline'))
    return 'Sem conexão com a internet. Tente de novo quando estiver online.';
  if (message.includes('permission-denied') || message.includes('insufficient permissions'))
    return 'A nuvem não está preparada para este app (regras do Firestore ausentes). Publique o arquivo firebase/firestore.rules no seu projeto.';
  if (message.includes('api-key-not-valid') || message.includes('invalid-api-key')) return 'A chave do Firebase no arquivo .env está incorreta. Confira as variáveis EXPO_PUBLIC_FIREBASE_*.';
  if (message.includes('operation-not-allowed')) return 'Login por e-mail e senha não está ativado no projeto Firebase.';
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
