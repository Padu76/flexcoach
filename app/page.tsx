'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  PlayCircleIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  FireIcon,
  TrophyIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  UserGroupIcon,
  AcademicCapIcon,
  HeartIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
      
      // Check visibility of sections
      const sections = ['hero', 'squat', 'bench', 'deadlift', 'features', 'cta']
      const newVisibility: Record<string, boolean> = {}
      
      sections.forEach(section => {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          newVisibility[section] = rect.top < window.innerHeight * 0.75
        }
      })
      
      setIsVisible(newVisibility)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Hero Section con Parallax */}
      <section 
        id="hero"
        className="relative h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background Image con Parallax */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070')`,
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        </div>

        {/* Content */}
        <div className={`relative z-10 text-center px-4 max-w-4xl mx-auto transition-all duration-1000 ${
          isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            FlexCoach
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300">
            Il tuo AI Personal Trainer per Squat, Panca e Stacco
          </p>
          <p className="text-lg mb-12 text-gray-400 max-w-2xl mx-auto">
            Correzione della forma in tempo reale con intelligenza artificiale avanzata. 
            Migliora la tua tecnica, previeni infortuni, raggiungi i tuoi obiettivi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-2xl"
            >
              <PlayCircleIcon className="w-6 h-6 mr-2" />
              Inizia Gratis
            </Link>
            <Link 
              href="/trainer"
              className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur text-white rounded-full hover:bg-white/20 transition-all border border-white/30"
            >
              <UserGroupIcon className="w-6 h-6 mr-2" />
              Sono un Trainer
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Sezione SQUAT con Parallax */}
      <section id="squat" className="relative min-h-screen flex items-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=2069')`,
            transform: `translateY(${(scrollY - 800) * 0.3}px)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-black/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-1000 delay-200 ${
            isVisible.squat ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
          }`}>
            <div>
              <span className="inline-block px-4 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm mb-4">
                Esercizio Fondamentale
              </span>
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Squat
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-6">
                Il re degli esercizi per le gambe. FlexCoach analizza la tua postura in tempo reale 
                per garantire la profondità perfetta e proteggere le tue ginocchia.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3" />
                  <span className="text-gray-300">Rilevamento profondità automatico</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3" />
                  <span className="text-gray-300">Controllo allineamento ginocchia</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3" />
                  <span className="text-gray-300">Analisi curva lombare</span>
                </li>
              </ul>
              <Link 
                href="/exercises/squat/pre-workout"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105"
              >
                Prova Squat
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Link>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl" />
              <div className="relative bg-gradient-to-br from-blue-600/10 to-purple-600/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-3xl font-bold text-blue-400">15°</div>
                    <div className="text-sm text-gray-400">Angolo ideale</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-3xl font-bold text-green-400">98%</div>
                    <div className="text-sm text-gray-400">Precisione AI</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-3xl font-bold text-purple-400">0.1s</div>
                    <div className="text-sm text-gray-400">Tempo risposta</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-3xl font-bold text-cyan-400">17</div>
                    <div className="text-sm text-gray-400">Punti tracciati</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sezione PANCA con Parallax - IMMAGINE CORRETTA FLAT BENCH PRESS */}
      <section id="bench" className="relative min-h-screen flex items-center">
        {/* Background Image - FLAT BENCH PRESS WITH BARBELL */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070')`,
            transform: `translateY(${(scrollY - 1600) * 0.3}px)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-l from-black/90 to-black/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-1000 delay-200 ${
            isVisible.bench ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}>
            <div className="order-2 md:order-1">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 blur-3xl" />
                <div className="relative bg-gradient-to-br from-green-600/10 to-emerald-600/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-3xl font-bold text-green-400">45°</div>
                      <div className="text-sm text-gray-400">Angolo gomiti</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-3xl font-bold text-emerald-400">ROM</div>
                      <div className="text-sm text-gray-400">Range completo</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-3xl font-bold text-teal-400">Grip</div>
                      <div className="text-sm text-gray-400">Larghezza presa</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-3xl font-bold text-cyan-400">Arco</div>
                      <div className="text-sm text-gray-400">Setup schiena</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 text-right">
              <span className="inline-block px-4 py-1 bg-green-600/20 text-green-400 rounded-full text-sm mb-4">
                Upper Body Power
              </span>
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Panca Piana
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-6">
                Costruisci petto e tricipiti con la forma perfetta. L'AI monitora la traiettoria 
                del bilanciere e l'angolo dei gomiti per massimizzare i risultati.
              </p>
              <ul className="space-y-3 mb-8 text-left md:text-right">
                <li className="flex items-center md:justify-end">
                  <span className="text-gray-300 order-2 md:order-1">Traiettoria bilanciere ottimale</span>
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mx-3 order-1 md:order-2" />
                </li>
                <li className="flex items-center md:justify-end">
                  <span className="text-gray-300 order-2 md:order-1">Controllo tempo eccentrico</span>
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mx-3 order-1 md:order-2" />
                </li>
                <li className="flex items-center md:justify-end">
                  <span className="text-gray-300 order-2 md:order-1">Protezione spalle e polsi</span>
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mx-3 order-1 md:order-2" />
                </li>
              </ul>
              <Link 
                href="/exercises/bench-press/pre-workout"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all transform hover:scale-105"
              >
                Prova Panca
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sezione STACCO con Parallax */}
      <section id="deadlift" className="relative min-h-screen flex items-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1517963879433-6ad2b056d712?q=80&w=2070')`,
            transform: `translateY(${(scrollY - 2400) * 0.3}px)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-black/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-1000 delay-200 ${
            isVisible.deadlift ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
          }`}>
            <div>
              <span className="inline-block px-4 py-1 bg-orange-600/20 text-orange-400 rounded-full text-sm mb-4">
                Total Body Strength
              </span>
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  Stacco da Terra
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-6">
                L'esercizio definitivo per la forza totale. FlexCoach protegge la tua schiena 
                monitorando la posizione neutrale della colonna durante tutto il movimento.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3" />
                  <span className="text-gray-300">Protezione lombare intelligente</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3" />
                  <span className="text-gray-300">Hip hinge perfetto</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3" />
                  <span className="text-gray-300">Lockout e setup ottimali</span>
                </li>
              </ul>
              <Link 
                href="/exercises/deadlift/pre-workout"
                className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all transform hover:scale-105"
              >
                Prova Stacco
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Link>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-600/20 to-red-600/20 blur-3xl" />
              <div className="relative bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-3xl font-bold text-orange-400">Neutral</div>
                    <div className="text-sm text-gray-400">Spine position</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-3xl font-bold text-red-400">100%</div>
                    <div className="text-sm text-gray-400">Safety score</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-3xl font-bold text-yellow-400">Hip</div>
                    <div className="text-sm text-gray-400">Drive power</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-3xl font-bold text-amber-400">Lock</div>
                    <div className="text-sm text-gray-400">Full extension</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 bg-gradient-to-b from-black to-gray-950">
        <div className={`container mx-auto px-6 transition-all duration-1000 ${
          isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Perché Scegliere{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                FlexCoach
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Tecnologia all'avanguardia per il tuo allenamento perfetto
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <LightBulbIcon className="w-8 h-8" />,
                title: 'AI Avanzata',
                description: 'Rilevamento pose in tempo reale con TensorFlow.js',
                color: 'from-blue-600 to-cyan-600'
              },
              {
                icon: <ShieldCheckIcon className="w-8 h-8" />,
                title: 'Prevenzione Infortuni',
                description: 'Alert automatici per posture pericolose',
                color: 'from-green-600 to-emerald-600'
              },
              {
                icon: <ChartBarIcon className="w-8 h-8" />,
                title: 'Progress Tracking',
                description: 'Statistiche dettagliate e progressi misurabili',
                color: 'from-purple-600 to-pink-600'
              },
              {
                icon: <AcademicCapIcon className="w-8 h-8" />,
                title: 'Calibrazione Smart',
                description: 'Pesi ottimali calcolati sul tuo livello',
                color: 'from-orange-600 to-red-600'
              }
            ].map((feature, index) => (
              <div key={index} className="relative group">
                <div className={`absolute -inset-1 bg-gradient-to-r ${feature.color} rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500`} />
                <div className="relative bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${feature.color} mb-4`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Extra Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <FireIcon className="w-12 h-12 mx-auto mb-4 text-orange-400" />
              <h3 className="text-lg font-semibold mb-2">Counter Automatico</h3>
              <p className="text-gray-400">Conta le ripetizioni automaticamente</p>
            </div>
            <div className="text-center">
              <HeartIcon className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <h3 className="text-lg font-semibold mb-2">Qualità Rep</h3>
              <p className="text-gray-400">Valutazione per ogni ripetizione</p>
            </div>
            <div className="text-center">
              <TrophyIcon className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-lg font-semibold mb-2">Achievements</h3>
              <p className="text-gray-400">Sblocca obiettivi e migliora</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="relative py-20 bg-gradient-to-b from-gray-950 to-black">
        <div className={`container mx-auto px-6 text-center transition-all duration-1000 ${
          isVisible.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <SparklesIcon className="w-16 h-16 mx-auto mb-6 text-yellow-400" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Inizia il Tuo Viaggio Verso la{' '}
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Forma Perfetta
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Unisciti a migliaia di atleti che hanno migliorato la loro tecnica con FlexCoach. 
            Gratis per sempre, nessuna carta di credito richiesta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-semibold rounded-full hover:from-yellow-500 hover:to-orange-500 transition-all transform hover:scale-105 shadow-2xl"
            >
              <PlayCircleIcon className="w-6 h-6 mr-2" />
              Inizia Ora - È Gratis!
            </Link>
            <Link 
              href="/exercises"
              className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur text-white rounded-full hover:bg-white/20 transition-all border border-white/30"
            >
              Esplora Esercizi
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span>100% Gratuito</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span>No Carta di Credito</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span>Privacy Garantita</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span>Cancella Quando Vuoi</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-900 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-4">
                FlexCoach
              </h3>
              <p className="text-gray-400 text-sm">
                AI-powered fitness coaching per squat, panca e stacco. 
                Migliora la tua forma, previeni infortuni.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Esercizi</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/exercises/squat/pre-workout" className="hover:text-white">Squat</Link></li>
                <li><Link href="/exercises/bench-press/pre-workout" className="hover:text-white">Panca Piana</Link></li>
                <li><Link href="/exercises/deadlift/pre-workout" className="hover:text-white">Stacco da Terra</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Prodotto</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/trainer" className="hover:text-white">Per Trainer</Link></li>
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Supporto</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Guida</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
                <li><a href="#" className="hover:text-white">Contatti</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-900 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} FlexCoach. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}