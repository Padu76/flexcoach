import Link from 'next/link'
import { 
  PlayCircleIcon, 
  CameraIcon, 
  ChartBarIcon, 
  ShieldCheckIcon,
  UserGroupIcon,
  TrophyIcon 
} from '@heroicons/react/24/outline'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Perfeziona la Tua Forma con
              <span className="block text-gradient bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Coaching Intelligente AI
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Ricevi feedback in tempo reale sulla tua tecnica di squat, panca piana e stacco da terra. 
              FlexCoach usa il rilevamento posturale avanzato per aiutarti ad allenarti in sicurezza ed efficacia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/exercises"
                className="btn-primary btn-lg hover-lift inline-flex items-center gap-2"
              >
                <PlayCircleIcon className="w-5 h-5" />
                Inizia l'Allenamento
              </Link>
              <Link 
                href="/exercises/squat"
                className="btn bg-white/10 text-white border border-white/20 hover:bg-white/20 btn-lg inline-flex items-center gap-2"
              >
                <CameraIcon className="w-5 h-5" />
                Prova Subito
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Perché Scegliere FlexCoach?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              La tecnologia AI avanzata incontra l'expertise fitness per darti il compagno di allenamento perfetto
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card hover-lift">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CameraIcon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Analisi in Tempo Reale
                </h3>
                <p className="text-gray-600">
                  Ricevi feedback istantaneo sulla tua forma usando il rilevamento posturale MediaPipe avanzato. 
                  Vedi le correzioni in tempo reale con il nostro sistema a colori.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card hover-lift">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ChartBarIcon className="w-8 h-8 text-success-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Monitoraggio Progressi
                </h3>
                <p className="text-gray-600">
                  Monitora i tuoi miglioramenti nel tempo con analisi dettagliate. 
                  Traccia qualità della forma, conteggio ripetizioni e costanza tra le sessioni.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card hover-lift">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheckIcon className="w-8 h-8 text-warning-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Prevenzione Infortuni
                </h3>
                <p className="text-gray-600">
                  Allenati in sicurezza con avvisi immediati per errori di forma pericolosi. 
                  La nostra AI aiuta a prevenire gli infortuni prima che accadano.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exercises Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Padroneggia i Big 3
            </h2>
            <p className="text-xl text-gray-600">
              Perfeziona la tua tecnica sui movimenti composti più importanti
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Squat */}
            <div className="card hover-lift group">
              <div className="relative h-48 bg-gradient-to-br from-primary-500 to-primary-700 overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <h3 className="text-2xl font-bold mb-2">Squat</h3>
                    <p className="text-primary-100">Base parte inferiore</p>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <p className="text-gray-600 mb-6">
                  Perfeziona la profondità dello squat, il tracking delle ginocchia e la posizione della schiena. 
                  Ricevi avvisi per ginocchia in avanti e schiena curvata.
                </p>
                <Link 
                  href="/exercises/squat"
                  className="btn-primary w-full group-hover:shadow-lg transition-shadow text-center"
                >
                  Pratica Squat
                </Link>
              </div>
            </div>

            {/* Bench Press */}
            <div className="card hover-lift group">
              <div className="relative h-48 bg-gradient-to-br from-success-500 to-success-700 overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <h3 className="text-2xl font-bold mb-2">Panca Piana</h3>
                    <p className="text-success-100">Potenza parte superiore</p>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <p className="text-gray-600 mb-6">
                  Ottimizza la tua panca piana con la posizione corretta dei gomiti, 
                  retrazione scapolare e analisi del percorso del bilanciere.
                </p>
                <button 
                  className="btn-success w-full group-hover:shadow-lg transition-shadow cursor-not-allowed opacity-75"
                  disabled
                >
                  Presto Disponibile
                </button>
              </div>
            </div>

            {/* Deadlift */}
            <div className="card hover-lift group">
              <div className="relative h-48 bg-gradient-to-br from-warning-500 to-warning-700 overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <h3 className="text-2xl font-bold mb-2">Stacco da Terra</h3>
                    <p className="text-warning-100">Forza total body</p>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <p className="text-gray-600 mb-6">
                  Padroneggia la forma dello stacco con controlli allineamento spinale, 
                  tracking posizione bilanciere e analisi del movimento dell'anca.
                </p>
                <button 
                  className="btn-warning w-full group-hover:shadow-lg transition-shadow cursor-not-allowed opacity-75"
                  disabled
                >
                  Presto Disponibile
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center mb-4">
                <UserGroupIcon className="w-12 h-12 text-primary-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">1000+</div>
              <div className="text-gray-600">Utenti Attivi</div>
            </div>
            <div>
              <div className="flex items-center justify-center mb-4">
                <TrophyIcon className="w-12 h-12 text-success-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">95%</div>
              <div className="text-gray-600">Miglioramento Forma</div>
            </div>
            <div>
              <div className="flex items-center justify-center mb-4">
                <ChartBarIcon className="w-12 h-12 text-warning-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">50k+</div>
              <div className="text-gray-600">Allenamenti Analizzati</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Pronto a Perfezionare la Tua Forma?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Unisciti a migliaia di atleti che si allenano in modo più intelligente e sicuro con FlexCoach
          </p>
          <Link 
            href="/exercises"
            className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg hover-lift inline-flex items-center gap-2"
          >
            <PlayCircleIcon className="w-5 h-5" />
            Inizia il Tuo Primo Allenamento
          </Link>
        </div>
      </section>
    </div>
  )
}