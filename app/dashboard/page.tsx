// app/dashboard/page.tsx - Dashboard principale con tutti i componenti integrati

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  HomeIcon,
  UserCircleIcon,
  ChartBarIcon,
  CalculatorIcon,
  ShieldExclamationIcon,
  PlayCircleIcon,
  TrophyIcon,
  FireIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

// Import tutti i componenti
import UserProfileSystem from '@/components/UserProfileSystem'
import WeightPredictionSystem from '@/components/WeightPredictionSystem'
import PerformanceDashboard from '@/components/PerformanceDashboard'
import InjuryPreventionSystem from '@/components/InjuryPreventionSystem'

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState<'overview' | 'profile' | 'performance' | 'injury' | 'weight'>('overview')
  const [userStats, setUserStats] = useState({
    totalWorkouts: 0,
    weekStreak: 0,
    totalReps: 0,
    perfectReps: 0,
    avgQuality: 0,
    lastWorkout: '',
    nextGoal: ''
  })
  
  const [quickActions] = useState([
    { 
      id: 'squat', 
      label: 'Squat Training', 
      icon: '🦵', 
      color: 'blue',
      link: '/exercises/squat/pre-workout'
    },
    { 
      id: 'bench', 
      label: 'Panca Piana', 
      icon: '💪', 
      color: 'green',
      link: '/exercises/bench-press/pre-workout'
    },
    { 
      id: 'deadlift', 
      label: 'Stacco da Terra', 
      icon: '🏋️', 
      color: 'purple',
      link: '/exercises/deadlift/pre-workout'
    }
  ])
  
  // Carica statistiche
  useEffect(() => {
    const sessions = JSON.parse(localStorage.getItem('flexcoach_sessions') || '[]')
    const profile = JSON.parse(localStorage.getItem('flexcoach_profile_default') || '{}')
    
    if (sessions.length > 0) {
      const totalReps = sessions.reduce((acc: number, s: any) => acc + s.totalReps, 0)
      const perfectReps = sessions.reduce((acc: number, s: any) => acc + s.perfectReps, 0)
      const avgQuality = sessions.reduce((acc: number, s: any) => acc + s.avgQuality, 0) / sessions.length
      const lastSession = sessions[sessions.length - 1]
      
      setUserStats({
        totalWorkouts: sessions.length,
        weekStreak: calculateWeekStreak(sessions),
        totalReps,
        perfectReps,
        avgQuality,
        lastWorkout: new Date(lastSession.date).toLocaleDateString(),
        nextGoal: profile.goals?.primaryGoal || 'strength'
      })
    }
  }, [])
  
  const calculateWeekStreak = (sessions: any[]): number => {
    // Calcola settimane consecutive di allenamento
    const weeks = new Set()
    sessions.forEach((s: any) => {
      const date = new Date(s.date)
      const weekNum = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000))
      weeks.add(weekNum)
    })
    return weeks.size
  }
  
  const getCurrentTime = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buongiorno'
    if (hour < 18) return 'Buon pomeriggio'
    return 'Buonasera'
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FireIcon className="w-6 h-6 text-orange-500" />
                FlexCoach AI
              </h1>
              
              {/* Navigation */}
              <nav className="hidden md:flex gap-6">
                {[
                  { id: 'overview', label: 'Overview', icon: HomeIcon },
                  { id: 'profile', label: 'Profilo', icon: UserCircleIcon },
                  { id: 'performance', label: 'Performance', icon: ChartBarIcon },
                  { id: 'injury', label: 'Prevenzione', icon: ShieldExclamationIcon },
                  { id: 'weight', label: 'Calcolo Peso', icon: CalculatorIcon }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as any)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <Link
                href="/exercises"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <PlayCircleIcon className="w-5 h-5 inline mr-2" />
                Inizia Training
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            {/* Welcome Hero */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-2">
                {getCurrentTime()}! 👋
              </h2>
              <p className="text-blue-100 mb-6">
                Pronto per superare i tuoi limiti oggi?
              </p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <div className="text-3xl font-bold">{userStats.totalWorkouts}</div>
                  <div className="text-sm text-blue-100">Allenamenti</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <div className="text-3xl font-bold">{userStats.weekStreak}</div>
                  <div className="text-sm text-blue-100">Settimane Streak</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <div className="text-3xl font-bold">{userStats.totalReps}</div>
                  <div className="text-sm text-blue-100">Ripetizioni Totali</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <div className="text-3xl font-bold">{userStats.avgQuality.toFixed(0)}%</div>
                  <div className="text-sm text-blue-100">Qualità Media</div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BoltIcon className="w-5 h-5 text-yellow-500" />
                Avvia Allenamento Rapido
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map(action => (
                  <Link
                    key={action.id}
                    href={action.link}
                    className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all transform hover:scale-[1.02] border-l-4 border-${action.color}-500`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-4xl">{action.icon}</div>
                      <ArrowTrendingUpIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <h4 className="font-semibold text-gray-900">{action.label}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Inizia con calcolo peso AI
                    </p>
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                Attività Recente
              </h3>
              
              <div className="space-y-3">
                {userStats.lastWorkout && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <div>
                        <div className="font-medium text-gray-900">Ultimo Allenamento</div>
                        <div className="text-sm text-gray-600">{userStats.lastWorkout}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {userStats.perfectReps} reps perfette
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrophyIcon className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">Prossimo Obiettivo</div>
                      <div className="text-sm text-gray-600 capitalize">{userStats.nextGoal}</div>
                    </div>
                  </div>
                  <Link
                    href="/dashboard?section=goals"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Vedi progressi →
                  </Link>
                </div>
              </div>
            </div>
            
            {/* AI Insights */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-purple-600" />
                Insights AI Personalizzati
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm font-medium text-purple-900 mb-2">
                    💡 Suggerimento del Giorno
                  </div>
                  <p className="text-sm text-gray-700">
                    Basato sui tuoi ultimi allenamenti, oggi focus su mobilità caviglie prima dello squat.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm font-medium text-purple-900 mb-2">
                    📈 Trend Settimanale
                  </div>
                  <p className="text-sm text-gray-700">
                    La tua forma è migliorata del 12% questa settimana. Ottimo lavoro!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Profile Section */}
        {activeSection === 'profile' && (
          <UserProfileSystem 
            userId="default"
            onProfileUpdate={(profile) => console.log('Profile updated:', profile)}
            onCalibrationComplete={() => console.log('Calibration complete')}
          />
        )}
        
        {/* Performance Section */}
        {activeSection === 'performance' && (
          <PerformanceDashboard 
            exerciseType="squat"
            isLive={false}
          />
        )}
        
        {/* Injury Prevention Section */}
        {activeSection === 'injury' && (
          <InjuryPreventionSystem 
            exerciseType="squat"
            isLive={false}
            onRiskDetected={(risk) => console.log('Risk detected:', risk)}
          />
        )}
        
        {/* Weight Calculation Section */}
        {activeSection === 'weight' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Seleziona Esercizio per Calcolo Peso
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['squat', 'bench-press', 'deadlift'].map(exercise => (
                  <div key={exercise} className="border rounded-lg p-4">
                    <WeightPredictionSystem 
                      exerciseType={exercise as any}
                      onStartWorkout={(plan, weight) => {
                        console.log(`Starting ${exercise} with ${weight}kg`)
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}