import Link from 'next/link'
import { 
  PlayCircleIcon, 
  AcademicCapIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline'

export default function ExercisesPage() {
  const exercises = [
    {
      id: 'squat',
      name: 'Squat',
      description: 'Perfeziona la profondità, il tracking delle ginocchia e la posizione della schiena',
      difficulty: 'Principiante',
      duration: '5-15 min',
      focusAreas: ['Quadricipiti', 'Glutei', 'Core'],
      benefits: [
        'Migliora la mobilità delle anche',
        'Rinforza la parte inferiore del corpo',
        'Previene il dolore alle ginocchia'
      ],
      color: 'primary',
      bgGradient: 'from-primary-500 to-primary-700',
      available: true
    },
    {
      id: 'bench-press',
      name: 'Panca Piana',
      description: 'Ottimizza la posizione dei gomiti, retrazione scapolare e percorso del bilanciere',
      difficulty: 'Intermedio',
      duration: '8-20 min',
      focusAreas: ['Pettorali', 'Spalle', 'Tricipiti'],
      benefits: [
        'Sviluppa forza del pettorale',
        'Migliora la stabilità delle spalle',
        'Perfeziona la tecnica di panca'
      ],
      color: 'success',
      bgGradient: 'from-success-500 to-success-700',
      available: true
    },
    {
      id: 'deadlift',
      name: 'Stacco da Terra',
      description: 'Padroneggia l\'allineamento spinale, posizione bilanciere e movimento dell\'anca',
      difficulty: 'Avanzato',
      duration: '10-25 min',
      focusAreas: ['Schiena', 'Glutei', 'Catena posteriore'],
      benefits: [
        'Rinforza tutta la catena posteriore',
        'Migliora la postura',
        'Previene il mal di schiena'
      ],
      color: 'warning',
      bgGradient: 'from-warning-500 to-warning-700',
      available: true
    }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Principiante': return 'text-green-600 bg-green-100'
      case 'Intermedio': return 'text-yellow-600 bg-yellow-100'
      case 'Avanzato': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Esercizi Disponibili
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Seleziona un esercizio per iniziare l'allenamento con feedback AI in tempo reale
            </p>
          </div>
        </div>
      </section>

      {/* Exercises Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {exercises.map((exercise) => (
              <div key={exercise.id} className="card hover-lift group">
                {/* Exercise Header */}
                <div className={`relative h-48 bg-gradient-to-br ${exercise.bgGradient} overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-center">
                      <h3 className="text-3xl font-bold mb-2">{exercise.name}</h3>
                      <div className="flex items-center justify-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>{exercise.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <UserIcon className="w-4 h-4" />
                          <span>{exercise.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Difficulty Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                      {exercise.difficulty}
                    </span>
                  </div>
                </div>

                {/* Exercise Content */}
                <div className="card-body">
                  <p className="text-gray-600 mb-6">
                    {exercise.description}
                  </p>

                  {/* Focus Areas */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <AcademicCapIcon className="w-4 h-4" />
                      Aree Focus
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {exercise.focusAreas.map((area) => (
                        <span 
                          key={area}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="mb-8">
                    <h4 className="font-semibold text-gray-900 mb-3">Benefici:</h4>
                    <ul className="space-y-2">
                      {exercise.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  {exercise.available ? (
                    <Link 
                      href={`/exercises/${exercise.id}`}
                      className={`btn-${exercise.color} w-full group-hover:shadow-lg transition-all duration-200 inline-flex items-center justify-center gap-2`}
                    >
                      <PlayCircleIcon className="w-5 h-5" />
                      Inizia {exercise.name}
                    </Link>
                  ) : (
                    <button 
                      disabled
                      className="btn bg-gray-300 text-gray-500 w-full cursor-not-allowed"
                    >
                      Prossimamente
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Come Funziona FlexCoach
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 font-bold text-lg">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Posiziona la Camera</h3>
              <p className="text-gray-600 text-sm">
                Metti il dispositivo a 2-3 metri di distanza, inquadratura completa
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-success-600 font-bold text-lg">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Inizia l'Esercizio</h3>
              <p className="text-gray-600 text-sm">
                La nostra AI analizza la tua forma in tempo reale
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-warning-600 font-bold text-lg">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Ricevi Feedback</h3>
              <p className="text-gray-600 text-sm">
                Correzioni istantanee con sistema a colori e suggerimenti
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}