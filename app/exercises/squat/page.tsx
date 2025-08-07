// app/exercises/squat/page.tsx - Pagina squat con MediaPipe base

import Link from 'next/link'
import { 
  ArrowLeftIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import WebcamWithPose from '@/components/WebcamWithPose'

export default function SquatPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Squat Training con AI</h1>
          <p className="text-gray-600 mt-2">
            MediaPipe rileverà automaticamente la tua postura e mostrerà i punti chiave del corpo
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Area - Colonna principale */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <WebcamWithPose />
            </div>
          </div>

          {/* Info Panel - Colonna laterale */}
          <div className="lg:col-span-1 space-y-6">
            {/* Istruzioni */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <InformationCircleIcon className="w-5 h-5 mr-2 text-primary-600" />
                Come Funziona
              </h2>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="font-semibold text-primary-600 mr-2">1.</span>
                  <span>Clicca "Inizia Rilevamento" per attivare la webcam</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-primary-600 mr-2">2.</span>
                  <span>Posizionati a 2-3 metri dalla camera</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-primary-600 mr-2">3.</span>
                  <span>Assicurati che tutto il corpo sia visibile</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-primary-600 mr-2">4.</span>
                  <span>MediaPipe mostrerà 33 punti sul tuo corpo</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-primary-600 mr-2">5.</span>
                  <span>I punti verdi sono ben visibili, quelli gialli meno</span>
                </li>
              </ol>
            </div>

            {/* Punti Chiave per lo Squat */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                📍 Punti Chiave Monitorati
              </h2>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">11-12</span>
                  <span>Spalle</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">23-24</span>
                  <span>Fianchi</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">25-26</span>
                  <span>Ginocchia</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">27-28</span>
                  <span>Caviglie</span>
                </li>
              </ul>
            </div>

            {/* Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                🎯 Stato Rilevamento
              </h3>
              <p className="text-xs text-blue-800">
                Questa è la versione base con solo visualizzazione dei punti.
              </p>
              <div className="mt-3 space-y-1 text-xs text-blue-700">
                <p>✅ Rilevamento punti attivo</p>
                <p>⏳ Analisi forma - prossimamente</p>
                <p>⏳ Conteggio ripetizioni - prossimamente</p>
                <p>⏳ Feedback in tempo reale - prossimamente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}