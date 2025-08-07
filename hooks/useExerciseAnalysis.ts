import { useState, useCallback, useRef } from 'react'
import type { 
  ExerciseType, 
  PoseAnalysisResult, 
  ExerciseFeedback, 
  FeedbackSeverity,
  Poselandmark 
} from '@/types'

interface UseExerciseAnalysisOptions {
  exerciseType: ExerciseType
  onRepCompleted?: (repCount: number) => void
  onFeedback?: (feedback: ExerciseFeedback) => void
  sensitivity?: 'low' | 'medium' | 'high'
}

interface UseExerciseAnalysisReturn {
  analysisResult: PoseAnalysisResult | null
  analyzePose: (landmarks: Poselandmark[]) => PoseAnalysisResult
  resetAnalysis: () => void
  getExerciseInstructions: () => string[]
}

export const useExerciseAnalysis = (options: UseExerciseAnalysisOptions): UseExerciseAnalysisReturn => {
  const [analysisResult, setAnalysisResult] = useState<PoseAnalysisResult | null>(null)
  
  // Stato per tracking delle ripetizioni
  const repStateRef = useRef({
    currentPhase: 'up' as 'up' | 'down' | 'transition',
    repCount: 0,
    isInExercise: false,
    lastPhaseChange: 0
  })

  // Configurazione sensibilità
  const sensitivityConfig = {
    low: { angleThreshold: 20, stabilityFrames: 10 },
    medium: { angleThreshold: 15, stabilityFrames: 7 },
    high: { angleThreshold: 10, stabilityFrames: 5 }
  }
  
  const config = sensitivityConfig[options.sensitivity || 'medium']

  // Utility: Calcola angolo tra tre punti
  const calculateAngle = useCallback((a: Poselandmark, b: Poselandmark, c: Poselandmark): number => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
    let angle = Math.abs(radians * 180.0 / Math.PI)
    if (angle > 180.0) angle = 360 - angle
    return angle
  }, [])

  // Analisi specifica per Squat
  const analyzeSquat = useCallback((landmarks: Poselandmark[]): PoseAnalysisResult => {
    const feedback: ExerciseFeedback[] = []
    let formScore = 100

    // Verifica che abbiamo tutti i landmark necessari
    if (landmarks.length < 33) {
      return {
        formScore: 0,
        feedback: [{
          severity: 'warning' as FeedbackSeverity,
          message: 'POSE INCOMPLETA',
          correction: 'Posizionati completamente davanti alla camera',
          priority: 1
        }],
        repCount: repStateRef.current.repCount,
        currentPhase: 'up',
        angles: {}
      }
    }

    // Punti chiave per squat
    const leftHip = landmarks[23]
    const leftKnee = landmarks[25]
    const leftAnkle = landmarks[27]
    const leftShoulder = landmarks[11]
    const rightHip = landmarks[24]
    const rightKnee = landmarks[26]
    const rightAnkle = landmarks[28]

    // Verifica che i landmark esistano
    if (!leftHip || !leftKnee || !leftAnkle || !leftShoulder || !rightHip || !rightKnee || !rightAnkle) {
      return {
        formScore: 0,
        feedback: [{
          severity: 'warning' as FeedbackSeverity,
          message: 'LANDMARKS MANCANTI',
          correction: 'Assicurati di essere completamente visibile',
          priority: 1
        }],
        repCount: repStateRef.current.repCount,
        currentPhase: 'up',
        angles: {}
      }
    }

    // Calcola angoli
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle)
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle)
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2

    // Determina fase del movimento
    let currentPhase: 'up' | 'down' | 'transition' = 'up'
    if (avgKneeAngle < 90) currentPhase = 'down'
    else if (avgKneeAngle < 120) currentPhase = 'transition'

    // Controlla errori comuni
    
    // 1. Ginocchia troppo avanti
    const kneeForwardLeft = leftKnee.x > leftAnkle.x + 0.05
    const kneeForwardRight = rightKnee.x > rightAnkle.x + 0.05
    if (kneeForwardLeft || kneeForwardRight) {
      feedback.push({
        severity: 'danger' as FeedbackSeverity,
        message: 'GINOCCHIA AVANTI',
        correction: 'Spingi i fianchi indietro',
        priority: 1
      })
      formScore -= 30
    }

    // 2. Schiena curva (approssimazione tramite shoulder-hip alignment)
    const backLean = Math.abs(leftShoulder.x - leftHip.x)
    if (backLean > 0.15) {
      feedback.push({
        severity: 'danger' as FeedbackSeverity,
        message: 'SCHIENA CURVA',
        correction: 'Mantieni neutra la zona lombare',
        priority: 2
      })
      formScore -= 25
    }

    // 3. ROM insufficiente
    if (currentPhase === 'down' && avgKneeAngle > 110) {
      feedback.push({
        severity: 'warning' as FeedbackSeverity,
        message: 'ROM PARZIALE',
        correction: 'Scendi fino al parallelo',
        priority: 3
      })
      formScore -= 15
    }

    // 4. Feedback positivo se tutto ok
    if (feedback.length === 0) {
      feedback.push({
        severity: 'success' as FeedbackSeverity,
        message: 'ESECUZIONE CORRETTA',
        correction: 'Continua così!',
        priority: 4
      })
    }

    // Conta ripetizioni
    const state = repStateRef.current
    if (currentPhase === 'down' && state.currentPhase === 'up') {
      state.isInExercise = true
    } else if (currentPhase === 'up' && state.currentPhase === 'down' && state.isInExercise) {
      state.repCount++
      state.isInExercise = false
      options.onRepCompleted?.(state.repCount)
    }
    state.currentPhase = currentPhase

    return {
      formScore: Math.max(0, formScore),
      feedback: feedback.sort((a, b) => a.priority - b.priority),
      repCount: state.repCount,
      currentPhase,
      angles: {
        leftKnee: leftKneeAngle,
        rightKnee: rightKneeAngle,
        avgKnee: avgKneeAngle
      }
    }
  }, [calculateAngle, options, config])

  // Analisi specifica per Bench Press
  const analyzeBenchPress = useCallback((landmarks: Poselandmark[]): PoseAnalysisResult => {
    const feedback: ExerciseFeedback[] = []
    let formScore = 100

    // Verifica che abbiamo tutti i landmark necessari
    if (landmarks.length < 33) {
      return {
        formScore: 0,
        feedback: [{
          severity: 'warning' as FeedbackSeverity,
          message: 'POSE INCOMPLETA',
          correction: 'Posizionati completamente davanti alla camera',
          priority: 1
        }],
        repCount: repStateRef.current.repCount,
        currentPhase: 'up',
        angles: {}
      }
    }

    // Punti chiave per bench press
    const leftShoulder = landmarks[11]
    const leftElbow = landmarks[13]
    const leftWrist = landmarks[15]
    const rightShoulder = landmarks[12]
    const rightElbow = landmarks[14]
    const rightWrist = landmarks[16]

    // Verifica che i landmark esistano
    if (!leftShoulder || !leftElbow || !leftWrist || !rightShoulder || !rightElbow || !rightWrist) {
      return {
        formScore: 0,
        feedback: [{
          severity: 'warning' as FeedbackSeverity,
          message: 'LANDMARKS MANCANTI',
          correction: 'Assicurati che braccia e spalle siano visibili',
          priority: 1
        }],
        repCount: repStateRef.current.repCount,
        currentPhase: 'up',
        angles: {}
      }
    }

    // Calcola angoli gomiti
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist)
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist)
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2

    // Determina fase
    let currentPhase: 'up' | 'down' | 'transition' = 'up'
    if (avgElbowAngle < 90) currentPhase = 'down'
    else if (avgElbowAngle < 120) currentPhase = 'transition'

    // Controlla gomiti troppo larghi
    const elbowFlare = Math.abs(leftElbow.y - leftShoulder.y) + Math.abs(rightElbow.y - rightShoulder.y)
    if (elbowFlare > 0.3) {
      feedback.push({
        severity: 'danger' as FeedbackSeverity,
        message: 'GOMITI LARGHI',
        correction: 'Chiudi leggermente i gomiti',
        priority: 1
      })
      formScore -= 25
    }

    // Feedback positivo
    if (feedback.length === 0) {
      feedback.push({
        severity: 'success' as FeedbackSeverity,
        message: 'ESECUZIONE CORRETTA',
        correction: 'Continua così!',
        priority: 4
      })
    }

    // Conta ripetizioni
    const state = repStateRef.current
    if (currentPhase === 'down' && state.currentPhase === 'up') {
      state.isInExercise = true
    } else if (currentPhase === 'up' && state.currentPhase === 'down' && state.isInExercise) {
      state.repCount++
      state.isInExercise = false
      options.onRepCompleted?.(state.repCount)
    }
    state.currentPhase = currentPhase

    return {
      formScore: Math.max(0, formScore),
      feedback: feedback.sort((a, b) => a.priority - b.priority),
      repCount: state.repCount,
      currentPhase,
      angles: {
        leftElbow: leftElbowAngle,
        rightElbow: rightElbowAngle,
        avgElbow: avgElbowAngle
      }
    }
  }, [calculateAngle, options, config])

  // Analisi specifica per Deadlift
  const analyzeDeadlift = useCallback((landmarks: Poselandmark[]): PoseAnalysisResult => {
    const feedback: ExerciseFeedback[] = []
    let formScore = 100

    // Verifica che abbiamo tutti i landmark necessari
    if (landmarks.length < 33) {
      return {
        formScore: 0,
        feedback: [{
          severity: 'warning' as FeedbackSeverity,
          message: 'POSE INCOMPLETA',
          correction: 'Posizionati completamente davanti alla camera',
          priority: 1
        }],
        repCount: repStateRef.current.repCount,
        currentPhase: 'up',
        angles: {}
      }
    }

    // Punti chiave per deadlift
    const leftShoulder = landmarks[11]
    const leftHip = landmarks[23]
    const leftKnee = landmarks[25]

    // Verifica che i landmark esistano
    if (!leftShoulder || !leftHip || !leftKnee) {
      return {
        formScore: 0,
        feedback: [{
          severity: 'warning' as FeedbackSeverity,
          message: 'LANDMARKS MANCANTI',
          correction: 'Posizionati completamente davanti alla camera',
          priority: 1
        }],
        repCount: repStateRef.current.repCount,
        currentPhase: 'up',
        angles: {}
      }
    }

    // Controlla curvatura schiena (approssimazione)
    const spineAngle = Math.abs(Math.atan2(leftHip.y - leftShoulder.y, leftHip.x - leftShoulder.x) * (180 / Math.PI))
    
    if (spineAngle > 15) {
      feedback.push({
        severity: 'danger' as FeedbackSeverity,
        message: 'SCHIENA CURVA',
        correction: 'Mantieni neutra la zona lombare',
        priority: 1
      })
      formScore -= 40
    }

    // Feedback positivo
    if (feedback.length === 0) {
      feedback.push({
        severity: 'success' as FeedbackSeverity,
        message: 'BUONA FORMA',
        correction: 'Continua così!',
        priority: 4
      })
    }

    return {
      formScore: Math.max(0, formScore),
      feedback: feedback.sort((a, b) => a.priority - b.priority),
      repCount: repStateRef.current.repCount,
      currentPhase: 'up' as 'up' | 'down' | 'transition',
      angles: {
        spine: spineAngle
      }
    }
  }, [calculateAngle, options, config])

  // Funzione principale di analisi
  const analyzePose = useCallback((landmarks: Poselandmark[]): PoseAnalysisResult => {
    if (!landmarks || landmarks.length < 33) {
      return {
        formScore: 0,
        feedback: [{
          severity: 'warning' as FeedbackSeverity,
          message: 'POSE NON RILEVATA',
          correction: 'Posizionati davanti alla camera',
          priority: 1
        }],
        repCount: repStateRef.current.repCount,
        currentPhase: 'up',
        angles: {}
      }
    }

    let result: PoseAnalysisResult

    switch (options.exerciseType) {
      case 'squat':
        result = analyzeSquat(landmarks)
        break
      case 'bench-press':
        result = analyzeBenchPress(landmarks)
        break
      case 'deadlift':
        result = analyzeDeadlift(landmarks)
        break
      default:
        result = {
          formScore: 0,
          feedback: [{
            severity: 'warning' as FeedbackSeverity,
            message: 'ESERCIZIO NON SUPPORTATO',
            correction: 'Seleziona un esercizio valido',
            priority: 1
          }],
          repCount: 0,
          currentPhase: 'up',
          angles: {}
        }
    }

    setAnalysisResult(result)

    // Callback per feedback
    if (result.feedback.length > 0 && result.feedback[0]) {
      options.onFeedback?.(result.feedback[0])
    }

    return result
  }, [options, analyzeSquat, analyzeBenchPress, analyzeDeadlift])

  // Reset dell'analisi
  const resetAnalysis = useCallback(() => {
    repStateRef.current = {
      currentPhase: 'up',
      repCount: 0,
      isInExercise: false,
      lastPhaseChange: 0
    }
    setAnalysisResult(null)
  }, [])

  // Istruzioni per l'esercizio
  const getExerciseInstructions = useCallback((): string[] => {
    const instructions = {
      squat: [
        "Posizionati con i piedi alla larghezza delle spalle",
        "Tieni il petto alto e la schiena dritta",
        "Spingi i fianchi indietro e scendi come se ti sedessi",
        "Scendi fino a che le cosce sono parallele al pavimento",
        "Spingi sui talloni per tornare in posizione eretta"
      ],
      'bench-press': [
        "Sdraiati sulla panca con i piedi a terra",
        "Afferra il bilanciere con presa poco più larga delle spalle",
        "Adduci le scapole e mantieni il petto alto",
        "Abbassa il bilanciere al petto controllando il movimento",
        "Spingi il bilanciere verso l'alto in linea retta"
      ],
      deadlift: [
        "Posizionati con il bilanciere sopra il mezzo del piede",
        "Piega le ginocchia e afferra il bilanciere",
        "Mantieni la schiena dritta e il petto alto",
        "Solleva spingendo sui talloni e estendendo fianchi e ginocchia",
        "Mantieni il bilanciere vicino al corpo durante tutto il movimento"
      ]
    }

    return instructions[options.exerciseType] || []
  }, [options.exerciseType])

  return {
    analysisResult,
    analyzePose,
    resetAnalysis,
    getExerciseInstructions
  }
}