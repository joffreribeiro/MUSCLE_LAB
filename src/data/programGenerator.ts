import { catalog, findExerciseById } from './catalog';
import { buildDayExerciseFromExercise } from './dayProgram';
import { DayExercise, Goal, Level, Profile, Workout } from '../types';

// Gera o programa inicial a partir do perfil do onboarding:
//   frequência -> divisão (corpo inteiro, empurrar/puxar/pernas, superior/inferior)
//   nível      -> escolha dos exercícios (guiados para iniciantes), séries e carga inicial
//   objetivo   -> repetições, cardio e descanso
// A carga inicial é uma estimativa conservadora pelo peso corporal; o RIR registrado
// calibra o resto (ver progression.ts).

export const GOAL_TITLE: Record<Goal, string> = {
  'ganhar-massa': 'Construindo músculos',
  'perder-gordura': 'Queimando gordura',
  'manter-forma': 'Mantendo a forma',
};

/** Descanso padrão entre séries por objetivo (segundos; múltiplos de 15, como no Perfil). */
export const REST_BY_GOAL: Record<Goal, number> = {
  'ganhar-massa': 120,
  'perder-gordura': 60,
  'manter-forma': 90,
};

// ── Exercícios por posição no treino ────────────────────────────────────────

type SlotKind = 'composto' | 'acessorio';

interface Slot {
  kind: SlotKind;
  /** Exercício por nível. `alt` é a variação usada nos dias "B" da divisão. */
  ids: Record<Level, string>;
  alt: string;
  /** Repetições fixas (panturrilha e abdômen pedem mais) — ignora a tabela por objetivo. */
  reps?: number;
}

const SLOTS = {
  peito_comp: { kind: 'composto', ids: { iniciante: 'supino-maquina', intermediario: 'supino-reto', avancado: 'supino-reto' }, alt: 'supino-halteres' },
  peito_inc: { kind: 'composto', ids: { iniciante: 'supino-inclinado-halteres', intermediario: 'supino-inclinado-halteres', avancado: 'supino-inclinado' }, alt: 'supino-inclinado' },
  peito_iso: { kind: 'acessorio', ids: { iniciante: 'peck-deck', intermediario: 'crucifixo', avancado: 'crossover' }, alt: 'crucifixo-inclinado' },
  ombro_comp: { kind: 'composto', ids: { iniciante: 'desenvolvimento-smith', intermediario: 'desenvolvimento', avancado: 'desenvolvimento' }, alt: 'arnold-press' },
  ombro_lat: { kind: 'acessorio', ids: { iniciante: 'elevacao-lateral', intermediario: 'elevacao-lateral', avancado: 'elevacao-lateral' }, alt: 'elevacao-lateral-cabo' },
  ombro_post: { kind: 'acessorio', ids: { iniciante: 'face-pull', intermediario: 'face-pull', avancado: 'face-pull' }, alt: 'crucifixo-invertido' },
  triceps: { kind: 'acessorio', ids: { iniciante: 'triceps-polia', intermediario: 'triceps-corda', avancado: 'triceps-testa' }, alt: 'triceps-frances' },
  costas_vert: { kind: 'composto', ids: { iniciante: 'pulldown', intermediario: 'pulldown', avancado: 'barra-fixa' }, alt: 'pulldown' },
  costas_horiz: { kind: 'composto', ids: { iniciante: 'remada-maquina', intermediario: 'remada-baixa', avancado: 'remada-barra' }, alt: 'remada-halter' },
  biceps: { kind: 'acessorio', ids: { iniciante: 'rosca-direta', intermediario: 'rosca-alternada', avancado: 'rosca-direta' }, alt: 'rosca-martelo' },
  quad_comp: { kind: 'composto', ids: { iniciante: 'leg-press', intermediario: 'agachamento', avancado: 'agachamento' }, alt: 'avanco' },
  quad_iso: { kind: 'acessorio', ids: { iniciante: 'extensora', intermediario: 'extensora', avancado: 'extensora' }, alt: 'extensora' },
  post_comp: { kind: 'composto', ids: { iniciante: 'mesa-flexora', intermediario: 'stiff', avancado: 'stiff' }, alt: 'cadeira-flexora' },
  gluteo: { kind: 'composto', ids: { iniciante: 'gluteo-polia', intermediario: 'elevacao-pelvica', avancado: 'elevacao-pelvica' }, alt: 'cadeira-abdutora' },
  panturrilha: { kind: 'acessorio', reps: 15, ids: { iniciante: 'panturrilha-em-pe', intermediario: 'panturrilha-em-pe', avancado: 'panturrilha-em-pe' }, alt: 'panturrilha-sentado' },
  abs: { kind: 'acessorio', reps: 15, ids: { iniciante: 'crunch', intermediario: 'abdominal-maquina', avancado: 'abdominal-polia' }, alt: 'abdominal-infra' },
} satisfies Record<string, Slot>;

