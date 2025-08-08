// components/PerformanceDashboard.tsx - Dashboard analisi qualità e performance

'use client'

import { useState, useEffect, useRef } from 'react'
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
  ScaleIcon
} from '@heroicons/react/24/outline'
import type { ExerciseType } from '@/types'

interface RepQuality {
  repNumber: number
  quality: 'perfect' | 'good' | 'fair' | 'poor'
  depth: number // angolo raggiunto
  duration: number // secondi
  timestamp: number
  formIssues: string[]
  symmetry: number // 0-100%
}

interface SetData {
  setNumber: number
  reps: RepQuality[]
  avgQuality: number
  restTime: number
  completed: boolean
  fatigueFactor: number // 0-100%
}

interface SessionData {
  id: string
  date: string
  exercise: ExerciseType
  weight: number
  targetReps: number
  targetSets: number
  sets: SetData[]
  totalReps: number
  perfectReps: number
  avgDepth: number
  avgQuality: number
  sessionDuration: number
  calories: number
  notes: string
}

interface Props {
  currentSession?: SessionData
  exerciseType: ExerciseType
  isLive?: boolean
  onUpdateSession?: (session: SessionData) => void
}

export default function PerformanceDashboard({ 
  currentSession, 
  exerciseType, 
  isLive = false,
  onUpdateSession 
}: Props) {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(currentSession || null)
  const [viewMode, setViewMode] = useState<'current' | 'history' | 'compare'>('current')
  const [selectedMetric, setSelectedMetric] = useState<'quality' | 'depth' | 'duration' | 'symmetry'>('quality')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week')
  
  // Canvas per grafici
  const chartCanvasRef = useRef<HTMLCanvasElement>(null)
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null)
  
  // Carica storico da localStorage
  useEffect(() => {
    const history = localStorage.getItem('flexcoach_sessions')
    if (history) {
      const allSessions = JSON.parse(history)
      const filtered = allSessions.filter((s: SessionData) => s.exercise === exerciseType)
      setSessions(filtered)
    }
  }, [exerciseType])
  
  // Salva sessione corrente se live
  useEffect(() => {
    if (currentSession && isLive) {
      const existing = sessions.findIndex(s => s.id === currentSession.id)
      if (existing >= 0) {
        const updated = [...sessions]
        updated[existing] = currentSession
        setSessions(updated)
      } else {
        setSessions([...sessions, currentSession])
      }
      
      // Salva in localStorage
      const allSessions = JSON.parse(localStorage.getItem('flexcoach_sessions') || '[]')
      const updatedAll = [...allSessions.filter((s: SessionData) => s.id !== currentSession.id), currentSession]
      localStorage.setItem('flexcoach_sessions', JSON.stringify(updatedAll))
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
      case 'perfect': return '#10B981' // green-500
      case 'good': return '#3B82F6' // blue-500
      case 'fair': return '#F59E0B' // amber-500
      case 'poor': return '#EF4444' // red-500
      default: return '#9CA3AF' // gray-400
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
    
    const recent = sessions.slice(-5)
    const older = sessions.slice(-10, -5)
    
    if (recent.length === 0 || older.length === 0) return 'stable'
    
    const recentAvg = recent.reduce((acc, s) => acc + s.avgQuality, 0) / recent.length
    const olderAvg = older.reduce((acc, s) => acc + s.avgQuality, 0) / older.length
    
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
    
    // Collect all reps
    const allReps: RepQuality[] = []
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
          value = Math.min(100, rep.duration / 5 * 100)
          color = '#3B82F6'
          break
        case 'symmetry':
          value = rep.symmetry
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
      
      // Draw set separator
      if (index > 0 && allReps[index - 1].repNumber > rep.repNumber) {
        ctx.strokeStyle = '#9CA3AF'
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(x - gap / 2, padding)
        ctx.lineTo(x - gap / 2, padding + chartHeight)
        ctx.stroke()
        ctx.setLineDash([])
      }
    })
    
    // Draw title
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'left'
    const metricTitle = selectedMetric === 'quality' ? 'Qualità' :
                       selectedMetric === 'depth' ? 'Profondità' :
                       selectedMetric === 'duration' ? 'Durata' : 'Simmetria'
    ctx.fillText(`${metricTitle} per Ripetizione`, padding, 20)
    
    // Draw legend
    ctx.font = '11px sans-serif'
    if (selectedMetric === 'quality') {
      const legendItems = [
        { color: '#10B981', label: 'Perfetto' },
        { color: '#3B82F6', label: 'Buono' },
        { color: '#F59E0B', label: 'Discreto' },
        { color: '#EF4444', label: 'Scarso' }
      ]
      
      legendItems.forEach((item, i) => {
        const legendX = rect.width - 150
        const legendY = 30 + i * 20
        ctx.fillStyle = item.color
        ctx.fillRect(legendX, legendY, 12, 12)
        ctx.fillStyle = '#6B7280'
        ctx.fillText(item.label, legendX + 18, legendY + 10)
      })
    }
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
    
    // Group by day
    const dayMap = new Map<string, number>()
    filtered.forEach(session => {
      const date = new Date(session.date).toLocaleDateString()
      const current = dayMap.get(date) || 0
      dayMap.set(date, Math.max(current, session.avgQuality))
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
  
  // Calcola statistiche aggregate
  const getAggregateStats = () => {
    if (sessions.length === 0) return null
    
    const totalReps = sessions.reduce((acc, s) => acc + s.totalReps, 0)
    const totalPerfect = sessions.reduce((acc, s) => acc + s.perfectReps, 0)
    const avgQuality = sessions.reduce((acc, s) => acc + s.avgQuality, 0) / sessions.length
    const avgDepth = sessions.reduce((acc, s) => acc + s.avgDepth, 0) / sessions.length
    const totalCalories = sessions.reduce((acc, s) => acc + s.calories, 0)
    const totalTime = sessions.reduce((acc, s) => acc + s.sessionDuration, 0)
    
    return {
      totalSessions: sessions.length,
      totalReps,
      totalPerfect,
      perfectRate: (totalPerfect / totalReps * 100).toFixed(1),
      avgQuality: avgQuality.toFixed(1),
      avgDepth: avgDepth.toFixed(0),
      totalCalories,
      totalTime: Math.round(totalTime / 60), // minuti
      trend: calculateTrend()
    }
  }
  
  const stats = getAggregateStats()
  
  // Generate mock session for demo
  const generateMockSession = (): SessionData => {
    const sets: SetData[] = []
    const targetSets = 3
    const targetReps = 10
    
    for (let s = 1; s <= targetSets; s++) {
      const reps: RepQuality[] = []
      const actualReps = targetReps - Math.floor(Math.random() * 2)
      
      for (let r = 1; r <= actualReps; r++) {
        const fatigueEffect = (s - 1) * 5 + r * 2
        const baseQuality = 95 - fatigueEffect - Math.random() * 10
        
        reps.push({
          repNumber: r,
          quality: baseQuality > 85 ? 'perfect' : 
                  baseQuality > 70 ? 'good' :
                  baseQuality > 55 ? 'fair' : 'poor',
          depth: 85 + Math.random() * 20 + fatigueEffect / 2,
          duration: 2 + Math.random() * 2,
          timestamp: Date.now() + (s * 1000 * 60 * 2) + (r * 1000 * 5),
          formIssues: baseQuality < 70 ? ['Ginocchia non allineate'] : [],
          symmetry: 95 - Math.random() * 15
        })
      }
      
      sets.push({
        setNumber: s,
        reps,
        avgQuality: reps.reduce((acc, r) => 
          acc + (r.quality === 'perfect' ? 100 : 
                r.quality === 'good' ? 75 :
                r.quality === 'fair' ? 50 : 25), 0) / reps.length,
        restTime: 90,
        completed: true,
        fatigueFactor: s * 20
      })
    }
    
    const allReps = sets.flatMap(s => s.reps)
    
    return {
      id: `session_${Date.now()}`,
      date: new Date().toISOString(),
      exercise: exerciseType,
      weight: 60 + Math.random() * 40,
      targetReps,
      targetSets,
      sets,
      totalReps: allReps.length,
      perfectReps: allReps.filter(r => r.quality === 'perfect').length,
      avgDepth: allReps.reduce((acc, r) => acc + r.depth, 0) / allReps.length,
      avgQuality: 75 + Math.random() * 15,
      sessionDuration: 900 + Math.random() * 600,
      calories: 150 + Math.random() * 100,
      notes: 'Sessione di test generata automaticamente'
    }
  }
  
  const handleAddMockSession = () => {
    const mock = generateMockSession()
    setSessions([...sessions, mock])
    setSelectedSession(mock)
    
    // Save to localStorage
    const allSessions = JSON.parse(localStorage.getItem('flexcoach_sessions') || '[]')
    allSessions.push(mock)
    localStorage.setItem('flexcoach_sessions', JSON.stringify(allSessions))
  }
  
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
            Analisi dettagliata qualità e progressi
          </p>
        </div>
        
        {/* View Mode Tabs */}
        <div className="flex gap-2">
          {['current', 'history', 'compare'].map(mode => (
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
               mode === 'history' ? '📈 Storico' : '🔄 Confronta'}
            </button>
          ))}
        </div>
      </div>
      
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <FireIcon className="w-5 h-5 text-blue-600" />
              {stats.trend === 'up' ? <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" /> :
               stats.trend === 'down' ? <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" /> :
               <span className="w-4 h-4">➡️</span>}
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalReps}</div>
            <div className="text-xs text-gray-600">Ripetizioni Totali</div>
            <div className="text-xs text-blue-600 mt-1">
              {stats.perfectRate}% perfette
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.avgQuality}%</div>
            <div className="text-xs text-gray-600">Qualità Media</div>
            <div className="text-xs text-green-600 mt-1">
              {stats.totalPerfect} reps perfette
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <ScaleIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.avgDepth}°</div>
            <div className="text-xs text-gray-600">Profondità Media</div>
            <div className="text-xs text-purple-600 mt-1">
              Target: 90°
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <ClockIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalTime}'</div>
            <div className="text-xs text-gray-600">Tempo Totale</div>
            <div className="text-xs text-orange-600 mt-1">
              {stats.totalCalories} kcal
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
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
                <span>{selectedSession.weight} kg</span>
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
      
      {/* Detailed Rep Analysis */}
      {selectedSession && (
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
                      Qualità: {set.avgQuality.toFixed(0)}%
                    </span>
                    <span className="text-gray-600">
                      Fatica: {set.fatigueFactor}%
                    </span>
                    {set.completed ? 
                      <CheckCircleIcon className="w-4 h-4 text-green-500" /> :
                      <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
                    }
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
                        style={{ backgroundColor: getQualityColor(rep.quality) + '20', color: getQualityColor(rep.quality) }}
                      >
                        {getQualityEmoji(rep.quality)}
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                        <div>Rep {rep.repNumber}</div>
                        <div>Profondità: {rep.depth.toFixed(0)}°</div>
                        <div>Durata: {rep.duration.toFixed(1)}s</div>
                        <div>Simmetria: {rep.symmetry.toFixed(0)}%</div>
                        {rep.formIssues.length > 0 && (
                          <div className="text-yellow-300 mt-1">
                            ⚠️ {rep.formIssues[0]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {set.restTime > 0 && setIdx < selectedSession.sets.length - 1 && (
                  <div className="text-xs text-gray-500 mt-2">
                    Riposo: {set.restTime}s
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Session History List */}
      {viewMode === 'history' && sessions.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            📅 Storico Sessioni
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((session, idx) => (
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
                      {session.weight} kg × {session.totalReps} reps
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: getQualityColor(
                      session.avgQuality > 85 ? 'perfect' :
                      session.avgQuality > 70 ? 'good' :
                      session.avgQuality > 55 ? 'fair' : 'poor'
                    )}}>
                      {session.avgQuality.toFixed(0)}%
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
        </div>
      )}
      
      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={handleAddMockSession}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
        >
          🧪 Aggiungi Sessione Demo
        </button>
        
        {sessions.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Vuoi cancellare tutto lo storico?')) {
                setSessions([])
                setSelectedSession(null)
                localStorage.removeItem('flexcoach_sessions')
              }
            }}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
          >
            🗑️ Cancella Storico
          </button>
        )}
        
        {selectedSession && (
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium ml-auto"
          >
            📤 Esporta Report
          </button>
        )}
      </div>
    </div>
  )
}