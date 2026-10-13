// Andamento de um programa com duração: em que semana o usuário está e o que priorizar nela.
// Funções puras: recebem "hoje" como parâmetro.

export interface ProgramPhase {
  name: string;
  /** Orientação curta, ligada ao RIR que o app já registra. */
  tip: string;
  /** Primeira e última semana da fase (1 = primeira semana do programa). */
  from: number;
  to: number;
}

/** Fases de um programa de `weeks` semanas (mínimo 4): adaptação, progressão, intensificação e descarga. */
export function programPhases(weeks: number): ProgramPhase[] {
  const total = Math.max(4, Math.round(weeks));
  return [
    { name: 'Adaptação', tip: 'Cargas leves, com 3 ou mais repetições sobrando (RIR 3+). Foque na técnica.', from: 1, to: 2 },
    { name: 'Progressão', tip: 'Suba a carga quando o RIR da série for 3 ou mais. Mantenha se estiver entre 1 e 2.', from: 3, to: total - 2 },
    { name: 'Intensificação', tip: 'Chegue mais perto da falha: trabalhe com RIR entre 1 e 2 nas séries principais.', from: total - 1, to: total - 1 },
    { name: 'Descarga', tip: 'Reduza as cargas em cerca de 10% e deixe o corpo recuperar antes do próximo programa.', from: total, to: total },
  ];
}

export interface ProgramProgress {
  /** Semana atual (1 a `weeks`); no fim do programa fica em `weeks`. */
  week: number;
  weeks: number;
  /** 0 a 1, para a barra de progresso. */
  pct: number;
  finished: boolean;
  phase: ProgramPhase;
}

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function programProgress(startedISO: string, weeks: number, today: Date): ProgramProgress {
  const total = Math.max(4, Math.round(weeks));
  const days = Math.max(0, Math.round((dayStart(today) - dayStart(new Date(startedISO))) / 86400000));
  const raw = Math.floor(days / 7) + 1;
  const finished = raw > total;
  const week = Math.min(raw, total);
  const phase = programPhases(total).find((p) => week >= p.from && week <= p.to)!;
  return { week, weeks: total, pct: finished ? 1 : (week - 1 + (days % 7) / 7) / total, finished, phase };
}
