// components/UserProfileSystem.tsx - Sistema profilo utente con DataManager integrato

'use client'

import { useState, useEffect, useRef } from 'react'
import { useUserProfile, useCalibration, useDataManager } from '@/hooks/useDataManager'
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
  BeakerIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline'

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
  // Hook DataManager
  const { 
    profile, 
    updateProfile, 
    createProfile, 
    hasProfile,
    needsOnboarding 
  } = useUserProfile()
  
  const { 
    calibration, 
    isCalibrated, 
    saveCalibration,
    daysSinceCalibration 
  } = useCalibration()
  
  const {
    exportData,
    importData,
    clearAllData
  } = useDataManager()
  
  // Stati locali UI
  const [activeTab, setActiveTab] = useState<'profile' | 'calibration' | 'goals' | 'history'>('profile')
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [calibrationStep, setCalibrationStep] = useState(0)
  const [editMode, setEditMode] = useState(false)
  
  // Canvas per visualizzazione corpo
  const bodyCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Stati temporanei per editing
  const [tempProfile, setTempProfile] = useState({
    name: profile?.name || '',
    age: profile?.age || 30,
    gender: profile?.gender || 'male',
    height: profile?.height || 175,
    weight: profile?.weight || 75,
    experienceLevel: profile?.experienceLevel || 'intermediate',
    trainingGoal: profile?.trainingGoal || 'strength'
  })
  
  // Aggiorna temp profile quando cambia il profilo reale
  useEffect(() => {
    if (profile) {
      setTempProfile({
        name: profile.name || '',
        age: profile.age || 30,
        gender: profile.gender || 'male',
        height: profile.height || 175,
        weight: profile.weight || 75,
        experienceLevel: profile.experienceLevel || 'intermediate',
        trainingGoal: profile.trainingGoal || 'strength'
      })
    }
  }, [profile])
  
  // Calcola BMI
  const calculateBMI = (): { value: number; category: string; color: string } => {
    const height = profile?.height || tempProfile.height
    const weight = profile?.weight || tempProfile.weight
    const bmi = weight / Math.pow(height / 100, 2)
    
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
  
  // Calcola età allenamento ottimale
  const calculateTrainingAge = (): string => {
    const age = profile?.age || tempProfile.age
    
    if (age < 25) {
      return 'Fase di sviluppo - Focus su tecnica e volume'
    } else if (age < 35) {
      return 'Picco prestativo - Massima intensità possibile'
    } else if (age < 45) {
      return 'Maturità - Bilanciare intensità e recupero'
    } else {
      return 'Master - Priorità a mobilità e salute articolare'
    }
  }
  
  // Processo di calibrazione
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
  
  const startCalibration = () => {
    setIsCalibrating(true)
    setCalibrationStep(0)
  }
  
  const handleCalibrationMeasure = (value: number) => {
    const currentStep = calibrationSteps[calibrationStep]
    
    // Prepara dati calibrazione
    const calibrationData: any = {
      isComplete: false,
      mobilityRanges: {
        ankle: calibration?.mobilityRanges?.ankle || 35,
        hip: calibration?.mobilityRanges?.hip || 120,
        shoulder: calibration?.mobilityRanges?.shoulder || 180,
        thoracic: calibration?.mobilityRanges?.thoracic || 45
      },
      thresholds: {
        squatDepth: 90,
        benchDepth: 85,
        deadliftLockout: 170,
        valgusThreshold: 15,
        spinalFlexion: 30
      },
      compensations: [],
      calibratedAt: new Date().toISOString()
    }
    
    // Aggiorna valore specifico
    if (currentStep.measure === 'ankleFlexion') {
      calibrationData.mobilityRanges.ankle = value
    } else if (currentStep.measure === 'hipFlexion') {
      calibrationData.mobilityRanges.hip = value
      calibrationData.thresholds.squatDepth = Math.min(90, value - 30)
    } else if (currentStep.measure === 'shoulderFlexion') {
      calibrationData.mobilityRanges.shoulder = value
    } else if (currentStep.measure === 'thoracicRotation') {
      calibrationData.mobilityRanges.thoracic = value
    }
    
    // Prossimo step o fine
    if (calibrationStep < calibrationSteps.length - 1) {
      setCalibrationStep(prev => prev + 1)
    } else {
      // Completa calibrazione
      calibrationData.isComplete = true
      saveCalibration(calibrationData)
      setIsCalibrating(false)
      setCalibrationStep(0)
      
      if (onCalibrationComplete) {
        onCalibrationComplete()
      }
    }
  }
  
  // Salva modifiche profilo
  const handleSaveProfile = () => {
    if (hasProfile) {
      updateProfile(tempProfile)
    } else {
      createProfile(tempProfile as any)
    }
    setEditMode(false)
    
    if (onProfileUpdate) {
      onProfileUpdate(tempProfile)
    }
  }
  
  // Import/Export handlers
  const handleExport = () => {
    exportData()
  }
  
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const result = await importData(file)
      if (result.success) {
        alert('Dati importati con successo!')
        // I dati si aggiorneranno automaticamente tramite gli hook
      } else {
        alert('Errore durante l\'importazione: ' + result.error)
      }
    }
  }
  
  const handleReset = () => {
    if (confirm('Sei sicuro di voler cancellare tutti i dati? Questa azione non può essere annullata.')) {
      clearAllData()
    }
  }
  
  // Genera raccomandazioni personalizzate
  const generateRecommendations = (): string[] => {
    const recs: string[] = []
    
    // Basate su età
    const age = profile?.age || tempProfile.age
    if (age > 40) {
      recs.push('🔄 Aumenta il riscaldamento a 15 minuti')
      recs.push('🧘 Aggiungi 10 minuti di stretching post-workout')
    }
    
    // Basate su calibrazione
    if (calibration) {
      if (calibration.mobilityRanges.ankle < 30) {
        recs.push('🦶 Lavora sulla mobilità delle caviglie quotidianamente')
      }
      if (calibration.mobilityRanges.hip < 110) {
        recs.push('🦵 Esercizi di mobilità anca prima di ogni squat')
      }
    }
    
    // Basate su obiettivi
    const goal = profile?.trainingGoal || tempProfile.trainingGoal
    if (goal === 'strength') {
      recs.push('💪 Focus su 3-5 reps con 85-95% del massimale')
      recs.push('⏱️ Riposi di 3-5 minuti tra le serie')
    } else if (goal === 'hypertrophy') {
      recs.push('📈 Mantieni 8-12 reps con 70-80% del massimale')
      recs.push('⏱️ Riposi di 60-90 secondi tra le serie')
    }
    
    return recs
  }
  
  // Visualizza profilo corporeo
  useEffect(() => {
    if (bodyCanvasRef.current) {
      drawBodyProfile()
    }
  }, [profile, calibration, tempProfile])
  
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
    const height = profile?.height || tempProfile.height
    const heightRatio = height / 175 // 175cm reference
    
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
    
    // Highlight mobility limitations (se calibrato)
    if (calibration) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)'
      
      if (calibration.mobilityRanges.ankle < 30) {
        // Ankle limitation
        ctx.beginPath()
        ctx.arc(centerX - 15 * scale, 45 * scale + torsoHeight + legLength - 5, 8 * scale, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(centerX + 15 * scale, 45 * scale + torsoHeight + legLength - 5, 8 * scale, 0, Math.PI * 2)
        ctx.fill()
      }
      
      if (calibration.mobilityRanges.hip < 110) {
        // Hip limitation
        ctx.beginPath()
        ctx.arc(centerX, 45 * scale + torsoHeight, 10 * scale, 0, Math.PI * 2)
        ctx.fill()
      }
      
      if (calibration.mobilityRanges.shoulder < 170) {
        // Shoulder limitation
        ctx.beginPath()
        ctx.arc(centerX - 25 * scale, 50 * scale, 8 * scale, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(centerX + 25 * scale, 50 * scale, 8 * scale, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    
    // Add measurements
    ctx.fillStyle = '#111827'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    
    // Height
    ctx.fillText(`${height}cm`, centerX + 60 * scale, rect.height / 2)
    
    // Weight
    const weight = profile?.weight || tempProfile.weight
    ctx.fillText(`${weight}kg`, centerX, rect.height - 10)
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
            {hasProfile ? 'Profilo salvato automaticamente' : 'Crea il tuo profilo'}
          </p>
        </div>
        
        <button
          onClick={() => {
            if (editMode) {
              handleSaveProfile()
            } else {
              setEditMode(true)
            }
          }}
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
          { id: 'history', label: '📊 Gestione', icon: ChartBarIcon }
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
              <div className="text-2xl font-bold text-gray-900">
                {profile?.experienceLevel || tempProfile.experienceLevel}
              </div>
              <div className="text-xs text-purple-600">Livello</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {isCalibrated ? '✅' : '❌'}
              </div>
              <div className="text-xs text-green-600">Calibrato</div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <HeartIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {profile?.age || tempProfile.age}
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
                      <label className="text-xs text-gray-600">Nome</label>
                      <input
                        type="text"
                        value={tempProfile.name}
                        onChange={(e) => setTempProfile(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Età</label>
                      <input
                        type="number"
                        value={tempProfile.age}
                        onChange={(e) => setTempProfile(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Genere</label>
                      <select
                        value={tempProfile.gender}
                        onChange={(e) => setTempProfile(prev => ({ ...prev, gender: e.target.value as any }))}
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
                        value={tempProfile.height}
                        onChange={(e) => setTempProfile(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Peso (kg)</label>
                      <input
                        type="number"
                        value={tempProfile.weight}
                        onChange={(e) => setTempProfile(prev => ({ ...prev, weight: parseInt(e.target.value) }))}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Esperienza</label>
                      <select
                        value={tempProfile.experienceLevel}
                        onChange={(e) => setTempProfile(prev => ({ ...prev, experienceLevel: e.target.value as any }))}
                        className="w-full px-2 py-1 border rounded"
                      >
                        <option value="beginner">Principiante</option>
                        <option value="intermediate">Intermedio</option>
                        <option value="advanced">Avanzato</option>
                        <option value="elite">Elite</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nome:</span>
                    <span className="font-medium">{profile?.name || 'Non impostato'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Età:</span>
                    <span className="font-medium">{profile?.age || tempProfile.age} anni</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Genere:</span>
                    <span className="font-medium capitalize">{profile?.gender || tempProfile.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Altezza:</span>
                    <span className="font-medium">{profile?.height || tempProfile.height} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peso:</span>
                    <span className="font-medium">{profile?.weight || tempProfile.weight} kg</span>
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
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      getExperienceColor(profile?.experienceLevel || tempProfile.experienceLevel)
                    }`}>
                      {profile?.experienceLevel || tempProfile.experienceLevel}
                    </span>
                  </div>
                </div>
                
                {/* Training Goal */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Obiettivo</span>
                    {editMode ? (
                      <select
                        value={tempProfile.trainingGoal}
                        onChange={(e) => setTempProfile(prev => ({ ...prev, trainingGoal: e.target.value as any }))}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value="strength">Forza</option>
                        <option value="hypertrophy">Massa</option>
                        <option value="endurance">Resistenza</option>
                        <option value="power">Potenza</option>
                        <option value="health">Salute</option>
                      </select>
                    ) : (
                      <span className="text-sm font-medium capitalize">
                        {profile?.trainingGoal || tempProfile.trainingGoal}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Calibration status */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-2">Stato Calibrazione</div>
                  {isCalibrated ? (
                    <div className="text-xs text-green-600">
                      ✅ Calibrato {daysSinceCalibration ? `${daysSinceCalibration} giorni fa` : 'recentemente'}
                    </div>
                  ) : (
                    <div className="text-xs text-red-600">
                      ❌ Non calibrato - Vai alla tab Calibrazione
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobility Assessment (se calibrato) */}
          {calibration && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-500" />
                Valutazione Mobilità
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Caviglia', value: calibration.mobilityRanges.ankle, target: 35, key: 'ankle' },
                  { label: 'Anca', value: calibration.mobilityRanges.hip, target: 120, key: 'hip' },
                  { label: 'Spalla', value: calibration.mobilityRanges.shoulder, target: 180, key: 'shoulder' },
                  { label: 'Torace', value: calibration.mobilityRanges.thoracic, target: 45, key: 'thoracic' }
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
          )}
          
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
                  {isCalibrated ? 'Ricalibrare' : 'Inizia Calibrazione'}
                </button>
              </div>
              
              {/* Last Calibration */}
              {isCalibrated && calibration && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    📊 Calibrazione Attuale
                  </h3>
                  <div className="text-sm text-gray-600">
                    Calibrato {daysSinceCalibration} giorni fa
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="text-center">
                      <div className="text-xs text-gray-600">Mobilità Anca</div>
                      <div className="text-lg font-bold text-blue-600">
                        {calibration.mobilityRanges.hip}°
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600">Profondità Squat</div>
                      <div className="text-lg font-bold text-green-600">
                        {calibration.thresholds.squatDepth}°
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Biomechanical Thresholds */}
              {calibration && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    ⚙️ Soglie Biomeccaniche Personalizzate
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">Valgismo Ginocchia Max</span>
                        <span className="font-medium">{calibration.thresholds.valgusThreshold}°</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-red-500 h-2 rounded-full"
                          style={{ width: `${(calibration.thresholds.valgusThreshold / 30) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">Flessione Spinale Max</span>
                        <span className="font-medium">{calibration.thresholds.spinalFlexion}°</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-red-500 h-2 rounded-full"
                          style={{ width: `${(calibration.thresholds.spinalFlexion / 45) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                  value={tempProfile.trainingGoal}
                  onChange={(e) => {
                    setTempProfile(prev => ({ ...prev, trainingGoal: e.target.value as any }))
                    if (!editMode) {
                      updateProfile({ trainingGoal: e.target.value })
                    }
                  }}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                >
                  <option value="strength">🏋️ Forza Massima</option>
                  <option value="hypertrophy">💪 Massa Muscolare</option>
                  <option value="endurance">🏃 Resistenza</option>
                  <option value="power">⚡ Potenza Esplosiva</option>
                  <option value="health">❤️ Salute e Benessere</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Frequenza (giorni/sett)</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={3}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-white rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                📊 Raccomandazioni per il tuo obiettivo
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                {tempProfile.trainingGoal === 'strength' && (
                  <>
                    <div>• 3-5 ripetizioni per serie</div>
                    <div>• 85-95% del massimale</div>
                    <div>• 3-5 minuti di riposo</div>
                    <div>• Focus su movimenti composti</div>
                  </>
                )}
                {tempProfile.trainingGoal === 'hypertrophy' && (
                  <>
                    <div>• 8-12 ripetizioni per serie</div>
                    <div>• 70-85% del massimale</div>
                    <div>• 60-90 secondi di riposo</div>
                    <div>• Volume totale elevato</div>
                  </>
                )}
                {tempProfile.trainingGoal === 'endurance' && (
                  <>
                    <div>• 15+ ripetizioni per serie</div>
                    <div>• 50-70% del massimale</div>
                    <div>• 30-60 secondi di riposo</div>
                    <div>• Circuit training consigliato</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Data Management Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
              Gestione Dati
            </h3>
            
            <div className="space-y-3">
              {/* Export */}
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Esporta tutti i dati (JSON)
              </button>
              
              {/* Import */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <DocumentArrowUpIcon className="w-5 h-5" />
                  Importa dati salvati
                </button>
              </div>
              
              {/* Reset */}
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <ExclamationTriangleIcon className="w-5 h-5" />
                Cancella tutti i dati
              </button>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <InformationCircleIcon className="w-4 h-4 inline mr-1" />
                  I tuoi dati sono salvati localmente sul dispositivo e sincronizzati automaticamente.
                  Usa l'export per fare un backup o trasferire i dati su un altro dispositivo.
                </p>
              </div>
            </div>
          </div>
          
          {/* Test Controls */}
          {needsOnboarding && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">
                ⚠️ Completa il tuo profilo
              </h3>
              <p className="text-sm text-yellow-700">
                Per utilizzare FlexCoach al meglio, completa il tuo profilo nella tab Profilo.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}