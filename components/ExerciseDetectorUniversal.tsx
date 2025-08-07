// components/ExerciseDetectorUniversal.tsx - Con Auto-Detect Vista

'use client'

import { useRef, useEffect, useState } from 'react'
import { useCamera } from '@/hooks/useCamera'
import { useSoundFeedback } from '@/hooks/useSoundFeedback'
import type { ExerciseType } from '@/types'
import { 
  PlayIcon, 
  StopIcon,
  CameraIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

declare global {
  interface Window {
    drawConnectors: any
    drawLandmarks: any
    POSE_CONNECTIONS: any
    Pose: any
  }
}

// Indici dei landmark
const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE: 2,
  RIGHT_EYE: 5,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
}

type ViewOrientation = 'lateral' | 'frontal' | 'unknown'

interface Props {
  exerciseType: ExerciseType
}

export default function ExerciseDetectorUniversal({ exerciseType }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const poseRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Inizializzazione...')
  const [landmarkCount, setLandmarkCount] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)
  
  // Auto-detect vista
  const [viewOrientation, setViewOrientation] = useState<ViewOrientation>('unknown')
  const [viewWarning, setViewWarning] = useState<string>('')
  
  const { initializeAudio, isInitialized: isAudioReady, isMuted, toggleMute, sounds } = useSoundFeedback()
  
  const [repCount, setRepCount] = useState(0)
  const [isInRep, setIsInRep] = useState(false)
  const previousPhaseRef = useRef<'start' | 'middle' | 'end'>('start')
  const lastSoundTimeRef = useRef<number>(0)
  
  const [angles, setAngles] = useState({
    primary: 0,
    secondary: 0,
    tertiary: 0,
  })
  
  const [exercisePhase, setExercisePhase] = useState<'start' | 'middle' | 'end'>('start')
  const [formQuality, setFormQuality] = useState<'ottimo' | 'buono' | 'correggi'>('buono')
  
  const { videoRef, isStreamActive, error: cameraError, startCamera, stopCamera } = useCamera()

  // Detect orientamento schermo
  useEffect(() => {
    const handleOrientationChange = () => {
      const landscape = window.innerWidth > window.innerHeight
      setIsLandscape(landscape)
      
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

  // Funzione per rilevare l'orientamento del corpo
  const detectViewOrientation = (landmarks: any[]): ViewOrientation => {
    // Calcola la distanza tra le spalle in X (larghezza)
    const shoulderWidth = Math.abs(
      landmarks[POSE_LANDMARKS.LEFT_SHOULDER].x - 
      landmarks[POSE_LANDMARKS.RIGHT_SHOULDER].x
    )
    
    // Calcola la profondità delle spalle in Z
    const shoulderDepth = Math.abs(
      landmarks[POSE_LANDMARKS.LEFT_SHOULDER].z - 
      landmarks[POSE_LANDMARKS.RIGHT_SHOULDER].z
    )
    
    // Calcola visibility delle orecchie (laterale = una visibile, frontale = entrambe)
    const leftEarVis = landmarks[POSE_LANDMARKS.LEFT_EAR]?.visibility || 0
    const rightEarVis = landmarks[POSE_LANDMARKS.RIGHT_EAR]?.visibility || 0
    
    // Calcola visibility dei fianchi
    const leftHipVis = landmarks[POSE_LANDMARKS.LEFT_HIP]?.visibility || 0
    const rightHipVis = landmarks[POSE_LANDMARKS.RIGHT_HIP]?.visibility || 0
    
    // Logica di detection
    if (shoulderWidth > 0.15) {
      // Spalle larghe = vista frontale
      if (leftEarVis > 0.5 && rightEarVis > 0.5) {
        return 'frontal'
      }
    }
    
    if (shoulderWidth < 0.08) {
      // Spalle strette = vista laterale
      if ((leftEarVis > 0.5 && rightEarVis < 0.3) || 
          (rightEarVis > 0.5 && leftEarVis < 0.3)) {
        return 'lateral'
      }
    }
    
    // Backup check con i fianchi
    const hipWidth = Math.abs(
      landmarks[POSE_LANDMARKS.LEFT_HIP].x - 
      landmarks[POSE_LANDMARKS.RIGHT_HIP].x
    )
    
    if (hipWidth > 0.12 && leftHipVis > 0.5 && rightHipVis > 0.5) {
      return 'frontal'
    } else if (hipWidth < 0.06) {
      return 'lateral'
    }
    
    return 'unknown'
  }

  // Calcola angolo tra 3 punti
  const calculateAngle = (a: any, b: any, c: any): number => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
    let angle = Math.abs(radians * 180.0 / Math.PI)
    
    if (angle > 180.0) {
      angle = 360 - angle
    }
    
    return Math.round(angle)
  }

  // Analisi SQUAT con auto-detect vista
  const analyzeSquat = (landmarks: any[], view: ViewOrientation) => {
    if (view === 'lateral') {
      // Analisi laterale standard (profondità)
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
      
      const avgKnee = Math.round((leftKneeAngle + rightKneeAngle) / 2)
      const avgHip = Math.round(leftHipAngle)
      
      setAngles({
        primary: avgKnee,
        secondary: avgHip,
        tertiary: 0
      })
      
      // Fase e qualità
      let phase: 'start' | 'middle' | 'end' = 'start'
      if (avgKnee > 160) phase = 'start'
      else if (avgKnee > 90) phase = 'middle'
      else phase = 'end'
      
      setExercisePhase(phase)
      
      if (avgKnee > 70 && avgKnee < 110) {
        setFormQuality('ottimo')
      } else if (avgKnee > 60 && avgKnee < 130) {
        setFormQuality('buono')
      } else {
        setFormQuality('correggi')
      }
      
      setViewWarning('')
      return { phase, avgKnee }
      
    } else if (view === 'frontal') {
      // Analisi frontale (simmetria e allineamento ginocchia)
      const leftKneeX = landmarks[POSE_LANDMARKS.LEFT_KNEE].x
      const rightKneeX = landmarks[POSE_LANDMARKS.RIGHT_KNEE].x
      const leftAnkleX = landmarks[POSE_LANDMARKS.LEFT_ANKLE].x
      const rightAnkleX = landmarks[POSE_LANDMARKS.RIGHT_ANKLE].x
      
      // Calcola allineamento ginocchia (valgismo/varismo)
      const leftAlignment = Math.abs(leftKneeX - leftAnkleX) * 100
      const rightAlignment = Math.abs(rightKneeX - rightAnkleX) * 100
      const avgAlignment = (leftAlignment + rightAlignment) / 2
      
      // Calcola simmetria
      const symmetry = Math.abs(leftAlignment - rightAlignment)
      
      // Stima profondità dal movimento verticale dei fianchi
      const hipY = (landmarks[POSE_LANDMARKS.LEFT_HIP].y + 
                   landmarks[POSE_LANDMARKS.RIGHT_HIP].y) / 2
      
      setAngles({
        primary: Math.round(avgAlignment * 10), // Allineamento ginocchia
        secondary: Math.round(symmetry * 10),    // Simmetria
        tertiary: Math.round(hipY * 180)         // Stima profondità
      })
      
      // Fase basata su posizione verticale fianchi
      let phase: 'start' | 'middle' | 'end' = 'start'
      if (hipY < 0.5) phase = 'start'
      else if (hipY < 0.65) phase = 'middle'
      else phase = 'end'
      
      setExercisePhase(phase)
      
      // Qualità basata su allineamento
      if (avgAlignment < 5 && symmetry < 3) {
        setFormQuality('ottimo')
      } else if (avgAlignment < 10 && symmetry < 6) {
        setFormQuality('buono')
      } else {
        setFormQuality('correggi')
      }
      
      setViewWarning('⚠️ Vista frontale: analisi limitata profondità')
      return { phase, avgKnee: 0 }
    }
    
    setViewWarning('❌ Posizionati di lato per analisi completa')
    return { phase: 'start', avgKnee: 0 }
  }

  // Analisi PANCA con auto-detect vista
  const analyzeBenchPress = (landmarks: any[], view: ViewOrientation) => {
    if (view === 'lateral') {
      // Vista laterale standard
      const leftElbowAngle = calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
        landmarks[POSE_LANDMARKS.LEFT_ELBOW],
        landmarks[POSE_LANDMARKS.LEFT_WRIST]
      )
      
      const rightElbowAngle = calculateAngle(
        landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
        landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
        landmarks[POSE_LANDMARKS.RIGHT_WRIST]
      )
      
      const shoulderAngle = calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_ELBOW],
        landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
        landmarks[POSE_LANDMARKS.LEFT_HIP]
      )
      
      const avgElbow = Math.round((leftElbowAngle + rightElbowAngle) / 2)
      
      setAngles({
        primary: avgElbow,
        secondary: shoulderAngle,
        tertiary: Math.abs(leftElbowAngle - rightElbowAngle)
      })
      
      let phase: 'start' | 'middle' | 'end' = 'start'
      if (avgElbow > 160) phase = 'start'
      else if (avgElbow > 90) phase = 'middle'
      else phase = 'end'
      
      setExercisePhase(phase)
      
      if (avgElbow > 70 && avgElbow < 100) {
        setFormQuality('ottimo')
      } else if (avgElbow > 60 && avgElbow < 110) {
        setFormQuality('buono')
      } else {
        setFormQuality('correggi')
      }
      
      setViewWarning('')
      return { phase, avgElbow }
      
    } else if (view === 'frontal') {
      // Vista frontale - ottima per simmetria
      const leftElbowY = landmarks[POSE_LANDMARKS.LEFT_ELBOW].y
      const rightElbowY = landmarks[POSE_LANDMARKS.RIGHT_ELBOW].y
      const leftWristY = landmarks[POSE_LANDMARKS.LEFT_WRIST].y
      const rightWristY = landmarks[POSE_LANDMARKS.RIGHT_WRIST].y
      
      // Simmetria altezza gomiti
      const elbowSymmetry = Math.abs(leftElbowY - rightElbowY) * 100
      
      // Simmetria altezza polsi
      const wristSymmetry = Math.abs(leftWristY - rightWristY) * 100
      
      // Larghezza presa
      const gripWidth = Math.abs(
        landmarks[POSE_LANDMARKS.LEFT_WRIST].x - 
        landmarks[POSE_LANDMARKS.RIGHT_WRIST].x
      ) * 100
      
      setAngles({
        primary: Math.round(elbowSymmetry),
        secondary: Math.round(wristSymmetry),
        tertiary: Math.round(gripWidth)
      })
      
      // Stima fase dal movimento verticale
      const avgWristY = (leftWristY + rightWristY) / 2
      let phase: 'start' | 'middle' | 'end' = 'start'
      if (avgWristY < 0.4) phase = 'start'
      else if (avgWristY < 0.55) phase = 'middle'
      else phase = 'end'
      
      setExercisePhase(phase)
      
      // Qualità basata su simmetria
      if (elbowSymmetry < 2 && wristSymmetry < 2) {
        setFormQuality('ottimo')
        setViewWarning('✅ Vista frontale: ottima per simmetria!')
      } else if (elbowSymmetry < 5 && wristSymmetry < 5) {
        setFormQuality('buono')
        setViewWarning('👍 Vista frontale: controllo simmetria')
      } else {
        setFormQuality('correggi')
        setViewWarning('⚠️ Movimento asimmetrico rilevato')
      }
      
      return { phase, avgElbow: 0 }
    }
    
    setViewWarning('❌ Posizionati correttamente')
    return { phase: 'start', avgElbow: 0 }
  }

  // Analisi STACCO con auto-detect vista
  const analyzeDeadlift = (landmarks: any[], view: ViewOrientation) => {
    if (view === 'lateral') {
      // Vista laterale standard
      const hipAngle = calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
        landmarks[POSE_LANDMARKS.LEFT_HIP],
        landmarks[POSE_LANDMARKS.LEFT_KNEE]
      )
      
      const kneeAngle = calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_HIP],
        landmarks[POSE_LANDMARKS.LEFT_KNEE],
        landmarks[POSE_LANDMARKS.LEFT_ANKLE]
      )
      
      const backAngle = calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
        landmarks[POSE_LANDMARKS.LEFT_HIP],
        landmarks[POSE_LANDMARKS.LEFT_ANKLE]
      )
      
      setAngles({
        primary: hipAngle,
        secondary: kneeAngle,
        tertiary: backAngle
      })
      
      let phase: 'start' | 'middle' | 'end' = 'start'
      if (hipAngle < 90) phase = 'start'
      else if (hipAngle < 135) phase = 'middle'
      else phase = 'end'
      
      setExercisePhase(phase)
      
      if (hipAngle > 80 && hipAngle < 170 && backAngle > 140) {
        setFormQuality('ottimo')
      } else if (hipAngle > 70 && hipAngle < 180 && backAngle > 130) {
        setFormQuality('buono')
      } else {
        setFormQuality('correggi')
      }
      
      setViewWarning('')
      return { phase, avgAngle: hipAngle }
      
    } else if (view === 'frontal') {
      // Vista frontale - controllo stance e simmetria
      const leftHipX = landmarks[POSE_LANDMARKS.LEFT_HIP].x
      const rightHipX = landmarks[POSE_LANDMARKS.RIGHT_HIP].x
      const leftAnkleX = landmarks[POSE_LANDMARKS.LEFT_ANKLE].x
      const rightAnkleX = landmarks[POSE_LANDMARKS.RIGHT_ANKLE].x
      
      // Larghezza stance
      const stanceWidth = Math.abs(leftAnkleX - rightAnkleX) * 100
      
      // Simmetria fianchi
      const hipSymmetry = Math.abs(
        landmarks[POSE_LANDMARKS.LEFT_HIP].y - 
        landmarks[POSE_LANDMARKS.RIGHT_HIP].y
      ) * 100
      
      setAngles({
        primary: Math.round(stanceWidth),
        secondary: Math.round(hipSymmetry),
        tertiary: 0
      })
      
      // Stima fase
      const avgHipY = (landmarks[POSE_LANDMARKS.LEFT_HIP].y + 
                      landmarks[POSE_LANDMARKS.RIGHT_HIP].y) / 2
      let phase: 'start' | 'middle' | 'end' = 'start'
      if (avgHipY > 0.6) phase = 'start'
      else if (avgHipY > 0.45) phase = 'middle'
      else phase = 'end'
      
      setExercisePhase(phase)
      
      if (stanceWidth > 15 && stanceWidth < 40 && hipSymmetry < 3) {
        setFormQuality('ottimo')
      } else if (hipSymmetry < 6) {
        setFormQuality('buono')
      } else {
        setFormQuality('correggi')
      }
      
      setViewWarning('⚠️ Vista laterale consigliata per controllo schiena')
      return { phase, avgAngle: 0 }
    }
    
    setViewWarning('❌ Posizionati di lato per sicurezza schiena')
    return { phase: 'start', avgAngle: 0 }
  }

  // Gestione feedback audio
  const handleSoundFeedback = (phase: 'start' | 'middle' | 'end', quality: 'ottimo' | 'buono' | 'correggi') => {
    if (isMuted) return
    
    const now = Date.now()
    const timeSinceLastSound = now - lastSoundTimeRef.current
    
    if (timeSinceLastSound < 1000) return
    
    if (quality === 'correggi' && timeSinceLastSound > 2000) {
      sounds.scendi()
      lastSoundTimeRef.current = now
    } else if (quality === 'ottimo' && phase === 'end' && timeSinceLastSound > 2000) {
      sounds.perfetto()
      lastSoundTimeRef.current = now
    }
    
    if (previousPhaseRef.current === 'start' && phase === 'end') {
      setIsInRep(true)
    } else if (previousPhaseRef.current === 'end' && phase === 'start' && isInRep) {
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
    
    previousPhaseRef.current = phase
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
          
          const videoWidth = videoRef.current.videoWidth
          const videoHeight = videoRef.current.videoHeight
          
          if (videoWidth && videoHeight) {
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
            
            // AUTO-DETECT VISTA
            const detectedView = detectViewOrientation(landmarks)
            setViewOrientation(detectedView)
            
            // Analisi con vista rilevata
            let analysisResult: any = {}
            
            switch (exerciseType) {
              case 'squat':
                analysisResult = analyzeSquat(landmarks, detectedView)
                break
              case 'bench-press':
                analysisResult = analyzeBenchPress(landmarks, detectedView)
                break
              case 'deadlift':
                analysisResult = analyzeDeadlift(landmarks, detectedView)
                break
            }
            
            if (isActive) {
              handleSoundFeedback(exercisePhase, formQuality)
            }
            
            // Colore basato su qualità e vista
            let connectionColor = '#00FF00'
            if (detectedView === 'unknown') {
              connectionColor = '#FF00FF' // Viola per vista non riconosciuta
            } else if (formQuality === 'ottimo') {
              connectionColor = '#00FF00'
            } else if (formQuality === 'buono') {
              connectionColor = '#FFFF00'
            } else {
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
            
            // Indicatore vista nell'angolo
            ctx.font = `bold ${isLandscape ? 20 : 16}px Arial`
            ctx.fillStyle = detectedView === 'unknown' ? '#FF00FF' : 
                           detectedView === 'lateral' ? '#00FF00' : '#00FFFF'
            ctx.strokeStyle = '#000000'
            ctx.lineWidth = 2
            const viewText = detectedView === 'lateral' ? '👁️ LAT' : 
                           detectedView === 'frontal' ? '👁️ FRONT' : '❓'
            ctx.strokeText(viewText, 10, 30)
            ctx.fillText(viewText, 10, 30)
            
            // Counter reps
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
        setLoadingMessage('Errore MediaPipe')
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
      setViewOrientation('unknown')
      setViewWarning('')
      
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
      primary: 0,
      secondary: 0,
      tertiary: 0
    })
    setViewOrientation('unknown')
    setViewWarning('')
    
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

  const getQualityColor = () => {
    switch(formQuality) {
      case 'ottimo': return 'text-green-600 bg-green-100'
      case 'buono': return 'text-yellow-600 bg-yellow-100'
      case 'correggi': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getFeedbackMessage = () => {
    // Se vista non riconosciuta
    if (viewOrientation === 'unknown') {
      return '❓ Posizionati meglio per analisi'
    }
    
    switch (exerciseType) {
      case 'squat':
        if (viewOrientation === 'frontal') {
          if (angles.primary < 5) return '✅ Ginocchia allineate!'
          if (angles.primary < 10) return '⚖️ Controlla allineamento'
          return '⚠️ Ginocchia non allineate'
        } else {
          if (angles.primary > 160) return '📏 Scendi di più!'
          if (angles.primary > 120) return '⬇️ Continua a scendere'
          if (angles.primary > 90) return '✅ Quasi parallelo!'
          if (angles.primary > 70) return '🎯 Profondità perfetta!'
          return '⚠️ Troppo profondo'
        }
        
      case 'bench-press':
        if (viewOrientation === 'frontal') {
          if (angles.primary < 2) return '✅ Perfetta simmetria!'
          if (angles.primary < 5) return '👍 Buona simmetria'
          return '⚖️ Correggi asimmetria'
        } else {
          if (angles.primary > 160) return '💪 Scendi al petto!'
          if (angles.primary > 120) return '⬇️ Ancora un po\''
          if (angles.primary > 80) return '✅ Ottima profondità!'
          return '🎯 Perfetto!'
        }
        
      case 'deadlift':
        if (viewOrientation === 'frontal') {
          if (angles.primary > 15 && angles.primary < 40) return '✅ Stance corretta!'
          return '👟 Correggi larghezza piedi'
        } else {
          if (angles.primary < 90) return '🏋️ Solleva!'
          if (angles.primary < 135) return '⬆️ Estendi le anche'
          if (angles.tertiary < 140) return '🦴 Mantieni la schiena dritta!'
          if (angles.primary > 160) return '✅ Completo!'
          return '🎯 Ottimo movimento!'
        }
        
      default:
        return '...'
    }
  }

  const getExerciseName = () => {
    switch (exerciseType) {
      case 'squat': return 'Squat'
      case 'bench-press': return 'Panca Piana'
      case 'deadlift': return 'Stacco da Terra'
      default: return 'Esercizio'
    }
  }

  const getPrimaryAngleLabel = () => {
    if (viewOrientation === 'frontal') {
      switch (exerciseType) {
        case 'squat': return 'Allineamento'
        case 'bench-press': return 'Simmetria'
        case 'deadlift': return 'Stance'
        default: return 'Analisi'
      }
    } else {
      switch (exerciseType) {
        case 'squat': return 'Ginocchio'
        case 'bench-press': return 'Gomito'
        case 'deadlift': return 'Anca'
        default: return 'Angolo'
      }
    }
  }

  const getViewIcon = () => {
    switch(viewOrientation) {
      case 'lateral': return '👤'
      case 'frontal': return '👥'
      case 'unknown': return '❓'
    }
  }

  const getViewLabel = () => {
    switch(viewOrientation) {
      case 'lateral': return 'Vista Laterale'
      case 'frontal': return 'Vista Frontale'
      case 'unknown': return 'Vista Non Rilevata'
    }
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-gray-900">
      {/* Status Bar */}
      <div className="bg-gray-900 text-white px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <span className={isMediaPipeReady ? 'text-green-400' : 'text-yellow-400'}>
            {getExerciseName()}
          </span>
          {isActive && (
            <>
              <span className="font-mono text-yellow-400 text-base font-bold">
                {repCount}
              </span>
              <span className="text-green-400">
                {getPrimaryAngleLabel()}: {angles.primary}°
              </span>
              <span className={`px-2 py-0.5 rounded text-xs ${
                viewOrientation === 'lateral' ? 'bg-green-600' :
                viewOrientation === 'frontal' ? 'bg-cyan-600' :
                'bg-purple-600'
              }`}>
                {getViewIcon()} {getViewLabel()}
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

      {/* View Warning Banner */}
      {viewWarning && isActive && (
        <div className={`px-3 py-1 text-xs sm:text-sm font-medium text-center ${
          viewWarning.includes('✅') ? 'bg-green-600 text-white' :
          viewWarning.includes('⚠️') ? 'bg-yellow-500 text-black' :
          viewWarning.includes('👍') ? 'bg-blue-600 text-white' :
          'bg-red-600 text-white'
        }`}>
          <div className="flex items-center justify-center gap-2">
            <EyeIcon className="w-4 h-4" />
            {viewWarning}
          </div>
        </div>
      )}

      {/* Video Container */}
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
            {repCount > 0 && (
              <div className="absolute top-2 right-2 bg-black/70 text-yellow-400 px-3 py-1 rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold">{repCount}</div>
                <div className="text-xs text-center">REPS</div>
              </div>
            )}
            
            {landmarkCount > 0 && (
              <div className="absolute bottom-2 left-2 right-2">
                <div className={`text-center font-bold text-sm sm:text-lg px-3 py-2 rounded-lg ${getQualityColor()}`}>
                  {getFeedbackMessage()}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white p-3 shrink-0">
        <div className="flex justify-center mb-2">
          {!isActive ? (
            <button
              onClick={handleStart}
              disabled={!isMediaPipeReady}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium text-sm sm:text-base disabled:opacity-50 disabled:bg-gray-400 flex items-center gap-2"
            >
              <PlayIcon className="w-5 h-5" />
              {isMediaPipeReady ? `Inizia ${getExerciseName()}` : 'Caricamento...'}
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

        {/* Info Collapsible */}
        <div className="sm:hidden">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-full flex items-center justify-between p-2 text-xs text-gray-600"
          >
            <span>🔊 Feedback & Info</span>
            {showInfo ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronUpIcon className="w-4 h-4" />
            )}
          </button>
          
          {showInfo && (
            <div className="bg-blue-50 rounded-lg p-2 text-xs space-y-1">
              <div className="font-semibold">{getExerciseName()}</div>
              <div>Vista: {getViewLabel()}</div>
              <div>Angolo principale: {angles.primary}°</div>
              <div>Fase: {exercisePhase}</div>
              <div>Qualità: {formQuality}</div>
            </div>
          )}
        </div>

        {/* Desktop Info */}
        <div className="hidden sm:grid sm:grid-cols-4 gap-2 bg-blue-50 rounded-lg p-3 mt-2 text-sm">
          <div>
            <span className="font-semibold">Vista:</span> {getViewLabel()}
          </div>
          <div>
            <span className="font-semibold">{getPrimaryAngleLabel()}:</span> {angles.primary}°
          </div>
          <div>
            <span className="font-semibold">Fase:</span> {exercisePhase}
          </div>
          <div>
            <span className="font-semibold">Forma:</span> {formQuality}
          </div>
        </div>
      </div>
    </div>
  )
}