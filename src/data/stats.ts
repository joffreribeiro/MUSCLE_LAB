import type { Session, SetLog } from '../types';

// Estatísticas do Painel, calculadas a partir do histórico real (sessões concluídas +
// séries do treino em andamento). Funções puras: recebem "hoje" como parâmetro.

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const monthLabel = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

/** Chave de dia no fuso local, ex.: "2026-10-12". */
export const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Segunda-feira da semana de `d`, à meia-noite. */
export const weekStart = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));

// ── Calendário ──────────────────────────────────────────────────────────────

export interface CalendarCell {
  n: number;
  done: boolean;
  today: boolean;
  /** Dia da semana planejado para treinar. */
  planned: boolean;
  /** Dia planejado que já passou sem treino (só depois de o plano começar). */
  missed: boolean;
}

export interface MonthCalendar {
  label: string;
  /** Posições vazias antes do dia 1 (a semana começa na segunda). */
  padding: number;
  cells: CalendarCell[];
  /** Quantos dias do mês tiveram treino. */
  daysTrained: number;
  /** Quantos dias planejados do mês passaram sem treino. */
  daysMissed: number;
}

/**
 * `plannedWeekdays` (0 = domingo) marca os dias planejados; `planSince` é quando o plano começou
 * (início do programa ou primeiro treino): antes disso nenhum dia conta como perdido.
 */
export function monthCalendar(
  sessions: Session[],
  today: Date,
  plannedWeekdays: readonly number[] = [],
  planSince: Date | null = null,
): MonthCalendar {
  const trained = new Set(sessions.map((s) => dayKey(new Date(s.finishedAtISO))));
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = dayKey(today);
  const todayStart = startOfDay(today).getTime();
  const sinceStart = planSince ? startOfDay(planSince).getTime() : null;

  const cells: CalendarCell[] = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, month, i + 1);
    const key = dayKey(date);
    const done = trained.has(key);
    const planned = plannedWeekdays.includes(date.getDay());
    const missed = planned && !done && date.getTime() < todayStart && sinceStart !== null && date.getTime() >= sinceStart;
    return { n: i + 1, done, today: key === todayKey, planned, missed };
  });

  return {
    label: monthLabel(today),
    padding: (new Date(year, month, 1).getDay() + 6) % 7,
    cells,
    daysTrained: cells.filter((c) => c.done).length,
    daysMissed: cells.filter((c) => c.missed).length,
  };
}

/** Treinos concluídos na semana atual (segunda a domingo). */
export function sessionsThisWeek(sessions: Session[], today: Date): number {
  const start = weekStart(today).getTime();
  return sessions.filter((s) => new Date(s.finishedAtISO).getTime() >= start).length;
}

// ── Volume por dia ──────────────────────────────────────────────────────────

export interface DayVolume {
  label: string;
  volume: number;
  today: boolean;
}

/** Volume (kg x repetições) dos últimos `days` dias, terminando hoje. */
export function volumeByDay(sets: SetLog[], today: Date, days = 7): DayVolume[] {
  const byDay = new Map<string, number>();
  for (const s of sets) {
    const key = dayKey(new Date(s.loggedAtISO));
    byDay.set(key, (byDay.get(key) ?? 0) + s.weight * s.reps);
  }
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(startOfDay(today), i - (days - 1));
    return {
      label: WEEKDAY_SHORT[date.getDay()],
      volume: byDay.get(dayKey(date)) ?? 0,
      today: i === days - 1,
    };
  });
}

const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MAX_MONTH_BARS = 6;

/**
 * Volume agrupado conforme o período: 7 dias = por dia; 30 dias = por semana (5 janelas de
 * 7 dias terminando hoje); null ("sempre") = por mês, até os últimos 6 meses.
 */
