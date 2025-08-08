// app/exercises/squat/page.tsx - Pagina squat con Header unificato

import Header from '@/components/Header'
import { 
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import WebcamWithPoseMobile from '@/components/WebcamWithPoseMobile'

export default function SquatPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Squat Training con AI</h1>
            <p className="text-gray-600 mt-2">
              MediaPipe rileverà automaticamente la tua postura con feedback audio
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Video Area - Colonna principale */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <WebcamWithPoseMobile />
              </div>
            </div>

            {/* Info Panel - Colonna laterale */}
            <div className="lg:col-span-1 space-y-6">
              {/* Istruzioni */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Come Funziona
                </h2>
                <ol className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="font-semibold text-blue-600 mr-2">1.</span>
                    <span>Clicca "Inizia Allenamento" per attivare</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold text-blue-600 mr-2">2.</span>
                    <span>Posizionati a 2-3 metri dalla camera</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold text-blue-600 mr-2">3.</span>
                    <span>Ascolta i feedback audio (beep e suoni)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold text-blue-600 mr-2">4.</span>
                    <span>Il contatore conta automaticamente le reps</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold text-blue-600 mr-2">5.</span>
                    <span>Cerca di raggiungere 90° al ginocchio</span>
                  </li>
                </ol>
              </div>

              {/* Guida Audio */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-purple-900 mb-4">
                  🔊 Guida Audio
                </h2>
                <div className="space-y-2 text-sm text-purple-700">
                  <div className="flex items-start">
                    <span className="mr-2">🔈</span>
                    <div>
                      <strong>Tono basso:</strong> Scendi di più
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">🎵</span>
                    <div>
                      <strong>Melodia (Do-Mi-Sol):</strong> Profondità perfetta!
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">🔔</span>
                    <div>
                      <strong>Doppio beep:</strong> Rep completata
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">🎶</span>
                    <div>
                      <strong>Melodia lunga:</strong> 5 o 10 reps!
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips Mobile */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-yellow-900 mb-2">
                  📱 Tips per Mobile
                </h3>
                <ul className="space-y-1 text-xs text-yellow-800">
                  <li>• Volume alto per sentire i beep</li>
                  <li>• Non mettere in modalità silenziosa</li>
                  <li>• Posiziona il telefono stabile</li>
                  <li>• Buona illuminazione aiuta il rilevamento</li>
                  <li>• Il bottone speaker attiva/disattiva audio</li>
                </ul>
              </div>

              {/* Target Angoli */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-green-900 mb-2">
                  📐 Target Angoli
                </h3>
                <div className="space-y-1 text-xs text-green-700">
                  <div className="flex justify-between">
                    <span>Posizione alta:</span>
                    <span className="font-mono">160°+</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parallelo (target):</span>
                    <span className="font-mono font-bold">90°</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profondo:</span>
                    <span className="font-mono">&lt;90°</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}