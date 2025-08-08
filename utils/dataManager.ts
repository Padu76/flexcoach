// utils/dataManager.ts - Sistema centralizzato gestione dati

import {
  FlexCoachData,
  UserProfile,
  CalibrationData,
  WorkoutSession,
  PersonalRecord,
  Achievement,
  ExercisePreferences,
  AppPreferences,
  InjuryRecord,
  Statistics,
  ExportData,
  OperationResult,
  DataChangeEvent,
  DataChangeCallback,
  DataManagerOptions,
  SessionFilter,
  DeepPartial,
  STORAGE_VERSION,
  STORAGE_KEY,
  SetData,
  RepData
} from '@/types/data';

// Classe singleton per gestione dati
class DataManager {
  private static instance: DataManager;
  private data: FlexCoachData;
  private listeners: Map<string, DataChangeCallback[]> = new Map();
  private saveTimeout: NodeJS.Timeout | null = null;
  private options: DataManagerOptions = {
    autoSave: true,
    saveDebounce: 500,
    maxSessions: 100,
    enableCompression: false,
    enableEncryption: false
  };

  private constructor() {
    this.data = this.getDefaultData();
    this.loadFromStorage();
  }

  // Ottieni istanza singleton
  public static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  // Inizializza dati di default
  private getDefaultData(): FlexCoachData {
    return {
      version: STORAGE_VERSION,
      lastSync: new Date().toISOString(),
      deviceId: this.generateDeviceId(),
      profile: null,
      calibration: null,
      sessions: [],
      personalRecords: [],
      achievements: this.getDefaultAchievements(),
      exercisePreferences: [],
      appPreferences: this.getDefaultAppPreferences(),
      injuries: [],
      statistics: this.getDefaultStatistics(),
      _cache: {}
    };
  }

  // Preferenze app di default
  private getDefaultAppPreferences(): AppPreferences {
    return {
      theme: 'light',
      compactMode: false,
      animations: true,
      notifications: {
        workoutReminders: true,
        achievements: true,
        weeklyReport: true,
        injuryAlerts: true
      },
      shareData: false,
      analyticsEnabled: false,
      defaultRestTimer: 90,
      autoStartNextSet: false,
      warmupReminder: true,
      mirrorMode: false,
      masterVolume: 0.7,
      voiceCoach: 'female'
    };
  }

  // Statistiche di default
  private getDefaultStatistics(): Statistics {
    return {
      totalWorkouts: 0,
      totalReps: 0,
      totalVolume: 0,
      totalTime: 0,
      totalCalories: 0,
      exerciseStats: {},
      currentStreak: 0,
      longestStreak: 0,
      weeklyAverage: {
        workouts: 0,
        volume: 0,
        reps: 0
      }
    };
  }

  // Achievements di default
  private getDefaultAchievements(): Achievement[] {
    return [
      {
        id: 'first_workout',
        name: 'Prima Sessione',
        description: 'Completa il tuo primo allenamento',
        progress: 0,
        target: 1,
        unit: 'workout'
      },
      {
        id: 'perfect_set',
        name: 'Set Perfetto',
        description: 'Completa un set con tutte rep perfette',
        progress: 0,
        target: 1,
        unit: 'set'
      },
      {
        id: 'week_streak',
        name: 'Settimana Costante',
        description: 'Allenati per 7 giorni consecutivi',
        progress: 0,
        target: 7,
        unit: 'giorni'
      },
      {
        id: 'hundred_reps',
        name: 'Centurione',
        description: 'Completa 100 ripetizioni totali',
        progress: 0,
        target: 100,
        unit: 'reps'
      },
      {
        id: 'ton_lifted',
        name: 'Tonnellata',
        description: 'Solleva 1000kg di volume totale',
        progress: 0,
        target: 1000,
        unit: 'kg'
      }
    ];
  }

  // Genera ID univoco dispositivo
  private generateDeviceId(): string {
    const stored = localStorage.getItem('flexcoach_device_id');
    if (stored) return stored;
    
    const id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('flexcoach_device_id', id);
    return id;
  }

  // Genera ID univoco generico
  private generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // =======================
  // STORAGE OPERATIONS
  // =======================