type SlotId = keyof typeof SLOTS;

/** Todos os exercícios que o gerador pode escolher (usado nos testes de consistência). */
export const GENERATOR_EXERCISE_IDS: string[] = [
  ...new Set(Object.values(SLOTS).flatMap((s: Slot) => [...Object.values(s.ids), s.alt])),
];

// ── Carga inicial ───────────────────────────────────────────────────────────

// Fração do peso corporal para um iniciante, por exercício (halteres: por mão).
// Conservadora de propósito: o RIR da primeira semana sobe a carga rápido, e começar
// leve evita lesão e o desânimo de uma primeira série impossível.
const START_RATIO: Record<string, number> = {
  'supino-maquina': 0.4, 'supino-reto': 0.45, 'supino-halteres': 0.18, 'supino-inclinado-halteres': 0.17, 'supino-inclinado': 0.4,
  'peck-deck': 0.25, crucifixo: 0.1, crossover: 0.12, 'crucifixo-inclinado': 0.09,
  'desenvolvimento-smith': 0.3, desenvolvimento: 0.3, 'arnold-press': 0.12, 'elevacao-lateral': 0.07, 'elevacao-lateral-cabo': 0.05,
  'face-pull': 0.2, 'crucifixo-invertido': 0.06,
  'triceps-polia': 0.3, 'triceps-corda': 0.28, 'triceps-testa': 0.2, 'triceps-frances': 0.15,
  pulldown: 0.5, 'barra-fixa': 0, 'remada-maquina': 0.45, 'remada-baixa': 0.45, 'remada-barra': 0.4, 'remada-halter': 0.22,
  'rosca-direta': 0.2, 'rosca-alternada': 0.1, 'rosca-martelo': 0.1,
  'leg-press': 1.2, agachamento: 0.5, avanco: 0.15, extensora: 0.4, stiff: 0.4, 'mesa-flexora': 0.3, 'cadeira-flexora': 0.3,
  'elevacao-pelvica': 0.6, 'gluteo-polia': 0.15, 'cadeira-abdutora': 0.5, 'panturrilha-em-pe': 0.6, 'panturrilha-sentado': 0.4,
  crunch: 0, 'abdominal-maquina': 0.3, 'abdominal-polia': 0.25, 'abdominal-infra': 0,
};

const LEVEL_LOAD: Record<Level, number> = { iniciante: 1, intermediario: 1.3, avancado: 1.6 };

/** Arredonda para anilhas reais: 1 kg abaixo de 20, 2,5 kg até 60 e 5 kg acima. */
export function roundLoad(kg: number): number {
  if (kg <= 0) return 0;
  const step = kg < 20 ? 1 : kg < 60 ? 2.5 : 5;
  return Math.max(step, Math.round(kg / step) * step);
}

/** Carga inicial estimada, ou null se o exercício não tem estimativa (aí vale o padrão da biblioteca). */
export function estimateLoad(exerciseId: string, bodyKg: number, level: Level): number | null {
  return exerciseId in START_RATIO ? startingLoad(exerciseId, bodyKg, level) : null;
}

export function startingLoad(exerciseId: string, bodyKg: number, level: Level): number {
  const ratio = START_RATIO[exerciseId] ?? 0;
  const body = Math.min(150, Math.max(40, bodyKg));
  return roundLoad(body * ratio * LEVEL_LOAD[level]);
}

// ── Séries e repetições ─────────────────────────────────────────────────────

const SETS: Record<Level, Record<SlotKind, number>> = {
  iniciante: { composto: 3, acessorio: 2 },
  intermediario: { composto: 4, acessorio: 3 },
  avancado: { composto: 4, acessorio: 3 },
};

const REPS: Record<Goal, Record<SlotKind, number>> = {
  'ganhar-massa': { composto: 8, acessorio: 12 },
  'perder-gordura': { composto: 12, acessorio: 15 },
  'manter-forma': { composto: 10, acessorio: 12 },
};

// ── Divisões ────────────────────────────────────────────────────────────────

interface DayTemplate {
  name: string;
  slots: SlotId[];
  /** Usa as variações "B" dos exercícios. */
  alt?: boolean;
}

