// app/exercises/squat/page.tsx - Pagina squat con webcam semplice

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  PlayIcon,
  StopIcon,
  CameraIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { useCamera } from '@/hooks/useCamera'

export default function SquatPage() {
  const [isTraining, setIsTraining] = useState(false)
  const { videoRef, isStreamActive, error, startCamera, stopCamera } = useCamera()

  const handleStart = async () => {
    await startCamera()
    setIsTraining(true)
  }

  const handleStop = () => {
    stopCamera()
    setIsTraining(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/exercises"
            className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Torna agli Esercizi
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Squat Training</h1>
          <p className="text-gray-600 mt-2">
            Posizionati davanti alla camera e inizia l'allenamento
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Area - Colonna principale */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Video Container */}
              <div className="relative bg-black aspect-video">
                {isStreamActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover mirror"
                    />
                    {/* Overlay con stato */}
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                        Camera Attiva
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-white">
                      <CameraIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-400">
                        {error ? error : 'Premi "Inizia" per attivare la camera'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="p-6 bg-gray-50">
                <div className="flex justify-center space-x-4">
                  {!isTraining ? (
                    <button
                      onClick={handleStart}
                      className="btn-primary btn-lg inline-flex items-center"
                      disabled={isStreamActive}
                    >
                      <PlayIcon className="w-5 h-5 mr-2" />
                      Inizia Allenamento
                    </button>
                  ) : (
                    <button
                      onClick={handleStop}
                      className="btn bg-red-600 hover:bg-red-700 text-white btn-lg inline-flex items-center"
                    >
                      <StopIcon className="w-5 h-5 mr-2" />
                      Ferma Allenamento
                    </button>
                  )}
                </div>

                {/* Status */}
                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-red-900">Errore Camera</h4>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {isStreamActive && !error && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-700">
                      ✅ Camera connessa correttamente. Posizionati per iniziare l'esercizio.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Panel - Colonna laterale */}
          <div className="lg:col-span-1 space-y-6">
            {/* Istruzioni */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <InformationCircleIcon className="w-5 h-5 mr-2 text-primary-600" />
                Come Eseguire lo Squat
              </h2>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="font-semibold text-primary-600 mr-2">1.</span>
                  <span>Posiziona i piedi alla larghezza delle spalle</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-primary-600 mr-2">2.</span>
                  <span>Mantieni il petto alto e la schiena dritta</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-primary-600 mr-2">3.</span>
                  <span>Scendi piegando le ginocchia e spingendo i fianchi indietro</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-primary-600 mr-2">4.</span>
                  <span>Scendi fino a quando le cosce sono parallele al pavimento</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-primary-600 mr-2">5.</span>
                  <span>Spingi attraverso i talloni per tornare su</span>
                </li>
              </ol>
            </div>

            {/* Errori Comuni */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                ⚠️ Errori Comuni
              </h2>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span>Ginocchia che vanno troppo in avanti</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span>Schiena che si curva in avanti</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span>Talloni che si alzano dal pavimento</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span>Non scendere abbastanza</span>
                </li>
              </ul>
            </div>

            {/* Coming Soon */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-yellow-900 mb-2">
                🚧 Funzionalità in Arrivo
              </h3>
              <ul className="space-y-1 text-xs text-yellow-800">
                <li>• Rilevamento automatico della postura</li>
                <li>• Conteggio ripetizioni</li>
                <li>• Feedback in tempo reale</li>
                <li>• Analisi della forma con AI</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}