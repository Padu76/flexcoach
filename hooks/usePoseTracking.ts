import { useRef, useEffect, useState, useCallback } from 'react'
import type { UsePoseTrackingOptions, UsePoseTrackingReturn, Poselandmark } from '@/types'

// MediaPipe risultati interface
interface PoseLandmarkerResult {
  landmarks: Poselandmark[][]
  worldLandmarks?: Poselandmark[][]
}

export const usePoseTracking = (options: UsePoseTrackingOptions = {}): UsePoseTrackingReturn => {
  const [poseLandmarker, setPoseLandmarker] = useState<any>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const animationFrameRef = useRef<number>()
  const lastVideoTimeRef = useRef(-1)

  // Configurazione default
  const config = {
    modelComplexity: options.modelComplexity || 'lite',
    minDetectionConfidence: options.minDetectionConfidence || 0.5,
    minTrackingConfidence: options.minTrackingConfidence || 0.5,
    maxNumPoses: options.maxNumPoses || 1
  }

  // Inizializzazione MediaPipe
  useEffect(() => {
    const initializePoseLandmarker = async () => {
      try {
        if (typeof window === 'undefined') {
          console.log('Server-side rendering, skipping MediaPipe initialization')
          return
        }

        console.log('Initializing MediaPipe PoseLandmarker...')
        
        // Import dinamico di MediaPipe
        const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')

        // Risoluzione del fileset per vision tasks
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        )

        // Path del modello basato sulla complessità
        const modelPath = `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_${config.modelComplexity}/float16/1/pose_landmarker_${config.modelComplexity}.task`

        console.log(`Loading model: ${modelPath}`)

        // Creazione del PoseLandmarker
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: "GPU" // Usa GPU se disponibile
          },
          runningMode: "VIDEO",
          numPoses: config.maxNumPoses,
          minPoseDetectionConfidence: config.minDetectionConfidence,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: config.minTrackingConfidence
        })

        setPoseLandmarker(landmarker)
        setIsInitialized(true)
        console.log('MediaPipe PoseLandmarker initialized successfully')
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error during MediaPipe initialization'
        console.error('MediaPipe initialization error:', err)
        setError(errorMessage)
      }
    }

    initializePoseLandmarker()

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (poseLandmarker) {
        try {
          poseLandmarker.close()
        } catch (err) {
          console.warn('Error closing poseLandmarker:', err)
        }
      }
    }
  }, [config.modelComplexity, config.minDetectionConfidence, config.minTrackingConfidence, config.maxNumPoses])

  // Funzione di rilevamento pose
  const detectPose = useCallback((
    onResults: (results: PoseLandmarkerResult) => void
  ) => {
    if (!poseLandmarker || !videoRef.current || !isInitialized) {
      console.warn('PoseLandmarker not ready for detection')
      return
    }

    const video = videoRef.current
    
    const performDetection = () => {
      // Controlla se il video è pronto e ha un nuovo frame
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime
        
        try {
          const startTimeMs = performance.now()
          const results = poseLandmarker.detectForVideo(video, startTimeMs)
          
          // Chiama il callback con i risultati
          onResults(results)
          
        } catch (err) {
          console.error('Error during pose detection:', err)
          // Non interrompere il loop per errori singoli
        }
      }
      
      // Continua il loop di detection
      animationFrameRef.current = requestAnimationFrame(performDetection)
    }

    // Avvia il loop di detection
    performDetection()
  }, [poseLandmarker, isInitialized])

  // Funzione di cleanup
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }
    if (poseLandmarker) {
      try {
        poseLandmarker.close()
      } catch (err) {
        console.warn('Error during cleanup:', err)
      }
    }
    setIsInitialized(false)
    setPoseLandmarker(null)
  }, [poseLandmarker])

  // Debug info (solo in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('PoseTracking Hook State:', {
        isInitialized,
        error,
        hasLandmarker: !!poseLandmarker,
        config
      })
    }
  }, [isInitialized, error, poseLandmarker, config])

  return {
    isInitialized,
    error,
    videoRef,
    detectPose,
    cleanup
  }
}