const D = {
  fullA: { name: 'Corpo inteiro 1', slots: ['quad_comp', 'peito_comp', 'costas_vert', 'post_comp', 'ombro_lat', 'abs'] },
  fullB: { name: 'Corpo inteiro 2', slots: ['gluteo', 'peito_inc', 'costas_horiz', 'ombro_comp', 'triceps', 'biceps'] },
  fullC: { name: 'Corpo inteiro 3', alt: true, slots: ['quad_comp', 'peito_comp', 'costas_vert', 'post_comp', 'ombro_post', 'abs'] },
  pushA: { name: 'Empurrar', slots: ['peito_comp', 'ombro_comp', 'peito_inc', 'peito_iso', 'ombro_lat', 'triceps'] },
  pushB: { name: 'Empurrar 2', alt: true, slots: ['peito_comp', 'ombro_comp', 'peito_inc', 'peito_iso', 'ombro_lat', 'triceps'] },
  pullA: { name: 'Puxar', slots: ['costas_vert', 'costas_horiz', 'ombro_post', 'biceps', 'abs'] },
  pullB: { name: 'Puxar 2', alt: true, slots: ['costas_vert', 'costas_horiz', 'ombro_post', 'biceps', 'abs'] },
  legsA: { name: 'Pernas', slots: ['quad_comp', 'post_comp', 'quad_iso', 'gluteo', 'panturrilha', 'abs'] },
  legsB: { name: 'Pernas 2', alt: true, slots: ['quad_comp', 'post_comp', 'quad_iso', 'gluteo', 'panturrilha', 'abs'] },
  upperA: { name: 'Superior', slots: ['peito_comp', 'costas_horiz', 'ombro_comp', 'costas_vert', 'biceps', 'triceps'] },
  upperB: { name: 'Superior 2', alt: true, slots: ['peito_comp', 'costas_horiz', 'ombro_comp', 'costas_vert', 'biceps', 'triceps'] },
  lowerA: { name: 'Inferior', slots: ['quad_comp', 'post_comp', 'gluteo', 'quad_iso', 'panturrilha', 'abs'] },
  lowerB: { name: 'Inferior 2', alt: true, slots: ['quad_comp', 'post_comp', 'gluteo', 'quad_iso', 'panturrilha', 'abs'] },
} satisfies Record<string, DayTemplate>;

interface Split {
  label: string;
  note: string;
  days: DayTemplate[];
}

export const MIN_FREQUENCY = 2;
export const MAX_FREQUENCY = 6;

function pickSplit(frequency: number, level: Level): Split {
  switch (Math.min(MAX_FREQUENCY, Math.max(MIN_FREQUENCY, Math.round(frequency)))) {
    case 2:
      return {
        label: 'Corpo inteiro',
        note: 'Cada treino trabalha o corpo todo. Com poucos dias, é a forma de treinar cada músculo ao menos uma vez por semana.',
        days: [D.fullA, D.fullB],
      };
    case 3:
      return level === 'iniciante'
        ? {
            label: 'Corpo inteiro',
            note: 'Três treinos de corpo inteiro: você repete cada movimento com frequência e aprende a técnica mais rápido.',
            days: [D.fullA, D.fullB, D.fullC],
          }
        : {
            label: 'Empurrar · Puxar · Pernas',
            note: 'Cada dia reúne um tipo de movimento, com mais volume por músculo.',
            days: [D.pushA, D.pullA, D.legsA],
          };
    case 4:
      return {
        label: 'Superior · Inferior',
        note: 'Alterna a parte de cima e a de baixo do corpo, com dois treinos para cada região na semana.',
        days: [D.upperA, D.lowerA, D.upperB, D.lowerB],
      };
    case 5:
      return {
        label: 'Empurrar · Puxar · Pernas + Superior · Inferior',
        note: 'Três dias de empurrar, puxar e pernas, mais um dia de parte de cima e outro de parte de baixo.',
        days: [D.pushA, D.pullA, D.legsA, { ...D.upperB, name: 'Superior' }, { ...D.lowerB, name: 'Inferior' }],
      };
    default:
      return {
        label: 'Empurrar · Puxar · Pernas (2x)',
        note: 'Empurrar, puxar e pernas duas vezes por semana, com variações dos exercícios no segundo bloco.',
        days: [D.pushA, D.pullA, D.legsA, D.pushB, D.pullB, D.legsB],
      };
  }
}

// ── Foco ────────────────────────────────────────────────────────────────────

export type FocusKey = 'gluteos' | 'bracos' | 'costas' | 'abdomen';

/** Máximo de exercícios extras que o foco acrescenta a um treino. */
const MAX_FOCUS_EXTRAS = 2;

interface FocusRule {
  /** Exercícios extras, em ordem de prioridade. */
  slots: SlotId[];
  /** Em quais dias entram, conforme o que o dia já trabalha. */
  appliesTo: (day: DayTemplate) => boolean;
}

const hasAny = (day: DayTemplate, ids: SlotId[]) => day.slots.some((s) => ids.includes(s));

const FOCUS: Record<FocusKey, FocusRule> = {
  gluteos: { slots: ['gluteo', 'post_comp'], appliesTo: (d) => hasAny(d, ['quad_comp']) },
  bracos: {
    slots: ['biceps', 'triceps'],
    appliesTo: (d) => hasAny(d, ['peito_comp', 'ombro_comp', 'costas_vert', 'costas_horiz']),
  },
  costas: { slots: ['costas_horiz', 'costas_vert', 'ombro_post'], appliesTo: (d) => hasAny(d, ['costas_vert', 'costas_horiz']) },
  abdomen: { slots: ['abs'], appliesTo: () => true },
};

