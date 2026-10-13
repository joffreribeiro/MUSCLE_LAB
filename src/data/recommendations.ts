import type { Session, Workout } from '../types';
import { suggestNext } from './progression';
import { DELOAD_FACTOR } from './deload';
import { dayKey } from './stats';
import { UpdateReminder, reminderText, reminderTitle } from './updateReminder';

// Recomendações do Painel: reúne os avisos do app (descarga, lembrete de peso e medidas,
// programa concluído, treinos perdidos, músculo parado, hora de subir a carga) numa lista só,
// em ordem de importância. Funções puras: recebem "hoje" como parâmetro.

/** Quantas recomendações aparecem de uma vez. */
export const MAX_RECOMMENDATIONS = 4;
/** Janela, em dias, para contar treinos planejados perdidos. */
export const MISSED_WINDOW_DAYS = 7;
/** A partir de quantos treinos perdidos na janela o aviso aparece. */
export const MISSED_MIN = 2;
/** Dispensar uma recomendação a esconde por este tempo. */
export const SNOOZE_DAYS = 3;
/** Quantos exercícios aparecem em "hora de subir a carga". */
export const MAX_LOAD_UPS = 3;

export type RecommendationId = 'descarga' | 'lembrete' | 'programa-concluido' | 'perdidos' | 'musculo-parado' | 'subir-carga';
export type RecommendationAction = 'deload' | 'medidas' | 'programas' | 'cargas';

export interface Recommendation {
  id: RecommendationId;
  /** alerta = pede atenção; info = sugestão. */
  tone: 'alerta' | 'info';
  title: string;
  text: string;
  action?: { kind: RecommendationAction; label: string };
}

export interface LoadUp {
  exerciseId: string;
  name: string;
  from: number;
  to: number;
}

export interface RecommendationInput {
  today: Date;
  /** RIR médio dos últimos treinos, quando o aviso de descarga está ativo. */
  deloadRirs: number[] | null;
  /** Lembrete de peso e medidas já filtrado pelo "depois". */
  reminder: UpdateReminder | null;
  /** Semanas do programa que acabou de terminar; null se não terminou. */
  finishedProgramWeeks: number | null;
  /** Treinos planejados perdidos nos últimos MISSED_WINDOW_DAYS dias. */
  missedPlanned: number;
  /** Grupos musculares sem séries nas duas últimas semanas. */
  idleGroups: string[];
  /** Exercícios em que o RIR indica subir a carga. */
  loadUps: LoadUp[];
  /** Recomendações dispensadas: id → data (ISO) até a qual ficam escondidas. */
  snoozed?: Partial<Record<RecommendationId, string>>;
}

