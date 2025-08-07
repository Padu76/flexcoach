// components/WebcamWithPoseMobile.tsx - Versione FULL mobile responsive

'use client'

import { useRef, useEffect, useState } from 'react'
import { useCamera } from '@/hooks/useCamera'
import { useSoundFeedback } from '@/hooks/useSoundFeedback'
import { 
  PlayIcon, 
  StopIcon,
  CameraIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Inizializzazione...')
  const [landmarkCount, setLandmarkCount] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)
  
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

  // Detect orientamento
  useEffect(() => {
    const handleOrientationChange = () => {
      const landscape = window.innerWidth > window.innerHeight
      setIsLandscape(landscape)
      
      // Ridimensiona canvas quando cambia orientamento
      if (canvasRef.current && videoRef.current) {
        setTimeout(() => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth || window.innerWidth
            canvasRef.current.height = videoRef.current.videoHeight || window.innerHeight * 0.6
          }
        }, 100)
      }
    }

    handleOrientationChange()
    window.addEventListener('resize', handleOrientationChange)
    window.addEventListener('orientationchange', handleOrientationChange)
    
    return () => {
      window.removeEventListener('resize', handleOrientationChange)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

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
    
    if (timeSinceLastSound < 1000) return
    
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
        
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js')
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js')
        
        const pose = new window.Pose({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
          }
        })
        
        await pose.setOptions({
          modelComplexity: 0,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        })
        
        pose.onResults((results: any) => {
          if (!mounted || !canvasRef.current || !videoRef.current) return
          
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          if (!ctx) return
          
          // Dimensioni responsive del canvas
          const videoWidth = videoRef.current.videoWidth
          const videoHeight = videoRef.current.videoHeight
          
          if (videoWidth && videoHeight) {
            // Mantieni aspect ratio del video
            const displayWidth = containerRef.current?.clientWidth || window.innerWidth
            const displayHeight = (displayWidth * videoHeight) / videoWidth
            
            canvas.width = displayWidth
            canvas.height = displayHeight
          }
          
          ctx.save()
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          
          if (results.poseLandmarks) {
            setLandmarkCount(results.poseLandmarks.length)
            
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
            
            let newDepth: 'alto' | 'parallelo' | 'profondo' = 'alto'
            if (avgKnee > 160) {
              newDepth = 'alto'
            } else if (avgKnee > 90) {
              newDepth = 'parallelo'
            } else {
              newDepth = 'profondo'
            }
            
            setSquatDepth(newDepth)
            
            if (isActive) {
              handleSoundFeedback(newDepth, avgKnee)
            }
            
            let connectionColor = '#00FF00'
            if (avgKnee > 160) {
              connectionColor = '#FFFF00'
            } else if (avgKnee < 70) {
              connectionColor = '#FF0000'
            }
            
            window.drawConnectors(
              ctx, 
              results.poseLandmarks, 
              window.POSE_CONNECTIONS,
              { color: connectionColor, lineWidth: isLandscape ? 4 : 3 }
            )
            
            window.drawLandmarks(
              ctx, 
              results.poseLandmarks,
              { 
                color: '#FF0000', 
                lineWidth: 2,
                radius: isLandscape ? 6 : 4,
                fillColor: connectionColor
              }
            )
            
            // Counter reps responsive
            if (repCount > 0) {
              const fontSize = isLandscape ? 48 : 36
              ctx.font = `bold ${fontSize}px Arial`
              ctx.fillStyle = '#FFFF00'
              ctx.strokeStyle = '#000000'
              ctx.lineWidth = 3
              const text = `${repCount}`
              const textWidth = ctx.measureText(text).width
              const x = (ctx.canvas.width - textWidth) / 2
              const y = isLandscape ? 60 : 50
              ctx.strokeText(text, x, y)
              ctx.fillText(text, x, y)
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

  const handleStart = async () => {
    try {
      if (!isAudioReady) {
        initializeAudio()
      }
      
      await startCamera()
      setIsActive(true)
      setRepCount(0)
      setIsInRep(false)
      
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

  const handleStop = () => {
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

  useEffect(() => {
    if (isActive && isStreamActive && poseRef.current && videoRef.current) {
      startDetection()
    }
  }, [isActive, isStreamActive])

  const getDepthColor = () => {
    switch(squatDepth) {
      case 'profondo': return 'text-green-600 bg-green-100'
      case 'parallelo': return 'text-yellow-600 bg-yellow-100'
      case 'alto': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getFeedbackMessage = () => {
    if (angles.avgKnee > 160) return '📏 Scendi di più!'
    if (angles.avgKnee > 120) return '⬇️ Continua a scendere'
    if (angles.avgKnee > 90) return '✅ Quasi parallelo!'
    if (angles.avgKnee > 70) return '🎯 Profondità perfetta!'
    return '⚠️ Troppo profondo'
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-gray-900">
      {/* Status Bar - Compatta su mobile */}
      <div className="bg-gray-900 text-white px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <span className={isMediaPipeReady ? 'text-green-400' : 'text-yellow-400'}>
            {loadingMessage.replace('MediaPipe ', '')}
          </span>
          {isActive && (
            <>
              <span className="font-mono text-yellow-400 text-base font-bold">
                {repCount}
              </span>
              <span className="text-green-400">
                {angles.avgKnee}°
              </span>
            </>
          )}
        </div>
        <button
          onClick={toggleMute}
          className={`p-1.5 rounded ${isMuted ? 'bg-red-600' : 'bg-green-600'}`}
        >
          {isMuted ? (
            <SpeakerXMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <SpeakerWaveIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>
      </div>

      {/* Video Container - Responsive */}
      <div 
        ref={containerRef}
        className="relative bg-black flex-grow overflow-hidden"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-contain mirror"
          style={{ maxHeight: '100%', maxWidth: '100%' }}
        />
        
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full mirror pointer-events-none"
          style={{ objectFit: 'contain' }}
        />

        {!isStreamActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white p-4">
              <CameraIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-sm sm:text-base text-gray-400">
                Premi "Inizia" per attivare la camera
              </p>
            </div>
          </div>
        )}

        {/* Overlay Elements */}
        {isActive && isStreamActive && (
          <>
            {/* Counter Reps - Top Right */}
            {repCount > 0 && (
              <div className="absolute top-2 right-2 bg-black/70 text-yellow-400 px-3 py-1 rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold">{repCount}</div>
                <div className="text-xs text-center">REPS</div>
              </div>
            )}
            
            {/* Feedback - Bottom */}
            {landmarkCount > 0 && (
              <div className="absolute bottom-2 left-2 right-2">
                <div className={`text-center font-bold text-sm sm:text-lg px-3 py-2 rounded-lg ${getDepthColor()}`}>
                  {getFeedbackMessage()}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls - Fixed Bottom */}
      <div className="bg-white p-3 shrink-0">
        <div className="flex justify-center mb-2">
          {!isActive ? (
            <button
              onClick={handleStart}
              disabled={!isMediaPipeReady}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium text-sm sm:text-base disabled:opacity-50 disabled:bg-gray-400 flex items-center gap-2"
            >
              <PlayIcon className="w-5 h-5" />
              {isMediaPipeReady ? 'Inizia Allenamento' : 'Caricamento...'}
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium text-sm sm:text-base flex items-center gap-2"
            >
              <StopIcon className="w-5 h-5" />
              Ferma Allenamento
            </button>
          )}
        </div>

        {/* Collapsible Info - Mobile Only */}
        <div className="sm:hidden">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-full flex items-center justify-between p-2 text-xs text-gray-600"
          >
            <span>🔊 Feedback Audio</span>
            {showInfo ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronUpIcon className="w-4 h-4" />
            )}
          </button>
          
          {showInfo && (
            <div className="bg-blue-50 rounded-lg p-2 text-xs space-y-1">
              <div>🔈 Tono basso = Scendi di più</div>
              <div>🎵 Melodia = Perfetto!</div>
              <div>🔔 Doppio beep = Rep completata</div>
              <div className="text-blue-600 font-medium">
                {isMuted ? '🔇 Audio OFF' : '🔊 Audio ON'}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Info */}
        <div className="hidden sm:block bg-blue-50 rounded-lg p-3 mt-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>🔈 Tono basso = Scendi</div>
            <div>🎵 Melodia = Perfetto!</div>
            <div>🔔 Doppio beep = Rep</div>
            <div>🎶 Melodia lunga = 5/10 reps</div>
          </div>
        </div>
      </div>
    </div>
  )
}