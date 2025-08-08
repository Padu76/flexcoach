// components/UserProfileSystem.tsx - Sistema profilo utente COMPLETO con DataManager integrato

'use client'

import { useState, useEffect, useRef } from 'react'
import { useUserProfile, useCalibration, useDataManager } from '@/hooks/useDataManager'
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
  // DataManager Hooks
  const { profile, updateProfile, deleteProfile, hasProfile } = useUserProfile()
  const { calibration, updateCalibration, resetCalibration, isCalibrated } = useCalibration()
  const { exportData, importData } = useDataManager()
  
  // Stati locali
  const [activeTab, setActiveTab] = useState<'profile' | 'calibration' | 'data'>('profile')
  const [editMode, setEditMode] = useState(false)
  const [tempProfile, setTempProfile] = useState(profile || {
    name: '',
    age: 0,
    weight: 0,
    height: 0,
    experienceLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced' | 'elite',
    injuries: [] as string[],
    goals: [] as string[],
    trainingDays: 3,
    trainingGoal: 'general' as 'strength' | 'hypertrophy' | 'endurance' | 'general'
  })
  
  // Stati calibrazione
  const [calibrationStep, setCalibrationStep] = useState(0)
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [calibrationData, setCalibrationData] = useState({
    squat: { depth: 90, kneeAngle: 90, hipAngle: 90 },
    benchPress: { elbowAngle: 90, shoulderAngle: 45 },
    deadlift: { hipHinge: 45, backAngle: 45 }
  })
  
  // Refs
  const webcamRef = useRef<Webcam>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Sync tempProfile con profile quando cambia
  useEffect(() => {
    if (profile) {
      setTempProfile(profile)
    }
  }, [profile])
  
  // Salva profilo
  const handleSaveProfile = () => {
    updateProfile(tempProfile)
    setEditMode(false)
  }
  
  // Cancella profilo
  const handleDeleteProfile = () => {
    if (window.confirm('Sei sicuro di voler eliminare il profilo? Questa azione non può essere annullata.')) {
      deleteProfile()
      setTempProfile({
        name: '',
        age: 0,
        weight: 0,
        height: 0,
        experienceLevel: 'beginner',
        injuries: [],
        goals: [],
        trainingDays: 3,
        trainingGoal: 'general'
      })
      setEditMode(false)
    }
  }
  
  // Import data
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          importData(data)
          alert('Dati importati con successo!')
        } catch (error) {
          alert('Errore nell\'importazione dei dati')
        }
      }
      reader.readAsText(file)
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
      updateCalibration(calibrationData)
      setIsCalibrating(false)
      setCalibrationStep(0)
    }
  }
  
  // Reset calibrazione
  const handleResetCalibration = () => {
    if (window.confirm('Sei sicuro di voler resettare la calibrazione?')) {
      resetCalibration()
      setCalibrationData({
        squat: { depth: 90, kneeAngle: 90, hipAngle: 90 },
        benchPress: { elbowAngle: 90, shoulderAngle: 45 },
        deadlift: { hipHinge: 45, backAngle: 45 }
      })
    }
  }
  
  // Aggiungi infortunio
  const addInjury = () => {
    const injury = prompt('Descrivi l\'infortunio o area problematica:')
    if (injury) {
      setTempProfile(prev => ({
        ...prev,
        injuries: [...(prev.injuries || []), injury]
      }))
      if (!editMode) {
        updateProfile({ injuries: [...(tempProfile.injuries || []), injury] })
      }
    }
  }
  
  // Rimuovi infortunio
  const removeInjury = (index: number) => {
    const newInjuries = tempProfile.injuries?.filter((_, i) => i !== index) || []
    setTempProfile(prev => ({ ...prev, injuries: newInjuries }))
    if (!editMode) {
      updateProfile({ injuries: newInjuries })
    }
  }
  
  // Aggiungi obiettivo
  const addGoal = () => {
    const goal = prompt('Inserisci un obiettivo:')
    if (goal) {
      setTempProfile(prev => ({
        ...prev,
        goals: [...(prev.goals || []), goal]
      }))
      if (!editMode) {
        updateProfile({ goals: [...(tempProfile.goals || []), goal] })
      }
    }
  }
  
  // Rimuovi obiettivo
  const removeGoal = (index: number) => {
    const newGoals = tempProfile.goals?.filter((_, i) => i !== index) || []
    setTempProfile(prev => ({ ...prev, goals: newGoals }))
    if (!editMode) {
      updateProfile({ goals: newGoals })
    }
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
                      setTempProfile(profile || tempProfile)
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
                  if (!editMode) {
                    updateProfile({ name: e.target.value })
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
                  if (!editMode) {
                    updateProfile({ age })
                  }
                }}
                disabled={hasProfile && !editMode}
                className="w-full mt-1 px-3 py-2 border rounded-lg disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Peso (kg)</label>
              <input
                type="number"
                value={tempProfile.weight || ''}
                onChange={(e) => {
                  const weight = parseFloat(e.target.value) || 0
                  setTempProfile(prev => ({ ...prev, weight }))
                  if (!editMode) {
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
                  if (!editMode) {
                    updateProfile({ height })
                  }
                }}
                disabled={hasProfile && !editMode}
                className="w-full mt-1 px-3 py-2 border rounded-lg disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Livello Esperienza</label>
              <select
                value={tempProfile.experienceLevel}
                onChange={(e) => {
                  const level = e.target.value as 'beginner' | 'intermediate' | 'advanced' | 'elite'
                  setTempProfile(prev => ({ ...prev, experienceLevel: level }))
                  if (!editMode) {
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
              <label className="block text-sm font-medium text-gray-700">Giorni Allenamento</label>
              <input
                type="number"
                min="1"
                max="7"
                value={tempProfile.trainingDays || 3}
                onChange={(e) => {
                  const days = parseInt(e.target.value) || 3
                  setTempProfile(prev => ({ ...prev, trainingDays: days }))
                  if (!editMode) {
                    updateProfile({ trainingDays: days })
                  }
                }}
                disabled={hasProfile && !editMode}
                className="w-full mt-1 px-3 py-2 border rounded-lg disabled:bg-gray-100"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Obiettivo Principale</label>
              <select
                value={tempProfile.trainingGoal || 'general'}
                onChange={(e) => {
                  const goal = e.target.value as 'strength' | 'hypertrophy' | 'endurance' | 'general'
                  setTempProfile(prev => ({ ...prev, trainingGoal: goal }))
                  if (!editMode) {
                    updateProfile({ trainingGoal: goal })
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
            
            {/* Infortuni */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Infortuni / Aree Problematiche
              </label>
              <div className="space-y-2">
                {tempProfile.injuries?.map((injury, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <span className="text-sm">{injury}</span>
                    <button
                      onClick={() => removeInjury(idx)}
                      disabled={hasProfile && !editMode}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addInjury}
                  disabled={hasProfile && !editMode}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm disabled:opacity-50"
                >
                  + Aggiungi Infortunio
                </button>
              </div>
            </div>
            
            {/* Obiettivi */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Obiettivi Personali
              </label>
              <div className="space-y-2">
                {tempProfile.goals?.map((goal, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm">{goal}</span>
                    <button
                      onClick={() => removeGoal(idx)}
                      disabled={hasProfile && !editMode}
                      className="text-green-600 hover:text-green-800 disabled:opacity-50"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addGoal}
                  disabled={hasProfile && !editMode}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm disabled:opacity-50"
                >
                  + Aggiungi Obiettivo
                </button>
              </div>
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
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-3">Squat</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Profondità:</span>
                        <span className="font-medium">{calibration.squat?.depth || 90}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Angolo Ginocchio:</span>
                        <span className="font-medium">{calibration.squat?.kneeAngle || 90}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Angolo Anca:</span>
                        <span className="font-medium">{calibration.squat?.hipAngle || 90}°</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-3">Panca Piana</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Angolo Gomito:</span>
                        <span className="font-medium">{calibration.benchPress?.elbowAngle || 90}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Angolo Spalla:</span>
                        <span className="font-medium">{calibration.benchPress?.shoulderAngle || 45}°</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="font-semibold text-orange-900 mb-3">Stacco</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hip Hinge:</span>
                        <span className="font-medium">{calibration.deadlift?.hipHinge || 45}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Angolo Schiena:</span>
                        <span className="font-medium">{calibration.deadlift?.backAngle || 45}°</span>
                      </div>
                    </div>
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
          </div>
        </div>
      )}
    </div>
  )
}