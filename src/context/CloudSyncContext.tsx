import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWorkout } from './WorkoutContext';
import { useBackupData } from './useBackupData';
import { BackupData, summarizeBackup, BackupSummary } from '../data/backup';
import { CloudApi, EMPTY_SYNC_META, hashData, runSync, SyncMeta } from '../data/cloudSync';
import { friendlyCloudError } from '../data/cloudErrors';
import { cloudConfigured, CloudUser, currentUser, makeCloudApi, onUserChange, signIn as cloudSignIn, signOut as cloudSignOut, signUp as cloudSignUp, resetPassword as cloudResetPassword } from '../utils/cloud';

const META_KEY = '@app-treino/syncMeta';
/** Espera depois da última mudança antes de enviar (junta várias mudanças seguidas). */
const PUSH_DEBOUNCE_MS = 8000;

export type SyncStatus = 'desligada' | 'ociosa' | 'sincronizando' | 'conflito' | 'erro';

export interface ConflictInfo {
  /** Resumo do que há na nuvem, para o usuário decidir. */
  cloud: BackupSummary;
  /** Resumo do que há neste aparelho. */
  local: BackupSummary;
}

interface CloudSyncValue {
  /** O app foi configurado com um projeto Firebase. */
  configured: boolean;
  /** Já se sabe se há uma sessão aberta neste aparelho (evita piscar a tela de login). */
  authReady: boolean;
  user: CloudUser | null;
  status: SyncStatus;
  /** Mensagem de erro ou de aviso a mostrar. */
  message: string | null;
  lastSyncISO: string | null;
  conflict: ConflictInfo | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  /** needsConfirmation: o e-mail precisa ser confirmado antes de entrar. */
  signUp: (email: string, password: string) => Promise<{ ok: boolean; needsConfirmation: boolean }>;
  /** Envia o e-mail para criar uma nova senha. */
  resetPassword: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  resolveConflict: (keep: 'local' | 'cloud') => Promise<void>;
}

const CloudSyncContext = createContext<CloudSyncValue | undefined>(undefined);

