import type { 
  ExerciseType, 
  ExerciseFeedback, 
  FeedbackSeverity, 
  Poselandmark,
  ExerciseConfig 
} from '@/types'
import { 
  calculateAngle, 
  calculateDistance2D,
  calculateBackLean,
  getSquatPhase,
  getBenchPhase,
  isLandmarkValid 
} from './angleCalculations'

// Configurazioni degli esercizi
export const EXERCISE_CONFIGS: Record<ExerciseType, ExerciseConfig> = {
  squat: {
    id: 'squat',
    name: 'Squat',
    description: 'Il re degli esercizi per la parte inferiore del corpo',
    instructions: [
      'Posizionati con i piedi alla larghezza delle spalle',
      'Tieni il petto alto e la schiena dritta',
      'Spingi i fianchi indietro e scendi come se ti sedessi',
      'Scendi fino a che le cosce sono parallele al pavimento',
      'Spingi sui talloni per tornare in posizione eretta'
    ],
    keyPoints: [
      'Ginocchia in linea con le punte dei piedi',
      'Peso sui talloni',
      'Schiena neutra',
      'Petto alto',
      'Discesa controllata'
    ],
    commonMistakes: [
      'Ginocchia che vanno verso l\'interno',
      'Peso sulle punte dei piedi',
      'Schiena curva',
      'ROM insufficiente',
      'Velocità eccessiva'
    ],
    targetMuscles: ['Quadricipiti', 'Glutei', 'Adduttori', 'Core']
  },
  'bench-press': {
    id: 'bench-press',
    name: 'Panca Piana',
    description: 'Esercizio fondamentale per lo sviluppo del petto',
    instructions: [
      'Sdraiati sulla panca con i piedi a terra',
      'Afferra il bilanciere con presa poco più larga delle spalle',
      'Adduci le scapole e mantieni il petto alto',
      'Abbassa il bilanciere al petto controllando il movimento',
      'Spingi il bilanciere verso l\'alto in linea retta'
    ],
    keyPoints: [
      'Scapole addotte',
      'Piedi saldi a terra',
      'Traiettoria verticale',
      'Controllo in fase eccentrica',
      'Full ROM'
    ],
    commonMistakes: [
      'Gomiti troppo larghi',
      'Rimbalzo sul petto',
      'Perdita di tensione scapolare',
      'Traiettoria obliqua',
      'Piedi che si muovono'
    ],
    targetMuscles: ['Pettorali', 'Deltoidi anteriori', 'Tricipiti']
  },
  deadlift: {
    id: 'deadlift',
    name: 'Stacco da Terra',
    description: 'L\'esercizio che coinvolge più muscoli in assoluto',
    instructions: [
      'Posizionati con il bilanciere sopra il mezzo del piede',
      'Piega le ginocchia e afferra il bilanciere',
      'Mantieni la schiena dritta e il petto alto',
      'Solleva spingendo sui talloni e estendendo fianchi e ginocchia',
      'Mantieni il bilanciere vicino al corpo durante tutto il movimento'
    ],
    keyPoints: [
      'Schiena neutra',
      'Bilanciere vicino al corpo',
      'Estensione simultanea di anche e ginocchia',
      'Shoulders over bar',
      'Grip sicuro'
    ],
    commonMistakes: [
      'Schiena curva',
      'Bilanciere lontano dal corpo',
      'Iperextension lombare',
      'Ginocchia che cedono',
      'Perdita di grip'
    ],
    targetMuscles: ['Glutei', 'Ischitibiaii', 'Erettori spinali', 'Trapezi', 'Dorsali']
  }
}

// Soglie per i diversi livelli di sensibilità
export const SENSITIVITY_THRESHOLDS = {
  low: {
    kneeForward: 0.08,
    backLean: 20,
    elbowFlare: 0.35,
    angleThreshold: 20
  },
  medium: {
    kneeForward: 0.05,
    backLean: 15,
    elbowFlare: 0.25,
    angleThreshold: 15
  },
  high: {
    kneeForward: 0.03,
    backLean: 10,
    elbowFlare: 0.15,
    angleThreshold: 10
  }
}

