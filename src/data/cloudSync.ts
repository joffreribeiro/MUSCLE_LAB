import { Backup, BackupData, buildBackup, parseBackup } from './backup';

// Sincronização dos dados com a nuvem. O app guarda uma cópia completa (o mesmo formato do backup)
// por conta. A regra é simples e nunca descarta dados em silêncio: se os dois lados mudaram desde
// a última sincronização, é conflito e quem decide é o usuário. Funções puras: a rede entra por `CloudApi`.

/** O que o servidor guarda por conta. */
export interface RemoteSnapshot {
  /** Cópia completa, no formato do backup. */
  backup: unknown;
  /** Marca de modificação do servidor; só é comparada por igualdade. */
  updatedAt: string;
}

/** Acesso ao servidor (implementado com Supabase; nos testes, uma versão em memória). */
export interface CloudApi {
  fetchRemote(): Promise<RemoteSnapshot | null>;
  /** Grava a cópia e devolve a nova marca de modificação. */
  pushRemote(backup: Backup): Promise<string>;
}

/** Lembrete do que já foi sincronizado neste aparelho. */
export interface SyncMeta {
  /** Impressão digital dos dados na última sincronização. */
  lastSyncedHash: string | null;
  /** Marca do servidor na última sincronização. */
  lastRemoteUpdatedAt: string | null;
}

export const EMPTY_SYNC_META: SyncMeta = { lastSyncedHash: null, lastRemoteUpdatedAt: null };

/** Impressão digital (djb2) do conteúdo: iguais se e só se os dados forem iguais (para detectar mudanças locais). */
export function hashData(data: BackupData): string {
  const text = JSON.stringify(data);
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `${(h >>> 0).toString(16)}:${text.length}`;
}

/** Aparelho sem nada de uso (novo): pode receber os dados da nuvem sem perguntar. */
export function isLocalEmpty(data: BackupData): boolean {
  return data.sessions.length === 0 && data.weights.length === 0 && data.measures.length === 0 && Object.keys(data.comments).length === 0;
}

export type SyncDecision = 'noop' | 'push' | 'pull' | 'conflict';

export function decideSync(input: {
  localHash: string;
  localEmpty: boolean;
  meta: SyncMeta;
  remoteUpdatedAt: string | null;
}): SyncDecision {
  const { localHash, localEmpty, meta, remoteUpdatedAt } = input;
  const dirty = meta.lastSyncedHash === null || localHash !== meta.lastSyncedHash;

  if (remoteUpdatedAt === null) return localEmpty ? 'noop' : 'push';

  // Primeira sincronização neste aparelho, mas a conta já tem dados.
  if (meta.lastSyncedHash === null) return localEmpty ? 'pull' : 'conflict';

  const remoteChanged = remoteUpdatedAt !== meta.lastRemoteUpdatedAt;
  if (!remoteChanged) return dirty ? 'push' : 'noop';
  return dirty ? 'conflict' : 'pull';
}

export interface SyncResult {
  outcome: 'noop' | 'pushed' | 'pulled' | 'conflict';
  meta: SyncMeta;
  /** Dados recebidos da nuvem, quando outcome = 'pulled'. */
  pulled?: BackupData;
  /** Em conflito: quando e quanto de dados há na nuvem, para o usuário decidir. */
  remoteInfo?: { updatedAt: string; data: BackupData };
}

export class CloudDataError extends Error {}

function readRemote(snapshot: RemoteSnapshot): BackupData {
  const parsed = parseBackup(typeof snapshot.backup === 'string' ? snapshot.backup : JSON.stringify(snapshot.backup));
  if (!parsed.ok) throw new CloudDataError('Os dados da nuvem não estão num formato que este app entende. Atualize o app e tente de novo.');
  return parsed.backup.data;
}

/**
 * Uma rodada de sincronização. `force` resolve um conflito: 'local' envia este aparelho para a nuvem,
 * 'remote' substitui este aparelho pelo que está na nuvem.
 */
export async function runSync(api: CloudApi, local: BackupData, meta: SyncMeta, now: Date, force?: 'local' | 'remote'): Promise<SyncResult> {
  const remote = await api.fetchRemote();
  const localHash = hashData(local);

  const decision: SyncDecision =
    force === 'local'
      ? 'push'
      : force === 'remote'
        ? 'pull'
        : decideSync({ localHash, localEmpty: isLocalEmpty(local), meta, remoteUpdatedAt: remote ? remote.updatedAt : null });

  if (decision === 'noop') return { outcome: 'noop', meta };

  if (decision === 'push') {
    const updatedAt = await api.pushRemote(buildBackup(local, now));
    return { outcome: 'pushed', meta: { lastSyncedHash: localHash, lastRemoteUpdatedAt: updatedAt } };
  }

  if (!remote) throw new CloudDataError('Não há dados na nuvem para restaurar.');
  const remoteData = readRemote(remote);

  if (decision === 'pull') {
    return { outcome: 'pulled', pulled: remoteData, meta: { lastSyncedHash: hashData(remoteData), lastRemoteUpdatedAt: remote.updatedAt } };
  }

  return { outcome: 'conflict', meta, remoteInfo: { updatedAt: remote.updatedAt, data: remoteData } };
}
