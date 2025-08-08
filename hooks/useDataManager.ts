// hooks/useDataManager.ts - React Hook per gestione dati centralizzata

import { useState, useEffect, useCallback, useMemo } from 'react';
import { dataManager } from '@/utils/dataManager';
import {
  UserProfile,
  CalibrationData,
  WorkoutSession,
  PersonalRecord,
  Achievement,
  ExercisePreferences,
  AppPreferences,
  InjuryRecord,
  Statistics,
  DataChangeEvent,
  SessionFilter,
  SetData,
  RepData,
  DeepPartial
} from '@/types/data';

// Hook principale per gestione completa
export function useDataManager() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stati per tutti i dati
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [calibration, setCalibration] = useState<CalibrationData | null>(null);
  const [currentSession, setCurrentSession] = useState<WorkoutSession | undefined>(undefined);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [preferences, setPreferences] = useState<AppPreferences>(dataManager.getAppPreferences());
  const [statistics, setStatistics] = useState<Statistics>(dataManager.getStatistics());
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [injuries, setInjuries] = useState<InjuryRecord[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);

  // Carica dati iniziali
  useEffect(() => {
    const loadData = () => {
      try {
        setIsLoading(true);
        const result = dataManager.loadFromStorage();
        
        if (result.success) {
          setProfile(dataManager.getProfile());
          setCalibration(dataManager.getCalibration());
          setCurrentSession(dataManager.getCurrentSession());
          setSessions(dataManager.getSessions());
          setPreferences(dataManager.getAppPreferences());
          setStatistics(dataManager.getStatistics());
          setAchievements(dataManager.getAchievements());
          setPersonalRecords(dataManager.getPersonalRecords());
          
          // Carica infortuni attivi
          const allInjuries = dataManager.getActiveInjuries();
          setInjuries(allInjuries);
        } else {
          setError(result.error || 'Failed to load data');
        }
      } catch (err) {
        setError('Error loading data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Listener per cambiamenti
  useEffect(() => {
    const handleProfileUpdate = (_: DataChangeEvent, data: UserProfile) => {
      setProfile(data);
    };

    const handleCalibrationComplete = (_: DataChangeEvent, data: CalibrationData) => {
      setCalibration(data);
    };

    const handleWorkoutStart = (_: DataChangeEvent, data: WorkoutSession) => {
      setCurrentSession(data);
    };

    const handleWorkoutComplete = (_: DataChangeEvent, data: WorkoutSession) => {
      setCurrentSession(undefined);
      setSessions(prev => [...prev, data]);
      setStatistics(dataManager.getStatistics());
    };

    const handleSetComplete = () => {
      setCurrentSession(dataManager.getCurrentSession());
      setStatistics(dataManager.getStatistics());
    };

    const handlePreferencesChange = (_: DataChangeEvent, data: AppPreferences) => {
      setPreferences(data);
    };

    const handleAchievementUnlock = () => {
      setAchievements(dataManager.getAchievements());
    };

    const handleInjuryReport = () => {
      setInjuries(dataManager.getActiveInjuries());
    };

    // Registra listener
    dataManager.addEventListener('profile_updated', handleProfileUpdate);
    dataManager.addEventListener('calibration_completed', handleCalibrationComplete);
    dataManager.addEventListener('workout_started', handleWorkoutStart);
    dataManager.addEventListener('workout_completed', handleWorkoutComplete);
    dataManager.addEventListener('set_completed', handleSetComplete);
    dataManager.addEventListener('preferences_changed', handlePreferencesChange);
    dataManager.addEventListener('achievement_unlocked', handleAchievementUnlock);
    dataManager.addEventListener('injury_reported', handleInjuryReport);

    // Cleanup
    return () => {
      dataManager.removeEventListener('profile_updated', handleProfileUpdate);
      dataManager.removeEventListener('calibration_completed', handleCalibrationComplete);
      dataManager.removeEventListener('workout_started', handleWorkoutStart);
      dataManager.removeEventListener('workout_completed', handleWorkoutComplete);
      dataManager.removeEventListener('set_completed', handleSetComplete);
      dataManager.removeEventListener('preferences_changed', handlePreferencesChange);
      dataManager.removeEventListener('achievement_unlocked', handleAchievementUnlock);
      dataManager.removeEventListener('injury_reported', handleInjuryReport);
    };
  }, []);

  // Funzioni wrapper
  const updateProfile = useCallback((updates: DeepPartial<UserProfile>) => {
    const result = dataManager.updateProfile(updates);
    if (!result.success) {
      setError(result.error || 'Failed to update profile');
    }
    return result;
  }, []);

  const saveCalibration = useCallback((data: CalibrationData) => {
    const result = dataManager.saveCalibration(data);
    if (!result.success) {
      setError(result.error || 'Failed to save calibration');
    }
    return result;
  }, []);

  const startWorkout = useCallback((exercise: string) => {
    const result = dataManager.startWorkout(exercise);
    if (!result.success) {
      setError(result.error || 'Failed to start workout');
    }
    return result;
  }, []);

  const addSet = useCallback((setData: SetData) => {
    const result = dataManager.addSet(setData);
    if (!result.success) {
      setError(result.error || 'Failed to add set');
    }
    return result;
  }, []);

  const endWorkout = useCallback((notes?: string) => {
    const result = dataManager.endWorkout(notes);
    if (!result.success) {
      setError(result.error || 'Failed to end workout');
    }
    return result;
  }, []);

  const updatePreferences = useCallback((updates: DeepPartial<AppPreferences>) => {
    const result = dataManager.updateAppPreferences(updates);
    if (!result.success) {
      setError(result.error || 'Failed to update preferences');
    }
    return result;
  }, []);

  const reportInjury = useCallback((injury: Omit<InjuryRecord, 'id'>) => {
    const result = dataManager.reportInjury(injury);
    if (!result.success) {
      setError(result.error || 'Failed to report injury');
    }
    return result;
  }, []);

  const exportData = useCallback(() => {
    dataManager.exportToFile();
  }, []);

  const importData = useCallback(async (file: File) => {
    const result = await dataManager.importFromFile(file);
    if (result.success) {
      // Ricarica tutti i dati
      setProfile(dataManager.getProfile());
      setCalibration(dataManager.getCalibration());
      setSessions(dataManager.getSessions());
      setPreferences(dataManager.getAppPreferences());
      setStatistics(dataManager.getStatistics());
      setAchievements(dataManager.getAchievements());
      setInjuries(dataManager.getActiveInjuries());
      setPersonalRecords(dataManager.getPersonalRecords());
    } else {
      setError(result.error || 'Failed to import data');
    }
    return result;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearAllData = useCallback(() => {
    const result = dataManager.clearAllData();
    if (result.success) {
      // Reset tutti gli stati
      setProfile(null);
      setCalibration(null);
      setCurrentSession(undefined);
      setSessions([]);
      setStatistics(dataManager.getStatistics());
      setAchievements(dataManager.getAchievements());
      setInjuries([]);
      setPersonalRecords([]);
    }
    return result;
  }, []);

  return {
    // Stati
    isLoading,
    error,
    profile,
    calibration,
    currentSession,
    sessions,
    preferences,
    statistics,
    achievements,
    injuries,
    personalRecords,
    
    // Funzioni
    updateProfile,
    saveCalibration,
    startWorkout,
    addSet,
    endWorkout,
    updatePreferences,
    reportInjury,
    exportData,
    importData,
    clearError,
    clearAllData,
    
    // Helper
    isCalibrated: !!calibration?.isComplete,
    hasProfile: !!profile,
    isWorkingOut: !!currentSession,
    totalWorkouts: statistics.totalWorkouts,
    currentStreak: statistics.currentStreak
  };
}

// Hook specifico per profilo utente
export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setProfile(dataManager.getProfile());
    setIsLoading(false);

    const handleUpdate = (_: DataChangeEvent, data: UserProfile) => {
      setProfile(data);
    };

    dataManager.addEventListener('profile_updated', handleUpdate);
    return () => {
      dataManager.removeEventListener('profile_updated', handleUpdate);
    };
  }, []);

  const updateProfile = useCallback((updates: DeepPartial<UserProfile>) => {
    return dataManager.updateProfile(updates);
  }, []);

  const createProfile = useCallback((data: Omit<UserProfile, 'id' | 'createdAt' | 'lastUpdated'>) => {
    return dataManager.updateProfile(data);
  }, []);

  return {
    profile,
    isLoading,
    updateProfile,
    createProfile,
    hasProfile: !!profile,
    needsOnboarding: !profile?.name
  };
}

// Hook specifico per calibrazione
export function useCalibration() {
  const [calibration, setCalibration] = useState<CalibrationData | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);

  useEffect(() => {
    const data = dataManager.getCalibration();
    setCalibration(data);
    setIsCalibrated(!!data?.isComplete);

    const handleUpdate = (_: DataChangeEvent, data: CalibrationData) => {
      setCalibration(data);
      setIsCalibrated(data.isComplete);
    };

    dataManager.addEventListener('calibration_completed', handleUpdate);
    return () => {
      dataManager.removeEventListener('calibration_completed', handleUpdate);
    };
  }, []);

  const saveCalibration = useCallback((data: CalibrationData) => {
    return dataManager.saveCalibration(data);
  }, []);

  const needsCalibration = useCallback((exercise: string): boolean => {
    if (!calibration) return true;
    
    // Controlla se la calibrazione è vecchia (> 30 giorni)
    const calibrationDate = new Date(calibration.calibratedAt);
    const daysSince = (Date.now() - calibrationDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSince > 30;
  }, [calibration]);

  return {
    calibration,
    isCalibrated,
    saveCalibration,
    needsCalibration,
    daysSinceCalibration: calibration 
      ? Math.floor((Date.now() - new Date(calibration.calibratedAt).getTime()) / (1000 * 60 * 60 * 24))
      : null
  };
}

// Hook per sessione corrente
export function useCurrentWorkout() {
  const [session, setSession] = useState<WorkoutSession | undefined>();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const current = dataManager.getCurrentSession();
    setSession(current);
    setIsActive(!!current);

    const handleStart = (_: DataChangeEvent, data: WorkoutSession) => {
      setSession(data);
      setIsActive(true);
    };

    const handleComplete = () => {
      setSession(undefined);
      setIsActive(false);
    };

    const handleSetComplete = () => {
      setSession(dataManager.getCurrentSession());
    };

    dataManager.addEventListener('workout_started', handleStart);
    dataManager.addEventListener('workout_completed', handleComplete);
    dataManager.addEventListener('set_completed', handleSetComplete);

    return () => {
      dataManager.removeEventListener('workout_started', handleStart);
      dataManager.removeEventListener('workout_completed', handleComplete);
      dataManager.removeEventListener('set_completed', handleSetComplete);
    };
  }, []);

  const startWorkout = useCallback((exercise: string) => {
    return dataManager.startWorkout(exercise);
  }, []);

  const addSet = useCallback((setData: SetData) => {
    return dataManager.addSet(setData);
  }, []);

  const endWorkout = useCallback((notes?: string) => {
    return dataManager.endWorkout(notes);
  }, []);

  const addRep = useCallback((rep: RepData) => {
    if (!session) return;
    
    // Trova o crea il set corrente
    const currentSet = session.sets[session.sets.length - 1];
    if (currentSet) {
      currentSet.reps.push(rep);
      currentSet.completedReps = currentSet.reps.length;
      
      // Aggiorna qualità media
      const totalQuality = currentSet.reps.reduce((sum, r) => {
        const q = r.quality === 'perfect' ? 4 :
                 r.quality === 'good' ? 3 :
                 r.quality === 'fair' ? 2 : 1;
        return sum + q;
      }, 0);
      currentSet.averageQuality = totalQuality / currentSet.reps.length;
    }
  }, [session]);

  return {
    session,
    isActive,
    startWorkout,
    addSet,
    endWorkout,
    addRep,
    currentExercise: session?.exercises[session.exercises.length - 1],
    setsCompleted: session?.sets.length || 0,
    repsCompleted: session?.totalReps || 0,
    volumeLifted: session?.totalVolume || 0
  };
}

// Hook per preferenze esercizio
export function useExercisePreferences(exercise: string) {
  const [preferences, setPreferences] = useState<ExercisePreferences | undefined>();

  useEffect(() => {
    const prefs = dataManager.getExercisePreferences(exercise);
    setPreferences(prefs);
  }, [exercise]);

  const updatePreferences = useCallback((updates: DeepPartial<ExercisePreferences>) => {
    const result = dataManager.updateExercisePreferences(exercise, updates);
    if (result.success) {
      setPreferences(result.data);
    }
    return result;
  }, [exercise]);

  const getPreference = useCallback(<K extends keyof ExercisePreferences>(
    key: K
  ): ExercisePreferences[K] | undefined => {
    return preferences?.[key];
  }, [preferences]);

  return {
    preferences,
    updatePreferences,
    getPreference,
    
    // Quick access
    preferredView: preferences?.preferredView || 'auto',
    audioEnabled: preferences?.audioEnabled ?? true,
    showSkeleton: preferences?.showSkeleton ?? true,
    showMetrics: preferences?.showMetrics ?? true
  };
}

// Hook per statistiche
export function useStatistics(exercise?: string) {
  const [stats, setStats] = useState<Statistics>(dataManager.getStatistics());
  const [exerciseStats, setExerciseStats] = useState<any>(null);

  useEffect(() => {
    const allStats = dataManager.getStatistics();
    setStats(allStats);
    
    if (exercise && allStats.exerciseStats[exercise]) {
      setExerciseStats(allStats.exerciseStats[exercise]);
    }

    const handleUpdate = () => {
      const updated = dataManager.getStatistics();
      setStats(updated);
      if (exercise && updated.exerciseStats[exercise]) {
        setExerciseStats(updated.exerciseStats[exercise]);
      }
    };

    dataManager.addEventListener('set_completed', handleUpdate);
    dataManager.addEventListener('workout_completed', handleUpdate);

    return () => {
      dataManager.removeEventListener('set_completed', handleUpdate);
      dataManager.removeEventListener('workout_completed', handleUpdate);
    };
  }, [exercise]);

  const getPersonalRecord = useCallback((ex: string) => {
    const records = dataManager.getPersonalRecords(ex);
    return records.find(r => r.unit === 'kg')?.value || 0;
  }, []);

  const weeklyProgress = useMemo(() => {
    const sessions = dataManager.getSessions({ 
      dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    });
    
    return {
      workouts: sessions.length,
      volume: sessions.reduce((sum, s) => sum + s.totalVolume, 0),
      reps: sessions.reduce((sum, s) => sum + s.totalReps, 0),
      avgQuality: sessions.reduce((sum, s) => {
        const quality = (s.perfectReps * 4 + s.goodReps * 3 + s.fairReps * 2 + s.poorReps) / 
                       (s.totalReps || 1);
        return sum + quality;
      }, 0) / (sessions.length || 1)
    };
  }, [stats]);

  return {
    stats,
    exerciseStats,
    getPersonalRecord,
    weeklyProgress,
    
    // Quick stats
    totalWorkouts: stats.totalWorkouts,
    totalVolume: stats.totalVolume,
    totalReps: stats.totalReps,
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak
  };
}

// Hook per storico sessioni
export function useWorkoutHistory(filter?: SessionFilter) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSessions = () => {
      setIsLoading(true);
      const data = dataManager.getSessions(filter);
      setSessions(data);
      setIsLoading(false);
    };

    loadSessions();

    const handleUpdate = () => {
      const updated = dataManager.getSessions(filter);
      setSessions(updated);
    };

    dataManager.addEventListener('workout_completed', handleUpdate);
    return () => {
      dataManager.removeEventListener('workout_completed', handleUpdate);
    };
  }, [filter?.exercise, filter?.dateFrom, filter?.dateTo, filter?.minQuality, filter?.limit]);

  const getSession = useCallback((id: string) => {
    return sessions.find(s => s.id === id);
  }, [sessions]);

  const deleteSession = useCallback((id: string) => {
    // Non implementato nel dataManager base, ma potrebbe essere aggiunto
    console.warn('Delete session not implemented');
  }, []);

  const lastWorkout = useMemo(() => {
    return sessions.length > 0 ? sessions[0] : null;
  }, [sessions]);

  const bestWorkout = useMemo(() => {
    if (sessions.length === 0) return null;
    
    return sessions.reduce((best, current) => {
      const currentQuality = (current.perfectReps * 4 + current.goodReps * 3 + 
                             current.fairReps * 2 + current.poorReps) / 
                            (current.totalReps || 1);
      const bestQuality = (best.perfectReps * 4 + best.goodReps * 3 + 
                          best.fairReps * 2 + best.poorReps) / 
                         (best.totalReps || 1);
      
      return currentQuality > bestQuality ? current : best;
    });
  }, [sessions]);

  return {
    sessions,
    isLoading,
    getSession,
    deleteSession,
    lastWorkout,
    bestWorkout,
    totalSessions: sessions.length
  };
}

