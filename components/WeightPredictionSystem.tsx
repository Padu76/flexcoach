// components/WeightPredictionSystem.tsx - Sistema calcolo peso con DataManager integrato

'use client'

import { useState, useEffect } from 'react'
import { 
  useStatistics, 
  useWorkoutHistory, 
  useWeightSuggestion,
  useUserProfile,
  useCache
} from '@/hooks/useDataManager'
import { 
  CalculatorIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
  FireIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import type { ExerciseType } from '@/types'

interface WorkoutPlan {
  targetReps: number
  targetSets: number
  restTime: number // secondi
  objective: 'strength' | 'hypertrophy' | 'endurance' | 'power'
}

interface WeightRecommendation {
  recommended: number
  min: number
  max: number
  confidence: number // 0-100
  reasoning: string[]
  adjustment: 'increase' | 'maintain' | 'decrease'
}

interface Props {
  exerciseType: ExerciseType
  onStartWorkout: (plan: WorkoutPlan, weight: number) => void
}

export default function WeightPredictionSystem({ exerciseType, onStartWorkout }: Props) {
  // DataManager Hooks
  const { profile, hasProfile } = useUserProfile()
  const { stats, exerciseStats, getPersonalRecord } = useStatistics(exerciseType)
  const { sessions, lastWorkout, bestWorkout } = useWorkoutHistory({ 
    exercise: exerciseType, 
    limit: 10 
  })
  const { 
    lastWeight, 
    suggestion: suggestedWeight, 
    updateSuggestion,
    getProgression 
  } = useWeightSuggestion(exerciseType)
  const { setLastExercise, setLastWeight } = useCache()
  
  // Stati locali
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan>({
    targetReps: 10,
    targetSets: 3,
    restTime: 90,
    objective: 'hypertrophy'
  })
  
  const [estimatedMax, setEstimatedMax] = useState({
    squat: 100,
    'bench-press': 80,
    deadlift: 120
  })
  
  const [recommendation, setRecommendation] = useState<WeightRecommendation | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customWeight, setCustomWeight] = useState<number | null>(null)
  
  // Carica PR dal DataManager
  useEffect(() => {
    const squatPR = getPersonalRecord('squat')
    const benchPR = getPersonalRecord('bench-press')
    const deadliftPR = getPersonalRecord('deadlift')
    
    setEstimatedMax({
      squat: squatPR || 100,
      'bench-press': benchPR || 80,
      deadlift: deadliftPR || 120
    })
  }, [stats])
  
  // Calcola peso ottimale basato su dati DataManager
  const calculateOptimalWeight = (): WeightRecommendation => {
    const maxWeight = estimatedMax[exerciseType]
    let percentage = 0
    let reasoning: string[] = []
    
    // Percentuali basate su obiettivo
    switch (workoutPlan.objective) {
      case 'power':
        percentage = 95 - (workoutPlan.targetReps - 1) * 2.5
        reasoning.push('🔥 Obiettivo Potenza: peso quasi massimale')
        break
      case 'strength':
        percentage = 90 - (workoutPlan.targetReps - 3) * 2.5
        reasoning.push('💪 Obiettivo Forza: peso elevato, poche reps')
        break
      case 'hypertrophy':
        percentage = 85 - (workoutPlan.targetReps - 6) * 1.5
        reasoning.push('📈 Obiettivo Ipertrofia: volume ottimale')
        break
      case 'endurance':
        percentage = 75 - (workoutPlan.targetReps - 12) * 1
        reasoning.push('🏃 Obiettivo Resistenza: peso moderato, molte reps')
        break
    }
    
    // Aggiustamenti basati su storico sessioni DataManager
    if (sessions.length > 0) {
      // Calcola qualità media ultime sessioni
      const recentQuality = sessions.slice(0, 3).reduce((acc, s) => {
        const quality = (s.perfectReps / s.totalReps) * 100
        return acc + quality
      }, 0) / Math.min(3, sessions.length)
      
      if (recentQuality > 80) {
        percentage += 2.5
        reasoning.push('✅ Ottima forma recente: +2.5%')
      } else if (recentQuality < 50) {
        percentage -= 5
        reasoning.push('⚠️ Forma da migliorare: -5%')
      }
      
      // Controlla ultimo workout
      if (lastWorkout) {
        const lastQuality = (lastWorkout.perfectReps / lastWorkout.totalReps) * 100
        if (lastQuality > 90) {
          percentage += 2.5
          reasoning.push('⭐ Ultima sessione perfetta: +2.5%')
        }
      }
      
      // Trend miglioramento
      if (sessions.length >= 3) {
        const oldAvg = sessions.slice(-3).reduce((acc, s) => acc + s.totalVolume, 0) / 3
        const newAvg = sessions.slice(0, 3).reduce((acc, s) => acc + s.totalVolume, 0) / 3
        if (newAvg > oldAvg * 1.1) {
          reasoning.push('📈 Trend positivo rilevato')
        }
      }
    } else {
      reasoning.push('🆕 Prima sessione: inizia conservativo')
      percentage -= 10
    }
    
    // Aggiustamenti per esperienza dal profilo
    if (profile) {
      switch (profile.experienceLevel) {
        case 'beginner':
          percentage *= 0.85
          reasoning.push('👶 Principiante: sicurezza prima di tutto')
          break
        case 'advanced':
        case 'elite':
          percentage *= 1.05
          reasoning.push('🏆 Avanzato: carico ottimizzato')
          break
      }
      
      // Aggiustamenti per età
      if (profile.age && profile.age > 40) {
        percentage *= 0.95
        reasoning.push('🎯 Over 40: focus su tecnica')
      }
    }
    
    // Se c'è un peso custom impostato dall'utente, usa quello come base
    const baseWeight = customWeight || suggestedWeight || (maxWeight * percentage / 100)
    
    // Calcolo finale
    const recommended = Math.round(baseWeight / 2.5) * 2.5 // Arrotonda a 2.5kg
    const min = Math.max(20, recommended - 5)
    const max = recommended + 5
    
    // Determina direzione aggiustamento
    let adjustment: 'increase' | 'maintain' | 'decrease' = 'maintain'
    if (lastWeight) {
      if (recommended > lastWeight + 2.5) adjustment = 'increase'
      else if (recommended < lastWeight - 2.5) adjustment = 'decrease'
    }
    
    // Confidence score basato su dati disponibili
    const confidence = Math.min(100, 
      60 + 
      (sessions.length * 5) + 
      (hasProfile ? 10 : 0) +
      (exerciseStats ? 10 : 0)
    )
    
    return {
      recommended,
      min,
      max,
      confidence,
      reasoning,
      adjustment
    }
  }
  
  // Calcola raccomandazione quando cambiano i parametri
  useEffect(() => {
    const newRecommendation = calculateOptimalWeight()
    setRecommendation(newRecommendation)
  }, [workoutPlan, sessions, profile, customWeight, suggestedWeight])
  
  // Stima 1RM basato su performance
  const estimate1RM = (weight: number, reps: number): number => {
    // Formula di Epley: 1RM = weight × (1 + reps/30)
    return Math.round(weight * (1 + reps / 30))
  }
  
  // Preset obiettivi
  const objectivePresets = {
    power: { reps: 1, sets: 5, rest: 180, name: 'Potenza Massima', icon: '⚡', color: 'purple' },
    strength: { reps: 5, sets: 5, rest: 150, name: 'Forza Pura', icon: '💪', color: 'red' },
    hypertrophy: { reps: 10, sets: 4, rest: 90, name: 'Massa Muscolare', icon: '📈', color: 'blue' },
    endurance: { reps: 15, sets: 3, rest: 60, name: 'Resistenza', icon: '🏃', color: 'green' }
  }
  
  const getExerciseName = () => {
    switch (exerciseType) {
      case 'squat': return 'Squat'
      case 'bench-press': return 'Panca Piana'
      case 'deadlift': return 'Stacco da Terra'
      default: return 'Esercizio'
    }
  }
  
  const getAdjustmentIcon = () => {
    if (!recommendation) return null
    switch (recommendation.adjustment) {
      case 'increase': return <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
      case 'decrease': return <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />
      default: return <CheckCircleIcon className="w-5 h-5 text-blue-500" />
    }
  }
  
  const handleStartWorkout = () => {
    if (recommendation) {
      // Salva peso nel cache per prossima volta
      setLastWeight(exerciseType, recommendation.recommended)
      setLastExercise(exerciseType)
      
      onStartWorkout(workoutPlan, recommendation.recommended)
    }
  }
  
  // Format statistiche
  const formatStat = (value: number | undefined, suffix: string = ''): string => {
    if (value === undefined || value === 0) return '-'
    return `${value}${suffix}`
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalculatorIcon className="w-6 h-6 text-blue-600" />
          Calcolo Peso Ottimale - {getExerciseName()}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {hasProfile ? 
            `Personalizzato per ${profile?.name || 'te'} - ${stats.totalWorkouts} allenamenti registrati` :
            'Crea un profilo per raccomandazioni personalizzate'
          }
        </p>
      </div>
      
      {/* Quick Stats dal DataManager */}
      {exerciseStats && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600">PR</div>
            <div className="text-xl font-bold text-blue-600">
              {formatStat(exerciseStats.pr, 'kg')}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600">Sessioni</div>
            <div className="text-xl font-bold text-green-600">
              {formatStat(exerciseStats.sessions)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600">Volume Tot</div>
            <div className="text-xl font-bold text-purple-600">
              {formatStat(Math.round(exerciseStats.totalVolume / 1000), 't')}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600">Qualità</div>
            <div className="text-xl font-bold text-orange-600">
              {formatStat(Math.round(exerciseStats.averageQuality), '%')}
            </div>
          </div>
        </div>
      )}
      
      {/* Selezione Obiettivo */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          🎯 Seleziona il tuo obiettivo
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(objectivePresets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => {
                setWorkoutPlan({
                  targetReps: preset.reps,
                  targetSets: preset.sets,
                  restTime: preset.rest,
                  objective: key as WorkoutPlan['objective']
                })
              }}
              className={`p-3 rounded-lg border-2 transition-all ${
                workoutPlan.objective === key
                  ? `border-${preset.color}-500 bg-${preset.color}-50`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">{preset.icon}</div>
              <div className="font-semibold text-sm">{preset.name}</div>
              <div className="text-xs text-gray-600 mt-1">
                {preset.reps} reps × {preset.sets} sets
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Parametri Allenamento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ripetizioni Target
          </label>
          <input
            type="number"
            min="1"
            max="30"
            value={workoutPlan.targetReps}
            onChange={(e) => setWorkoutPlan(prev => ({ ...prev, targetReps: parseInt(e.target.value) })