/**
 * Analizza la forma dello squat
 */
export const analyzeSquatForm = (
  landmarks: Poselandmark[], 
  sensitivity: 'low' | 'medium' | 'high' = 'medium'
): ExerciseFeedback[] => {
  const feedback: ExerciseFeedback[] = []
  const thresholds = SENSITIVITY_THRESHOLDS[sensitivity]

  // Verifica validità dei landmark chiave
  const requiredLandmarks = [11, 12, 23, 24, 25, 26, 27, 28] // shoulders, hips, knees, ankles
  for (const index of requiredLandmarks) {
    if (!isLandmarkValid(landmarks[index])) {
      feedback.push({
        severity: 'warning' as FeedbackSeverity,
        message: 'POSTURA INCOMPLETA',
        correction: 'Assicurati di essere completamente visibile',
        priority: 0
      })
      return feedback
    }
  }

  // Estrazione punti chiave
  const leftShoulder = landmarks[11]
  const rightShoulder = landmarks[12]
  const leftHip = landmarks[23]
  const rightHip = landmarks[24]
  const leftKnee = landmarks[25]
  const rightKnee = landmarks[26]
  const leftAnkle = landmarks[27]
  const rightAnkle = landmarks[28]

  // 1. Controllo ginocchia avanti
  const leftKneeForward = leftKnee.x - leftAnkle.x
  const rightKneeForward = rightKnee.x - rightAnkle.x
  const maxKneeForward = Math.max(leftKneeForward, rightKneeForward)

  if (maxKneeForward > thresholds.kneeForward) {
    feedback.push({
      severity: 'danger' as FeedbackSeverity,
      message: 'GINOCCHIA TROPPO AVANTI',
      correction: 'Spingi i fianchi indietro, inizia il movimento dai fianchi',
      priority: 1
    })
  }

  // 2. Controllo inclinazione schiena
  const avgShoulder = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2, z: 0 }
  const avgHip = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2, z: 0 }
  const backLeanAngle = calculateBackLean(avgShoulder, avgHip)

  if (backLeanAngle > thresholds.backLean) {
    feedback.push({
      severity: 'danger' as FeedbackSeverity,
      message: 'SCHIENA TROPPO INCLINATA',
      correction: 'Mantieni il petto alto e la schiena più dritta',
      priority: 2
    })
  }

  // 3. Controllo simmetria ginocchia
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle)
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle)
  const angleDifference = Math.abs(leftKneeAngle - rightKneeAngle)

  if (angleDifference > 15) {
    feedback.push({
      severity: 'warning' as FeedbackSeverity,
      message: 'MOVIMENTO ASIMMETRICO',
      correction: 'Mantieni il peso equamente distribuito su entrambe le gambe',
      priority: 3
    })
  }

  // 4. Controllo profondità (solo se in fase down)
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2
  const phase = getSquatPhase(avgKneeAngle)
  
  if (phase === 'down' && avgKneeAngle > 110) {
    feedback.push({
      severity: 'warning' as FeedbackSeverity,
      message: 'SCENDI PIÙ IN BASSO',
      correction: 'Porta i fianchi sotto il parallelo delle ginocchia',
      priority: 4
    })
  }

  // 5. Controllo stabilità piedi (approssimazione)
  const leftFootStability = Math.abs(leftAnkle.x - leftKnee.x)
  const rightFootStability = Math.abs(rightAnkle.x - rightKnee.x)
  
  if (leftFootStability < 0.02 || rightFootStability < 0.02) {
    feedback.push({
      severity: 'warning' as FeedbackSeverity,
      message: 'PIEDI INSTABILI',
      correction: 'Mantieni i piedi saldi a terra, peso sui talloni',
      priority: 5
    })
  }

  return feedback
}

/**
 * Analizza la forma della panca piana
 */
