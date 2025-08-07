// app/exercises/bench-press/page.tsx - Pagina Panca Piana

import Link from 'next/link'
import { 
  ArrowLeftIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import ExerciseDetectorUniversal from '@/components/ExerciseDetectorUniversal'

export default function BenchPressPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Panca Piana Training con AI</h1>
          <p className="text-gray-600 mt-2">
            Analisi del movimento e conteggio automatico delle ripetizioni
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Area - Colonna principale */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <ExerciseDetectorUniversal exerciseType="bench-press" />
            </div>
          </div>

          {/* Info Panel - Colonna laterale */}
          <div className="lg:col-span-1 space-y-6">
            {/* Istruzioni */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <InformationCircleIcon className="w-5 h-5 mr-2 text-success-600" />
                Come Eseguire la Panca Piana
              </h2>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="font-semibold text-success-600 mr-2">1.</span>
                  <span>Sdraiati sulla panca con gli occhi sotto la barra</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-success-600 mr-2">2.</span>
                  <span>Retrai le scapole e inarca leggermente la schiena</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-success-600 mr-2">3.</span>
                  <span>Afferra la barra con presa poco più larga delle spalle</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-success-600 mr-2">4.</span>
                  <span>Abbassa la barra al petto controllatamente</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-success-600 mr-2">5.</span>
                  <span>Spingi esplosivamente verso l'alto</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-success-600 mr-2">6.</span>
                  <span>Mantieni i piedi saldi a terra</span>
                </li>
              </ol>
            </div>

            {/* Angoli Target */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-green-900 mb-3">
                📐 Angoli Target Panca
              </h3>
              <div className="space-y-2 text-xs text-green-700">
                <div className="flex justify-between">
                  <span>Posizione alta (braccia estese):</span>
                  <span className="font-mono font-bold">160-180°</span>
                </div>
                <div className="flex justify-between">
                  <span>Posizione bassa (barra al petto):</span>
                  <span className="font-mono font-bold">70-90°</span>
                </div>
                <div className="flex justify-between">
                  <span>Angolo gomiti ottimale:</span>
                  <span className="font-mono font-bold">45-75°</span>
                </div>
                <div className="flex justify-between">
                  <span>Simmetria gomiti (differenza):</span>
                  <span className="font-mono font-bold">&lt;10°</span>
                </div>
              </div>
            </div>

            {/* Errori Comuni */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-yellow-900 mb-3">
                ⚠️ Errori Comuni
              </h3>
              <ul className="space-y-2 text-xs text-yellow-800">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Gomiti troppo aperti (>90° rispetto al busto)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Non toccare il petto con la barra</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Rimbalzare la barra sul petto</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Polsi piegati all'indietro</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Sollevare i piedi da terra</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Movimento asimmetrico</span>
                </li>
              </ul>
            </div>

            {/* Tips Mobile */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                💡 Setup Camera
              </h3>
              <ul className="space-y-1 text-xs text-blue-800">
                <li>• Posiziona la camera di lato alla panca</li>
                <li>• Distanza 2-3 metri</li>
                <li>• Altezza all'incirca del petto</li>
                <li>• Inquadra tutto il movimento</li>
                <li>• Buona illuminazione</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}