export const FOCUS_LABEL: Record<FocusKey, string> = {
  gluteos: 'Glúteos',
  bracos: 'Braços',
  costas: 'Costas',
  abdomen: 'Abdômen',
};

/**
 * Exercícios extras do foco para um dia: usa a variação "B" quando o exercício principal já
 * está no treino, e pula o slot se as duas opções já foram usadas.
 */
function focusExtras(day: DayTemplate, level: Level, focus: FocusKey | undefined, used: Set<string>): { slot: Slot; id: string }[] {
  if (!focus || !FOCUS[focus].appliesTo(day)) return [];
  const extras: { slot: Slot; id: string }[] = [];
  for (const slotId of FOCUS[focus].slots) {
    if (extras.length >= MAX_FOCUS_EXTRAS) break;
    const slot: Slot = SLOTS[slotId];
    const id = [slot.ids[level], slot.alt].find((candidate) => !used.has(candidate));
    if (!id) continue;
    used.add(id);
    extras.push({ slot, id });
  }
  return extras;
}

// ── Cardio ──────────────────────────────────────────────────────────────────

function cardio(exerciseId: string, groupLabel: string, minutes: number, bpmRange: string): DayExercise {
  const exercise = findExerciseById(exerciseId)!;
  // Segue o protótipo: cada minuto vale um "conjunto" no anel de progresso.
  return { ...buildDayExerciseFromExercise(exercise), groupLabel, minutes, bpmRange, sets: minutes };
}

const FINISHER: Record<Goal, { minutes: number; bpmRange: string } | null> = {
  'ganhar-massa': null,
  'perder-gordura': { minutes: 15, bpmRange: '120 - 145 bpm' },
  'manter-forma': { minutes: 8, bpmRange: '110 - 130 bpm' },
};

// ── Gerador ─────────────────────────────────────────────────────────────────

export interface GeneratedProgram {
  title: string;
  /** Nome da divisão, ex.: "Empurrar · Puxar · Pernas". */
  split: string;
  note: string;
  restSeconds: number;
  workouts: Workout[];
}

type ProfileInput = Pick<Profile, 'goal' | 'level' | 'weightKg' | 'frequencyPerWeek'>;

export function generateProgram(
  profile: ProfileInput,
  idPrefix = `prog-${Date.now().toString(36)}`,
  focus?: FocusKey,
): GeneratedProgram {
  const split = pickSplit(profile.frequencyPerWeek, profile.level);
  const finisher = FINISHER[profile.goal];

  const workouts: Workout[] = split.days.map((day, i) => {
    const letter = String.fromCharCode(65 + i);
    const used = new Set<string>();
    const exercises: DayExercise[] = [cardio('bike', 'Aquecimento', 5, '110 - 140 bpm')];

    const planned: { slot: Slot; id: string }[] = [];
    for (const slotId of day.slots) {
      const slot: Slot = SLOTS[slotId];
      const id = day.alt ? slot.alt : slot.ids[profile.level];
      if (used.has(id)) continue;
      used.add(id);
      planned.push({ slot, id });
    }
    planned.push(...focusExtras(day, profile.level, focus, used));

    for (const { slot, id } of planned) {
      const exercise = findExerciseById(id);
      if (!exercise) continue;
      exercises.push({
        ...buildDayExerciseFromExercise(exercise),
        sets: SETS[profile.level][slot.kind],
        // Iniciante usa 2 repetições a mais nos compostos: carga menor para aprender o movimento.
        reps: slot.reps ?? REPS[profile.goal][slot.kind] + (slot.kind === 'composto' && profile.level === 'iniciante' ? 2 : 0),
        weight: startingLoad(id, profile.weightKg, profile.level),
      });
    }

    if (finisher) exercises.push(cardio('esteira', 'Cardio', finisher.minutes, finisher.bpmRange));
    return { id: `${idPrefix}-${letter.toLowerCase()}`, name: `Treino ${letter} · ${day.name}`, exercises };
  });

  return {
    title: GOAL_TITLE[profile.goal],
    split: split.label,
    note: split.note,
    restSeconds: REST_BY_GOAL[profile.goal],
    workouts,
  };
}

/** Grupos musculares trabalhados em um treino, na ordem em que aparecem (sem cardio). */
export function workoutGroups(workout: Workout): string[] {
  const seen: string[] = [];
  for (const e of workout.exercises) {
    if (e.type === 'cardio') continue;
    const name = catalog[e.groupKey].name;
    if (!seen.includes(name)) seen.push(name);
  }
  return seen;
}
