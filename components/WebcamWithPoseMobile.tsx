// components/WebcamWithPoseMobile.tsx - Versione con beep per mobile

'use client'

import { useRef, useEffect, useState } from 'react'
import { useCamera } from '@/hooks/useCamera'
import { useSoundFeedback } from '@/hooks/useSoundFeedback'
import { 
  PlayIcon, 
  StopIcon,
  CameraIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
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

export default function WebcamWithPoseMobile() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const poseRef = useRef<any>(null)
  const [isActive, setIsActive] = useState(false)
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Inizializzazione...')
  const [landmarkCount, setLandmarkCount] = useState(0)
  
  // Sound feedback
  const { initializeAudio, isInitialized: isAudioReady, isMuted, toggleMute, sounds } = useSoundFeedback()
  
  // Stati per conteggio reps
  const [repCount, setRepCount] = useState(0)
  const [isInRep, setIsInRep] = useState(false)
  const previousDepthRef = useRef<'alto' | 'parallelo' | 'profondo'>('alto')
  const lastSoundTimeRef = useRef<number>(0)
  
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

  // Gestione feedback audio basato su profondità
  const handleSoundFeedback = (depth: 'alto' | 'parallelo' | 'profondo', avgKnee: number) => {
    if (isMuted) return
    
    const now = Date.now()
    const timeSinceLastSound = now - lastSoundTimeRef.current
    
    // Evita spam di suoni (minimo 1 secondo tra feedback)
    if (timeSinceLastSound < 1000) return
    
    // Feedback per profondità
    if (depth === 'alto' && avgKnee > 150 && timeSinceLastSound > 2000) {
      sounds.scendi()
      lastSoundTimeRef.current = now
    } else if (depth === 'parallelo' && avgKnee <= 100 && timeSinceLastSound > 2000) {
      sounds.perfetto()
      lastSoundTimeRef.current = now
    } else if (depth === 'profondo' && avgKnee < 70 && timeSinceLastSound > 2000) {
      sounds.troppoGiu()
      lastSoundTimeRef.current = now
    }
    
    // Conteggio ripetizioni
    if (previousDepthRef.current === 'alto' && depth === 'profondo') {
      setIsInRep(true)
    } else if (previousDepthRef.current === 'profondo' && depth === 'alto' && isInRep) {
      const newCount = repCount + 1
      setRepCount(newCount)
      setIsInRep(false)
      
      // Suono per ripetizione completata
      if (newCount === 5) {
        sounds.cinqueReps()
      } else if (newCount === 10) {
        sounds.dieciReps()
      } else {
        sounds.rep()
      }
    }
    
    previousDepthRef.current = depth
  }

  // Carica MediaPipe
  useEffect(() => {
    let mounted = true
    
    const loadMediaPipe = async () => {
      try {
        setLoadingMessage('Caricamento MediaPipe...')
        
        // Carica gli script necessari
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js')
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js')
        
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
            
            // Calcola angoli per lo squat
            const landmarks = results.poseLandmarks
            
            const leftKneeAngle = calculateAngle(
              landmarks[POSE_LANDMARKS.LEFT_HIP],
              landmarks[POSE_LANDMARKS.LEFT_KNEE],
              landmarks[POSE_LANDMARKS.LEFT_ANKLE]
            )
            
            const rightKneeAngle = calculateAngle(
              landmarks[POSE_LANDMARKS.RIGHT_HIP],
              landmarks[POSE_LANDMARKS.RIGHT_KNEE],
              landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
            )
            
            const leftHipAngle = calculateAngle(
              landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
              landmarks[POSE_LANDMARKS.LEFT_HIP],
              landmarks[POSE_LANDMARKS.LEFT_KNEE]
            )
            
            const rightHipAngle = calculateAngle(
              landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
              landmarks[POSE_LANDMARKS.RIGHT_HIP],
              landmarks[POSE_LANDMARKS.RIGHT_KNEE]
            )
            
            const avgKnee = Math.round((leftKneeAngle + rightKneeAngle) / 2)
            const avgHip = Math.round((leftHipAngle + rightHipAngle) / 2)
            
            setAngles({
              leftKnee: leftKneeAngle,
              rightKnee: rightKneeAngle,
              leftHip: leftHipAngle,
              rightHip: rightHipAngle,
              avgKnee,
              avgHip
            })
            
            // Determina profondità squat
            let newDepth: 'alto' | 'parallelo' | 'profondo' = 'alto'
            if (avgKnee > 160) {
              newDepth = 'alto'
            } else if (avgKnee > 90) {
              newDepth = 'parallelo'
            } else {
              newDepth = 'profondo'
            }
            
            setSquatDepth(newDepth)
            
            // Gestisci feedback audio
            if (isActive) {
              handleSoundFeedback(newDepth, avgKnee)
            }
            
            // Colore delle connessioni basato sulla forma
            let connectionColor = '#00FF00'
            if (avgKnee > 160) {
              connectionColor = '#FFFF00'
            } else if (avgKnee < 70) {
              connectionColor = '#FF0000'
            }
            
            // Disegna connessioni
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
            
            // Disegna contatore reps
            if (repCount > 0) {
              ctx.font = 'bold 48px Arial'
              ctx.fillStyle = '#FFFF00'
              ctx.strokeStyle = '#000000'
              ctx.lineWidth = 3
              const text = `${repCount}`
              const textWidth = ctx.measureText(text).width
              const x = (ctx.canvas.width - textWidth) / 2
              ctx.strokeText(text, x, 60)
              ctx.fillText(text, x, 60)
            }
            
          } else {
            setLandmarkCount(0)
          }
          
          ctx.restore()
        })
        
        if (mounted) {
          poseRef.current = pose
          setIsMediaPipeReady(true)
          setLoadingMessage('MediaPipe pronto!')
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
      // Inizializza audio al primo click (necessario per mobile)
      if (!isAudioReady) {
        initializeAudio()
      }
      
      await startCamera()
      setIsActive(true)
      setRepCount(0)
      setIsInRep(false)
      
      // Suono di inizio
      if (!isMuted) {
        setTimeout(() => sounds.start(), 500)
      }
      
      if (poseRef.current && videoRef.current) {
        startDetection()
      }
    } catch (err) {
      console.error('❌ Errore avvio:', err)
    }
  }

  // Ferma sessione
  const handleStop = () => {
    // Suono di fine
    if (!isMuted) {
      sounds.stop()
    }
    
    setIsActive(false)
    stopCamera()
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
            {isActive && (
              <>
                <span className="text-sm">
                  Reps: <span className="font-mono text-yellow-400 text-lg font-bold">{repCount}</span>
                </span>
                <span className="text-sm">
                  Angolo: <span className="font-mono text-green-400">{angles.avgKnee}°</span>
                </span>
              </>
            )}
          </div>
          <button
            onClick={toggleMute}
            className={`p-2 rounded ${isMuted ? 'bg-red-600' : 'bg-green-600'} transition-colors`}
            title={isMuted ? 'Attiva suoni' : 'Disattiva suoni'}
          >
            {isMuted ? (
              <SpeakerXMarkIcon className="w-5 h-5" />
            ) : (
              <SpeakerWaveIcon className="w-5 h-5" />
            )}
          </button>
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
            {/* Counter Reps grande */}
            {repCount > 0 && (
              <div className="absolute top-4 right-4 bg-black/70 text-yellow-400 px-4 py-2 rounded-lg">
                <div className="text-3xl font-bold">{repCount}</div>
                <div className="text-xs text-center">REPS</div>
              </div>
            )}
            
            {/* Feedback profondità */}
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
            {isMediaPipeReady ? 'Inizia Allenamento' : 'Caricamento...'}
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="btn bg-red-600 hover:bg-red-700 text-white btn-lg inline-flex items-center"
          >
            <StopIcon className="w-5 h-5 mr-2" />
            Ferma Allenamento
          </button>
        )}
      </div>

      {/* Sound Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">🔊 Feedback Audio</h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
          <div>🔈 Tono basso = Scendi di più</div>
          <div>🎵 Melodia = Perfetto!</div>
          <div>🔔 Doppio beep = Rep completata</div>
          <div>🎶 Melodia lunga = 5/10 reps!</div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          {isMuted ? '🔇 Audio disattivato' : '🔊 Audio attivo - Volume alto consigliato'}
        </p>
      </div>
    </div>
  )
}