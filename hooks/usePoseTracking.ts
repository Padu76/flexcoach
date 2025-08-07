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
  const detectionActiveRef = useRef(false)

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
          console.log('🔄 Server-side rendering, skipping MediaPipe initialization')
          return
        }

        console.log('🚀 Initializing MediaPipe PoseLandmarker...')
        
        // Import dinamico di MediaPipe
        const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')

        // Risoluzione del fileset per vision tasks
        console.log('📦 Loading FilesetResolver...')
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        )
        console.log('✅ FilesetResolver loaded successfully')

        // Path del modello basato sulla complessità
        const modelPath = `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_${config.modelComplexity}/float16/1/pose_landmarker_${config.modelComplexity}.task`

        console.log(`📥 Loading model: ${modelPath}`)

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

        console.log('✅ PoseLandmarker created successfully')
        setPoseLandmarker(landmarker)
        setIsInitialized(true)
        console.log('🎯 MediaPipe PoseLandmarker fully initialized and ready!')
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error during MediaPipe initialization'
        console.error('❌ MediaPipe initialization error:', err)
        setError(errorMessage)
      }
    }

    initializePoseLandmarker()

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up usePoseTracking...')
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (poseLandmarker) {
        try {
          poseLandmarker.close()
          console.log('✅ PoseLandmarker closed successfully')
        } catch (err) {
          console.warn('⚠️ Error closing poseLandmarker:', err)
        }
      }
    }
  }, [config.modelComplexity, config.minDetectionConfidence, config.minTrackingConfidence, config.maxNumPoses])

  // Funzione di rilevamento pose con DEBUG DETTAGLIATO
  const detectPose = useCallback((
    onResults: (results: PoseLandmarkerResult) => void
  ) => {
    console.log('🔍 detectPose called with state:', {
      poseLandmarker: !!poseLandmarker,
      videoRef: !!videoRef.current,
      isInitialized,
      detectionActive: detectionActiveRef.current
    })

    if (!poseLandmarker) {
      console.warn('⚠️ PoseLandmarker not available')
      return
    }

    if (!videoRef.current) {
      console.warn('⚠️ Video reference not available')
      return
    }

    if (!isInitialized) {
      console.warn('⚠️ PoseLandmarker not initialized')
      return
    }

    if (detectionActiveRef.current) {
      console.warn('⚠️ Detection already active, skipping')
      return
    }

    const video = videoRef.current
    console.log('📹 Video element state:', {
      readyState: video.readyState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      currentTime: video.currentTime,
      paused: video.paused
    })

    if (video.readyState < 2) {
      console.warn('⚠️ Video not ready yet (readyState < 2)')
      return
    }

    detectionActiveRef.current = true
    console.log('🎬 Starting pose detection loop...')
    
    const performDetection = () => {
      if (!detectionActiveRef.current) {
        console.log('🛑 Detection stopped by flag')
        return
      }

      // Controlla se il video è pronto e ha un nuovo frame
      if (video.currentTime !== lastVideoTimeRef.current && video.videoWidth > 0) {
        lastVideoTimeRef.current = video.currentTime
        
        try {
          const startTimeMs = performance.now()
          const results = poseLandmarker.detectForVideo(video, startTimeMs)
          
          // Log dei risultati (solo primi 5 secondi per non spammare)
          if (startTimeMs < 5000) {
            console.log('🎯 Detection results:', {
              landmarks: results.landmarks?.length || 0,
              poses: results.landmarks?.[0]?.length || 0
            })
          }
          
          // Chiama il callback con i risultati
          onResults(results)
          
        } catch (err) {
          console.error('❌ Error during pose detection:', err)
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
    console.log('🧹 Cleanup called')
    detectionActiveRef.current = false
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
      console.log('✅ Animation frame cancelled')
    }
    
    if (poseLandmarker) {
      try {
        poseLandmarker.close()
        console.log('✅ PoseLandmarker closed in cleanup')
      } catch (err) {
        console.warn('⚠️ Error during cleanup:', err)
      }
    }
    
    setIsInitialized(false)
    setPoseLandmarker(null)
  }, [poseLandmarker])

  // Debug info dettagliato
  useEffect(() => {
    console.log('📊 PoseTracking Hook State Update:', {
      isInitialized,
      error,
      hasLandmarker: !!poseLandmarker,
      hasVideoRef: !!videoRef.current,
      detectionActive: detectionActiveRef.current,
      config
    })
  }, [isInitialized, error, poseLandmarker, config])

  // Monitor video state changes
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedData = () => {
      console.log('📹 Video loaded data:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState
      })
    }

    const handleCanPlay = () => {
      console.log('📹 Video can play')
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('canplay', handleCanPlay)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('canplay', handleCanPlay)
    }
  }, [])

  return {
    isInitialized,
    error,
    videoRef,
    detectPose,
    cleanup
  }
}