// components/PerformanceDashboard.tsx - Dashboard SEMPLIFICATA e FUNZIONANTE

'use client'

import { useState } from 'react'
import { 
  useWorkoutHistory,
  useStatistics,
  useAchievements,
  useDataManager
} from '@/hooks/useDataManager'
import { 
  ChartBarIcon,
  FireIcon,
  ClockIcon,
  CheckCircleIcon,
  TrophyIcon,
  CalendarIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import type { ExerciseType } from '@/types'

interface Props {
  exerciseType: ExerciseType
}

export default function PerformanceDashboard({ exerciseType }: Props) {
  // DataManager Hooks - SOLO quello che esiste sicuramente
  const { 
    sessions,
    lastWorkout,
    bestWorkout
  } = useWorkoutHistory({ 
    exercise: exerciseType, 
    limit: 30 
  })
  
  const { 
    stats,
    exerciseStats
  } = useStatistics(exerciseType)
  
  const {
    achievements,
    unlockedCount,
    totalCount,
    completionPercentage
  } = useAchievements()
  
  const { exportData } = useDataManager()
  
  // Stati locali
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week')
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  
  // Calcola statistiche periodo SEMPLIFICATO
  const getPeriodStats = () => {
    const now = new Date()
    let startDate = new Date()
    
    switch (selectedPeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      default:
        startDate = new Date(0)
    }
    
    const periodSessions = sessions.filter(s => 
      new Date(s.date) >= startDate
    )
    
    const totalVolumePeriod = periodSessions.reduce((acc, s) => acc + s.totalVolume, 0)
    const totalRepsPeriod = periodSessions.reduce((acc, s) => acc + s.totalReps, 0)
    
    return {
      sessions: periodSessions.length,
      volume: totalVolumePeriod,
      reps: totalRepsPeriod
    }
  }
  
  const periodStats = getPeriodStats()
  
  const getExerciseName = () => {
    switch (exerciseType) {
      case 'squat': return 'Squat'
      case 'bench-press': return 'Panca Piana'
      case 'deadlift': return 'Stacco da Terra'
      default: return 'Esercizio'
    }
  }
  
  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
              Performance Dashboard - {getExerciseName()}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Analizza i tuoi progressi
            </p>
          </div>
          
          <button
            onClick={exportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Esporta
          </button>
        </div>
        
        {/* Period Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Settimana
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mese
          </button>
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tutto
          </button>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sessioni</p>
              <p className="text-2xl font-bold text-gray-900">{periodStats.sessions}</p>
              <p className="text-xs text-gray-500">
                {selectedPeriod === 'week' ? 'settimana' : 
                 selectedPeriod === 'month' ? 'mese' : 'totali'}
              </p>
            </div>
            <CalendarIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Volume</p>
              <p className="text-2xl font-bold text-gray-900">{periodStats.volume}</p>
              <p className="text-xs text-gray-500">kg totali</p>
            </div>
            <ScaleIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ripetizioni</p>
              <p className="text-2xl font-bold text-gray-900">{periodStats.reps}</p>
              <p className="text-xs text-gray-500">totali</p>
            </div>
            <FireIcon className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>
      
      {/* Recent Sessions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Sessioni Recenti
        </h3>
        
        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session, idx) => (
              <div 
                key={idx} 
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedSession(session)
                  setShowDetails(true)
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">
                      {new Date(session.date).toLocaleDateString('it-IT')}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {session.totalReps} reps • {session.totalVolume} kg
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      Qualità: {Math.round((session.perfectReps / session.totalReps) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Nessuna sessione registrata
          </div>
        )}
      </div>
      
      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrophyIcon className="w-5 h-5 text-yellow-500" />
              Achievements
            </h3>
            <div className="text-sm text-gray-600">
              {unlockedCount}/{totalCount} ({completionPercentage}%)
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {achievements.slice(0, 8).map((achievement, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg border-2 ${
                  achievement.unlockedAt
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-200 bg-gray-50 opacity-50'
                }`}
              >
                <div className="text-2xl mb-1">{achievement.icon}</div>
                <div className="text-xs font-medium text-gray-900">{achievement.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Session Details Modal */}
      {showDetails && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Dettagli Sessione
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Data</div>
                  <div className="font-medium">
                    {new Date(selectedSession.date).toLocaleDateString('it-IT')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Volume Totale</div>
                  <div className="font-medium">{selectedSession.totalVolume} kg</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Ripetizioni</div>
                  <div className="font-medium">{selectedSession.totalReps}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Qualità</div>
                  <div className="font-medium">
                    {Math.round((selectedSession.perfectReps / selectedSession.totalReps) * 100)}%
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {sessions.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nessun dato disponibile
          </h3>
          <p className="text-gray-600">
            Inizia ad allenarti per vedere le statistiche!
          </p>
        </div>
      )}
    </div>
  )
}