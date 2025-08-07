import Link from 'next/link'
import { 
  PlayCircleIcon, 
  ArrowLeftIcon,
  CameraIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Demo FlexCoach</h1>
              <p className="text-gray-600">Prova la nostra tecnologia AI in azione</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Demo Introduction */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CameraIcon className="w-10 h-10 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Scopri FlexCoach in Azione
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Prova gratuitamente la nostra tecnologia di rilevamento posturale AI 
            per vedere come può migliorare i tuoi allenamenti
          </p>
        </div>

        {/* Demo Options */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden hover-lift">
            <div className="h-32 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <div className="text-white text-center">
                <h3 className="text-xl font-bold">Squat Demo</h3>
                <p className="text-primary-100 text-sm">2-3 minuti</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Prova il rilevamento della forma per squat con feedback in tempo reale 
                su profondità, posizione ginocchia e allineamento schiena.
              </p>
              <Link 
                href="/exercises/squat"
                className="btn-primary w-full inline-flex items-center justify-center gap-2"
              >
                <PlayCircleIcon className="w-4 h-4" />
                Prova Squat
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden hover-lift">
            <div className="h-32 bg-gradient-to-br from-success-500 to-success-700 flex items-center justify-center">
              <div className="text-white text-center">
                <h3 className="text-xl font-bold">Panca Demo</h3>
                <p className="text-success-100 text-sm">Coming Soon</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Analisi della posizione dei gomiti, retrazione scapolare e 
                controllo del movimento nella panca piana.
              </p>
              <button 
                disabled
                className="btn bg-gray-300 text-gray-500 w-full cursor-not-allowed"
              >
                Prossimamente
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden hover-lift">
            <div className="h-32 bg-gradient-to-br from-warning-500 to-warning-700 flex items-center justify-center">
              <div className="text-white text-center">
                <h3 className="text-xl font-bold">Stacco Demo</h3>
                <p className="text-warning-100 text-sm">Coming Soon</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Controllo dell'allineamento spinale e posizione del bilanciere 
                per uno stacco da terra sicuro ed efficace.
              </p>
              <button 
                disabled
                className="btn bg-gray-300 text-gray-500 w-full cursor-not-allowed"
              >
                Prossimamente
              </button>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <InformationCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Requisiti per la Demo</h3>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>• Webcam funzionante (autorizzazione richiesta)</li>
                <li>• Spazio libero di almeno 2x2 metri</li>
                <li>• Illuminazione frontale (evitare controluce)</li>
                <li>• Browser moderno (Chrome, Firefox, Safari)</li>
                <li>• Connessione internet stabile</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Privacy e Sicurezza</h3>
              <p className="text-amber-800 text-sm">
                Tutte le analisi vengono eseguite localmente nel tuo browser. 
                I dati video non vengono mai inviati ai nostri server. 
                La tua privacy è completamente protetta durante la demo.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Come Funziona la Demo
          </h3>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 font-bold text-lg">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Autorizza Camera</h4>
              <p className="text-gray-600 text-sm">
                Concedi l'accesso alla webcam quando richiesto dal browser
              </p>
            </div>
            
            <div>
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-success-600 font-bold text-lg">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Posizionati</h4>
              <p className="text-gray-600 text-sm">
                Assicurati di essere completamente visibile nella camera
              </p>
            </div>
            
            <div>
              <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-warning-600 font-bold text-lg">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Inizia Movimento</h4>
              <p className="text-gray-600 text-sm">
                Esegui l'esercizio lentamente e con controllo
              </p>
            </div>
            
            <div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold text-lg">4</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Ricevi Feedback</h4>
              <p className="text-gray-600 text-sm">
                Vedi correzioni istantanee e suggerimenti per migliorare
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Pronto a Migliorare i Tuoi Allenamenti?
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/exercises/squat"
              className="btn-primary btn-lg inline-flex items-center gap-2"
            >
              <PlayCircleIcon className="w-5 h-5" />
              Inizia Demo Squat
            </Link>
            <Link 
              href="/exercises"
              className="btn-secondary btn-lg"
            >
              Vedi Tutti gli Esercizi
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}