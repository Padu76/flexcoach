// components/PerformanceDashboard.tsx - Dashboard con DataManager integrato

'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  useWorkoutHistory,
  useStatistics,
  useAchievements,
  useDataManager,
  useCurrentWorkout
} from '@/hooks/useDataManager'
import { 
  ChartBarIcon,
  FireIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  TrophyIcon,
  CalendarIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import type { ExerciseType } from '@/types'

interface Props {
  exerciseType: ExerciseType
}

export default function PerformanceDashboard({ exerciseType }: Props) {
  // DataManager Hooks
  const { 
    sessions,
    lastWorkout,
    bestWorkout,
    getSessionsByDateRange
  } = useWorkoutHistory({ 
    exercise: exerciseType, 
    limit: 30 
  })
  
  const { 
    stats,
    exerciseStats,
    weeklyProgress,
    totalWorkouts,
    totalVolume,
    totalReps,
    currentStreak
  } = useStatistics(exerciseType)
  
  const {
    achievements,
    unlockedCount,
    totalCount,
    completionPercentage
  } = useAchievements()
  
  const { exportData } = useDataManager()
  const { session: currentSession, isActive } = useCurrentWorkout()
  
  // Stati locali
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week')
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  
  // Calcola statistiche periodo
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
        startDate = new Date(0) // Dall'inizio
    }
    
    const periodSessions = sessions.filter(s => 
      new Date(s.date) >= startDate
    )
    
    const totalVolumePeriod = periodSessions.reduce((acc, s) => acc + s.totalVolume, 0)
    const totalRepsPeriod = periodSessions.reduce((acc, s) => acc + s.totalReps, 0)
    const avgQualityPeriod = periodSessions.length > 0
      ? periodSessions.reduce((acc, s) => acc + (s.perfectReps / s.totalReps * 100), 0) / periodSessions.length
      : 0
    
    return {
      sessions: periodSessions.length,
      volume: totalVolumePeriod,
      reps: totalRepsPeriod,
      avgQuality: avgQualityPeriod
    }
  }
  
  const periodStats = getPeriodStats()
  
  // Calcola trend
  const calculateTrend = () => {
    if (sessions.length < 2) return 'stable'
    
    const recent = sessions.slice(0, 5)
    const older = sessions.slice(5, 10)
    
    if (older.length === 0) return 'stable'
    
    const recentAvg = recent.reduce((acc, s) => acc + s.totalVolume, 0) / recent.length
    const olderAvg = older.reduce((acc, s) => acc + s.totalVolume, 0) / older.length
    
    if (recentAvg > olderAvg * 1.1) return 'up'
    if (recentAvg < olderAvg * 0.9) return 'down'
    return 'stable'
  }
  
  const trend = calculateTrend()
  
  // Prepara dati per grafico
  const chartData = sessions
    .slice(0, 10)
    .reverse()
    .map(s => ({
      date: new Date(s.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
      volume: s.totalVolume,
      reps: s.totalReps,
      quality: Math.round((s.perfectReps / s.totalReps) * 100)
    }))
  
  const getExerciseName = () => {
    switch (exerciseType) {
      case 'squat': return 'Squat'
      case 'bench-press': return 'Panca Piana'
      case 'deadlift': return 'Stacco da Terra'
      default: return 'Esercizio'
    }
  }
  
  const getExerciseColor = () => {
    switch (exerciseType) {
      case 'squat': return 'blue'
      case 'bench-press': return 'green'
      case 'deadlift': return 'orange'
      default: return 'gray'
    }
  }
  
  const color = getExerciseColor()
  
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
              Analizza i tuoi progressi e migliora la tua tecnica
            </p>
          </div>
          
          <button
            onClick={exportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Esporta Dati
          </button>
        </div>
        
        {/* Period Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'week'
                ? `bg-${color}-600 text-white`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Settimana
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'month'
                ? `bg-${color}-600 text-white`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mese
          </button>
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'all'
                ? `bg-${color}-600 text-white`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tutto
          </button>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sessioni</p>
              <p className="text-2xl font-bold text-gray-900">{periodStats.sessions}</p>
              <p className="text-xs text-gray-500">
                {selectedPeriod === 'week' ? 'questa settimana' : 
                 selectedPeriod === 'month' ? 'questo mese' : 'totali'}
              </p>
            </div>
            <CalendarIcon className={`w-8 h-8 text-${color}-500`} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Volume Totale</p>
              <p className="text-2xl font-bold text-gray-900">{periodStats.volume} kg</p>
              <p className="text-xs text-gray-500">
                {trend === 'up' && <span className="text-green-600">↑ In crescita</span>}
                {trend === 'down' && <span className="text-red-600">↓ In calo</span>}
                {trend === 'stable' && <span className="text-gray-600">→ Stabile</span>}
              </p>
            </div>
            <ScaleIcon className={`w-8 h-8 text-${color}-500`} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ripetizioni</p>
              <p className="text-2xl font-bold text-gray-900">{periodStats.reps}</p>
              <p className="text-xs text-gray-500">
                Media: {periodStats.sessions > 0 ? Math.round(periodStats.reps / periodStats.sessions) : 0}/sessione
              </p>
            </div>
            <FireIcon className={`w-8 h-8 text-${color}-500`} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Qualità Media</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(periodStats.avgQuality)}%</p>
              <p className="text-xs text-gray-500">
                {periodStats.avgQuality > 80 ? 
                  <span className="text-green-600">Ottima forma</span> :
                  periodStats.avgQuality > 60 ?
                  <span className="text-yellow-600">Buona forma</span> :
                  <span className="text-red-600">Da migliorare</span>
                }
              </p>
            </div>
            <CheckCircleIcon className={`w-8 h-8 text-${color}-500`} />
          </div>
        </div>
      </div>
      
      {/* Progress Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Progressi nel Tempo
          </h3>
          
          {/* Simple Bar Chart */}
          <div className="space-y-4">
            {chartData.map((data, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-20 text-sm text-gray-600">{data.date}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm text-gray-700">Volume:</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                      <div 
                        className={`bg-${color}-500 h-4 rounded-full`}
                        style={{ width: `${(data.volume / Math.max(...chartData.map(d => d.volume))) * 100}%` }}
                      />
                    </div>
                    <div className="text-sm font-medium w-16 text-right">{data.volume}kg</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-700">Qualità:</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                      <div 
                        className={`h-4 rounded-full ${
                          data.quality > 80 ? 'bg-green-500' :
                          data.quality > 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${data.quality}%` }}
                      />
                    </div>
                    <div className="text-sm font-medium w-16 text-right">{data.quality}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
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
                      {new Date(session.date).toLocaleDateString('it-IT', { 
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {session.totalReps} reps • {session.totalVolume} kg totali
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      (session.perfectReps / session.totalReps) > 0.8 
                        ? 'bg-green-100 text-green-800'
                        : (session.perfectReps / session.totalReps) > 0.6
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {Math.round((session.perfectReps / session.totalReps) * 100)}% qualità
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {session.duration ? `${Math.round(session.duration / 60)} min` : '-'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Nessuna sessione registrata per {getExerciseName()}
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
              {unlockedCount}/{totalCount} sbloccati ({completionPercentage}%)
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
                {achievement.unlockedAt && (
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(achievement.unlockedAt).toLocaleDateString('it-IT')}
                  </div>
                )}
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
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Data</div>
                  <div className="font-medium">
                    {new Date(selectedSession.date).toLocaleDateString('it-IT', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Durata</div>
                  <div className="font-medium">
                    {selectedSession.duration ? `${Math.round(selectedSession.duration / 60)} minuti` : 'N/D'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Volume Totale</div>
                  <div className="font-medium">{selectedSession.totalVolume} kg</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Ripetizioni Totali</div>
                  <div className="font-medium">{selectedSession.totalReps}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Reps Perfette</div>
                  <div className="font-medium">{selectedSession.perfectReps}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Qualità Media</div>
                  <div className="font-medium">
                    {Math.round((selectedSession.perfectReps / selectedSession.totalReps) * 100)}%
                  </div>
                </div>
              </div>
              
              {selectedSession.sets && selectedSession.sets.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Serie Completate</h4>
                  <div className="space-y-2">
                    {selectedSession.sets.map((set: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span>Set {idx + 1}</span>
                        <span>{set.reps?.length || 0} reps @ {set.weight || 0}kg</span>
                        <span className="text-sm text-gray-600">
                          Qualità: {set.averageQuality || 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
          <p className="text-gray-600 mb-4">
            Inizia ad allenarti con {getExerciseName()} per vedere le tue statistiche!
          </p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Inizia Allenamento
          </button>
        </div>
      )}
    </div>
  )
}