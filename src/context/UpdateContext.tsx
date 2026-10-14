import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { apkUrl as buildApkUrl, isNewerBuild, isValidRepo, parseBuildNumber, parsePublishedVersion, versionUrl } from '../data/appUpdate';

// Aviso de atualização do APK. O fluxo de build (.github/workflows/build-apk.yml) embute o número do
// build, a versão e o repositório no app; o app compara o número com o apk-version.json publicado.
// Fora do APK publicado (servidor de desenvolvimento, web) essas variáveis não existem e nada é checado.

const CURRENT_BUILD = parseBuildNumber(process.env.EXPO_PUBLIC_BUILD_NUMBER);
const CURRENT_VERSION = process.env.EXPO_PUBLIC_APP_VERSION ?? null;
const REPO = process.env.EXPO_PUBLIC_UPDATE_REPO;

const CHECK_MIN_GAP_MS = 5 * 60 * 1000;

/** nova = há versão mais nova; atual = já está na mais recente; offline = não deu para consultar; indisponivel = esta versão não consulta (desenvolvimento ou web). */
export type UpdateCheckResult = 'nova' | 'atual' | 'offline' | 'indisponivel';

interface UpdateValue {
  /** Versão deste app (ex.: "1.0.0-5"); null no desenvolvimento. */
  currentVersion: string | null;
  /** Este app sabe se atualizar (é um APK publicado e o repositório está configurado). */
  canCheck: boolean;
  /** Há versão mais nova e o aviso não foi dispensado. */
  updateAvailable: boolean;
  /** Versão publicada, quando conhecida. */
  latestVersion: string | null;
  /** Endereço de download do APK mais recente. */
  apkUrl: string | null;
  /** Consulta agora e diz o que achou. */
  checkNow: () => Promise<UpdateCheckResult>;
  /** Esconde o aviso até a próxima abertura do app. */
  dismiss: () => void;
}

const UpdateContext = createContext<UpdateValue>({
  currentVersion: null,
  canCheck: false,
  updateAvailable: false,
  latestVersion: null,
  apkUrl: null,
  checkNow: async () => 'indisponivel',
  dismiss: () => {},
});

const canCheck = Platform.OS !== 'web' && CURRENT_BUILD !== null && isValidRepo(REPO);

export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const [hasNew, setHasNew] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const last = useRef(0);

  const checkNow = useCallback(async (): Promise<UpdateCheckResult> => {
    if (!canCheck || !isValidRepo(REPO)) return 'indisponivel';
    last.current = Date.now();
    try {
      const res = await fetch(`${versionUrl(REPO)}?_=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return 'offline';
      const published = parsePublishedVersion(await res.json());
      if (!published) return 'offline';
      setLatestVersion(published.versao);
      const isNew = isNewerBuild(CURRENT_BUILD, published.build);
      setHasNew(isNew);
      return isNew ? 'nova' : 'atual';
    } catch {
      return 'offline';
    }
  }, []);

  // Ao abrir e ao voltar para o app (no máximo a cada 5 minutos).
  useEffect(() => {
    if (!canCheck) return;
    void checkNow();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && Date.now() - last.current > CHECK_MIN_GAP_MS) void checkNow();
    });
    return () => sub.remove();
  }, [checkNow]);

  const value: UpdateValue = {
    currentVersion: CURRENT_VERSION,
    canCheck,
    updateAvailable: hasNew && !dismissed,
    latestVersion,
    apkUrl: canCheck && isValidRepo(REPO) ? buildApkUrl(REPO, latestVersion) : null,
    checkNow,
    dismiss: () => setDismissed(true),
  };

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>;
}

export function useUpdate(): UpdateValue {
  return useContext(UpdateContext);
}
