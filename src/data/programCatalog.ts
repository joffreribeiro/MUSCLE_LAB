import { FocusKey, generateProgram, GeneratedProgram, REST_BY_GOAL } from './programGenerator';
import { ActiveProgram, Goal, Level, Profile } from '../types';

// Vitrine de programas prontos. Cada programa é só uma "receita" (objetivo + nível + dias
// por semana): os treinos, exercícios, séries e cargas saem do gerador do app (programGenerator.ts),
// usando o peso corporal de quem está olhando. Assim tudo usa exercícios que existem na biblioteca.

export interface ProgramSpec {
  id: string;
  title: string;
  /** Frase curta do cartão da lista. */
  tagline: string;
  /** "Para quem é" — texto da tela de detalhe. */
  description: string;
  goal: Goal;
  level: Level;
  frequency: number;
  /** Duração em semanas (4 ou mais). */
  weeks: number;
  /** Músculo que recebe exercícios extras; ausente = programa equilibrado. */
  focus?: FocusKey;
}

export const LEVEL_INFO: Record<Level, { stars: string; label: string }> = {
  iniciante: { stars: '★☆☆', label: 'Iniciante' },
  intermediario: { stars: '★★☆', label: 'Intermediário' },
  avancado: { stars: '★★★', label: 'Avançado' },
};

export const GOAL_LABEL: Record<Goal, string> = {
  'ganhar-massa': 'Ganhar massa',
  'perder-gordura': 'Perder gordura',
  'manter-forma': 'Manter a forma',
};

export const GOAL_ORDER: Goal[] = ['ganhar-massa', 'perder-gordura', 'manter-forma'];
export const LEVEL_ORDER: Level[] = ['iniciante', 'intermediario', 'avancado'];

export const PROGRAM_CATALOG: ProgramSpec[] = [
  {
    id: 'primeiros-passos',
    title: 'Primeiros passos',
    tagline: 'Dois treinos por semana para começar sem pressa',
    description:
      'Para quem está começando ou voltando depois de um tempo parado. São dois treinos de corpo inteiro por semana, com cargas leves, para você aprender os movimentos e criar o hábito antes de aumentar o volume.',
    goal: 'manter-forma',
    level: 'iniciante',
    frequency: 2,
    weeks: 6,
  },
  {
    id: 'base-solida',
    title: 'Base sólida',
    tagline: 'Corpo inteiro, 3 vezes por semana',
    description:
      'Para quem quer ganhar músculo desde o início. Três treinos de corpo inteiro por semana: você repete cada movimento com frequência, aprende a técnica mais rápido e cria a base de força para os programas seguintes.',
    goal: 'ganhar-massa',
    level: 'iniciante',
    frequency: 3,
    weeks: 8,
  },
  {
    id: 'massa-em-4-dias',
    title: 'Massa em 4 dias',
    tagline: 'Parte de cima e parte de baixo alternadas',
    description:
      'Para quem já pegou o jeito dos exercícios e quer mais volume por músculo. Os treinos alternam parte de cima e parte de baixo do corpo, com dois treinos para cada região na semana.',
    goal: 'ganhar-massa',
    level: 'iniciante',
    frequency: 4,
    weeks: 8,
  },
  {
    id: 'massa-intermediario',
    title: 'Massa com divisão',
    tagline: 'Cada dia foca um tipo de movimento',
    description:
      'Para quem já treina há alguns meses e quer evoluir o ganho de massa. Cada dia reúne exercícios parecidos, com mais volume por músculo e exercícios mais exigentes.',
    goal: 'ganhar-massa',
    level: 'intermediario',
    frequency: 3,
    weeks: 8,
  },
  {
    id: 'massa-superior-inferior',
    title: 'Superior e inferior',
    tagline: 'Dois treinos para cada região do corpo',
    description:
      'Para quem treina com regularidade e quer treinar cada músculo duas vezes por semana. Quatro dias alternando parte de cima e parte de baixo, com séries mais pesadas nos exercícios principais.',
    goal: 'ganhar-massa',
    level: 'intermediario',
    frequency: 4,
    weeks: 8,
  },
  {
    id: 'volume-alto',
    title: 'Volume alto',
    tagline: 'Cinco dias para quem já tem experiência',
    description:
      'Para quem treina há bastante tempo e consegue se dedicar cinco dias por semana. Mais séries por músculo e variações dos exercícios para continuar estimulando o crescimento.',
    goal: 'ganhar-massa',
    level: 'avancado',
    frequency: 5,
    weeks: 6,
  },
  {
    id: 'seis-dias',
    title: 'Seis dias de treino',
    tagline: 'Cada tipo de treino duas vezes por semana',
    description:
      'Para o nível avançado com muita disponibilidade. Seis dias por semana, repetindo cada bloco duas vezes, com variações dos exercícios no segundo bloco. Exige boa recuperação e sono em dia.',
    goal: 'ganhar-massa',
    level: 'avancado',
    frequency: 6,
    weeks: 6,
  },
  {
    id: 'queima-leve',
    title: 'Queima leve',
    tagline: 'Treino de corpo inteiro com cardio no final',
    description:
      'Para quem quer perder gordura e está começando. Três treinos de corpo inteiro, descanso curto entre as séries para manter o ritmo e 15 minutos de esteira no final de cada treino.',
    goal: 'perder-gordura',
    level: 'iniciante',
    frequency: 3,
    weeks: 8,
  },
  {
    id: 'queima-intermediario',
    title: 'Queima de gordura',
    tagline: 'Mais volume, descanso curto e cardio',
    description:
      'Para quem já treina e quer perder gordura mantendo a massa muscular. Quatro dias com repetições mais altas, descanso curto e 15 minutos de esteira no final.',
    goal: 'perder-gordura',
    level: 'intermediario',
    frequency: 4,
    weeks: 8,
  },
  {
    id: 'queima-intensa',
    title: 'Queima intensa',
    tagline: 'Cinco dias de treino e cardio',
    description:
      'Para o nível avançado que quer definição. Cinco dias por semana, repetições altas, descanso curto e cardio no final de todos os treinos.',
    goal: 'perder-gordura',
    level: 'avancado',
    frequency: 5,
    weeks: 6,
  },
  {
    id: 'em-forma',
    title: 'Em forma',
    tagline: 'Equilíbrio entre força e condicionamento',
    description:
      'Para quem quer manter a forma sem exagero. Três treinos por semana, repetições moderadas e um cardio leve de 8 minutos no final.',
    goal: 'manter-forma',
    level: 'intermediario',
    frequency: 3,
    weeks: 8,
  },
  {
    id: 'manutencao-forte',
    title: 'Manutenção forte',
    tagline: 'Quatro dias para manter o que você conquistou',
    description:
      'Para quem já tem experiência e quer manter força e massa. Quatro dias alternando parte de cima e parte de baixo, com cardio leve no final.',
    goal: 'manter-forma',
    level: 'avancado',
    frequency: 4,
    weeks: 6,
  },
  {
    id: 'gluteos-em-foco',
    title: 'Glúteos em foco',
    tagline: 'Parte de baixo reforçada, quatro dias por semana',
    description:
      'Para quem quer dar mais atenção aos glúteos. Os treinos de parte de baixo ganham elevação pélvica e exercícios para a parte de trás da coxa, e a parte de cima continua em dia para o corpo ficar equilibrado.',
    goal: 'ganhar-massa',
    level: 'intermediario',
    frequency: 4,
    weeks: 8,
    focus: 'gluteos',
  },
  {
    id: 'bracos-fortes',
    title: 'Braços fortes',
    tagline: 'Bíceps e tríceps com volume extra',
    description:
      'Para quem quer braços maiores. Nos dias de parte de cima entram exercícios extras de bíceps e tríceps, sem deixar de treinar peito, costas e ombros, que também ajudam o braço a crescer.',
    goal: 'ganhar-massa',
    level: 'intermediario',
    frequency: 4,
    weeks: 8,
    focus: 'bracos',
  },
  {
    id: 'costas-largas',
    title: 'Costas largas',
    tagline: 'Mais remadas e puxadas na semana',
    description:
      'Para quem quer costas mais largas e fortes. Os dias de parte de cima ganham remadas e exercícios para a parte de trás do ombro, que melhoram a postura.',
    goal: 'ganhar-massa',
    level: 'intermediario',
    frequency: 4,
    weeks: 8,
    focus: 'costas',
  },
  {
    id: 'abdomen-definido',
    title: 'Abdômen definido',
    tagline: 'Treino de corpo inteiro com abdominais e cardio',
    description:
      'Para quem quer ressaltar o abdômen. Três treinos por semana com um exercício a mais para o abdômen em cada um, descanso curto e cardio no final. A definição também depende de alimentação e de baixo percentual de gordura.',
    goal: 'perder-gordura',
    level: 'iniciante',
    frequency: 3,
    weeks: 8,
    focus: 'abdomen',
  },
];

