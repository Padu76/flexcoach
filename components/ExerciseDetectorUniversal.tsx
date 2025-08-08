// components/ExerciseDetectorUniversal.tsx - CON TRACKING REALE POSENET

'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useSoundFeedback } from '@/hooks/useSoundFeedback'
import { usePoseNetDetection } from '@/hooks/usePoseNetDetection'
import { 
  useCurrentWorkout, 
  useExercisePreferences,
  useWorkoutHistory,
  useStatistics,
  useAchievements
} from '@/hooks/useDataManager'
import { 
  FireIcon, 
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CameraIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import type { ExerciseType } from '@/types'

interface Props {
  exerciseType: ExerciseType
}

// Tipi per il sistema di alert infortuni
type AlertLevel = 'safe' | 'warning' | 'danger'

interface InjuryAlert {
  level: AlertLevel
  message: string
  bodyPart: string
  timestamp: number
  autopaused?: boolean
}

export default function ExerciseDetectorUniversal({ exerciseType }: Props) {
  // DataManager Hooks
  const { 
    startWorkout, 
    endWorkout, 
    addSet, 
    session,
    isActive 
  } = useCurrentWorkout()
  
  const { 
    preferences, 
    updatePreferences 
  } = useExercisePreferences(exerciseType)
  
  const { 
    sessions,
    lastWorkout
  } = useWorkoutHistory({ 
    exercise: exerciseType, 
    limit: 5 
  })
  
  const { 
    stats,
    exerciseStats
  } = useStatistics(exerciseType)
  
  const {
    achievements
  } = useAchievements()
  
  // Stati locali esistenti
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(preferences?.audioEnabled ?? true)
  const [showSkeleton, setShowSkeleton] = useState(preferences?.showSkeleton ?? true)
  const [showMetrics, setShowMetrics] = useState(preferences?.showMetrics ?? true)
  const [repsCount, setRepsCount] = useState(0)
  const [currentSetCount, setCurrentSetCount] = useState(0)
  const [sessionVolume, setSessionVolume] = useState(0)
  const [formQuality, setFormQuality] = useState(100)
  const [currentWeight, setCurrentWeight] = useState(50)
  
  // NUOVI STATI PER COUNTER AUTOMATICO RIPETIZIONI
  const [movementPhase, setMovementPhase] = useState<'ready' | 'descending' | 'bottom' | 'ascending' | 'top'>('ready')
  const [repQuality, setRepQuality] = useState<'perfect' | 'good' | 'fair' | 'poor'>('good')
  const [currentRepStartTime, setCurrentRepStartTime] = useState(0)
  const [repDuration, setRepDuration] = useState(0)
  const [perfectReps, setPerfectReps] = useState(0)
  const [goodReps, setGoodReps] = useState(0)
  const [fairReps, setFairReps] = useState(0)
  const [poorReps, setPoorReps] = useState(0)
  const [lastPosition, setLastPosition] = useState(0) // 0-100, 0=top, 100=bottom
  const [currentPosition, setCurrentPosition] = useState(0)
  const [velocityTracking, setVelocityTracking] = useState<number[]>([])
  const [isInProperForm, setIsInProperForm] = useState(true)
  
  // NUOVI STATI PER ALERT INFORTUNI
  const [injuryAlertsEnabled, setInjuryAlertsEnabled] = useState(true)
  const [currentAlert, setCurrentAlert] = useState<InjuryAlert | null>(null)
  const [alertHistory, setAlertHistory] = useState<InjuryAlert[]>([])
  const [postureScore, setPostureScore] = useState(100) // 0-100, 100 = perfetto
  const [consecutiveDangerFrames, setConsecutiveDangerFrames] = useState(0)
  const [wasAutoPaused, setWasAutoPaused] = useState(false)
  const [currentPostureIssues, setCurrentPostureIssues] = useState<Array<{
    bodyPart: string
    message: string
    recommendation: string
  }>>([])
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sessionStarted = useRef(false)
  const totalRepsSession = useRef(0)
  const perfectRepsCount = useRef(0)
  const alertTimeoutRef = useRef<NodeJS.Timeout>()
  const dangerSoundPlayedRef = useRef(false)
  
  // Sound feedback hook
  const { 
    playBeep,
    sounds
  } = useSoundFeedback()
  
  // POSENET TRACKING REALE
  const {
    setupVideoElement,
    setupCanvasElement,
    startTracking: startPoseTracking,
    stopTracking: stopPoseTracking,
    resetTracking: resetPoseTracking,
    isLoading: poseLoading,
    isTracking: poseTracking,
    modelReady,
    repCount: poseRepCount,
    currentPhase: posePhase,
    currentAngles,
    currentMetrics,
    formAnalysis: poseFormAnalysis
  } = usePoseNetDetection({
    exerciseType,
    minConfidence: 0.3,
    onRepComplete: (rep) => {
      console.log('Rep completata:', rep)
      
      // Aggiorna contatori basati su qualità
      totalRepsSession.current++
      setRepsCount(poseRepCount)
      setCurrentSetCount(prev => prev + 1)
      
      switch (rep.quality) {
        case 'perfect':
          setPerfectReps(prev => prev + 1)
          perfectRepsCount.current++
          if (audioEnabled && sounds?.perfetto) sounds.perfetto()
          break
        case 'good':
          setGoodReps(prev => prev + 1)
          if (audioEnabled) playBeep(800, 100)
          break
        case 'fair':
          setFairReps(prev => prev + 1)
          if (audioEnabled) playBeep(500, 150)
          break
        case 'poor':
          setPoorReps(prev => prev + 1)
          if (audioEnabled) playBeep(300, 200)
          break
      }
      
      // Aggiorna volume
      const currentVolume = currentWeight * poseRepCount
      setSessionVolume(currentVolume)
      
      // Milestone audio
      if (poseRepCount % 5 === 0 && audioEnabled && sounds?.cinqueReps) {
        setTimeout(() => sounds.cinqueReps(), 500)
      }
      if (poseRepCount % 10 === 0 && audioEnabled && sounds?.dieciReps) {
        setTimeout(() => sounds.dieciReps(), 500)
      }
    },
    onPhaseChange: (phase) => {
      console.log('Cambio fase:', phase)
      setMovementPhase(phase.phase === 'descending' ? 'descending' :
                       phase.phase === 'bottom' ? 'bottom' :
                       phase.phase === 'ascending' ? 'ascending' :
                       phase.phase === 'top' ? 'top' : 'ready')
    }
  })
  
  // Sincronizza rep count da PoseNet
  useEffect(() => {
    setRepsCount(poseRepCount)
  }, [poseRepCount])
  
  // Aggiorna posture score da form analysis
  useEffect(() => {
    if (poseFormAnalysis) {
      setPostureScore(poseFormAnalysis.score)
      setFormQuality(poseFormAnalysis.score)
      
      // Converti issues in formato alert
      if (poseFormAnalysis.issues.length > 0 && injuryAlertsEnabled) {
        const severity = poseFormAnalysis.score < 50 ? 'danger' :
                        poseFormAnalysis.score < 70 ? 'warning' : 'safe'
        
        if (severity !== 'safe') {
          const alert: InjuryAlert = {
            level: severity as AlertLevel,
            message: poseFormAnalysis.issues[0],
            bodyPart: 'forma',
            timestamp: Date.now()
          }
          setCurrentAlert(alert)
          setAlertHistory(prev => [...prev, alert])
          
          // Audio alert
          if (audioEnabled && severity === 'danger' && !dangerSoundPlayedRef.current) {
            playBeep(800, 200)
            playBeep(800, 200)
            playBeep(800, 200)
            dangerSoundPlayedRef.current = true
          }
        }
      }
    }
  }, [poseFormAnalysis, injuryAlertsEnabled, audioEnabled, playBeep])
  
  // Aggiorna metriche da PoseNet
  useEffect(() => {
    if (currentMetrics) {
      setCurrentPosition(currentMetrics.depth)
      // Velocity tracking per stability
      setVelocityTracking(prev => [...prev.slice(-10), currentMetrics.velocity])
    }
  }, [currentMetrics])
  
  // Setup video e canvas quando il componente monta
  useEffect(() => {
    if (videoRef.current) {
      setupVideoElement(videoRef.current)
    }
    if (canvasRef.current) {
      setupCanvasElement(canvasRef.current)
    }
  }, [setupVideoElement, setupCanvasElement])
  
  // Inizializza workout quando si avvia
  useEffect(() => {
    if (isRunning && !sessionStarted.current) {
      console.log('Starting workout session for:', exerciseType)
      const result = startWorkout(exerciseType)
      if (result.success) {
        sessionStarted.current = true
        setAlertHistory([]) // Reset alert history per nuova sessione
        console.log('Workout started successfully')
      } else {
        console.error('Failed to start workout:', result.error)
      }
    }
  }, [isRunning, exerciseType, startWorkout])
  
  // Salva set quando si mette in pausa o ferma
  useEffect(() => {
    if ((isPaused || !isRunning) && currentSetCount > 0 && isActive) {
      const quality = perfectRepsCount.current / Math.max(1, currentSetCount) * 100
      console.log('Saving set:', { reps: currentSetCount, weight: currentWeight, quality })
      
      const result = addSet({
        setNumber: 1,
        exercise: exerciseType,
        targetReps: currentSetCount,
        completedReps: currentSetCount,
        reps: Array(currentSetCount).fill({ quality: formQuality }),
        weight: currentWeight,
        averageQuality: formQuality,
        restTime: 0
      })
      
      if (result.success) {
        console.log('Set saved successfully')
        setCurrentSetCount(0)
        perfectRepsCount.current = 0
      } else {
        console.error('Failed to save set:', result.error)
      }
    }
  }, [isPaused, isRunning, currentSetCount, currentWeight, formQuality, isActive, addSet, exerciseType])
  
  // Finalizza workout quando il componente si smonta o si ferma
  useEffect(() => {
    return () => {
      if (sessionStarted.current && totalRepsSession.current > 0) {
        console.log('Finalizing workout:', { 
          totalReps: totalRepsSession.current, 
          volume: sessionVolume,
          alerts: alertHistory.length
        })
        
        const result = endWorkout()
        
        if (result.success) {
          console.log('Workout ended successfully')
          sessionStarted.current = false
        } else {
          console.error('Failed to end workout:', result.error)
        }
      }
    }
  }, [sessionVolume, alertHistory, endWorkout])
  
  // Handler per start/stop
  const handleStartStop = async () => {
    if (isRunning) {
      console.log('Stopping workout')
      setIsRunning(false)
      setIsPaused(false)
      
      // Stop tracking reale
      stopPoseTracking()
      
      // Salva sessione finale
      if (sessionStarted.current && totalRepsSession.current > 0) {
        console.log('Ending workout with:', { 
          totalReps: totalRepsSession.current, 
          volume: sessionVolume,
          injuryAlerts: alertHistory.length
        })
        
        const result = endWorkout()
        
        if (result.success) {
          console.log('Workout saved successfully')
          if (audioEnabled && sounds?.start) sounds.start()
        } else {
          console.error('Failed to save workout:', result.error)
        }
      }
      
      // Reset tutto
      sessionStarted.current = false
      setRepsCount(0)
      setCurrentSetCount(0)
      setSessionVolume(0)
      totalRepsSession.current = 0
      perfectRepsCount.current = 0
      setCurrentAlert(null)
      setAlertHistory([])
      setPostureScore(100)
      setConsecutiveDangerFrames(0)
      setWasAutoPaused(false)
      setCurrentPostureIssues([])
      // Reset counter automatico
      setMovementPhase('ready')
      setPerfectReps(0)
      setGoodReps(0)
      setFairReps(0)
      setPoorReps(0)
      setLastPosition(0)
      setCurrentPosition(0)
      setVelocityTracking([])
      setIsInProperForm(true)
      setRepQuality('good')
      setRepDuration(0)
      resetPoseTracking()
    } else {
      console.log('Starting workout')
      setIsRunning(true)
      setIsPaused(false)
      
      // Start tracking reale
      await startPoseTracking()
      
      if (audioEnabled && sounds?.start) sounds.start()
    }
  }
  
  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false)
      setWasAutoPaused(false) // Reset auto-pause flag quando riprende manualmente
      // Resume tracking se era in pausa
      if (isRunning && !poseTracking) {
        startPoseTracking()
      }
    } else {
      setIsPaused(true)
      // Pausa tracking
      if (poseTracking) {
        stopPoseTracking()
      }
    }
  }
  
  const handleReset = () => {
    setRepsCount(0)
    setCurrentSetCount(0)
    setSessionVolume(0)
    totalRepsSession.current = 0
    perfectRepsCount.current = 0
    setCurrentAlert(null)
    setPostureScore(100)
    setCurrentPostureIssues([])
    // Reset counter automatico
    setMovementPhase('ready')
    setPerfectReps(0)
    setGoodReps(0)
    setFairReps(0)
    setPoorReps(0)
    setLastPosition(0)
    setCurrentPosition(0)
    setVelocityTracking([])
    setIsInProperForm(true)
    setRepQuality('good')
    setRepDuration(0)
    if (audioEnabled && sounds?.start) sounds.start()
  }
  
  const toggleAudio = () => {
    const newState = !audioEnabled
    setAudioEnabled(newState)
    
    updatePreferences({
      preferredView: 'auto',
      audioEnabled: newState,
      showSkeleton,
      showMetrics
    })
  }
  
  const toggleSkeleton = () => {
    const newState = !showSkeleton
    setShowSkeleton(newState)
    
    updatePreferences({
      preferredView: 'auto',
      audioEnabled,
      showSkeleton: newState,
      showMetrics
    })
  }
  
  const toggleMetrics = () => {
    const newState = !showMetrics
    setShowMetrics(newState)
    
    updatePreferences({
      preferredView: 'auto',
      audioEnabled,
      showSkeleton,
      showMetrics: newState
    })
  }
  
  const toggleInjuryAlerts = () => {
    setInjuryAlertsEnabled(!injuryAlertsEnabled)
    if (!injuryAlertsEnabled) {
      setCurrentAlert(null)
    }
  }
  
  // UI per selezione peso
  const WeightSelector = () => (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Peso utilizzato (kg)
      </label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentWeight(Math.max(0, currentWeight - 2.5))}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          -2.5
        </button>
        <input
          type="number"
          value={currentWeight}
          onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || 0)}
          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center font-bold"
          step="2.5"
          min="0"
        />
        <button
          onClick={() => setCurrentWeight(currentWeight + 2.5)}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          +2.5
        </button>
      </div>
    </div>
  )
  
  // Stats Panel con Posture Score e Quality Breakdown
  const StatsPanel = () => (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600">{repsCount}</div>
          <div className="text-xs text-gray-600">Ripetizioni</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600">{currentSetCount}</div>
          <div className="text-xs text-gray-600">Set Corrente</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-purple-600">{sessionVolume} kg</div>
          <div className="text-xs text-gray-600">Volume Totale</div>
        </div>
        <div className={`rounded-lg p-3 ${
          postureScore >= 80 ? 'bg-green-50' : 
          postureScore >= 50 ? 'bg-yellow-50' : 'bg-red-50'
        }`}>
          <div className={`text-2xl font-bold ${
            postureScore >= 80 ? 'text-green-600' : 
            postureScore >= 50 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {postureScore}%
          </div>
          <div className="text-xs text-gray-600">Postura</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-orange-600">{alertHistory.length}</div>
          <div className="text-xs text-gray-600">Alert Totali</div>
        </div>
      </div>
      
      {/* Quality Breakdown Bar */}
      {repsCount > 0 && (
        <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Qualità Ripetizioni</span>
            <span className="text-xs text-gray-500">
              Media: {Math.round((perfectReps * 100 + goodReps * 75 + fairReps * 50 + poorReps * 25) / repsCount)}%
            </span>
          </div>
          <div className="flex h-8 rounded-lg overflow-hidden bg-gray-100">
            {perfectReps > 0 && (
              <div 
                className="bg-green-500 flex items-center justify-center text-white text-xs font-bold"
                style={{ width: `${(perfectReps / repsCount) * 100}%` }}
              >
                {perfectReps}
              </div>
            )}
            {goodReps > 0 && (
              <div 
                className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
                style={{ width: `${(goodReps / repsCount) * 100}%` }}
              >
                {goodReps}
              </div>
            )}
            {fairReps > 0 && (
              <div 
                className="bg-yellow-500 flex items-center justify-center text-white text-xs font-bold"
                style={{ width: `${(fairReps / repsCount) * 100}%` }}
              >
                {fairReps}
              </div>
            )}
            {poorReps > 0 && (
              <div 
                className="bg-red-500 flex items-center justify-center text-white text-xs font-bold"
                style={{ width: `${(poorReps / repsCount) * 100}%` }}
              >
                {poorReps}
              </div>
            )}
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-green-600">Perfect: {perfectReps}</span>
            <span className="text-blue-600">Good: {goodReps}</span>
            <span className="text-yellow-600">Fair: {fairReps}</span>
            <span className="text-red-600">Poor: {poorReps}</span>
          </div>
        </div>
      )}
      
      {/* Movement Phase Indicator */}
      {isRunning && !isPaused && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Fase Movimento</span>
            <span className={`text-sm font-bold ${
              movementPhase === 'descending' ? 'text-blue-600' :
              movementPhase === 'bottom' ? 'text-purple-600' :
              movementPhase === 'ascending' ? 'text-orange-600' :
              movementPhase === 'top' ? 'text-green-600' :
              'text-gray-600'
            }`}>
              {movementPhase === 'descending' ? '↓ Discesa' :
               movementPhase === 'bottom' ? '⏸ Bottom' :
               movementPhase === 'ascending' ? '↑ Risalita' :
               movementPhase === 'top' ? '✓ Top' :
               '⏳ Ready'}
            </span>
          </div>
          {/* Position bar */}
          <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
              style={{ width: `${currentPosition}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow">
                {Math.round(currentPosition)}%
              </span>
            </div>
          </div>
          {repDuration > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              Ultima rep: {(repDuration / 1000).toFixed(1)}s - {repQuality}
            </div>
          )}
        </div>
      )}
    </div>
  )
  
  // Alert Banner Component
  const AlertBanner = () => {
    if (!currentAlert || !injuryAlertsEnabled) return null
    
    const bgColor = currentAlert.level === 'danger' 
      ? 'bg-red-600' 
      : currentAlert.level === 'warning' 
      ? 'bg-yellow-500' 
      : 'bg-green-500'
    
    const icon = currentAlert.level === 'danger'
      ? <XCircleIcon className="w-6 h-6" />
      : currentAlert.level === 'warning'
      ? <ExclamationTriangleIcon className="w-6 h-6" />
      : <CheckCircleIcon className="w-6 h-6" />
    
    return (
      <div className={`${bgColor} text-white p-4 rounded-lg mb-4 shadow-lg animate-pulse`}>
        <div className="flex items-center gap-3">
          {icon}
          <div className="flex-1">
            <div className="font-bold text-lg">
              {currentAlert.level === 'danger' ? 'PERICOLO!' : 
               currentAlert.level === 'warning' ? 'ATTENZIONE' : 'OK'}
            </div>
            <div className="text-sm opacity-90">
              {currentAlert.message}
            </div>
            {currentAlert.autopaused && (
              <div className="text-xs mt-1 font-bold">
                ⛔ ESERCIZIO FERMATO PER SICUREZZA
              </div>
            )}
          </div>
        </div>
        {currentPostureIssues.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/30">
            <div className="text-sm font-medium mb-1">Raccomandazioni:</div>
            {currentPostureIssues.map((issue, idx) => (
              <div key={idx} className="text-xs opacity-90 mb-1">
                • {issue.recommendation}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  const getExerciseName = () => {
    switch (exerciseType) {
      case 'squat': return '🏋️ Squat'
      case 'bench-press': return '💪 Panca Piana'
      case 'deadlift': return '⚡ Stacco da Terra'
      default: return '🎯 Esercizio'
    }
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-gray-900">
          {getExerciseName()} Detector
        </h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleInjuryAlerts}
            className={`p-2 rounded-lg ${injuryAlertsEnabled ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}
            title="Toggle Injury Alerts"
          >
            {injuryAlertsEnabled ? <ShieldExclamationIcon className="w-5 h-5" /> : <ShieldCheckIcon className="w-5 h-5" />}
          </button>
          
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-lg ${audioEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
            title="Toggle Audio"
          >
            {audioEnabled ? <SpeakerWaveIcon className="w-5 h-5" /> : <SpeakerXMarkIcon className="w-5 h-5" />}
          </button>
          
          <button
            onClick={toggleSkeleton}
            className={`p-2 rounded-lg ${showSkeleton ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
            title="Toggle Skeleton"
          >
            {showSkeleton ? <EyeIcon className="w-5 h-5" /> : <EyeSlashIcon className="w-5 h-5" />}
          </button>
          
          <button
            onClick={toggleMetrics}
            className={`p-2 rounded-lg ${showMetrics ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
            title="Toggle Metrics"
          >
            <ChartBarIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Weight Selector */}
      {!isRunning && <WeightSelector />}
      
      {/* Alert Banner - Sempre visibile quando c'è un alert */}
      <AlertBanner />
      
      {/* Stats Panel */}
      {showMetrics && isRunning && <StatsPanel />}
      
      {/* Video Container con Tracking Reale */}
      <div className="relative bg-black rounded-lg overflow-hidden mb-4">
        {/* Status Badges */}
        <div className="absolute top-4 left-4 z-20 space-y-2">
          {isRunning && (
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
              ALLENAMENTO ATTIVO
            </div>
          )}
          
          {isPaused && (
            <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">
              IN PAUSA
            </div>
          )}
          
          {wasAutoPaused && (
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm animate-bounce">
              AUTO-PAUSA SICUREZZA
            </div>
          )}
          
          {injuryAlertsEnabled && isRunning && (
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
              🛡️ Protezione Attiva
            </div>
          )}
          
          {modelReady && !poseLoading && (
            <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm">
              🤖 AI Tracking ON
            </div>
          )}
        </div>
        
        {/* Loading Indicator */}
        {poseLoading && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Caricamento AI Tracking...</p>
              <p className="text-sm text-gray-300 mt-2">Attendi qualche secondo</p>
            </div>
          </div>
        )}
        
        {/* Posture Issues Overlay - Solo quando ci sono problemi */}
        {isRunning && currentPostureIssues.length > 0 && showSkeleton && (
          <div className="absolute top-4 right-4 z-20 bg-black/70 text-white p-3 rounded-lg max-w-xs">
            <div className="text-xs font-bold mb-2">Problemi Rilevati:</div>
            {currentPostureIssues.map((issue, idx) => (
              <div key={idx} className="text-xs mb-1">
                ⚠️ {issue.bodyPart}: {issue.message}
              </div>
            ))}
          </div>
        )}
        
        {/* Video nascosto (solo per capture) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="hidden"
          width={640}
          height={480}
        />
        
        {/* Canvas con tracking visibile */}
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
          width={640}
          height={480}
        />
        
        {/* Placeholder quando non attivo */}
        {!isRunning && !poseTracking && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <CameraIcon className="w-12 h-12 mx-auto mb-2" />
              <p>Premi "Inizia Allenamento" per attivare</p>
              <p className="text-sm text-gray-300 mt-2">Il tracking AI rileverà automaticamente i tuoi movimenti</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Control Buttons */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={handleStartStop}
          className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
            isRunning
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isRunning ? (
            <>
              <PauseIcon className="w-5 h-5" />
              Stop Allenamento
            </>
          ) : (
            <>
              <PlayIcon className="w-5 h-5" />
              Inizia Allenamento
            </>
          )}
        </button>
        
        {isRunning && (
          <>
            <button
              onClick={handlePauseResume}
              className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                isPaused
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white'
              }`}
            >
              {isPaused ? (
                <>
                  <PlayIcon className="w-5 h-5" />
                  Riprendi
                </>
              ) : (
                <>
                  <PauseIcon className="w-5 h-5" />
                  Pausa
                </>
              )}
            </button>
            
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Reset
            </button>
          </>
        )}
      </div>
      
      {/* Session Summary con Alert Stats */}
      {!isRunning && totalRepsSession.current > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5" />
            Sessione Completata!
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Ripetizioni Totali:</span>
              <span className="ml-2 font-bold">{totalRepsSession.current}</span>
            </div>
            <div>
              <span className="text-gray-600">Volume:</span>
              <span className="ml-2 font-bold">{sessionVolume} kg</span>
            </div>
            <div>
              <span className="text-gray-600">Reps Perfette:</span>
              <span className="ml-2 font-bold text-green-600">{perfectReps}</span>
            </div>
            <div>
              <span className="text-gray-600">Reps Buone:</span>
              <span className="ml-2 font-bold text-blue-600">{goodReps}</span>
            </div>
            <div>
              <span className="text-gray-600">Reps Discrete:</span>
              <span className="ml-2 font-bold text-yellow-600">{fairReps}</span>
            </div>
            <div>
              <span className="text-gray-600">Da Migliorare:</span>
              <span className="ml-2 font-bold text-red-600">{poorReps}</span>
            </div>
            {alertHistory.length > 0 && (
              <>
                <div>
                  <span className="text-gray-600">Alert Ricevuti:</span>
                  <span className="ml-2 font-bold text-orange-600">{alertHistory.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Alert Gravi:</span>
                  <span className="ml-2 font-bold text-red-600">
                    {alertHistory.filter(a => a.level === 'danger').length}
                  </span>
                </div>
              </>
            )}
          </div>
          
          {/* Riepilogo Alert della sessione */}
          {alertHistory.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Riepilogo Alert Infortuni:
              </div>
              <div className="space-y-1">
                {Array.from(new Set(alertHistory.map(a => a.bodyPart))).map(bodyPart => {
                  const count = alertHistory.filter(a => a.bodyPart === bodyPart).length
                  const severity = alertHistory.filter(a => a.bodyPart === bodyPart && a.level === 'danger').length
                  
                  return (
                    <div key={bodyPart} className="flex justify-between text-xs">
                      <span className="capitalize">{bodyPart}:</span>
                      <span className={severity > 0 ? 'text-red-600 font-bold' : 'text-orange-600'}>
                        {count} alert {severity > 0 && `(${severity} gravi)`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Recent Sessions */}
      {sessions.length > 0 && !isRunning && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Sessioni Recenti</h3>
          <div className="space-y-2">
            {sessions.slice(0, 3).map((session, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium">
                    {new Date(session.date).toLocaleDateString('it-IT')}
                  </div>
                  <div className="text-xs text-gray-600">
                    {session.totalReps} reps
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">
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
      
      {/* Debug info - solo in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <div>Session Active: {isActive ? 'Yes' : 'No'}</div>
          <div>Session Started: {sessionStarted.current ? 'Yes' : 'No'}</div>
          <div>Total Reps: {totalRepsSession.current}</div>
          <div>Session Volume: {sessionVolume}</div>
          <div>Posture Score: {postureScore}</div>
          <div>Alert Count: {alertHistory.length}</div>
          <div>Danger Frames: {consecutiveDangerFrames}</div>
          <div>Auto-Paused: {wasAutoPaused ? 'Yes' : 'No'}</div>
          <div className="mt-2 pt-2 border-t">
            <div className="font-bold">PoseNet Status:</div>
            <div>Model Ready: {modelReady ? 'Yes' : 'No'}</div>
            <div>Tracking: {poseTracking ? 'Yes' : 'No'}</div>
            <div>Phase: {posePhase?.phase || 'N/A'}</div>
            <div>Angles: {currentAngles ? 'Detecting' : 'Not detecting'}</div>
          </div>
        </div>
      )}
    </div>
  )
}