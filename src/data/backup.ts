import { migrateEntries } from './bodyMeasures';
import type { ActiveProgram, MeasureEntry, Profile, Session, WeightEntry, Workout, WorkoutSettings } from '../types';

// Backup dos dados do app em um arquivo de texto (JSON). Funções puras: sem acesso a arquivos
// ou armazenamento, para poderem ser testadas e usadas igual no celular e na web.

export const BACKUP_APP = 'muscle-lab';
export const BACKUP_VERSION = 1;

/** Tudo o que vale guardar. O treino em andamento e as trocas "só hoje" ficam de fora de propósito. */
export interface BackupData {
  workouts: Workout[];
  activeWorkoutId: string;
  sessions: Session[];
  comments: Record<string, string>;
  settings: WorkoutSettings;
  profile: Profile | null;
  onboardingComplete: boolean;
  weights: WeightEntry[];
  measures: MeasureEntry[];
  activeProgram: ActiveProgram | null;
}

export interface Backup {
  app: typeof BACKUP_APP;
  version: number;
  exportedAtISO: string;
  data: BackupData;
}

export function buildBackup(data: BackupData, now: Date): Backup {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAtISO: now.toISOString(), data };
}

/** Nome do arquivo, ex.: "muscle-lab-backup-2026-10-13.json". */
export function backupFileName(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `muscle-lab-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

export type ParseResult = { ok: true; backup: Backup } | { ok: false; error: string };

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === 'string';
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function validWorkout(w: unknown): w is Workout {
  return isObject(w) && isString(w.id) && isString(w.name) && Array.isArray(w.exercises) && w.exercises.every((e) => isObject(e) && isString(e.exerciseId));
}

function validSession(s: unknown): s is Session {
  return (
    isObject(s) &&
    isString(s.id) &&
    isString(s.finishedAtISO) &&
    !Number.isNaN(Date.parse(s.finishedAtISO)) &&
    (s.note === undefined || isString(s.note)) &&
    Array.isArray(s.sets) &&
    s.sets.every((x) => isObject(x) && isString(x.exerciseId) && isNumber(x.weight) && isNumber(x.reps) && isString(x.loggedAtISO))
  );
}

function validWeight(w: unknown): w is WeightEntry {
  return isObject(w) && isString(w.dateISO) && !Number.isNaN(Date.parse(w.dateISO)) && isNumber(w.kg);
}

function validMeasure(m: unknown): m is MeasureEntry {
  return (
    isObject(m) &&
    isString(m.dateISO) &&
    !Number.isNaN(Date.parse(m.dateISO)) &&
    isObject(m.values) &&
    Object.values(m.values).every((v) => isNumber(v))
  );
}

/**
 * Lê e confere o texto de um backup. Aceita só o que o app consegue usar: qualquer item
 * fora do formato derruba a leitura inteira, para nunca restaurar um arquivo pela metade.
 */
export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text.trim());
  } catch {
    return { ok: false, error: 'O texto não é um backup válido. Confira se copiou o conteúdo inteiro do arquivo.' };
  }
  if (!isObject(raw) || raw.app !== BACKUP_APP || !isObject(raw.data)) {
    return { ok: false, error: 'Este arquivo não é um backup do Muscle Lab.' };
  }
  if (!isNumber(raw.version) || raw.version > BACKUP_VERSION) {
    return { ok: false, error: 'Este backup foi feito por uma versão mais nova do app. Atualize o app e tente de novo.' };
  }

  const d = raw.data;
  if (!Array.isArray(d.workouts) || !d.workouts.every(validWorkout)) return { ok: false, error: 'Os treinos do backup estão incompletos.' };
  if (!Array.isArray(d.sessions) || !d.sessions.every(validSession)) return { ok: false, error: 'O histórico de treinos do backup está incompleto.' };
  const weights = d.weights === undefined ? [] : d.weights;
  if (!Array.isArray(weights) || !weights.every(validWeight)) return { ok: false, error: 'As pesagens do backup estão incompletas.' };
  const measures = d.measures === undefined ? [] : d.measures;
  if (!Array.isArray(measures) || !measures.every(validMeasure)) return { ok: false, error: 'As medidas do backup estão incompletas.' };
  if (!isObject(d.settings)) return { ok: false, error: 'As preferências do backup estão incompletas.' };
  if (d.profile !== null && d.profile !== undefined && !isObject(d.profile)) return { ok: false, error: 'O perfil do backup está incompleto.' };

  const workouts = d.workouts as Workout[];
  const activeId = isString(d.activeWorkoutId) && workouts.some((w) => w.id === d.activeWorkoutId) ? d.activeWorkoutId : workouts[0]?.id ?? '';
  const program = d.activeProgram;
  const activeProgram =
    isObject(program) && isString(program.specId) && isString(program.startedISO) && isNumber(program.weeks) ? (program as unknown as ActiveProgram) : null;

  return {
    ok: true,
    backup: {
      app: BACKUP_APP,
      version: raw.version,
      exportedAtISO: isString(raw.exportedAtISO) ? raw.exportedAtISO : '',
      data: {
        workouts,
        activeWorkoutId: activeId,
        sessions: d.sessions as Session[],
        comments: isObject(d.comments) ? (d.comments as Record<string, string>) : {},
        settings: d.settings as unknown as WorkoutSettings,
        profile: (d.profile ?? null) as Profile | null,
        onboardingComplete: d.onboardingComplete === true,
        weights: weights as WeightEntry[],
        // Backups antigos tinham uma medida só para braço, coxa e panturrilha.
        measures: migrateEntries(measures as MeasureEntry[]),
        activeProgram,
      },
    },
  };
}

export interface BackupSummary {
  workouts: number;
  sessions: number;
  weights: number;
  measures: number;
  /** Data do treino mais recente, ou null sem histórico. */
  lastSessionISO: string | null;
}

export function summarizeBackup(data: BackupData): BackupSummary {
  const last = data.sessions.reduce<string | null>((acc, s) => (acc === null || s.finishedAtISO > acc ? s.finishedAtISO : acc), null);
  return { workouts: data.workouts.length, sessions: data.sessions.length, weights: data.weights.length, measures: data.measures.length, lastSessionISO: last };
}
