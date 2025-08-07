'use client'

import React, { useRef, useEffect, useState } from 'react'
import { usePoseTracking, useCamera, useExerciseAnalysis } from '@/hooks'
import { Button, LoadingSpinner } from '@/components/ui'
import type { ExerciseType, ExerciseDetectorProps } from '@/types'
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  CameraIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'

export const ExerciseDetector: React.FC<ExerciseDetectorProps> = ({
  exerciseType,
  onSessionComplete,
  onFeedback,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null)

  // Hooks
  const { videoRef, isStreamActive, error: cameraError, startCamera, stopCamera } = useCamera({
    width: 640,
    height: 480,
    facingMode: 'user'
  })

  const { isInitialized, error: poseError, detectPose } = usePoseTracking({
    modelComplexity: 'lite',
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5
  })

  const { 
    analysisResult, 
    analyzePose, 
    resetAnalysis,
    getExerciseInstructions 
  } = useExerciseAnalysis({
    exerciseType,
    onRepCompleted: (repCount) => {
      console.log(`Rep completed: ${repCount}`)
    },
    onFeedback: (feedback) => {
      onFeedback?.(feedback)
    },
    sensitivity: 'medium'
  })

  // Controlla permessi camera
  useEffect(() => {
    const checkCameraPermissions = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setHasPermissions(false)
          return
        }
        
        // Prova ad accedere alla camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop())
        setHasPermissions(true)
      } catch (error) {
        setHasPermissions(false)
      }
    }

    checkCameraPermissions()
  }, [])

  // Avvia detection loop quando tutto è pronto
  useEffect(() => {
    if (!isInitialized || !isStreamActive || !isSessionActive) return

    const handlePoseResults = (results: any) => {
      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0]
        const analysis = analyzePose(landmarks)
        
        // Disegna overlay se necessario
        drawPoseOverlay(landmarks, analysis)
      }
    }

    detectPose(handlePoseResults)
  }, [isInitialized, isStreamActive, isSessionActive, detectPose, analyzePose])

  // Disegna overlay pose
  const drawPoseOverlay = (landmarks: any[], analysis: any) => {
    if (!canvasRef.current || !videoRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Aggiorna dimensioni canvas
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480

    // Pulisci canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Disegna landmarks
    if (landmarks && landmarks.length > 0) {
      landmarks.forEach((landmark: any, index: number) => {
        const x = landmark.x * canvas.width
        const y = landmark.y * canvas.height

        // Colore basato sulla qualità della forma
        let color = '#10b981' // verde di default
        if (analysis?.formScore < 60) color = '#ef4444' // rosso
        else if (analysis?.formScore < 80) color = '#f59e0b' // giallo

        // Disegna punto
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fillStyle = color
        ctx.fill()
        
        // Outline
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
      })

      // Connessioni principali per l'esercizio
      drawExerciseConnections(ctx, landmarks, canvas.width, canvas.height, analysis)
    }
  }

  // Disegna connessioni specifiche per esercizio
  const drawExerciseConnections = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number, analysis: any) => {
    ctx.strokeStyle = analysis?.formScore > 80 ? '#10b981' : analysis?.formScore > 60 ? '#f59e0b' : '#ef4444'
    ctx.lineWidth = 3

    if (exerciseType === 'squat') {
      // Connessioni per squat: spalle-fianchi-ginocchia-caviglie
      const connections = [
        [11, 23], [12, 24], // spalle-fianchi
        [23, 25], [24, 26], // fianchi-ginocchia  
        [25, 27], [26, 28], // ginocchia-caviglie
        [23, 24], [25, 26]  // connessioni orizzontali
      ]
      
      connections.forEach(([start, end]) => {
        if (landmarks[start] && landmarks[end]) {
          ctx.beginPath()
          ctx.moveTo(landmarks[start].x * width, landmarks[start].y * height)
          ctx.lineTo(landmarks[end].x * width, landmarks[end].y * height)
          ctx.stroke()
        }
      })
    }
  }

  // Avvia sessione
  const handleStartSession = async () => {
    try {
      await startCamera()
      resetAnalysis()
      setIsSessionActive(true)
      setSessionStartTime(new Date())
    } catch (error) {
      console.error('Errore avvio sessione:', error)
    }
  }

  // Ferma sessione
  const handleStopSession = () => {
    setIsSessionActive(false)
    stopCamera()
    
    if (sessionStartTime && analysisResult) {
      const duration = Date.now() - sessionStartTime.getTime()
      const session = {
        id: Date.now().toString(),
        userId: 'temp-user',
        exerciseType,
        startTime: sessionStartTime,
        endTime: new Date(),
        totalReps: analysisResult.repCount,
        averageFormScore: analysisResult.formScore,
        feedback: analysisResult.feedback,
        duration: Math.floor(duration / 1000)
      }
      
      onSessionComplete?.(session)
    }
    
    setSessionStartTime(null)
  }

  // Pausa/riprendi sessione
  const handleToggleSession = () => {
    if (isSessionActive) {
      setIsSessionActive(false)
    } else if (isStreamActive) {
      setIsSessionActive(true)
    }
  }

  // Render errori
  if (hasPermissions === false) {
    return (
      <div className={`card p-8 text-center ${className}`}>
        <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Camera non disponibile
        </h3>
        <p className="text-gray-600 mb-4">
          FlexCoach ha bisogno dell'accesso alla camera per analizzare i tuoi movimenti.
        </p>
        <Button onClick={() => window.location.reload()}>
          Riprova
        </Button>
      </div>
    )
  }

  if (cameraError || poseError) {
    return (
      <div className={`card p-8 text-center ${className}`}>
        <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Errore di inizializzazione
        </h3>
        <p className="text-gray-600 mb-4">
          {cameraError || poseError}
        </p>
        <Button onClick={() => window.location.reload()}>
          Ricarica pagina
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Area video principale */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        {/* Video stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover mirror"
        />
        
        {/* Canvas overlay per pose */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full mirror pointer-events-none"
        />
        
        {/* Loading overlay */}
        {!isInitialized && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <LoadingSpinner size="lg" color="white" />
              <p className="mt-4 text-lg">Caricamento MediaPipe...</p>
            </div>
          </div>
        )}

        {/* Stats overlay */}
        {analysisResult && isSessionActive && (
          <div className="absolute top-4 left-4 space-y-2">
            <div className="bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-mono">
              Reps: {analysisResult.repCount}
            </div>
            <div 
              className="bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-mono"
              style={{
                color: analysisResult.formScore > 80 ? '#10b981' : 
                       analysisResult.formScore > 60 ? '#f59e0b' : '#ef4444'
              }}
            >
              Forma: {analysisResult.formScore}%
            </div>
            <div className="bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
              {analysisResult.currentPhase.toUpperCase()}
            </div>
          </div>
        )}

        {/* Feedback overlay */}
        {analysisResult?.feedback && analysisResult.feedback.length > 0 && isSessionActive && (
          <div className="absolute bottom-4 left-4 right-4">
            <div 
              className="text-white px-4 py-2 rounded-lg text-center font-semibold text-lg shadow-lg"
              style={{
                backgroundColor: analysisResult.feedback[0].severity === 'success' ? '#10b981' : 
                                analysisResult.feedback[0].severity === 'warning' ? '#f59e0b' : '#ef4444'
              }}
            >
              {analysisResult.feedback[0].message}
            </div>
            {analysisResult.feedback[0].correction && (
              <div className="bg-black/70 text-white px-3 py-1 rounded-lg text-sm text-center mt-2">
                {analysisResult.feedback[0].correction}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controlli */}
      <div className="flex justify-center space-x-4">
        {!isStreamActive ? (
          <Button 
            onClick={handleStartSession}
            variant="primary"
            size="lg"
            disabled={!isInitialized}
            className="min-w-32"
          >
            <CameraIcon className="w-5 h-5 mr-2" />
            Inizia
          </Button>
        ) : (
          <>
            <Button 
              onClick={handleToggleSession}
              variant={isSessionActive ? "warning" : "success"}
              size="lg"
              className="min-w-32"
            >
              {isSessionActive ? (
                <>
                  <PauseIcon className="w-5 h-5 mr-2" />
                  Pausa
                </>
              ) : (
                <>
                  <PlayIcon className="w-5 h-5 mr-2" />
                  Riprendi
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleStopSession}
              variant="danger"
              size="lg"
              className="min-w-32"
            >
              <StopIcon className="w-5 h-5 mr-2" />
              Stop
            </Button>
          </>
        )}
      </div>

      {/* Istruzioni esercizio */}
      {!isSessionActive && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Come eseguire {exerciseType === 'squat' ? 'lo Squat' : 
                         exerciseType === 'bench-press' ? 'la Panca Piana' : 
                         'lo Stacco da Terra'}:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            {getExerciseInstructions().map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}