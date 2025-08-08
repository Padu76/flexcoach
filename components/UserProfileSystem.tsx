// components/UserProfileSystem.tsx - Sistema profilo utente completo con calibrazione

'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  UserCircleIcon,
  CameraIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  TrophyIcon,
  FireIcon,
  HeartIcon,
  ClockIcon,
  ScaleIcon,
  CalendarIcon,
  SparklesIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'

// Tipi per profilo utente
interface PhysicalProfile {
  // Dati base
  age: number
  gender: 'male' | 'female' | 'other'
  height: number // cm
  weight: number // kg
  bodyFat?: number // %
  muscleMass?: number // kg
  
  // Misure corporee
  wingspan?: number // cm
  legLength?: number // cm
  torsoLength?: number // cm
  shoulderWidth?: number // cm
  hipWidth?: number // cm
  
  // Mobilità articolare (gradi)
  ankleFlexion: number
  hipFlexion: number
  shoulderFlexion: number
  thoracicRotation: number
  wristFlexion: number
}

interface PerformanceProfile {
  // Livello esperienza
  experience: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  trainingAge: number // anni di allenamento
  
  // Massimali attuali (kg)
  squatMax: number
  benchMax: number
  deadliftMax: number
  
  // Performance metrics
  vo2Max?: number
  restingHeartRate?: number
  recoveryRate?: number // 0-100
  
  // Preferenze allenamento
  preferredIntensity: 'low' | 'moderate' | 'high'
  preferredVolume: 'low' | 'moderate' | 'high'
  preferredFrequency: number // giorni/settimana
}

interface BiomechanicalProfile {
  // Range di movimento personalizzati
  squatDepthRange: { min: number; max: number; optimal: number }
  benchDepthRange: { min: number; max: number; optimal: number }
  deadliftRomRange: { min: number; max: number; optimal: number }
  
  // Compensazioni note
  kneeValgusThreshold: number // gradi oltre cui è pericoloso
  spinalFlexionThreshold: number
  shoulderImpingementThreshold: number
  
  // Pattern di movimento
  dominantSide: 'left' | 'right' | 'balanced'
  movementCompensations: string[]
  injuryHistory: InjuryRecord[]
  
  // Velocità ottimali
  optimalDescentSpeed: number // m/s
  optimalAscentSpeed: number // m/s
  
  // Soglie personalizzate
  fatigueThreshold: number // 0-100
  formBreakdownThreshold: number // 0-100
}

interface InjuryRecord {
  date: string
  bodyPart: string
  severity: 'minor' | 'moderate' | 'severe'
  recovered: boolean
  notes: string
}

interface CalibrationData {
  exercise: 'squat' | 'bench-press' | 'deadlift'
  timestamp: string
  
  // Misure registrate
  maxDepth: number
  minDepth: number
  avgDepth: number
  
  maxVelocity: number
  minVelocity: number
  
  leftRightBalance: number
  anteriorPosteriorBalance: number
  
  comfortableWeight: number
  perceivedDifficulty: number // 1-10
  
  notes: string
}

interface UserGoals {
  primaryGoal: 'strength' | 'hypertrophy' | 'endurance' | 'power' | 'health'
  secondaryGoals: string[]
  
  targetWeight?: number // kg obiettivo peso corporeo
  targetBodyFat?: number // % obiettivo
  
  strengthTargets: {
    squat: number
    bench: number
    deadlift: number
  }
  
  timeframe: number // settimane
  weeklyCommitment: number // ore/settimana
}

interface Props {
  userId?: string
  onProfileUpdate?: (profile: any) => void
  onCalibrationComplete?: () => void
}

