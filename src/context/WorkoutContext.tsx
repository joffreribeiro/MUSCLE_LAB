import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildDayExerciseFromExercise, DEFAULT_WORKOUT_ID, seedWorkouts } from '../data/dayProgram';
import { seedHistory } from '../data/seedHistory';
import {
  ActiveProgram,
  DayExercise,
  MeasureEntry,
  MeasureKey,
  Exercise,
  Profile,
  SeedHistoryGroup,
  Session,
  SetLog,
  WeightEntry,
  Workout,
  WorkoutSettings,
} from '../types';
import { averageRir, rirTag } from '../data/rir';
import { substituteWeight } from '../data/similarExercises';
import { PendingSub, applyReverts, buildSubstitute, dropSub, recordSub } from '../data/substitution';
import { dayKey } from '../data/stats';
import { removeWeight, upsertWeight } from '../data/bodyWeight';
import type { BackupData } from '../data/backup';
import { deloadWorkouts } from '../data/deload';
import { migrateEntries, removeMeasure, upsertMeasures } from '../data/bodyMeasures';
import { formatHHmm, formatSessionDate } from '../utils/format';
import { cancelRestEnd, scheduleRestEnd } from '../utils/restNotification';
import { tickDelta } from '../data/timer';
import { normalizeSupersets, toggleLink } from '../data/superset';

const STORAGE_KEYS = {
  /** Trocas "só hoje" aguardando reversão. */
  todaySubs: '@app-treino/todaySubs',
  logs: '@app-treino/logs',
  /** Legado: dia único de treino, antes de existirem vários treinos. Só lido para migrar. */
  dayExercises: '@app-treino/dayExercises',
  workouts: '@app-treino/workouts',
  activeWorkoutId: '@app-treino/activeWorkoutId',
  sessions: '@app-treino/sessions',
  comments: '@app-treino/comments',
  settings: '@app-treino/settings',
  profile: '@app-treino/profile',
  onboardingComplete: '@app-treino/onboardingComplete',
  weights: '@app-treino/weights',
  activeProgram: '@app-treino/activeProgram',
  measures: '@app-treino/measures',
};

const defaultSettings: WorkoutSettings = {
  descansoSegundos: 120,
  pesoCorporalKg: 78,
  mostrarAnalytics: true,
};

/** Quantas sessões antigas aparecem no HISTÓRICO de cada exercício. */
const HISTORY_SESSIONS_SHOWN = 5;

type LogsByExercise = Record<string, SetLog[]>;
type CommentsByExercise = Record<string, string>;

interface AddSetInput {
  weight?: string;
  reps?: string;
  minutes?: string;
  /** Na criação, null/ausente = sem RIR. Na edição, undefined = manter e null = apagar. */
  rir?: number | null;
  /** Não inicia o descanso (meio de um bi-set/tri-set: o descanso vem ao fim da rodada). */
  skipRest?: boolean;
}

/** Campos da prescrição que o editor de treino pode alterar. */
export type PrescriptionPatch = Partial<Pick<DayExercise, 'sets' | 'reps' | 'weight' | 'minutes' | 'method'>>;

const setLabel = (weight: number, reps: number, rir?: number) =>
  `${weight > 0 ? `${weight} kg x ` : ''}${reps} repetições${weight > 0 ? '' : ' · peso corporal'}${rir !== undefined ? ` · ${rirTag(rir)}` : ''}`;

interface DeletedSetStash {
  exerciseId: string;
  logIndex: number;
  entry: SetLog;
}

interface WorkoutContextValue {
  hydrated: boolean;
  settings: WorkoutSettings;

  workouts: Workout[];
  activeWorkout: Workout | undefined;
  sessions: Session[];
  /** Sessão recém-concluída, mostrada no Resumo. */
  lastSession: Session | null;

  exIndex: number;
  /** Ausente quando o treino ativo não tem exercícios. */
  currentExercise: DayExercise | undefined;
  dayExercises: DayExercise[];
  logs: LogsByExercise;
  comments: CommentsByExercise;
  rest: number;
  /** Duração total do cronômetro em andamento (descanso ou cardio), para o anel de progresso. */
  restTotal: number;
  restRunning: boolean;
  elapsed: number;
  running: boolean;
  profile: Profile | null;
  onboardingComplete: boolean;
  /** Pesagens, da mais antiga para a mais recente. */
  weights: WeightEntry[];
  /** Programa pronto em andamento; null para treinos montados à mão ou gerados pelo perfil. */
  activeProgram: ActiveProgram | null;
  /** Medidas corporais, da anotação mais antiga para a mais recente. */
  measures: MeasureEntry[];
  /** Última pesagem; sem nenhuma, o peso do perfil. */
  currentWeightKg: number;

