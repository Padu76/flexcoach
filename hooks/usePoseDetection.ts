// hooks/usePoseDetection.ts - Sistema di tracking reale pose con MediaPipe

import { useRef, useEffect, useState, useCallback } from 'react'
import { Camera } from '@mediapipe/camera_utils'
import { Pose, Results, POSE_CONNECTIONS } from '@mediapipe/pose'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'

// Types
export interface PosePoint {
  x: number
  y: number
  z: number
  visibility: number
}

export interface JointAngles {
  leftKnee: number
  rightKnee: number
  leftHip: number
  rightHip: number
  leftElbow: number
  rightElbow: number
  leftShoulder: number
  rightShoulder: number
  spine: number
  neckAngle: number
}

export interface MovementMetrics {
  depth: number // 0-100, profondità movimento
  symmetry: number // 0-100, simmetria bilaterale
  stability: number // 0-100, stabilità postura
  velocity: number // velocità movimento
  range: number // range of motion
}

export interface ExercisePhase {
  phase: 'ready' | 'eccentric' | 'bottom' | 'concentric' | 'top' | 'completed'
  confidence: number // 0-1, confidenza nella fase rilevata
}

export interface FormAnalysis {
  score: number // 0-100
  issues: FormIssue[]
  corrections: string[]
}

export interface FormIssue {
  joint: string
  problem: string
  severity: 'minor' | 'moderate' | 'severe'
  angle?: number
  expectedRange?: [number, number]
}

export interface RepData {
  count: number
  phase: ExercisePhase
  quality: 'perfect' | 'good' | 'fair' | 'poor'
  duration: number
  timestamp: number
  angles: JointAngles
  metrics: MovementMetrics
}

type ExerciseType = 'squat' | 'bench-press' | 'deadlift'

interface UsePoseDetectionOptions {
  exerciseType: ExerciseType
  onRepComplete?: (rep: RepData) => void
  onPhaseChange?: (phase: ExercisePhase) => void
  onFormIssue?: (issue: FormIssue) => void
  drawSkeleton?: boolean
  minConfidence?: number
}

// Landmark indices MediaPipe
const LANDMARKS = {
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
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT: 31,
  RIGHT_FOOT: 32
}