export default function UserProfileSystem({
  userId = 'default',
  onProfileUpdate,
  onCalibrationComplete
}: Props) {
  // Stati principali
  const [activeTab, setActiveTab] = useState<'profile' | 'calibration' | 'goals' | 'history'>('profile')
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [calibrationStep, setCalibrationStep] = useState(0)
  const [editMode, setEditMode] = useState(false)
  
  // Profili utente
  const [physicalProfile, setPhysicalProfile] = useState<PhysicalProfile>({
    age: 30,
    gender: 'male',
    height: 175,
    weight: 75,
    ankleFlexion: 35,
    hipFlexion: 120,
    shoulderFlexion: 180,
    thoracicRotation: 45,
    wristFlexion: 90
  })
  
  const [performanceProfile, setPerformanceProfile] = useState<PerformanceProfile>({
    experience: 'intermediate',
    trainingAge: 2,
    squatMax: 100,
    benchMax: 80,
    deadliftMax: 120,
    preferredIntensity: 'moderate',
    preferredVolume: 'moderate',
    preferredFrequency: 3
  })
  
  const [biomechanicalProfile, setBiomechanicalProfile] = useState<BiomechanicalProfile>({
    squatDepthRange: { min: 60, max: 120, optimal: 90 },
    benchDepthRange: { min: 70, max: 100, optimal: 85 },
    deadliftRomRange: { min: 0, max: 180, optimal: 170 },
    kneeValgusThreshold: 15,
    spinalFlexionThreshold: 30,
    shoulderImpingementThreshold: 20,
    dominantSide: 'right',
    movementCompensations: [],
    injuryHistory: [],
    optimalDescentSpeed: 0.5,
    optimalAscentSpeed: 0.7,
    fatigueThreshold: 70,
    formBreakdownThreshold: 30
  })
  
  const [userGoals, setUserGoals] = useState<UserGoals>({
    primaryGoal: 'strength',
    secondaryGoals: ['health', 'mobility'],
    strengthTargets: {
      squat: 140,
      bench: 100,
      deadlift: 160
    },
    timeframe: 12,
    weeklyCommitment: 4
  })
  
  const [calibrationHistory, setCalibrationHistory] = useState<CalibrationData[]>([])
  
  // Canvas per visualizzazione corpo
  const bodyCanvasRef = useRef<HTMLCanvasElement>(null)
  
  // Carica profilo da localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem(`flexcoach_profile_${userId}`)
    if (savedProfile) {
      const profile = JSON.parse(savedProfile)
      if (profile.physical) setPhysicalProfile(profile.physical)
      if (profile.performance) setPerformanceProfile(profile.performance)
      if (profile.biomechanical) setBiomechanicalProfile(profile.biomechanical)
      if (profile.goals) setUserGoals(profile.goals)
      if (profile.calibrationHistory) setCalibrationHistory(profile.calibrationHistory)
    }
  }, [userId])
  
  // Salva profilo
  useEffect(() => {
    const profile = {
      physical: physicalProfile,
      performance: performanceProfile,
      biomechanical: biomechanicalProfile,
      goals: userGoals,
      calibrationHistory,
      lastUpdated: new Date().toISOString()
    }
    
    localStorage.setItem(`flexcoach_profile_${userId}`, JSON.stringify(profile))
    
    if (onProfileUpdate) {
      onProfileUpdate(profile)
    }
  }, [physicalProfile, performanceProfile, biomechanicalProfile, userGoals, calibrationHistory])
  
  // Calcola BMI
  const calculateBMI = (): { value: number; category: string; color: string } => {
    const bmi = physicalProfile.weight / Math.pow(physicalProfile.height / 100, 2)
    
    let category, color
    if (bmi < 18.5) {
      category = 'Sottopeso'
      color = 'text-blue-600'
    } else if (bmi < 25) {
      category = 'Normopeso'
      color = 'text-green-600'
    } else if (bmi < 30) {
      category = 'Sovrappeso'
      color = 'text-yellow-600'
    } else {
      category = 'Obeso'
      color = 'text-red-600'
    }
    
    return { value: bmi, category, color }
  }
  
  // Calcola Wilks Score (forza relativa)
  const calculateWilksScore = (): number => {
    const total = performanceProfile.squatMax + performanceProfile.benchMax + performanceProfile.deadliftMax
    const bodyweight = physicalProfile.weight
    
    // Coefficienti Wilks semplificati
    const a = physicalProfile.gender === 'male' ? -216.0475144 : 594.31747775582
    const b = physicalProfile.gender === 'male' ? 16.2606339 : -27.23842536447
    const c = physicalProfile.gender === 'male' ? -0.002388645 : 0.82112226871
    const d = physicalProfile.gender === 'male' ? -0.00113732 : -0.00930733913
    const e = physicalProfile.gender === 'male' ? 7.01863E-06 : 0.00004731582
    const f = physicalProfile.gender === 'male' ? -1.291E-08 : -0.00000009054
    
    const denominator = a + b * bodyweight + c * Math.pow(bodyweight, 2) + 
                       d * Math.pow(bodyweight, 3) + e * Math.pow(bodyweight, 4) + 
                       f * Math.pow(bodyweight, 5)
    
    const coefficient = 500 / denominator
    return total * coefficient
  }
  
  // Calcola età allenamento ottimale
  const calculateTrainingAge = (): string => {
    const biologicalAge = physicalProfile.age
    const trainingYears = performanceProfile.trainingAge
    
    if (biologicalAge < 25) {
      return 'Fase di sviluppo - Focus su tecnica e volume'
    } else if (biologicalAge < 35) {
      return 'Picco prestativo - Massima intensità possibile'
    } else if (biologicalAge < 45) {
      return 'Maturità - Bilanciare intensità e recupero'
    } else {
      return 'Master - Priorità a mobilità e salute articolare'
    }
  }
  
  // Processo di calibrazione
  const startCalibration = () => {
    setIsCalibrating(true)
    setCalibrationStep(0)
  }
  
  const calibrationSteps = [
    {
      title: 'Test Mobilità Caviglia',
      description: 'Piega il ginocchio in avanti mantenendo il tallone a terra',
      measure: 'ankleFlexion',
      unit: '°',
      target: 35
    },
    {
      title: 'Test Mobilità Anca',
      description: 'Squat profondo senza peso, mantieni 5 secondi',
      measure: 'hipFlexion',
      unit: '°',
      target: 120
    },
    {
      title: 'Test Mobilità Spalle',
      description: 'Braccia sopra la testa, completamente estese',
      measure: 'shoulderFlexion',
      unit: '°',
      target: 180
    },
    {
      title: 'Test Rotazione Toracica',
      description: 'Ruota il busto mantenendo i fianchi fermi',
      measure: 'thoracicRotation',
      unit: '°',
      target: 45
    },
    {
      title: 'Test Velocità Discesa',
      description: 'Scendi in squat controllato con peso leggero',
      measure: 'descentSpeed',
      unit: 'm/s',
      target: 0.5
    }
  ]
  
  const handleCalibrationMeasure = (value: number) => {
    const currentStep = calibrationSteps[calibrationStep]
    
    // Aggiorna profilo basato su calibrazione
    if (currentStep.measure === 'ankleFlexion') {
      setPhysicalProfile(prev => ({ ...prev, ankleFlexion: value }))
    } else if (currentStep.measure === 'hipFlexion') {
      setPhysicalProfile(prev => ({ ...prev, hipFlexion: value }))
      // Aggiusta anche range squat basato su mobilità anca
      setBiomechanicalProfile(prev => ({
        ...prev,
        squatDepthRange: {
          ...prev.squatDepthRange,
          optimal: Math.min(90, value - 30)
        }
      }))
    } else if (currentStep.measure === 'shoulderFlexion') {
      setPhysicalProfile(prev => ({ ...prev, shoulderFlexion: value }))
    } else if (currentStep.measure === 'thoracicRotation') {
      setPhysicalProfile(prev => ({ ...prev, thoracicRotation: value }))
    } else if (currentStep.measure === 'descentSpeed') {
      setBiomechanicalProfile(prev => ({ ...prev, optimalDescentSpeed: value }))
    }
    
    // Prossimo step o fine
    if (calibrationStep < calibrationSteps.length - 1) {
      setCalibrationStep(prev => prev + 1)
    } else {
      completeCalibration()
    }
  }
  
  const completeCalibration = () => {
    setIsCalibrating(false)
    setCalibrationStep(0)
    
    // Salva calibrazione
    const calibData: CalibrationData = {
      exercise: 'squat',
      timestamp: new Date().toISOString(),
      maxDepth: physicalProfile.hipFlexion,
      minDepth: 45,
      avgDepth: 90,
      maxVelocity: 1.0,
      minVelocity: 0.3,
      leftRightBalance: 50,
      anteriorPosteriorBalance: 50,
      comfortableWeight: performanceProfile.squatMax * 0.7,
      perceivedDifficulty: 5,
      notes: 'Calibrazione iniziale completata'
    }
    
    setCalibrationHistory([...calibrationHistory, calibData])
    
    if (onCalibrationComplete) {
      onCalibrationComplete()
    }
  }
  
  // Genera raccomandazioni personalizzate
  const generateRecommendations = (): string[] => {
    const recs: string[] = []
    
    // Basate su età e esperienza
    if (physicalProfile.age > 40) {
      recs.push('🔄 Aumenta il riscaldamento a 15 minuti')
      recs.push('🧘 Aggiungi 10 minuti di stretching post-workout')
    }
    
    // Basate su mobilità
    if (physicalProfile.ankleFlexion < 30) {
      recs.push('🦶 Lavora sulla mobilità delle caviglie quotidianamente')
    }
    if (physicalProfile.hipFlexion < 110) {
      recs.push('🦵 Esercizi di mobilità anca prima di ogni squat')
    }
    
    // Basate su obiettivi
    if (userGoals.primaryGoal === 'strength') {
      recs.push('💪 Focus su 3-5 reps con 85-95% del massimale')
      recs.push('⏱️ Riposi di 3-5 minuti tra le serie')
    } else if (userGoals.primaryGoal === 'hypertrophy') {
      recs.push('📈 Mantieni 8-12 reps con 70-80% del massimale')
      recs.push('⏱️ Riposi di 60-90 secondi tra le serie')
    }
    
    // Basate su infortuni
    if (biomechanicalProfile.injuryHistory.length > 0) {
      recs.push('⚠️ Extra attenzione al riscaldamento delle zone a rischio')
    }
    
    return recs
  }
  
  // Visualizza profilo corporeo
  useEffect(() => {
    if (bodyCanvasRef.current) {
      drawBodyProfile()
    }
  }, [physicalProfile, biomechanicalProfile])
  
  const drawBodyProfile = () => {
    const canvas = bodyCanvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Setup
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    
    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height)
    
    // Draw body outline
    const centerX = rect.width / 2
    const scale = rect.height / 200
    
    // Proporziona basato su altezza reale
    const heightRatio = physicalProfile.height / 175 // 175cm reference
    
    // Head
    ctx.beginPath()
    ctx.arc(centerX, 30 * scale, 15 * scale, 0, Math.PI * 2)
    ctx.strokeStyle = '#6B7280'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Torso
    const torsoHeight = 60 * scale * heightRatio
    ctx.beginPath()
    ctx.moveTo(centerX - 25 * scale, 45 * scale)
    ctx.lineTo(centerX - 20 * scale, 45 * scale + torsoHeight)
    ctx.lineTo(centerX + 20 * scale, 45 * scale + torsoHeight)
    ctx.lineTo(centerX + 25 * scale, 45 * scale)
    ctx.closePath()
    ctx.stroke()
    
    // Arms
    const armLength = 50 * scale * heightRatio
    // Left arm
    ctx.beginPath()
    ctx.moveTo(centerX - 25 * scale, 50 * scale)
    ctx.lineTo(centerX - 40 * scale, 50 * scale + armLength)
    ctx.stroke()
    // Right arm
    ctx.beginPath()
    ctx.moveTo(centerX + 25 * scale, 50 * scale)
    ctx.lineTo(centerX + 40 * scale, 50 * scale + armLength)
    ctx.stroke()
    
    // Legs
    const legLength = 70 * scale * heightRatio
    // Left leg
    ctx.beginPath()
    ctx.moveTo(centerX - 15 * scale, 45 * scale + torsoHeight)
    ctx.lineTo(centerX - 15 * scale, 45 * scale + torsoHeight + legLength)
    ctx.stroke()
    // Right leg
    ctx.beginPath()
    ctx.moveTo(centerX + 15 * scale, 45 * scale + torsoHeight)
    ctx.lineTo(centerX + 15 * scale, 45 * scale + torsoHeight + legLength)
    ctx.stroke()
    
    // Highlight mobility limitations
    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)'
    
    if (physicalProfile.ankleFlexion < 30) {
      // Ankle limitation
      ctx.beginPath()
      ctx.arc(centerX - 15 * scale, 45 * scale + torsoHeight + legLength - 5, 8 * scale, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(centerX + 15 * scale, 45 * scale + torsoHeight + legLength - 5, 8 * scale, 0, Math.PI * 2)
      ctx.fill()
    }
    
    if (physicalProfile.hipFlexion < 110) {
      // Hip limitation
      ctx.beginPath()
      ctx.arc(centerX, 45 * scale + torsoHeight, 10 * scale, 0, Math.PI * 2)
      ctx.fill()
    }
    
    if (physicalProfile.shoulderFlexion < 170) {
      // Shoulder limitation
      ctx.beginPath()
      ctx.arc(centerX - 25 * scale, 50 * scale, 8 * scale, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(centerX + 25 * scale, 50 * scale, 8 * scale, 0, Math.PI * 2)
      ctx.fill()
    }
    
    // Add measurements
    ctx.fillStyle = '#111827'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    
    // Height
    ctx.fillText(`${physicalProfile.height}cm`, centerX + 60 * scale, rect.height / 2)
    
    // Weight
    ctx.fillText(`${physicalProfile.weight}kg`, centerX, rect.height - 10)
  }
  
  const getExperienceColor = (exp: string): string => {
    switch (exp) {
      case 'beginner': return 'text-green-600 bg-green-100'
      case 'intermediate': return 'text-blue-600 bg-blue-100'
      case 'advanced': return 'text-purple-600 bg-purple-100'
      case 'elite': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }
  
  const bmi = calculateBMI()
  const wilks = calculateWilksScore()
  const recommendations = generateRecommendations()
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCircleIcon className="w-6 h-6 text-blue-600" />
            Profilo Utente Completo
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Calibrazione personalizzata e soglie adattive
          </p>
        </div>
        
        <button
          onClick={() => setEditMode(!editMode)}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            editMode 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {editMode ? 'Salva Modifiche' : 'Modifica Profilo'}
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { id: 'profile', label: '👤 Profilo', icon: UserCircleIcon },
          { id: 'calibration', label: '🎯 Calibrazione', icon: AdjustmentsHorizontalIcon },
          { id: 'goals', label: '🎯 Obiettivi', icon: TrophyIcon },
          { id: 'history', label: '📊 Storia', icon: ChartBarIcon }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <ScaleIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{bmi.value.toFixed(1)}</div>
              <div className={`text-xs font-medium ${bmi.color}`}>{bmi.category}</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <TrophyIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{wilks.toFixed(0)}</div>
              <div className="text-xs text-purple-600">Wilks Score</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <FireIcon className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {performanceProfile.trainingAge}
              </div>
              <div className="text-xs text-green-600">Anni Training</div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <HeartIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {physicalProfile.age}
              </div>
              <div className="text-xs text-orange-600">Età</div>
            </div>
          </div>
          
          {/* Main Profile Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Physical Profile */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HeartIcon className="w-5 h-5 text-red-500" />
                Profilo Fisico
              </h3>
              
              {editMode ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600">Età</label>
                      <input
                        type="number"
                        value={physicalProfile.age}
                        onChange={(e) => setPhysicalProfile(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Genere</label>
                      <select
                        value={physicalProfile.gender}
                        onChange={(e) => setPhysicalProfile(prev => ({ ...prev, gender: e.target.value as any }))}
                        className="w-full px-2 py-1 border rounded"
                      >
                        <option value="male">Maschio</option>
                        <option value="female">Femmina</option>
                        <option value="other">Altro</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Altezza (cm)</label>
                      <input
                        type="number"
                        value={physicalProfile.height}
                        onChange={(e) => setPhysicalProfile(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Peso (kg)</label>
                      <input
                        type="number"
                        value={physicalProfile.weight}
                        onChange={(e) => setPhysicalProfile(prev => ({ ...prev, weight: parseInt(e.target.value) }))}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Età:</span>
                    <span className="font-medium">{physicalProfile.age} anni</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Genere:</span>
                    <span className="font-medium capitalize">{physicalProfile.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Altezza:</span>
                    <span className="font-medium">{physicalProfile.height} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peso:</span>
                    <span className="font-medium">{physicalProfile.weight} kg</span>
                  </div>
                </div>
              )}
              
              {/* Body visualization */}
              <div className="mt-4">
                <canvas
                  ref={bodyCanvasRef}
                  className="w-full h-48 bg-white rounded"
                  style={{ width: '100%', height: '192px' }}
                />
              </div>
            </div>
            
            {/* Performance Profile */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FireIcon className="w-5 h-5 text-orange-500" />
                Profilo Performance
              </h3>
              
              <div className="space-y-3">
                {/* Experience Level */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Livello Esperienza</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getExperienceColor(performanceProfile.experience)}`}>
                      {performanceProfile.experience}
                    </span>
                  </div>
                </div>
                
                {/* Massimali */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Massimali (1RM)</div>
                  {editMode ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">Squat</label>
                        <input
                          type="number"
                          value={performanceProfile.squatMax}
                          onChange={(e) => setPerformanceProfile(prev => ({ ...prev, squatMax: parseInt(e.target.value) }))}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Panca</label>
                        <input
                          type="number"
                          value={performanceProfile.benchMax}
                          onChange={(e) => setPerformanceProfile(prev => ({ ...prev, benchMax: parseInt(e.target.value) }))}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Stacco</label>
                        <input
                          type="number"
                          value={performanceProfile.deadliftMax}
                          onChange={(e) => setPerformanceProfile(prev => ({ ...prev, deadliftMax: parseInt(e.target.value) }))}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-xs text-gray-600">Squat</div>
                        <div className="text-lg font-bold text-blue-600">{performanceProfile.squatMax}kg</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Panca</div>
                        <div className="text-lg font-bold text-green-600">{performanceProfile.benchMax}kg</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Stacco</div>
                        <div className="text-lg font-bold text-purple-600">{performanceProfile.deadliftMax}kg</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Training preferences */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-2">Preferenze Training</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Intensità:</span>
                      <span className="font-medium capitalize">{performanceProfile.preferredIntensity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Volume:</span>
                      <span className="font-medium capitalize">{performanceProfile.preferredVolume}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Frequenza:</span>
                      <span className="font-medium">{performanceProfile.preferredFrequency}x/sett</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Anni training:</span>
                      <span className="font-medium">{performanceProfile.trainingAge}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobility Assessment */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-500" />
              Valutazione Mobilità
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Caviglia', value: physicalProfile.ankleFlexion, target: 35, key: 'ankle' },
                { label: 'Anca', value: physicalProfile.hipFlexion, target: 120, key: 'hip' },
                { label: 'Spalla', value: physicalProfile.shoulderFlexion, target: 180, key: 'shoulder' },
                { label: 'Torace', value: physicalProfile.thoracicRotation, target: 45, key: 'thoracic' }
              ].map(item => (
                <div key={item.key} className="text-center">
                  <div className="text-sm text-gray-600 mb-2">{item.label}</div>
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto">
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="#E5E7EB"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke={item.value >= item.target ? '#10B981' : item.value >= item.target * 0.8 ? '#F59E0B' : '#EF4444'}
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${(item.value / item.target) * 226} 226`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold">{item.value}°</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Target: {item.target}°
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Training Age Assessment */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Valutazione Età Allenamento
                </h3>
                <p className="text-sm text-blue-800">
                  {calculateTrainingAge()}
                </p>
                <div className="mt-3 space-y-1">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="text-sm text-blue-700">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Calibration Tab */}
      {activeTab === 'calibration' && (
        <div className="space-y-6">
          {!isCalibrating ? (
            <>
              {/* Calibration Status */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 text-center">
                <CameraIcon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Calibrazione Personalizzata
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Il sistema si adatta alle tue caratteristiche uniche per massimizzare sicurezza e performance
                </p>
                <button
                  onClick={startCalibration}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <ArrowPathIcon className="w-5 h-5 inline mr-2" />
                  Inizia Calibrazione
                </button>
              </div>
              
              {/* Last Calibration */}
              {calibrationHistory.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    📊 Ultima Calibrazione
                  </h3>
                  <div className="text-sm text-gray-600">
                    {new Date(calibrationHistory[calibrationHistory.length - 1].timestamp).toLocaleDateString()}
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="text-center">
                      <div className="text-xs text-gray-600">Profondità Max</div>
                      <div className="text-lg font-bold text-blue-600">
                        {calibrationHistory[calibrationHistory.length - 1].maxDepth}°
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600">Peso Comfort</div>
                      <div className="text-lg font-bold text-green-600">
                        {calibrationHistory[calibrationHistory.length - 1].comfortableWeight}kg
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600">Difficoltà</div>
                      <div className="text-lg font-bold text-orange-600">
                        {calibrationHistory[calibrationHistory.length - 1].perceivedDifficulty}/10
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Biomechanical Thresholds */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">
                  ⚙️ Soglie Biomeccaniche Personalizzate
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">Valgismo Ginocchia Max</span>
                      <span className="font-medium">{biomechanicalProfile.kneeValgusThreshold}°</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-red-500 h-2 rounded-full"
                        style={{ width: `${(biomechanicalProfile.kneeValgusThreshold / 30) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">Flessione Spinale Max</span>
                      <span className="font-medium">{biomechanicalProfile.spinalFlexionThreshold}°</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-red-500 h-2 rounded-full"
                        style={{ width: `${(biomechanicalProfile.spinalFlexionThreshold / 45) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">Soglia Fatica</span>
                      <span className="font-medium">{biomechanicalProfile.fatigueThreshold}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-orange-500 h-2 rounded-full"
                        style={{ width: `${biomechanicalProfile.fatigueThreshold}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Calibration Process */
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {calibrationSteps[calibrationStep].title}
                  </h3>
                  <span className="text-sm text-gray-600">
                    Step {calibrationStep + 1} di {calibrationSteps.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${((calibrationStep + 1) / calibrationSteps.length) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="text-center py-8">
                <div className="text-6xl mb-4">
                  {calibrationStep === 0 ? '🦶' :
                   calibrationStep === 1 ? '🦵' :
                   calibrationStep === 2 ? '💪' :
                   calibrationStep === 3 ? '🔄' : '⏱️'}
                </div>
                <p className="text-gray-600 mb-6">
                  {calibrationSteps[calibrationStep].description}
                </p>
                
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => handleCalibrationMeasure(calibrationSteps[calibrationStep].target * 0.8)}
                    className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                  >
                    Limitato
                  </button>
                  <button
                    onClick={() => handleCalibrationMeasure(calibrationSteps[calibrationStep].target)}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                  >
                    Normale
                  </button>
                  <button
                    onClick={() => handleCalibrationMeasure(calibrationSteps[calibrationStep].target * 1.2)}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    Eccellente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrophyIcon className="w-5 h-5 text-purple-600" />
              I Tuoi Obiettivi
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Obiettivo Primario</label>
                <select
                  value={userGoals.primaryGoal}
                  onChange={(e) => setUserGoals(prev => ({ ...prev, primaryGoal: e.target.value as any }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                  disabled={!editMode}
                >
                  <option value="strength">🏋️ Forza Massima</option>
                  <option value="hypertrophy">💪 Massa Muscolare</option>
                  <option value="endurance">🏃 Resistenza</option>
                  <option value="power">⚡ Potenza Esplosiva</option>
                  <option value="health">❤️ Salute e Benessere</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Timeframe (settimane)</label>
                <input
                  type="number"
                  value={userGoals.timeframe}
                  onChange={(e) => setUserGoals(prev => ({ ...prev, timeframe: parseInt(e.target.value) }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                  disabled={!editMode}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700">Target Forza (kg)</label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div>
                  <label className="text-xs text-gray-600">Squat</label>
                  <input
                    type="number"
                    value={userGoals.strengthTargets.squat}
                    onChange={(e) => setUserGoals(prev => ({
                      ...prev,
                      strengthTargets: { ...prev.strengthTargets, squat: parseInt(e.target.value) }
                    }))}
                    className="w-full px-2 py-1 border rounded"
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Panca</label>
                  <input
                    type="number"
                    value={userGoals.strengthTargets.bench}
                    onChange={(e) => setUserGoals(prev => ({
                      ...prev,
                      strengthTargets: { ...prev.strengthTargets, bench: parseInt(e.target.value) }
                    }))}
                    className="w-full px-2 py-1 border rounded"
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Stacco</label>
                  <input
                    type="number"
                    value={userGoals.strengthTargets.deadlift}
                    onChange={(e) => setUserGoals(prev => ({
                      ...prev,
                      strengthTargets: { ...prev.strengthTargets, deadlift: parseInt(e.target.value) }
                    }))}
                    className="w-full px-2 py-1 border rounded"
                    disabled={!editMode}
                  />
                </div>
              </div>
            </div>
            
            {/* Progress Tracking */}
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Progressi verso Obiettivi</h4>
              {['squat', 'bench', 'deadlift'].map(exercise => {
                const current = performanceProfile[`${exercise}Max` as keyof PerformanceProfile] as number
                const target = userGoals.strengthTargets[exercise as keyof typeof userGoals.strengthTargets]
                const progress = (current / target) * 100
                
                return (
                  <div key={exercise}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{exercise}</span>
                      <span className="text-gray-600">
                        {current} / {target} kg ({progress.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          progress >= 100 ? 'bg-green-500' :
                          progress >= 75 ? 'bg-blue-500' :
                          progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">
              📅 Storia Calibrazioni
            </h3>
            {calibrationHistory.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {calibrationHistory.map((cal, idx) => (
                  <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {new Date(cal.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-gray-600">
                        {cal.exercise}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                      <div>
                        <span className="text-gray-600">Max Depth: </span>
                        <span className="font-medium">{cal.maxDepth}°</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Peso: </span>
                        <span className="font-medium">{cal.comfortableWeight}kg</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Difficoltà: </span>
                        <span className="font-medium">{cal.perceivedDifficulty}/10</span>
                      </div>
                    </div>
                    {cal.notes && (
                      <div className="text-xs text-gray-500 mt-2 italic">
                        {cal.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Nessuna calibrazione registrata</p>
              </div>
            )}
          </div>
          
          {/* Injury History */}
          {biomechanicalProfile.injuryHistory.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-4">
                🏥 Storia Infortuni
              </h3>
              <div className="space-y-2">
                {biomechanicalProfile.injuryHistory.map((injury, idx) => (
                  <div key={idx} className="bg-white p-3 rounded border border-red-200">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">{injury.bodyPart}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        injury.recovered ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {injury.recovered ? 'Recuperato' : 'In recupero'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(injury.date).toLocaleDateString()} - {injury.severity}
                    </div>
                    {injury.notes && (
                      <div className="text-xs text-gray-500 mt-2">
                        {injury.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Test Controls */}
      <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
        <button
          onClick={() => {
            const mockCalibration: CalibrationData = {
              exercise: 'squat',
              timestamp: new Date().toISOString(),
              maxDepth: 110 + Math.random() * 20,
              minDepth: 45,
              avgDepth: 90,
              maxVelocity: 1.0,
              minVelocity: 0.3,
              leftRightBalance: 48 + Math.random() * 4,
              anteriorPosteriorBalance: 48 + Math.random() * 4,
              comfortableWeight: 70 + Math.random() * 30,
              perceivedDifficulty: 5 + Math.floor(Math.random() * 3),
              notes: 'Test calibrazione automatica'
            }
            setCalibrationHistory([...calibrationHistory, mockCalibration])
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
        >
          <BeakerIcon className="w-4 h-4 inline mr-2" />
          Test Calibrazione
        </button>
        
        <button
          onClick={() => {
            if (confirm('Vuoi resettare tutto il profilo?')) {
              localStorage.removeItem(`flexcoach_profile_${userId}`)
              window.location.reload()
            }
          }}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
        >
          Reset Profilo
        </button>
      </div>
    </div>
  )
}