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
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ScaleIcon,
  TrophyIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import type { ExerciseType } from '@/types'
import type { WorkoutSession } from '@/types/data'

interface Props {
  currentSession?: WorkoutSession
  exerciseType: ExerciseType
  isLive?: boolean
  onUpdateSession?: (session: WorkoutSession) => void
}

export default function PerformanceDashboard({ 
  currentSession, 
  exerciseType, 
  isLive = false,
  onUpdateSession 
}: Props) {
  // DataManager Hooks
  const { 
    sessions, 
    isLoading, 
    lastWorkout, 
    bestWorkout,
    totalSessions 
  } = useWorkoutHistory({ exercise: exerciseType })
  
  const { 
    stats,
    exerciseStats,
    weeklyProgress,
    totalWorkouts,
    totalVolume,
    totalReps,
    currentStreak,
    longestStreak
  } = useStatistics(exerciseType)
  
  const {
    achievements,
    unlockedCount,
    completionPercentage,
    isUnlocked
  } = useAchievements()
  
  const { exportData } = useDataManager()
  const { session: activeSession } = useCurrentWorkout()
  
  // Stati locali UI
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(
    currentSession || lastWorkout || null
  )
  const [viewMode, setViewMode] = useState<'current' | 'history' | 'achievements'>('current')
  const [selectedMetric, setSelectedMetric] = useState<'quality' | 'depth' | 'duration' | 'symmetry'>('quality')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week')
  
  // Canvas per grafici
  const chartCanvasRef = useRef<HTMLCanvasElement>(null)
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null)
  
  // Aggiorna sessione selezionata se cambia quella corrente
  useEffect(() => {
    if (currentSession && isLive) {
      setSelectedSession(currentSession)
    }
  }, [currentSession, isLive])
  
  // Disegna grafico qualità per rep
  useEffect(() => {
    if (chartCanvasRef.current && selectedSession) {
      drawQualityChart()
    }
  }, [selectedSession, selectedMetric])
  
  // Disegna heatmap
  useEffect(() => {
    if (heatmapCanvasRef.current && sessions.length > 0) {
      drawHeatmap()
    }
  }, [sessions, timeRange])
  
  const getExerciseName = () => {
    switch (exerciseType) {
      case 'squat': return 'Squat'
      case 'bench-press': return 'Panca Piana'
      case 'deadlift': return 'Stacco da Terra'
      default: return 'Esercizio'
    }
  }
  
  const getQualityColor = (quality: string): string => {
    switch (quality) {
      case 'perfect': return '#10B981'
      case 'good': return '#3B82F6'
      case 'fair': return '#F59E0B'
      case 'poor': return '#EF4444'
      default: return '#9CA3AF'
    }
  }
  
  const getQualityEmoji = (quality: string): string => {
    switch (quality) {
      case 'perfect': return '⭐'
      case 'good': return '✅'
      case 'fair': return '⚠️'
      case 'poor': return '❌'
      default: return '❓'
    }
  }
  
  const calculateTrend = (): 'up' | 'down' | 'stable' => {
    if (sessions.length < 2) return 'stable'
    
    const recent = sessions.slice(0, 5)
    const older = sessions.slice(5, 10)
    
    if (recent.length === 0 || older.length === 0) return 'stable'
    
    const recentAvg = recent.reduce((acc, s) => acc + (s.perfectReps / s.totalReps * 100), 0) / recent.length
    const olderAvg = older.reduce((acc, s) => acc + (s.perfectReps / s.totalReps * 100), 0) / older.length
    
    if (recentAvg > olderAvg + 5) return 'up'
    if (recentAvg < olderAvg - 5) return 'down'
    return 'stable'
  }
  
  const drawQualityChart = () => {
    const canvas = chartCanvasRef.current
    if (!canvas || !selectedSession) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Setup canvas
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    
    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height)
    
    // Collect all reps from session
    const allReps: any[] = []
    selectedSession.sets.forEach(set => {
      allReps.push(...set.reps)
    })
    
    if (allReps.length === 0) return
    
    // Drawing parameters
    const padding = 40
    const chartWidth = rect.width - padding * 2
    const chartHeight = rect.height - padding * 2
    const barWidth = chartWidth / allReps.length * 0.8
    const gap = chartWidth / allReps.length * 0.2
    
    // Draw axes
    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, padding + chartHeight)
    ctx.lineTo(padding + chartWidth, padding + chartHeight)
    ctx.stroke()
    
    // Draw bars
    allReps.forEach((rep, index) => {
      let value = 0
      let color = '#9CA3AF'
      
      switch (selectedMetric) {
        case 'quality':
          value = rep.quality === 'perfect' ? 100 : 
                 rep.quality === 'good' ? 75 :
                 rep.quality === 'fair' ? 50 : 25
          color = getQualityColor(rep.quality)
          break
        case 'depth':
          value = Math.max(0, Math.min(100, (180 - rep.depth) / 90 * 100))
          color = value > 66 ? '#10B981' : value > 33 ? '#F59E0B' : '#EF4444'
          break
        case 'duration':
          value = Math.min(100, (rep.duration / 5000) * 100)
          color = '#3B82F6'
          break
        case 'symmetry':
          value = rep.symmetry || 90
          color = value > 90 ? '#10B981' : value > 70 ? '#F59E0B' : '#EF4444'
          break
      }
      
      const barHeight = (value / 100) * chartHeight
      const x = padding + index * (barWidth + gap)
      const y = padding + chartHeight - barHeight
      
      // Draw bar
      ctx.fillStyle = color
      ctx.fillRect(x, y, barWidth, barHeight)
      
      // Draw rep number
      ctx.fillStyle = '#6B7280'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${rep.repNumber}`, x + barWidth / 2, padding + chartHeight + 15)
    })
    
    // Draw title
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'left'
    const metricTitle = selectedMetric === 'quality' ? 'Qualità' :
                       selectedMetric === 'depth' ? 'Profondità' :
                       selectedMetric === 'duration' ? 'Durata' : 'Simmetria'
    ctx.fillText(`${metricTitle} per Ripetizione`, padding, 20)
  }
  
  const drawHeatmap = () => {
    const canvas = heatmapCanvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Setup canvas
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    
    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height)
    
    // Filter sessions by time range
    const now = new Date()
    const filtered = sessions.filter(s => {
      const sessionDate = new Date(s.date)
      const daysDiff = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (timeRange === 'week') return daysDiff <= 7
      if (timeRange === 'month') return daysDiff <= 30
      return true
    })
    
    if (filtered.length === 0) return
    
    // Group by day and calculate quality
    const dayMap = new Map<string, number>()
    filtered.forEach(session => {
      const date = new Date(session.date).toLocaleDateString()
      const quality = (session.perfectReps / session.totalReps) * 100
      const current = dayMap.get(date) || 0
      dayMap.set(date, Math.max(current, quality))
    })
    
    // Draw heatmap grid
    const cellSize = 15
    const gap = 2
    const cols = 7
    const rows = Math.ceil(dayMap.size / cols)
    
    let index = 0
    dayMap.forEach((quality, date) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const x = 40 + col * (cellSize + gap)
      const y = 40 + row * (cellSize + gap)
      
      // Color based on quality
      const intensity = quality / 100
      const hue = intensity * 120 // 0 = red, 120 = green
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`
      ctx.fillRect(x, y, cellSize, cellSize)
      
      index++
    })
    
    // Title
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText('Heatmap Qualità Allenamenti', 40, 25)
  }
  
  const trend = calculateTrend()
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="w-6 h-6 text-blue-600" />
            Dashboard Performance - {getExerciseName()}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {totalWorkouts} allenamenti totali, {currentStreak} giorni streak 🔥
          </p>
        </div>
        
        {/* View Mode Tabs */}
        <div className="flex gap-2">
          {['current', 'history', 'achievements'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                viewMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {mode === 'current' ? '📊 Corrente' :
               mode === 'history' ? '📈 Storico' : '🏆 Obiettivi'}
            </button>
          ))}
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <FireIcon className="w-5 h-5 text-blue-600" />
            {trend === 'up' ? <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" /> :
             trend === 'down' ? <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" /> :
             <span className="w-4 h-4">➡️</span>}
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalReps}</div>
          <div className="text-xs text-gray-600">Ripetizioni Totali</div>
          <div className="text-xs text-blue-600 mt-1">
            {exerciseStats ? `${Math.round(exerciseStats.averageQuality)}% qualità` : '-'}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {weeklyProgress.avgQuality.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-600">Qualità Settimana</div>
          <div className="text-xs text-green-600 mt-1">
            {weeklyProgress.workouts} workout
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <ScaleIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(totalVolume / 1000)}t
          </div>
          <div className="text-xs text-gray-600">Volume Totale</div>
          <div className="text-xs text-purple-600 mt-1">
            {weeklyProgress.volume}kg/sett
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrophyIcon className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{unlockedCount}</div>
          <div className="text-xs text-gray-600">Achievement</div>
          <div className="text-xs text-orange-600 mt-1">
            {completionPercentage}% completo
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      {viewMode === 'current' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quality Chart */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                📊 Analisi Ripetizioni
              </h3>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="quality">Qualità</option>
                <option value="depth">Profondità</option>
                <option value="duration">Durata</option>
                <option value="symmetry">Simmetria</option>
              </select>
            </div>
            
            <canvas
              ref={chartCanvasRef}
              className="w-full h-64"
              style={{ width: '100%', height: '256px' }}
            />
            
            {selectedSession && (
              <div className="mt-4 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Sessione: {new Date(selectedSession.date).toLocaleDateString()}</span>
                  <span>{selectedSession.weight || '-'} kg</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Heatmap */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                🗓️ Heatmap Qualità
              </h3>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="week">Settimana</option>
                <option value="month">Mese</option>
                <option value="all">Tutto</option>
              </select>
            </div>
            
            <canvas
              ref={heatmapCanvasRef}
              className="w-full h-64"
              style={{ width: '100%', height: '256px' }}
            />
          </div>
        </div>
      )}
      
      {/* History View */}
      {viewMode === 'history' && (
        <div className="space-y-6">
          {/* Best Sessions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lastWorkout && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-blue-600" />
                  Ultima Sessione
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-medium">{new Date(lastWorkout.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peso:</span>
                    <span className="font-medium">{lastWorkout.weight || '-'}kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reps totali:</span>
                    <span className="font-medium">{lastWorkout.totalReps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Qualità:</span>
                    <span className="font-medium text-green-600">
                      {Math.round((lastWorkout.perfectReps / lastWorkout.totalReps) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {bestWorkout && (
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5 text-yellow-600" />
                  Miglior Sessione
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-medium">{new Date(bestWorkout.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peso:</span>
                    <span className="font-medium">{bestWorkout.weight || '-'}kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reps totali:</span>
                    <span className="font-medium">{bestWorkout.totalReps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Qualità:</span>
                    <span className="font-medium text-yellow-600">
                      {Math.round((bestWorkout.perfectReps / bestWorkout.totalReps) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Session List */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">
              📅 Storico Sessioni ({totalSessions})
            </h3>
            
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                Caricamento...
              </div>
            ) : sessions.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sessions.map((session, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedSession(session)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedSession?.id === session.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {new Date(session.date).toLocaleDateString()} - {new Date(session.date).toLocaleTimeString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {session.weight || '-'} kg × {session.totalReps} reps
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold" style={{ 
                          color: getQualityColor(
                            (session.perfectReps / session.totalReps) > 0.8 ? 'perfect' :
                            (session.perfectReps / session.totalReps) > 0.6 ? 'good' :
                            (session.perfectReps / session.totalReps) > 0.4 ? 'fair' : 'poor'
                          )
                        }}>
                          {Math.round((session.perfectReps / session.totalReps) * 100)}%
                        </div>
                        <div className="text-xs text-gray-600">
                          {session.perfectReps} perfette
                        </div>
                      </div>
                    </div>
                    
                    {session.notes && (
                      <div className="text-xs text-gray-500 mt-2 italic">
                        📝 {session.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Nessuna sessione registrata</p>
                <p className="text-sm mt-2">Inizia ad allenarti per vedere i tuoi progressi!</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Achievements View */}
      {viewMode === 'achievements' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Progress Achievement
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {unlockedCount} di {achievements.length} sbloccati
                </p>
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {completionPercentage}%
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map(achievement => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border ${
                  isUnlocked(achievement.id)
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {isUnlocked(achievement.id) ? '🏆' : '🔒'}
                      {achievement.name}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {achievement.description}
                    </p>
                  </div>
                  {isUnlocked(achievement.id) ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  ) : (
                    <div className="text-sm font-medium text-gray-500">
                      {achievement.progress}%
                    </div>
                  )}
                </div>
                
                {!isUnlocked(achievement.id) && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progresso</span>
                      <span>{achievement.progress}/{achievement.target} {achievement.unit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {isUnlocked(achievement.id) && achievement.unlockedAt && (
                  <div className="text-xs text-green-600 mt-2">
                    ✅ Sbloccato il {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Detailed Rep Analysis */}
      {selectedSession && viewMode === 'current' && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">
            🔍 Analisi Dettagliata Serie
          </h3>
          
          <div className="space-y-4">
            {selectedSession.sets.map((set, setIdx) => (
              <div key={setIdx} className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    Serie {set.setNumber}
                  </span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">
                      Qualità: {set.averageQuality.toFixed(0)}%
                    </span>
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  </div>
                </div>
                
                <div className="flex gap-1 flex-wrap">
                  {set.reps.map((rep, repIdx) => (
                    <div
                      key={repIdx}
                      className="relative group"
                    >
                      <div
                        className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium cursor-pointer transition-transform hover:scale-110`}
                        style={{ 
                          backgroundColor: getQualityColor(rep.quality) + '20', 
                          color: getQualityColor(rep.quality) 
                        }}
                      >
                        {getQualityEmoji(rep.quality)}
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                        <div>Rep {rep.repNumber}</div>
                        <div>Profondità: {rep.depth}°</div>
                        <div>Durata: {(rep.duration / 1000).toFixed(1)}s</div>
                        <div>Simmetria: {rep.symmetry}%</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {set.restTime && setIdx < selectedSession.sets.length - 1 && (
                  <div className="text-xs text-gray-500 mt-2">
                    Riposo: {set.restTime}s
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={exportData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <DocumentArrowDownIcon className="w-4 h-4" />
          Esporta Tutti i Dati
        </button>
        
        {activeSession && (
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium ml-auto"
          >
            📊 Sessione Live Attiva
          </button>
        )}
      </div>
    </div>
  )
}