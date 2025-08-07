// app/exercises/deadlift/page.tsx - Pagina Stacco da Terra

import Link from 'next/link'
import { 
  ArrowLeftIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import ExerciseDetectorUniversal from '@/components/ExerciseDetectorUniversal'

export default function DeadliftPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Stacco da Terra Training con AI</h1>
          <p className="text-gray-600 mt-2">
            Analisi della forma e protezione della schiena in tempo reale
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Area - Colonna principale */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <ExerciseDetectorUniversal exerciseType="deadlift" />
            </div>
          </div>

          {/* Info Panel - Colonna laterale */}
          <div className="lg:col-span-1 space-y-6">
            {/* Istruzioni */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <InformationCircleIcon className="w-5 h-5 mr-2 text-warning-600" />
                Come Eseguire lo Stacco
              </h2>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="font-semibold text-warning-600 mr-2">1.</span>
                  <span>Piedi alla larghezza delle anche</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-warning-600 mr-2">2.</span>
                  <span>Afferra la barra con presa poco più larga dei piedi</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-warning-600 mr-2">3.</span>
                  <span>Mantieni la schiena dritta e il petto alto</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-warning-600 mr-2">4.</span>
                  <span>Spingi con i talloni per sollevare</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-warning-600 mr-2">5.</span>
                  <span>Estendi contemporaneamente anche e ginocchia</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-warning-600 mr-2">6.</span>
                  <span>Blocca in alto con spalle indietro</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-warning-600 mr-2">7.</span>
                  <span>Scendi controllando il movimento</span>
                </li>
              </ol>
            </div>

            {/* Sicurezza IMPORTANTE */}
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                SICUREZZA SCHIENA
              </h3>
              <ul className="space-y-2 text-xs text-red-800 font-medium">
                <li className="flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span>MAI curvare la schiena durante il movimento</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span>Tieni sempre il core contratto</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span>La barra deve rimanere vicina al corpo</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span>Non iperestendere alla fine del movimento</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span>Usa sempre la tecnica corretta, non il peso</span>
                </li>
              </ul>
            </div>

            {/* Angoli Target */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-yellow-900 mb-3">
                📐 Angoli Target Stacco
              </h3>
              <div className="space-y-2 text-xs text-yellow-700">
                <div className="flex justify-between">
                  <span>Angolo anca (start):</span>
                  <span className="font-mono font-bold">60-90°</span>
                </div>
                <div className="flex justify-between">
                  <span>Angolo anca (lockout):</span>
                  <span className="font-mono font-bold">170-180°</span>
                </div>
                <div className="flex justify-between">
                  <span>Angolo ginocchio (start):</span>
                  <span className="font-mono font-bold">90-120°</span>
                </div>
                <div className="flex justify-between">
                  <span>Allineamento schiena:</span>
                  <span className="font-mono font-bold">&gt;140°</span>
                </div>
              </div>
            </div>

            {/* Fasi del Movimento */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-orange-900 mb-3">
                📊 Fasi del Movimento
              </h3>
              <div className="space-y-2 text-xs text-orange-800">
                <div className="pb-2 border-b border-orange-200">
                  <div className="font-semibold">1. Setup</div>
                  <div>Posizione iniziale, tensione sulla barra</div>
                </div>
                <div className="pb-2 border-b border-orange-200">
                  <div className="font-semibold">2. Break the floor</div>
                  <div>Prima fase di trazione dal pavimento</div>
                </div>
                <div className="pb-2 border-b border-orange-200">
                  <div className="font-semibold">3. Knee pass</div>
                  <div>Barra supera le ginocchia</div>
                </div>
                <div>
                  <div className="font-semibold">4. Lockout</div>
                  <div>Estensione completa, spalle indietro</div>
                </div>
              </div>
            </div>

            {/* Tips Setup */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                💡 Setup Camera
              </h3>
              <ul className="space-y-1 text-xs text-blue-800">
                <li>• Vista laterale perfetta (90°)</li>
                <li>• Distanza 3-4 metri</li>
                <li>• Altezza a metà corpo</li>
                <li>• Inquadra dalla testa ai piedi</li>
                <li>• Spazio per il movimento completo</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}