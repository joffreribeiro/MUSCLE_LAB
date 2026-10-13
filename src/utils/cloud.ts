import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Backup } from '../data/backup';
import { CloudApi, RemoteSnapshot } from '../data/cloudSync';

// Conexão com o Supabase: login e leitura/gravação da cópia dos dados da conta. A URL e a chave
// pública (anon) vêm de variáveis EXPO_PUBLIC_* (arquivo .env). A chave anon é pública por desenho;
// quem protege os dados é a regra de acesso por linha da tabela (supabase/schema.sql).

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** A sincronização só existe quando o Supabase está configurado. */
export const cloudConfigured = Boolean(URL && ANON_KEY);

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!URL || !ANON_KEY) throw new Error('Sincronização não configurada.');
  if (!client) {
    client = createClient(URL, ANON_KEY, {
      auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    });
  }
  return client;
}

export interface CloudUser {
  id: string;
  email: string;
}

const toUser = (u: { id: string; email?: string | null } | null | undefined): CloudUser | null =>
  u ? { id: u.id, email: u.email ?? '' } : null;

/** Usuário já conectado neste aparelho, se houver. */
export async function currentUser(): Promise<CloudUser | null> {
  if (!cloudConfigured) return null;
  const { data, error } = await getClient().auth.getSession();
  if (error) throw error;
  return toUser(data.session?.user);
}

/** Avisa quando o login muda (entrar, sair, sessão expirada). Devolve a função que cancela. */
export function onUserChange(callback: (user: CloudUser | null) => void): () => void {
  if (!cloudConfigured) return () => {};
  const { data } = getClient().auth.onAuthStateChange((_event, session) => callback(toUser(session?.user)));
  return () => data.subscription.unsubscribe();
}

export async function signIn(email: string, password: string): Promise<CloudUser> {
  const { data, error } = await getClient().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return toUser(data.user)!;
}

/** Cria a conta. `needsConfirmation`: o Supabase exige confirmar o e-mail antes do primeiro login. */
export async function signUp(email: string, password: string): Promise<{ user: CloudUser | null; needsConfirmation: boolean }> {
  const { data, error } = await getClient().auth.signUp({ email: email.trim(), password });
  if (error) throw error;
  return { user: toUser(data.session?.user), needsConfirmation: !data.session };
}

export async function signOut(): Promise<void> {
  const { error } = await getClient().auth.signOut();
  if (error) throw error;
}

/** Acesso à cópia dos dados da conta `userId`. */
export function makeCloudApi(userId: string): CloudApi {
  return {
    async fetchRemote(): Promise<RemoteSnapshot | null> {
      const { data, error } = await getClient().from('backups').select('data, updated_at').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data ? { backup: data.data, updatedAt: data.updated_at as string } : null;
    },
    async pushRemote(backup: Backup): Promise<string> {
      const { data, error } = await getClient().from('backups').upsert({ user_id: userId, data: backup }).select('updated_at').single();
      if (error) throw error;
      return data.updated_at as string;
    },
  };
}