interface Persisted {
  meta: SyncMeta;
  lastSyncISO: string | null;
}

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const { hydrated, restoreBackup } = useWorkout();
  const data = useBackupData();
  const dataHash = useMemo(() => hashData(data), [data]);

  const [user, setUser] = useState<CloudUser | null>(null);
  const [authReady, setAuthReady] = useState(!cloudConfigured);
  const [status, setStatus] = useState<SyncStatus>(cloudConfigured ? 'ociosa' : 'desligada');
  const [message, setMessage] = useState<string | null>(null);
  const [lastSyncISO, setLastSyncISO] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictInfo | null>(null);

  const metaRef = useRef<SyncMeta>(EMPTY_SYNC_META);
  const metaLoaded = useRef(false);
  const busy = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;
  // Depois de receber dados da nuvem, a impressão digital do que ficou no app pode diferir um pouco
  // (valores padrão preenchidos): guarda a nova, para não contar isso como mudança do usuário.
  const rehashAfterPull = useRef(false);

  const persist = useCallback(async (meta: SyncMeta, last: string | null) => {
    metaRef.current = meta;
    try {
      await AsyncStorage.setItem(META_KEY, JSON.stringify({ meta, lastSyncISO: last } satisfies Persisted));
    } catch {
      // sem persistência: na próxima abertura o app só pergunta de novo o que precisar
    }
  }, []);

  // Carrega o que já foi sincronizado e o usuário conectado.
  useEffect(() => {
    if (!cloudConfigured) return;
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(META_KEY);
        if (raw && alive) {
          const p = JSON.parse(raw) as Persisted;
          metaRef.current = p.meta ?? EMPTY_SYNC_META;
          setLastSyncISO(p.lastSyncISO ?? null);
        }
      } catch {
        // meta corrompida: recomeça
      }
      metaLoaded.current = true;
      try {
        const u = await currentUser();
        if (alive) setUser(u);
      } catch (e) {
        if (alive) setMessage(friendlyCloudError(e));
      } finally {
        if (alive) setAuthReady(true);
      }
    })();
    const stop = onUserChange((u) => alive && setUser(u));
    return () => {
      alive = false;
      stop();
    };
  }, []);

  const apiFor = (u: CloudUser): CloudApi => makeCloudApi(u.id);

  const sync = useCallback(
    async (force?: 'local' | 'remote') => {
      if (!cloudConfigured || !user || !hydrated || !metaLoaded.current || busy.current) return;
      busy.current = true;
      setStatus('sincronizando');
      setMessage(null);
      try {
        const local = dataRef.current;
        const result = await runSync(apiFor(user), local, metaRef.current, new Date(), force);
        if (result.outcome === 'conflict') {
          setConflict({ cloud: summarizeBackup(result.remoteInfo!.data), local: summarizeBackup(local) });
          setStatus('conflito');
          return;
        }
        setConflict(null);
        if (result.outcome === 'pulled' && result.pulled) {
          rehashAfterPull.current = hashData(result.pulled) !== hashData(local);
          restoreBackup(result.pulled as BackupData);
        }
        const now = new Date().toISOString();
        const last = result.outcome === 'noop' ? lastSyncISO ?? now : now;
        await persist(result.meta, last);
        setLastSyncISO(last);
        setStatus('ociosa');
      } catch (e) {
        setMessage(friendlyCloudError(e));
        setStatus('erro');
      } finally {
        busy.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, hydrated, restoreBackup, persist, lastSyncISO],
  );

  const syncRef = useRef(sync);
  syncRef.current = sync;

  // Ao entrar (ou abrir o app já conectado): sincroniza.
  useEffect(() => {
    if (user && hydrated) void syncRef.current();
  }, [user, hydrated]);

  // Ao voltar para o app.
  useEffect(() => {
    if (!user) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void syncRef.current();
    });
    return () => sub.remove();
  }, [user]);

  // Depois de receber da nuvem: fixa a impressão digital do que ficou no app.
  useEffect(() => {
    if (!rehashAfterPull.current) return;
    rehashAfterPull.current = false;
    void persist({ ...metaRef.current, lastSyncedHash: dataHash }, lastSyncISO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataHash]);

  // Mudanças no aparelho: envia pouco depois da última (só depois da primeira sincronização e sem conflito aberto).
  useEffect(() => {
    if (!user || !hydrated || status === 'conflito' || status === 'sincronizando') return;
    if (metaRef.current.lastSyncedHash === null || metaRef.current.lastSyncedHash === dataHash) return;
    const t = setTimeout(() => void syncRef.current(), PUSH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [dataHash, user, hydrated, status]);

  const signIn = useCallback(async (email: string, password: string) => {
    setMessage(null);
    try {
      setUser(await cloudSignIn(email, password));
      return true;
    } catch (e) {
      setMessage(friendlyCloudError(e));
      return false;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setMessage(null);
    try {
      const { user: created, needsConfirmation } = await cloudSignUp(email, password);
      if (created) setUser(created);
      return { ok: true, needsConfirmation };
    } catch (e) {
      setMessage(friendlyCloudError(e));
      return { ok: false, needsConfirmation: false };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setMessage(null);
    try {
      await cloudResetPassword(email);
      return true;
    } catch (e) {
      setMessage(friendlyCloudError(e));
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await cloudSignOut();
    } catch {
      // mesmo sem rede, o aparelho esquece a conta
    }
    setUser(null);
    setConflict(null);
    setMessage(null);
    setStatus(cloudConfigured ? 'ociosa' : 'desligada');
    await persist(EMPTY_SYNC_META, null);
    setLastSyncISO(null);
  }, [persist]);

  const resolveConflict = useCallback(async (keep: 'local' | 'cloud') => {
    await syncRef.current(keep === 'local' ? 'local' : 'remote');
  }, []);

  const value: CloudSyncValue = {
    configured: cloudConfigured,
    authReady,
    user,
    status,
    message,
    lastSyncISO,
    conflict,
    signIn,
    signUp,
    resetPassword,
    signOut,
    syncNow: () => sync(),
    resolveConflict,
  };

  return <CloudSyncContext.Provider value={value}>{children}</CloudSyncContext.Provider>;
}

export function useCloudSync(): CloudSyncValue {
  const ctx = useContext(CloudSyncContext);
  if (!ctx) throw new Error('useCloudSync deve ser usado dentro de CloudSyncProvider');
  return ctx;
}
