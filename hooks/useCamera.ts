import { useRef, useState, useCallback, useEffect } from 'react'
import type { UseCameraOptions, UseCameraReturn } from '@/types'

export const useCamera = (options: UseCameraOptions = {}): UseCameraReturn => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isStreamActive, setIsStreamActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('user')

  // Configurazione default
  const config = {
    width: options.width || 640,
    height: options.height || 480,
    facingMode: options.facingMode || 'user',
    frameRate: options.frameRate || 30
  }

  // Avvia la camera
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      console.log('Starting camera with config:', config)

      // Ferma stream esistente se presente
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      // Controlla supporto getUserMedia
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera non supportata in questo browser')
      }

      // Configurazione constraint per la camera
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: config.width },
          height: { ideal: config.height },
          facingMode: { ideal: currentFacingMode },
          frameRate: { ideal: config.frameRate, max: config.frameRate }
        },
        audio: false
      }

      // Ottieni stream dalla camera
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Collega stream al video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Promise per aspettare che il video sia pronto
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not found'))
            return
          }

          const video = videoRef.current

          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata)
            video.removeEventListener('error', onError)
            resolve()
          }

          const onError = (e: Event) => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata)
            video.removeEventListener('error', onError)
            reject(new Error('Errore nel caricamento video'))
          }

          video.addEventListener('loadedmetadata', onLoadedMetadata)
          video.addEventListener('error', onError)

          // Avvia riproduzione
          video.play().catch(reject)
        })

        setIsStreamActive(true)
        console.log('Camera started successfully')

        // Log delle capabilities del video (solo in development)
        if (process.env.NODE_ENV === 'development') {
          const track = stream.getVideoTracks()[0]
          if (track) {
            const settings = track.getSettings()
            console.log('Camera settings:', settings)
          }
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto camera'
      console.error('Camera start error:', err)
      setError(errorMessage)
      setIsStreamActive(false)
    }
  }, [config.width, config.height, config.frameRate, currentFacingMode])

  // Ferma la camera
  const stopCamera = useCallback(() => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop()
          console.log('Stopped camera track:', track.kind)
        })
        streamRef.current = null
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      setIsStreamActive(false)
      setError(null)
      console.log('Camera stopped successfully')

    } catch (err) {
      console.error('Error stopping camera:', err)
    }
  }, [])

  // Cambia camera (front/back su mobile)
  const switchCamera = useCallback(async () => {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user'
    setCurrentFacingMode(newFacingMode)
    
    if (isStreamActive) {
      stopCamera()
      // Piccolo delay per evitare conflitti
      setTimeout(() => {
        startCamera()
      }, 100)
    }
  }, [currentFacingMode, isStreamActive, stopCamera, startCamera])

  // Cattura foto dal video stream
  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || !isStreamActive) {
      console.warn('Cannot capture photo: video not ready')
      return null
    }

    try {
      const video = videoRef.current
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Cannot get canvas context')
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Disegna frame corrente su canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Restituisci come data URL
      return canvas.toDataURL('image/jpeg', 0.8)

    } catch (err) {
      console.error('Error capturing photo:', err)
      return null
    }
  }, [isStreamActive])

  // Cleanup automatico al dismount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // Gestione visibilità pagina (pausa/riprendi stream)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isStreamActive) {
        // Pausa stream quando tab non è visibile per risparmiare risorse
        if (videoRef.current) {
          videoRef.current.pause()
        }
      } else if (!document.hidden && isStreamActive) {
        // Riprendi stream quando tab torna visibile
        if (videoRef.current) {
          videoRef.current.play().catch(console.error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isStreamActive])

  // Debug info (solo in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Camera Hook State:', {
        isStreamActive,
        error,
        currentFacingMode,
        config
      })
    }
  }, [isStreamActive, error, currentFacingMode, config])

  return {
    videoRef,
    isStreamActive,
    error,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto
  }
}