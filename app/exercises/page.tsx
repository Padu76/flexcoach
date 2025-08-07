// app/exercises/page.tsx - Lista degli esercizi disponibili

import Link from 'next/link'
import { 
  PlayCircleIcon,
  ClockIcon,
  FireIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import type { Exercise } from '@/types'

const exercises: Exercise[] = [
  {
    id: 'squat',
    name: 'Squat',
    description: 'Esercizio fondamentale per gambe e glutei. Migliora forza, equilibrio e mobilità.',
    difficulty: 'Intermedio',
    muscleGroups: ['Quadricipiti', 'Glutei', 'Core'],
    tips: [
      'Mantieni il petto alto',
      'Ginocchia in linea con le punte dei piedi',
      'Scendi fino a quando le cosce sono parallele al pavimento'
    ]
  },
  {
    id: 'bench-press',
    name: 'Panca Piana',
    description: 'Esercizio principale per petto, spalle e tricipiti. Costruisce forza della parte superiore.',
    difficulty: 'Intermedio',
    muscleGroups: ['Pettorali', 'Deltoidi', 'Tricipiti'],
    tips: [
      'Retrai le scapole',
      'Mantieni i piedi saldi a terra',
      'Controlla la discesa del bilanciere'
    ]
  },
  {
    id: 'deadlift',
    name: 'Stacco da Terra',
    description: 'Esercizio total body che sviluppa forza posteriore. Coinvolge quasi tutti i muscoli.',
    difficulty: 'Avanzato',
    muscleGroups: ['Dorsali', 'Glutei', 'Femorali', 'Core'],
    tips: [
      'Mantieni la schiena dritta',
      'Spingi con i talloni',
      'Tieni il bilanciere vicino al corpo'
    ]
  }
]

const difficultyColors = {
  'Principiante': 'bg-green-100 text-green-800',
  'Intermedio': 'bg-yellow-100 text-yellow-800',
  'Avanzato': 'bg-red-100 text-red-800'
}

export default function ExercisesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center"
          >
            ← Torna alla Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Esercizi Disponibili</h1>
          <p className="text-gray-600 mt-2">
            Scegli un esercizio per iniziare l'analisi della forma con AI
          </p>
        </div>

        {/* Stats Banner */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <FireIcon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm text-gray-600">Esercizi</div>
            </div>
            <div className="text-center">
              <ClockIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">10-15</div>
              <div className="text-sm text-gray-600">Min/Sessione</div>
            </div>
            <div className="text-center">
              <UserGroupIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">Tutti</div>
              <div className="text-sm text-gray-600">I Livelli</div>
            </div>
            <div className="text-center">
              <PlayCircleIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">Live</div>
              <div className="text-sm text-gray-600">Feedback</div>
            </div>
          </div>
        </div>

        {/* Exercise Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {exercises.map((exercise) => (
            <div key={exercise.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Card Header con Gradiente */}
              <div className={`h-32 bg-gradient-to-br ${
                exercise.id === 'squat' ? 'from-primary-500 to-primary-700' :
                exercise.id === 'bench-press' ? 'from-success-500 to-success-700' :
                'from-warning-500 to-warning-700'
              } flex items-center justify-center`}>
                <h2 className="text-2xl font-bold text-white">{exercise.name}</h2>
              </div>

              {/* Card Body */}
              <div className="p-6">
                {/* Difficulty Badge */}
                <div className="mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${difficultyColors[exercise.difficulty]}`}>
                    {exercise.difficulty}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-4">
                  {exercise.description}
                </p>

                {/* Muscle Groups */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Muscoli Target:</h3>
                  <div className="flex flex-wrap gap-1">
                    {exercise.muscleGroups.map((muscle) => (
                      <span key={muscle} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Consigli Rapidi:</h3>
                  <ul className="space-y-1">
                    {exercise.tips.map((tip, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start">
                        <span className="text-primary-500 mr-1">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <Link 
                  href={`/exercises/${exercise.id}`}
                  className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    exercise.id === 'squat' ? 'bg-primary-600 hover:bg-primary-700 text-white' :
                    exercise.id === 'bench-press' ? 'bg-success-600 hover:bg-success-700 text-white' :
                    'bg-warning-500 hover:bg-warning-600 text-white'
                  }`}
                >
                  <PlayCircleIcon className="w-5 h-5 mr-2" />
                  Inizia Allenamento
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            💡 Come Funziona
          </h3>
          <ol className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="font-semibold mr-2">1.</span>
              Scegli un esercizio dalla lista sopra
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">2.</span>
              Consenti l'accesso alla webcam quando richiesto
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">3.</span>
              Posizionati davanti alla camera (2-3 metri di distanza)
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">4.</span>
              Segui le istruzioni e ricevi feedback in tempo reale
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}