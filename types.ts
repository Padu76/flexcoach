
export type ExerciseName = 'squat' | 'bench-press' | 'deadlift';

export type ExerciseFeedback = {
  timestamp: number;
  message: string;
};

export type WorkoutSession = {
  exercise: ExerciseName;
  reps: number;
  feedback: ExerciseFeedback[];
};

export type UserPreferences = {
  preferredExercise: ExerciseName;
  showSkeleton: boolean;
};

export type ExerciseStats = {
  totalReps: number;
  sessionsCompleted: number;
};

export type User = {
  id: string;
  name: string;
  preferences: UserPreferences;
  stats: Record<ExerciseName, ExerciseStats>;
};
