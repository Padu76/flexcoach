// components/UserProfileSystem.tsx - Sistema profilo utente DEFINITIVO con funzioni corrette

'use client'

import { useState, useEffect, useRef } from 'react'
import { useUserProfile, useCalibration, useDataManager } from '@/hooks/useDataManager'
import type { CalibrationData } from '@/types/data'
import {
  UserCircleIcon,
  CameraIcon,
  CheckCircleIcon,
  AdjustmentsHorizontalIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import Webcam from 'react-webcam'

export default function UserProfileSystem() {
  // DataManager Hooks - SOLO funzioni che esistono davvero
  const { profile, updateProfile, hasProfile } = useUserProfile()
  const { calibration, saveCalibration, isCalibrated } = useCalibration()
  const { exportData, importData } = useDataManager()
  
  // Stati locali
  const [activeTab, setActiveTab] = useState<'profile' | 'calibration' | 'data'>('profile')
  const [editMode, setEditMode] = useState(false)
  const [tempProfile, setTempProfile] = useState({
    name: '',
    email: '',
    age: 0,
    gender: 'other' as 'male' | 'female' | 'other',
    weight: 0,
    height: 0,
    experienceLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced' | 'elite',
    trainingGoal: 'general' as 'strength' | 'hypertrophy' | 'endurance' | 'general',
    preferredUnit: 'kg' as 'kg' | 'lbs',
    language: 'it',
    timezone: 'Europe/Rome'
  })
  
  // Stati calibrazione
  const [calibrationStep, setCalibrationStep] = useState(0)
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [calibrationData, setCalibrationData] = useState<CalibrationData>({
    calibratedAt: new Date().toISOString(),
    isComplete: false,
    mobilityRanges: {
      ankle: 30,
      hip: 90,
      shoulder: 180,
      thoracic: 45
    },
    thresholds: {
      squatDepth: 90,
      benchDepth: 5,
      deadliftLockout: 170,
      valgusThreshold: 10,
      spinalFlexion: 15
    },
    compensations: [],
    limitations: [],
    notes: ''
  })
  
  // Refs
  const webcamRef = useRef<Webcam>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Sync tempProfile con profile quando cambia
  useEffect(() => {
    if (profile) {
      setTempProfile({
        name: profile.name || '',
        email: profile.email || '',
        age: profile.age || 0,
        gender: profile.gender || 'other',
        weight: profile.weight || 0,
        height: profile.height || 0,
        experienceLevel: profile.experienceLevel || 'beginner',
        trainingGoal: profile.trainingGoal || 'general',
        preferredUnit: profile.preferredUnit || 'kg',
        language: profile.language || 'it',
        timezone: profile.timezone || 'Europe/Rome'
      })
    }
  }, [profile])
  
  // Salva profilo
  const handleSaveProfile = () => {
    updateProfile(tempProfile)
    setEditMode(false)
  }
  
  // Reset profilo (simula delete)
  const handleDeleteProfile = () => {
    if (window.confirm('Sei sicuro di voler resettare il profilo? Questa azione non può essere annullata.')) {
      // Reset a valori vuoti
      const emptyProfile = {
        name: '',
        email: '',
        age: 0,
        gender: 'other' as const,
        weight: 0,
        height: 0,
        experienceLevel: 'beginner' as const,
        trainingGoal: 'general' as const,
        preferredUnit: 'kg' as const,
        language: '',
        timezone: ''
      }
      updateProfile(emptyProfile)
      setTempProfile(emptyProfile)
      setEditMode(false)
    }
  }
  
  // Import data - ora accetta File direttamente
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const result = await importData(file)
      if (result.success) {
        alert('Dati importati con successo!')
      } else {
        alert('Errore nell\'importazione dei dati: ' + result.error)
      }
    }
  }
  
  // Calibrazione steps
  const calibrationSteps = [
    {
      title: 'Posizione Neutra',
      description: 'Stai in piedi in posizione rilassata',
      instruction: 'Mantieni una postura naturale per 3 secondi'
    },
    {
      title: 'Squat - Profondità Massima',
      description: 'Scendi nel tuo squat più profondo',
      instruction: 'Mantieni la posizione per 3 secondi'
    },
    {
      title: 'Panca - Posizione Bassa',
      description: 'Simula la posizione bassa della panca',
      instruction: 'Porta le mani al petto come se avessi il bilanciere'
    },
    {
      title: 'Stacco - Posizione di Partenza',
      description: 'Posizione di partenza dello stacco',
      instruction: 'Piega le anche e le ginocchia come per afferrare il bilanciere'
    },
    {
      title: 'Test Range of Motion',
      description: 'Muoviti liberamente per testare i limiti',
      instruction: 'Esegui alcuni movimenti per verificare la calibrazione'
    }
  ]
  
  // Avvia calibrazione
  const startCalibration = () => {
    setIsCalibrating(true)
    setCalibrationStep(0)
  }
  
  // Prossimo step calibrazione
  const nextCalibrationStep = () => {
    if (calibrationStep < calibrationSteps.length - 1) {
      setCalibrationStep(calibrationStep + 1)
    } else {
      // Salva calibrazione
      const completeCalibration: CalibrationData = {
        ...calibrationData,
        calibratedAt: new Date().toISOString(),
        isComplete: true
      }
      saveCalibration(completeCalibration)
      setIsCalibrating(false)
      setCalibrationStep(0)
    }
  }
  
  // Reset calibrazione
  const handleResetCalibration = () => {
    if (window.confirm('Sei sicuro di voler resettare la calibrazione?')) {
      const resetData: CalibrationData = {
        calibratedAt: new Date().toISOString(),
        isComplete: false,
        mobilityRanges: {
          ankle: 30,
          hip: 90,
          shoulder: 180,
          thoracic: 45
        },
        thresholds: {
          squatDepth: 90,
          benchDepth: 5,
          deadliftLockout: 170,
          valgusThreshold: 10,
          spinalFlexion: 15
        },
        compensations: [],
        limitations: [],
        notes: ''
      }
      saveCalibration(resetData)
      setCalibrationData(resetData)
    }
  }
  
  // Aggiungi compensazione
  const addCompensation = () => {
    const compensation = prompt('Descrivi la compensazione rilevata:')
    if (compensation) {
      setCalibrationData(prev => ({
        ...prev,
        compensations: [...prev.compensations, compensation]
      }))
    }
  }
  
  // Rimuovi compensazione
  const removeCompensation = (index: number) => {
    setCalibrationData(prev => ({
      ...prev,
      compensations: prev.compensations.filter((_, i) => i !== index)
    }))
  }
  
  // Aggiungi limitazione
  const addLimitation = () => {
    const limitation = prompt('Descrivi la limitazione fisica:')
    if (limitation) {
      setCalibrationData(prev => ({
        ...prev,
        limitations: [...(prev.limitations || []), limitation]
      }))
    }
  }
  
  // Rimuovi limitazione
  const removeLimitation = (index: number) => {
    setCalibrationData(prev => ({
      ...prev,
      limitations: prev.limitations?.filter((_, i) => i !== index) || []
    }))
  }
  
  // Calcola BMI
  const calculateBMI = () => {
    if (tempProfile.weight && tempProfile.height) {
      const heightInM = tempProfile.height / 100
      return Math.round((tempProfile.weight / (heightInM * heightInM)) * 10) / 10
    }
    return 0
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'profile'
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <UserCircleIcon className="w-5 h-5 inline mr-2" />
          Profilo
        </button>
        <button
          onClick={() => setActiveTab('calibration')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'calibration'
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <AdjustmentsHorizontalIcon className="w-5 h-5 inline mr-2" />
          Calibrazione
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'data'
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <DocumentArrowDownIcon className="w-5 h-5 inline mr-2" />
          Dati
        </button>
      </div>
      
      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Profilo Utente</h2>
            <div className="flex gap-2">
              {hasProfile && !editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <PencilIcon className="w-4 h-4" />
                  Modifica
                </button>
              )}
              {editMode && (
                <>
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Salva
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false)
                      if (profile) {
                        setTempProfile({
                          name: profile.name || '',
                          email: profile.email || '',
                          age: profile.age || 0,
                          gender: profile.gender || 'other',
                          weight: profile.weight || 0,
                          height: profile.height || 0,
                          experienceLevel: profile.experienceLevel || 'beginner',
                          trainingGoal: profile.trainingGoal || 'general',
                          preferredUnit: profile.preferredUnit || 'kg',
                          language: profile.language || 'it',
                          timezone: profile.timezone || 'Europe/Rome'
                        })
                      }
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Annulla
                  </button>
                </>
              )}
              {hasProfile && (
                <button
                  onClick={handleDeleteProfile}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Form Profilo */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome</label>
              <input
                type="text"
                value={tempProfile.name}
                onChange={(e) => {
                  setTempProfile(prev => ({ ...prev, name: e.target.value }))
                  if (!editMode && hasProfile) {
                    updateProfile({ name: e.target.value })
                  }
                }}
                disabled={hasProfile && !editMode}
                className="w-full mt-1 px-3 py-2 border rounded-lg disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={tempProfile.email}
                onChange={(e) => {
                  setTempProfile(prev => ({ ...prev, email: e.target.value }))
                  if (!editMode && hasProfile) {
                    updateProfile({ email: e.target.value })
                  }
                }}
                disabled={hasProfile && !editMode}
                className="w-full mt-1 px-3 py-2 border rounded-lg disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Età</label>
              <input
                type="number"
                value={tempProfile.age || ''}
                onChange={(e) => {
                  const age = parseInt(e.target.value) || 0
                  setTempProfile(prev => ({ ...prev, age }))
                  if (!editMode && hasProfile) {
                    updateProfile({ age })
                  }
                }}
                disabled={hasProfile && !editMode}
                className="w-full mt-1 px-3 py-2 border rounded-lg disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Genere</label>
              <select
                value={tempProfile.gender}
                onChange={(e) => {
                  const gender = e.target.value as 'male' | 'female' | 'other'
                  setTempProfile(prev => ({ ...prev, gender }))
                  if (!editMode && hasProfile) {
                    updateProfile({ gender })
                  }
                }}
                disabled={hasProfile && !editMode}
                className="w-full mt-1 px-3 py-2 border rounded-lg disabled:bg-gray-100"
              >
                <option value="male">Maschio</option>
                <option value="female">Femmina</option>
                <option value="other">Altro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Peso (kg)</label>
              <input
                type="number"
                value={tempProfile.weight || ''}
                onChange={(e) => {
                  const weight = parseFloat(e.target.value) || 0
                  setTempProfile(prev => ({ ...prev, weight }))
                  if (!editMode && hasProfile) {
                    updateProfile({ weight })
                  }
                }}
                disabled={hasProfile && !editMode}
                className="w-full mt-1 px-3 py-2 border rounded-lg disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Altezza (cm)</label>
              <input
                type="number"
                value={tempProfile.height || ''}
                onChange={(e) => {
                  const height = parseInt(e.target.value) || 0
                  setTempProfile(prev => ({ ...prev, height }))
                  if (!editMode && hasProfile) {
                    updateProfile({ height })
                  }
                }}
                disabled={hasProfile && !editMode}
                className="w-full mt-1 px-3 py-2 border rounded-lg disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">BMI</label>
              <div className="mt-1 px-3 py-2 border rounded-lg bg-gray-100">
                {calculateBMI() || '-'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Livello Esperienza</label>
              <select
                value={tempProfile.experienceLevel}
                onChange={(e) => {
                  const level = e.target.value as 'beginner' | 'intermediate' | 'advanced' | 'elite'
                  setTempProfile(prev => ({ ...prev, experienceLevel: level }))
                  if (!editMode && hasProfile) {
                    updateProfile({ experienceLevel: level })
                  }
                }}
                disabled={hasProfile && !editMode}
                className="w-full mt-1 px-3 py-2 border rounded-lg disabled:bg-gray-100"
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzato</option>
                <option value="elite">Elite</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Obiettivo Principale</label>
              <select
                value={tempProfile.trainingGoal}
                onChange={(e) => {
                  setTempProfile(prev => ({ ...prev, trainingGoal: e.target.value as any }))
                  if (!editMode && hasProfile) {
                    updateProfile({ trainingGoal: e.target.value as "strength" | "hypertrophy" | "endurance" | "general" })
                  }
                }}
                disabled={hasProfile && !editMode}
                className="w-full mt-1 px-3 py-2 border rounded-lg disabled:bg-gray-100"
              >
                <option value="strength">Forza</option>
                <option value="hypertrophy">Ipertrofia</option>
                <option value="endurance">Resistenza</option>
                <option value="general">Generale</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Unità di Misura</label>
              <select
                value={tempProfile.preferredUnit}
                onChange={(e) => {
                  const unit = e.target.value as 'kg' | 'lbs'
                  setTempProfile(prev => ({ ...prev, preferredUnit: unit }))
                  if (!editMode && hasProfile) {
                    updateProfile({ preferredUnit: unit })
                  }
                }}
                disabled={hasProfile && !editMode}
                className="w-full mt-1 px-3 py-2 border rounded-lg disabled:bg-gray-100"
              >
                <option value="kg">Chilogrammi (kg)</option>
                <option value="lbs">Libbre (lbs)</option>
              </select>
            </div>
          </div>
          
          {/* Save button for new profile */}
          {!hasProfile && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveProfile}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Crea Profilo
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Calibration Tab */}
      {activeTab === 'calibration' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Calibrazione Sistema</h2>
              <p className="text-sm text-gray-600 mt-1">
                {isCalibrated 
                  ? '✅ Sistema calibrato e pronto' 
                  : '⚠️ Calibrazione necessaria per risultati ottimali'}
              </p>
            </div>
            <div className="flex gap-2">
              {!isCalibrating && (
                <button
                  onClick={startCalibration}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {isCalibrated ? 'Ricalibrare' : 'Inizia Calibrazione'}
                </button>
              )}
              {isCalibrated && (
                <button
                  onClick={handleResetCalibration}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          
          {/* Calibration Process */}
          {isCalibrating ? (
            <div>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Step {calibrationStep + 1} di {calibrationSteps.length}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round(((calibrationStep + 1) / calibrationSteps.length) * 100)}%
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {calibrationSteps[calibrationStep].title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {calibrationSteps[calibrationStep].description}
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-900 font-medium">
                    {calibrationSteps[calibrationStep].instruction}
                  </p>
                </div>
                
                {/* Webcam */}
                <div className="relative bg-black rounded-lg overflow-hidden mb-6 max-w-md mx-auto">
                  <Webcam
                    ref={webcamRef}
                    className="w-full h-auto"
                    mirrored
                    screenshotFormat="image/jpeg"
                  />
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm animate-pulse">
                    REC
                  </div>
                </div>
                
                {/* Compensazioni per ultimo step */}
                {calibrationStep === calibrationSteps.length - 1 && (
                  <div className="mb-6 text-left max-w-md mx-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compensazioni Rilevate
                    </label>
                    <div className="space-y-2 mb-2">
                      {calibrationData.compensations.map((comp, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                          <span className="text-sm">{comp}</span>
                          <button
                            onClick={() => removeCompensation(idx)}
                            className="text-yellow-600 hover:text-yellow-800"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addCompensation}
                      className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-sm"
                    >
                      + Aggiungi Compensazione
                    </button>
                  </div>
                )}
                
                <button
                  onClick={nextCalibrationStep}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  {calibrationStep === calibrationSteps.length - 1 ? 'Completa' : 'Prossimo'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Calibration Data Display */}
              {isCalibrated && calibration && (
                <div className="space-y-6">
                  {/* Mobility Ranges */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Range di Mobilità</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-sm text-gray-600">Caviglia</div>
                        <div className="text-xl font-bold text-blue-900">{calibration.mobilityRanges.ankle}°</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-sm text-gray-600">Anca</div>
                        <div className="text-xl font-bold text-blue-900">{calibration.mobilityRanges.hip}°</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-sm text-gray-600">Spalla</div>
                        <div className="text-xl font-bold text-blue-900">{calibration.mobilityRanges.shoulder}°</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-sm text-gray-600">Toracica</div>
                        <div className="text-xl font-bold text-blue-900">{calibration.mobilityRanges.thoracic}°</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Thresholds */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Soglie Personalizzate</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-sm text-gray-600">Squat Depth</div>
                        <div className="text-xl font-bold text-green-900">{calibration.thresholds.squatDepth}°</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-sm text-gray-600">Bench Depth</div>
                        <div className="text-xl font-bold text-green-900">{calibration.thresholds.benchDepth}cm</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-sm text-gray-600">Deadlift Lockout</div>
                        <div className="text-xl font-bold text-green-900">{calibration.thresholds.deadliftLockout}°</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <div className="text-sm text-gray-600">Valgus Max</div>
                        <div className="text-xl font-bold text-orange-900">{calibration.thresholds.valgusThreshold}°</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <div className="text-sm text-gray-600">Spinal Flexion</div>
                        <div className="text-xl font-bold text-orange-900">{calibration.thresholds.spinalFlexion}°</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Compensations & Limitations */}
                  {(calibration.compensations.length > 0 || calibration.limitations?.length) && (
                    <div className="grid md:grid-cols-2 gap-6">
                      {calibration.compensations.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Compensazioni</h3>
                          <div className="space-y-2">
                            {calibration.compensations.map((comp, idx) => (
                              <div key={idx} className="p-2 bg-yellow-50 rounded text-sm">
                                {comp}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {calibration.limitations && calibration.limitations.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Limitazioni</h3>
                          <div className="space-y-2">
                            {calibration.limitations.map((lim, idx) => (
                              <div key={idx} className="p-2 bg-red-50 rounded text-sm">
                                {lim}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Calibration Date */}
                  <div className="text-sm text-gray-600">
                    Ultima calibrazione: {new Date(calibration.calibratedAt).toLocaleDateString('it-IT')}
                  </div>
                </div>
              )}
              
              {!isCalibrated && (
                <div className="text-center py-12">
                  <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Calibrazione Non Completata
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Calibra il sistema per ottenere feedback personalizzati e più accurati
                  </p>
                  <button
                    onClick={startCalibration}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Inizia Calibrazione
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Data Tab */}
      {activeTab === 'data' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Gestione Dati</h2>
          
          <div className="space-y-6">
            {/* Export */}
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Esporta Dati
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Scarica tutti i tuoi dati in formato JSON per backup o trasferimento
              </p>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Esporta Tutto
              </button>
            </div>
            
            {/* Import */}
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Importa Dati
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Carica un backup precedente per ripristinare i tuoi dati
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <DocumentArrowUpIcon className="w-5 h-5" />
                Importa Backup
              </button>
            </div>
            
            {/* Storage Info */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informazioni Storage
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Profilo:</span>
                  <span className="font-medium">
                    {hasProfile ? '✅ Salvato' : '❌ Non creato'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Calibrazione:</span>
                  <span className="font-medium">
                    {isCalibrated ? '✅ Completata' : '❌ Non calibrato'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage Locale:</span>
                  <span className="font-medium">
                    {typeof window !== 'undefined' && window.localStorage
                      ? '✅ Disponibile'
                      : '❌ Non disponibile'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Limitations Management (if calibrated) */}
            {isCalibrated && calibration && (
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Gestione Limitazioni
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Aggiungi o rimuovi limitazioni fisiche per personalizzare il feedback
                </p>
                <div className="space-y-2">
                  {calibration.limitations?.map((limitation, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span className="text-sm">{limitation}</span>
                      <button
                        onClick={() => {
                          const newLimitations = calibration.limitations?.filter((_, i) => i !== idx) || []
                          saveCalibration({
                            ...calibration,
                            limitations: newLimitations
                          })
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const limitation = prompt('Descrivi la limitazione fisica:')
                      if (limitation) {
                        saveCalibration({
                          ...calibration,
                          limitations: [...(calibration.limitations || []), limitation]
                        })
                      }
                    }}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                  >
                    + Aggiungi Limitazione
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}