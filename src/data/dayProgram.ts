import { catalog, findExerciseById } from './catalog';
import { DayExercise, Exercise, Workout } from '../types';

// "2º dia do exercício" — costas+ombros. Extraído de dayEx em App Treino.dc.html.
// Seed inicial do dia — o dia de treino em si vive em WorkoutContext (mutável: dá pra
// adicionar exercícios pela biblioteca ou substituir um pelo botão ⟳ da execução).
export const seedDayExercises: DayExercise[] = [
  {
    exerciseId: 'bike',
    name: 'Bicicleta ergométrica',
    groupLabel: 'Aquecimento',
    groupKey: 'cardio',
    type: 'cardio',
    minutes: 5,
    bpmRange: '110 - 140 bpm',
    sets: 5,
  },
  {
    exerciseId: 'pulldown',
    name: 'Puxada frontal pegada fechada',
    groupLabel: 'Costas',
    groupKey: 'costas',
    type: 'strength',
    sets: 4,
    reps: 12,
    weight: 55,
  },
  {
    exerciseId: 'remada-barra',
    name: 'Remada curvada com barra',
    groupLabel: 'Costas',
    groupKey: 'costas',
    type: 'strength',
    sets: 4,
    reps: 10,
    weight: 40,
    barNote: 'incluindo o peso da barra 120 cm curva 8 kg',
  },
  {
    exerciseId: 'remada-halter',
    name: 'Remada unilateral com halter',
    groupLabel: 'Costas',
    groupKey: 'costas',
    type: 'strength',
    sets: 3,
    reps: 12,
    weight: 22,
  },
  {
    exerciseId: 'desenvolvimento',
    name: 'Desenvolvimento militar sentado',
    groupLabel: 'Ombros',
    groupKey: 'ombros',
    type: 'strength',
    sets: 4,
    reps: 10,
    weight: 30,
  },
  {
    exerciseId: 'elevacao-lateral',
    name: 'Elevação lateral com halteres',
    groupLabel: 'Ombros',
    groupKey: 'ombros',
    type: 'strength',
    sets: 3,
    reps: 14,
    weight: 8,
  },
  {
    exerciseId: 'encolhimento',
    name: 'Encolhimento de ombros com barra',
    groupLabel: 'Ombros',
    groupKey: 'ombros',
    type: 'strength',
    sets: 3,
    reps: 15,
    weight: 50,
  },
  {
    exerciseId: 'esteira',
    name: 'Esteira — corrida leve',
    groupLabel: 'Resfriamento',
    groupKey: 'cardio',
    type: 'cardio',
    minutes: 6,
    bpmRange: '100 - 120 bpm',
    sets: 6,
  },
];

// Monta um exercício de força a partir do catálogo com a prescrição informada.
function strength(exerciseId: string, sets: number, reps: number, weight: number): DayExercise {
  const exercise = findExerciseById(exerciseId)!;
  return { ...buildDayExerciseFromExercise(exercise), sets, reps, weight };
}

// Treinos iniciais (divisão ABC). O B é o dia do protótipo; A e C seguem o mesmo formato.
export const seedWorkouts: Workout[] = [
  {
    id: 'treino-a',
    name: 'Treino A · peito e tríceps',
    exercises: [
      { ...seedDayExercises[0] },
      strength('supino-reto', 4, 10, 60),
      strength('supino-inclinado-halteres', 3, 10, 22),
      strength('crucifixo', 3, 12, 14),
      strength('triceps-polia', 4, 12, 30),
      strength('triceps-frances', 3, 12, 16),
    ],
  },
  { id: 'treino-b', name: 'Treino B · costas e ombros', exercises: seedDayExercises },
  {
    id: 'treino-c',
    name: 'Treino C · pernas',
    exercises: [
      { ...seedDayExercises[0] },
      strength('agachamento', 4, 8, 80),
      strength('leg-press', 4, 12, 160),
      strength('extensora', 3, 12, 45),
      strength('mesa-flexora', 3, 12, 35),
      strength('panturrilha-em-pe', 4, 15, 60),
    ],
  },
];

export const DEFAULT_WORKOUT_ID = 'treino-b';

// Prescrição padrão ao adicionar um exercício pela biblioteca — o usuário ajusta depois.
export function buildDayExerciseFromExercise(exercise: Exercise): DayExercise {
  const groupLabel = catalog[exercise.muscleGroup].name;
  if (exercise.muscleGroup === 'cardio') {
    return {
      exerciseId: exercise.id,
      name: exercise.name,
      groupLabel,
      groupKey: exercise.muscleGroup,
      type: 'cardio',
      minutes: 5,
      bpmRange: '110 - 140 bpm',
      sets: 5,
    };
  }
  return {
    exerciseId: exercise.id,
    name: exercise.name,
    groupLabel,
    groupKey: exercise.muscleGroup,
    type: 'strength',
    sets: 3,
    reps: 12,
    // Peso corporal não tem carga; 0 vira "peso corporal" na interface.
    weight: exercise.equipment === 'peso-corporal' ? 0 : 20,
  };
}
