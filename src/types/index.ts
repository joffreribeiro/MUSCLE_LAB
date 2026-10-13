export type GroupKey =
  | 'peito'
  | 'costas'
  | 'pernas'
  | 'ombros'
  | 'biceps'
  | 'triceps'
  | 'abdomen'
  | 'cardio';

export type Equipment = 'barra' | 'halteres' | 'maquina' | 'polia' | 'peso-corporal';

/** Músculos destacáveis no mapa corporal (BodyMap). */
export type MuscleKey =
  | 'peitoral'
  | 'deltoide-anterior'
  | 'deltoide-posterior'
  | 'trapezio'
  | 'dorsal'
  | 'lombar'
  | 'biceps'
  | 'triceps'
  | 'antebraco'
  | 'abdomen'
  | 'obliquos'
  | 'gluteos'
  | 'quadriceps'
  | 'isquiotibiais'
  | 'panturrilha';

/** Papel do músculo no exercício, como nos mapas de cinesiologia. */
export type MuscleRole = 'primario' | 'secundario' | 'estabilizador';

/** Região do mapa → papel mais forte que ela tem no exercício. Ausente = não pintada. */
export type RegionRoles = Partial<Record<MuscleKey, MuscleRole>>;

export type BodyView = 'frente' | 'costas';

export const equipmentLabel: Record<Equipment, string> = {
  barra: 'Barra',
  halteres: 'Halteres',
  maquina: 'Máquina',
  polia: 'Polia',
  'peso-corporal': 'Peso corporal',
};

// Placeholder de mídia — em produção troca-se pelo asset real (animação/vídeo licenciado).
export interface ExerciseMedia {
  kind: 'placeholder';
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: GroupKey;
  equipment: Equipment;
  description: string;
  steps: string[];
  warning: string;
  media: ExerciseMedia;
}

export interface MuscleGroupCatalog {
  key: GroupKey;
  name: string;
  items: Exercise[];
}

export type DayExerciseType = 'strength' | 'cardio';

export interface DayExercise {
  exerciseId: string;
  name: string;
  groupLabel: string;
  groupKey: GroupKey;
  type: DayExerciseType;
  sets: number;
  reps?: number;
  weight?: number;
  minutes?: number;
  bpmRange?: string;
  barNote?: string;
  /** Método de treino aplicado ao exercício (id de data/metodos.ts); ausente = série normal. */
  method?: string;
  /** Exercícios seguidos com o mesmo id formam um bi-set/tri-set (feitos em sequência, sem descanso entre eles). */
  supersetId?: string;
}

/** Treino montado pelo usuário (ex.: "Treino A — peito e tríceps"). */
export interface Workout {
  id: string;
  name: string;
  exercises: DayExercise[];
}

/** Treino concluído, arquivado ao tocar em "Concluir treino". */
export interface Session {
  id: string;
  workoutId: string;
  workoutName: string;
  finishedAtISO: string;
  durationSec: number;
  sets: SetLog[];
  /** Anotação livre do usuário sobre o treino. */
  note?: string;
}

export interface SetLog {
  exerciseId: string;
  weight: number;
  reps: number;
  minutes?: number;
  /** Repetições em reserva (0 = falha). Opcional: séries antigas e cardio não têm. */
  rir?: number;
  label: string;
  loggedAt: string; // HH:mm
  loggedAtISO: string;
}

export interface SeedHistoryRow {
  n: string;
  label: string;
  time: string;
  /** Índice no array de logs do exercício — só presente em linhas de hoje (editáveis/excluíveis). */
  logIndex?: number;
}

export interface SeedHistoryGroup {
  date: string;
  rows: SeedHistoryRow[];
}

export type PainelWidgetId = 'calendario' | 'corpo' | 'grupos' | 'pesoLevantado' | 'duracao' | 'calorias' | 'tipos' | 'medidas' | 'seriesSemana' | 'peso';

/** Uma ferramenta do Painel: se aparece e em que posição (a ordem do array é a ordem na tela). */
export interface PainelWidgetPref {
  id: PainelWidgetId;
  visible: boolean;
}

export interface WorkoutSettings {
  descansoSegundos: number;
  pesoCorporalKg: number;
  mostrarAnalytics: boolean;
  /** Último treino cujo aviso de descarga foi dispensado; o aviso só volta com um treino mais novo. */
  descargaDispensadaEm?: string;
  /** Ferramentas do Painel (mostrar/ocultar e ordem). Ausente = padrão. */
  painelWidgets?: PainelWidgetPref[];
  /** Dias da semana planejados para treinar (0 = domingo … 6 = sábado). Ausente = padrão da frequência. */
  diasTreino?: number[];
  /** Lembrete de peso e medidas adiado até esta data (ISO). */
  lembreteAdiadoAte?: string;
  /** Recomendações dispensadas: id → data (ISO) até a qual ficam escondidas. */
  recomendacoesAdiadas?: Record<string, string>;
  /** Peso da barra usada na calculadora de anilhas (kg). Ausente = 20. */
  barraKg?: number;
  /** Notificação no fim do descanso (som e vibração, também com a tela bloqueada). Ausente = ligada. */
  alertaDescanso?: boolean;
}

/** Pesagem do usuário; no máximo uma por dia. */
export interface WeightEntry {
  dateISO: string;
  kg: number;
}

export type MeasureKey =
  | 'pescoco'
  | 'ombros'
  | 'peito'
  | 'cintura'
  | 'quadril'
  | 'bracoEsq'
  | 'bracoDir'
  | 'antebracoEsq'
  | 'antebracoDir'
  | 'pulsoEsq'
  | 'pulsoDir'
  | 'coxaEsq'
  | 'coxaDir'
  | 'panturrilhaEsq'
  | 'panturrilhaDir'
  | 'tornozeloEsq'
  | 'tornozeloDir';

/** Medidas corporais (cm) de um dia; cada uma é opcional. No máximo uma anotação por dia. */
export interface MeasureEntry {
  dateISO: string;
  values: Partial<Record<MeasureKey, number>>;
}

/** Programa pronto em andamento: o catálogo guarda a duração, aqui fica o início. */
export interface ActiveProgram {
  specId: string;
  startedISO: string;
  weeks: number;
}

export type Goal = 'ganhar-massa' | 'perder-gordura' | 'manter-forma';
export type Level = 'iniciante' | 'intermediario' | 'avancado';
export type Sex = 'masculino' | 'feminino' | 'prefiro-nao-dizer';

export interface Profile {
  goal: Goal;
  level: Level;
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  frequencyPerWeek: number;
}