export function volumeBuckets(sets: SetLog[], today: Date, days: 7 | 30 | null): DayVolume[] {
  if (days === 7) return volumeByDay(sets, today, 7);

  const todayStart = startOfDay(today);
  if (days === 30) {
    const WEEKS = 5;
    const totals = new Array<number>(WEEKS).fill(0);
    const from = addDays(todayStart, -(WEEKS * 7 - 1)).getTime();
    for (const s of sets) {
      const t = new Date(s.loggedAtISO).getTime();
      if (t < from) continue;
      const age = Math.floor((todayStart.getTime() - startOfDay(new Date(s.loggedAtISO)).getTime()) / 86400000);
      const idx = WEEKS - 1 - Math.floor(age / 7);
      if (idx >= 0 && idx < WEEKS) totals[idx] += s.weight * s.reps;
    }
    return totals.map((volume, i) => {
      const start = addDays(todayStart, -((WEEKS - i) * 7 - 1));
      return { label: `${start.getDate()}/${start.getMonth() + 1}`, volume, today: i === WEEKS - 1 };
    });
  }

  // Por mês: da pesagem mais antiga até o mês atual, no máximo MAX_MONTH_BARS barras.
  const byMonth = new Map<string, number>();
  let earliest = today.getFullYear() * 12 + today.getMonth();
  for (const s of sets) {
    const d = new Date(s.loggedAtISO);
    const idx = d.getFullYear() * 12 + d.getMonth();
    earliest = Math.min(earliest, idx);
    byMonth.set(String(idx), (byMonth.get(String(idx)) ?? 0) + s.weight * s.reps);
  }
  const current = today.getFullYear() * 12 + today.getMonth();
  const first = Math.max(earliest, current - (MAX_MONTH_BARS - 1));
  return Array.from({ length: current - first + 1 }, (_, i) => {
    const idx = first + i;
    return { label: MONTH_SHORT[idx % 12], volume: byMonth.get(String(idx)) ?? 0, today: idx === current };
  });
}

// ── Divisão por grupo muscular ──────────────────────────────────────────────

export interface GroupLabel {
  key: string;
  label: string;
}

export interface GroupShareItem {
  key: string;
  label: string;
  count: number;
  /** Percentual inteiro; a soma de todos os itens é sempre 100. */
  pct: number;
  /** Percentual exato, para desenhar o gráfico. */
  exact: number;
}

/** Maior resto: arredonda os percentuais para inteiros sem que a soma saia de 100. */
function roundPercents(exact: number[]): number[] {
  const floors = exact.map(Math.floor);
  let missing = 100 - floors.reduce((a, b) => a + b, 0);
  const order = exact
    .map((v, i) => ({ i, rem: v - Math.floor(v) }))
    .sort((a, b) => b.rem - a.rem || a.i - b.i);
  for (const { i } of order) {
    if (missing <= 0) break;
    floors[i] += 1;
    missing -= 1;
  }
  return floors;
}

/**
 * Séries por grupo muscular nos últimos `days` dias. `groupOf` devolve o grupo do
 * exercício, ou null para ignorá-lo (cardio). Mantém os `maxGroups` maiores e junta o
 * restante em "Outros".
 */
export function groupShare(
  sets: SetLog[],
  today: Date,
  days: number | null,
  groupOf: (exerciseId: string) => GroupLabel | null,
  maxGroups = 4,
): { total: number; items: GroupShareItem[] } {
  // days = null: sem limite de período.
  const since = days === null ? -Infinity : addDays(startOfDay(today), -(days - 1)).getTime();
  const counts = new Map<string, { label: string; count: number }>();
  let total = 0;

  for (const s of sets) {
    if (new Date(s.loggedAtISO).getTime() < since) continue;
    const group = groupOf(s.exerciseId);
    if (!group) continue;
    total += 1;
    const prev = counts.get(group.key);
    counts.set(group.key, { label: group.label, count: (prev?.count ?? 0) + 1 });
  }
  if (total === 0) return { total: 0, items: [] };

  return buildShareItems(
    [...counts.entries()].map(([key, v]) => ({ key, label: v.label, count: v.count })),
    maxGroups,
  );
}

export interface ShareResult {
  total: number;
  items: GroupShareItem[];
}

/**
 * Transforma contagens em fatias com percentuais (soma 100): da maior para a menor; passando de
 * `maxGroups`, o restante vira "Outros".
 */
