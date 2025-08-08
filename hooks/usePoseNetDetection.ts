// hooks/usePoseNetDetection.ts - Tracking reale pose con TensorFlow.js PoseNet via CDN

import { useRef, useEffect, useState, useCallback } from 'react'

// Types per PoseNet
interface Keypoint {
  position: { x: number; y: number }
  score: number
  part: string
}

interface Pose {
  keypoints: Keypoint[]
  score: number
}

// Window con librerie caricate da CDN
interface WindowWithPoseNet extends Window {
  posenet?: any
  tf?: any
}

// Types nostri
export interface JointAngles {
  leftKnee: number
  rightKnee: number
  leftHip: number
  rightHip: number
  leftElbow: number
  rightElbow: number
  spine: number
}

export interface MovementMetrics {
  depth: number // 0-100
  symmetry: number // 0-100
  stability: number // 0-100
  velocity: number
}

export interface ExercisePhase {
  phase: 'ready' | 'descending' | 'bottom' | 'ascending' | 'top'
  confidence: number
}

export interface FormAnalysis {
  score: number // 0-100
  issues: string[]
  corrections: string[]
}

export interface RepData {
  count: number
  quality: 'perfect' | 'good' | 'fair' | 'poor'
  duration: number
  angles: JointAngles
}

type ExerciseType = 'squat' | 'bench-press' | 'deadlift'

interface UsePoseNetOptions {
  exerciseType: ExerciseType
  onRepComplete?: (rep: RepData) => void
  onPhaseChange?: (phase: ExercisePhase) => void
  minConfidence?: number
}

// Mappa parti corpo PoseNet
const KEYPOINTS = {
  nose: 0,
  leftEye: 1,
  rightEye: 2,
  leftEar: 3,
  rightEar: 4,
  leftShoulder: 5,
  rightShoulder: 6,
  leftElbow: 7,
  rightElbow: 8,
  leftWrist: 9,
  rightWrist: 10,
  leftHip: 11,
  rightHip: 12,
  leftKnee: 13,
  rightKnee: 14,
  leftAnkle: 15,
  rightAnkle: 16
}

