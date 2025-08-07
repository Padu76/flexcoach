// app/pre-workout/PreWorkoutPage.tsx - Componente condiviso
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  PlayIcon,
  ChartBarIcon,
  ClockIcon,
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import WeightPredictionSystem from '@/components/WeightPredictionSystem'
import type { ExerciseType } from '@/types'

interface WorkoutPlan {
  targetReps: number
  targetSets: number
  restTime: number
  objective: 'strength' | 'hypertrophy' | 'endurance' | 'power'
}

interface Props {
  exerciseType: ExerciseType
}

export default function PreWorkoutPage({ exerciseType }: Props) {
  const router = useRouter()
  
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null)
  const [recommendedWeight, setRecommendedWeight] = useState<number>(0)
  const [isReady, setIsReady] = useState(false)
  
  // Quick stats from localStorage
  const [quickStats, setQuickStats] = useState({
    lastWorkout: '',
    totalSessions: 0,
    personalRecord: 0,
    avgQuality: 0
  })
  
  useEffect(() => {
    // Carica statistiche rapide
    const history = localStorage.getItem('flexcoach_history')
    if (history) {
      const sessions = JSON.parse(history).filter((s: any) => s.exercise === exerciseType)
      if (sessions.length > 0) {
        const lastSession = sessions[sessions.length - 1]
        const maxWeight = Math.max(...sessions.map((s: any) => s.weight))
        const avgQuality = sessions.reduce((acc: number, s: any) => acc + s.avgQuality, 0) / sessions.length
        
        setQuickStats({
          lastWorkout: new Date(lastSession.date).toLocaleDateString(),
          totalSessions: sessions.length,
          personalRecord: maxWeight,
          avgQuality: Math.round(avgQuality)
        })
      }
    }
  }, [exerciseType])
  
  const getExerciseName = () => {
    switch (exerciseType) {
      case 'squat': return 'Squat'
      case 'bench-press': return 'Panca Piana'
      case 'deadlift': return 'Stacco da Terra'
      default: return 'Esercizio'
    }
  }
  
  const getExerciseEmoji = () => {
    switch (exerciseType) {
      case 'squat': return '🦵'
      case 'bench-press': return '💪'
      case 'deadlift': return '🏋️'
      default: return '🎯'
    }
  }
  
  const handleStartWorkout = (plan: WorkoutPlan, weight: number) => {
    setWorkoutPlan(plan)
    setRecommendedWeight(weight)
    setIsReady(true)
    
    // Salva in sessionStorage per passare alla pagina esercizio
    sessionStorage.setItem('workout_plan', JSON.stringify({
      ...plan,
      weight,
      exercise: exerciseType,
      startTime: new Date().toISOString()
    }))
  }
  
  const handleBeginExercise = () => {
    // Naviga alla pagina esercizio
    router.push(`/exercises/${exerciseType}`)
  }
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/exercises"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Torna agli Esercizi
          </Link>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="text-5xl">{getExerciseEmoji()}</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Prepara il tuo {getExerciseName()}
              </h1>
              <p className="text-gray-600 mt-1">
                Ottimizza il peso e pianifica la sessione
              </p>
            </div>
          </div>
        </div>
        
        {/* Quick Stats Cards */}
        {quickStats.totalSessions > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-xs text-gray-600 mb-1">Ultimo Allenamento</div>
              <div className="text-lg font-semibold text-gray-900">{quickStats.lastWorkout}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-xs text-gray-600 mb-1">Sessioni Totali</div>
              <div className="text-lg font-semibold text-gray-900">{quickStats.totalSessions}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-xs text-gray-600 mb-1">Record Personale</div>
              <div className="text-lg font-semibold text-gray-900">{quickStats.personalRecord} kg</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-xs text-gray-600 mb-1">Qualità Media</div>
              <div className="text-lg font-semibold text-gray-900">{quickStats.avgQuality}%</div>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        {!isReady ? (
          <WeightPredictionSystem 
            exerciseType={exerciseType}
            onStartWorkout={handleStartWorkout}
          />
        ) : (
          /* Ready to Start Panel */
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Pronto per Iniziare!
              </h2>
              <p className="text-gray-600">
                Il tuo programma è stato preparato con successo
              </p>
            </div>
            
            {/* Workout Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📋 Riepilogo Allenamento
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {recommendedWeight}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">kg</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {workoutPlan?.targetReps}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">ripetizioni</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">
                    {workoutPlan?.targetSets}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">serie</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600">
                    {formatTime(workoutPlan?.restTime || 0)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">riposo</div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="text-sm text-gray-700">
                  <strong>Obiettivo:</strong> {
                    workoutPlan?.objective === 'power' ? '⚡ Potenza' :
                    workoutPlan?.objective === 'strength' ? '💪 Forza' :
                    workoutPlan?.objective === 'hypertrophy' ? '📈 Ipertrofia' :
                    '🏃 Resistenza'
                  }
                </div>
              </div>
            </div>
            
            {/* Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5" />
                Consigli Pre-Allenamento
              </h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>✓ Fai 5-10 minuti di riscaldamento generale</li>
                <li>✓ Esegui 2-3 serie di riscaldamento con peso leggero</li>
                <li>✓ Assicurati di avere acqua a portata di mano</li>
                <li>✓ Posiziona la camera per vista laterale ottimale</li>
                <li>✓ Rispetta i tempi di riposo tra le serie</li>
              </ul>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleBeginExercise}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-[1.02] shadow-lg"
              >
                <div className="flex items-center justify-center gap-2">
                  <PlayIcon className="w-6 h-6" />
                  <span className="text-lg">Inizia {getExerciseName()}</span>
                </div>
              </button>
              
              <button
                onClick={() => setIsReady(false)}
                className="w-full py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                ← Modifica Parametri
              </button>
            </div>
          </div>
        )}
        
        {/* Info Box */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <ChartBarIcon className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                💡 Come funziona il sistema AI
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                FlexCoach utilizza un algoritmo avanzato che combina:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Formula Brzycki:</strong> Calcolo scientifico del massimale</li>
                <li>• <strong>Machine Learning:</strong> Apprende dai tuoi pattern di allenamento</li>
                <li>• <strong>Autoregolazione:</strong> Si adatta alla tua forma giornaliera</li>
                <li>• <strong>Periodizzazione:</strong> Ottimizza progressione nel tempo</li>
              </ul>
              <p className="text-sm text-blue-800 mt-3">
                Più ti alleni, più il sistema diventa preciso nel consigliarti il peso perfetto!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}