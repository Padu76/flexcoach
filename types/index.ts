export type ExerciseType = 'squat' | 'bench-press' | 'deadlift';

export type ExerciseFeedback = {
  message: string;
  color: 'text-red-500' | 'text-yellow-500' | 'text-green-500';
};

export type WorkoutSession = {
  exercise: ExerciseType;
  reps: number;
  feedback: ExerciseFeedback[];
};
