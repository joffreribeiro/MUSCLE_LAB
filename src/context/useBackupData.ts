import { useMemo } from 'react';
import { useWorkout } from './WorkoutContext';
import type { BackupData } from '../data/backup';

/** Os dados do app no formato do backup (o que é exportado e sincronizado). */
export function useBackupData(): BackupData {
  const { workouts, activeWorkout, sessions, comments, settings, profile, onboardingComplete, weights, measures, activeProgram } = useWorkout();
  return useMemo(
    () => ({
      workouts,
      activeWorkoutId: activeWorkout?.id ?? '',
      sessions,
      comments,
      settings,
      profile,
      onboardingComplete,
      weights,
      measures,
      activeProgram,
    }),
    [workouts, activeWorkout, sessions, comments, settings, profile, onboardingComplete, weights, measures, activeProgram],
  );
}