export const analyzeBenchPressForm = (
  landmarks: Poselandmark[], 
  sensitivity: 'low' | 'medium' | 'high' = 'medium'
): ExerciseFeedback[] => {
  const feedback: ExerciseFeedback[] = []
  const thresholds = SENSITIVITY_THRESHOLDS[sensitivity]

  // Verifica validità dei landmark chiave per panca
  const requiredLandmarks = [11, 12, 13, 14, 15, 16] // shoulders, elbows, wrists
  for (const index of requiredLandmarks) {
    if (!isLandmarkValid(landmarks[index])) {
      feedback.push({
        severity: 'warning' as FeedbackSeverity,
        message: 'POSTURA INCOMPLETA',
        correction: 'Assicurati che braccia e spalle siano visibili',
        priority: 0
      })
      return feedback
    }
  }

  // Estrazione punti chiave
  const leftShoulder = landmarks[11]
  const rightShoulder = landmarks[12]
  const leftElbow = landmarks[13]
  const rightElbow = landmarks[14]
  const leftWrist = landmarks[15]
  const rightWrist = landmarks[16]

  // 1. Controllo apertura gomiti (elbow flare)
  const leftElbowDistance = calculateDistance2D(leftElbow, leftShoulder)
  const rightElbowDistance = calculateDistance2D(rightElbow, rightShoulder)
  const avgElbowDistance = (leftElbowDistance + rightElbowDistance) / 2

  if (avgElbowDistance > thresholds.elbowFlare) {
    feedback.push({
      severity: 'danger' as FeedbackSeverity,
      message: 'GOMITI TROPPO LARGHI',
      correction: 'Chiudi leggermente i gomiti, circa 45° dal corpo',
      priority: 1
    })
  }

  // 2. Controllo simmetria braccia
  const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist)
  const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist)
  const elbowAngleDifference = Math.abs(leftElbowAngle - rightElbowAngle)

  if (elbowAngleDifference > 15) {
    feedback.push({
      severity: 'warning' as FeedbackSeverity,
      message: 'MOVIMENTO ASIMMETRICO',
      correction: 'Mantieni entrambe le braccia alla stessa altezza',
      priority: 2
    })
  }

  // 3. Controllo allineamento polsi
  const wristAlignment = Math.abs(leftWrist.y - rightWrist.y)
  if (wristAlignment > 0.05) {
    feedback.push({
      severity: 'warning' as FeedbackSeverity,
      message: 'POLSI DISALLINEATI',
      correction: 'Mantieni i polsi alla stessa altezza',
      priority: 3
    })
  }

  // 4. Controllo traiettoria (approssimazione)
  const shoulderWidth = calculateDistance2D(leftShoulder, rightShoulder)
  const wristWidth = calculateDistance2D(leftWrist, rightWrist)
  const widthRatio = wristWidth / shoulderWidth

  if (widthRatio < 0.8 || widthRatio > 1.3) {
    feedback.push({
      severity: 'warning' as FeedbackSeverity,
      message: 'PRESA INCORRETTA',
      correction: 'Regola la larghezza della presa',
      priority: 4
    })
  }

  return feedback
}

/**
 * Analizza la forma dello stacco da terra
 */
