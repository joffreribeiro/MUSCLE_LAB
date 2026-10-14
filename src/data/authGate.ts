// Porta de entrada do app: quando a conta na nuvem está configurada, é preciso entrar antes de usar.
// Sem a conta na nuvem configurada não há como entrar, então o app abre direto (senão ficaria trancado).

export type AuthGate = 'carregando' | 'login' | 'app';

export function authGate(input: { configured: boolean; authReady: boolean; hasUser: boolean }): AuthGate {
  if (!input.configured) return 'app';
  if (!input.authReady) return 'carregando';
  return input.hasUser ? 'app' : 'login';
}