export const usePoseNetDetection = ({
  exerciseType,
  onRepComplete,
  onPhaseChange,
  minConfidence = 0.3
}: UsePoseNetOptions) => {
  // Stati
  const [isLoading, setIsLoading] = useState(true)
  const [isTracking, setIsTracking] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const [currentAngles, setCurrentAngles] = useState<JointAngles | null>(null)
  const [currentMetrics, setCurrentMetrics] = useState<MovementMetrics | null>(null)
  const [currentPhase, setCurrentPhase] = useState<ExercisePhase>({ phase: 'ready', confidence: 0 })
  const [repCount, setRepCount] = useState(0)
  const [formAnalysis, setFormAnalysis] = useState<FormAnalysis>({ score: 100, issues: [], corrections: [] })
  
  // Refs
  const netRef = useRef<any>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationIdRef = useRef<number>()
  
  // Tracking state
  const phaseHistoryRef = useRef<ExercisePhase['phase'][]>([])
  const metricsHistoryRef = useRef<MovementMetrics[]>([])
  const repStartTimeRef = useRef<number>(0)
  const lastPhaseRef = useRef<ExercisePhase['phase']>('ready')
  const lowestPointRef = useRef<number>(0)
  const baselineHipY = useRef<number | null>(null)
  
  // Carica script da CDN
  const loadScripts = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      const win = window as WindowWithPoseNet
      
      // Se già caricati
      if (win.tf && win.posenet) {
        resolve()
        return
      }
      
      // Carica TensorFlow.js
      const tfScript = document.createElement('script')
      tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.11.0/dist/tf.min.js'
      tfScript.async = true
      
      tfScript.onload = () => {
        // Carica PoseNet
        const poseScript = document.createElement('script')
        poseScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/posenet@2.2.2/dist/posenet.min.js'
        poseScript.async = true
        
        poseScript.onload = () => {
          console.log('✅ TensorFlow.js e PoseNet caricati')
          resolve()
        }
        
        poseScript.onerror = reject
        document.head.appendChild(poseScript)
      }
      
      tfScript.onerror = reject
      document.head.appendChild(tfScript)
    })
  }, [])
  
  // Calcola angolo tra 3 punti
  const calculateAngle = (p1: Keypoint, p2: Keypoint, p3: Keypoint): number => {
    if (p1.score < minConfidence || p2.score < minConfidence || p3.score < minConfidence) {
      return 0
    }
    
    const radians = Math.atan2(p3.position.y - p2.position.y, p3.position.x - p2.position.x) - 
                   Math.atan2(p1.position.y - p2.position.y, p1.position.x - p2.position.x)
    let angle = Math.abs(radians * 180 / Math.PI)
    if (angle > 180) angle = 360 - angle
    return angle
  }
  
  // Calcola angoli articolazioni
  const calculateJointAngles = (keypoints: Keypoint[]): JointAngles | null => {
    // Verifica che i punti chiave abbiano confidenza sufficiente
    const requiredPoints = [
      KEYPOINTS.leftShoulder, KEYPOINTS.leftHip, KEYPOINTS.leftKnee, KEYPOINTS.leftAnkle,
      KEYPOINTS.rightShoulder, KEYPOINTS.rightHip, KEYPOINTS.rightKnee, KEYPOINTS.rightAnkle
    ]
    
    const allPointsValid = requiredPoints.every(idx => keypoints[idx].score >= minConfidence)
    if (!allPointsValid) return null
    
    return {
      leftKnee: calculateAngle(
        keypoints[KEYPOINTS.leftHip],
        keypoints[KEYPOINTS.leftKnee],
        keypoints[KEYPOINTS.leftAnkle]
      ),
      rightKnee: calculateAngle(
        keypoints[KEYPOINTS.rightHip],
        keypoints[KEYPOINTS.rightKnee],
        keypoints[KEYPOINTS.rightAnkle]
      ),
      leftHip: calculateAngle(
        keypoints[KEYPOINTS.leftShoulder],
        keypoints[KEYPOINTS.leftHip],
        keypoints[KEYPOINTS.leftKnee]
      ),
      rightHip: calculateAngle(
        keypoints[KEYPOINTS.rightShoulder],
        keypoints[KEYPOINTS.rightHip],
        keypoints[KEYPOINTS.rightKnee]
      ),
      leftElbow: calculateAngle(
        keypoints[KEYPOINTS.leftShoulder],
        keypoints[KEYPOINTS.leftElbow],
        keypoints[KEYPOINTS.leftWrist]
      ),
      rightElbow: calculateAngle(
        keypoints[KEYPOINTS.rightShoulder],
        keypoints[KEYPOINTS.rightElbow],
        keypoints[KEYPOINTS.rightWrist]
      ),
      spine: calculateAngle(
        keypoints[KEYPOINTS.nose],
        keypoints[KEYPOINTS.leftHip],
        keypoints[KEYPOINTS.leftKnee]
      )
    }
  }
  
  // Calcola metriche movimento
  const calculateMovementMetrics = (keypoints: Keypoint[], angles: JointAngles): MovementMetrics => {
    // Calcola profondità basata su posizione Y delle anche
    const hipY = (keypoints[KEYPOINTS.leftHip].position.y + keypoints[KEYPOINTS.rightHip].position.y) / 2
    
    // Inizializza baseline alla prima lettura
    if (baselineHipY.current === null) {
      baselineHipY.current = hipY
    }
    
    // Calcola depth relativa al baseline (0 = alto, 100 = basso)
    const relativeDepth = ((hipY - baselineHipY.current) / baselineHipY.current) * 100
    const depth = Math.max(0, Math.min(100, relativeDepth + 50)) // Normalizza 0-100
    
    // Simmetria
    const kneeDiff = Math.abs(angles.leftKnee - angles.rightKnee)
    const hipDiff = Math.abs(angles.leftHip - angles.rightHip)
    const symmetry = Math.max(0, 100 - (kneeDiff + hipDiff) / 2)
    
    // Stabilità
    const recentMetrics = metricsHistoryRef.current.slice(-10)
    let stability = 100
    if (recentMetrics.length > 1) {
      const depthVariance = recentMetrics.reduce((sum, m) => sum + Math.abs(m.depth - depth), 0) / recentMetrics.length
      stability = Math.max(0, 100 - depthVariance * 2)
    }
    
    // Velocità
    const velocity = recentMetrics.length > 0 
      ? depth - recentMetrics[recentMetrics.length - 1].depth
      : 0
    
    return { depth, symmetry, stability, velocity }
  }
  
  // Analizza forma
  const analyzeForm = (angles: JointAngles, metrics: MovementMetrics, phase: ExercisePhase['phase']): FormAnalysis => {
    const issues: string[] = []
    const corrections: string[] = []
    let score = 100
    
    switch (exerciseType) {
      case 'squat':
        // Profondità
        if (phase === 'bottom' && angles.leftKnee > 100 && angles.rightKnee > 100) {
          issues.push('Profondità insufficiente')
          corrections.push('Scendi fino a che le anche sono sotto le ginocchia')
          score -= 20
        }
        
        // Simmetria
        if (metrics.symmetry < 70) {
          issues.push('Movimento asimmetrico')
          corrections.push('Mantieni il peso distribuito equamente')
          score -= 15
        }
        
        // Schiena
        if (angles.spine < 140) {
          issues.push('Schiena troppo curva')
          corrections.push('Tieni il petto in fuori e la schiena dritta')
          score -= 25
        }
        break
        
      case 'bench-press':
        // Gomiti
        if (phase === 'bottom' && (angles.leftElbow < 70 || angles.rightElbow < 70)) {
          issues.push('Gomiti troppo aperti')
          corrections.push('Mantieni i gomiti a 45° dal corpo')
          score -= 20
        }
        break
        
      case 'deadlift':
        // Schiena
        if (angles.spine < 150) {
          issues.push('Schiena arrotondata - PERICOLO!')
          corrections.push('FERMATI! Mantieni la schiena neutra')
          score -= 40
        }
        
        // Anche
        if (phase === 'bottom' && angles.leftHip > 120 && angles.rightHip > 120) {
          issues.push('Anche troppo alte')
          corrections.push('Abbassa di più le anche all\'inizio')
          score -= 15
        }
        break
    }
    
    // Stabilità generale
    if (metrics.stability < 60) {
      issues.push('Movimento instabile')
      corrections.push('Controlla meglio il movimento')
      score -= 10
    }
    
    return {
      score: Math.max(0, score),
      issues,
      corrections
    }
  }
  
  // Rileva fase movimento
  const detectMovementPhase = (angles: JointAngles, metrics: MovementMetrics): ExercisePhase => {
    let phase = currentPhase.phase
    let confidence = 0
    
    // Threshold per esercizio
    const getThresholds = () => {
      switch (exerciseType) {
        case 'squat':
          return { topAngle: 160, bottomAngle: 90, topDepth: 30, bottomDepth: 70 }
        case 'bench-press':
          return { topAngle: 160, bottomAngle: 90, topDepth: 20, bottomDepth: 80 }
        case 'deadlift':
          return { topAngle: 170, bottomAngle: 90, topDepth: 20, bottomDepth: 75 }
        default:
          return { topAngle: 160, bottomAngle: 90, topDepth: 30, bottomDepth: 70 }
      }
    }
    
    const thresholds = getThresholds()
    const primaryAngle = exerciseType === 'squat' ? (angles.leftKnee + angles.rightKnee) / 2 :
                        exerciseType === 'bench-press' ? (angles.leftElbow + angles.rightElbow) / 2 :
                        (angles.leftHip + angles.rightHip) / 2
    
    // State machine
    switch (currentPhase.phase) {
      case 'ready':
        if (metrics.velocity > 1 && metrics.depth > thresholds.topDepth) {
          phase = 'descending'
          confidence = 0.8
          repStartTimeRef.current = Date.now()
        }
        break
        
      case 'descending':
        if (metrics.depth > thresholds.bottomDepth || primaryAngle < thresholds.bottomAngle) {
          phase = 'bottom'
          confidence = 0.9
          lowestPointRef.current = Math.max(lowestPointRef.current, metrics.depth)
        }
        break
        
      case 'bottom':
        if (metrics.velocity < -1) {
          phase = 'ascending'
          confidence = 0.8
        }
        break
        
      case 'ascending':
        if (metrics.depth < thresholds.topDepth || primaryAngle > thresholds.topAngle) {
          phase = 'top'
          confidence = 0.9
          
          // Completa rep
          const duration = Date.now() - repStartTimeRef.current
          const quality = formAnalysis.score >= 90 ? 'perfect' :
                         formAnalysis.score >= 70 ? 'good' :
                         formAnalysis.score >= 50 ? 'fair' : 'poor'
          
          const repData: RepData = {
            count: repCount + 1,
            quality,
            duration,
            angles
          }
          
          setRepCount(prev => prev + 1)
          onRepComplete?.(repData)
        }
        break
        
      case 'top':
        // Reset per prossima rep
        setTimeout(() => {
          setCurrentPhase({ phase: 'ready', confidence: 0.5 })
          lowestPointRef.current = 0
        }, 500)
        break
    }
    
    return { phase, confidence }
  }
  
  // Disegna skeleton e info
  const drawPose = (pose: Pose, ctx: CanvasRenderingContext2D, videoWidth: number, videoHeight: number) => {
    const keypoints = pose.keypoints
    
    // Disegna connessioni
    const connections = [
      // Testa
      [KEYPOINTS.nose, KEYPOINTS.leftEye],
      [KEYPOINTS.leftEye, KEYPOINTS.leftEar],
      [KEYPOINTS.nose, KEYPOINTS.rightEye],
      [KEYPOINTS.rightEye, KEYPOINTS.rightEar],
      // Corpo superiore
      [KEYPOINTS.leftShoulder, KEYPOINTS.rightShoulder],
      [KEYPOINTS.leftShoulder, KEYPOINTS.leftElbow],
      [KEYPOINTS.leftElbow, KEYPOINTS.leftWrist],
      [KEYPOINTS.rightShoulder, KEYPOINTS.rightElbow],
      [KEYPOINTS.rightElbow, KEYPOINTS.rightWrist],
      // Torso
      [KEYPOINTS.leftShoulder, KEYPOINTS.leftHip],
      [KEYPOINTS.rightShoulder, KEYPOINTS.rightHip],
      [KEYPOINTS.leftHip, KEYPOINTS.rightHip],
      // Gambe
      [KEYPOINTS.leftHip, KEYPOINTS.leftKnee],
      [KEYPOINTS.leftKnee, KEYPOINTS.leftAnkle],
      [KEYPOINTS.rightHip, KEYPOINTS.rightKnee],
      [KEYPOINTS.rightKnee, KEYPOINTS.rightAnkle]
    ]
    
    // Disegna linee
    ctx.strokeStyle = '#00FF00'
    ctx.lineWidth = 2
    
    connections.forEach(([start, end]) => {
      const kp1 = keypoints[start]
      const kp2 = keypoints[end]
      
      if (kp1.score > minConfidence && kp2.score > minConfidence) {
        ctx.beginPath()
        ctx.moveTo(kp1.position.x, kp1.position.y)
        ctx.lineTo(kp2.position.x, kp2.position.y)
        ctx.stroke()
      }
    })
    
    // Disegna punti
    keypoints.forEach(keypoint => {
      if (keypoint.score > minConfidence) {
        ctx.fillStyle = '#FF0000'
        ctx.beginPath()
        ctx.arc(keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI)
        ctx.fill()
      }
    })
    
    // Info overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(10, 10, 250, 140)
    
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '16px Arial'
    ctx.fillText(`Fase: ${currentPhase.phase.toUpperCase()}`, 20, 35)
    ctx.fillText(`Rep: ${repCount}`, 20, 60)
    ctx.fillText(`Form: ${formAnalysis.score}%`, 20, 85)
    if (currentMetrics) {
      ctx.fillText(`Depth: ${Math.round(currentMetrics.depth)}%`, 20, 110)
      ctx.fillText(`Simmetria: ${Math.round(currentMetrics.symmetry)}%`, 20, 135)
    }
    
    // Correzioni
    if (formAnalysis.corrections.length > 0) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'
      ctx.fillRect(10, videoHeight - 80, videoWidth - 20, 70)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 18px Arial'
      ctx.fillText('⚠️ CORREZIONI:', 20, videoHeight - 55)
      ctx.font = '16px Arial'
      formAnalysis.corrections.slice(0, 2).forEach((correction, i) => {
        ctx.fillText(correction, 20, videoHeight - 30 + i * 20)
      })
    }
  }
  
  // Loop di detection
  const detectPose = useCallback(async () => {
    if (!netRef.current || !videoRef.current || !canvasRef.current || !isTracking) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return
    
    // Detect pose
    const pose = await netRef.current.estimateSinglePose(video, {
      flipHorizontal: true,
      decodingMethod: 'single-person'
    })
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw video
    ctx.save()
    ctx.scale(-1, 1) // Mirror
    ctx.translate(-canvas.width, 0)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    ctx.restore()
    
    // Check confidence
    if (pose.score < minConfidence) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
      ctx.fillRect(0, 0, canvas.width, 50)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '20px Arial'
      ctx.fillText('⚠️ Posizione non rilevata - Assicurati di essere visibile', 20, 35)
      
      animationIdRef.current = requestAnimationFrame(detectPose)
      return
    }
    
    // Calcola angoli
    const angles = calculateJointAngles(pose.keypoints)
    if (!angles) {
      animationIdRef.current = requestAnimationFrame(detectPose)
      return
    }
    
    // Calcola metriche
    const metrics = calculateMovementMetrics(pose.keypoints, angles)
    
    // Analizza forma
    const form = analyzeForm(angles, metrics, currentPhase.phase)
    
    // Rileva fase
    const newPhase = detectMovementPhase(angles, metrics)
    
    // Aggiorna stati
    setCurrentAngles(angles)
    setCurrentMetrics(metrics)
    setFormAnalysis(form)
    
    if (newPhase.phase !== currentPhase.phase) {
      setCurrentPhase(newPhase)
      onPhaseChange?.(newPhase)
      lastPhaseRef.current = newPhase.phase
    }
    
    // Aggiungi a history
    metricsHistoryRef.current.push(metrics)
    phaseHistoryRef.current.push(newPhase.phase)
    
    // Mantieni solo ultimi 50 frame
    if (metricsHistoryRef.current.length > 50) {
      metricsHistoryRef.current.shift()
      phaseHistoryRef.current.shift()
    }
    
    // Disegna pose
    drawPose(pose, ctx, canvas.width, canvas.height)
    
    // Continua loop
    animationIdRef.current = requestAnimationFrame(detectPose)
  }, [isTracking, currentPhase, formAnalysis, repCount, currentMetrics, minConfidence, onPhaseChange])
  
  // Inizializza PoseNet
  const initializePoseNet = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Carica scripts
      await loadScripts()
      
      const win = window as WindowWithPoseNet
      if (!win.posenet) {
        throw new Error('PoseNet non caricato')
      }
      
      // Carica modello
      console.log('📦 Caricamento modello PoseNet...')
      netRef.current = await win.posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 640, height: 480 },
        multiplier: 0.75
      })
      
      console.log('✅ PoseNet pronto!')
      setModelReady(true)
      setIsLoading(false)
    } catch (error) {
      console.error('❌ Errore inizializzazione PoseNet:', error)
      setIsLoading(false)
    }
  }, [loadScripts])
  
  // Setup webcam
  const setupWebcam = useCallback(async () => {
    if (!videoRef.current) return
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      })
      
      videoRef.current.srcObject = stream
      
      return new Promise<void>((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            resolve()
          }
        }
      })
    } catch (error) {
      console.error('❌ Errore accesso webcam:', error)
    }
  }, [])
  
  // Start tracking
  const startTracking = useCallback(async () => {
    if (!modelReady) {
      await initializePoseNet()
    }
    
    if (!videoRef.current?.srcObject) {
      await setupWebcam()
    }
    
    setIsTracking(true)
    setRepCount(0)
    setCurrentPhase({ phase: 'ready', confidence: 0 })
    baselineHipY.current = null
    metricsHistoryRef.current = []
    phaseHistoryRef.current = []
    
    // Start detection loop
    detectPose()
  }, [modelReady, initializePoseNet, setupWebcam, detectPose])
  
  // Stop tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false)
    
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current)
    }
    
    // Stop webcam
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }, [])
  
  // Reset
  const resetTracking = useCallback(() => {
    setRepCount(0)
    setCurrentPhase({ phase: 'ready', confidence: 0 })
    setFormAnalysis({ score: 100, issues: [], corrections: [] })
    metricsHistoryRef.current = []
    phaseHistoryRef.current = []
    baselineHipY.current = null
  }, [])
  
  // Setup refs
  const setupVideoElement = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video
  }, [])
  
  const setupCanvasElement = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas
  }, [])
  
  // Initialize on mount
  useEffect(() => {
    initializePoseNet()
    
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [initializePoseNet])
  
  return {
    // Refs
    setupVideoElement,
    setupCanvasElement,
    
    // Controls
    startTracking,
    stopTracking,
    resetTracking,
    
    // States
    isLoading,
    isTracking,
    modelReady,
    repCount,
    currentPhase,
    currentAngles,
    currentMetrics,
    formAnalysis
  }
}