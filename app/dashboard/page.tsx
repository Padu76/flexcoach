'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { 
  HomeIcon,
  UserCircleIcon,
  ChartBarIcon,
  CalculatorIcon,
  ShieldCheckIcon,
  CogIcon,
  BellIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  PlayCircleIcon,
  FireIcon,
  TrophyIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useDataManager } from '@/hooks/useDataManager'

// Dynamic imports per evitare SSR issues
const UserProfileSystem = dynamic(() => import('@/components/UserProfileSystem'), { ssr: false })
const PerformanceDashboard = dynamic(() => import('@/components/PerformanceDashboard'), { ssr: false })
const WeightPredictionSystem = dynamic(() => import('@/components/WeightPredictionSystem'), { ssr: false })
const InjuryPreventionSystem = dynamic(() => import('@/components/InjuryPreventionSystem'), { ssr: false })
const OnboardingFlow = dynamic(() => import('@/components/OnboardingFlow'), { ssr: false })

type ExerciseType = 'squat' | 'bench-press' | 'deadlift'

// Componente interno che usa useSearchParams (deve essere wrappato in Suspense)
function DashboardContent() {
  const searchParams = useSearchParams()
  const section = searchParams.get('section') || 'overview'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('squat')
  const { exportData, importData, profile, preferences } = useDataManager()
  
  // Check se mostrare onboarding
  const [showOnboarding, setShowOnboarding] = useState(false)
  
  useEffect(() => {
    // Controlla se l'onboarding è stato completato
    // Se non c'è un profilo completo, mostra onboarding
    if (!profile?.name || !profile?.age || !profile?.weight) {
      setShowOnboarding(true)
    }
  }, [profile])
  
  // Se deve mostrare onboarding, mostra solo quello
  if (showOnboarding) {
    return (
      <OnboardingFlow 
        onComplete={(onboardingData) => {
          // Qui salviamo i dati usando localStorage direttamente
          // visto che non abbiamo accesso ai metodi di update
          const currentData = localStorage.getItem('flexcoach_data')
          const data = currentData ? JSON.parse(currentData) : {}
          
          // Aggiorna il profilo
          data.profile = {
            ...data.profile,
            name: onboardingData.name,
            age: onboardingData.age,
            weight: onboardingData.weight,
            height: onboardingData.height,
            gender: onboardingData.gender,
            experienceLevel: onboardingData.experienceLevel,
            goals: onboardingData.goals,
            weeklyTrainingDays: onboardingData.weeklyTrainingDays
          }
          
          // Salva calibrazioni
          data.calibration = {
            squat: {
              exerciseType: 'squat',
              maxWeight: onboardingData.squatMax,
              lastTested: new Date().toISOString(),
              reps: 1,
              rpe: 10
            },
            'bench-press': {
              exerciseType: 'bench-press',
              maxWeight: onboardingData.benchMax,
              lastTested: new Date().toISOString(),
              reps: 1,
              rpe: 10
            },
            deadlift: {
              exerciseType: 'deadlift',
              maxWeight: onboardingData.deadliftMax,
              lastTested: new Date().toISOString(),
              reps: 1,
              rpe: 10
            }
          }
          
          localStorage.setItem('flexcoach_data', JSON.stringify(data))
          setShowOnboarding(false)
          // Ricarica la pagina per aggiornare i dati
          window.location.reload()
        }}
        onSkip={() => setShowOnboarding(false)}
      />
    )
  }
  
  // Sidebar items
  const sidebarItems = [
    { id: 'overview', name: 'Overview', icon: HomeIcon },
    { id: 'profile', name: 'Profilo', icon: UserCircleIcon },
    { id: 'performance', name: 'Performance', icon: ChartBarIcon },
    { id: 'weight-calculator', name: 'Calcolo Peso', icon: CalculatorIcon },
    { id: 'injury-prevention', name: 'Prevenzione Infortuni', icon: ShieldCheckIcon }
  ]
  
  // Exercise selector per le sezioni che lo richiedono
  const ExerciseSelector = () => (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Seleziona Esercizio
      </label>
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setSelectedExercise('squat')}
          className={`px-4 py-2 rounded-lg border-2 transition-all ${
            selectedExercise === 'squat'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          🏋️ Squat
        </button>
        <button
          onClick={() => setSelectedExercise('bench-press')}
          className={`px-4 py-2 rounded-lg border-2 transition-all ${
            selectedExercise === 'bench-press'
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          💪 Panca
        </button>
        <button
          onClick={() => setSelectedExercise('deadlift')}
          className={`px-4 py-2 rounded-lg border-2 transition-all ${
            selectedExercise === 'deadlift'
              ? 'border-orange-500 bg-orange-50 text-orange-700'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          ⚡ Stacco
        </button>
      </div>
    </div>
  )
  
  // Render content based on section
  const renderContent = () => {
    switch (section) {
      case 'overview':
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Allenamenti Totali</p>
                    <p className="text-3xl font-bold">24</p>
                  </div>
                  <FireIcon className="w-8 h-8 text-blue-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Streak Settimana</p>
                    <p className="text-3xl font-bold">5</p>
                  </div>
                  <TrophyIcon className="w-8 h-8 text-green-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Ripetizioni Totali</p>
                    <p className="text-3xl font-bold">342</p>
                  </div>
                  <ChartBarIcon className="w-8 h-8 text-purple-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Qualità Media</p>
                    <p className="text-3xl font-bold">85%</p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-orange-200" />
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Avvia Allenamento Rapido</h2>
              <ExerciseSelector />
              <Link
                href={`/exercises/${selectedExercise}/pre-workout`}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlayCircleIcon className="w-5 h-5 mr-2" />
                Inizia {selectedExercise === 'squat' ? 'Squat' : selectedExercise === 'bench-press' ? 'Panca' : 'Stacco'}
              </Link>
            </div>
            
            {/* Data Management */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Gestione Dati</h2>
              <div className="flex gap-4">
                <button
                  onClick={exportData}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                  Esporta Backup
                </button>
                <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                  <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                  Importa Backup
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
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
                    }}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <UserCircleIcon className="w-5 h-5 mr-2" />
                  Rifai Calibrazione
                </button>
              </div>
            </div>
          </div>
        )
      
      case 'profile':
        return <UserProfileSystem />
      
      case 'performance':
        return (
          <div>
            <ExerciseSelector />
            <PerformanceDashboard exerciseType={selectedExercise} />
          </div>
        )
      
      case 'injury-prevention':
        return (
          <div>
            <ExerciseSelector />
            <InjuryPreventionSystem exerciseType={selectedExercise} />
          </div>
        )
      
      case 'weight-calculator':
        return (
          <div>
            <ExerciseSelector />
            <WeightPredictionSystem 
              exerciseType={selectedExercise}
              onStartWorkout={(plan, weight) => {
                // Salva e vai all'allenamento
                window.location.href = `/exercises/${selectedExercise}/pre-workout`
              }}
            />
          </div>
        )
      
      default:
        return <div>Sezione non trovata</div>
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Always links to home */}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                FlexCoach
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 flex items-center gap-1">
                <HomeIcon className="w-4 h-4" />
                Home
              </Link>
              <Link href="/exercises" className="text-gray-700 hover:text-blue-600">
                Esercizi
              </Link>
              <Link href="/dashboard" className="text-blue-600 font-medium">
                Dashboard
              </Link>
              <Link href="/dashboard?section=profile" className="text-gray-700 hover:text-blue-600">
                Profilo
              </Link>
            </div>
            
            {/* Desktop Menu Right */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-blue-600">
                <BellIcon className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-blue-600">
                <CogIcon className="w-5 h-5" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <UserCircleIcon className="w-4 h-4" />
                Accedi
              </button>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                Home
              </Link>
              <Link href="/exercises" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                Esercizi
              </Link>
              <Link href="/dashboard" className="block px-3 py-2 text-blue-600 font-medium">
                Dashboard
              </Link>
              <Link href="/dashboard?section=profile" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                Profilo
              </Link>
              <button className="w-full text-left px-3 py-2 text-blue-600 font-medium">
                Accedi
              </button>
            </div>
          </div>
        )}
      </nav>
      
      {/* Main Content */}
      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
              <div className="flex-grow flex flex-col">
                <nav className="flex-1 px-2 py-4 bg-white space-y-1">
                  {sidebarItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/dashboard?section=${item.id}`}
                      className={`
                        group flex items-center px-2 py-2 text-sm font-medium rounded-md
                        ${section === item.id 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <item.icon className={`
                        mr-3 h-5 w-5
                        ${section === item.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
                      `} />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
              
              {/* Sidebar Footer */}
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <div className="flex-shrink-0 w-full group block">
                  <div className="flex items-center">
                    <UserCircleIcon className="inline-block h-9 w-9 rounded-full text-gray-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700">User</p>
                      <p className="text-xs font-medium text-gray-500">View profile</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {renderContent()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

// Loading fallback component
function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Caricamento dashboard...</p>
      </div>
    </div>
  )
}

// Main component con Suspense boundary
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  )
}