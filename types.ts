export interface WorkoutSession {
  reps: number;
  feedback: ExerciseFeedback[];
}

export interface ExerciseFeedback {
  type: 'success' | 'warning' | 'error';
  message: string;
}

export interface UserPreferences {
  feedbackVoice: boolean;
  feedbackSensitivity: 'low' | 'medium' | 'high';
  units: 'metric' | 'imperial';
  defaultExercise?: string;
}

export interface User {
  id: string;
  name: string;
  preferences: UserPreferences;
}