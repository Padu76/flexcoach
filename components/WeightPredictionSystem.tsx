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
  }, [stats, getPersonalRecord])
  
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            onChange={(e) => setWorkoutPlan(prev => ({ ...prev, targetReps: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Serie
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={workoutPlan.targetSets}
            onChange={(e) => setWorkoutPlan(prev => ({ ...prev, targetSets: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Riposo (sec)
          </label>
          <input
            type="number"
            min="30"
            max="300"
            step="15"
            value={workoutPlan.restTime}
            onChange={(e) => setWorkoutPlan(prev => ({ ...prev, restTime: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      {/* Raccomandazione Peso */}
      {recommendation && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ScaleIcon className="w-5 h-5 text-blue-600" />
              Peso Raccomandato
              {getAdjustmentIcon()}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Affidabilità:</span>
              <div className="flex items-center gap-1">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      recommendation.confidence > 80 ? 'bg-green-500' :
                      recommendation.confidence > 60 ? 'bg-yellow-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${recommendation.confidence}%` }}
                  />
                </div>
                <span className="text-sm font-medium ml-1">{recommendation.confidence}%</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Minimo</div>
              <div className="text-2xl font-bold text-gray-700">{recommendation.min} kg</div>
            </div>
            <div className="text-center bg-white rounded-lg p-3">
              <div className="text-sm text-blue-600 mb-1 font-semibold">OTTIMALE</div>
              <div className="text-3xl font-bold text-blue-600">{recommendation.recommended} kg</div>
              {lastWeight && lastWeight !== recommendation.recommended && (
                <div className={`text-xs mt-1 ${
                  recommendation.recommended > lastWeight ? 'text-green-600' : 'text-red-600'
                }`}>
                  {recommendation.recommended > lastWeight ? '↑' : '↓'} 
                  {Math.abs(recommendation.recommended - lastWeight)} kg vs ultimo
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Massimo</div>
              <div className="text-2xl font-bold text-gray-700">{recommendation.max} kg</div>
            </div>
          </div>
          
          {/* Reasoning */}
          <div className="bg-white/50 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-700 mb-2">📊 Analisi:</div>
            <ul className="space-y-1">
              {recommendation.reasoning.map((reason, idx) => (
                <li key={idx} className="text-sm text-gray-600">{reason}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Input Peso Personalizzato */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <InformationCircleIcon className="w-4 h-4" />
          {showAdvanced ? 'Nascondi' : 'Mostra'} opzioni avanzate
        </button>
        
        {showAdvanced && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🎯 Peso personalizzato (kg)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="20"
                max="500"
                step="2.5"
                value={customWeight || ''}
                onChange={(e) => setCustomWeight(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Es: 60"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setCustomWeight(null)}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
            {customWeight && (
              <p className="text-xs text-gray-600 mt-2">
                📌 Userò {customWeight}kg come base per i calcoli
              </p>
            )}
            
            {/* Stima 1RM */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💪 Calcola il tuo massimale (1RM)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Peso (kg)"
                  id="1rm-weight"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Ripetizioni"
                  id="1rm-reps"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  const weight = parseFloat((document.getElementById('1rm-weight') as HTMLInputElement).value)
                  const reps = parseInt((document.getElementById('1rm-reps') as HTMLInputElement).value)
                  if (weight && reps) {
                    const max = estimate1RM(weight, reps)
                    setEstimatedMax(prev => ({ ...prev, [exerciseType]: max }))
                    alert(`Il tuo massimale stimato è: ${max}kg`)
                  }
                }}
                className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Calcola Massimale
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Storico Sessioni dal DataManager */}
      {sessions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-gray-600" />
            Ultime Sessioni
          </h3>
          <div className="grid gap-2">
            {sessions.slice(0, 3).map((session, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(session.date).toLocaleDateString('it-IT')}
                  </div>
                  <div className="text-xs text-gray-600">
                    {session.totalReps} reps × {session.avgWeight}kg
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {session.totalVolume} kg
                  </div>
                  <div className="text-xs text-gray-600">
                    Qualità: {Math.round((session.perfectReps / session.totalReps) * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Note e Suggerimenti */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">💡 Suggerimenti per oggi:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Fai sempre riscaldamento con peso progressivo</li>
              <li>Concentrati sulla tecnica prima del peso</li>
              <li>Ascolta il tuo corpo - riduci se necessario</li>
              {profile?.injuries && profile.injuries.length > 0 && (
                <li className="text-red-700 font-medium">
                  ⚠️ Attenzione agli infortuni registrati nel profilo
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
      
      {/* CTA Button */}
      <button
        onClick={handleStartWorkout}
        disabled={!recommendation}
        className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
          recommendation 
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg'
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        <FireIcon className="w-5 h-5" />
        Inizia Allenamento con {recommendation?.recommended || '--'} kg
      </button>
    </div>
  )
}