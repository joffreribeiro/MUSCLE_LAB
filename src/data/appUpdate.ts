// Aviso de atualização do app. O fluxo de build publica, na release "latest-apk" do GitHub, o APK
// (MUSCLELAB_<versão>.apk) junto com o apk-version.json; o app compara o número do próprio build
// com o publicado. Funções puras: a rede e o ambiente ficam em UpdateContext.

/** Nome da release do GitHub onde o fluxo de build publica o APK mais recente. */
export const RELEASE_TAG = 'latest-apk';

/** O que o apk-version.json informa. */
export interface PublishedVersion {
  /** Número do build (cresce a cada APK publicado). */
  build: number;
  /** Texto da versão, ex.: "1.0.0-5"; null se o arquivo não trouxer. */
  versao: string | null;
}

/** Lê o conteúdo do apk-version.json; devolve null se não for um arquivo de versão válido. */
export function parsePublishedVersion(json: unknown): PublishedVersion | null {
  if (typeof json !== 'object' || json === null) return null;
  const o = json as Record<string, unknown>;
  const build = typeof o.build === 'number' ? o.build : typeof o.build === 'string' ? Number(o.build) : NaN;
  if (!Number.isInteger(build) || build < 1) return null;
  const versao = typeof o.versao === 'string' && o.versao.trim() !== '' ? o.versao.trim() : null;
  return { build, versao };
}

/** Número do build embutido no app (texto da variável de ambiente); null fora do APK publicado (desenvolvimento). */
export function parseBuildNumber(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

/** Há versão mais nova publicada? Sem o número do próprio build, nunca avisa. */
export function isNewerBuild(current: number | null, published: number | null): boolean {
  if (current === null || published === null) return false;
  return published > current;
}

/** Nome do arquivo do APK: MUSCLELAB_<versão>.apk (ex.: MUSCLELAB_1.0.0-5.apk). */
export function apkFileName(versao: string): string {
  return `MUSCLELAB_${versao}.apk`;
}

const base = (repo: string) => `https://github.com/${repo}/releases/download/${RELEASE_TAG}`;

/** Endereço do apk-version.json. */
export function versionUrl(repo: string): string {
  return `${base(repo)}/apk-version.json`;
}

/** Endereço do APK: com a versão no nome quando ela é conhecida, ou a cópia de nome fixo (muscle-lab.apk). */
export function apkUrl(repo: string, versao: string | null): string {
  return `${base(repo)}/${versao ? apkFileName(versao) : 'muscle-lab.apk'}`;
}

/** Repositório "dono/nome" válido (usado para montar os endereços). */
export function isValidRepo(repo: string | undefined | null): repo is string {
  return typeof repo === 'string' && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo);
}