export const analyzeDeadliftForm = (
  landmarks: Poselandmark[], 
  sensitivity: 'low' | 'medium' | 'high' = 'medium'
): ExerciseFeedback[] => {
  const feedback: ExerciseFeedback[] = []
  const thresholds = SENSITIVITY_THRESHOLDS[sensitivity]

  // Verifica validità dei landmark chiave
  const requiredLandmarks = [11, 12, 23, 24, 25, 26] // shoulders, hips, knees
  for (const index of requiredLandmarks) {
    if (!isLandmarkValid(landmarks[index])) {
      feedback.push({
        severity: 'warning' as FeedbackSeverity,
        message: 'POSTURA INCOMPLETA',
        correction: 'Posizionati completamente davanti alla camera',
        priority: 0
      })
      return feedback
    }
  }

  // Estrazione punti chiave
  const leftShoulder = landmarks[11]
  const rightShoulder = landmarks[12]
  const leftHip = landmarks[23]
  const rightHip = landmarks[24]

  // 1. Controllo curvatura schiena
  const avgShoulder = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2, z: 0 }
  const avgHip = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2, z: 0 }
  const backLeanAngle = calculateBackLean(avgShoulder, avgHip)

  if (backLeanAngle > thresholds.backLean) {
    feedback.push({
      severity: 'danger' as FeedbackSeverity,
      message: 'SCHIENA CURVA - PERICOLOSO!',
      correction: 'Mantieni la schiena dritta, petto alto',
      priority: 1
    })
  }

  // 2. Controllo posizione spalle rispetto ai fianchi
  const shoulderHipAlignment = Math.abs(avgShoulder.x - avgHip.x)
  if (shoulderHipAlignment > 0.1) {
    feedback.push({
      severity: 'warning' as FeedbackSeverity,
      message: 'POSIZIONE SPALLE',
      correction: 'Mantieni le spalle sopra il bilanciere',
      priority: 2
    })
  }

  return feedback
}

/**
 * Funzione principale di analisi che sceglie il tipo di esercizio
 */
export const analyzeExerciseForm = (
  exerciseType: ExerciseType,
  landmarks: Poselandmark[],
  sensitivity: 'low' | 'medium' | 'high' = 'medium'
): ExerciseFeedback[] => {
  if (!landmarks || landmarks.length < 33) {
    return [{
      severity: 'warning' as FeedbackSeverity,
      message: 'POSE NON RILEVATA',
      correction: 'Posizionati davanti alla camera',
      priority: 0
    }]
  }

  let feedback: ExerciseFeedback[] = []

  switch (exerciseType) {
    case 'squat':
      feedback = analyzeSquatForm(landmarks, sensitivity)
      break
    case 'bench-press':
      feedback = analyzeBenchPressForm(landmarks, sensitivity)
      break
    case 'deadlift':
      feedback = analyzeDeadliftForm(landmarks, sensitivity)
      break
    default:
      feedback = [{
        severity: 'warning' as FeedbackSeverity,
        message: 'ESERCIZIO NON SUPPORTATO',
        correction: 'Seleziona un esercizio valido',
        priority: 0
      }]
  }

  // Se nessun errore, aggiungi feedback positivo
  if (feedback.length === 0) {
    feedback.push({
      severity: 'success' as FeedbackSeverity,
      message: 'OTTIMA FORMA!',
      correction: 'Continua così, stai andando benissimo!',
      priority: 10
    })
  }

  // Ordina per priorità
  return feedback.sort((a, b) => a.priority - b.priority)
}

/**
 * Calcola un punteggio di forma da 0 a 100
 */
export const calculateFormScore = (feedback: ExerciseFeedback[]): number => {
  let score = 100

  for (const item of feedback) {
    switch (item.severity) {
      case 'danger':
        score -= 30
        break
      case 'warning':
        score -= 15
        break
      case 'success':
        // Non rimuove punti
        break
    }
  }

  return Math.max(0, score)
}

/**
 * Determina il colore del feedback basato sulla severità
 */
export const getFeedbackColor = (severity: FeedbackSeverity): string => {
  switch (severity) {
    case 'success':
      return '#10b981' // green-500
    case 'warning':
      return '#f59e0b' // yellow-500
    case 'danger':
      return '#ef4444' // red-500
    default:
      return '#6b7280' // gray-500
  }
}

/**
 * Ottiene le istruzioni per un esercizio
 */
export const getExerciseInstructions = (exerciseType: ExerciseType): string[] => {
  return EXERCISE_CONFIGS[exerciseType]?.instructions || []
}

/**
 * Ottiene la configurazione completa di un esercizio
 */
export const getExerciseConfig = (exerciseType: ExerciseType): ExerciseConfig | null => {
  return EXERCISE_CONFIGS[exerciseType] || null
}