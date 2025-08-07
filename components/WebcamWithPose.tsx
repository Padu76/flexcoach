// components/WebcamWithPose.tsx - Con analisi angoli per squat

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

// Indici dei landmark per lo squat
const POSE_LANDMARKS = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
}

export default function WebcamWithPose() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const poseRef = useRef<any>(null)
  const [isActive, setIsActive] = useState(false)
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Inizializzazione...')
  const [landmarkCount, setLandmarkCount] = useState(0)
  const [frameCount, setFrameCount] = useState(0)
  
  // Stati per gli angoli
  const [angles, setAngles] = useState({
    leftKnee: 0,
    rightKnee: 0,
    leftHip: 0,
    rightHip: 0,
    avgKnee: 0,
    avgHip: 0
  })
  
  // Stato per feedback squat
  const [squatDepth, setSquatDepth] = useState<'alto' | 'parallelo' | 'profondo'>('alto')
  
  // Hook camera
  const { videoRef, isStreamActive, error: cameraError, startCamera, stopCamera } = useCamera()

  // Funzione per calcolare angolo tra 3 punti
  const calculateAngle = (a: any, b: any, c: any): number => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
    let angle = Math.abs(radians * 180.0 / Math.PI)
    
    if (angle > 180.0) {
      angle = 360 - angle
    }
    
    return Math.round(angle)
  }

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
          modelComplexity: 0,
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
          
          // Se ci sono landmarks, disegnali e calcola angoli
          if (results.poseLandmarks) {
            setLandmarkCount(results.poseLandmarks.length)
            setFrameCount(prev => prev + 1)
            
            // Calcola angoli per lo squat
            const landmarks = results.poseLandmarks
            
            // Angolo ginocchio sinistro
            const leftKneeAngle = calculateAngle(
              landmarks[POSE_LANDMARKS.LEFT_HIP],
              landmarks[POSE_LANDMARKS.LEFT_KNEE],
              landmarks[POSE_LANDMARKS.LEFT_ANKLE]
            )
            
            // Angolo ginocchio destro
            const rightKneeAngle = calculateAngle(
              landmarks[POSE_LANDMARKS.RIGHT_HIP],
              landmarks[POSE_LANDMARKS.RIGHT_KNEE],
              landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
            )
            
            // Angolo anca sinistra
            const leftHipAngle = calculateAngle(
              landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
              landmarks[POSE_LANDMARKS.LEFT_HIP],
              landmarks[POSE_LANDMARKS.LEFT_KNEE]
            )
            
            // Angolo anca destra
            const rightHipAngle = calculateAngle(
              landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
              landmarks[POSE_LANDMARKS.RIGHT_HIP],
              landmarks[POSE_LANDMARKS.RIGHT_KNEE]
            )
            
            // Media degli angoli
            const avgKnee = Math.round((leftKneeAngle + rightKneeAngle) / 2)
            const avgHip = Math.round((leftHipAngle + rightHipAngle) / 2)
            
            // Aggiorna stati angoli
            setAngles({
              leftKnee: leftKneeAngle,
              rightKnee: rightKneeAngle,
              leftHip: leftHipAngle,
              rightHip: rightHipAngle,
              avgKnee,
              avgHip
            })
            
            // Determina profondità squat
            if (avgKnee > 160) {
              setSquatDepth('alto')
            } else if (avgKnee > 90) {
              setSquatDepth('parallelo')
            } else {
              setSquatDepth('profondo')
            }
            
            // Colore delle connessioni basato sulla forma
            let connectionColor = '#00FF00' // Verde di default
            if (avgKnee > 160) {
              connectionColor = '#FFFF00' // Giallo se troppo alto
            } else if (avgKnee < 70) {
              connectionColor = '#FF0000' // Rosso se troppo basso
            }
            
            // Disegna connessioni con colore dinamico
            window.drawConnectors(
              ctx, 
              results.poseLandmarks, 
              window.POSE_CONNECTIONS,
              { color: connectionColor, lineWidth: 4 }
            )
            
            // Disegna landmarks
            window.drawLandmarks(
              ctx, 
              results.poseLandmarks,
              { 
                color: '#FF0000', 
                lineWidth: 2,
                radius: 6,
                fillColor: connectionColor
              }
            )
            
            // Disegna angoli sul canvas
            drawAngleInfo(ctx, landmarks, leftKneeAngle, rightKneeAngle, leftHipAngle, rightHipAngle)
            
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

  // Disegna informazioni angoli sul canvas
  const drawAngleInfo = (ctx: any, landmarks: any, leftKnee: number, rightKnee: number, leftHip: number, rightHip: number) => {
    ctx.font = 'bold 16px Arial'
    ctx.fillStyle = '#00FF00'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 3
    
    // Disegna angolo ginocchio sinistro
    const leftKneePos = landmarks[POSE_LANDMARKS.LEFT_KNEE]
    if (leftKneePos) {
      const x = leftKneePos.x * ctx.canvas.width
      const y = leftKneePos.y * ctx.canvas.height
      ctx.strokeText(`${leftKnee}°`, x + 20, y)
      ctx.fillText(`${leftKnee}°`, x + 20, y)
    }
    
    // Disegna angolo ginocchio destro
    const rightKneePos = landmarks[POSE_LANDMARKS.RIGHT_KNEE]
    if (rightKneePos) {
      const x = rightKneePos.x * ctx.canvas.width
      const y = rightKneePos.y * ctx.canvas.height
      ctx.strokeText(`${rightKnee}°`, x - 50, y)
      ctx.fillText(`${rightKnee}°`, x - 50, y)
    }
    
    // Disegna angolo anca sinistra
    const leftHipPos = landmarks[POSE_LANDMARKS.LEFT_HIP]
    if (leftHipPos) {
      const x = leftHipPos.x * ctx.canvas.width
      const y = leftHipPos.y * ctx.canvas.height
      ctx.strokeText(`${leftHip}°`, x + 20, y)
      ctx.fillText(`${leftHip}°`, x + 20, y)
    }
    
    // Disegna angolo anca destra
    const rightHipPos = landmarks[POSE_LANDMARKS.RIGHT_HIP]
    if (rightHipPos) {
      const x = rightHipPos.x * ctx.canvas.width
      const y = rightHipPos.y * ctx.canvas.height
      ctx.strokeText(`${rightHip}°`, x - 50, y)
      ctx.fillText(`${rightHip}°`, x - 50, y)
    }
  }

  // Funzione helper per caricare script
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
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
    setAngles({
      leftKnee: 0,
      rightKnee: 0,
      leftHip: 0,
      rightHip: 0,
      avgKnee: 0,
      avgHip: 0
    })
    
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

  // Colore basato su profondità
  const getDepthColor = () => {
    switch(squatDepth) {
      case 'profondo': return 'text-green-600 bg-green-100'
      case 'parallelo': return 'text-yellow-600 bg-yellow-100'
      case 'alto': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Messaggio feedback
  const getFeedbackMessage = () => {
    if (angles.avgKnee > 160) return '📏 Scendi di più!'
    if (angles.avgKnee > 120) return '⬇️ Continua a scendere'
    if (angles.avgKnee > 90) return '✅ Quasi parallelo!'
    if (angles.avgKnee > 70) return '🎯 Profondità perfetta!'
    return '⚠️ Troppo profondo'
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
              <>
                <span className="text-sm">
                  Landmarks: <span className="font-mono text-green-400">{landmarkCount}</span>
                </span>
                <span className="text-sm">
                  Ginocchio: <span className="font-mono text-yellow-400">{angles.avgKnee}°</span>
                </span>
                <span className="text-sm">
                  Anca: <span className="font-mono text-blue-400">{angles.avgHip}°</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover mirror"
        />
        
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full mirror pointer-events-none"
        />

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

        {isActive && isStreamActive && (
          <>
            <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Analisi Angoli Attiva
              </span>
            </div>
            
            {/* Feedback profondità in tempo reale */}
            {landmarkCount > 0 && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className={`text-center font-bold text-xl px-4 py-2 rounded-lg ${getDepthColor()}`}>
                  {getFeedbackMessage()}
                </div>
              </div>
            )}
          </>
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
            {isMediaPipeReady ? 'Inizia Analisi Squat' : 'Caricamento MediaPipe...'}
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="btn bg-red-600 hover:bg-red-700 text-white btn-lg inline-flex items-center"
          >
            <StopIcon className="w-5 h-5 mr-2" />
            Ferma Analisi
          </button>
        )}
      </div>

      {/* Pannello Angoli */}
      {isActive && landmarkCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Ginocchio SX</h3>
            <p className="text-2xl font-bold text-primary-600">{angles.leftKnee}°</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Ginocchio DX</h3>
            <p className="text-2xl font-bold text-primary-600">{angles.rightKnee}°</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Anca SX</h3>
            <p className="text-2xl font-bold text-blue-600">{angles.leftHip}°</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Anca DX</h3>
            <p className="text-2xl font-bold text-blue-600">{angles.rightHip}°</p>
          </div>
        </div>
      )}

      {/* Info Squat Depth */}
      {isActive && landmarkCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📐 Analisi Profondità Squat</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Angolo medio ginocchia:</span>
              <span className="font-mono font-bold">{angles.avgKnee}°</span>
            </div>
            <div className="flex justify-between">
              <span>Angolo medio anche:</span>
              <span className="font-mono font-bold">{angles.avgHip}°</span>
            </div>
            <div className="flex justify-between">
              <span>Profondità:</span>
              <span className={`font-bold px-2 py-1 rounded ${getDepthColor()}`}>
                {squatDepth.toUpperCase()}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-700">
                🎯 Target: Angolo ginocchio 90° (parallelo) o meno per squat completo
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="bg-gray-100 rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-2">🔍 Debug Info:</h4>
        <div className="text-xs space-y-1 font-mono">
          <div>MediaPipe Ready: {isMediaPipeReady ? '✅' : '⏳'}</div>
          <div>Detection Active: {isActive ? '✅' : '❌'}</div>
          <div>Pose Landmarks: {landmarkCount}/33</div>
          <div>Squat Depth: {squatDepth}</div>
          {cameraError && <div className="text-red-600">Error: {cameraError}</div>}
        </div>
      </div>
    </div>
  )
}