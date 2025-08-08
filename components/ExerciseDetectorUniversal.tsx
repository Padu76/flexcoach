// components/ExerciseDetectorUniversal.tsx - CON SISTEMA ALERT INFORTUNI REAL-TIME

'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useSoundFeedback } from '@/hooks/useSoundFeedback'
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
import Webcam from 'react-webcam'
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

interface PostureIssue {
  type: string
  severity: number // 0-100
  bodyPart: string
  message: string
  recommendation: string
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
  
  // NUOVI STATI PER ALERT INFORTUNI
  const [injuryAlertsEnabled, setInjuryAlertsEnabled] = useState(true)
  const [currentAlert, setCurrentAlert] = useState<InjuryAlert | null>(null)
  const [alertHistory, setAlertHistory] = useState<InjuryAlert[]>([])
  const [postureScore, setPostureScore] = useState(100) // 0-100, 100 = perfetto
  const [currentPostureIssues, setCurrentPostureIssues] = useState<PostureIssue[]>([])
  const [consecutiveDangerFrames, setConsecutiveDangerFrames] = useState(0)
  const [wasAutoPaused, setWasAutoPaused] = useState(false)
  
  // Refs
  const webcamRef = useRef<Webcam>(null)
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
  
  // FUNZIONI PER RILEVAMENTO POSTURA E ALERT
  const analyzePosture = useCallback(() => {
    if (!isRunning || isPaused || !injuryAlertsEnabled) return
    
    // SIMULAZIONE analisi postura - In produzione qui ci sarebbe il vero ML
    const issues: PostureIssue[] = []
    let totalSeverity = 0
    
    // Simula rilevamento problemi basato su probabilità
    const random = Math.random()
    
    // Simula problemi comuni per ogni esercizio
    if (exerciseType === 'squat') {
      // Ginocchia che cedono verso l'interno
      if (random < 0.15) {
        issues.push({
          type: 'knee_valgus',
          severity: 60 + Math.random() * 40,
          bodyPart: 'ginocchia',
          message: 'Ginocchia che cedono verso l\'interno',
          recommendation: 'Spingi le ginocchia verso l\'esterno'
        })
      }
      // Schiena curva
      if (random < 0.1) {
        issues.push({
          type: 'back_rounding',
          severity: 70 + Math.random() * 30,
          bodyPart: 'schiena',
          message: 'Schiena troppo curva',
          recommendation: 'Mantieni il petto in fuori e la schiena dritta'
        })
      }
      // Profondità insufficiente
      if (random < 0.2) {
        issues.push({
          type: 'depth',
          severity: 30 + Math.random() * 30,
          bodyPart: 'anche',
          message: 'Profondità insufficiente',
          recommendation: 'Scendi fino a che le anche sono sotto le ginocchia'
        })
      }
    } else if (exerciseType === 'bench-press') {
      // Gomiti troppo aperti
      if (random < 0.15) {
        issues.push({
          type: 'elbow_flare',
          severity: 50 + Math.random() * 30,
          bodyPart: 'gomiti',
          message: 'Gomiti troppo aperti',
          recommendation: 'Mantieni i gomiti a 45° dal corpo'
        })
      }
      // Arco eccessivo della schiena
      if (random < 0.1) {
        issues.push({
          type: 'excessive_arch',
          severity: 60 + Math.random() * 40,
          bodyPart: 'schiena',
          message: 'Arco lombare eccessivo',
          recommendation: 'Riduci l\'arco della schiena'
        })
      }
      // Polsi piegati
      if (random < 0.12) {
        issues.push({
          type: 'wrist_bend',
          severity: 40 + Math.random() * 40,
          bodyPart: 'polsi',
          message: 'Polsi troppo piegati',
          recommendation: 'Mantieni i polsi dritti e allineati'
        })
      }
    } else if (exerciseType === 'deadlift') {
      // Schiena arrotondata
      if (random < 0.15) {
        issues.push({
          type: 'back_rounding',
          severity: 80 + Math.random() * 20,
          bodyPart: 'schiena',
          message: 'Schiena arrotondata pericolosamente',
          recommendation: 'FERMATI! Mantieni la schiena neutra'
        })
      }
      // Bilanciere troppo lontano
      if (random < 0.2) {
        issues.push({
          type: 'bar_path',
          severity: 40 + Math.random() * 30,
          bodyPart: 'schiena',
          message: 'Bilanciere troppo lontano dal corpo',
          recommendation: 'Tieni il bilanciere vicino al corpo'
        })
      }
      // Iperestensione
      if (random < 0.1) {
        issues.push({
          type: 'hyperextension',
          severity: 70 + Math.random() * 30,
          bodyPart: 'schiena',
          message: 'Iperestensione in alto',
          recommendation: 'Non inarcare troppo la schiena in cima'
        })
      }
    }
    
    // Calcola severity totale
    if (issues.length > 0) {
      totalSeverity = Math.max(...issues.map(i => i.severity))
    }
    
    // Aggiorna posture score
    const newPostureScore = Math.max(0, 100 - totalSeverity)
    setPostureScore(newPostureScore)
    setCurrentPostureIssues(issues)
    
    // Determina livello di alert
    let alertLevel: AlertLevel = 'safe'
    let alertMessage = ''
    let shouldAutoPause = false
    
    if (totalSeverity >= 80) {
      alertLevel = 'danger'
      alertMessage = `PERICOLO: ${issues[0].message}`
      setConsecutiveDangerFrames(prev => prev + 1)
      
      // Auto-pausa dopo 3 frame consecutivi di pericolo
      if (consecutiveDangerFrames >= 3) {
        shouldAutoPause = true
      }
      
      // Suono di pericolo
      if (audioEnabled && !dangerSoundPlayedRef.current) {
        // Simula suono di alert
        playBeep()
        playBeep()
        playBeep()
        dangerSoundPlayedRef.current = true
      }
    } else if (totalSeverity >= 50) {
      alertLevel = 'warning'
      alertMessage = `Attenzione: ${issues[0].message}`
      setConsecutiveDangerFrames(0)
      dangerSoundPlayedRef.current = false
      
      // Suono di warning
      if (audioEnabled && Math.random() < 0.3) {
        playBeep()
      }
    } else {
      setConsecutiveDangerFrames(0)
      dangerSoundPlayedRef.current = false
    }
    
    // Crea alert se necessario
    if (alertLevel !== 'safe' && issues.length > 0) {
      const alert: InjuryAlert = {
        level: alertLevel,
        message: alertMessage,
        bodyPart: issues[0].bodyPart,
        timestamp: Date.now(),
        autopaused: shouldAutoPause
      }
      
      setCurrentAlert(alert)
      setAlertHistory(prev => [...prev, alert])
      
      // Auto-rimuovi alert dopo 3 secondi se non è danger
      if (alertLevel === 'warning') {
        if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current)
        alertTimeoutRef.current = setTimeout(() => {
          setCurrentAlert(null)
        }, 3000)
      }
      
      // Auto-pausa se necessario
      if (shouldAutoPause && !wasAutoPaused) {
        setIsPaused(true)
        setWasAutoPaused(true)
        console.log('AUTO-PAUSA ATTIVATA PER SICUREZZA!')
      }
    } else {
      // Rimuovi alert se tutto ok
      if (currentAlert && alertLevel === 'safe') {
        setCurrentAlert(null)
      }
      setWasAutoPaused(false)
    }
    
    // Aggiorna qualità forma basata su posture score
    setFormQuality(newPostureScore)
  }, [isRunning, isPaused, injuryAlertsEnabled, exerciseType, audioEnabled, consecutiveDangerFrames, currentAlert, wasAutoPaused, playBeep])
  
  // Analizza postura ogni 500ms quando attivo
  useEffect(() => {
    if (!isRunning || isPaused) return
    
    const interval = setInterval(analyzePosture, 500)
    return () => clearInterval(interval)
  }, [isRunning, isPaused, analyzePosture])
  
  // Reset danger frames quando si mette in pausa
  useEffect(() => {
    if (isPaused) {
      setConsecutiveDangerFrames(0)
      dangerSoundPlayedRef.current = false
    }
  }, [isPaused])
  
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
  const handleStartStop = () => {
    if (isRunning) {
      console.log('Stopping workout')
      setIsRunning(false)
      setIsPaused(false)
      
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
      setCurrentPostureIssues([])
      setConsecutiveDangerFrames(0)
      setWasAutoPaused(false)
    } else {
      console.log('Starting workout')
      setIsRunning(true)
      setIsPaused(false)
      if (audioEnabled && sounds?.start) sounds.start()
    }
  }
  
  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false)
      setWasAutoPaused(false) // Reset auto-pause flag quando riprende manualmente
    } else {
      setIsPaused(true)
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
    if (audioEnabled && sounds?.start) sounds.start()
  }
  
  // SIMULAZIONE conteggio reps per test
  const handleAddRep = () => {
    if (!isRunning || isPaused) return
    
    setRepsCount(prev => prev + 1)
    setCurrentSetCount(prev => prev + 1)
    totalRepsSession.current++
    
    const currentVolume = currentWeight * (repsCount + 1)
    setSessionVolume(currentVolume)
    
    if (audioEnabled) {
      playBeep()
    }
    
    // Check milestones
    if ((repsCount + 1) % 5 === 0 && audioEnabled) {
      if (sounds?.cinqueReps) sounds.cinqueReps()
    }
    if ((repsCount + 1) % 10 === 0 && audioEnabled) {
      if (sounds?.dieciReps) sounds.dieciReps()
    }
    
    // Simula rep perfetta basata su posture score
    if (postureScore > 70) {
      perfectRepsCount.current++
    }
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
  
  // Stats Panel con Posture Score
  const StatsPanel = () => (
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
      
      {/* Video Container */}
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
        </div>
        
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
        
        {/* Camera/Video */}
        <Webcam
          ref={webcamRef}
          className="w-full h-auto"
          mirrored
          screenshotFormat="image/jpeg"
        />
        
        {/* Placeholder for pose detection */}
        {!isRunning && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <CameraIcon className="w-12 h-12 mx-auto mb-2" />
              <p>Premi "Inizia Allenamento" per attivare</p>
            </div>
          </div>
        )}
      </div>
      
      {/* BOTTONE TEST PER AGGIUNGERE REP */}
      {isRunning && !isPaused && (
        <div className="mb-4 text-center">
          <button
            onClick={handleAddRep}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium"
          >
            + Aggiungi Rep (TEST)
          </button>
          <p className="text-xs text-gray-500 mt-1">
            Usa questo bottone per simulare le rep mentre il tracking è in sviluppo
          </p>
        </div>
      )}
      
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
              <span className="ml-2 font-bold">{perfectRepsCount.current}</span>
            </div>
            <div>
              <span className="text-gray-600">Qualità Media:</span>
              <span className="ml-2 font-bold">
                {totalRepsSession.current > 0 
                  ? Math.round((perfectRepsCount.current / totalRepsSession.current) * 100)
                  : 0}%
              </span>
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
                {[...new Set(alertHistory.map(a => a.bodyPart))].map(bodyPart => {
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
        </div>
      )}
    </div>
  )
}