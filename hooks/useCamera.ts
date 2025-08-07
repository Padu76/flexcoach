// hooks/useCamera.ts - Hook fixed per gestire la webcam

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

      // Se c'è già uno stream attivo, non fare nulla
      if (streamRef.current && isStreamActive) {
        console.log('⚠️ Camera già attiva')
        return
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
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element non trovato'))
            return
          }
          
          const video = videoRef.current
          
          // Timeout per evitare attese infinite
          const timeout = setTimeout(() => {
            reject(new Error('Timeout caricamento video'))
          }, 5000)
          
          video.onloadedmetadata = () => {
            clearTimeout(timeout)
            video.play()
              .then(() => {
                console.log('✅ Camera avviata con successo!')
                setIsStreamActive(true)
                resolve()
              })
              .catch(reject)
          }
          
          video.onerror = () => {
            clearTimeout(timeout)
            reject(new Error('Errore caricamento video'))
          }
        })
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Errore camera'
      console.error('❌ Errore camera:', errorMsg)
      setError(errorMsg)
      setIsStreamActive(false)
      
      // Pulisci in caso di errore
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [config.width, config.height, config.facingMode, isStreamActive])

  const stopCamera = useCallback(() => {
    console.log('🛑 Fermando camera...')
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log(`🛑 Track ${track.kind} fermato`)
      })
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.load() // Reset video element
    }

    setIsStreamActive(false)
    setError(null)
  }, [])

  // NON fare cleanup automatico al dismount per evitare conflitti
  // Il componente padre gestirà quando fermare la camera
  
  return {
    videoRef,
    isStreamActive,
    error,
    startCamera,
    stopCamera
  }
}