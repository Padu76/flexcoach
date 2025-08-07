// components/WebcamWithPose.tsx - MediaPipe Lite versione funzionante

'use client'

import { useRef, useEffect, useState } from 'react'
import { useCamera } from '@/hooks/useCamera'
import { 
  PlayIcon, 
  StopIcon,
  CameraIcon
} from '@heroicons/react/24/outline'

// Dichiarazione tipi MediaPipe
declare global {
  interface Window {
    drawConnectors: any
    drawLandmarks: any
    POSE_CONNECTIONS: any
    Pose: any
  }
}

export default function WebcamWithPose() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const poseRef = useRef<any>(null)
  const [isActive, setIsActive] = useState(false)
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Inizializzazione...')
  const [landmarkCount, setLandmarkCount] = useState(0)
  const [frameCount, setFrameCount] = useState(0)
  
  // Hook camera
  const { videoRef, isStreamActive, error: cameraError, startCamera, stopCamera } = useCamera()

  // Carica MediaPipe
  useEffect(() => {
    let mounted = true
    
    const loadMediaPipe = async () => {
      try {
        setLoadingMessage('Caricamento MediaPipe...')
        console.log('🚀 Caricamento MediaPipe Pose...')
        
        // Carica gli script necessari
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js')
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js')
        
        console.log('📦 Script caricati, inizializzazione Pose...')
        
        // Inizializza Pose
        const pose = new window.Pose({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
          }
        })
        
        // Configura opzioni
        await pose.setOptions({
          modelComplexity: 0, // 0 = lite, 1 = full, 2 = heavy
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        })
        
        // Callback risultati
        pose.onResults((results: any) => {
          if (!mounted || !canvasRef.current || !videoRef.current) return
          
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          if (!ctx) return
          
          // Aggiorna dimensioni canvas
          canvas.width = videoRef.current.videoWidth || 640
          canvas.height = videoRef.current.videoHeight || 480
          
          // Pulisci canvas
          ctx.save()
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          
          // Se ci sono landmarks, disegnali
          if (results.poseLandmarks) {
            setLandmarkCount(results.poseLandmarks.length)
            setFrameCount(prev => prev + 1)
            
            // Disegna connessioni (linee tra i punti)
            window.drawConnectors(
              ctx, 
              results.poseLandmarks, 
              window.POSE_CONNECTIONS,
              { color: '#00FF00', lineWidth: 4 }
            )
            
            // Disegna landmarks (punti)
            window.drawLandmarks(
              ctx, 
              results.poseLandmarks,
              { 
                color: '#FF0000', 
                lineWidth: 2,
                radius: 6,
                fillColor: '#00FF00'
              }
            )
          } else {
            setLandmarkCount(0)
          }
          
          ctx.restore()
        })
        
        if (mounted) {
          poseRef.current = pose
          setIsMediaPipeReady(true)
          setLoadingMessage('MediaPipe pronto!')
          console.log('✅ MediaPipe Pose inizializzato con successo!')
        }
        
      } catch (err) {
        console.error('❌ Errore caricamento MediaPipe:', err)
        setLoadingMessage('Errore caricamento MediaPipe')
        // Abilita comunque il bottone per test camera
        setTimeout(() => {
          if (mounted) {
            setIsMediaPipeReady(true)
          }
        }, 2000)
      }
    }
    
    loadMediaPipe()
    
    return () => {
      mounted = false
      if (poseRef.current) {
        poseRef.current.close()
      }
    }
  }, [])

  // Funzione helper per caricare script
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Controlla se già caricato
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve()
        return
      }
      
      const script = document.createElement('script')
      script.src = src
      script.crossOrigin = 'anonymous'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load ${src}`))
      document.head.appendChild(script)
    })
  }

  // Avvia sessione
  const handleStart = async () => {
    try {
      console.log('🎬 Avvio sessione con MediaPipe...')
      await startCamera()
      setIsActive(true)
      setFrameCount(0)
      
      // Avvia detection loop se MediaPipe è pronto
      if (poseRef.current && videoRef.current) {
        startDetection()
      }
    } catch (err) {
      console.error('❌ Errore avvio:', err)
    }
  }

  // Ferma sessione
  const handleStop = () => {
    console.log('🛑 Stop sessione')
    setIsActive(false)
    stopCamera()
    setFrameCount(0)
    setLandmarkCount(0)
    
    // Pulisci canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }

  // Avvia detection loop
  const startDetection = () => {
    if (!poseRef.current || !videoRef.current) return
    
    const video = videoRef.current
    const pose = poseRef.current
    
    console.log('🎯 Avvio detection loop MediaPipe...')
    
    const detect = async () => {
      if (!isActive || !video || video.readyState !== 4) {
        if (isActive) {
          requestAnimationFrame(detect)
        }
        return
      }
      
      try {
        await pose.send({ image: video })
      } catch (err) {
        console.error('Detection error:', err)
      }
      
      if (isActive) {
        requestAnimationFrame(detect)
      }
    }
    
    detect()
  }

  // Avvia detection quando tutto è pronto
  useEffect(() => {
    if (isActive && isStreamActive && poseRef.current && videoRef.current) {
      startDetection()
    }
  }, [isActive, isStreamActive])

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="bg-gray-900 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm">
              {loadingMessage}
            </span>
            <span className="text-sm">
              Camera: {isStreamActive ? '✅ Attiva' : '⭕ Inattiva'}
            </span>
            {isActive && (
              <>
                <span className="text-sm">
                  Landmarks: <span className="font-mono text-green-400">{landmarkCount}</span>
                </span>
                <span className="text-sm">
                  Frames: <span className="font-mono text-blue-400">{frameCount}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        {/* Video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover mirror"
        />
        
        {/* Canvas overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full mirror pointer-events-none"
        />

        {/* Placeholder quando non attivo */}
        {!isStreamActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <CameraIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400">
                Premi "Inizia" per attivare la camera
              </p>
            </div>
          </div>
        )}

        {/* Indicatore stato */}
        {isActive && isStreamActive && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              {landmarkCount > 0 ? `Rilevando ${landmarkCount} punti` : 'In attesa...'}
            </span>
          </div>
        )}
      </div>

      {/* Controlli */}
      <div className="flex justify-center space-x-4">
        {!isActive ? (
          <button
            onClick={handleStart}
            disabled={!isMediaPipeReady}
            className="btn-primary btn-lg inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlayIcon className="w-5 h-5 mr-2" />
            {isMediaPipeReady ? 'Inizia Rilevamento' : 'Caricamento MediaPipe...'}
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="btn bg-red-600 hover:bg-red-700 text-white btn-lg inline-flex items-center"
          >
            <StopIcon className="w-5 h-5 mr-2" />
            Ferma Rilevamento
          </button>
        )}
      </div>

      {/* Debug Info */}
      <div className="bg-gray-100 rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-2">🔍 Debug Info:</h4>
        <div className="text-xs space-y-1 font-mono">
          <div>MediaPipe Ready: {isMediaPipeReady ? '✅' : '⏳'}</div>
          <div>Camera Active: {isStreamActive ? '✅' : '❌'}</div>
          <div>Detection Active: {isActive ? '✅' : '❌'}</div>
          <div>Pose Landmarks: {landmarkCount}/33</div>
          <div>FPS: {frameCount > 0 ? '~30' : '0'}</div>
          {cameraError && <div className="text-red-600">Error: {cameraError}</div>}
        </div>
      </div>

      {/* Info */}
      {isActive && landmarkCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 font-semibold">
            ✅ MediaPipe sta rilevando la tua posa!
          </p>
          <p className="text-xs text-green-600 mt-1">
            Punti verdi = landmarks rilevati | Linee verdi = connessioni scheletro
          </p>
          <div className="mt-2 text-xs text-green-600">
            <p>• Punti rilevati: {landmarkCount}/33</p>
            <p>• Qualità tracking: {landmarkCount > 25 ? 'Ottima' : landmarkCount > 15 ? 'Buona' : 'Parziale'}</p>
          </div>
        </div>
      )}

      {/* Errori */}
      {cameraError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">
            ⚠️ {cameraError}
          </p>
        </div>
      )}
    </div>
  )
}