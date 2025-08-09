// components/OnboardingFlow.tsx - Sistema completo onboarding e calibrazione

'use client'

import { useState, useEffect } from 'react'
import { 
  UserCircleIcon,
  ChartBarIcon,
  FireIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ScaleIcon,
  CalendarIcon,
  TrophyIcon,
  BeakerIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import type { ExerciseType } from '@/types'

// Export per usarlo anche nel componente padre
export interface OnboardingData {
  // Step 1: Dati Personali
  name: string
  age: number
  weight: number
  height: number
  gender: 'male' | 'female' | 'other'
  
  // Step 2: Esperienza
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  trainingYears: number
  currentlyTraining: boolean
  injuries: string[]
  
  // Step 3: Obiettivi
  goals: ('strength' | 'muscle' | 'endurance' | 'weight_loss' | 'athletic')[]
  weeklyTrainingDays: number
  preferredTime: 'morning' | 'afternoon' | 'evening'
  
  // Step 4: Calibrazione Forza
  squatMax: number
  benchMax: number
  deadliftMax: number
  testedMaxes: boolean
}

interface Props {
  onComplete: (data: OnboardingData) => void
  onSkip?: () => void
}

export default function OnboardingFlow({ onComplete, onSkip }: Props) {
  // Rimosso useDataManager - i dati verranno salvati dal componente padre
  const [currentStep, setCurrentStep] = useState(1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [data, setData] = useState<OnboardingData>({
    name: '',
    age: 25,
    weight: 70,
    height: 175,
    gender: 'male',
    experienceLevel: 'beginner',
    trainingYears: 0,
    currentlyTraining: false,
    injuries: [],
    goals: [],
    weeklyTrainingDays: 3,
    preferredTime: 'evening',
    squatMax: 0,
    benchMax: 0,
    deadliftMax: 0,
    testedMaxes: false
  })
  
  const totalSteps = 5
  
  // Calcola BMI
  const calculateBMI = () => {
    const heightInM = data.height / 100
    return (data.weight / (heightInM * heightInM)).toFixed(1)
  }
  
  // Calcola 1RM stimato basato su esperienza e peso corporeo
  const estimateMax = (exercise: 'squat' | 'bench' | 'deadlift') => {
    const bodyweight = data.weight
    let multiplier = 1
    
    // Moltiplicatori basati su esperienza e esercizio
    const multipliers = {
      beginner: { squat: 0.8, bench: 0.6, deadlift: 1.0 },
      intermediate: { squat: 1.5, bench: 1.0, deadlift: 1.8 },
      advanced: { squat: 2.0, bench: 1.5, deadlift: 2.5 }
    }
    
    // Aggiustamento per genere
    const genderMultiplier = data.gender === 'female' ? 0.7 : 1.0
    
    multiplier = multipliers[data.experienceLevel][exercise] * genderMultiplier
    
    return Math.round(bodyweight * multiplier)
  }
  
  // Auto-stima massimali se non testati
  useEffect(() => {
    if (!data.testedMaxes) {
      setData(prev => ({
        ...prev,
        squatMax: estimateMax('squat'),
        benchMax: estimateMax('bench'),
        deadliftMax: estimateMax('deadlift')
      }))
    }
  }, [data.weight, data.experienceLevel, data.gender, data.testedMaxes])
  
  // Validazione per ogni step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (step) {
      case 1:
        if (!data.name.trim()) newErrors.name = 'Nome richiesto'
        if (data.age < 14 || data.age > 100) newErrors.age = 'Età deve essere tra 14 e 100'
        if (data.weight < 30 || data.weight > 300) newErrors.weight = 'Peso deve essere tra 30 e 300 kg'
        if (data.height < 120 || data.height > 250) newErrors.height = 'Altezza deve essere tra 120 e 250 cm'
        break
        
      case 2:
        if (data.trainingYears < 0 || data.trainingYears > 50) {
          newErrors.trainingYears = 'Anni di allenamento non validi'
        }
        break
        
      case 3:
        if (data.goals.length === 0) newErrors.goals = 'Seleziona almeno un obiettivo'
        if (data.weeklyTrainingDays < 1 || data.weeklyTrainingDays > 7) {
          newErrors.weeklyTrainingDays = 'Giorni deve essere tra 1 e 7'
        }
        break
        
      case 4:
        if (data.testedMaxes) {
          if (data.squatMax < 20 || data.squatMax > 500) newErrors.squatMax = 'Squat max non valido'
          if (data.benchMax < 20 || data.benchMax > 400) newErrors.benchMax = 'Panca max non valido'
          if (data.deadliftMax < 20 || data.deadliftMax > 600) newErrors.deadliftMax = 'Stacco max non valido'
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Gestione navigazione
  const handleNext = () => {
    if (!validateStep(currentStep)) return
    
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
      setIsAnimating(false)
    }, 300)
  }
  
  const handleBack = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStep(prev => Math.max(prev - 1, 1))
      setIsAnimating(false)
    }, 300)
  }
  
  // Salva dati e completa onboarding
  const handleComplete = () => {
    if (!validateStep(currentStep)) return
    
    // Passa i dati al componente padre che li salverà
    onComplete(data)
  }
  
  // Progress bar component
  const ProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Step {currentStep} di {totalSteps}
        </span>
        <span className="text-sm text-gray-500">
          {Math.round((currentStep / totalSteps) * 100)}% completato
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  )
  
  // Step 1: Dati Personali
  const Step1PersonalData = () => (
    <div className={`space-y-6 ${isAnimating ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
      <div className="text-center mb-6">
        <UserCircleIcon className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Benvenuto in FlexCoach!</h2>
        <p className="text-gray-600 mt-2">Iniziamo con alcune informazioni di base</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Come ti chiami?
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => setData({...data, name: e.target.value})}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Il tuo nome"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Età
          </label>
          <input
            type="number"
            value={data.age}
            onChange={(e) => setData({...data, age: parseInt(e.target.value)})}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.age ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Genere
          </label>
          <select
            value={data.gender}
            onChange={(e) => setData({...data, gender: e.target.value as any})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="male">Maschile</option>
            <option value="female">Femminile</option>
            <option value="other">Altro</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Peso (kg)
          </label>
          <input
            type="number"
            value={data.weight}
            onChange={(e) => setData({...data, weight: parseFloat(e.target.value)})}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.weight ? 'border-red-500' : 'border-gray-300'
            }`}
            step="0.5"
          />
          {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Altezza (cm)
          </label>
          <input
            type="number"
            value={data.height}
            onChange={(e) => setData({...data, height: parseInt(e.target.value)})}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.height ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height}</p>}
        </div>
      </div>
      
      {data.weight > 0 && data.height > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Il tuo BMI:</span>
            <span className="font-bold text-blue-600">{calculateBMI()}</span>
          </div>
        </div>
      )}
    </div>
  )
  
  // Step 2: Esperienza
  const Step2Experience = () => (
    <div className={`space-y-6 ${isAnimating ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
      <div className="text-center mb-6">
        <ChartBarIcon className="w-16 h-16 mx-auto text-purple-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">La tua esperienza</h2>
        <p className="text-gray-600 mt-2">Aiutaci a personalizzare il tuo programma</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Livello di esperienza
        </label>
        <div className="space-y-2">
          {[
            { value: 'beginner', label: 'Principiante', desc: 'Meno di 1 anno di allenamento' },
            { value: 'intermediate', label: 'Intermedio', desc: '1-3 anni di allenamento costante' },
            { value: 'advanced', label: 'Avanzato', desc: 'Oltre 3 anni di allenamento serio' }
          ].map(level => (
            <button
              key={level.value}
              onClick={() => setData({...data, experienceLevel: level.value as any})}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                data.experienceLevel === level.value
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-left">
                <div className="font-medium">{level.label}</div>
                <div className="text-sm text-gray-500">{level.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Da quanti anni ti alleni?
        </label>
        <input
          type="number"
          value={data.trainingYears}
          onChange={(e) => setData({...data, trainingYears: parseInt(e.target.value)})}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
            errors.trainingYears ? 'border-red-500' : 'border-gray-300'
          }`}
          min="0"
          max="50"
        />
        {errors.trainingYears && <p className="text-red-500 text-xs mt-1">{errors.trainingYears}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ti stai allenando attualmente?
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => setData({...data, currentlyTraining: true})}
            className={`flex-1 py-2 px-4 rounded-lg border-2 ${
              data.currentlyTraining
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200'
            }`}
          >
            Sì
          </button>
          <button
            onClick={() => setData({...data, currentlyTraining: false})}
            className={`flex-1 py-2 px-4 rounded-lg border-2 ${
              !data.currentlyTraining
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-200'
            }`}
          >
            No
          </button>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hai infortuni o limitazioni?
        </label>
        <div className="space-y-2">
          {['Schiena', 'Ginocchia', 'Spalle', 'Polsi', 'Caviglie'].map(injury => (
            <label key={injury} className="flex items-center">
              <input
                type="checkbox"
                checked={data.injuries.includes(injury)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setData({...data, injuries: [...data.injuries, injury]})
                  } else {
                    setData({...data, injuries: data.injuries.filter(i => i !== injury)})
                  }
                }}
                className="mr-2 rounded text-purple-500"
              />
              <span className="text-sm">{injury}</span>
            </label>
          ))}
        </div>
      </div>
      
      {data.injuries.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              FlexCoach adatterà gli esercizi considerando le tue limitazioni
            </div>
          </div>
        </div>
      )}
    </div>
  )
  
  // Step 3: Obiettivi
  const Step3Goals = () => (
    <div className={`space-y-6 ${isAnimating ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
      <div className="text-center mb-6">
        <TrophyIcon className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">I tuoi obiettivi</h2>
        <p className="text-gray-600 mt-2">Cosa vuoi raggiungere con FlexCoach?</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Seleziona i tuoi obiettivi principali
        </label>
        <div className="space-y-2">
          {[
            { value: 'strength', label: 'Forza', icon: '💪', desc: 'Aumentare i massimali' },
            { value: 'muscle', label: 'Massa Muscolare', icon: '🏋️', desc: 'Ipertrofia e volume' },
            { value: 'endurance', label: 'Resistenza', icon: '🏃', desc: 'Migliorare la resistenza' },
            { value: 'weight_loss', label: 'Dimagrimento', icon: '⚖️', desc: 'Perdere peso' },
            { value: 'athletic', label: 'Performance Atletica', icon: '⚡', desc: 'Sport specifico' }
          ].map(goal => (
            <button
              key={goal.value}
              onClick={() => {
                if (data.goals.includes(goal.value as any)) {
                  setData({...data, goals: data.goals.filter(g => g !== goal.value)})
                } else {
                  setData({...data, goals: [...data.goals, goal.value as any]})
                }
              }}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                data.goals.includes(goal.value as any)
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{goal.icon}</span>
                <div className="text-left flex-1">
                  <div className="font-medium">{goal.label}</div>
                  <div className="text-sm text-gray-500">{goal.desc}</div>
                </div>
                {data.goals.includes(goal.value as any) && (
                  <CheckCircleIcon className="w-6 h-6 text-yellow-600" />
                )}
              </div>
            </button>
          ))}
        </div>
        {errors.goals && <p className="text-red-500 text-xs mt-1">{errors.goals}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quanti giorni a settimana puoi allenarti?
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map(day => (
            <button
              key={day}
              onClick={() => setData({...data, weeklyTrainingDays: day})}
              className={`flex-1 py-2 rounded-lg border-2 ${
                data.weeklyTrainingDays === day
                  ? 'border-yellow-500 bg-yellow-50 text-yellow-700 font-bold'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Momento preferito per allenarti
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'morning', label: 'Mattina', icon: '🌅' },
            { value: 'afternoon', label: 'Pomeriggio', icon: '☀️' },
            { value: 'evening', label: 'Sera', icon: '🌙' }
          ].map(time => (
            <button
              key={time.value}
              onClick={() => setData({...data, preferredTime: time.value as any})}
              className={`py-3 rounded-lg border-2 ${
                data.preferredTime === time.value
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">{time.icon}</div>
              <div className="text-sm">{time.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
  
  // Step 4: Calibrazione Forza
  const Step4Calibration = () => (
    <div className={`space-y-6 ${isAnimating ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
      <div className="text-center mb-6">
        <BeakerIcon className="w-16 h-16 mx-auto text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Calibrazione Forza</h2>
        <p className="text-gray-600 mt-2">Impostiamo i tuoi massimali di partenza</p>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-start gap-2">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Come funziona?</p>
            <p>Abbiamo stimato i tuoi massimali basandoci sui tuoi dati. 
            Puoi modificarli se conosci i tuoi 1RM reali.</p>
          </div>
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">
            Conosci i tuoi massimali reali?
          </label>
          <button
            onClick={() => setData({...data, testedMaxes: !data.testedMaxes})}
            className={`px-4 py-1 rounded-full text-sm font-medium ${
              data.testedMaxes
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {data.testedMaxes ? 'Sì, inserisco io' : 'No, usa stime'}
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Squat */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏋️</span>
              <span className="font-medium">Squat</span>
            </div>
            {!data.testedMaxes && (
              <span className="text-xs text-gray-500">Stimato</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={data.squatMax}
              onChange={(e) => setData({
                ...data, 
                squatMax: parseInt(e.target.value),
                testedMaxes: true
              })}
              className={`flex-1 px-3 py-2 border rounded-lg font-bold text-lg ${
                errors.squatMax ? 'border-red-500' : 'border-gray-300'
              }`}
              min="20"
              max="500"
            />
            <span className="text-gray-600">kg</span>
          </div>
          {errors.squatMax && <p className="text-red-500 text-xs mt-1">{errors.squatMax}</p>}
          <div className="mt-2 text-xs text-gray-500">
            Rapporto peso corporeo: {(data.squatMax / data.weight).toFixed(2)}x
          </div>
        </div>
        
        {/* Bench Press */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💪</span>
              <span className="font-medium">Panca Piana</span>
            </div>
            {!data.testedMaxes && (
              <span className="text-xs text-gray-500">Stimato</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={data.benchMax}
              onChange={(e) => setData({
                ...data, 
                benchMax: parseInt(e.target.value),
                testedMaxes: true
              })}
              className={`flex-1 px-3 py-2 border rounded-lg font-bold text-lg ${
                errors.benchMax ? 'border-red-500' : 'border-gray-300'
              }`}
              min="20"
              max="400"
            />
            <span className="text-gray-600">kg</span>
          </div>
          {errors.benchMax && <p className="text-red-500 text-xs mt-1">{errors.benchMax}</p>}
          <div className="mt-2 text-xs text-gray-500">
            Rapporto peso corporeo: {(data.benchMax / data.weight).toFixed(2)}x
          </div>
        </div>
        
        {/* Deadlift */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="font-medium">Stacco da Terra</span>
            </div>
            {!data.testedMaxes && (
              <span className="text-xs text-gray-500">Stimato</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={data.deadliftMax}
              onChange={(e) => setData({
                ...data, 
                deadliftMax: parseInt(e.target.value),
                testedMaxes: true
              })}
              className={`flex-1 px-3 py-2 border rounded-lg font-bold text-lg ${
                errors.deadliftMax ? 'border-red-500' : 'border-gray-300'
              }`}
              min="20"
              max="600"
            />
            <span className="text-gray-600">kg</span>
          </div>
          {errors.deadliftMax && <p className="text-red-500 text-xs mt-1">{errors.deadliftMax}</p>}
          <div className="mt-2 text-xs text-gray-500">
            Rapporto peso corporeo: {(data.deadliftMax / data.weight).toFixed(2)}x
          </div>
        </div>
      </div>
      
      <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
        <div className="text-sm text-green-800">
          <p className="font-medium mb-1">💡 Suggerimento</p>
          <p>Non preoccuparti se non sei sicuro! Potrai sempre aggiornare 
          questi valori dopo aver fatto dei test in palestra.</p>
        </div>
      </div>
    </div>
  )
  
  // Step 5: Riepilogo
  const Step5Summary = () => (
    <div className={`space-y-6 ${isAnimating ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
      <div className="text-center mb-6">
        <SparklesIcon className="w-16 h-16 mx-auto text-indigo-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Tutto pronto!</h2>
        <p className="text-gray-600 mt-2">Ecco il tuo profilo FlexCoach personalizzato</p>
      </div>
      
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl">
        <h3 className="font-bold text-lg mb-4 text-gray-900">Il tuo profilo</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Nome:</span>
            <span className="font-medium">{data.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Età:</span>
            <span className="font-medium">{data.age} anni</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Peso/Altezza:</span>
            <span className="font-medium">{data.weight}kg / {data.height}cm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">BMI:</span>
            <span className="font-medium">{calculateBMI()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Esperienza:</span>
            <span className="font-medium capitalize">
              {data.experienceLevel === 'beginner' ? 'Principiante' :
               data.experienceLevel === 'intermediate' ? 'Intermedio' : 'Avanzato'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="font-bold text-lg mb-4 text-gray-900">I tuoi massimali</h3>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600">{data.squatMax}</div>
            <div className="text-xs text-gray-600">kg</div>
            <div className="text-sm mt-1">Squat</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">{data.benchMax}</div>
            <div className="text-xs text-gray-600">kg</div>
            <div className="text-sm mt-1">Panca</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">{data.deadliftMax}</div>
            <div className="text-xs text-gray-600">kg</div>
            <div className="text-sm mt-1">Stacco</div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="text-center text-sm text-gray-600">
            Totale PowerLifting: <span className="font-bold text-gray-900">
              {data.squatMax + data.benchMax + data.deadliftMax} kg
            </span>
          </div>
        </div>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <TrophyIcon className="w-5 h-5 text-yellow-600" />
          <span className="font-medium text-yellow-900">I tuoi obiettivi</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.goals.map(goal => (
            <span key={goal} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              {goal === 'strength' ? 'Forza' :
               goal === 'muscle' ? 'Massa' :
               goal === 'endurance' ? 'Resistenza' :
               goal === 'weight_loss' ? 'Dimagrimento' : 'Performance'}
            </span>
          ))}
        </div>
        <div className="mt-2 text-sm text-yellow-800">
          {data.weeklyTrainingDays} giorni a settimana
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-xl">
        <h3 className="font-bold text-lg mb-2">Pronto per iniziare!</h3>
        <p className="text-sm opacity-90">
          FlexCoach ha creato un programma personalizzato basato sui tuoi dati. 
          I pesi di lavoro sono calcolati automaticamente in base ai tuoi massimali.
        </p>
      </div>
    </div>
  )
  
  // Render step corrente
  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1PersonalData />
      case 2: return <Step2Experience />
      case 3: return <Step3Goals />
      case 4: return <Step4Calibration />
      case 5: return <Step5Summary />
      default: return null
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <ProgressBar />
          
          {renderStep()}
          
          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-8">
            {currentStep > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Indietro
              </button>
            ) : (
              <button
                onClick={onSkip}
                className="text-gray-500 hover:text-gray-700"
              >
                Salta per ora
              </button>
            )}
            
            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-shadow"
              >
                Avanti
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-shadow"
              >
                <CheckCircleIcon className="w-5 h-5" />
                Inizia FlexCoach
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}