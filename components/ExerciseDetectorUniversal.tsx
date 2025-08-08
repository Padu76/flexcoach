// components/ExerciseDetectorUniversal.tsx - VERSIONE SEMPLIFICATA E FUNZIONANTE

'use client'

import { useRef, useEffect, useState } from 'react'
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
  CameraIcon
} from '@heroicons/react/24/outline'
import Webcam from 'react-webcam'
import type { ExerciseType } from '@/types'

interface Props {
  exerciseType: ExerciseType
}

export default function ExerciseDetectorUniversal({ exerciseType }: Props) {
  // DataManager Hooks - SOLO quelli che sappiamo funzionare
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
  
  // Stati locali SEMPLIFICATI
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
  
  // Refs
  const webcamRef = useRef<Webcam>(null)
  const sessionStarted = useRef(false)
  const totalRepsSession = useRef(0)
  const perfectRepsCount = useRef(0)
  
  // Sound feedback hook - SOLO quello che esiste davvero
  const { 
    playBeep,
    sounds
  } = useSoundFeedback()
  
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
        reps: Array(currentSetCount).fill({ quality: formQuality }),
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
        } else {
          console.error('Failed to end workout:', result.error)
        }
      }
    }
  }, [])
  
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
          volume: sessionVolume 
        })
        
        const result = endWorkout(totalRepsSession.current, sessionVolume)
        
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
    
    // Simula rep perfetta
    if (Math.random() > 0.3) {
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
        </div>
        
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