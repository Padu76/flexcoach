// components/ExerciseDetectorUniversal.tsx - Con DataManager integrato per salvare sessioni

'use client'

import { useRef, useEffect, useState } from 'react'
import { useCamera } from '@/hooks/useCamera'
import { useSoundFeedback } from '@/hooks/useSoundFeedback'
import { useCurrentWorkout, useExercisePreferences, useCache } from '@/hooks/useDataManager'
import type { ExerciseType } from '@/types'
import type { SetData, RepData } from '@/types/data'
import { 
  PlayIcon, 
  StopIcon,
  CameraIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon
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
  // DataManager Hooks
  const { 
    session,
    isActive: hasActiveSession,
    startWorkout,
    addSet,
    endWorkout,
    currentExercise,
    setsCompleted,
    repsCompleted: totalRepsFromSession,
    volumeLifted
  } = useCurrentWorkout()
  
  const {
    preferences,
    updatePreferences,
    preferredView,
    audioEnabled,
    showSkeleton,
    showMetrics
  } = useExercisePreferences(exerciseType)
  
  const {
    getLastWeight,
    setLastExercise,
    getLastView,
    setLastView
  } = useCache()
  
  // Canvas e refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const poseRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Stati locali
  const [isActive, setIsActive] = useState(false)
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Inizializzazione...')
  const [landmarkCount, setLandmarkCount] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)
  
  // Vista e orientamento
  const [viewOrientation, setViewOrientation] = useState<ViewOrientation>(preferredView === 'auto' ? 'unknown' : preferredView as ViewOrientation)
  const [viewWarning, setViewWarning] = useState<string>('')
  
  // Audio
  const { initializeAudio, isInitialized: isAudioReady, isMuted, toggleMute, sounds } = useSoundFeedback()
  
  // Conteggio ripetizioni per set corrente
  const [currentSetNumber, setCurrentSetNumber] = useState(1)
  const [currentSetReps, setCurrentSetReps] = useState<RepData[]>([])
  const [repCount, setRepCount] = useState(0)
  const [isInRep, setIsInRep] = useState(false)
  const repStartTimeRef = useRef<number>(0)
  const previousPhaseRef = useRef<'start' | 'middle' | 'end'>('start')
  const lastSoundTimeRef = useRef<number>(0)
  const minDepthReachedRef = useRef<number>(180)
  
  // Dati qualità rep
  const [currentDepth, setCurrentDepth] = useState(0)
  const [bestDepth, setBestDepth] = useState(0)
  const [avgRepDuration, setAvgRepDuration] = useState(0)
  const [repQuality, setRepQuality] = useState<'perfect' | 'good' | 'incomplete'>('good')
  
  // Timer sessione
  const [sessionTime, setSessionTime] = useState(0)
  const sessionStartRef = useRef<number>(0)
  const sessionIntervalRef = useRef<NodeJS.Timeout>()
  
  // Angoli e fase esercizio
  const [angles, setAngles] = useState({
    primary: 0,
    secondary: 0,
    tertiary: 0,
  })
  
  const [exercisePhase, setExercisePhase] = useState<'start' | 'middle' | 'end'>('start')
  const [formQuality, setFormQuality] = useState<'ottimo' | 'buono' | 'correggi'>('buono')
  
  const { videoRef, isStreamActive, error: cameraError, startCamera, stopCamera } = useCamera()

  // Carica ultima vista usata
  useEffect(() => {
    const lastView = getLastView()
    if (lastView && preferredView === 'auto') {
      setViewOrientation(lastView as ViewOrientation)
    }
  }, [])

  // Salva peso suggerito da sessioni precedenti
  const suggestedWeight = getLastWeight(exerciseType) || 40

  // Timer sessione
  useEffect(() => {
    if (isActive) {
      sessionStartRef.current = Date.now()
      sessionIntervalRef.current = setInterval(() => {
        setSessionTime(Math.floor((Date.now() - sessionStartRef.current) / 1000))
      }, 1000)
    } else {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current)
      }
      setSessionTime(0)
    }
    
    return () => {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current)
      }
    }
  }, [isActive])

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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
    if (preferredView !== 'auto') {
      return preferredView as ViewOrientation
    }
    
    const shoulderWidth = Math.abs(
      landmarks[POSE_LANDMARKS.LEFT_SHOULDER].x - 
      landmarks[POSE_LANDMARKS.RIGHT_SHOULDER].x
    )
    
    const leftEarVis = landmarks[POSE_LANDMARKS.LEFT_EAR]?.visibility || 0
    const rightEarVis = landmarks[POSE_LANDMARKS.RIGHT_EAR]?.visibility || 0
    
    if (shoulderWidth > 0.15) {
      if (leftEarVis > 0.5 && rightEarVis > 0.5) {
        return 'frontal'
      }
    }
    
    if (shoulderWidth < 0.08) {
      if ((leftEarVis > 0.5 && rightEarVis < 0.3) || 
          (rightEarVis > 0.5 && leftEarVis < 0.3)) {
        return 'lateral'
      }
    }
    
    const hipWidth = Math.abs(
      landmarks[POSE_LANDMARKS.LEFT_HIP].x - 
      landmarks[POSE_LANDMARKS.RIGHT_HIP].x
    )
    
    if (hipWidth > 0.12) {
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

  // Validazione ripetizione
  const validateRep = (minDepth: number): 'perfect' | 'good' | 'incomplete' => {
    switch (exerciseType) {
      case 'squat':
        if (minDepth <= 90) return 'perfect'
        if (minDepth <= 110) return 'good'
        return 'incomplete'
        
      case 'bench-press':
        if (minDepth <= 85) return 'perfect'
        if (minDepth <= 100) return 'good'
        return 'incomplete'
        
      case 'deadlift':
        if (minDepth <= 100) return 'perfect'
        if (minDepth <= 120) return 'good'
        return 'incomplete'
        
      default:
        return 'good'
    }
  }

  // Gestione conteggio ripetizioni migliorato
  const handleRepCounting = (phase: 'start' | 'middle' | 'end', primaryAngle: number) => {
    // Aggiorna profondità minima raggiunta
    if (primaryAngle < minDepthReachedRef.current) {
      minDepthReachedRef.current = primaryAngle
      setCurrentDepth(primaryAngle)
      if (primaryAngle < bestDepth || bestDepth === 0) {
        setBestDepth(primaryAngle)
      }
    }
    
    // Inizio ripetizione
    if (previousPhaseRef.current === 'start' && phase !== 'start' && !isInRep) {
      setIsInRep(true)
      repStartTimeRef.current = Date.now()
      minDepthReachedRef.current = 180
      
      // Sound feedback
      if (audioEnabled && !isMuted && Date.now() - lastSoundTimeRef.current > 500) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = 440
        gainNode.gain.value = 0.1
        oscillator.type = 'sine'
        
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.05)
        
        lastSoundTimeRef.current = Date.now()
      }
    }
    
    // Fine ripetizione
    if ((previousPhaseRef.current === 'end' || previousPhaseRef.current === 'middle') && 
        phase === 'start' && isInRep) {
      
      const repDuration = (Date.now() - repStartTimeRef.current) / 1000
      const quality = validateRep(minDepthReachedRef.current)
      
      // Conta solo se valida
      if (repDuration > 0.5 && quality !== 'incomplete') {
        const newCount = repCount + 1
        setRepCount(newCount)
        setRepQuality(quality)
        
        // Crea dati rep per DataManager
        const repData: RepData = {
          repNumber: newCount,
          quality,
          depth: minDepthReachedRef.current,
          duration: repDuration * 1000,
          symmetry: 90, // TODO: calcolare vera simmetria
          timestamp: new Date().toISOString()
        }
        
        setCurrentSetReps(prev => [...prev, repData])
        
        // Aggiorna media durata
        const totalDuration = currentSetReps.reduce((acc, r) => acc + r.duration, 0) + repData.duration
        setAvgRepDuration(totalDuration / (currentSetReps.length + 1) / 1000)
        
        // Sound feedback
        if (audioEnabled && !isMuted) {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          
          if (quality === 'perfect') {
            playPerfectRepSound(audioContext)
          } else {
            playNormalRepSound(audioContext, newCount)
          }
          
          // Milestone sounds
          if (newCount === 5) {
            setTimeout(() => sounds.cinqueReps(), 300)
          } else if (newCount === 10) {
            setTimeout(() => sounds.dieciReps(), 300)
          }
        }
      } else if (quality === 'incomplete') {
        setRepQuality('incomplete')
        
        if (audioEnabled && !isMuted) {
          sounds.scendi()
        }
      }
      
      setIsInRep(false)
      minDepthReachedRef.current = 180
    }
    
    previousPhaseRef.current = phase
  }

  // Suoni personalizzati
  const playNormalRepSound = (audioContext: AudioContext, count: number) => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 523 + (count * 20)
    gainNode.gain.value = 0.2
    oscillator.type = 'sine'
    
    oscillator.start()
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
    oscillator.stop(audioContext.currentTime + 0.2)
  }

  const playPerfectRepSound = (audioContext: AudioContext) => {
    const frequencies = [523, 659, 784]
    
    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = freq
      gainNode.gain.value = 0.15
      oscillator.type = 'sine'
      
      oscillator.start(audioContext.currentTime + index * 0.05)
      oscillator.stop(audioContext.currentTime + 0.3)
    })
  }

  // Analisi SQUAT
  const analyzeSquat = (landmarks: any[], view: ViewOrientation) => {
    if (view === 'lateral') {
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
      
      let phase: 'start' | 'middle' | 'end' = 'start'
      if (avgKnee > 160) phase = 'start'
      else if (avgKnee > 90) phase = 'middle'
      else phase = 'end'
      
      setExercisePhase(phase)
      handleRepCounting(phase, avgKnee)
      
      if (avgKnee > 70 && avgKnee < 110) {
        setFormQuality('ottimo')
      } else if (avgKnee > 60 && avgKnee < 130) {
        setFormQuality('buono')
      } else {
        setFormQuality('correggi')
      }
      
      setViewWarning('')
      return { phase, avgKnee }
    }
    
    setViewWarning('❌ Posizionati di lato per analisi completa')
    return { phase: 'start', avgKnee: 0 }
  }

  // Analisi PANCA
  const analyzeBenchPress = (landmarks: any[], view: ViewOrientation) => {
    if (view === 'lateral') {
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
      
      const avgElbow = Math.round((leftElbowAngle + rightElbowAngle) / 2)
      
      setAngles({
        primary: avgElbow,
        secondary: 0,
        tertiary: Math.abs(leftElbowAngle - rightElbowAngle)
      })
      
      let phase: 'start' | 'middle' | 'end' = 'start'
      if (avgElbow > 160) phase = 'start'
      else if (avgElbow > 90) phase = 'middle'
      else phase = 'end'
      
      setExercisePhase(phase)
      handleRepCounting(phase, avgElbow)
      
      if (avgElbow > 70 && avgElbow < 100) {
        setFormQuality('ottimo')
      } else if (avgElbow > 60 && avgElbow < 110) {
        setFormQuality('buono')
      } else {
        setFormQuality('correggi')
      }
      
      setViewWarning('')
      return { phase, avgElbow }
    }
    
    setViewWarning('❌ Posizionati correttamente')
    return { phase: 'start', avgElbow: 0 }
  }

  // Analisi STACCO
  const analyzeDeadlift = (landmarks: any[], view: ViewOrientation) => {
    if (view === 'lateral') {
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
      
      setAngles({
        primary: hipAngle,
        secondary: kneeAngle,
        tertiary: 0
      })
      
      let phase: 'start' | 'middle' | 'end' = 'start'
      if (hipAngle < 90) phase = 'start'
      else if (hipAngle < 135) phase = 'middle'
      else phase = 'end'
      
      setExercisePhase(phase)
      handleRepCounting(phase, hipAngle)
      
      if (hipAngle > 80 && hipAngle < 170) {
        setFormQuality('ottimo')
      } else if (hipAngle > 70 && hipAngle < 180) {
        setFormQuality('buono')
      } else {
        setFormQuality('correggi')
      }
      
      setViewWarning('')
      return { phase, avgAngle: hipAngle }
    }
    
    setViewWarning('❌ Posizionati di lato per sicurezza schiena')
    return { phase: 'start', avgAngle: 0 }
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
          
          if (results.poseLandmarks && showSkeleton) {
            setLandmarkCount(results.poseLandmarks.length)
            
            const landmarks = results.poseLandmarks
            const detectedView = detectViewOrientation(landmarks)
            setViewOrientation(detectedView)
            
            // Salva ultima vista
            if (detectedView !== 'unknown') {
              setLastView(detectedView)
            }
            
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
            
            // Colore basato su qualità
            let connectionColor = '#00FF00'
            if (detectedView === 'unknown') {
              connectionColor = '#FF00FF'
            } else if (formQuality === 'ottimo') {
              connectionColor = '#00FF00'
            } else if (formQuality === 'buono') {
              connectionColor = '#FFFF00'
            } else {
              connectionColor = '#FF0000'
            }
            
            if (isInRep) {
              connectionColor = '#00FFFF'
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
            
            // Counter reps
            if (repCount > 0 && showMetrics) {
              const fontSize = isLandscape ? 72 : 56
              ctx.font = `bold ${fontSize}px Arial`
              
              let repColor = '#FFFF00'
              if (repQuality === 'perfect') {
                repColor = '#00FF00'
              } else if (repQuality === 'incomplete') {
                repColor = '#FF0000'
              }
              
              ctx.fillStyle = repColor
              ctx.strokeStyle = '#000000'
              ctx.lineWidth = 4
              const text = `${repCount}`
              const textWidth = ctx.measureText(text).width
              const x = (ctx.canvas.width - textWidth) / 2
              const y = isLandscape ? 80 : 60
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
      
      // Inizia sessione workout nel DataManager
      if (!hasActiveSession) {
        startWorkout(exerciseType)
      }
      
      // Salva ultimo esercizio
      setLastExercise(exerciseType)
      
      // Reset contatori
      setRepCount(0)
      setCurrentSetReps([])
      setIsInRep(false)
      setViewOrientation(preferredView === 'auto' ? 'unknown' : preferredView as ViewOrientation)
      setViewWarning('')
      minDepthReachedRef.current = 180
      setBestDepth(0)
      setCurrentDepth(0)
      
      if (audioEnabled && !isMuted) {
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
    // Salva set corrente se ci sono reps
    if (currentSetReps.length > 0) {
      handleCompleteSet()
    }
    
    if (audioEnabled && !isMuted && repCount > 0) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      playPerfectRepSound(audioContext)
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
    
    // Salva preferenze
    updatePreferences({
      preferredView: viewOrientation !== 'unknown' ? viewOrientation : 'auto',
      audioEnabled,
      showSkeleton,
      showMetrics
    })
  }

  const handleCompleteSet = () => {
    if (currentSetReps.length === 0) return
    
    // Calcola qualità media del set
    const avgQuality = currentSetReps.reduce((acc, rep) => {
      const quality = rep.quality === 'perfect' ? 100 :
                     rep.quality === 'good' ? 75 :
                     rep.quality === 'fair' ? 50 : 25
      return acc + quality
    }, 0) / currentSetReps.length
    
    // Crea dati set per DataManager
    const setData: SetData = {
      setNumber: currentSetNumber,
      exercise: exerciseType,
      weight: suggestedWeight,
      targetReps: 10, // TODO: prendere da preferenze
      completedReps: currentSetReps.length,
      reps: currentSetReps,
      averageQuality: avgQuality,
      restTime: 90, // TODO: tracciare tempo riposo reale
      notes: ''
    }
    
    // Salva nel DataManager
    addSet(setData)
    
    // Reset per prossimo set
    setCurrentSetNumber(prev => prev + 1)
    setRepCount(0)
    setCurrentSetReps([])
    setBestDepth(0)
    setCurrentDepth(0)
  }

  const handleEndWorkout = () => {
    handleStop()
    
    // Termina sessione nel DataManager
    if (hasActiveSession) {
      endWorkout(`Sessione completata - ${setsCompleted} set, ${totalRepsFromSession} reps totali`)
    }
  }

  const handleReset = () => {
    setRepCount(0)
    setCurrentSetReps([])
    setIsInRep(false)
    minDepthReachedRef.current = 180
    setBestDepth(0)
    setCurrentDepth(0)
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
    if (viewOrientation === 'unknown') {
      return '❓ Posizionati meglio per analisi'
    }
    
    if (isInRep) {
      return '💪 Continua così!'
    }
    
    switch (exerciseType) {
      case 'squat':
        if (angles.primary > 160) return '📏 Scendi di più!'
        if (angles.primary > 120) return '⬇️ Continua a scendere'
        if (angles.primary > 90) return '✅ Quasi parallelo!'
        if (angles.primary > 70) return '🎯 Profondità perfetta!'
        return '⚠️ Troppo profondo'
        
      case 'bench-press':
        if (angles.primary > 160) return '💪 Scendi al petto!'
        if (angles.primary > 120) return '⬇️ Ancora un po\''
        if (angles.primary > 80) return '✅ Ottima profondità!'
        return '🎯 Perfetto!'
        
      case 'deadlift':
        if (angles.primary < 90) return '🏋️ Solleva!'
        if (angles.primary < 135) return '⬆️ Estendi le anche'
        if (angles.primary > 160) return '✅ Completo!'
        return '🎯 Ottimo movimento!'
        
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
              <span className="text-yellow-400">
                <ClockIcon className="w-4 h-4 inline mr-1" />
                {formatTime(sessionTime)}
              </span>
              {hasActiveSession && (
                <span className="text-blue-400">
                  Set {currentSetNumber}/{setsCompleted + 1}
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex gap-2">
          {isActive && repCount > 0 && (
            <button
              onClick={handleReset}
              className="p-1.5 rounded bg-orange-600"
              title="Reset conteggio"
            >
              <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          <button
            onClick={() => {
              toggleMute()
              updatePreferences({ audioEnabled: !isMuted })
            }}
            className={`p-1.5 rounded ${isMuted ? 'bg-red-600' : 'bg-green-600'}`}
          >
            {isMuted ? (
              <SpeakerXMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <SpeakerWaveIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>
      </div>

      {/* View Warning Banner */}
      {viewWarning && isActive && (
        <div className={`px-3 py-1 text-xs sm:text-sm font-medium text-center ${
          viewWarning.includes('✅') ? 'bg-green-600 text-white' :
          viewWarning.includes('⚠️') ? 'bg-yellow-500 text-black' :
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
        {isActive && isStreamActive && showMetrics && (
          <>
            {/* Rep Counter Card */}
            {repCount > 0 && (
              <div className="absolute top-2 right-2 bg-black/80 text-white p-3 rounded-lg min-w-[120px]">
                <div className="text-4xl sm:text-5xl font-bold text-yellow-400 text-center">
                  {repCount}
                </div>
                <div className="text-xs text-center mt-1">RIPETIZIONI</div>
                {repQuality === 'perfect' && (
                  <div className="text-xs text-green-400 text-center mt-1">
                    ⭐ PERFETTA!
                  </div>
                )}
                {avgRepDuration > 0 && (
                  <div className="text-xs text-gray-400 text-center mt-2">
                    Media: {avgRepDuration.toFixed(1)}s
                  </div>
                )}
                {bestDepth > 0 && bestDepth < 180 && (
                  <div className="text-xs text-blue-400 text-center">
                    Best: {bestDepth}°
                  </div>
                )}
              </div>
            )}
            
            {/* Stats Panel */}
            <div className="absolute top-2 left-2 bg-black/70 text-white p-2 rounded-lg text-xs">
              <div className="flex flex-col gap-1">
                <div>
                  {getPrimaryAngleLabel()}: <span className="font-bold text-yellow-400">{angles.primary}°</span>
                </div>
                {isInRep && (
                  <div className="text-green-400">
                    <CheckCircleIcon className="w-3 h-3 inline mr-1" />
                    IN REP
                  </div>
                )}
                <div>
                  Peso: <span className="font-bold">{suggestedWeight}kg</span>
                </div>
              </div>
            </div>
            
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
        <div className="flex justify-center gap-2 mb-2">
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
            <>
              {currentSetReps.length > 0 && (
                <button
                  onClick={handleCompleteSet}
                  className="bg-green-600 text-white px-4 py-3 rounded-lg font-medium text-sm sm:text-base flex items-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Completa Set
                </button>
              )}
              <button
                onClick={handleEndWorkout}
                className="bg-red-600 text-white px-4 py-3 rounded-lg font-medium text-sm sm:text-base flex items-center gap-2"
              >
                <StopIcon className="w-5 h-5" />
                Termina
              </button>
            </>
          )}
        </div>

        {/* Session Info */}
        <div className="bg-blue-50 rounded-lg p-2 text-xs">
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <div className="font-semibold text-gray-600">SET</div>
              <div className="text-lg font-bold text-blue-600">{setsCompleted}</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-600">REPS TOT</div>
              <div className="text-lg font-bold text-green-600">{totalRepsFromSession}</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-600">VOLUME</div>
              <div className="text-lg font-bold text-purple-600">{volumeLifted}kg</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-600">PESO</div>
              <div className="text-lg font-bold text-orange-600">{suggestedWeight}kg</div>
            </div>
          </div>
        </div>

        {/* Settings Quick Access */}
        <div className="flex justify-between items-center mt-2 text-xs">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={showSkeleton}
              onChange={(e) => {
                updatePreferences({ showSkeleton: e.target.checked })
              }}
              className="w-4 h-4"
            />
            <span>Mostra skeleton</span>
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={showMetrics}
              onChange={(e) => {
                updatePreferences({ showMetrics: e.target.checked })
              }}
              className="w-4 h-4"
            />
            <span>Mostra metriche</span>
          </label>
        </div>
      </div>
    </div>
  )
}