  // Carica dati da localStorage
  public loadFromStorage(): OperationResult<FlexCoachData> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return { 
          success: true, 
          data: this.data,
          timestamp: new Date().toISOString() 
        };
      }

      const parsed = JSON.parse(stored);
      
      // Controlla versione e migra se necessario
      if (parsed.version !== STORAGE_VERSION) {
        this.migrateData(parsed);
      }

      this.data = { ...this.getDefaultData(), ...parsed };
      
      // Pulisci vecchie sessioni se oltre il limite
      this.cleanOldSessions();

      return { 
        success: true, 
        data: this.data,
        timestamp: new Date().toISOString() 
      };
    } catch (error) {
      console.error('Error loading data:', error);
      return { 
        success: false, 
        error: 'Failed to load data from storage',
        timestamp: new Date().toISOString() 
      };
    }
  }

  // Salva dati in localStorage
  public saveToStorage(): OperationResult {
    try {
      // Rimuovi cache prima di salvare
      const toSave = { ...this.data };
      delete toSave._cache;

      const serialized = JSON.stringify(toSave);
      
      // Controlla dimensione (localStorage ha limite ~10MB)
      const sizeKB = new Blob([serialized]).size / 1024;
      if (sizeKB > 5000) { // Warning a 5MB
        console.warn(`Storage size warning: ${sizeKB.toFixed(2)}KB`);
        this.cleanOldSessions(true); // Pulizia aggressiva
      }

      localStorage.setItem(STORAGE_KEY, serialized);
      this.data.lastSync = new Date().toISOString();

      return { 
        success: true,
        timestamp: new Date().toISOString() 
      };
    } catch (error) {
      console.error('Error saving data:', error);
      return { 
        success: false, 
        error: 'Failed to save data to storage',
        timestamp: new Date().toISOString() 
      };
    }
  }

  // Auto-save con debounce
  private autoSave(): void {
    if (!this.options.autoSave) return;

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveToStorage();
    }, this.options.saveDebounce);
  }

  // =======================
  // USER PROFILE
  // =======================

  public getProfile(): UserProfile | null {
    return this.data.profile;
  }

  public updateProfile(updates: DeepPartial<UserProfile>): OperationResult<UserProfile> {
    try {
      if (!this.data.profile) {
        // Crea nuovo profilo
        this.data.profile = {
          id: this.generateId('user'),
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          name: '',
          experienceLevel: 'beginner',
          trainingGoal: 'general',
          preferredUnit: 'kg',
          ...updates
        } as UserProfile;
      } else {
        // Aggiorna profilo esistente
        this.data.profile = {
          ...this.data.profile,
          ...updates,
          lastUpdated: new Date().toISOString()
        };
      }

      // Calcola BMI se abbiamo altezza e peso
      if (this.data.profile.height && this.data.profile.weight) {
        const heightM = this.data.profile.height / 100;
        this.data.profile.bmi = this.data.profile.weight / (heightM * heightM);
      }

      this.autoSave();
      this.notifyListeners('profile_updated', this.data.profile);

      return {
        success: true,
        data: this.data.profile,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update profile',
        timestamp: new Date().toISOString()
      };
    }
  }

  // =======================
  // CALIBRATION
  // =======================

  public getCalibration(): CalibrationData | null {
    return this.data.calibration;
  }

  public saveCalibration(calibration: CalibrationData): OperationResult<CalibrationData> {
    try {
      this.data.calibration = {
        ...calibration,
        calibratedAt: new Date().toISOString()
      };

      this.autoSave();
      this.notifyListeners('calibration_completed', this.data.calibration);

      return {
        success: true,
        data: this.data.calibration,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to save calibration',
        timestamp: new Date().toISOString()
      };
    }
  }

  // =======================
  // WORKOUT SESSIONS
  // =======================

  public startWorkout(exercise: string): OperationResult<WorkoutSession> {
    try {
      const session: WorkoutSession = {
        id: this.generateId('workout'),
        date: new Date().toDateString(),
        startTime: new Date().toISOString(),
        exercises: [exercise],
        sets: [],
        totalReps: 0,
        totalVolume: 0,
        perfectReps: 0,
        goodReps: 0,
        fairReps: 0,
        poorReps: 0
      };

      this.data.currentSession = session;
      this.autoSave();
      this.notifyListeners('workout_started', session);

      return {
        success: true,
        data: session,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to start workout',
        timestamp: new Date().toISOString()
      };
    }
  }

  public addSet(setData: SetData): OperationResult<WorkoutSession> {
    try {
      if (!this.data.currentSession) {
        return {
          success: false,
          error: 'No active workout session',
          timestamp: new Date().toISOString()
        };
      }

      // Aggiungi set alla sessione
      this.data.currentSession.sets.push(setData);

      // Aggiorna esercizi se nuovo
      if (!this.data.currentSession.exercises.includes(setData.exercise)) {
        this.data.currentSession.exercises.push(setData.exercise);
      }

      // Aggiorna statistiche sessione
      this.data.currentSession.totalReps += setData.completedReps;
      this.data.currentSession.totalVolume += setData.weight * setData.completedReps;

      // Conta qualità reps
      setData.reps.forEach(rep => {
        switch (rep.quality) {
          case 'perfect':
            this.data.currentSession!.perfectReps++;
            break;
          case 'good':
            this.data.currentSession!.goodReps++;
            break;
          case 'fair':
            this.data.currentSession!.fairReps++;
            break;
          case 'poor':
            this.data.currentSession!.poorReps++;
            break;
        }
      });

      // Aggiorna statistiche globali
      this.updateStatistics(setData);
      
      // Controlla achievements
      this.checkAchievements(setData);

      // Salva ultimo peso usato in cache
      if (!this.data._cache) this.data._cache = {};
      if (!this.data._cache.lastWeight) this.data._cache.lastWeight = {};
      this.data._cache.lastWeight[setData.exercise] = setData.weight;

      this.autoSave();
      this.notifyListeners('set_completed', setData);

      return {
        success: true,
        data: this.data.currentSession,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to add set',
        timestamp: new Date().toISOString()
      };
    }
  }

  public endWorkout(notes?: string): OperationResult<WorkoutSession> {
    try {
      if (!this.data.currentSession) {
        return {
          success: false,
          error: 'No active workout session',
          timestamp: new Date().toISOString()
        };
      }

      // Finalizza sessione
      this.data.currentSession.endTime = new Date().toISOString();
      const start = new Date(this.data.currentSession.startTime);
      const end = new Date(this.data.currentSession.endTime);
      this.data.currentSession.duration = Math.round((end.getTime() - start.getTime()) / 60000);

      if (notes) {
        this.data.currentSession.notes = notes;
      }

      // Calcola calorie (stima base)
      const avgWeight = this.data.profile?.weight || 70;
      const MET = 6; // MET per sollevamento pesi
      this.data.currentSession.caloriesBurned = Math.round(
        MET * avgWeight * (this.data.currentSession.duration / 60)
      );

      // Salva sessione completata
      this.data.sessions.push(this.data.currentSession);
      
      // Aggiorna statistiche globali finali
      this.data.statistics.totalWorkouts++;
      this.data.statistics.totalTime += this.data.currentSession.duration;
      this.data.statistics.totalCalories += this.data.currentSession.caloriesBurned;

      // Aggiorna streak
      this.updateStreak();

      const completedSession = { ...this.data.currentSession };
      this.data.currentSession = undefined;

      this.autoSave();
      this.notifyListeners('workout_completed', completedSession);

      return {
        success: true,
        data: completedSession,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to end workout',
        timestamp: new Date().toISOString()
      };
    }
  }

  public getSessions(filter?: SessionFilter): WorkoutSession[] {
    let sessions = [...this.data.sessions];

    if (filter) {
      if (filter.exercise) {
        sessions = sessions.filter(s => s.exercises.includes(filter.exercise!));
      }
      if (filter.dateFrom) {
        sessions = sessions.filter(s => s.date >= filter.dateFrom!);
      }
      if (filter.dateTo) {
        sessions = sessions.filter(s => s.date <= filter.dateTo!);
      }
      if (filter.minQuality) {
        sessions = sessions.filter(s => {
          const avgQuality = (s.perfectReps * 4 + s.goodReps * 3 + s.fairReps * 2 + s.poorReps) / 
                            (s.totalReps || 1);
          return avgQuality >= filter.minQuality!;
        });
      }
      if (filter.limit) {
        sessions = sessions.slice(-filter.limit);
      }
    }

    return sessions.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }

  public getCurrentSession(): WorkoutSession | undefined {
    return this.data.currentSession;
  }

  // =======================
  // PREFERENCES
  // =======================

  public getAppPreferences(): AppPreferences {
    return this.data.appPreferences;
  }

  public updateAppPreferences(updates: DeepPartial<AppPreferences>): OperationResult<AppPreferences> {
    try {
      // FIX: Merge profondo mantenendo i campi required di notifications
      const currentPrefs = this.data.appPreferences;
      
      // Merge manuale per gestire correttamente notifications
      const mergedPreferences: AppPreferences = {
        ...currentPrefs,
        ...updates,
        // Assicurati che notifications mantenga tutti i campi required
        notifications: {
          ...currentPrefs.notifications,
          ...(updates.notifications || {})
        }
      };

      this.data.appPreferences = mergedPreferences;

      this.autoSave();
      this.notifyListeners('preferences_changed', this.data.appPreferences);

      return {
        success: true,
        data: this.data.appPreferences,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update preferences',
        timestamp: new Date().toISOString()
      };
    }
  }

  public getExercisePreferences(exercise: string): ExercisePreferences | undefined {
    return this.data.exercisePreferences.find(p => p.exercise === exercise);
  }

  public updateExercisePreferences(
    exercise: string, 
    updates: DeepPartial<ExercisePreferences>
  ): OperationResult<ExercisePreferences> {
    try {
      const index = this.data.exercisePreferences.findIndex(p => p.exercise === exercise);
      
      if (index === -1) {
        // Crea nuove preferenze
        const newPrefs: ExercisePreferences = {
          exercise,
          audioEnabled: true,
          audioVolume: 0.7,
          countdownEnabled: true,
          showSkeleton: true,
          showMetrics: true,
          showTimer: true,
          ...updates
        };
        this.data.exercisePreferences.push(newPrefs);
        
        this.autoSave();
        return {
          success: true,
          data: newPrefs,
          timestamp: new Date().toISOString()
        };
      } else {
        // Aggiorna preferenze esistenti
        this.data.exercisePreferences[index] = {
          ...this.data.exercisePreferences[index],
          ...updates
        };
        
        this.autoSave();
        return {
          success: true,
          data: this.data.exercisePreferences[index],
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update exercise preferences',
        timestamp: new Date().toISOString()
      };
    }
  }

  // =======================
  // PERSONAL RECORDS
  // =======================

  public getPersonalRecords(exercise?: string): PersonalRecord[] {
    if (exercise) {
      return this.data.personalRecords.filter(pr => pr.exercise === exercise);
    }
    return this.data.personalRecords;
  }

  public checkAndUpdatePR(exercise: string, weight: number, reps: number = 1): boolean {
    const existing = this.data.personalRecords.find(
      pr => pr.exercise === exercise && pr.unit === 'kg'
    );

    const value = reps === 1 ? weight : weight * (1 + reps / 30); // Formula Brzycki per 1RM

    if (!existing || value > existing.value) {
      if (existing) {
        existing.value = value;
        existing.date = new Date().toISOString();
        existing.bodyweight = this.data.profile?.weight;
      } else {
        this.data.personalRecords.push({
          exercise,
          value,
          unit: 'kg',
          date: new Date().toISOString(),
          bodyweight: this.data.profile?.weight
        });
      }
      
      this.autoSave();
      return true;
    }

    return false;
  }

  // =======================
  // INJURIES
  // =======================

  public reportInjury(injury: Omit<InjuryRecord, 'id'>): OperationResult<InjuryRecord> {
    try {
      const newInjury: InjuryRecord = {
        ...injury,
        id: this.generateId('injury'),
        resolved: false
      };

      this.data.injuries.push(newInjury);
      this.autoSave();
      this.notifyListeners('injury_reported', newInjury);

      return {
        success: true,
        data: newInjury,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to report injury',
        timestamp: new Date().toISOString()
      };
    }
  }

  public getActiveInjuries(): InjuryRecord[] {
    return this.data.injuries.filter(i => !i.resolved);
  }

  // =======================
  // STATISTICS
  // =======================

  public getStatistics(): Statistics {
    return this.data.statistics;
  }

  private updateStatistics(setData: SetData): void {
    const stats = this.data.statistics;
    
    // Aggiorna globali
    stats.totalReps += setData.completedReps;
    stats.totalVolume += setData.weight * setData.completedReps;

    // Aggiorna per esercizio
    if (!stats.exerciseStats[setData.exercise]) {
      stats.exerciseStats[setData.exercise] = {
        sessions: 0,
        totalReps: 0,
        totalVolume: 0,
        bestSet: 0,
        pr: 0,
        averageQuality: 0,
        lastPerformed: new Date().toISOString()
      };
    }

    const exStats = stats.exerciseStats[setData.exercise];
    exStats.totalReps += setData.completedReps;
    exStats.totalVolume += setData.weight * setData.completedReps;
    exStats.lastPerformed = new Date().toISOString();
    
    if (setData.weight > exStats.pr) {
      exStats.pr = setData.weight;
    }
    
    if (setData.completedReps > exStats.bestSet) {
      exStats.bestSet = setData.completedReps;
    }

    // Aggiorna qualità media
    const totalQuality = setData.reps.reduce((sum, rep) => {
      const quality = rep.quality === 'perfect' ? 4 :
                     rep.quality === 'good' ? 3 :
                     rep.quality === 'fair' ? 2 : 1;
      return sum + quality;
    }, 0);
    
    exStats.averageQuality = (exStats.averageQuality * (exStats.totalReps - setData.completedReps) + 
                              totalQuality) / exStats.totalReps;
  }

  private updateStreak(): void {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    const lastWorkout = this.data.statistics.lastWorkoutDate;
    
    if (!lastWorkout) {
      this.data.statistics.currentStreak = 1;
    } else if (lastWorkout === yesterday) {
      this.data.statistics.currentStreak++;
    } else if (lastWorkout !== today) {
      this.data.statistics.currentStreak = 1;
    }
    
    if (this.data.statistics.currentStreak > this.data.statistics.longestStreak) {
      this.data.statistics.longestStreak = this.data.statistics.currentStreak;
    }
    
    this.data.statistics.lastWorkoutDate = today;
  }

  // =======================
  // ACHIEVEMENTS
  // =======================

  public getAchievements(): Achievement[] {
    return this.data.achievements;
  }

  private checkAchievements(setData: SetData): void {
    // First workout
    const firstWorkout = this.data.achievements.find(a => a.id === 'first_workout');
    if (firstWorkout && !firstWorkout.unlockedAt && this.data.statistics.totalWorkouts >= 1) {
      firstWorkout.progress = 100;
      firstWorkout.unlockedAt = new Date().toISOString();
      this.notifyListeners('achievement_unlocked', firstWorkout);
    }

    // Perfect set
    const perfectSet = this.data.achievements.find(a => a.id === 'perfect_set');
    if (perfectSet && !perfectSet.unlockedAt) {
      const allPerfect = setData.reps.every(r => r.quality === 'perfect');
      if (allPerfect && setData.completedReps >= 5) {
        perfectSet.progress = 100;
        perfectSet.unlockedAt = new Date().toISOString();
        this.notifyListeners('achievement_unlocked', perfectSet);
      }
    }

    // Hundred reps
    const hundredReps = this.data.achievements.find(a => a.id === 'hundred_reps');
    if (hundredReps && !hundredReps.unlockedAt) {
      hundredReps.progress = Math.min(100, (this.data.statistics.totalReps / 100) * 100);
      if (hundredReps.progress >= 100) {
        hundredReps.unlockedAt = new Date().toISOString();
        this.notifyListeners('achievement_unlocked', hundredReps);
      }
    }

    // Ton lifted
    const tonLifted = this.data.achievements.find(a => a.id === 'ton_lifted');
    if (tonLifted && !tonLifted.unlockedAt) {
      tonLifted.progress = Math.min(100, (this.data.statistics.totalVolume / 1000) * 100);
      if (tonLifted.progress >= 100) {
        tonLifted.unlockedAt = new Date().toISOString();
        this.notifyListeners('achievement_unlocked', tonLifted);
      }
    }
  }

  // =======================
  // EXPORT/IMPORT
  // =======================

  public exportData(): ExportData {
    const exportData: ExportData = {
      version: this.data.version,
      lastSync: this.data.lastSync,
      profile: this.data.profile,
      calibration: this.data.calibration,
      sessions: this.data.sessions,
      personalRecords: this.data.personalRecords,
      achievements: this.data.achievements,
      exercisePreferences: this.data.exercisePreferences,
      appPreferences: this.data.appPreferences,
      injuries: this.data.injuries,
      statistics: this.data.statistics,
      exportDate: new Date().toISOString(),
      appVersion: '1.0.0'
    };

    return exportData;
  }

  public exportToFile(): void {
    const data = this.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flexcoach_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.notifyListeners('data_exported', data);
  }

  public importData(data: ExportData): OperationResult {
    try {
      // Valida struttura dati
      if (!data.version || !data.profile) {
        return {
          success: false,
          error: 'Invalid data format',
          timestamp: new Date().toISOString()
        };
      }

      // Merge con dati esistenti o sovrascrivi
      this.data = {
        ...this.getDefaultData(),
        ...data,
        deviceId: this.data.deviceId, // Mantieni device ID
        _cache: {} // Reset cache
      };

      this.saveToStorage();
      this.notifyListeners('data_imported', data);

      return {
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to import data',
        timestamp: new Date().toISOString()
      };
    }
  }

  public importFromFile(file: File): Promise<OperationResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(this.importData(data));
        } catch (error) {
          resolve({
            success: false,
            error: 'Failed to parse file',
            timestamp: new Date().toISOString()
          });
        }
      };
      
      reader.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to read file',
          timestamp: new Date().toISOString()
        });
      };
      
      reader.readAsText(file);
    });
  }

  // =======================
  // UTILITIES
  // =======================

  private cleanOldSessions(aggressive: boolean = false): void {
    const maxSessions = aggressive ? 50 : this.options.maxSessions || 100;
    
    if (this.data.sessions.length > maxSessions) {
      // Mantieni solo le sessioni più recenti
      this.data.sessions = this.data.sessions
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, maxSessions);
    }
  }

  private migrateData(oldData: any): void {
    // Implementa logica di migrazione per versioni future
    console.log('Migrating data from version:', oldData.version);
    // Per ora, mantieni i dati come sono
  }

  public clearAllData(): OperationResult {
    if (confirm('Sei sicuro di voler cancellare tutti i dati? Questa azione non può essere annullata.')) {
      this.data = this.getDefaultData();
      this.saveToStorage();
      this.notifyListeners('data_reset', null);
      
      return {
        success: true,
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      success: false,
      error: 'Operation cancelled',
      timestamp: new Date().toISOString()
    };
  }

  // =======================
  // EVENT SYSTEM
  // =======================

  public addEventListener(event: DataChangeEvent, callback: DataChangeCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public removeEventListener(event: DataChangeEvent, callback: DataChangeCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private notifyListeners(event: DataChangeEvent, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(event, data));
    }
  }

  // =======================
  // CACHE OPERATIONS
  // =======================

  public getLastWeight(exercise: string): number | undefined {
    return this.data._cache?.lastWeight?.[exercise];
  }

  public getLastExercise(): string | undefined {
    return this.data._cache?.lastExercise;
  }

  public setLastExercise(exercise: string): void {
    if (!this.data._cache) this.data._cache = {};
    this.data._cache.lastExercise = exercise;
  }

  public getLastView(): string | undefined {
    return this.data._cache?.lastView;
  }

  public setLastView(view: string): void {
    if (!this.data._cache) this.data._cache = {};
    this.data._cache.lastView = view;
  }
}

// Export singleton instance
export const dataManager = DataManager.getInstance();