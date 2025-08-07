// components/WebcamWithPose.tsx - Componente webcam con rilevamento pose base

'use client'

import { useRef, useEffect, useState } from 'react'
import { useCamera } from '@/hooks/useCamera'
import { usePoseTracking, type Landmark } from '@/hooks/usePoseTracking'
import { 
  PlayIcon, 
  StopIcon,
  CameraIcon
} from '@heroicons/react/24/outline'

export default function WebcamWithPose() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [landmarkCount, setLandmarkCount] = useState(0)
  const [detectionCount, setDetectionCount] = useState(0)
  
  // Hooks
  const { videoRef, isStreamActive, error: cameraError, startCamera, stopCamera } = useCamera()
  const { isInitialized, error: poseError, detectPose } = usePoseTracking()

  // Avvia sessione
  const handleStart = async () => {
    await startCamera()
    setIsActive(true)
  }

  // Ferma sessione
  const handleStop = () => {
    stopCamera()
    setIsActive(false)
    setLandmarkCount(0)
    setDetectionCount(0)
    // Pulisci canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }

  // Avvia detection quando tutto è pronto
  useEffect(() => {
    if (isActive && isStreamActive && isInitialized && videoRef.current) {
      console.log('🚀 Avvio detection pose...')
      
      const handleResults = (landmarks: Landmark[]) => {
        setLandmarkCount(landmarks.length)
        setDetectionCount(prev => prev + 1)
        drawLandmarks(landmarks)
      }

      detectPose(videoRef.current, handleResults)
    }
  }, [isActive, isStreamActive, isInitialized, detectPose])

  // Disegna landmarks sul canvas
  const drawLandmarks = (landmarks: Landmark[]) => {
    if (!canvasRef.current || !videoRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Aggiorna dimensioni canvas
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    // Pulisci canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Disegna ogni landmark
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * canvas.width
      const y = landmark.y * canvas.height

      // Punto principale
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, 2 * Math.PI)
      ctx.fillStyle = landmark.visibility && landmark.visibility > 0.5 ? '#10b981' : '#f59e0b'
      ctx.fill()

      // Bordo bianco
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Numero del punto (opzionale, per debug)
      if (index < 10) { // Mostra solo i primi 10 numeri per non affollare
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px Arial'
        ctx.fillText(index.toString(), x + 8, y - 8)
      }
    })

    // Disegna connessioni base (spalle, fianchi, etc.)
    drawConnections(ctx, landmarks, canvas.width, canvas.height)
  }

  // Disegna connessioni tra punti chiave
  const drawConnections = (ctx: CanvasRenderingContext2D, landmarks: Landmark[], width: number, height: number) => {
    // Connessioni principali del corpo
    const connections = [
      [11, 12], // spalle
      [11, 13], [13, 15], // braccio sinistro
      [12, 14], [14, 16], // braccio destro
      [11, 23], [12, 24], // spalle-fianchi
      [23, 24], // fianchi
      [23, 25], [25, 27], // gamba sinistra
      [24, 26], [26, 28], // gamba destra
    ]

    ctx.strokeStyle = '#60a5fa'
    ctx.lineWidth = 2

    connections.forEach(([start, end]) => {
      if (landmarks[start] && landmarks[end]) {
        ctx.beginPath()
        ctx.moveTo(landmarks[start].x * width, landmarks[start].y * height)
        ctx.lineTo(landmarks[end].x * width, landmarks[end].y * height)
        ctx.stroke()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="bg-gray-900 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm">
              MediaPipe: {isInitialized ? '✅ Pronto' : '⏳ Caricamento...'}
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
                  Detections: <span className="font-mono text-blue-400">{detectionCount}</span>
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
        
        {/* Canvas overlay per i landmarks */}
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
              {landmarkCount > 0 ? 'Rilevamento Attivo' : 'In Attesa...'}
            </span>
          </div>
        )}
      </div>

      {/* Controlli */}
      <div className="flex justify-center space-x-4">
        {!isActive ? (
          <button
            onClick={handleStart}
            disabled={!isInitialized}
            className="btn-primary btn-lg inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlayIcon className="w-5 h-5 mr-2" />
            {isInitialized ? 'Inizia Rilevamento' : 'Caricamento MediaPipe...'}
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

      {/* Errori */}
      {(cameraError || poseError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">
            ⚠️ {cameraError || poseError}
          </p>
        </div>
      )}

      {/* Info Box */}
      {isActive && landmarkCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">
            ✅ MediaPipe sta rilevando {landmarkCount} punti sul tuo corpo!
          </p>
          <p className="text-xs text-green-600 mt-1">
            I punti verdi hanno alta visibilità, quelli gialli sono parzialmente visibili.
          </p>
        </div>
      )}
    </div>
  )
}