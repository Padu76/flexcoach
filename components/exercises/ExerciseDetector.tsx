'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { usePoseTracking, useCamera, useExerciseAnalysis } from '@/hooks'
import { Button, LoadingSpinner } from '@/components/ui'
import type { ExerciseType, ExerciseDetectorProps } from '@/types'
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  CameraIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export const ExerciseDetector: React.FC<ExerciseDetectorProps> = ({
  exerciseType,
  onSessionComplete,
  onFeedback,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null)
  
  // Debug states
  const [detectionStats, setDetectionStats] = useState({
    totalDetections: 0,
    lastDetectionTime: null as Date | null,
    landmarkCount: 0,
    isDetecting: false
  })
  
  const [visualFeedback, setVisualFeedback] = useState({
    message: 'Inizializzazione...',
    color: 'text-gray-500',
    icon: 'loading'
  })

  // Hooks
  const { isStreamActive, error: cameraError, startCamera, stopCamera } = useCamera({
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
      console.log(`💪 Rep completed: ${repCount}`)
      setVisualFeedback({
        message: `Ripetizione ${repCount} completata!`,
        color: 'text-green-500',
        icon: 'success'
      })
    },
    onFeedback: (feedback) => {
      onFeedback?.(feedback)
    },
    sensitivity: 'medium'
  })

  // Fix per connessione video manuale
  const connectVideoManually = useCallback(async () => {
    try {
      console.log('🔧 Manual video connection...')
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        console.log('✅ Manual video connection successful!')
        
        setVisualFeedback({
          message: 'Camera connessa!',
          color: 'text-blue-500',
          icon: 'camera'
        })
      }
    } catch (error) {
      console.error('❌ Manual connection failed:', error)
      setVisualFeedback({
        message: 'Errore connessione camera',
        color: 'text-red-500',
        icon: 'error'
      })
    }
  }, [])

  // Controlla permessi camera
  useEffect(() => {
    const checkCameraPermissions = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setHasPermissions(false)
          return
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop())
        setHasPermissions(true)
        
        setVisualFeedback({
          message: 'Permessi camera OK',
          color: 'text-green-500',
          icon: 'success'
        })
      } catch (error) {
        setHasPermissions(false)
        setVisualFeedback({
          message: 'Permessi camera negati',
          color: 'text-red-500',
          icon: 'error'
        })
      }
    }

    checkCameraPermissions()
  }, [])

  // Monitor stato MediaPipe
  useEffect(() => {
    if (isInitialized) {
      setVisualFeedback({
        message: 'MediaPipe pronto!',
        color: 'text-green-500',
        icon: 'success'
      })
    }
  }, [isInitialized])

  // Avvia detection loop quando tutto è pronto
  useEffect(() => {
    if (!isInitialized || !isSessionActive) return

    const handlePoseResults = (results: any) => {
      const now = new Date()
      
      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0]
        const landmarkCount = landmarks?.length || 0
        
        // Aggiorna stats detection
        setDetectionStats(prev => ({
          totalDetections: prev.totalDetections + 1,
          lastDetectionTime: now,
          landmarkCount,
          isDetecting: true
        }))
        
        // Feedback visivo positivo
        setVisualFeedback({
          message: `🎯 Rilevando movimento! (${landmarkCount} punti)`,
          color: 'text-green-500',
          icon: 'detecting'
        })
        
        // Analizza pose
        const analysis = analyzePose(landmarks)
        
        // Disegna overlay
        drawPoseOverlay(landmarks, analysis)
        
        console.log('🎯 Detection successful:', {
          landmarkCount,
          formScore: analysis?.formScore,
          repCount: analysis?.repCount
        })
      } else {
        // Nessuna pose rilevata
        setDetectionStats(prev => ({
          ...prev,
          isDetecting: false
        }))
        
        setVisualFeedback({
          message: '👤 Posizionati davanti alla camera',
          color: 'text-yellow-500',
          icon: 'waiting'
        })
      }
    }

    // Avvia detection con video pronto
    if (videoRef.current && videoRef.current.readyState >= 2) {
      console.log('🚀 Starting pose detection loop...')
      detectPose(handlePoseResults)
    }
  }, [isInitialized, isSessionActive, detectPose, analyzePose])

  // Monitor readyState del video
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedData = () => {
      console.log('📹 Video loaded - starting detection...')
      setVisualFeedback({
        message: 'Video pronto per detection',
        color: 'text-blue-500',
        icon: 'camera'
      })
    }

    video.addEventListener('loadeddata', handleLoadedData)
    return () => video.removeEventListener('loadeddata', handleLoadedData)
  }, [])

  // Disegna overlay pose con feedback visivo
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

    // Disegna landmarks con colori vivaci
    if (landmarks && landmarks.length > 0) {
      landmarks.forEach((landmark: any, index: number) => {
        const x = landmark.x * canvas.width
        const y = landmark.y * canvas.height

        // Colore basato sulla qualità della forma
        let color = '#10b981' // verde
        if (analysis?.formScore < 60) color = '#ef4444' // rosso
        else if (analysis?.formScore < 80) color = '#f59e0b' // giallo

        // Disegna punto più grande e visibile
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, 2 * Math.PI)
        ctx.fillStyle = color
        ctx.fill()
        
        // Outline bianco
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
      })

      // Connessioni principali
      drawExerciseConnections(ctx, landmarks, canvas.width, canvas.height, analysis)
      
      // Testo informativo
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 16px Arial'
      ctx.fillText(`Landmarks: ${landmarks.length}`, 10, 30)
      
      if (analysis?.formScore) {
        ctx.fillText(`Forma: ${analysis.formScore}%`, 10, 55)
      }
    }
  }

  // Disegna connessioni specifiche per esercizio
  const drawExerciseConnections = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number, analysis: any) => {
    ctx.strokeStyle = analysis?.formScore > 80 ? '#10b981' : analysis?.formScore > 60 ? '#f59e0b' : '#ef4444'
    ctx.lineWidth = 4

    if (exerciseType === 'squat') {
      // Connessioni per squat
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

  // Avvia sessione con fix manuale
  const handleStartSession = async () => {
    try {
      setVisualFeedback({
        message: 'Avvio camera...',
        color: 'text-blue-500',
        icon: 'loading'
      })
      
      // Prova prima il metodo normale
      await startCamera()
      
      // Se il metodo normale non connette il video, usa il fix manuale
      setTimeout(async () => {
        if (videoRef.current && !videoRef.current.srcObject) {
          console.log('🔧 Camera hook failed, using manual connection...')
          await connectVideoManually()
        }
      }, 1000)
      
      resetAnalysis()
      setIsSessionActive(true)
      setSessionStartTime(new Date())
      
    } catch (error) {
      console.error('Errore avvio sessione:', error)
      setVisualFeedback({
        message: 'Errore avvio sessione',
        color: 'text-red-500',
        icon: 'error'
      })
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
    setVisualFeedback({
      message: 'Sessione terminata',
      color: 'text-gray-500',
      icon: 'stopped'
    })
  }

  // Pausa/riprendi sessione
  const handleToggleSession = () => {
    setIsSessionActive(!isSessionActive)
    setVisualFeedback({
      message: isSessionActive ? 'Sessione in pausa' : 'Sessione ripresa',
      color: isSessionActive ? 'text-yellow-500' : 'text-green-500',
      icon: isSessionActive ? 'paused' : 'detecting'
    })
  }

  // Render icona feedback
  const renderFeedbackIcon = () => {
    switch (visualFeedback.icon) {
      case 'success': return <CheckCircleIcon className="w-5 h-5" />
      case 'camera': return <CameraIcon className="w-5 h-5" />
      case 'detecting': return <EyeIcon className="w-5 h-5" />
      case 'error': return <ExclamationTriangleIcon className="w-5 h-5" />
      default: return <LoadingSpinner size="sm" />
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
      {/* Feedback Status Bar */}
      <div className="bg-gray-900 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={visualFeedback.color}>
              {renderFeedbackIcon()}
            </div>
            <span className={`font-medium ${visualFeedback.color}`}>
              {visualFeedback.message}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            Rilevamenti: {detectionStats.totalDetections}
          </div>
        </div>
      </div>

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

        {/* Stats overlay migliorato */}
        {isSessionActive && (
          <div className="absolute top-4 left-4 space-y-2">
            {analysisResult && (
              <>
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
              </>
            )}
            
            {/* Debug info */}
            <div className="bg-black/70 text-green-400 px-3 py-1 rounded-lg text-xs">
              {detectionStats.isDetecting ? '🟢 RILEVANDO' : '🟡 IN ATTESA'}
            </div>
            <div className="bg-black/70 text-blue-400 px-3 py-1 rounded-lg text-xs">
              Landmarks: {detectionStats.landmarkCount}
            </div>
          </div>
        )}

        {/* Feedback overlay migliorato */}
        {analysisResult?.feedback && analysisResult.feedback.length > 0 && isSessionActive && (
          <div className="absolute bottom-4 left-4 right-4">
            <div 
              className="text-white px-4 py-3 rounded-lg text-center font-semibold text-lg shadow-lg animate-pulse"
              style={{
                backgroundColor: analysisResult.feedback[0].severity === 'success' ? '#10b981' : 
                                analysisResult.feedback[0].severity === 'warning' ? '#f59e0b' : '#ef4444'
              }}
            >
              {analysisResult.feedback[0].message}
            </div>
            {analysisResult.feedback[0].correction && (
              <div className="bg-black/70 text-white px-3 py-2 rounded-lg text-sm text-center mt-2">
                💡 {analysisResult.feedback[0].correction}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controlli */}
      <div className="flex justify-center space-x-4">
        {!isSessionActive ? (
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

      {/* Debug Panel */}
      {isSessionActive && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">🔍 Debug Info</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Rilevamenti totali:</span>
              <span className="ml-2 font-mono">{detectionStats.totalDetections}</span>
            </div>
            <div>
              <span className="text-gray-600">Ultimo rilevamento:</span>
              <span className="ml-2 font-mono">
                {detectionStats.lastDetectionTime ? 
                  detectionStats.lastDetectionTime.toLocaleTimeString() : 
                  'Mai'
                }
              </span>
            </div>
            <div>
              <span className="text-gray-600">Landmarks attuali:</span>
              <span className="ml-2 font-mono">{detectionStats.landmarkCount}</span>
            </div>
            <div>
              <span className="text-gray-600">Stato detection:</span>
              <span className={`ml-2 font-mono ${detectionStats.isDetecting ? 'text-green-600' : 'text-yellow-600'}`}>
                {detectionStats.isDetecting ? 'ATTIVO' : 'IN ATTESA'}
              </span>
            </div>
          </div>
        </div>
      )}

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