'use client'

import { useState, useEffect } from 'react'
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
  TrophyIcon,
  SparklesIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import type { ExerciseType } from '@/types'

// Import componenti (se esistono)
import dynamic from 'next/dynamic'

// Import dinamici per evitare errori SSR
const UserProfileSystem = dynamic(() => import('@/components/UserProfileSystem'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center py-12"><div className="text-gray-500">Caricamento profilo...</div></div>
})

const PerformanceDashboard = dynamic(() => import('@/components/PerformanceDashboard'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center py-12"><div className="text-gray-500">Caricamento dashboard...</div></div>
})

const InjuryPreventionSystem = dynamic(() => import('@/components/InjuryPreventionSystem'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center py-12"><div className="text-gray-500">Caricamento sistema infortuni...</div></div>
})

const WeightPredictionSystem = dynamic(() => import('@/components/WeightPredictionSystem'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center py-12"><div className="text-gray-500">Caricamento predizione pesi...</div></div>
})

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState('overview')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('squat')
  const [userData, setUserData] = useState({
    name: 'Atleta',
    workoutsThisWeek: 3,
    totalWorkouts: 42,
    currentStreak: 7,
    lastWorkout: 'Oggi',
    perfectReps: 156,
    totalVolume: '12,450 kg',
    achievements: 8
  })

  // Check URL params per sezione
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const section = params.get('section')
    if (section) {
      setActiveSection(section)
    }
  }, [])

  const menuItems = [
    { id: 'overview', name: 'Panoramica', icon: HomeIcon },
    { id: 'profile', name: 'Profilo', icon: UserCircleIcon },
    { id: 'performance', name: 'Performance', icon: ChartBarIcon },
    { id: 'weight-calculator', name: 'Calcolo Pesi', icon: CalculatorIcon },
    { id: 'injury-prevention', name: 'Prevenzione Infortuni', icon: ShieldCheckIcon },
    { id: 'settings', name: 'Impostazioni', icon: CogIcon },
  ]

  const exercises = [
    { value: 'squat', label: 'Squat', icon: '🏋️' },
    { value: 'bench-press', label: 'Panca Piana', icon: '💪' },
    { value: 'deadlift', label: 'Stacco da Terra', icon: '⚡' }
  ]

  const renderContent = () => {
    switch(activeSection) {
      case 'profile':
        return <UserProfileSystem />
      
      case 'performance':
        return (
          <div className="space-y-4">
            {/* Exercise Selector for Performance */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleziona Esercizio da Analizzare
              </label>
              <div className="flex gap-2">
                {exercises.map(exercise => (
                  <button
                    key={exercise.value}
                    onClick={() => setSelectedExercise(exercise.value as ExerciseType)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedExercise === exercise.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{exercise.icon}</span>
                    <span>{exercise.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <PerformanceDashboard exerciseType={selectedExercise} />
          </div>
        )
      
      case 'injury-prevention':
        return <InjuryPreventionSystem />
      
      case 'weight-calculator':
        return (
          <div className="space-y-4">
            {/* Exercise Selector for Weight Calculator */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calcola Peso Ottimale per:
              </label>
              <div className="flex gap-2">
                {exercises.map(exercise => (
                  <button
                    key={exercise.value}
                    onClick={() => setSelectedExercise(exercise.value as ExerciseType)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedExercise === exercise.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{exercise.icon}</span>
                    <span>{exercise.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <WeightPredictionSystem 
              exerciseType={selectedExercise}
              onStartWorkout={(plan, weight) => {
                // Naviga alla pagina esercizio con parametri
                window.location.href = `/exercises/${selectedExercise}?weight=${weight}&reps=${plan.targetReps}&sets=${plan.targetSets}`
              }}
            />
          </div>
        )
      
      case 'settings':
        return <SettingsSection />
      
      case 'overview':
      default:
        return <OverviewSection userData={userData} selectedExercise={selectedExercise} setSelectedExercise={setSelectedExercise} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Sempre Cliccabile */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FlexCoach AI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link href="/exercises" className="text-gray-600 hover:text-gray-900 transition-colors">
                Esercizi
              </Link>
              <Link href="/dashboard" className="text-gray-900 font-medium">
                Dashboard
              </Link>
              <Link href="/dashboard?section=profile" className="text-gray-600 hover:text-gray-900 transition-colors">
                Profilo
              </Link>
            </nav>

            {/* Desktop Right Menu */}
            <div className="hidden md:flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <BellIcon className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <UserCircleIcon className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Cog6ToothIcon className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              ) : (
                <Bars3Icon className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-2 space-y-1">
              <Link 
                href="/" 
                className="block px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/exercises" 
                className="block px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Esercizi
              </Link>
              <Link 
                href="/dashboard" 
                className="block px-3 py-2 rounded-lg bg-blue-50 text-blue-600 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                href="/dashboard?section=profile" 
                className="block px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profilo
              </Link>
              <div className="border-t border-gray-200 mt-2 pt-2">
                <button className="w-full text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2">
                  <BellIcon className="w-5 h-5" />
                  Notifiche
                  <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                  Impostazioni
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Layout */}
      <div className="flex h-screen pt-16">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex md:w-64 bg-white shadow-sm">
          <div className="flex flex-col w-full">
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Menu Dashboard
              </h2>
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Quick Actions */}
            <div className="p-4 mt-auto border-t">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Azioni Rapide
              </h3>
              <div className="space-y-2">
                <Link 
                  href="/exercises"
                  className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <SparklesIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Nuovo Allenamento</span>
                </Link>
                <button className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Esporta Dati</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-5 gap-1 p-2">
          {menuItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
                activeSection === item.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

// Componente Overview
function OverviewSection({ 
  userData, 
  selectedExercise, 
  setSelectedExercise 
}: { 
  userData: any, 
  selectedExercise: ExerciseType,
  setSelectedExercise: (exercise: ExerciseType) => void
}) {
  const exercises = [
    { value: 'squat', label: 'Squat', icon: '🏋️' },
    { value: 'bench-press', label: 'Panca Piana', icon: '💪' },
    { value: 'deadlift', label: 'Stacco da Terra', icon: '⚡' }
  ]

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Bentornato, {userData.name}! 💪
        </h1>
        <p className="text-gray-600 mt-1">
          Ecco il tuo riepilogo fitness
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <ChartBarIcon className="w-8 h-8 text-blue-600" />
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              +12%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{userData.totalWorkouts}</p>
          <p className="text-sm text-gray-600">Allenamenti Totali</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <TrophyIcon className="w-8 h-8 text-yellow-600" />
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              Livello 5
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{userData.achievements}</p>
          <p className="text-sm text-gray-600">Achievement</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <SparklesIcon className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{userData.currentStreak}</p>
          <p className="text-sm text-gray-600">Giorni di Streak 🔥</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <ShieldCheckIcon className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{userData.perfectReps}</p>
          <p className="text-sm text-gray-600">Rep Perfette</p>
        </div>
      </div>

      {/* Quick Start with Exercise Selector */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-8">
        <h2 className="text-2xl font-bold mb-2">Pronto per allenarti?</h2>
        <p className="mb-4 opacity-90">
          Il tuo ultimo allenamento è stato {userData.lastWorkout}. Continuiamo il momentum!
        </p>
        
        {/* Exercise Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-white/80 mb-2">
            Scegli l'esercizio:
          </label>
          <div className="flex gap-2 flex-wrap">
            {exercises.map(exercise => (
              <button
                key={exercise.value}
                onClick={() => setSelectedExercise(exercise.value as ExerciseType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedExercise === exercise.value
                    ? 'bg-white text-blue-600 scale-105'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <span>{exercise.icon}</span>
                <span>{exercise.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        <Link 
          href={`/exercises/${selectedExercise}`}
          className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Inizia {exercises.find(e => e.value === selectedExercise)?.label}
          <SparklesIcon className="w-5 h-5" />
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attività Recente</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">🏋️</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Squat</p>
                <p className="text-sm text-gray-600">Oggi - 4 serie, 32 reps</p>
              </div>
            </div>
            <span className="text-sm text-green-600 font-medium">95% Qualità</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">💪</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Panca Piana</p>
                <p className="text-sm text-gray-600">Ieri - 5 serie, 25 reps</p>
              </div>
            </div>
            <span className="text-sm text-green-600 font-medium">92% Qualità</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">⚡</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Stacco</p>
                <p className="text-sm text-gray-600">2 giorni fa - 3 serie, 15 reps</p>
              </div>
            </div>
            <span className="text-sm text-yellow-600 font-medium">88% Qualità</span>
          </div>
        </div>
      </div>
    </>
  )
}

// Componente Settings
function SettingsSection() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Impostazioni</h2>
      
      <div className="space-y-6">
        {/* Account Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="tuo@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Il tuo nome"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifiche</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-gray-700">Promemoria allenamento</span>
              <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" defaultChecked />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-gray-700">Achievement sbloccati</span>
              <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" defaultChecked />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-gray-700">Report settimanale</span>
              <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" defaultChecked />
            </label>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestione Dati</h3>
          <div className="space-y-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <DocumentArrowDownIcon className="w-5 h-5" />
              Esporta i miei dati
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <DocumentArrowUpIcon className="w-5 h-5" />
              Importa dati
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
              Cancella tutti i dati
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}