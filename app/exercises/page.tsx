'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  PlayCircleIcon, 
  ChartBarIcon, 
  ClockIcon,
  FireIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface Exercise {
  id: string
  name: string
  description: string
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzato'
  muscleGroups: string[]
  icon: string
  path: string
  available: boolean
}

const exercises: Exercise[] = [
  {
    id: 'squat',
    name: 'Squat',
    description: 'Esercizio fondamentale per gambe e glutei. Il nostro AI monitora la profondità e la forma perfetta.',
    difficulty: 'Intermedio',
    muscleGroups: ['Quadricipiti', 'Glutei', 'Core'],
    icon: '🏋️',
    path: '/exercises/squat',
    available: true
  },
  {
    id: 'bench-press',
    name: 'Panca Piana',
    description: 'Costruisci forza nel petto. Monitoraggio del percorso del bilanciere e della simmetria.',
    difficulty: 'Intermedio',
    muscleGroups: ['Petto', 'Tricipiti', 'Spalle'],
    icon: '💪',
    path: '/exercises/bench-press',
    available: true
  },
  {
    id: 'deadlift',
    name: 'Stacco da Terra',
    description: 'Il re degli esercizi. AI tracking per proteggere la tua schiena e massimizzare la potenza.',
    difficulty: 'Avanzato',
    muscleGroups: ['Schiena', 'Glutei', 'Hamstring'],
    icon: '⚡',
    path: '/exercises/deadlift',
    available: true
  },
  {
    id: 'overhead-press',
    name: 'Military Press',
    description: 'Sviluppa spalle forti. Monitoraggio della stabilità e del percorso verticale.',
    difficulty: 'Intermedio',
    muscleGroups: ['Spalle', 'Tricipiti', 'Core'],
    icon: '🎯',
    path: '/exercises/overhead-press',
    available: false
  },
  {
    id: 'pull-up',
    name: 'Trazioni',
    description: 'Costruisci una schiena possente. Conta automatica e analisi del range di movimento.',
    difficulty: 'Avanzato',
    muscleGroups: ['Dorsali', 'Bicipiti', 'Core'],
    icon: '🔥',
    path: '/exercises/pull-up',
    available: false
  },
  {
    id: 'plank',
    name: 'Plank',
    description: 'Core di acciaio. Monitoraggio della posizione e timer automatico.',
    difficulty: 'Principiante',
    muscleGroups: ['Core', 'Spalle', 'Glutei'],
    icon: '⏱️',
    path: '/exercises/plank',
    available: false
  }
]

export default function ExercisesPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Principiante':
        return 'bg-green-100 text-green-800'
      case 'Intermedio':
        return 'bg-yellow-100 text-yellow-800'
      case 'Avanzato':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
              <Link href="/exercises" className="text-gray-900 font-medium">
                Esercizi
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
              <Link href="/dashboard?section=profile" className="text-gray-600 hover:text-gray-900 transition-colors">
                Profilo
              </Link>
            </nav>

            {/* Desktop Right Menu */}
            <div className="hidden md:flex items-center gap-2">
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
                className="block px-3 py-2 rounded-lg bg-blue-50 text-blue-600 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Esercizi
              </Link>
              <Link 
                href="/dashboard" 
                className="block px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
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

      {/* Main Content */}
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Scegli il tuo Esercizio
            </h1>
            <p className="text-lg text-gray-600">
              Seleziona un esercizio per iniziare l'allenamento con il supporto dell'AI
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ChartBarIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Esercizi Disponibili</p>
                  <p className="text-xl font-bold text-gray-900">3/6</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ClockIcon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ultimo Allenamento</p>
                  <p className="text-xl font-bold text-gray-900">Oggi</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FireIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Streak</p>
                  <p className="text-xl font-bold text-gray-900">5 giorni</p>
                </div>
              </div>
            </div>
          </div>

          {/* Exercise Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 ${
                  exercise.available 
                    ? 'hover:shadow-lg hover:scale-105 cursor-pointer' 
                    : 'opacity-60'
                }`}
              >
                {exercise.available ? (
                  <Link href={exercise.path} className="block h-full">
                    <ExerciseCard exercise={exercise} getDifficultyColor={getDifficultyColor} />
                  </Link>
                ) : (
                  <ExerciseCard exercise={exercise} getDifficultyColor={getDifficultyColor} />
                )}
              </div>
            ))}
          </div>

          {/* Coming Soon Note */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <PlayCircleIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Altri esercizi in arrivo!
              </h3>
            </div>
            <p className="text-gray-600">
              Stiamo lavorando per aggiungere Military Press, Trazioni, Plank e molti altri esercizi. 
              Ogni esercizio avrà il tracking AI completo per forma perfetta e prevenzione infortuni.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

// Componente Card Esercizio
function ExerciseCard({ 
  exercise, 
  getDifficultyColor 
}: { 
  exercise: Exercise
  getDifficultyColor: (difficulty: string) => string 
}) {
  return (
    <>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="text-4xl">{exercise.icon}</div>
          {!exercise.available && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
              Presto
            </span>
          )}
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {exercise.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4">
          {exercise.description}
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(exercise.difficulty)}`}>
              {exercise.difficulty}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {exercise.muscleGroups.map((muscle, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-lg"
              >
                {muscle}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {exercise.available && (
        <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-600">
              Inizia allenamento
            </span>
            <PlayCircleIcon className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      )}
    </>
  )
}