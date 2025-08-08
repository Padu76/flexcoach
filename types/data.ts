// types/data.ts - Tipi per il sistema di gestione dati centralizzato

// Versione del sistema di storage (per future migrazioni)
export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'flexcoach_data';

// Profilo utente completo
export interface UserProfile {
  // Dati base
  id: string;
  createdAt: string;
  lastUpdated: string;
  
  // Info personali
  name: string;
  email?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  
  // Dati fisici
  height?: number; // cm
  weight?: number; // kg
  bmi?: number;
  
  // Livello esperienza
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  trainingGoal: 'strength' | 'hypertrophy' | 'endurance' | 'general';
  
  // Preferenze
  preferredUnit: 'kg' | 'lbs';
  language?: string;
  timezone?: string;
}

// Calibrazione personalizzata
export interface CalibrationData {
  calibratedAt: string;
  isComplete: boolean;
  
  // Range movimento per articolazione
  mobilityRanges: {
    ankle: number;      // gradi
    hip: number;        // gradi
    shoulder: number;   // gradi
    thoracic: number;   // gradi
  };
  
  // Soglie personalizzate
  thresholds: {
    squatDepth: number;        // angolo target
    benchDepth: number;        // distanza petto
    deadliftLockout: number;   // angolo lockout
    valgusThreshold: number;   // max deviazione ginocchia
    spinalFlexion: number;     // max flessione spinale
  };
  
  // Compensazioni rilevate
  compensations: string[];
  
  // Note e limitazioni
  limitations?: string[];
  notes?: string;
}

// Singola ripetizione
export interface RepData {
  repNumber: number;
  quality: 'perfect' | 'good' | 'fair' | 'poor';
  depth: number;
  duration: number; // millisecondi
  symmetry: number; // 0-100%
  issues?: string[];
  timestamp: string;
}

// Serie di esercizio
export interface SetData {
  setNumber: number;
  exercise: string;
  weight: number;
  targetReps: number;
  completedReps: number;
  reps: RepData[];
  averageQuality: number;
  restTime?: number; // secondi
  notes?: string;
}

// Sessione di allenamento
export interface WorkoutSession {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number; // minuti
  
  // Dati allenamento
  exercises: string[];
  sets: SetData[];
  
  // Metriche globali
  totalReps: number;
  totalVolume: number; // kg totali
  perfectReps: number;
  goodReps: number;
  fairReps: number;
  poorReps: number;
  
  // Calorie e fatica
  caloriesBurned?: number;
  perceivedExertion?: number; // RPE 1-10
  fatigueLevel?: 'fresh' | 'moderate' | 'high' | 'exhausted';
  
  // Note sessione
  notes?: string;
  injuries?: string[];
  preWorkoutFeeling?: string;
  postWorkoutFeeling?: string;
}

// Record personali (PR)
export interface PersonalRecord {
  exercise: string;
  value: number;
  unit: 'kg' | 'lbs' | 'reps';
  date: string;
  bodyweight?: number;
  notes?: string;
}

// Preferenze esercizio
export interface ExercisePreferences {
  exercise: string;
  
  // Vista camera preferita
  preferredView?: 'front' | 'side' | 'auto';
  
  // Audio
  audioEnabled: boolean;
  audioVolume: number;
  countdownEnabled: boolean;
  
  // Visual
  showSkeleton: boolean;
  showMetrics: boolean;
  showTimer: boolean;
  
  // Soglie custom per questo esercizio
  customThresholds?: {
    minDepth?: number;
    maxSpeed?: number;
    restTime?: number;
  };
}

// Preferenze globali app
export interface AppPreferences {
  // UI
  theme: 'light' | 'dark' | 'auto';
  compactMode: boolean;
  animations: boolean;
  
  // Notifiche
  notifications: {
    workoutReminders: boolean;
    achievements: boolean;
    weeklyReport: boolean;
    injuryAlerts: boolean;
  };
  
  // Privacy
  shareData: boolean;
  analyticsEnabled: boolean;
  
  // Allenamento
  defaultRestTimer: number; // secondi
  autoStartNextSet: boolean;
  warmupReminder: boolean;
  
  // Camera
  defaultCamera?: string; // device id
  mirrorMode: boolean;
  
  // Audio feedback
  masterVolume: number;
  voiceCoach: 'male' | 'female' | 'off';
}

// Storia infortuni
export interface InjuryRecord {
  id: string;
  date: string;
  bodyPart: string;
  severity: 'minor' | 'moderate' | 'severe';
  exercise?: string;
  description: string;
  recoveryDays?: number;
  resolved: boolean;
  resolvedDate?: string;
  notes?: string;
}

// Achievement/Badge
export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: string;
  progress: number; // 0-100
  target: number;
  unit: string;
  icon?: string;
}

// Statistiche aggregate
export interface Statistics {
  // Globali
  totalWorkouts: number;
  totalReps: number;
  totalVolume: number;
  totalTime: number; // minuti
  totalCalories: number;
  
  // Per esercizio
  exerciseStats: {
    [exercise: string]: {
      sessions: number;
      totalReps: number;
      totalVolume: number;
      bestSet: number;
      pr: number;
      averageQuality: number;
      lastPerformed: string;
    };
  };
  
  // Streak
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate?: string;
  
  // Trend settimanali
  weeklyAverage: {
    workouts: number;
    volume: number;
    reps: number;
  };
}

// Struttura completa storage
export interface FlexCoachData {
  // Metadati
  version: string;
  lastSync: string;
  deviceId: string;
  
  // Dati utente
  profile: UserProfile | null;
  calibration: CalibrationData | null;
  
  // Allenamenti
  sessions: WorkoutSession[];
  currentSession?: WorkoutSession;
  
  // Records e achievements
  personalRecords: PersonalRecord[];
  achievements: Achievement[];
  
  // Preferenze
  exercisePreferences: ExercisePreferences[];
  appPreferences: AppPreferences;
  
  // Storia medica
  injuries: InjuryRecord[];
  
  // Statistiche
  statistics: Statistics;
  
  // Cache temporanea (non esportata)
  _cache?: {
    lastExercise?: string;
    lastWeight?: { [exercise: string]: number };
    lastView?: string;
  };
}

// Dati di export (senza cache e dati sensibili)
export interface ExportData extends Omit<FlexCoachData, '_cache' | 'deviceId'> {
  exportDate: string;
  appVersion: string;
}

// Risultato operazioni
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Eventi di cambiamento dati
export type DataChangeEvent = 
  | 'profile_updated'
  | 'calibration_completed'
  | 'workout_started'
  | 'workout_completed'
  | 'set_completed'
  | 'preferences_changed'
  | 'injury_reported'
  | 'achievement_unlocked'
  | 'data_imported'
  | 'data_exported'
  | 'data_reset';

// Callback per eventi
export type DataChangeCallback = (event: DataChangeEvent, data?: any) => void;

// Opzioni di inizializzazione
export interface DataManagerOptions {
  autoSave?: boolean;
  saveDebounce?: number; // millisecondi
  maxSessions?: number;
  enableCompression?: boolean;
  enableEncryption?: boolean;
  encryptionKey?: string;
}

// Filtri per query dati
export interface SessionFilter {
  exercise?: string;
  dateFrom?: string;
  dateTo?: string;
  minQuality?: number;
  limit?: number;
}

// Utility type per aggiornamenti parziali
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;