
export type ExerciseFeedback = {
  timestamp: number;
  message: string;
  color: 'red' | 'yellow' | 'green';
};

export type WorkoutSession = {
  exercise: 'squat' | 'bench-press' | 'deadlift';
  reps: number;
  feedback: ExerciseFeedback[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  joinedAt: Date;
};

export type UserPreferences = {
  preferredUnit: 'kg' | 'lbs';
  darkMode: boolean;
};

export type ExerciseStats = {
  exercise: string;
  maxWeight: number;
  maxReps: number;
};