export const usePoseDetection = ({
  exerciseType,
  onRepComplete,
  onPhaseChange,
  onFormIssue,
  drawSkeleton = true,
  minConfidence = 0.5
}: UsePoseDetectionOptions) => {
  // Stati
  const [isLoading, setIsLoading] = useState(true)
  const [isTracking, setIsTracking] = useState(false)
  const [currentPose, setCurrentPose] = useState<PosePoint[] | null>(null)
  const [currentAngles, setCurrentAngles] = useState<JointAngles | null>(null)
  const [currentMetrics, setCurrentMetrics] = useState<MovementMetrics | null>(null)
  const [currentPhase, setCurrentPhase] = useState<ExercisePhase>({ phase: 'ready', confidence: 0 })
  const [repCount, setRepCount] = useState(0)
  const [formAnalysis, setFormAnalysis] = useState<FormAnalysis>({ score: 100, issues: [], corrections: [] })
  
  // Refs
  const poseRef = useRef<Pose | null>(null)
  const cameraRef = useRef<Camera | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number>()
  
  // Tracking state
  const phaseHistoryRef = useRef<ExercisePhase[]>([])
  const angleHistoryRef = useRef<JointAngles[]>([])
  const metricsHistoryRef = useRef<MovementMetrics[]>([])
  const repStartTimeRef = useRef<number>(0)
  const lastPhaseRef = useRef<ExercisePhase['phase']>('ready')
  const lowestPointRef = useRef<number>(0)
  const highestPointRef = useRef<number>(100)
  
  // Calcola angolo tra 3 punti
  const calculateAngle = (p1: PosePoint, p2: PosePoint, p3: PosePoint): number => {
    const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x)
    let angle = Math.abs(radians * 180 / Math.PI)
    if (angle > 180) angle = 360 - angle
    return angle
  }
  
  // Calcola distanza tra 2 punti
  const calculateDistance = (p1: PosePoint, p2: PosePoint): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  }
  
  // Calcola tutti gli angoli delle articolazioni
  const calculateJointAngles = (landmarks: PosePoint[]): JointAngles => {
    return {
      leftKnee: calculateAngle(
        landmarks[LANDMARKS.LEFT_HIP],
        landmarks[LANDMARKS.LEFT_KNEE],
        landmarks[LANDMARKS.LEFT_ANKLE]
      ),
      rightKnee: calculateAngle(
        landmarks[LANDMARKS.RIGHT_HIP],
        landmarks[LANDMARKS.RIGHT_KNEE],
        landmarks[LANDMARKS.RIGHT_ANKLE]
      ),
      leftHip: calculateAngle(
        landmarks[LANDMARKS.LEFT_SHOULDER],
        landmarks[LANDMARKS.LEFT_HIP],
        landmarks[LANDMARKS.LEFT_KNEE]
      ),
      rightHip: calculateAngle(
        landmarks[LANDMARKS.RIGHT_SHOULDER],
        landmarks[LANDMARKS.RIGHT_HIP],
        landmarks[LANDMARKS.RIGHT_KNEE]
      ),
      leftElbow: calculateAngle(
        landmarks[LANDMARKS.LEFT_SHOULDER],
        landmarks[LANDMARKS.LEFT_ELBOW],
        landmarks[LANDMARKS.LEFT_WRIST]
      ),
      rightElbow: calculateAngle(
        landmarks[LANDMARKS.RIGHT_SHOULDER],
        landmarks[LANDMARKS.RIGHT_ELBOW],
        landmarks[LANDMARKS.RIGHT_WRIST]
      ),
      leftShoulder: calculateAngle(
        landmarks[LANDMARKS.LEFT_ELBOW],
        landmarks[LANDMARKS.LEFT_SHOULDER],
        landmarks[LANDMARKS.LEFT_HIP]
      ),
      rightShoulder: calculateAngle(
        landmarks[LANDMARKS.RIGHT_ELBOW],
        landmarks[LANDMARKS.RIGHT_SHOULDER],
        landmarks[LANDMARKS.RIGHT_HIP]
      ),
      spine: calculateAngle(
        landmarks[LANDMARKS.NOSE],
        landmarks[LANDMARKS.LEFT_HIP],
        landmarks[LANDMARKS.LEFT_KNEE]
      ),
      neckAngle: calculateAngle(
        landmarks[LANDMARKS.NOSE],
        landmarks[LANDMARKS.LEFT_SHOULDER],
        landmarks[LANDMARKS.LEFT_HIP]
      )
    }
  }
  
  // Calcola metriche del movimento
  const calculateMovementMetrics = (landmarks: PosePoint[], angles: JointAngles): MovementMetrics => {
    // Profondità basata su posizione verticale delle anche
    const hipY = (landmarks[LANDMARKS.LEFT_HIP].y + landmarks[LANDMARKS.RIGHT_HIP].y) / 2
    const depth = Math.min(100, Math.max(0, hipY * 100))
    
    // Simmetria tra lato sinistro e destro
    const kneeDiff = Math.abs(angles.leftKnee - angles.rightKnee)
    const hipDiff = Math.abs(angles.leftHip - angles.rightHip)
    const symmetry = Math.max(0, 100 - (kneeDiff + hipDiff) / 2)
    
    // Stabilità basata su deviazione standard delle ultime posizioni
    const recentMetrics = metricsHistoryRef.current.slice(-10)
    const depthVariance = recentMetrics.length > 1
      ? Math.sqrt(recentMetrics.reduce((sum, m) => sum + Math.pow(m.depth - depth, 2), 0) / recentMetrics.length)
      : 0
    const stability = Math.max(0, 100 - depthVariance * 10)
    
    // Velocità del movimento
    const velocity = recentMetrics.length > 1
      ? Math.abs(depth - recentMetrics[recentMetrics.length - 1].depth)
      : 0
    
    // Range of motion
    const range = Math.abs(highestPointRef.current - lowestPointRef.current)
    
    return { depth, symmetry, stability, velocity, range }
  }
  
  // Analizza la forma per ogni esercizio
  const analyzeForm = (angles: JointAngles, metrics: MovementMetrics, phase: ExercisePhase['phase']): FormAnalysis => {
    const issues: FormIssue[] = []
    const corrections: string[] = []
    let score = 100
    
    switch (exerciseType) {
      case 'squat':
        // Controllo profondità
        if (phase === 'bottom' && angles.leftKnee > 100 && angles.rightKnee > 100) {
          issues.push({
            joint: 'ginocchia',
            problem: 'Profondità insufficiente',
            severity: 'moderate',
            angle: (angles.leftKnee + angles.rightKnee) / 2,
            expectedRange: [80, 95]
          })
          corrections.push('Scendi più in basso, anche sotto le ginocchia')
          score -= 15
        }
        
        // Controllo ginocchia valghe
        if (metrics.symmetry < 70) {
          issues.push({
            joint: 'ginocchia',
            problem: 'Ginocchia non allineate',
            severity: 'moderate'
          })
          corrections.push('Spingi le ginocchia verso l\'esterno')
          score -= 20
        }
        
        // Controllo schiena
        if (angles.spine < 140) {
          issues.push({
            joint: 'schiena',
            problem: 'Schiena troppo curva',
            severity: 'severe',
            angle: angles.spine,
            expectedRange: [160, 180]
          })
          corrections.push('Mantieni il petto in fuori e la schiena dritta')
          score -= 30
        }
        break
        
      case 'bench-press':
        // Controllo gomiti
        if (phase === 'bottom' && (angles.leftElbow < 70 || angles.rightElbow < 70)) {
          issues.push({
            joint: 'gomiti',
            problem: 'Gomiti troppo aperti',
            severity: 'moderate',
            angle: (angles.leftElbow + angles.rightElbow) / 2,
            expectedRange: [75, 90]
          })
          corrections.push('Mantieni i gomiti a 45° dal corpo')
          score -= 15
        }
        
        // Controllo spalle
        if (angles.leftShoulder > 90 || angles.rightShoulder > 90) {
          issues.push({
            joint: 'spalle',
            problem: 'Spalle troppo elevate',
            severity: 'minor'
          })
          corrections.push('Tieni le spalle basse e retratte')
          score -= 10
        }
        break
        
      case 'deadlift':
        // Controllo schiena neutra
        if (angles.spine < 150) {
          issues.push({
            joint: 'schiena',
            problem: 'Schiena arrotondata',
            severity: 'severe',
            angle: angles.spine,
            expectedRange: [170, 180]
          })
          corrections.push('ATTENZIONE! Mantieni la schiena completamente neutra')
          score -= 40
        }
        
        // Controllo anche
        if (phase === 'bottom' && angles.leftHip > 120 && angles.rightHip > 120) {
          issues.push({
            joint: 'anche',
            problem: 'Anche troppo alte',
            severity: 'moderate'
          })
          corrections.push('Abbassa le anche all\'inizio del movimento')
          score -= 15
        }
        break
    }
    
    // Controllo stabilità generale
    if (metrics.stability < 60) {
      issues.push({
        joint: 'corpo',
        problem: 'Movimento instabile',
        severity: 'minor'
      })
      corrections.push('Mantieni il controllo durante tutto il movimento')
      score -= 10
    }
    
    return {
      score: Math.max(0, score),
      issues,
      corrections
    }
  }
  
  // Determina la fase del movimento
  const detectMovementPhase = (angles: JointAngles, metrics: MovementMetrics): ExercisePhase => {
    let phase: ExercisePhase['phase'] = currentPhase.phase
    let confidence = 0
    
    const getThresholds = () => {
      switch (exerciseType) {
        case 'squat':
          return {
            topKneeAngle: 160,
            bottomKneeAngle: 90,
            topDepth: 30,
            bottomDepth: 70
          }
        case 'bench-press':
          return {
            topElbowAngle: 160,
            bottomElbowAngle: 90,
            topDepth: 20,
            bottomDepth: 80
          }
        case 'deadlift':
          return {
            topHipAngle: 170,
            bottomHipAngle: 90,
            topDepth: 20,
            bottomDepth: 75
          }
        default:
          return {
            topKneeAngle: 160,
            bottomKneeAngle: 90,
            topDepth: 30,
            bottomDepth: 70
          }
      }
    }
    
    const thresholds = getThresholds()
    const primaryAngle = exerciseType === 'squat' ? (angles.leftKnee + angles.rightKnee) / 2 :
                        exerciseType === 'bench-press' ? (angles.leftElbow + angles.rightElbow) / 2 :
                        (angles.leftHip + angles.rightHip) / 2
    
    // State machine per rilevamento fase
    switch (currentPhase.phase) {
      case 'ready':
        if (metrics.depth > thresholds.topDepth && metrics.velocity > 0.5) {
          phase = 'eccentric'
          confidence = 0.8
          repStartTimeRef.current = Date.now()
        }
        break
        
      case 'eccentric':
        if (metrics.depth > thresholds.bottomDepth || primaryAngle < thresholds.bottomKneeAngle) {
          phase = 'bottom'
          confidence = 0.9
          lowestPointRef.current = Math.max(lowestPointRef.current, metrics.depth)
        }
        break
        
      case 'bottom':
        if (metrics.velocity < -0.5 && metrics.depth < thresholds.bottomDepth - 5) {
          phase = 'concentric'
          confidence = 0.8
        }
        break
        
      case 'concentric':
        if (metrics.depth < thresholds.topDepth || primaryAngle > thresholds.topKneeAngle) {
          phase = 'top'
          confidence = 0.9
          highestPointRef.current = Math.min(highestPointRef.current, metrics.depth)
        }
        break
        
      case 'top':
        phase = 'completed'
        confidence = 1.0
        break
        
      case 'completed':
        // Completa la rep
        const duration = Date.now() - repStartTimeRef.current
        const quality = formAnalysis.score >= 90 ? 'perfect' :
                       formAnalysis.score >= 70 ? 'good' :
                       formAnalysis.score >= 50 ? 'fair' : 'poor'
        
        const repData: RepData = {
          count: repCount + 1,
          phase: currentPhase,
          quality,
          duration,
          timestamp: Date.now(),
          angles,
          metrics
        }
        
        setRepCount(prev => prev + 1)
        onRepComplete?.(repData)
        
        // Reset per prossima rep
        phase = 'ready'
        confidence = 0.5
        lowestPointRef.current = 0
        highestPointRef.current = 100
        break
    }
    
    return { phase, confidence }
  }
  
  // Processa risultati pose
  const onResults = useCallback((results: Results) => {
    if (!canvasRef.current || !videoRef.current) return
    
    const canvasCtx = canvasRef.current.getContext('2d')
    if (!canvasCtx) return
    
    // Clear canvas
    canvasCtx.save()
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    
    // Draw video frame
    canvasCtx.drawImage(
      results.image,
      0, 0,
      canvasRef.current.width,
      canvasRef.current.height
    )
    
    if (results.poseLandmarks) {
      // Converti landmarks in PosePoint[]
      const landmarks: PosePoint[] = results.poseLandmarks.map(lm => ({
        x: lm.x,
        y: lm.y,
        z: lm.z || 0,
        visibility: lm.visibility || 0
      }))
      
      // Filtra per confidenza minima
      const avgVisibility = landmarks.reduce((sum, p) => sum + p.visibility, 0) / landmarks.length
      if (avgVisibility < minConfidence) {
        canvasCtx.restore()
        return
      }
      
      // Disegna skeleton se richiesto
      if (drawSkeleton) {
        // Connessioni
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 2
        })
        
        // Landmarks
        drawLandmarks(canvasCtx, results.poseLandmarks, {
          color: '#FF0000',
          lineWidth: 1,
          radius: 3,
          fillColor: '#FFFF00'
        })
      }
      
      // Calcola angoli e metriche
      const angles = calculateJointAngles(landmarks)
      const metrics = calculateMovementMetrics(landmarks, angles)
      
      // Analizza forma
      const form = analyzeForm(angles, metrics, currentPhase.phase)
      
      // Rileva fase movimento
      const newPhase = detectMovementPhase(angles, metrics)
      
      // Aggiorna stati
      setCurrentPose(landmarks)
      setCurrentAngles(angles)
      setCurrentMetrics(metrics)
      setFormAnalysis(form)
      
      // Notifica cambio fase
      if (newPhase.phase !== currentPhase.phase) {
        setCurrentPhase(newPhase)
        onPhaseChange?.(newPhase)
        lastPhaseRef.current = newPhase.phase
      }
      
      // Notifica problemi di forma
      form.issues.forEach(issue => {
        if (issue.severity === 'severe') {
          onFormIssue?.(issue)
        }
      })
      
      // Aggiungi a history
      angleHistoryRef.current.push(angles)
      metricsHistoryRef.current.push(metrics)
      phaseHistoryRef.current.push(newPhase)
      
      // Mantieni solo ultimi 100 frame
      if (angleHistoryRef.current.length > 100) {
        angleHistoryRef.current.shift()
        metricsHistoryRef.current.shift()
        phaseHistoryRef.current.shift()
      }
      
      // Disegna overlay informazioni
      if (drawSkeleton) {
        // Background per testo
        canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        canvasCtx.fillRect(10, 10, 250, 120)
        
        // Testo info
        canvasCtx.fillStyle = '#FFFFFF'
        canvasCtx.font = '14px Arial'
        canvasCtx.fillText(`Fase: ${newPhase.phase.toUpperCase()}`, 20, 30)
        canvasCtx.fillText(`Rep: ${repCount}`, 20, 50)
        canvasCtx.fillText(`Form Score: ${form.score}%`, 20, 70)
        canvasCtx.fillText(`Profondità: ${Math.round(metrics.depth)}%`, 20, 90)
        canvasCtx.fillText(`Simmetria: ${Math.round(metrics.symmetry)}%`, 20, 110)
        
        // Disegna angoli chiave
        const drawAngleArc = (point: PosePoint, angle: number, label: string) => {
          const x = point.x * canvasRef.current!.width
          const y = point.y * canvasRef.current!.height
          
          // Arco per visualizzare angolo
          canvasCtx.beginPath()
          canvasCtx.arc(x, y, 30, 0, (angle * Math.PI) / 180)
          canvasCtx.strokeStyle = angle > 90 ? '#00FF00' : '#FF0000'
          canvasCtx.lineWidth = 2
          canvasCtx.stroke()
          
          // Label
          canvasCtx.fillStyle = '#FFFFFF'
          canvasCtx.font = '12px Arial'
          canvasCtx.fillText(`${label}: ${Math.round(angle)}°`, x + 40, y)
        }
        
        // Mostra angoli principali basati su esercizio
        if (exerciseType === 'squat') {
          drawAngleArc(landmarks[LANDMARKS.LEFT_KNEE], angles.leftKnee, 'Knee')
          drawAngleArc(landmarks[LANDMARKS.LEFT_HIP], angles.leftHip, 'Hip')
        } else if (exerciseType === 'bench-press') {
          drawAngleArc(landmarks[LANDMARKS.LEFT_ELBOW], angles.leftElbow, 'Elbow')
          drawAngleArc(landmarks[LANDMARKS.LEFT_SHOULDER], angles.leftShoulder, 'Shoulder')
        } else if (exerciseType === 'deadlift') {
          drawAngleArc(landmarks[LANDMARKS.LEFT_HIP], angles.leftHip, 'Hip')
        }
        
        // Disegna correzioni se ci sono problemi
        if (form.corrections.length > 0) {
          canvasCtx.fillStyle = 'rgba(255, 0, 0, 0.7)'
          canvasCtx.fillRect(10, canvasRef.current.height - 80, canvasRef.current.width - 20, 70)
          canvasCtx.fillStyle = '#FFFFFF'
          canvasCtx.font = 'bold 16px Arial'
          canvasCtx.fillText('⚠️ CORREZIONI:', 20, canvasRef.current.height - 55)
          canvasCtx.font = '14px Arial'
          form.corrections.slice(0, 2).forEach((correction, i) => {
            canvasCtx.fillText(correction, 20, canvasRef.current.height - 35 + i * 20)
          })
        }
      }
    }
    
    canvasCtx.restore()
  }, [exerciseType, currentPhase, repCount, formAnalysis, minConfidence, drawSkeleton, onRepComplete, onPhaseChange, onFormIssue])
  
  // Inizializza MediaPipe Pose
  const initializePose = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return
    
    try {
      setIsLoading(true)
      
      // Crea istanza Pose
      poseRef.current = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        }
      })
      
      // Configura Pose
      await poseRef.current.setOptions({
        modelComplexity: 1, // 0, 1, or 2. Higher = more accurate but slower
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      })
      
      // Set callback
      poseRef.current.onResults(onResults)
      
      // Inizializza camera
      cameraRef.current = new Camera(videoRef.current, {
        onFrame: async () => {
          if (poseRef.current && videoRef.current) {
            await poseRef.current.send({ image: videoRef.current })
          }
        },
        width: 1280,
        height: 720
      })
      
      setIsLoading(false)
    } catch (error) {
      console.error('Error initializing pose detection:', error)
      setIsLoading(false)
    }
  }, [onResults])
  
  // Start tracking
  const startTracking = useCallback(async () => {
    if (!cameraRef.current || !poseRef.current) {
      await initializePose()
    }
    
    if (cameraRef.current) {
      await cameraRef.current.start()
      setIsTracking(true)
      setRepCount(0)
      setCurrentPhase({ phase: 'ready', confidence: 0 })
      angleHistoryRef.current = []
      metricsHistoryRef.current = []
      phaseHistoryRef.current = []
    }
  }, [initializePose])
  
  // Stop tracking
  const stopTracking = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop()
      setIsTracking(false)
    }
  }, [])
  
  // Reset counters
  const resetTracking = useCallback(() => {
    setRepCount(0)
    setCurrentPhase({ phase: 'ready', confidence: 0 })
    setFormAnalysis({ score: 100, issues: [], corrections: [] })
    angleHistoryRef.current = []
    metricsHistoryRef.current = []
    phaseHistoryRef.current = []
    lowestPointRef.current = 0
    highestPointRef.current = 100
  }, [])
  
  // Setup video e canvas refs
  const setupVideoElement = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video
    if (video) {
      video.style.display = 'none' // Nasconde video, mostra solo canvas
    }
  }, [])
  
  const setupCanvasElement = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas
  }, [])
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])
  
  return {
    // Refs per elementi DOM
    setupVideoElement,
    setupCanvasElement,
    
    // Controlli
    startTracking,
    stopTracking,
    resetTracking,
    
    // Stati
    isLoading,
    isTracking,
    repCount,
    currentPhase,
    currentPose,
    currentAngles,
    currentMetrics,
    formAnalysis,
    
    // Utils
    initializePose
  }
}