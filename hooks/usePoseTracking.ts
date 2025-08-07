// hooks/usePoseTracking.ts - Hook base per MediaPipe pose detection

import { useRef, useEffect, useState, useCallback } from 'react'

// Tipi base per MediaPipe
export interface Landmark {
  x: number
  y: number
  z: number
  visibility?: number
}

interface UsePoseTrackingReturn {
  isInitialized: boolean
  error: string | null
  detectPose: (video: HTMLVideoElement, onResults: (landmarks: Landmark[]) => void) => void
}

// Dichiarazione globale per MediaPipe
declare global {
  interface Window {
    Pose: any
  }
}

export const usePoseTracking = (): UsePoseTrackingReturn => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const poseRef = useRef<any>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Inizializza MediaPipe
  useEffect(() => {
    let isMounted = true

    const initializeMediaPipe = async () => {
      try {
        console.log('🚀 Inizializzazione MediaPipe...')
        
        // Carica script MediaPipe
        if (!window.Pose) {
          await loadMediaPipeScript()
        }

        // Crea istanza Pose
        const pose = new window.Pose({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
          }
        })

        // Configura opzioni
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        })

        // Callback risultati
        pose.onResults((results: any) => {
          if (results.poseLandmarks) {
            console.log(`✅ Rilevati ${results.poseLandmarks.length} landmarks`)
          }
        })

        if (isMounted) {
          poseRef.current = pose
          setIsInitialized(true)
          console.log('✅ MediaPipe inizializzato!')
        }

      } catch (err) {
        console.error('❌ Errore inizializzazione MediaPipe:', err)
        if (isMounted) {
          setError('Errore caricamento MediaPipe')
        }
      }
    }

    initializeMediaPipe()

    return () => {
      isMounted = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Funzione per caricare script MediaPipe
  const loadMediaPipeScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Carica camera_utils
      const cameraScript = document.createElement('script')
      cameraScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'
      cameraScript.crossOrigin = 'anonymous'
      
      // Carica drawing_utils
      const drawingScript = document.createElement('script')
      drawingScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js'
      drawingScript.crossOrigin = 'anonymous'
      
      // Carica pose
      const poseScript = document.createElement('script')
      poseScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
      poseScript.crossOrigin = 'anonymous'
      
      let scriptsLoaded = 0
      const checkAllLoaded = () => {
        scriptsLoaded++
        if (scriptsLoaded === 3) {
          console.log('📦 Script MediaPipe caricati')
          resolve()
        }
      }

      cameraScript.onload = checkAllLoaded
      drawingScript.onload = checkAllLoaded
      poseScript.onload = checkAllLoaded
      
      cameraScript.onerror = () => reject(new Error('Failed to load camera_utils'))
      drawingScript.onerror = () => reject(new Error('Failed to load drawing_utils'))
      poseScript.onerror = () => reject(new Error('Failed to load pose'))

      document.head.appendChild(cameraScript)
      document.head.appendChild(drawingScript)
      document.head.appendChild(poseScript)
    })
  }

  // Funzione per rilevare pose
  const detectPose = useCallback((video: HTMLVideoElement, onResults: (landmarks: Landmark[]) => void) => {
    if (!poseRef.current || !video) {
      console.warn('⚠️ MediaPipe non pronto')
      return
    }

    const pose = poseRef.current

    // Imposta callback risultati
    pose.onResults((results: any) => {
      if (results.poseLandmarks) {
        onResults(results.poseLandmarks)
      } else {
        onResults([])
      }
    })

    // Detection loop
    const detect = async () => {
      if (video.readyState === 4) {
        await pose.send({ image: video })
      }
      animationFrameRef.current = requestAnimationFrame(detect)
    }

    detect()
    console.log('🎯 Detection loop avviato')
  }, [])

  return {
    isInitialized,
    error,
    detectPose
  }
}