// Hook per peso suggerito
export function useWeightSuggestion(exercise: string) {
  const [lastWeight, setLastWeight] = useState<number | undefined>();
  const [suggestion, setSuggestion] = useState<number>(0);

  useEffect(() => {
    // Ottieni ultimo peso usato
    const last = dataManager.getLastWeight(exercise);
    setLastWeight(last);

    // Calcola suggerimento basato su storico
    const sessions = dataManager.getSessions({ exercise, limit: 5 });
    
    if (sessions.length > 0) {
      // Media degli ultimi 5 allenamenti
      const weights = sessions.flatMap(s => 
        s.sets.filter(set => set.exercise === exercise).map(set => set.weight)
      );
      
      if (weights.length > 0) {
        const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
        setSuggestion(Math.round(avg * 10) / 10); // Arrotonda a 0.1
      } else {
        setSuggestion(last || 20); // Default 20kg
      }
    } else {
      setSuggestion(last || 20);
    }
  }, [exercise]);

  const updateSuggestion = useCallback((weight: number) => {
    setSuggestion(weight);
  }, []);

  return {
    lastWeight,
    suggestion,
    updateSuggestion,
    
    // Helper per progressione
    getProgression: (percentage: number) => Math.round(suggestion * (1 + percentage / 100) * 10) / 10
  };
}

