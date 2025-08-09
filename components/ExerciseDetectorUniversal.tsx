// components/ExerciseDetectorUniversal.tsx - CON FULLSCREEN E REPORT SERIE

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
  XCircleIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ClockIcon,
  StarIcon,
  TrophyIcon,
  LightBulbIcon,
  DocumentDuplicateIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
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

// Tipo per il report serie
interface SetReport {
  totalReps: number
  perfectReps: number
  goodReps: number
  fairReps: number
  poorReps: number
  timeUnderTension: number
  averageRepTime: number
  averageROM: number
  averageSymmetry: number
  totalVolume: number
  issues: {
    rep: number
    issue: string
  }[]
  suggestion: string
  overallScore: number
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
  
  // NUOVI STATI PER FULLSCREEN E REPORT
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSetReport, setShowSetReport] = useState(false)
  const [currentSetReport, setCurrentSetReport] = useState<SetReport | null>(null)
  const [inactivityTimer, setInactivityTimer] = useState(0)
  const [autoEndSetEnabled, setAutoEndSetEnabled] = useState(true)
  const [setStartTime, setSetStartTime] = useState(0)
  const [repTimestamps, setRepTimestamps] = useState<number[]>([])
  const [repQualities, setRepQualities] = useState<Array<'perfect' | 'good' | 'fair' | 'poor'>>([])
  const [repIssues, setRepIssues] = useState<Array<{rep: number, issue: string}>>([])
  
  // Stati counter automatico
  const [movementPhase, setMovementPhase] = useState<'ready' | 'descending' | 'bottom' | 'ascending' | 'top'>('ready')
  const [repQuality, setRepQuality] = useState<'perfect' | 'good' | 'fair' | 'poor'>('good')
  const [currentRepStartTime, setCurrentRepStartTime] = useState(0)
  const [repDuration, setRepDuration] = useState(0)
  const [perfectReps, setPerfectReps] = useState(0)
  const [goodReps, setGoodReps] = useState(0)
  const [fairReps, setFairReps] = useState(0)
  const [poorReps, setPoorReps] = useState(0)
  const [lastPosition, setLastPosition] = useState(0)
  const [currentPosition, setCurrentPosition] = useState(0)
  const [velocityTracking, setVelocityTracking] = useState<number[]>([])
  const [isInProperForm, setIsInProperForm] = useState(true)
  
  // Stati alert infortuni
  const [injuryAlertsEnabled, setInjuryAlertsEnabled] = useState(true)
  const [currentAlert, setCurrentAlert] = useState<InjuryAlert | null>(null)
  const [alertHistory, setAlertHistory] = useState<InjuryAlert[]>([])
  const [postureScore, setPostureScore] = useState(100)
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
  const containerRef = useRef<HTMLDivElement>(null)
  const sessionStarted = useRef(false)
  const totalRepsSession = useRef(0)
  const perfectRepsCount = useRef(0)
  const alertTimeoutRef = useRef<NodeJS.Timeout>()
  const dangerSoundPlayedRef = useRef(false)
  const inactivityTimeoutRef = useRef<NodeJS.Timeout>()
  
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
      
      // Reset inactivity timer
      setInactivityTimer(0)
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
      
      // Track rep timestamp e quality
      setRepTimestamps(prev => [...prev, Date.now()])
      setRepQualities(prev => [...prev, rep.quality])
      
      // Track issues
      if (rep.quality === 'poor' || rep.quality === 'fair') {
        const issueMessage = poseFormAnalysis?.issues[0] || 'Forma da migliorare'
        setRepIssues(prev => [...prev, { rep: poseRepCount, issue: issueMessage }])
      }
      
      // Aggiorna contatori
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
      
      // Start inactivity timer per auto-end set
      if (autoEndSetEnabled) {
        inactivityTimeoutRef.current = setTimeout(() => {
          if (currentSetCount > 0) {
            handleEndSet()
          }
        }, 5000) // 5 secondi di inattività
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
  
  // FUNZIONI FULLSCREEN
  const enterFullscreen = useCallback(() => {
    if (containerRef.current && !document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(err => {
        console.error('Errore fullscreen:', err)
      })
    }
  }, [])
  
  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      })
    }
  }, [])
  
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen()
    } else {
      enterFullscreen()
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen])
  
  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])
  
  // FUNZIONE GENERA REPORT SERIE
  const generateSetReport = useCallback((): SetReport => {
    const timeUnderTension = Date.now() - setStartTime
    const avgRepTime = repTimestamps.length > 1 
      ? (repTimestamps[repTimestamps.length - 1] - repTimestamps[0]) / (repTimestamps.length - 1)
      : 0
    
    // Calcola metriche medie (simulato per ora)
    const avgROM = currentMetrics?.depth || 85
    const avgSymmetry = currentMetrics?.symmetry || 90
    
    // Genera suggerimento basato sulla performance
    let suggestion = ''
    if (perfectReps >= currentSetCount * 0.7) {
      suggestion = "Eccellente serie! Mantieni questa qualità e considera di aumentare il peso di 2.5kg"
    } else if (goodReps >= currentSetCount * 0.5) {
      suggestion = "Buona serie! Focus sulla profondità e controllo nelle ultime rep"
    } else {
      suggestion = "Serie da migliorare. Riduci il peso o fai pause più lunghe tra le serie"
    }
    
    // Calcola score complessivo
    const overallScore = Math.round(
      (perfectReps * 100 + goodReps * 75 + fairReps * 50 + poorReps * 25) / 
      Math.max(1, currentSetCount)
    )
    
    return {
      totalReps: currentSetCount,
      perfectReps,
      goodReps,
      fairReps,
      poorReps,
      timeUnderTension: timeUnderTension / 1000, // in secondi
      averageRepTime: avgRepTime / 1000, // in secondi
      averageROM: avgROM,
      averageSymmetry: avgSymmetry,
      totalVolume: currentWeight * currentSetCount,
      issues: repIssues,
      suggestion,
      overallScore
    }
  }, [currentSetCount, perfectReps, goodReps, fairReps, poorReps, setStartTime, 
      repTimestamps, currentWeight, repIssues, currentMetrics])
  
  // HANDLER FINE SERIE
  const handleEndSet = useCallback(() => {
    if (currentSetCount === 0) return
    
    // Genera report
    const report = generateSetReport()
    setCurrentSetReport(report)
    setShowSetReport(true)
    
    // Stop tracking temporaneamente
    if (poseTracking) {
      stopPoseTracking()
    }
    
    // Play sound
    if (audioEnabled && sounds?.stop) {
      sounds.stop()
    }
    
    // Clear inactivity timer
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
    }
  }, [currentSetCount, generateSetReport, poseTracking, stopPoseTracking, 
      audioEnabled, sounds])
  
  // HANDLER SALVA E CONTINUA
  const handleSaveAndContinue = () => {
    if (currentSetReport) {
      // Salva nel workout log
      addSet({
        setNumber: (sessions[0]?.sets?.length || 0) + 1,
        exercise: exerciseType,
        targetReps: currentSetCount,
        completedReps: currentSetCount,
        reps: Array(currentSetCount).fill({ quality: formQuality }),
        weight: currentWeight,
        averageQuality: currentSetReport.overallScore,
        restTime: 0
      })
    }
    
    // Reset per nuova serie
    setShowSetReport(false)
    setCurrentSetReport(null)
    setRepsCount(0)
    setCurrentSetCount(0)
    setPerfectReps(0)
    setGoodReps(0)
    setFairReps(0)
    setPoorReps(0)
    setRepTimestamps([])
    setRepQualities([])
    setRepIssues([])
    setSetStartTime(Date.now())
    
    // Riprendi tracking
    if (isRunning && !poseTracking) {
      startPoseTracking()
    }
  }
  
  // HANDLER RIFAI SERIE
  const handleRedoSet = () => {
    setShowSetReport(false)
    setCurrentSetReport(null)
    setRepsCount(0)
    setCurrentSetCount(0)
    setPerfectReps(0)
    setGoodReps(0)
    setFairReps(0)
    setPoorReps(0)
    setRepTimestamps([])
    setRepQualities([])
    setRepIssues([])
    setSetStartTime(Date.now())
    resetPoseTracking()
    
    // Riprendi tracking
    if (isRunning) {
      startPoseTracking()
    }
  }
  
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
  
  // Setup video e canvas
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
        setAlertHistory([])
        setSetStartTime(Date.now())
        console.log('Workout started successfully')
      } else {
        console.error('Failed to start workout:', result.error)
      }
    }
  }, [isRunning, exerciseType, startWorkout])
  
  // Handler per start/stop
  const handleStartStop = async () => {
    if (isRunning) {
      console.log('Stopping workout')
      setIsRunning(false)
      setIsPaused(false)
      
      // Stop tracking reale
      stopPoseTracking()
      
      // Exit fullscreen
      if (isFullscreen) {
        exitFullscreen()
      }
      
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
      setMovementPhase('ready')
      setPerfectReps(0)
      setGoodReps(0)
      setFairReps(0)
      setPoorReps(0)
      resetPoseTracking()
    } else {
      console.log('Starting workout')
      setIsRunning(true)
      setIsPaused(false)
      setSetStartTime(Date.now())
      
      // Auto-fullscreen se preferito (per ora disabilitato)
      // if (preferences?.autoFullscreen) {
      //   enterFullscreen()
      // }
      
      // Start tracking reale
      await startPoseTracking()
      
      if (audioEnabled && sounds?.start) sounds.start()
    }
  }
  
  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false)
      setWasAutoPaused(false)
      if (isRunning && !poseTracking) {
        startPoseTracking()
      }
    } else {
      setIsPaused(true)
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
    setMovementPhase('ready')
    setPerfectReps(0)
    setGoodReps(0)
    setFairReps(0)
    setPoorReps(0)
    setRepTimestamps([])
    setRepQualities([])
    setRepIssues([])
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
  
  // Stats Panel compatto per fullscreen
  const StatsPanel = () => {
    if (isFullscreen) {
      // Versione compatta per fullscreen
      return (
        <div className="absolute top-4 right-4 z-30 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold">{repsCount}</div>
              <div className="text-xs opacity-70">Reps</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{currentWeight}kg</div>
              <div className="text-xs opacity-70">Peso</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${
                postureScore >= 80 ? 'text-green-400' : 
                postureScore >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {postureScore}%
              </div>
              <div className="text-xs opacity-70">Forma</div>
            </div>
          </div>
        </div>
      )
    }
    
    // Versione normale
    return (
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
          </div>
        )}
      </div>
    )
  }
  
  // Report Serie Modal
  const SetReportModal = () => {
    if (!showSetReport || !currentSetReport) return null
    
    const stars = Math.ceil(currentSetReport.overallScore / 20)
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-t-2xl text-white">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">Serie Completata! 🎯</h2>
              <TrophyIcon className="w-8 h-8" />
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <StarIconSolid 
                  key={i} 
                  className={`w-6 h-6 ${i < stars ? 'text-yellow-300' : 'text-white/30'}`} 
                />
              ))}
              <span className="ml-2 text-lg font-semibold">{currentSetReport.overallScore}%</span>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Ripetizioni</div>
                <div className="text-2xl font-bold">{currentSetReport.totalReps}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Volume</div>
                <div className="text-2xl font-bold">{currentSetReport.totalVolume}kg</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">TUT</div>
                <div className="text-2xl font-bold">{currentSetReport.timeUnderTension.toFixed(1)}s</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Tempo/Rep</div>
                <div className="text-2xl font-bold">{currentSetReport.averageRepTime.toFixed(1)}s</div>
              </div>
            </div>
            
            {/* Quality Breakdown */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Qualità Ripetizioni</h3>
              <div className="space-y-2">
                {currentSetReport.perfectReps > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-sm">Perfette</span>
                    </div>
                    <span className="font-bold text-green-600">{currentSetReport.perfectReps}</span>
                  </div>
                )}
                {currentSetReport.goodReps > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-sm">Buone</span>
                    </div>
                    <span className="font-bold text-blue-600">{currentSetReport.goodReps}</span>
                  </div>
                )}
                {currentSetReport.fairReps > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      <span className="text-sm">Discrete</span>
                    </div>
                    <span className="font-bold text-yellow-600">{currentSetReport.fairReps}</span>
                  </div>
                )}
                {currentSetReport.poorReps > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-sm">Da Migliorare</span>
                    </div>
                    <span className="font-bold text-red-600">{currentSetReport.poorReps}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Metriche Extra */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600">ROM Medio</span>
                <span className="font-bold text-blue-600">{currentSetReport.averageROM}%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                <span className="text-sm text-gray-600">Simmetria</span>
                <span className="font-bold text-purple-600">{currentSetReport.averageSymmetry}%</span>
              </div>
            </div>
            
            {/* Issues */}
            {currentSetReport.issues.length > 0 && (
              <div className="mb-6 p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-900">Correzioni</h3>
                </div>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {currentSetReport.issues.slice(0, 3).map((issue, idx) => (
                    <li key={idx}>• Rep {issue.rep}: {issue.issue}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* AI Suggestion */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="flex items-start gap-3">
                <LightBulbIcon className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Suggerimento AI</h3>
                  <p className="text-sm text-gray-700">{currentSetReport.suggestion}</p>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSaveAndContinue}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all"
              >
                Salva e Continua
              </button>
              <button
                onClick={handleRedoSet}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
              >
                Rifai Serie
              </button>
              <button
                onClick={() => {/* TODO: Implement share */}}
                className="p-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
              >
                <ShareIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
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
    <div ref={containerRef} className={`w-full ${isFullscreen ? 'h-screen bg-black' : 'max-w-4xl mx-auto'}`}>
      {!isFullscreen && (
        <>
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
        </>
      )}
      
      {/* Stats Panel - Solo se non fullscreen o se metrics abilitato */}
      {showMetrics && isRunning && !isFullscreen && <StatsPanel />}
      
      {/* Video Container */}
      <div className={`relative bg-black rounded-lg overflow-hidden ${
        isFullscreen ? 'h-full' : 'mb-4'
      }`}>
        {/* Stats overlay in fullscreen */}
        {isFullscreen && showMetrics && <StatsPanel />}
        
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
        
        {/* Fullscreen button */}
        {isRunning && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-30 p-2 bg-black/50 backdrop-blur-sm text-white rounded-lg hover:bg-black/70 transition-all"
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="w-6 h-6" />
            ) : (
              <ArrowsPointingOutIcon className="w-6 h-6" />
            )}
          </button>
        )}
        
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
        
        {/* Video nascosto */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="hidden"
          width={640}
          height={480}
        />
        
        {/* Canvas con tracking */}
        <canvas
          ref={canvasRef}
          className={`${isFullscreen ? 'w-full h-full object-contain' : 'w-full h-auto'}`}
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
        
        {/* Control Buttons in Fullscreen */}
        {isFullscreen && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex gap-3">
            {isRunning && currentSetCount > 0 && (
              <button
                onClick={handleEndSet}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <CheckCircleIcon className="w-5 h-5" />
                Fine Serie
              </button>
            )}
            
            {isRunning && (
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
            )}
            
            <button
              onClick={handleStartStop}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <XCircleIcon className="w-5 h-5" />
              Stop
            </button>
          </div>
        )}
      </div>
      
      {/* Control Buttons (non fullscreen) */}
      {!isFullscreen && (
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
                onClick={toggleFullscreen}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <ArrowsPointingOutIcon className="w-5 h-5" />
                Fullscreen
              </button>
              
              {currentSetCount > 0 && (
                <button
                  onClick={handleEndSet}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Fine Serie
                </button>
              )}
              
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
      )}
      
      {/* Set Report Modal */}
      <SetReportModal />
      
      {/* Session Summary (solo non fullscreen) */}
      {!isFullscreen && !isRunning && totalRepsSession.current > 0 && (
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
          </div>
        </div>
      )}
    </div>
  )
}