export const FOCUS_ORDER: FocusKey[] = ['gluteos', 'bracos', 'costas', 'abdomen'];

export function findProgramSpec(id: string): ProgramSpec | undefined {
  return PROGRAM_CATALOG.find((p) => p.id === id);
}

/** Peso usado quando o perfil ainda não existe (as cargas iniciais são estimadas pelo peso). */
export const DEFAULT_WEIGHT_KG = 70;

/** Monta o programa de verdade (treinos, exercícios, séries e cargas) para um peso corporal. */
export function buildCatalogProgram(spec: ProgramSpec, weightKg: number = DEFAULT_WEIGHT_KG): GeneratedProgram {
  return generateProgram(
    { goal: spec.goal, level: spec.level, weightKg, frequencyPerWeek: spec.frequency },
    `prog-${spec.id}-${Date.now().toString(36)}`,
    spec.focus,
  );
}

/** Perfil resultante de escolher um programa: mantém os dados pessoais e troca objetivo, nível e frequência. */
export function profileForProgram(spec: ProgramSpec, current: Profile | null): Profile {
  return {
    goal: spec.goal,
    level: spec.level,
    frequencyPerWeek: spec.frequency,
    weightKg: current?.weightKg ?? DEFAULT_WEIGHT_KG,
    heightCm: current?.heightCm ?? 170,
    age: current?.age ?? 30,
    sex: current?.sex ?? 'prefiro-nao-dizer',
  };
}

/**
 * O programa está em uso quando foi o último aplicado. Sem registro (treinos antigos ou gerados
 * pelo perfil), vale a receita sem foco que bate com objetivo, nível e frequência do perfil.
 */
export function isCurrentProgram(spec: ProgramSpec, profile: Profile | null, active: ActiveProgram | null): boolean {
  if (active) return active.specId === spec.id;
  return !spec.focus && !!profile && profile.goal === spec.goal && profile.level === spec.level && profile.frequencyPerWeek === spec.frequency;
}

export function restLabel(goal: Goal): string {
  const s = REST_BY_GOAL[goal];
  return s % 60 === 0 ? `${s / 60} min` : `${Math.floor(s / 60)} min ${s % 60} s`;
}
