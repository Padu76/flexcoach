// components/WebcamWithPose.tsx - Versione semplificata per test

'use client'

import { useRef, useEffect, useState } from 'react'
import { useCamera } from '@/hooks/useCamera'
import { 
  PlayIcon, 
  StopIcon,
  CameraIcon
} from '@heroicons/react/24/outline'

export default function WebcamWithPose() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Inizializzazione...')
  
  // Hook camera
  const { videoRef, isStreamActive, error: cameraError, startCamera, stopCamera } = useCamera()

  // Carica MediaPipe (versione semplificata)
  useEffect(() => {
    let mounted = true
    
    const loadMediaPipe = async () => {
      try {
        setLoadingMessage('Caricamento MediaPipe...')
        console.log('🚀 Tentativo caricamento MediaPipe...')
        
        // Simula caricamento per ora
        setTimeout(() => {
          if (mounted) {
            setIsMediaPipeReady(true)
            setLoadingMessage('MediaPipe pronto!')
            console.log('✅ MediaPipe simulato pronto')
          }
        }, 2000)
        
      } catch (err) {
        console.error('❌ Errore MediaPipe:', err)
        setLoadingMessage('Errore caricamento MediaPipe')
        // Abilita comunque il bottone per test
        setTimeout(() => {
          if (mounted) {
            setIsMediaPipeReady(true)
          }
        }, 1000)
      }
    }
    
    loadMediaPipe()
    
    return () => {
      mounted = false
    }
  }, [])

  // Avvia sessione
  const handleStart = async () => {
    try {
      console.log('🎬 Avvio sessione...')
      await startCamera()
      setIsActive(true)
      
      // Simula detection per test
      if (canvasRef.current && videoRef.current) {
        simulateDetection()
      }
    } catch (err) {
      console.error('❌ Errore avvio:', err)
    }
  }

  // Ferma sessione
  const handleStop = () => {
    console.log('🛑 Stop sessione')
    stopCamera()
    setIsActive(false)
    
    // Pulisci canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }

  // Simula detection per test
  const simulateDetection = () => {
    if (!canvasRef.current || !videoRef.current) return
    
    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Aggiorna dimensioni canvas
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    // Disegna punti di test
    const drawTestPoints = () => {
      if (!isActive) return
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Disegna alcuni punti di test
      const points = [
        { x: canvas.width * 0.5, y: canvas.height * 0.2 }, // testa
        { x: canvas.width * 0.4, y: canvas.height * 0.4 }, // spalla sx
        { x: canvas.width * 0.6, y: canvas.height * 0.4 }, // spalla dx
        { x: canvas.width * 0.5, y: canvas.height * 0.6 }, // centro
        { x: canvas.width * 0.4, y: canvas.height * 0.8 }, // piede sx
        { x: canvas.width * 0.6, y: canvas.height * 0.8 }, // piede dx
      ]
      
      points.forEach((point, i) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI)
        ctx.fillStyle = '#10b981'
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
        
        // Numero punto
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 12px Arial'
        ctx.fillText(i.toString(), point.x + 10, point.y - 10)
      })
      
      // Connessioni
      ctx.strokeStyle = '#60a5fa'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(points[1].x, points[1].y)
      ctx.lineTo(points[2].x, points[2].y)
      ctx.stroke()
      
      requestAnimationFrame(drawTestPoints)
    }
    
    drawTestPoints()
  }

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
              <span className="text-sm text-green-400">
                🟢 Test Mode Attivo
              </span>
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
              Camera Attiva - Test Mode
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
            {isMediaPipeReady ? 'Inizia Test' : 'Caricamento...'}
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="btn bg-red-600 hover:bg-red-700 text-white btn-lg inline-flex items-center"
          >
            <StopIcon className="w-5 h-5 mr-2" />
            Ferma Test
          </button>
        )}
      </div>

      {/* Debug Info */}
      <div className="bg-gray-100 rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-2">🔍 Debug Info:</h4>
        <div className="text-xs space-y-1 font-mono">
          <div>MediaPipe Ready: {isMediaPipeReady ? '✅' : '❌'}</div>
          <div>Camera Active: {isStreamActive ? '✅' : '❌'}</div>
          <div>Session Active: {isActive ? '✅' : '❌'}</div>
          {cameraError && <div className="text-red-600">Error: {cameraError}</div>}
        </div>
      </div>

      {/* Errori */}
      {cameraError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">
            ⚠️ {cameraError}
          </p>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          ℹ️ Versione di test semplificata - MediaPipe non attivo
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Mostra solo punti di test per verificare che camera e canvas funzionino.
        </p>
      </div>
    </div>
  )
}