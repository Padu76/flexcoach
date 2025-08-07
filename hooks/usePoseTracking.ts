import { useRef, useEffect, useState, useCallback } from 'react'
import type { UsePoseTrackingOptions, UsePoseTrackingReturn, Poselandmark } from '@/types'

// MediaPipe risultati interface
interface PoseLandmarkerResult {
  landmarks: Poselandmark[][]
  worldLandmarks?: Poselandmark[][]
  segmentationMasks?: any
}

// Declare MediaPipe types
declare global {
  interface Window {
    PoseLandmarker: any
    FilesetResolver: any
  }
}

export const usePoseTracking = (options: UsePoseTrackingOptions = {}): UsePoseTrackingReturn => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const poseLandmarkerRef = useRef<any>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isDetectingRef = useRef(false)
  const retryCountRef = useRef(0)
  const maxRetries = 10

  // Configurazione con defaults
  const config = {
    modelComplexity: options.modelComplexity || 'lite',
    minDetectionConfidence: options.minDetectionConfidence || 0.7,
    minTrackingConfidence: options.minTrackingConfidence || 0.5,
    maxNumPoses: options.maxNumPoses || 1
  }

  // Model paths basati sulla complessità
  const getModelPath = () => {
    switch (config.modelComplexity) {
      case 'heavy':
        return 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task'
      case 'full':
        return 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task'
      default:
        return 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
    }
  }

  // Inizializza MediaPipe PoseLandmarker
  useEffect(() => {
    let isMounted = true

    const initializeMediaPipe = async () => {
      try {
        console.log('🚀 Initializing MediaPipe PoseLandmarker...')
        setError(null)

        // Carica script MediaPipe se non già caricati
        if (typeof window.PoseLandmarker === 'undefined') {
          console.log('📦 Loading MediaPipe scripts...')
          
          // Carica pose_landmarker script
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@latest/pose.js'
            script.crossOrigin = 'anonymous'
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Failed to load MediaPipe pose script'))
            document.head.appendChild(script)
          })

          // Carica tasks-vision script
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest'
            script.crossOrigin = 'anonymous'
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Failed to load MediaPipe tasks-vision'))
            document.head.appendChild(script)
          })
        }

        // Aspetta che gli script siano completamente caricati
        let attempts = 0
        while (typeof window.PoseLandmarker === 'undefined' && attempts < 20) {
          console.log(`⏳ Waiting for MediaPipe to load... (attempt ${attempts + 1})`)
          await new Promise(resolve => setTimeout(resolve, 500))
          attempts++
        }

        if (typeof window.PoseLandmarker === 'undefined') {
          throw new Error('MediaPipe PoseLandmarker not available after loading scripts')
        }

        console.log('📦 Loading FilesetResolver...')
        const vision = await window.FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )

        console.log('🎯 Creating PoseLandmarker with model:', getModelPath())
        const poseLandmarker = await window.PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: getModelPath(),
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: config.maxNumPoses,
          minPoseDetectionConfidence: config.minDetectionConfidence,
          minPosePresenceConfidence: config.minDetectionConfidence,
          minTrackingConfidence: config.minTrackingConfidence,
          outputSegmentationMasks: false
        })

        if (isMounted) {
          poseLandmarkerRef.current = poseLandmarker
          setIsInitialized(true)
          console.log('✅ MediaPipe PoseLandmarker initialized successfully')
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Errore inizializzazione MediaPipe'
        console.error('❌ MediaPipe initialization error:', err)
        if (isMounted) {
          setError(errorMessage)
          setIsInitialized(false)
        }
      }
    }

    initializeMediaPipe()

    return () => {
      isMounted = false
      if (poseLandmarkerRef.current) {
        try {
          poseLandmarkerRef.current.close()
        } catch (e) {
          console.error('Error closing PoseLandmarker:', e)
        }
      }
    }
  }, [config.modelComplexity, config.minDetectionConfidence, config.minTrackingConfidence, config.maxNumPoses])

  // Funzione per verificare se il video è pronto
  const isVideoReady = useCallback(() => {
    const video = videoRef.current
    if (!video) return false
    
    // Check completo dello stato del video
    const ready = video.readyState === 4 && 
                  video.videoWidth > 0 && 
                  video.videoHeight > 0 &&
                  !video.paused &&
                  !video.ended &&
                  video.currentTime > 0

    if (!ready) {
      console.log('📹 Video not ready:', {
        readyState: video.readyState,
        width: video.videoWidth,
        height: video.videoHeight,
        paused: video.paused,
        currentTime: video.currentTime
      })
    }

    return ready
  }, [])

  // Funzione di detection con retry logic
  const detectPose = useCallback((onResults: (results: PoseLandmarkerResult) => void) => {
    if (isDetectingRef.current) {
      console.log('⚠️ Detection already in progress, skipping...')
      return
    }

    if (!poseLandmarkerRef.current) {
      console.warn('❌ PoseLandmarker not initialized')
      return
    }

    if (!videoRef.current) {
      console.warn('❌ Video element not found')
      return
    }

    const video = videoRef.current

    // Funzione di detection con retry
    const attemptDetection = () => {
      // Verifica se il video è pronto
      if (!isVideoReady()) {
        retryCountRef.current++
        
        if (retryCountRef.current < maxRetries) {
          console.log(`🔄 Video not ready, retry ${retryCountRef.current}/${maxRetries}...`)
          setTimeout(attemptDetection, 500) // Riprova dopo 500ms
        } else {
          console.error('❌ Max retries reached, video still not ready')
          retryCountRef.current = 0
        }
        return
      }

      // Reset retry counter se il video è pronto
      retryCountRef.current = 0
      isDetectingRef.current = true

      console.log('🎯 Starting pose detection loop...')
      let lastVideoTime = -1

      const detect = async () => {
        if (!isDetectingRef.current || !poseLandmarkerRef.current || !videoRef.current) {
          console.log('🛑 Stopping detection loop')
          return
        }

        const video = videoRef.current
        const currentTime = video.currentTime

        // Solo processa se c'è un nuovo frame
        if (currentTime !== lastVideoTime && isVideoReady()) {
          lastVideoTime = currentTime

          try {
            // Usa detectForVideo con timestamp corretto
            const startTimeMs = performance.now()
            const results = await poseLandmarkerRef.current.detectForVideo(video, startTimeMs)
            
            // Converti risultati nel formato atteso
            if (results && results.landmarks && results.landmarks.length > 0) {
              console.log(`✅ Detected ${results.landmarks[0].length} landmarks`)
              onResults({
                landmarks: results.landmarks,
                worldLandmarks: results.worldLandmarks,
                segmentationMasks: results.segmentationMasks
              })
            } else {
              // Nessun landmark rilevato ma non è un errore
              onResults({ landmarks: [] })
            }
          } catch (err) {
            console.error('❌ Detection error:', err)
            // Non fermare il loop per errori temporanei
          }
        }

        // Continua il loop con requestAnimationFrame
        if (isDetectingRef.current) {
          animationFrameRef.current = requestAnimationFrame(detect)
        }
      }

      // Avvia il detection loop
      detect()
    }

    // Inizia il tentativo di detection
    attemptDetection()
  }, [isVideoReady])

  // Cleanup function per fermare la detection
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up pose tracking...')
    
    isDetectingRef.current = false
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (poseLandmarkerRef.current) {
      try {
        poseLandmarkerRef.current.close()
        poseLandmarkerRef.current = null
      } catch (e) {
        console.error('Error during cleanup:', e)
      }
    }
  }, [])

  // Cleanup al dismount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    isInitialized,
    error,
    videoRef,
    detectPose,
    cleanup
  }
}