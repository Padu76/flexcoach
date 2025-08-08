// app/pre-workout/PreWorkoutPage.tsx - Pagina Pre-Workout con Header unificato

'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Link from 'next/link'
import { 
  FireIcon,
  ClockIcon,
  ScaleIcon,
  ChartBarIcon,
  CheckCircleIcon,
  PlayIcon,
  AdjustmentsHorizontalIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import WeightPredictionSystem from '@/components/WeightPredictionSystem'
import UserProfileSystem from '@/components/UserProfileSystem'
import { useUserProfile } from '@/hooks/useDataManager'

interface Props {
  exerciseType: 'squat' | 'bench-press' | 'deadlift'
}

export default function PreWorkoutPage({ exerciseType }: Props) {
  const { profile, hasProfile } = useUserProfile()
  const [currentStep, setCurrentStep] = useState<'profile' | 'weight' | 'ready'>('profile')
  const [selectedWeight, setSelectedWeight] = useState<number>(0)
  const [workoutPlan, setWorkoutPlan] = useState<any>(null)
  
  // Se ha già un profilo, passa direttamente al calcolo peso
  useEffect(() => {
    if (hasProfile && currentStep === 'profile') {
      setCurrentStep('weight')
    }
  }, [hasProfile, currentStep])
  
  const getExerciseName = () => {
    switch (exerciseType) {
      case 'squat': return 'Squat'
      case 'bench-press': return 'Panca Piana'
      case 'deadlift': return 'Stacco da Terra'
      default: return 'Esercizio'
    }
  }
  
  const getExerciseEmoji = () => {
    switch (exerciseType) {
      case 'squat': return '🏋️'
      case 'bench-press': return '💪'
      case 'deadlift': return '⚡'
      default: return '🎯'
    }
  }
  
  const getExerciseColor = () => {
    switch (exerciseType) {
      case 'squat': return 'blue'
      case 'bench-press': return 'green'
      case 'deadlift': return 'orange'
      default: return 'gray'
    }
  }
  
  const handleStartWorkout = (plan: any, weight: number) => {
    setWorkoutPlan(plan)
    setSelectedWeight(weight)
    setCurrentStep('ready')
  }
  
  const steps = [
    { id: 'profile', name: 'Profilo', icon: AdjustmentsHorizontalIcon },
    { id: 'weight', name: 'Calcolo Peso', icon: ScaleIcon },
    { id: 'ready', name: 'Pronto!', icon: CheckCircleIcon }
  ]
  
  const getCurrentStepIndex = () => {
    return steps.findIndex(s => s.id === currentStep)
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header della pagina */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              {getExerciseEmoji()} Pre-Workout Setup - {getExerciseName()}
            </h1>
            <p className="text-gray-600 mt-2">
              Prepara il tuo allenamento con AI personalizzata
            </p>
          </div>
          
          {/* Progress Steps */}
          <div className="mb-8">
            <nav aria-label="Progress">
              <ol className="flex items-center">
                {steps.map((step, stepIdx) => (
                  <li key={step.id} className={`${
                    stepIdx !== steps.length - 1 ? 'flex-1' : ''
                  } relative`}>
                    <div className="flex items-center">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${getCurrentStepIndex() >= stepIdx 
                          ? `bg-${getExerciseColor()}-600 text-white` 
                          : 'bg-gray-200 text-gray-400'
                        }
                      `}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      {stepIdx !== steps.length - 1 && (
                        <div className={`
                          flex-1 h-0.5 mx-4
                          ${getCurrentStepIndex() > stepIdx 
                            ? `bg-${getExerciseColor()}-600` 
                            : 'bg-gray-200'
                          }
                        `} />
                      )}
                    </div>
                    <span className={`
                      text-xs mt-1 block
                      ${getCurrentStepIndex() >= stepIdx 
                        ? 'text-gray-900 font-medium' 
                        : 'text-gray-400'
                      }
                    `}>
                      {step.name}
                    </span>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          
          {/* Content Area */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Step 1: Profile */}
            {currentStep === 'profile' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    👤 Configura il tuo Profilo
                  </h2>
                  <p className="text-gray-600">
                    Crea o aggiorna il tuo profilo per raccomandazioni personalizzate
                  </p>
                </div>
                
                <UserProfileSystem />
                
                {hasProfile && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setCurrentStep('weight')}
                      className={`
                        px-6 py-3 bg-${getExerciseColor()}-600 text-white 
                        rounded-lg hover:bg-${getExerciseColor()}-700 
                        transition-colors flex items-center gap-2
                      `}
                    >
                      Continua
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Step 2: Weight Calculation */}
            {currentStep === 'weight' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    ⚖️ Calcolo Peso Ottimale
                  </h2>
                  <p className="text-gray-600">
                    L'AI calcolerà il peso perfetto basandosi sul tuo profilo e obiettivi
                  </p>
                </div>
                
                <WeightPredictionSystem 
                  exerciseType={exerciseType}
                  onStartWorkout={handleStartWorkout}
                />
                
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setCurrentStep('profile')}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    ← Torna al Profilo
                  </button>
                </div>
              </div>
            )}
            
            {/* Step 3: Ready to Start */}
            {currentStep === 'ready' && workoutPlan && (
              <div className="text-center py-12">
                <div className={`
                  w-24 h-24 mx-auto mb-6 rounded-full 
                  bg-${getExerciseColor()}-100 flex items-center justify-center
                `}>
                  <CheckCircleIcon className={`w-12 h-12 text-${getExerciseColor()}-600`} />
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Tutto Pronto! 🚀
                </h2>
                
                <p className="text-lg text-gray-600 mb-8">
                  Il tuo allenamento di {getExerciseName()} è configurato
                </p>
                
                {/* Riepilogo */}
                <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-6 mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Riepilogo Allenamento:</h3>
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Esercizio:</span>
                      <span className="font-medium">{getExerciseName()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Peso consigliato:</span>
                      <span className="font-medium text-lg">{selectedWeight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Serie × Reps:</span>
                      <span className="font-medium">
                        {workoutPlan.targetSets} × {workoutPlan.targetReps}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Riposo:</span>
                      <span className="font-medium">{workoutPlan.restTime}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Obiettivo:</span>
                      <span className="font-medium capitalize">{workoutPlan.objective}</span>
                    </div>
                  </div>
                </div>
                
                {/* Warning Box */}
                <div className="max-w-md mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                  <div className="flex">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
                    <div className="text-sm text-yellow-800 text-left">
                      <p className="font-semibold mb-1">Ricorda:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Fai sempre riscaldamento progressivo</li>
                        <li>Mantieni la forma corretta</li>
                        <li>Ascolta il tuo corpo</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href={`/exercises/${exerciseType}`}
                    className={`
                      inline-flex items-center justify-center px-8 py-4 
                      bg-${getExerciseColor()}-600 text-white font-medium 
                      rounded-lg hover:bg-${getExerciseColor()}-700 
                      transition-colors shadow-lg
                    `}
                  >
                    <PlayIcon className="w-5 h-5 mr-2" />
                    Inizia Allenamento
                  </Link>
                  
                  <button
                    onClick={() => setCurrentStep('weight')}
                    className="inline-flex items-center justify-center px-8 py-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Modifica Setup
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Info Cards */}
          {currentStep === 'profile' && (
            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <FireIcon className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  AI Personalizzata
                </h3>
                <p className="text-sm text-gray-600">
                  Il sistema apprende dalle tue caratteristiche per suggerimenti ottimali
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-6">
                <ChartBarIcon className="w-8 h-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Progressione Smart
                </h3>
                <p className="text-sm text-gray-600">
                  Calcolo automatico del peso basato su storico e obiettivi
                </p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-6">
                <ClockIcon className="w-8 h-8 text-purple-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Setup Veloce
                </h3>
                <p className="text-sm text-gray-600">
                  In 2 minuti sei pronto per allenarti con parametri ottimizzati
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}