// components/WeightPredictionSystem.tsx - Sistema calcolo peso ottimale

'use client'

import { useState, useEffect } from 'react'
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

interface PerformanceHistory {
  date: string
  exercise: ExerciseType
  weight: number
  reps: number
  sets: number
  avgQuality: number // 0-100
  avgDepth: number // gradi
  completed: boolean
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
  // Stati principali
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan>({
    targetReps: 10,
    targetSets: 3,
    restTime: 90,
    objective: 'hypertrophy'
  })
  
  const [userProfile, setUserProfile] = useState({
    experience: 'intermediate', // beginner, intermediate, advanced
    bodyWeight: 70, // kg
    estimatedMax: {
      squat: 100,
      'bench-press': 80,
      deadlift: 120
    }
  })
  
  const [history, setHistory] = useState<PerformanceHistory[]>([])
  const [recommendation, setRecommendation] = useState<WeightRecommendation | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Carica dati da localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('flexcoach_history')
    const savedProfile = localStorage.getItem('flexcoach_profile')
    
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
    
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile))
    }
  }, [])
  
  // Salva dati in localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('flexcoach_history', JSON.stringify(history))
    }
  }, [history])
  
  useEffect(() => {
    localStorage.setItem('flexcoach_profile', JSON.stringify(userProfile))
  }, [userProfile])
  
  // Calcola peso ottimale basato su formula scientifica
  const calculateOptimalWeight = (): WeightRecommendation => {
    const maxWeight = userProfile.estimatedMax[exerciseType]
    let percentage = 0
    let reasoning: string[] = []
    
    // Percentuali basate su obiettivo e reps (Brzycki formula modificata)
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
    
    // Aggiustamenti basati su storico
    const recentSessions = history
      .filter(h => h.exercise === exerciseType)
      .slice(-5) // Ultime 5 sessioni
    
    if (recentSessions.length > 0) {
      const avgQuality = recentSessions.reduce((acc, s) => acc + s.avgQuality, 0) / recentSessions.length
      const lastSession = recentSessions[recentSessions.length - 1]
      
      // Se qualità alta nelle ultime sessioni, aumenta peso
      if (avgQuality > 85) {
        percentage += 2.5
        reasoning.push('✅ Ottima forma recente: +2.5%')
      } else if (avgQuality < 70) {
        percentage -= 5
        reasoning.push('⚠️ Forma da migliorare: -5%')
      }
      
      // Se ultima sessione completata perfettamente
      if (lastSession.completed && lastSession.avgQuality > 90) {
        percentage += 2.5
        reasoning.push('⭐ Ultima sessione perfetta: +2.5%')
      }
      
      // Trend di miglioramento
      if (recentSessions.length >= 3) {
        const trend = recentSessions[recentSessions.length - 1].weight - recentSessions[0].weight
        if (trend > 0) {
          reasoning.push('📈 Trend positivo rilevato')
        }
      }
    } else {
      reasoning.push('🆕 Prima sessione: inizia conservativo')
      percentage -= 10 // Più conservativo per principianti
    }
    
    // Aggiustamenti per esperienza
    switch (userProfile.experience) {
      case 'beginner':
        percentage *= 0.85
        reasoning.push('👶 Principiante: sicurezza prima di tutto')
        break
      case 'advanced':
        percentage *= 1.05
        reasoning.push('🏆 Avanzato: carico ottimizzato')
        break
    }
    
    // Calcolo finale
    const recommended = Math.round((maxWeight * percentage / 100) / 2.5) * 2.5 // Arrotonda a 2.5kg
    const min = Math.max(20, recommended - 5)
    const max = recommended + 5
    
    // Determina direzione aggiustamento
    let adjustment: 'increase' | 'maintain' | 'decrease' = 'maintain'
    if (recentSessions.length > 0) {
      const lastWeight = recentSessions[recentSessions.length - 1].weight
      if (recommended > lastWeight + 2.5) adjustment = 'increase'
      else if (recommended < lastWeight - 2.5) adjustment = 'decrease'
    }
    
    // Confidence score
    const confidence = Math.min(100, 60 + (recentSessions.length * 8))
    
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
  }, [workoutPlan, userProfile, history])
  
  // Stima 1RM basato su performance
  const estimate1RM = (weight: number, reps: number): number => {
    // Formula di Epley: 1RM = weight × (1 + reps/30)
    return Math.round(weight * (1 + reps / 30))
  }
  
  // Aggiorna massimale stimato basato su performance
  const updateEstimatedMax = (weight: number, reps: number) => {
    const new1RM = estimate1RM(weight, reps)
    setUserProfile(prev => ({
      ...prev,
      estimatedMax: {
        ...prev.estimatedMax,
        [exerciseType]: Math.max(prev.estimatedMax[exerciseType], new1RM)
      }
    }))
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
      onStartWorkout(workoutPlan, recommendation.recommended)
    }
  }
  
  // Aggiungi sessione di test allo storico (per demo)
  const addTestSession = () => {
    const testSession: PerformanceHistory = {
      date: new Date().toISOString(),
      exercise: exerciseType,
      weight: recommendation?.recommended || 60,
      reps: workoutPlan.targetReps,
      sets: workoutPlan.targetSets,
      avgQuality: 75 + Math.random() * 20,
      avgDepth: 85 + Math.random() * 15,
      completed: Math.random() > 0.2
    }
    setHistory(prev => [...prev, testSession])
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalculatorIcon className="w-6 h-6 text-blue-600" />
          Calcolo Peso Ottimale - {getExerciseName()}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Sistema AI per determinare il peso perfetto basato sui tuoi obiettivi
        </p>
      </div>
      
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
            step="30"
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
              Peso Consigliato
            </h3>
            {getAdjustmentIcon()}
          </div>
          
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-blue-600">
              {recommendation.recommended} kg
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Range: {recommendation.min} - {recommendation.max} kg
            </div>
          </div>
          
          {/* Confidence Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Confidenza Calcolo</span>
              <span>{recommendation.confidence}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${recommendation.confidence}%` }}
              />
            </div>
          </div>
          
          {/* Reasoning */}
          <div className="bg-white rounded-lg p-3">
            <div className="text-xs font-semibold text-gray-700 mb-2">
              📊 Analisi del calcolo:
            </div>
            <ul className="space-y-1">
              {recommendation.reasoning.map((reason, idx) => (
                <li key={idx} className="text-xs text-gray-600">
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Profilo Utente (Collapsible) */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="font-medium text-gray-700">
            ⚙️ Impostazioni Avanzate & Profilo
          </span>
          <span className="text-gray-400">
            {showAdvanced ? '▼' : '▶'}
          </span>
        </button>
        
        {showAdvanced && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
            {/* Livello esperienza */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Livello Esperienza
              </label>
              <div className="flex gap-2">
                {['beginner', 'intermediate', 'advanced'].map(level => (
                  <button
                    key={level}
                    onClick={() => setUserProfile(prev => ({ ...prev, experience: level as any }))}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      userProfile.experience === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    {level === 'beginner' ? '👶 Principiante' :
                     level === 'intermediate' ? '💪 Intermedio' : '🏆 Avanzato'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Peso corporeo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso Corporeo (kg)
              </label>
              <input
                type="number"
                min="40"
                max="200"
                value={userProfile.bodyWeight}
                onChange={(e) => setUserProfile(prev => ({ ...prev, bodyWeight: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            {/* Massimali stimati */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Massimali Stimati (1RM)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Squat</label>
                  <input
                    type="number"
                    min="20"
                    max="500"
                    value={userProfile.estimatedMax.squat}
                    onChange={(e) => setUserProfile(prev => ({
                      ...prev,
                      estimatedMax: { ...prev.estimatedMax, squat: parseInt(e.target.value) }
                    }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Panca</label>
                  <input
                    type="number"
                    min="20"
                    max="500"
                    value={userProfile.estimatedMax['bench-press']}
                    onChange={(e) => setUserProfile(prev => ({
                      ...prev,
                      estimatedMax: { ...prev.estimatedMax, 'bench-press': parseInt(e.target.value) }
                    }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Stacco</label>
                  <input
                    type="number"
                    min="20"
                    max="500"
                    value={userProfile.estimatedMax.deadlift}
                    onChange={(e) => setUserProfile(prev => ({
                      ...prev,
                      estimatedMax: { ...prev.estimatedMax, deadlift: parseInt(e.target.value) }
                    }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                ℹ️ Inserisci il peso massimo che riesci a sollevare per 1 ripetizione
              </p>
            </div>
            
            {/* Storico prestazioni */}
            {history.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📈 Ultime Sessioni
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {history.slice(-3).reverse().map((session, idx) => (
                    <div key={idx} className="bg-white p-2 rounded border border-gray-200 text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {new Date(session.date).toLocaleDateString()}
                        </span>
                        <span className={session.completed ? 'text-green-600' : 'text-red-600'}>
                          {session.completed ? '✅ Completato' : '❌ Non completato'}
                        </span>
                      </div>
                      <div className="mt-1 text-gray-600">
                        {session.weight}kg × {session.reps} reps × {session.sets} sets
                        - Qualità: {Math.round(session.avgQuality)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Bottone test */}
            <button
              onClick={addTestSession}
              className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
            >
              🧪 Aggiungi Sessione Test (Demo)
            </button>
          </div>
        )}
      </div>
      
      {/* Formula utilizzata */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-800">
            <div className="font-semibold mb-1">Formula Scientifica Utilizzata:</div>
            <div className="space-y-1">
              <div>• <strong>Potenza (1-3 reps):</strong> 90-95% del massimale</div>
              <div>• <strong>Forza (3-6 reps):</strong> 80-90% del massimale</div>
              <div>• <strong>Ipertrofia (6-12 reps):</strong> 70-80% del massimale</div>
              <div>• <strong>Resistenza (12+ reps):</strong> 60-70% del massimale</div>
            </div>
            <div className="mt-2 italic">
              Basato su: Brzycki Formula + AI personalizzazione
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA */}
      <button
        onClick={handleStartWorkout}
        disabled={!recommendation}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
      >
        <div className="flex items-center justify-center gap-2">
          <FireIcon className="w-5 h-5" />
          <span>
            Inizia Allenamento con {recommendation?.recommended || '--'} kg
          </span>
        </div>
      </button>
    </div>
  )
}