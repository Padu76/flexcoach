// hooks/useCamera.ts - Hook semplice per gestire la webcam

import { useRef, useState, useCallback, useEffect } from 'react'
import type { UseCameraOptions, UseCameraReturn } from '@/types'

export const useCamera = (options: UseCameraOptions = {}): UseCameraReturn => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isStreamActive, setIsStreamActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const config = {
    width: options.width || 640,
    height: options.height || 480,
    facingMode: options.facingMode || 'user'
  }

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      console.log('📹 Avvio camera...')

      // Ferma stream esistente
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      // Controlla supporto
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera non supportata in questo browser')
      }

      // Ottieni stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: config.width },
          height: { ideal: config.height },
          facingMode: config.facingMode
        },
        audio: false
      })

      streamRef.current = stream

      // Collega al video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Aspetta che il video sia pronto
        await new Promise<void>((resolve) => {
          if (!videoRef.current) return resolve()
          
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            resolve()
          }
        })

        setIsStreamActive(true)
        console.log('✅ Camera avviata!')
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Errore camera'
      console.error('❌ Errore camera:', errorMsg)
      setError(errorMsg)
      setIsStreamActive(false)
    }
  }, [config.width, config.height, config.facingMode])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('🛑 Camera fermata')
      })
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsStreamActive(false)
    setError(null)
  }, [])

  // Cleanup al dismount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    videoRef,
    isStreamActive,
    error,
    startCamera,
    stopCamera
  }
}