const fmtRir = (n: number) => n.toFixed(1).replace('.', ',');
const fmtKg = (n: number) => String(Math.round(n * 2) / 2).replace('.', ',');
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Recomendações a mostrar, da mais importante para a menos, no máximo MAX_RECOMMENDATIONS. */
export function buildRecommendations(i: RecommendationInput): Recommendation[] {
  const out: Recommendation[] = [];

  if (i.deloadRirs && i.deloadRirs.length > 0) {
    out.push({
      id: 'descarga',
      tone: 'alerta',
      title: 'Hora de uma semana mais leve?',
      text: `O RIR médio dos seus últimos ${i.deloadRirs.length} treinos foi ${i.deloadRirs.map(fmtRir).join(', ')}: você está terminando as séries na falha ou quase. Uma semana com cargas cerca de ${Math.round((1 - DELOAD_FACTOR) * 100)}% menores ajuda o corpo a recuperar e a voltar a progredir.`,
      action: { kind: 'deload', label: `Reduzir cargas em ${Math.round((1 - DELOAD_FACTOR) * 100)}%` },
    });
  }

  if (i.reminder) {
    out.push({
      id: 'lembrete',
      tone: 'alerta',
      title: reminderTitle(i.reminder),
      text: reminderText(i.reminder),
      action: { kind: 'medidas', label: 'Registrar agora' },
    });
  }

  if (i.finishedProgramWeeks !== null) {
    out.push({
      id: 'programa-concluido',
      tone: 'info',
      title: 'Programa concluído',
      text: `Você completou as ${i.finishedProgramWeeks} semanas. Escolha o próximo programa para continuar evoluindo.`,
      action: { kind: 'programas', label: 'Ver programas' },
    });
  }

  if (i.missedPlanned >= MISSED_MIN) {
    out.push({
      id: 'perdidos',
      tone: 'info',
      title: `${i.missedPlanned} treinos planejados perdidos`,
      text: `Nos últimos ${MISSED_WINDOW_DAYS} dias você não treinou em ${i.missedPlanned} dias planejados. Volte hoje ou ajuste os dias de treino no calendário para um plano que caiba na sua rotina.`,
    });
  }

  if (i.idleGroups.length > 0) {
    out.push({
      id: 'musculo-parado',
      tone: 'info',
      title: i.idleGroups.length === 1 ? 'Um músculo ficou de fora' : 'Músculos ficaram de fora',
      text: `Sem séries nas últimas duas semanas: ${i.idleGroups.join(', ')}.`,
    });
  }

  if (i.loadUps.length > 0) {
    out.push({
      id: 'subir-carga',
      tone: 'info',
      title: 'Hora de subir a carga',
      text: `${i.loadUps
        .slice(0, MAX_LOAD_UPS)
        .map((l) => `${l.name} (${fmtKg(l.from)} → ${fmtKg(l.to)} kg)`)
        .join(', ')}. Sobrou fôlego nas últimas séries.`,
      action: { kind: 'cargas', label: 'Aplicar nos treinos' },
    });
  }

  const today = startOfDay(i.today);
  return out
    .filter((r) => {
      const until = i.snoozed?.[r.id];
      return !until || today >= startOfDay(new Date(until));
    })
    .slice(0, MAX_RECOMMENDATIONS);
}

/**
 * Exercícios em que o RIR das últimas sessões pede mais carga e o treino ainda não está com ela.
 * Cada exercício aparece uma vez, mesmo que esteja em mais de um treino.
 */
export function findLoadUps(workouts: Workout[], sessions: Session[]): LoadUp[] {
  const ups: LoadUp[] = [];
  const seen = new Set<string>();
  for (const e of workouts.flatMap((w) => w.exercises)) {
    if (e.type === 'cardio' || seen.has(e.exerciseId)) continue;
    seen.add(e.exerciseId);
    const sug = suggestNext(e.exerciseId, e.reps, sessions);
    if (!sug || sug.kind !== 'aumentar' || sug.weight === undefined || sug.weight === sug.lastWeight) continue;
    // Já está prescrito com essa carga (ou mais): nada a aplicar.
    if (e.weight !== undefined && e.weight >= sug.weight) continue;
    ups.push({ exerciseId: e.exerciseId, name: e.name, from: sug.lastWeight, to: sug.weight });
  }
  return ups;
}

/**
 * Dias planejados que ficaram sem treino nos últimos `days` dias (sem contar hoje).
 * Só valem dias a partir do início do plano; `plannedWeekdays` usa 0 = domingo.
 */
export function missedPlannedDays(
  sessions: Session[],
  today: Date,
  plannedWeekdays: readonly number[],
  planSince: Date | null,
  days = MISSED_WINDOW_DAYS,
): number {
  if (!planSince || plannedWeekdays.length === 0) return 0;
  const trained = new Set(sessions.map((s) => dayKey(new Date(s.finishedAtISO))));
  const since = startOfDay(planSince);
  let missed = 0;
  for (let n = 1; n <= days; n++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - n);
    if (d.getTime() < since) continue;
    if (plannedWeekdays.includes(d.getDay()) && !trained.has(dayKey(d))) missed += 1;
  }
  return missed;
}

/** Data (ISO) até a qual uma recomendação dispensada fica escondida. */
export function snoozeRecommendation(today: Date): string {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + SNOOZE_DAYS).toISOString();
}
