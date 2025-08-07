// components/WebcamWithPose.tsx - Con voice feedback

'use client'

import { useRef, useEffect, useState } from 'react'
import { useCamera } from '@/hooks/useCamera'
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

export default function WebcamWithPose() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const poseRef = useRef<any>(null)
  const [isActive, setIsActive] = useState(false)
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Inizializzazione...')
  const [landmarkCount, setLandmarkCount] = useState(0)
  const [frameCount, setFrameCount] = useState(0)
  
  // Stati per voice feedback
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [lastVoiceFeedback, setLastVoiceFeedback] = useState('')
  const lastSpokenRef = useRef<string>('')
  const lastSpeakTimeRef = useRef<number>(0)
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  
  // Stati per conteggio reps
  const [repCount, setRepCount] = useState(0)
  const [isInRep, setIsInRep] = useState(false)
  const previousDepthRef = useRef<'alto' | 'parallelo' | 'profondo'>('alto')
  
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

  // Inizializza speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechUtteranceRef.current = new SpeechSynthesisUtterance()
      speechUtteranceRef.current.lang = 'it-IT'
      speechUtteranceRef.current.rate = 1.1
      speechUtteranceRef.current.pitch = 1.0
      speechUtteranceRef.current.volume = 0.9
    }
  }, [])

  // Funzione per parlare
  const speak = (text: string, force: boolean = false) => {
    if (!voiceEnabled || !speechUtteranceRef.current) return
    
    const now = Date.now()
    const timeSinceLastSpeak = now - lastSpeakTimeRef.current
    
    // Evita di ripetere lo stesso messaggio troppo spesso (minimo 3 secondi)
    if (!force && (lastSpokenRef.current === text && timeSinceLastSpeak < 3000)) {
      return
    }
    
    // Evita sovrapposizioni (minimo 1.5 secondi tra messaggi diversi)
    if (!force && timeSinceLastSpeak < 1500) {
      return
    }
    
    // Cancella eventuali speech in corso
    window.speechSynthesis.cancel()
    
    // Parla
    speechUtteranceRef.current.text = text
    window.speechSynthesis.speak(speechUtteranceRef.current)
    
    lastSpokenRef.current = text
    lastSpeakTimeRef.current = now
    setLastVoiceFeedback(text)
  }

  // Funzione per calcolare angolo tra 3 punti
  const calculateAngle = (a: any, b: any, c: any): number => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
    let angle = Math.abs(radians * 180.0 / Math.PI)
    
    if (angle > 180.0) {
      angle = 360 - angle
    }
    
    return Math.round(angle)
  }

  // Gestione feedback vocale basato su profondità
  const handleVoiceFeedback = (depth: 'alto' | 'parallelo' | 'profondo', avgKnee: number) => {
    // Feedback per profondità
    if (depth === 'alto' && avgKnee > 150) {
      speak('Scendi di più')
    } else if (depth === 'alto' && avgKnee > 120) {
      speak('Continua a scendere')
    } else if (depth === 'parallelo' && avgKnee > 100) {
      speak('Quasi parallelo, ancora un po')
    } else if (depth === 'parallelo' && avgKnee <= 100) {
      speak('Perfetto, mantieni')
    } else if (depth === 'profondo' && avgKnee < 70) {
      speak('Troppo profondo')
    }
    
    // Conteggio ripetizioni
    if (previousDepthRef.current === 'alto' && depth === 'profondo') {
      setIsInRep(true)
    } else if (previousDepthRef.current === 'profondo' && depth === 'alto' && isInRep) {
      const newCount = repCount + 1
      setRepCount(newCount)
      setIsInRep(false)
      
      // Feedback vocale per ripetizione completata
      if (newCount === 1) {
        speak('Una ripetizione', true)
      } else if (newCount === 5) {
        speak('Cinque ripetizioni, ottimo lavoro', true)
      } else if (newCount === 10) {
        speak('Dieci ripetizioni, fantastico', true)
      } else if (newCount % 5 === 0) {
        speak(`${newCount} ripetizioni`, true)
      } else {
        speak(`${newCount}`, true)
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
            let newDepth: 'alto' | 'parallelo' | 'profondo' = 'alto'
            if (avgKnee > 160) {
              newDepth = 'alto'
            } else if (avgKnee > 90) {
              newDepth = 'parallelo'
            } else {
              newDepth = 'profondo'
            }
            
            setSquatDepth(newDepth)
            
            // Gestisci feedback vocale
            if (isActive) {
              handleVoiceFeedback(newDepth, avgKnee)
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
      // Ferma eventuali speech in corso
      window.speechSynthesis.cancel()
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
    
    // Disegna contatore reps al centro in alto
    if (repCount > 0) {
      ctx.font = 'bold 48px Arial'
      ctx.fillStyle = '#FFFF00'
      const text = `${repCount} REPS`
      const textWidth = ctx.measureText(text).width
      const x = (ctx.canvas.width - textWidth) / 2
      ctx.strokeText(text, x, 60)
      ctx.fillText(text, x, 60)
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
      setRepCount(0)
      setIsInRep(false)
      
      // Messaggio di benvenuto
      if (voiceEnabled) {
        setTimeout(() => {
          speak('Iniziamo l\'allenamento. Posizionati per lo squat', true)
        }, 1000)
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
    console.log('🛑 Stop sessione')
    
    // Messaggio di fine
    if (voiceEnabled && repCount > 0) {
      speak(`Ottimo lavoro! Hai completato ${repCount} ripetizioni`, true)
    }
    
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
    
    // Ferma speech
    window.speechSynthesis.cancel()
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }

  // Toggle voice
  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled)
    if (!voiceEnabled) {
      speak('Audio attivato', true)
    } else {
      window.speechSynthesis.cancel()
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
                  Reps: <span className="font-mono text-yellow-400 text-lg font-bold">{repCount}</span>
                </span>
                <span className="text-sm">
                  Ginocchio: <span className="font-mono text-green-400">{angles.avgKnee}°</span>
                </span>
              </>
            )}
          </div>
          <button
            onClick={toggleVoice}
            className={`p-2 rounded ${voiceEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} transition-colors`}
            title={voiceEnabled ? 'Disattiva audio' : 'Attiva audio'}
          >
            {voiceEnabled ? (
              <SpeakerWaveIcon className="w-5 h-5" />
            ) : (
              <SpeakerXMarkIcon className="w-5 h-5" />
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
            <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                AI Coach Attivo
              </span>
            </div>
            
            {/* Counter Reps grande */}
            {repCount > 0 && (
              <div className="absolute top-4 right-4 bg-black/70 text-yellow-400 px-4 py-2 rounded-lg">
                <div className="text-3xl font-bold">{repCount}</div>
                <div className="text-xs text-center">REPS</div>
              </div>
            )}
            
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
            {isMediaPipeReady ? 'Inizia Allenamento' : 'Caricamento MediaPipe...'}
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

      {/* Voice Feedback Display */}
      {voiceEnabled && lastVoiceFeedback && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <SpeakerWaveIcon className="w-5 h-5 text-purple-600" />
            <span className="text-purple-800 font-medium">Coach Vocale:</span>
            <span className="text-purple-600 italic">"{lastVoiceFeedback}"</span>
          </div>
        </div>
      )}

      {/* Pannello Statistiche */}
      {isActive && landmarkCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Ripetizioni</h3>
            <p className="text-3xl font-bold text-yellow-600">{repCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Angolo Medio</h3>
            <p className="text-2xl font-bold text-primary-600">{angles.avgKnee}°</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Profondità</h3>
            <p className={`text-lg font-bold px-2 py-1 rounded ${getDepthColor()}`}>
              {squatDepth.toUpperCase()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Audio</h3>
            <div className="flex items-center justify-center h-8">
              {voiceEnabled ? (
                <span className="text-green-600 font-bold">ATTIVO</span>
              ) : (
                <span className="text-gray-400">MUTO</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">🎯 AI Coach Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
          <div>✅ Analisi angoli in tempo reale</div>
          <div>🔊 Feedback vocale italiano</div>
          <div>🔢 Conteggio automatico ripetizioni</div>
          <div>📐 Target: 90° per squat parallelo</div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-gray-100 rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-2">🔍 Debug Info:</h4>
        <div className="text-xs space-y-1 font-mono">
          <div>Voice Enabled: {voiceEnabled ? '✅' : '❌'}</div>
          <div>Reps Count: {repCount}</div>
          <div>Squat Depth: {squatDepth}</div>
          <div>In Rep: {isInRep ? 'YES' : 'NO'}</div>
          {cameraError && <div className="text-red-600">Error: {cameraError}</div>}
        </div>
      </div>
    </div>
  )
}