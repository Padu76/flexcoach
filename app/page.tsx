import Link from 'next/link'
import { 
  PlayCircleIcon, 
  CameraIcon, 
  ChartBarIcon, 
  ShieldCheckIcon,
  UserGroupIcon,
  TrophyIcon,
  SparklesIcon,
  BoltIcon,
  AdjustmentsHorizontalIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Always links to home */}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                FlexCoach
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 flex items-center gap-1">
                <HomeIcon className="w-4 h-4" />
                Home
              </Link>
              <Link href="/exercises" className="text-gray-700 hover:text-blue-600">
                Esercizi
              </Link>
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
                Dashboard
              </Link>
              <Link href="/dashboard?section=profile" className="text-gray-700 hover:text-blue-600">
                Profilo
              </Link>
            </div>
            
            {/* Desktop Menu Right */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-blue-600">
                <UserCircleIcon className="w-6 h-6" />
              </button>
              <button className="p-2 text-gray-600 hover:text-blue-600">
                <Cog6ToothIcon className="w-6 h-6" />
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Accedi
              </button>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                Home
              </Link>
              <Link href="/exercises" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                Esercizi
              </Link>
              <Link href="/dashboard" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                Dashboard
              </Link>
              <Link href="/dashboard?section=profile" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                Profilo
              </Link>
              <button className="w-full text-left px-3 py-2 text-blue-600 font-medium">
                Accedi
              </button>
            </div>
          </div>
        )}
      </nav>
      
      {/* Spacing for fixed nav */}
      <div className="h-16"></div>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Perfeziona la Tua Forma con<br />
              <span className="text-blue-200">Coaching Intelligente AI</span>
            </h1>
            <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Ricevi feedback in tempo reale sulla tua tecnica di squat, panca piana e stacco da terra. 
              FlexCoach usa il rilevamento posturale avanzato per aiutarti ad allenarti in sicurezza ed efficacia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/exercises"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                <PlayCircleIcon className="w-6 h-6 mr-2" />
                Inizia l'Allenamento
              </Link>
              <Link 
                href="/exercises/squat"
                className="inline-flex items-center px-8 py-4 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-400 transition-colors shadow-lg"
              >
                <CameraIcon className="w-6 h-6 mr-2" />
                Prova Subito
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Why Choose FlexCoach Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Perché Scegliere FlexCoach?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              La tecnologia AI avanzata incontra l'expertise fitness per darti il compagno di allenamento perfetto
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <SparklesIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Personalizzata
              </h3>
              <p className="text-gray-600">
                Sistema che apprende le tue caratteristiche uniche e si adatta al tuo livello
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheckIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Prevenzione Infortuni
              </h3>
              <p className="text-gray-600">
                Monitoraggio real-time dei pattern di rischio con alert immediati
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Analytics Avanzate
              </h3>
              <p className="text-gray-600">
                Dashboard dettagliata con grafici progressi e statistiche performance
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <BoltIcon className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Feedback Istantaneo
              </h3>
              <p className="text-gray-600">
                Correzioni in tempo reale con feedback audio e visivo durante l'esercizio
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Big 3 Exercises Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Padroneggia i Big 3
            </h2>
            <p className="text-xl text-gray-600">
              Perfeziona la tua tecnica sui movimenti composti più importanti
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Squat Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-xl text-white overflow-hidden">
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2">Squat</h3>
                <p className="text-blue-100 mb-6">Base parte inferiore</p>
                <p className="text-sm mb-6 text-blue-50">
                  Perfeziona la profondità dello squat, il tracking delle ginocchia e la posizione della schiena. 
                  Ricevi avvisi per ginocchia in avanti e schiena curvata.
                </p>
                <Link 
                  href="/exercises/squat"
                  className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Pratica Squat
                  <ChevronRightIcon className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
            
            {/* Bench Press Card */}
            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl shadow-xl text-white overflow-hidden">
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2">Panca Piana</h3>
                <p className="text-green-100 mb-6">Potenza parte superiore</p>
                <p className="text-sm mb-6 text-green-50">
                  Ottimizza la tua panca piana con la posizione corretta dei gomiti, retrazione scapolare 
                  e analisi del percorso del bilanciere.
                </p>
                <Link 
                  href="/exercises/bench-press"
                  className="inline-flex items-center px-6 py-3 bg-white text-green-600 font-medium rounded-lg hover:bg-green-50 transition-colors"
                >
                  Pratica Panca
                  <ChevronRightIcon className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
            
            {/* Deadlift Card */}
            <div className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl shadow-xl text-white overflow-hidden">
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2">Stacco da Terra</h3>
                <p className="text-orange-100 mb-6">Forza total body</p>
                <p className="text-sm mb-6 text-orange-50">
                  Padroneggia la forma dello stacco con controlli allineamento spinale, 
                  tracking posizione bilanciere e analisi del movimento dell'anca.
                </p>
                <Link 
                  href="/exercises/deadlift"
                  className="inline-flex items-center px-6 py-3 bg-white text-orange-600 font-medium rounded-lg hover:bg-orange-50 transition-colors"
                >
                  Pratica Stacco
                  <ChevronRightIcon className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Advanced Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Funzionalità Avanzate
            </h2>
            <p className="text-xl text-gray-600">
              Tutto ciò che serve per ottimizzare il tuo allenamento
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AdjustmentsHorizontalIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Calibrazione Personalizzata
                </h3>
                <p className="text-gray-600">
                  Sistema di calibrazione in 5 step che adatta le soglie di sicurezza e performance alle tue caratteristiche uniche
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrophyIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Tracking Obiettivi
                </h3>
                <p className="text-gray-600">
                  Imposta e monitora i tuoi obiettivi di forza, massa o resistenza con progress tracking automatico
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <UserGroupIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Calcolo Peso Ottimale
                </h3>
                <p className="text-gray-600">
                  AI che calcola il peso perfetto basandosi su storico, obiettivi e forma attuale
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CameraIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Auto-Detect Vista
                </h3>
                <p className="text-gray-600">
                  Riconoscimento automatico se sei di fronte o di lato con analisi adattiva
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Inizia il Tuo Percorso di Miglioramento
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Unisciti a migliaia di atleti che stanno già migliorando la loro tecnica con FlexCoach
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              <ChartBarIcon className="w-6 h-6 mr-2" />
              Vai alla Dashboard
            </Link>
            <Link 
              href="/exercises"
              className="inline-flex items-center px-8 py-4 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-400 transition-colors shadow-lg"
            >
              <PlayCircleIcon className="w-6 h-6 mr-2" />
              Inizia Subito
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">FlexCoach</h3>
              <p className="text-gray-400">
                Il tuo AI personal trainer per squat, panca e stacco perfetti.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Esercizi</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/exercises/squat" className="hover:text-white">Squat</Link></li>
                <li><Link href="/exercises/bench-press" className="hover:text-white">Panca Piana</Link></li>
                <li><Link href="/exercises/deadlift" className="hover:text-white">Stacco da Terra</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/dashboard?section=profile" className="hover:text-white">Profilo</Link></li>
                <li><Link href="/dashboard?section=performance" className="hover:text-white">Performance</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Supporto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Guide</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
                <li><a href="#" className="hover:text-white">Contatti</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FlexCoach. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}