// components/ExerciseDetectorUniversal.tsx - Fix con session invece di currentWorkout

'use client'

import { useRef, useEffect, useState } from 'react'
import { useCamera } from '@/hooks/useCamera'
import { useSoundFeedback } from '@/hooks/useSoundFeedback'
import { usePoseTracking } from '@/hooks/usePoseTracking'
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
  XCircleIcon,
  CameraIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import Webcam from 'react-webcam'
import type { ExerciseType } from '@/types'

interface Props {
  exerciseType: ExerciseType
}

// Tipo per la vista rilevata dal pose tracking
type ViewOrientation = 'frontal' | 'lateral' | 'unknown'

// Tipo per le preferenze salvate
type PreferredView = 'auto' | 'front' | 'side'

export default function ExerciseDetectorUniversal({ exerciseType }: Props) {
  // DataManager Hooks - Fix: usa session invece di currentWorkout
  const { 
    startWorkout, 
    endWorkout, 
    addSet, 
    session,  // Fix: cambiato da currentWorkout a session
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
    achievements,
    checkAndUnlockAchievements
  } = useAchievements()
  
  // Stati locali
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(preferences?.audioEnabled ?? true)
  const [showSkeleton, setShowSkeleton] = useState(preferences?.showSkeleton ?? true)
  const [showMetrics, setShowMetrics] = useState(preferences?.showMetrics ?? true)
  const [viewOrientation, setViewOrientation] = useState<ViewOrientation>('unknown')
  const [confidence, setConfidence] = useState(0)
  const [repsCount, setRepsCount] = useState(0)
  const [currentSetCount, setCurrentSetCount] = useState(0)
  const [sessionVolume, setSessionVolume] = useState(0)
  const [alerts, setAlerts] = useState<string[]>([])
  const [formQuality, setFormQuality] = useState(100)
  const [depthReached, setDepthReached] = useState(0)
  const [currentWeight, setCurrentWeight] = useState(lastWorkout?.avgWeight || 50)
  
  // Refs
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastRepTime = useRef(Date.now())
  const perfectRepsCount = useRef(0)
  const totalRepsSession = useRef(0)
  const sessionStarted = useRef(false)
  
  // Hooks personalizzati
  const { 
    videoRef, 
    isLoading: cameraLoading,
    error: cameraError 
  } = useCamera(webcamRef)
  
  const { 
    playBeep, 
    playSuccess, 
    playWarning,
    playMilestone 
  } = useSoundFeedback(audioEnabled)
  
  const {
    isTracking,
    landmarks,
    angles,
    repState,
    errors: poseErrors,
    startTracking,
    stopTracking
  } = usePoseTracking(videoRef, exerciseType)
  
  // Inizializza workout quando si avvia
  useEffect(() => {
    if (isRunning && !sessionStarted.current) {
      console.log('Starting workout session for:', exerciseType)
      const result = startWorkout(exerciseType)
      if (result.success) {
        sessionStarted.current = true
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
        reps: currentSetCount,
        weight: currentWeight,
        quality,
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
  }, [isPaused, isRunning, currentSetCount, currentWeight, isActive, addSet])
  
  // Rileva orientamento vista e mappa correttamente i tipi
  useEffect(() => {
    if (landmarks && landmarks.length > 0) {
      const nose = landmarks[0]
      const leftShoulder = landmarks[11]
      const rightShoulder = landmarks[12]
      
      if (nose && leftShoulder && rightShoulder) {
        const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x)
        const orientation: ViewOrientation = shoulderWidth > 0.15 ? 'frontal' : 'lateral'
        setViewOrientation(orientation)
        setConfidence(Math.min(nose.visibility || 0, leftShoulder.visibility || 0) * 100)
      }
    }
  }, [landmarks])
  
  // Conteggio reps basato su repState
  useEffect(() => {
    if (repState === 'completed' && Date.now() - lastRepTime.current > 1000) {
      setRepsCount(prev => prev + 1)
      setCurrentSetCount(prev => prev + 1)
      totalRepsSession.current++
      
      const currentVolume = currentWeight * (repsCount + 1)
      setSessionVolume(currentVolume)
      
      playBeep()
      lastRepTime.current = Date.now()
      
      // Check milestones
      if ((repsCount + 1) % 5 === 0) {
        playMilestone()
      }
      
      // Track perfect reps
      if (formQuality > 80) {
        perfectRepsCount.current++
      }
    }
  }, [repState, currentWeight, repsCount, formQuality, playBeep, playMilestone])
  
  // Gestione alerts basati su poseErrors
  useEffect(() => {
    const newAlerts: string[] = []
    
    if (poseErrors.includes('back_curved')) {
      newAlerts.push('⚠️ Mantieni la schiena dritta')
    }
    if (poseErrors.includes('knees_forward')) {
      newAlerts.push('⚠️ Ginocchia troppo avanti')
    }
    if (poseErrors.includes('partial_rep')) {
      newAlerts.push('📏 Scendi di più per una rep completa')
    }
    if (poseErrors.includes('asymmetric')) {
      newAlerts.push('⚖️ Movimento asimmetrico rilevato')
    }
    
    setAlerts(newAlerts)
    
    // Play warning se ci sono errori critici
    if (poseErrors.includes('back_curved') || poseErrors.includes('knees_forward')) {
      playWarning()
    }
  }, [poseErrors, playWarning])
  
  // Calcola qualità forma
  useEffect(() => {
    let quality = 100
    quality -= poseErrors.length * 20
    quality = Math.max(0, Math.min(100, quality))
    setFormQuality(quality)
  }, [poseErrors])
  
  // Aggiorna profondità per squat
  useEffect(() => {
    if (exerciseType === 'squat' && angles.knee) {
      setDepthReached(180 - angles.knee)
    }
  }, [exerciseType, angles.knee])
  
  // Finalizza workout quando il componente si smonta o si ferma
  useEffect(() => {
    return () => {
      if (sessionStarted.current && totalRepsSession.current > 0) {
        console.log('Finalizing workout:', { 
          totalReps: totalRepsSession.current, 
          volume: sessionVolume 
        })
        
        const result = endWorkout(totalRepsSession.current, sessionVolume)
        
        if (result.success) {
          console.log('Workout ended successfully')
          sessionStarted.current = false
          
          // Check achievements
          checkAndUnlockAchievements({
            totalWorkouts: stats.totalWorkouts + 1,
            totalReps: stats.totalReps + totalRepsSession.current,
            bestStreak: Math.max(stats.bestStreak, currentSetCount)
          })
        } else {
          console.error('Failed to end workout:', result.error)
        }
      }
    }
  }, [])
  
  // Funzione helper per mappare i tipi di vista
  const mapViewType = (view: ViewOrientation): PreferredView => {
    switch (view) {
      case 'frontal':
        return 'front'
      case 'lateral':
        return 'side'
      default:
        return 'auto'
    }
  }
  
  // Handler per start/stop
  const handleStartStop = () => {
    if (isRunning) {
      console.log('Stopping workout')
      setIsRunning(false)
      setIsPaused(false)
      stopTracking()
      
      // Salva sessione finale
      if (sessionStarted.current && totalRepsSession.current > 0) {
        console.log('Ending workout with:', { 
          totalReps: totalRepsSession.current, 
          volume: sessionVolume 
        })
        
        const result = endWorkout(totalRepsSession.current, sessionVolume)
        
        if (result.success) {
          console.log('Workout saved successfully')
          playSuccess()
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
    } else {
      console.log('Starting workout')
      setIsRunning(true)
      setIsPaused(false)
      startTracking()
      playSuccess()
    }
  }
  
  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false)
      startTracking()
    } else {
      setIsPaused(true)
      stopTracking()
    }
  }
  
  const handleReset = () => {
    setRepsCount(0)
    setCurrentSetCount(0)
    setSessionVolume(0)
    setAlerts([])
    totalRepsSession.current = 0
    perfectRepsCount.current = 0
    playSuccess()
  }
  
  const toggleAudio = () => {
    const newState = !audioEnabled
    setAudioEnabled(newState)
    
    // Salva preferenze con mappatura corretta dei tipi
    updatePreferences({
      preferredView: mapViewType(viewOrientation),
      audioEnabled: newState,
      showSkeleton,
      showMetrics
    })
  }
  
  const toggleSkeleton = () => {
    const newState = !showSkeleton
    setShowSkeleton(newState)
    
    // Salva preferenze con mappatura corretta dei tipi
    updatePreferences({
      preferredView: mapViewType(viewOrientation),
      audioEnabled,
      showSkeleton: newState,
      showMetrics
    })
  }
  
  const toggleMetrics = () => {
    const newState = !showMetrics
    setShowMetrics(newState)
    
    // Salva preferenze con mappatura corretta dei tipi
    updatePreferences({
      preferredView: mapViewType(viewOrientation),
      audioEnabled,
      showSkeleton,
      showMetrics: newState
    })
  }
  
  // Render del canvas con pose
  useEffect(() => {
    if (canvasRef.current && landmarks && showSkeleton) {
      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return
      
      // Clear canvas
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      
      // Draw skeleton
      ctx.strokeStyle = formQuality > 80 ? '#10b981' : formQuality > 50 ? '#f59e0b' : '#ef4444'
      ctx.lineWidth = 3
      
      // Connessioni scheletro
      const connections = [
        [11, 12], // spalle
        [11, 13], [13, 15], // braccio sx
        [12, 14], [14, 16], // braccio dx
        [11, 23], [12, 24], // torso
        [23, 24], // bacino
        [23, 25], [25, 27], // gamba sx
        [24, 26], [26, 28], // gamba dx
      ]
      
      connections.forEach(([start, end]) => {
        const p1 = landmarks[start]
        const p2 = landmarks[end]
        if (p1 && p2 && p1.visibility > 0.5 && p2.visibility > 0.5) {
          ctx.beginPath()
          ctx.moveTo(p1.x * canvasRef.current!.width, p1.y * canvasRef.current!.height)
          ctx.lineTo(p2.x * canvasRef.current!.width, p2.y * canvasRef.current!.height)
          ctx.stroke()
        }
      })
      
      // Draw joints
      landmarks.forEach((landmark) => {
        if (landmark.visibility > 0.5) {
          ctx.fillStyle = '#3b82f6'
          ctx.beginPath()
          ctx.arc(
            landmark.x * canvasRef.current!.width,
            landmark.y * canvasRef.current!.height,
            5,
            0,
            2 * Math.PI
          )
          ctx.fill()
        }
      })
    }
  }, [landmarks, showSkeleton, formQuality])
  
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
  
  // Stats Panel
  const StatsPanel = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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
      <div className="bg-orange-50 rounded-lg p-3">
        <div className="text-2xl font-bold text-orange-600">{formQuality}%</div>
        <div className="text-xs text-gray-600">Qualità Forma</div>
      </div>
    </div>
  )
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-gray-900">
          {exerciseType === 'squat' ? '🏋️ Squat' : 
           exerciseType === 'bench-press' ? '💪 Panca Piana' : 
           '⚡ Stacco da Terra'} Detector
        </h2>
        
        <div className="flex items-center gap-2">
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
      
      {/* Stats Panel */}
      {showMetrics && isRunning && <StatsPanel />}
      
      {/* Video Container */}
      <div className="relative bg-black rounded-lg overflow-hidden mb-4">
        {/* Status Badges */}
        <div className="absolute top-4 left-4 z-20 space-y-2">
          {isTracking && (
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
              TRACKING ATTIVO
            </div>
          )}
          
          {viewOrientation !== 'unknown' && (
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
              Vista: {viewOrientation === 'frontal' ? 'Frontale' : 'Laterale'}
            </div>
          )}
          
          {confidence > 0 && (
            <div className={`px-3 py-1 rounded-full text-sm text-white ${
              confidence > 80 ? 'bg-green-500' : confidence > 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              Confidenza: {confidence.toFixed(0)}%
            </div>
          )}
        </div>
        
        {/* Metrics Overlay */}
        {showMetrics && isRunning && (
          <div className="absolute top-4 right-4 z-20 bg-black/70 text-white p-3 rounded-lg space-y-1 text-sm">
            {angles.knee && (
              <div>Ginocchio: {angles.knee.toFixed(0)}°</div>
            )}
            {angles.hip && (
              <div>Anca: {angles.hip.toFixed(0)}°</div>
            )}
            {angles.elbow && (
              <div>Gomito: {angles.elbow.toFixed(0)}°</div>
            )}
            {exerciseType === 'squat' && depthReached > 0 && (
              <div className="text-yellow-300">
                Profondità: {depthReached.toFixed(0)}°
              </div>
            )}
          </div>
        )}
        
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 z-20 space-y-2">
            {alerts.map((alert, idx) => (
              <div key={idx} className="bg-red-500/90 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5" />
                <span className="text-sm font-medium">{alert}</span>
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
        
        {/* Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          width={640}
          height={480}
        />
        
        {/* Loading/Error States */}
        {cameraLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <CameraIcon className="w-12 h-12 mx-auto mb-2 animate-pulse" />
              <p>Caricamento camera...</p>
            </div>
          </div>
        )}
        
        {cameraError && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <XCircleIcon className="w-12 h-12 mx-auto mb-2 text-red-500" />
              <p>Errore camera: {cameraError}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Control Buttons */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={handleStartStop}
          disabled={cameraLoading || !!cameraError}
          className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
            isRunning
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
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
      
      {/* Session Summary */}
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
          </div>
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
                    {session.totalReps} reps × {session.avgWeight}kg
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
        </div>
      )}
    </div>
  )
}