'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  InformationCircleIcon,
  PlayIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { ExerciseDetector } from '@/components/exercises/ExerciseDetector'
import type { WorkoutSession, ExerciseFeedback } from '@/types'

export default function DeadliftPage() {
  const [isTraining, setIsTraining] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)

  const handleStartTraining = () => {
    setIsTraining(true)
    setShowInstructions(false)
  }

  const handleSessionComplete = (session: WorkoutSession) => {
    console.log('Session completed:', session)
    setIsTraining(false)
    setShowInstructions(true)
  }

  const handleFeedback = (feedback: ExerciseFeedback) => {
    console.log('Feedback received:', feedback)
  }

  const instructions = [
    {
      title: 'Setup',
      points: [
        'Bilanciere sopra il mezzo del piede',
        'Piedi alla larghezza delle anche',
        'Shins a contatto con il bilanciere',
        'Presa salda con braccia dritte'
      ]
    },
    {
      title: 'Posizione',
      points: [
        'Schiena neutra, non iper-estesa',
        'Petto alto, spalle sopra il bilanciere',
        'Core attivato e stabile',
        'Peso sui talloni'
      ]
    },
    {
      title: 'Movimento',
      points: [
        'Spingi il pavimento con i piedi',
        'Estendi anche e ginocchia insieme',
        'Bilanciere a contatto con le gambe',
        'Completa con estensione delle anche'
      ]
    }
  ]

  const commonMistakes = [
    'Schiena curva durante il sollevamento',
    'Bilanciere lontano dal corpo',
    'Ginocchia che si piegano troppo presto',
    'Iper-estensione alla fine del movimento',
    'Perdita della presa neutra'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/exercises"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Stacco da Terra</h1>
              <p className="text-gray-600">Analisi forma in tempo reale</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Safety Warning */}
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">⚠️ Priorità Sicurezza</h3>
              <p className="text-amber-800 text-sm">
                Lo stacco da terra è un movimento complesso. Mantieni sempre la schiena neutra e 
                ascolta i feedback dell'AI. In caso di dolore o disagio, interrompi immediatamente.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {isTraining ? (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Allenamento Stacco</h2>
                      <p className="text-gray-600">Focus massimo sulla sicurezza della schiena</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      <span className="font-medium">Priorità Sicurezza</span>
                    </div>
                  </div>
                </div>
                <div className="aspect-video bg-gray-900 relative">
                  <ExerciseDetector 
                    exerciseType="deadlift"
                    onSessionComplete={handleSessionComplete}
                    onFeedback={handleFeedback}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-warning-500 to-warning-700 flex items-center justify-center">
                  <div className="text-center text-white">
                    <PlayIcon className="w-20 h-20 mx-auto mb-6 opacity-80" />
                    <h2 className="text-2xl font-bold mb-4">Pronto per lo Stacco?</h2>
                    <p className="text-warning-100 mb-8 max-w-md">
                      Movimento avanzato - massima attenzione alla forma
                    </p>
                    <button
                      onClick={handleStartTraining}
                      className="btn bg-white text-warning-600 hover:bg-gray-100 btn-lg inline-flex items-center gap-2"
                    >
                      <PlayIcon className="w-5 h-5" />
                      Inizia Allenamento
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Tips */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <InformationCircleIcon className="w-5 h-5 text-warning-600" />
                  Setup Cruciale
                </h3>
              </div>
              <div className="p-6">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-warning-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-warning-600 font-semibold text-xs">1</span>
                    </div>
                    <span className="text-gray-700">Camera laterale obbligatoria</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-warning-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-warning-600 font-semibold text-xs">2</span>
                    </div>
                    <span className="text-gray-700">Schiena completamente visibile</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-warning-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-warning-600 font-semibold text-xs">3</span>
                    </div>
                    <span className="text-gray-700">Movimenti lentissimi</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-warning-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-warning-600 font-semibold text-xs">4</span>
                    </div>
                    <span className="text-gray-700">Ferma se avverti dolore</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Instructions */}
            {showInstructions && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Tecnica Corretta</h3>
                </div>
                <div className="p-6 space-y-6">
                  {instructions.map((section, index) => (
                    <div key={index}>
                      <h4 className="font-semibold text-gray-900 mb-3">{section.title}</h4>
                      <ul className="space-y-2">
                        {section.points.map((point, pointIndex) => (
                          <li key={pointIndex} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-warning-600 rounded-full mt-2 flex-shrink-0"></span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Common Mistakes */}
            <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-red-200">
                <h3 className="text-lg font-semibold text-red-900 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  Errori Pericolosi
                </h3>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {commonMistakes.map((mistake, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                      {mistake}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Feedback Legend */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Legenda Feedback</h3>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-success-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Verde = Schiena sicura</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-warning-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Giallo = Correzione minore</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-danger-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">Rosso = STOP - Pericolo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}