export function buildShareItems(entries: { key: string; label: string; count: number }[], maxGroups = 4): ShareResult {
  const total = entries.reduce((a, e) => a + e.count, 0);
  if (total === 0) return { total: 0, items: [] };

  const sorted = [...entries].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const head = sorted.slice(0, maxGroups);
  const rest = sorted.slice(maxGroups);
  if (rest.length) {
    head.push({ key: 'outros', label: 'Outros', count: rest.reduce((a, r) => a + r.count, 0) });
  }

  const exact = head.map((g) => (g.count / total) * 100);
  const pcts = roundPercents(exact);
  return { total, items: head.map((g, i) => ({ ...g, pct: pcts[i], exact: exact[i] })) };
}

// ── Séries por grupo, semana a semana ───────────────────────────────────────

export interface GroupWeekRow {
  key: string;
  label: string;
  /** Séries por semana, da mais antiga para a atual (mesma ordem de `weeks`). */
  counts: number[];
  total: number;
}

export interface WeeklyGroupSets {
  /** Segunda-feira de cada semana; a última é a semana atual (incompleta). */
  weeks: Date[];
  rows: GroupWeekRow[];
  /** Grupos que já foram treinados ou estão no programa, mas sem séries nas duas últimas semanas. */
  idle: GroupLabel[];
}

/**
 * Séries por grupo muscular nas últimas `weekCount` semanas (semanas de segunda a domingo).
 * `planned` são grupos do programa atual: aparecem mesmo sem nenhuma série, para mostrar o que
 * está sendo deixado de lado. Linhas ordenadas das mais treinadas para as menos.
 */
export function weeklyGroupSets(
  sets: SetLog[],
  today: Date,
  weekCount: number,
  groupOf: (exerciseId: string) => GroupLabel | null,
  planned: GroupLabel[] = [],
): WeeklyGroupSets {
  const current = weekStart(today);
  const weeks = Array.from({ length: weekCount }, (_, i) => addDays(current, -7 * (weekCount - 1 - i)));
  const first = weeks[0].getTime();

  const rows = new Map<string, GroupWeekRow>();
  const ensure = (g: GroupLabel) => {
    let row = rows.get(g.key);
    if (!row) {
      row = { key: g.key, label: g.label, counts: new Array<number>(weekCount).fill(0), total: 0 };
      rows.set(g.key, row);
    }
    return row;
  };
  planned.forEach(ensure);

  // Grupos treinados em qualquer época: servem para apontar quem ficou parado.
  const everTrained = new Set<string>();
  for (const s of sets) {
    const group = groupOf(s.exerciseId);
    if (!group) continue;
    everTrained.add(group.key);
    const t = new Date(s.loggedAtISO).getTime();
    if (t < first) continue;
    const idx = weekCount - 1 - Math.round((current.getTime() - weekStart(new Date(t)).getTime()) / (7 * 86400000));
    if (idx < 0 || idx >= weekCount) continue;
    const row = ensure(group);
    row.counts[idx] += 1;
    row.total += 1;
  }

  const plannedKeys = new Set(planned.map((g) => g.key));
  const sorted = [...rows.values()].sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
  const idle = sorted
    .filter((r) => (plannedKeys.has(r.key) || everTrained.has(r.key)) && r.counts[weekCount - 1] === 0 && r.counts[weekCount - 2] === 0)
    .map((r) => ({ key: r.key, label: r.label }));
  return { weeks, rows: sorted, idle };
}

// ── Histórico de sessões ────────────────────────────────────────────────────

/** Volume (kg x repetições) de uma sessão. */
export const sessionVolume = (session: Session): number =>
  session.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);

export interface ExerciseSets {
  exerciseId: string;
  sets: SetLog[];
}

/** Séries de uma sessão agrupadas por exercício, na ordem em que cada exercício foi feito. */
export function groupSetsByExercise(sets: SetLog[]): ExerciseSets[] {
  const order: string[] = [];
  const byId = new Map<string, SetLog[]>();
  for (const s of [...sets].sort((a, b) => a.loggedAtISO.localeCompare(b.loggedAtISO))) {
    if (!byId.has(s.exerciseId)) {
      byId.set(s.exerciseId, []);
      order.push(s.exerciseId);
    }
    byId.get(s.exerciseId)!.push(s);
  }
  return order.map((exerciseId) => ({ exerciseId, sets: byId.get(exerciseId)! }));
}