// Hook per achievements
export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);

  useEffect(() => {
    const data = dataManager.getAchievements();
    setAchievements(data);
    setUnlockedCount(data.filter(a => a.unlockedAt).length);

    const handleUnlock = () => {
      const updated = dataManager.getAchievements();
      setAchievements(updated);
      setUnlockedCount(updated.filter(a => a.unlockedAt).length);
    };

    dataManager.addEventListener('achievement_unlocked', handleUnlock);
    return () => {
      dataManager.removeEventListener('achievement_unlocked', handleUnlock);
    };
  }, []);

  const getProgress = useCallback((id: string) => {
    const achievement = achievements.find(a => a.id === id);
    return achievement?.progress || 0;
  }, [achievements]);

  const isUnlocked = useCallback((id: string) => {
    const achievement = achievements.find(a => a.id === id);
    return !!achievement?.unlockedAt;
  }, [achievements]);

  return {
    achievements,
    unlockedCount,
    totalCount: achievements.length,
    getProgress,
    isUnlocked,
    completionPercentage: Math.round((unlockedCount / achievements.length) * 100)
  };
}

// Hook per gestione cache
export function useCache() {
  const getLastExercise = useCallback(() => {
    return dataManager.getLastExercise();
  }, []);

  const setLastExercise = useCallback((exercise: string) => {
    dataManager.setLastExercise(exercise);
  }, []);

  const getLastView = useCallback(() => {
    return dataManager.getLastView();
  }, []);

  const setLastView = useCallback((view: string) => {
    dataManager.setLastView(view);
  }, []);

  const getLastWeight = useCallback((exercise: string) => {
    return dataManager.getLastWeight(exercise);
  }, []);

  return {
    getLastExercise,
    setLastExercise,
    getLastView,
    setLastView,
    getLastWeight
  };
}