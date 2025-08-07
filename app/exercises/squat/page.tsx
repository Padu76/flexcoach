'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  InformationCircleIcon,
  PlayIcon
} from '@heroicons/react/24/outline'
import { ExerciseDetector } from '@/components/exercises/ExerciseDetector'
import type { WorkoutSession, ExerciseFeedback } from '@/types'

export default function SquatPage() {
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
    // Qui in futuro salveremo nel database
  }

  const handleFeedback = (feedback: ExerciseFeedback) => {
    console.log('Feedback received:', feedback)
    // Qui gestiamo il feedback in tempo reale
  }

  const instructions = [
    {
      title: 'Posizionamento',
      points: [
        'Piedi alla larghezza delle spalle',
        'Punte leggermente verso l\'esterno',
        'Peso distribuito uniformemente',
        'Schiena dritta e core attivo'
      ]
    },
    {
      title: 'Movimento',
      points: [
        'Inizia spingendo i fianchi indietro',
        'Scendi come se ti stessi sedendo',
        'Ginocchia in linea con le punte dei piedi',
        'Scendi fino a cosce parallele al suolo'
      ]
    },
    {
      title: 'Risalita',
      points: [
        'Spingi attraverso i talloni',
        'Estendi anche e ginocchia insieme',
        'Mantieni il petto alto',
        'Torna alla posizione di partenza'
      ]
    }
  ]

  const commonMistakes = [
    'Ginocchia che vanno avanti oltre le punte',
    'Schiena che si incurva (cifosi)',
    'Peso sui talloni o sulle punte',
    'Profondità insufficiente',
    'Perdita di equilibrio laterale'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/exercises"
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Squat</h1>
                <p className="text-gray-600">Analisi forma in tempo reale</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Camera/Exercise Detector */}
          <div className="lg:col-span-2">
            {isTraining ? (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Allenamento Squat</h2>
                  <p className="text-gray-600">Posizionati davanti alla camera e inizia</p>
                </div>
                <div className="aspect-video bg-gray-900 relative">
                  <ExerciseDetector 
                    exerciseType="squat"
                    onSessionComplete={handleSessionComplete}
                    onFeedback={handleFeedback}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <div className="text-center text-white">
                    <PlayIcon className="w-20 h-20 mx-auto mb-6 opacity-80" />
                    <h2 className="text-2xl font-bold mb-4">Pronto per l'Allenamento Squat?</h2>
                    <p className="text-primary-100 mb-8 max-w-md">
                      Assicurati di avere spazio sufficiente e una buona illuminazione
                    </p>
                    <button
                      onClick={handleStartTraining}
                      className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg inline-flex items-center gap-2"
                    >
                      <PlayIcon className="w-5 h-5" />
                      Inizia Allenamento
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Instructions */}
          <div className="space-y-6">
            {/* Quick Tips */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <InformationCircleIcon className="w-5 h-5 text-primary-600" />
                  Setup Veloce
                </h3>
              </div>
              <div className="p-6">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary-600 font-semibold text-xs">1</span>
                    </div>
                    <span className="text-gray-700">Camera a 2-3 metri di distanza</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary-600 font-semibold text-xs">2</span>
                    </div>
                    <span className="text-gray-700">Corpo completamente visibile</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary-600 font-semibold text-xs">3</span>
                    </div>
                    <span className="text-gray-700">Abbigliamento aderente</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary-600 font-semibold text-xs">4</span>
                    </div>
                    <span className="text-gray-700">Illuminazione frontale</span>
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
                            <span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span>
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
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Errori Comuni</h3>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {commonMistakes.map((mistake, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-danger-600 rounded-full mt-2 flex-shrink-0"></span>
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
                  <span className="text-sm text-gray-700">Verde = Forma perfetta</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-warning-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Giallo = Attenzione</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-danger-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">Rosso = Correggi subito</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}