  doneCount: (exerciseId: string) => number;
  dayPercent: number;
  totalDone: number;
  totalPrescribed: number;
  totalVolume: number;
  totalSetsLogged: number;
  /** Média de RIR das séries registradas; null se nenhuma tem RIR. */
  averageRir: number | null;

  // Treinos
  selectWorkout: (id: string) => void;
  createWorkout: (name: string) => string;
  renameWorkout: (id: string, name: string) => void;
  deleteWorkout: (id: string) => void;
  /**
   * Substitui todos os treinos por um programa gerado. O histórico de sessões é mantido;
   * séries do treino em andamento são descartadas. `restSeconds` ajusta o descanso padrão.
   * `program` marca um programa pronto com duração (começa hoje); sem ele, nenhum programa fica ativo.
   */
  applyProgram: (workouts: Workout[], restSeconds?: number, program?: { specId: string; weeks: number }) => void;
  /** Define a carga prescrita de exercícios, em todos os treinos em que aparecem (cardio fica de fora). */
  applyLoads: (changes: { exerciseId: string; weight: number }[]) => void;
  /** Reduz em cerca de 10% as cargas de todos os treinos (semana de descarga). */
  applyDeload: () => void;
  lastSessionFor: (workoutId: string) => Session | undefined;
  /** Remove uma sessão do histórico. */
  deleteSession: (id: string) => void;
  /** Grava a anotação de um treino concluído; undefined apaga. */
  setSessionNote: (id: string, note: string | undefined) => void;

  // Exercícios do treino ativo
  /** Retorna false se o exercício já está no treino (não duplica). */
  addExerciseToDay: (exercise: Exercise) => boolean;
  removeDayExerciseAt: (index: number) => void;
  /** Desfaz uma remoção: devolve o exercício na posição original. */
  insertDayExerciseAt: (index: number, exercise: DayExercise) => void;
  moveDayExercise: (index: number, delta: -1 | 1) => void;
  /** Liga ou separa o exercício e o seguinte num bi-set/tri-set. */
  toggleLinkWithNext: (index: number) => void;
  updatePrescription: (index: number, patch: PrescriptionPatch) => void;
  /** 'hoje' volta ao original quando o treino termina; 'programa' é permanente. */
  substituteDayExercise: (index: number, exercise: Exercise, scope: 'hoje' | 'programa') => void;

  // Execução
  startWorkout: () => void;
  goToExercise: (index: number) => void;
  addSet: (input: AddSetInput) => void;
  updateSet: (exerciseId: string, logIndex: number, patch: AddSetInput) => void;
  deleteSet: (exerciseId: string, logIndex: number) => void;
  undoDeleteSet: () => void;
  /**
   * Inicia, pausa ou retoma o cronômetro. Parado, começa com `seconds` (padrão: descanso configurado).
   * Em andamento, pausa; pausado com tempo restante, retoma.
   */
  toggleRest: (seconds?: number) => void;
  extendRest: (seconds: number) => void;
  skipRest: () => void;
  nextEx: () => 'advanced' | 'finished';
  prevEx: () => void;
  /** Arquiva as séries de hoje como sessão e zera o treino em andamento. */
  finishWorkout: () => void;
  historyForCurrentExercise: () => SeedHistoryGroup[];

  commentFor: (exerciseId: string) => string;
  setComment: (exerciseId: string, text: string) => void;

  /** Registra o peso (hoje, ou na data dada; substitui o do mesmo dia). Se for o mais recente, atualiza o perfil. */
  logWeight: (kg: number, dateISO?: string) => void;
  deleteWeight: (dateISO: string) => void;
  /** Grava as medidas (hoje, ou na data dada), juntando com as já anotadas nesse dia. */
  logMeasures: (values: MeasureEntry['values'], dateISO?: string) => void;
  deleteMeasure: (dateISO: string, key: MeasureKey) => void;
  updateSettings: (patch: Partial<WorkoutSettings>) => void;
  completeOnboarding: (profile: Profile) => void;
  resetOnboarding: () => void;
  /** Substitui todos os dados pelos de um backup. O treino em andamento é descartado. */
  restoreBackup: (data: BackupData) => void;
}

const WorkoutContext = createContext<WorkoutContextValue | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<WorkoutSettings>(defaultSettings);
  const [workouts, setWorkouts] = useState<Workout[]>(seedWorkouts);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string>(DEFAULT_WORKOUT_ID);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [lastSession, setLastSession] = useState<Session | null>(null);
  const [exIndex, setExIndex] = useState(0);
  const [logs, setLogs] = useState<LogsByExercise>({});
  const [comments, setComments] = useState<CommentsByExercise>({});
  const [rest, setRest] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [todaySubs, setTodaySubs] = useState<PendingSub[]>([]);
  const [restRunning, setRestRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [activeProgram, setActiveProgram] = useState<ActiveProgram | null>(null);
  const [measures, setMeasures] = useState<MeasureEntry[]>([]);
  const [deletedStash, setDeletedStash] = useState<DeletedSetStash | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.logs),
      AsyncStorage.getItem(STORAGE_KEYS.dayExercises),
      AsyncStorage.getItem(STORAGE_KEYS.workouts),
      AsyncStorage.getItem(STORAGE_KEYS.activeWorkoutId),
      AsyncStorage.getItem(STORAGE_KEYS.sessions),
      AsyncStorage.getItem(STORAGE_KEYS.comments),
      AsyncStorage.getItem(STORAGE_KEYS.settings),
      AsyncStorage.getItem(STORAGE_KEYS.profile),
      AsyncStorage.getItem(STORAGE_KEYS.onboardingComplete),
      AsyncStorage.getItem(STORAGE_KEYS.todaySubs),
      AsyncStorage.getItem(STORAGE_KEYS.weights),
      AsyncStorage.getItem(STORAGE_KEYS.activeProgram),
      AsyncStorage.getItem(STORAGE_KEYS.measures),
    ])
      .then(
        ([
          rawLogs,
          rawDay,
          rawWorkouts,
          rawActive,
          rawSessions,
          rawComments,
          rawSettings,
          rawProfile,
          rawOnboarding,
          rawSubs,
          rawWeights,
          rawProgram,
          rawMeasures,
        ]) => {
          if (rawLogs) setLogs(JSON.parse(rawLogs));
          let loaded: Workout[] | null = null;
          if (rawWorkouts) {
            loaded = JSON.parse(rawWorkouts);
          } else if (rawDay) {
            // Migração: o dia único editado antes vira o Treino B, mantendo as mudanças do usuário.
            const day: DayExercise[] = JSON.parse(rawDay);
            loaded = seedWorkouts.map((w) => (w.id === DEFAULT_WORKOUT_ID ? { ...w, exercises: day } : w));
          }
          // Troca "só hoje" de um dia anterior: o treino já passou, então volta ao exercício do programa.
          const pending: PendingSub[] = rawSubs ? JSON.parse(rawSubs) : [];
          if (loaded) {
            const today = dayKey(new Date());
            const reverted = applyReverts(loaded, pending, (s) => s.day !== today);
            setWorkouts(reverted.workouts);
            setTodaySubs(reverted.remaining);
          } else {
            setTodaySubs(pending);
          }
          if (rawActive) setActiveWorkoutId(JSON.parse(rawActive));
          if (rawSessions) setSessions(JSON.parse(rawSessions));
          if (rawComments) setComments(JSON.parse(rawComments));
          if (rawSettings) setSettings((prev) => ({ ...prev, ...JSON.parse(rawSettings) }));
          if (rawProfile) setProfile(JSON.parse(rawProfile));
          if (rawOnboarding) setOnboardingComplete(JSON.parse(rawOnboarding));
          if (rawWeights) setWeights(JSON.parse(rawWeights));
          if (rawProgram) setActiveProgram(JSON.parse(rawProgram));
          if (rawMeasures) setMeasures(migrateEntries(JSON.parse(rawMeasures)));
        },
      )
      .finally(() => setHydrated(true));
  }, []);

  const persist = (key: string, value: unknown) => {
    AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
  };

  useEffect(() => {
    if (hydrated) persist(STORAGE_KEYS.logs, logs);
  }, [logs, hydrated]);
  useEffect(() => {
    if (hydrated) persist(STORAGE_KEYS.workouts, workouts);
  }, [workouts, hydrated]);
  useEffect(() => {
    if (hydrated) persist(STORAGE_KEYS.activeWorkoutId, activeWorkoutId);
  }, [activeWorkoutId, hydrated]);
  useEffect(() => {
    if (hydrated) persist(STORAGE_KEYS.sessions, sessions);
  }, [sessions, hydrated]);
  useEffect(() => {
    if (hydrated) persist(STORAGE_KEYS.todaySubs, todaySubs);
  }, [todaySubs, hydrated]);
  useEffect(() => {
    if (hydrated) persist(STORAGE_KEYS.comments, comments);
  }, [comments, hydrated]);
  useEffect(() => {
    if (hydrated) persist(STORAGE_KEYS.settings, settings);
  }, [settings, hydrated]);
  useEffect(() => {
    if (hydrated) persist(STORAGE_KEYS.profile, profile);
  }, [profile, hydrated]);
  useEffect(() => {
    if (hydrated) persist(STORAGE_KEYS.onboardingComplete, onboardingComplete);
  }, [onboardingComplete, hydrated]);
  useEffect(() => {
    if (hydrated) persist(STORAGE_KEYS.weights, weights);
  }, [weights, hydrated]);
  useEffect(() => {
    if (hydrated) persist(STORAGE_KEYS.activeProgram, activeProgram);
  }, [activeProgram, hydrated]);
  useEffect(() => {
    if (hydrated) persist(STORAGE_KEYS.measures, measures);
  }, [measures, hydrated]);

  // Timer global de 1s: decrementa o descanso enquanto restRunning, incrementa a duração enquanto running.
  // Conta pelo relógio real: com a tela bloqueada o JavaScript pode pausar e o tique seguinte
  // desconta o tempo que passou, em vez de congelar o descanso e a duração do treino.
  useEffect(() => {
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const delta = tickDelta(last, now);
      last = now;
      if (restRunning) {
        setRest((r) => {
          const next = r - delta;
          if (next <= 0) setRestRunning(false);
          return Math.max(0, next);
        });
      }
      if (running) setElapsed((e) => e + delta);
    }, 1000);
    return () => clearInterval(id);
  }, [restRunning, running]);

  // Notificação do fim do descanso: agendada quando o descanso corre (início, retomada ou +30 s) e
  // cancelada ao pausar, pular ou terminar. `restRef` dá o tempo restante sem religar a cada tique.
  const restRef = useRef(rest);
  restRef.current = rest;
  const restAlertOn = settings.alertaDescanso !== false;
  useEffect(() => {
    if (restRunning && restRef.current > 0 && restAlertOn) void scheduleRestEnd(restRef.current);
    else void cancelRestEnd();
  }, [restRunning, restTotal, restAlertOn]);

  const activeWorkout = workouts.find((w) => w.id === activeWorkoutId) ?? workouts[0];
  const dayExercises = useMemo(() => activeWorkout?.exercises ?? [], [activeWorkout]);

  /** Aplica uma alteração na lista de exercícios do treino ativo. */
  const updateActiveExercises = useCallback(
    (fn: (prev: DayExercise[]) => DayExercise[]) => {
      if (!activeWorkout) return;
      // Vínculos de bi-set/tri-set que deixam de fazer sentido (mover, remover, trocar) saem sozinhos.
      setWorkouts((prev) => prev.map((w) => (w.id === activeWorkout.id ? { ...w, exercises: normalizeSupersets(fn(w.exercises)) } : w)));
    },
    [activeWorkout],
  );

  const doneCount = useCallback((exerciseId: string) => (logs[exerciseId] || []).length, [logs]);

  const totalPrescribed = useMemo(() => dayExercises.reduce((a, e) => a + e.sets, 0), [dayExercises]);

  const totalDone = useMemo(
    () => dayExercises.reduce((a, e) => a + Math.min(doneCount(e.exerciseId), e.sets), 0),
    [dayExercises, doneCount],
  );

  const dayPercent = useMemo(
    () => (totalPrescribed > 0 ? Math.round((100 * totalDone) / totalPrescribed) : 0),
    [totalDone, totalPrescribed],
  );

  const allLogsFlat = useMemo(() => Object.values(logs).flat(), [logs]);

  const totalVolume = useMemo(
    () => allLogsFlat.reduce((a, l) => a + l.weight * l.reps, 0),
    [allLogsFlat],
  );

  const avgRir = useMemo(() => averageRir(allLogsFlat.map((l) => l.rir)), [allLogsFlat]);

  const currentExercise = dayExercises[exIndex] ?? dayExercises[0];

  // ── Treinos ───────────────────────────────────────────────────────────────

  const selectWorkout = useCallback((id: string) => {
    setActiveWorkoutId(id);
    setExIndex(0);
    setRest(0);
    setRestTotal(0);
    setRestRunning(false);
  }, []);

  const createWorkout = useCallback((name: string) => {
    const id = `treino-${Date.now()}`;
    setWorkouts((prev) => [...prev, { id, name, exercises: [] }]);
    setActiveWorkoutId(id);
    setExIndex(0);
    return id;
  }, []);

  const renameWorkout = useCallback((id: string, name: string) => {
    setWorkouts((prev) => prev.map((w) => (w.id === id ? { ...w, name } : w)));
  }, []);

  const deleteWorkout = useCallback(
    (id: string) => {
      setWorkouts((prev) => {
        const next = prev.filter((w) => w.id !== id);
        if (id === activeWorkoutId) setActiveWorkoutId(next[0]?.id ?? '');
        return next;
      });
      setTodaySubs((prev) => prev.filter((s) => s.workoutId !== id));
      setExIndex(0);
    },
    [activeWorkoutId],
  );

  const applyProgram = useCallback((next: Workout[], restSeconds?: number, program?: { specId: string; weeks: number }) => {
    setWorkouts(next);
    setActiveProgram(program ? { ...program, startedISO: new Date().toISOString() } : null);
    setActiveWorkoutId(next[0]?.id ?? '');
    setTodaySubs([]);
    setExIndex(0);
    setLogs({});
    setElapsed(0);
    setRunning(false);
    setRest(0);
    setRestTotal(0);
    setRestRunning(false);
    setDeletedStash(null);
    if (restSeconds !== undefined) setSettings((prev) => ({ ...prev, descansoSegundos: restSeconds }));
  }, []);

  const setSessionNote = useCallback((id: string, note: string | undefined) => {
    const apply = (s: Session): Session => {
      if (s.id !== id) return s;
      const { note: _old, ...rest } = s;
      return note === undefined ? rest : { ...rest, note };
    };
    setSessions((prev) => prev.map(apply));
    setLastSession((prev) => (prev ? apply(prev) : prev));
  }, []);

  const applyLoads = useCallback((changes: { exerciseId: string; weight: number }[]) => {
    const byId = new Map(changes.map((c) => [c.exerciseId, c.weight]));
    setWorkouts((prev) =>
      prev.map((w) => ({
        ...w,
        exercises: w.exercises.map((e) => (e.type !== 'cardio' && byId.has(e.exerciseId) ? { ...e, weight: byId.get(e.exerciseId)! } : e)),
      })),
    );
  }, []);

  const applyDeload = useCallback(() => {
    setWorkouts((prev) => deloadWorkouts(prev));
  }, []);

  const lastSessionFor = useCallback(
    (workoutId: string) => sessions.find((s) => s.workoutId === workoutId),
    [sessions],
  );

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setLastSession((prev) => (prev?.id === id ? null : prev));
  }, []);

  // ── Exercícios do treino ativo ────────────────────────────────────────────

  const addExerciseToDay = useCallback(
    (exercise: Exercise) => {
      if (dayExercises.some((e) => e.exerciseId === exercise.id)) return false;
      updateActiveExercises((prev) => [...prev, buildDayExerciseFromExercise(exercise)]);
      return true;
    },
    [dayExercises, updateActiveExercises],
  );

  const removeDayExerciseAt = useCallback(
    (index: number) => {
      updateActiveExercises((prev) => prev.filter((_, i) => i !== index));
      setExIndex((i) => (i >= index && i > 0 ? i - 1 : i));
    },
    [updateActiveExercises],
  );

  const insertDayExerciseAt = useCallback(
    (index: number, exercise: DayExercise) => {
      updateActiveExercises((prev) => {
        if (prev.some((e) => e.exerciseId === exercise.exerciseId)) return prev;
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, exercise);
        return next;
      });
    },
    [updateActiveExercises],
  );

  const toggleLinkWithNext = useCallback(
    (index: number) => {
      updateActiveExercises((prev) => toggleLink(prev, index, `ss-${Date.now().toString(36)}`));
    },
    [updateActiveExercises],
  );

  const moveDayExercise = useCallback(
    (index: number, delta: -1 | 1) => {
      updateActiveExercises((prev) => {
        const to = index + delta;
        if (to < 0 || to >= prev.length) return prev;
        const next = [...prev];
        [next[index], next[to]] = [next[to], next[index]];
        return next;
      });
    },
    [updateActiveExercises],
  );

  const updatePrescription = useCallback(
    (index: number, patch: PrescriptionPatch) => {
      updateActiveExercises((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
    },
    [updateActiveExercises],
  );

  const substituteDayExercise = useCallback(
    (index: number, exercise: Exercise, scope: 'hoje' | 'programa') => {
      const original = dayExercises[index];
      if (!activeWorkout || !original) return;

      // A carga do exercício antigo não vale para um movimento diferente (ver substituteWeight).
      const weight = substituteWeight(exercise, original.reps, sessions, profile);

      const replacement = buildSubstitute(original, exercise, weight);
      updateActiveExercises((prev) => prev.map((e, i) => (i === index ? replacement : e)));
      setTodaySubs((prev) =>
        scope === 'hoje'
          ? recordSub(prev, {
              workoutId: activeWorkout.id,
              index,
              original,
              replacementId: exercise.id,
              day: dayKey(new Date()),
            })
          : dropSub(prev, activeWorkout.id, index),
      );
    },
    [dayExercises, activeWorkout, sessions, profile, updateActiveExercises],
  );

  // ── Execução ──────────────────────────────────────────────────────────────

  const startWorkout = useCallback(() => {
    const firstPending = dayExercises.findIndex((e) => doneCount(e.exerciseId) < e.sets);
    setExIndex(Math.max(0, firstPending));
    setRunning(true);
  }, [dayExercises, doneCount]);

  const goToExercise = useCallback((index: number) => {
    setExIndex(index);
    setRunning(true);
  }, []);

  const addSet = useCallback(
    (input: AddSetInput) => {
      const ex = dayExercises[exIndex];
      if (!ex) return;
      const now = new Date();
      const time = formatHHmm(now);
      const isCardio = ex.type === 'cardio';
      const minutes = Number(input.minutes || ex.minutes || 0);
      const weight = Number(input.weight || ex.weight || 0);
      const reps = Number(input.reps || ex.reps || 0);
      const entry: SetLog = isCardio
        ? {
            exerciseId: ex.exerciseId,
            weight: 0,
            reps: 0,
            minutes,
            label: `${minutes} min, ${ex.bpmRange}`,
            loggedAt: time,
            loggedAtISO: now.toISOString(),
          }
        : {
            exerciseId: ex.exerciseId,
            weight,
            reps,
            ...(typeof input.rir === 'number' ? { rir: input.rir } : {}),
            label: setLabel(weight, reps, typeof input.rir === 'number' ? input.rir : undefined),
            loggedAt: time,
            loggedAtISO: now.toISOString(),
          };
      setLogs((prev) => ({
        ...prev,
        [ex.exerciseId]: [entry, ...(prev[ex.exerciseId] || [])],
      }));
      // Série de força inicia o descanso (menos no meio de um bi-set/tri-set); cardio registrado não
      // deixa cronômetro sobrando.
      if (!input.skipRest || isCardio) {
        const timer = isCardio ? 0 : settings.descansoSegundos;
        setRest(timer);
        setRestTotal(timer);
        setRestRunning(!isCardio);
      }
      setRunning(true);
    },
    [dayExercises, exIndex, settings.descansoSegundos],
  );

  const updateSet = useCallback(
    (exerciseId: string, logIndex: number, patch: AddSetInput) => {
      setLogs((prev) => {
        const arr = prev[exerciseId];
        const entry = arr?.[logIndex];
        if (!entry) return prev;
        const isCardio = entry.minutes !== undefined;
        const nextArr = [...arr];
        if (isCardio) {
          const dayEx = dayExercises.find((e) => e.exerciseId === exerciseId);
          const minutes = patch.minutes !== undefined ? Number(patch.minutes) : entry.minutes ?? 0;
          nextArr[logIndex] = {
            ...entry,
            minutes,
            label: `${minutes} min, ${dayEx?.bpmRange ?? ''}`,
          };
        } else {
          const weight = patch.weight !== undefined ? Number(patch.weight) : entry.weight;
          const reps = patch.reps !== undefined ? Number(patch.reps) : entry.reps;
          const rir = patch.rir === undefined ? entry.rir : patch.rir === null ? undefined : patch.rir;
          const { rir: _old, ...rest } = entry;
          nextArr[logIndex] = {
            ...rest,
            weight,
            reps,
            ...(rir !== undefined ? { rir } : {}),
            label: setLabel(weight, reps, rir),
          };
        }
        return { ...prev, [exerciseId]: nextArr };
      });
    },
    [dayExercises],
  );

  const deleteSet = useCallback((exerciseId: string, logIndex: number) => {
    setLogs((prev) => {
      const arr = prev[exerciseId];
      const entry = arr?.[logIndex];
      if (!entry) return prev;
      setDeletedStash({ exerciseId, logIndex, entry });
      return { ...prev, [exerciseId]: arr.filter((_, i) => i !== logIndex) };
    });
  }, []);

  const undoDeleteSet = useCallback(() => {
    setDeletedStash((stash) => {
      if (!stash) return null;
      setLogs((prev) => {
        const arr = prev[stash.exerciseId] ? [...prev[stash.exerciseId]] : [];
        arr.splice(stash.logIndex, 0, stash.entry);
        return { ...prev, [stash.exerciseId]: arr };
      });
      return null;
    });
  }, []);

  const toggleRest = useCallback(
    (seconds?: number) => {
      if (restRunning) {
        setRestRunning(false); // pausa
        return;
      }
      setRunning(true);
      if (rest > 0) {
        setRestRunning(true); // retoma
        return;
      }
      const total = seconds ?? settings.descansoSegundos;
      setRest(total);
      setRestTotal(total);
      setRestRunning(true);
    },
    [restRunning, rest, settings.descansoSegundos],
  );

  const extendRest = useCallback((seconds: number) => {
    setRest((r) => r + seconds);
    setRestTotal((t) => t + seconds);
    setRestRunning(true);
  }, []);

  const skipRest = useCallback(() => {
    setRest(0);
    setRestTotal(0);
    setRestRunning(false);
  }, []);

  const nextEx = useCallback((): 'advanced' | 'finished' => {
    if (exIndex >= dayExercises.length - 1) {
      setRunning(false);
      return 'finished';
    }
    setExIndex((i) => i + 1);
    setRest(0);
    setRestTotal(0);
    setRestRunning(false);
    return 'advanced';
  }, [dayExercises.length, exIndex]);

  const prevEx = useCallback(() => {
    setExIndex((i) => Math.max(0, i - 1));
    setRest(0);
    setRestTotal(0);
    setRestRunning(false);
  }, []);

  const finishWorkout = useCallback(() => {
    const sets = Object.values(logs)
      .flat()
      .sort((a, b) => a.loggedAtISO.localeCompare(b.loggedAtISO));
    const session: Session = {
      id: `sessao-${Date.now()}`,
      workoutId: activeWorkout?.id ?? '',
      workoutName: activeWorkout?.name ?? 'Treino',
      finishedAtISO: new Date().toISOString(),
      durationSec: elapsed,
      sets,
    };
    setLastSession(session);
    // Treino sem nenhuma série registrada não entra no histórico.
    if (sets.length > 0) setSessions((prev) => [session, ...prev]);
    // Trocas "só hoje" deste treino voltam ao exercício do programa.
    const workoutId = activeWorkout?.id;
    setWorkouts((prev) => applyReverts(prev, todaySubs, (s) => s.workoutId === workoutId).workouts);
    setTodaySubs((prev) => prev.filter((s) => s.workoutId !== workoutId));
    setLogs({});
    setElapsed(0);
    setRunning(false);
    setRest(0);
    setRestTotal(0);
    setRestRunning(false);
    setExIndex(0);
    setDeletedStash(null);
  }, [logs, activeWorkout, elapsed, todaySubs]);

  const historyForCurrentExercise = useCallback((): SeedHistoryGroup[] => {
    const ex = dayExercises[exIndex];
    if (!ex) return [];
    const arr = logs[ex.exerciseId] || [];
    const live = arr.map((l, i, all) => ({
      n: `Nº${all.length - i}`,
      label: l.label,
      time: l.loggedAt,
      logIndex: i,
    }));
    const past: SeedHistoryGroup[] = sessions
      .map((s) => ({ s, sets: s.sets.filter((l) => l.exerciseId === ex.exerciseId) }))
      .filter(({ sets }) => sets.length > 0)
      .slice(0, HISTORY_SESSIONS_SHOWN)
      .map(({ s, sets }) => ({
        date: formatSessionDate(new Date(s.finishedAtISO)),
        rows: sets
          .map((l, i) => ({ n: `Nº${i + 1}`, label: l.label, time: l.loggedAt }))
          .reverse(),
      }));
    // O histórico de exemplo só aparece enquanto não há histórico real do exercício.
    const older = past.length ? past : seedHistory[ex.exerciseId] || [];
    return live.length ? [{ date: 'Hoje', rows: live }, ...older] : older;
  }, [dayExercises, exIndex, logs, sessions]);

  const commentFor = useCallback((exerciseId: string) => comments[exerciseId] ?? '', [comments]);

  const setComment = useCallback((exerciseId: string, text: string) => {
    setComments((prev) => ({ ...prev, [exerciseId]: text }));
  }, []);

  const updateSettings = useCallback((patch: Partial<WorkoutSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const completeOnboarding = useCallback((newProfile: Profile) => {
    setProfile(newProfile);
    setOnboardingComplete(true);
  }, []);

  const logWeight = useCallback(
    (kg: number, dateISO?: string) => {
      const date = dateISO ?? new Date().toISOString();
      const newest = weights.length ? weights[weights.length - 1].dateISO : null;
      setWeights((prev) => upsertWeight(prev, { dateISO: date, kg }));
      // Cargas iniciais sugeridas e o gasto calórico partem do peso atual: só vale para a pesagem mais recente.
      const isLatest = newest === null || new Date(date).setHours(0, 0, 0, 0) >= new Date(newest).setHours(0, 0, 0, 0);
      if (isLatest) setProfile((prev) => (prev ? { ...prev, weightKg: kg } : prev));
    },
    [weights],
  );

  const logMeasures = useCallback((values: MeasureEntry['values'], dateISO?: string) => {
    setMeasures((prev) => upsertMeasures(prev, dateISO ?? new Date().toISOString(), values));
  }, []);

  const deleteMeasure = useCallback((dateISO: string, key: MeasureKey) => {
    setMeasures((prev) => removeMeasure(prev, dateISO, key));
  }, []);

  const deleteWeight = useCallback((dateISO: string) => {
    setWeights((prev) => removeWeight(prev, dateISO));
  }, []);

  const restoreBackup = useCallback((data: BackupData) => {
    setWorkouts(data.workouts);
    setActiveWorkoutId(data.activeWorkoutId);
    setSessions(data.sessions);
    setComments(data.comments);
    setSettings({ ...defaultSettings, ...data.settings });
    setProfile(data.profile);
    setOnboardingComplete(data.onboardingComplete);
    setWeights(data.weights);
    setActiveProgram(data.activeProgram);
    setMeasures(data.measures);
    // Estado de um treino em andamento não pertence ao backup.
    setLastSession(null);
    setTodaySubs([]);
    setExIndex(0);
    setLogs({});
    setElapsed(0);
    setRunning(false);
    setRest(0);
    setRestTotal(0);
    setRestRunning(false);
    setDeletedStash(null);
  }, []);

  const resetOnboarding = useCallback(() => {
    setOnboardingComplete(false);
  }, []);

  const value: WorkoutContextValue = {
    hydrated,
    settings,
    workouts,
    activeWorkout,
    sessions,
    lastSession,
    exIndex,
    currentExercise,
    dayExercises,
    logs,
    comments,
    rest,
    restTotal,
    restRunning,
    elapsed,
    running,
    profile,
    onboardingComplete,
    weights,
    activeProgram,
    measures,
    currentWeightKg: weights.length ? weights[weights.length - 1].kg : profile?.weightKg ?? settings.pesoCorporalKg,
    doneCount,
    dayPercent,
    totalDone,
    totalPrescribed,
    totalVolume,
    totalSetsLogged: allLogsFlat.length,
    averageRir: avgRir,
    selectWorkout,
    createWorkout,
    renameWorkout,
    deleteWorkout,
    applyProgram,
    applyLoads,
    applyDeload,
    lastSessionFor,
    deleteSession,
    setSessionNote,
    addExerciseToDay,
    removeDayExerciseAt,
    insertDayExerciseAt,
    moveDayExercise,
    toggleLinkWithNext,
    updatePrescription,
    substituteDayExercise,
    startWorkout,
    goToExercise,
    addSet,
    updateSet,
    deleteSet,
    undoDeleteSet,
    toggleRest,
    extendRest,
    skipRest,
    nextEx,
    prevEx,
    finishWorkout,
    historyForCurrentExercise,
    commentFor,
    setComment,
    logWeight,
    deleteWeight,
    logMeasures,
    deleteMeasure,
    updateSettings,
    completeOnboarding,
    resetOnboarding,
    restoreBackup,
  };

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout deve ser usado dentro de WorkoutProvider');
  return ctx;
}
