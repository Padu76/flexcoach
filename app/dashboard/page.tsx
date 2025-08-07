'use client'

import Link from 'next/link'
import { 
  ChartBarIcon, 
  TrophyIcon, 
  CalendarIcon, 
  ClockIcon,
  PlayCircleIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  FireIcon
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  // Mock data - in futuro verrà da API/Database
  const userStats = {
    totalWorkouts: 23,
    totalMinutes: 147,
    averageScore: 87,
    streak: 5,
    weeklyGoal: 4,
    completedThisWeek: 3
  }

  const recentWorkouts = [
    {
      id: 1,
      exercise: 'Squat',
      date: '2025-08-05',
      duration: 12,
      reps: 15,
      avgScore: 92,
      improvements: ['Profondità migliorata', 'Ginocchia più stabili']
    },
    {
      id: 2,
      exercise: 'Panca Piana',
      date: '2025-08-03',
      duration: 18,
      reps: 12,
      avgScore: 85,
      improvements: ['Gomiti più centrati', 'Controllo discesa']
    },
    {
      id: 3,
      exercise: 'Stacco da Terra',
      date: '2025-08-01',
      duration: 15,
      reps: 10,
      avgScore: 78,
      improvements: ['Schiena più dritta']
    }
  ]

  const weeklyProgress = [
    { day: 'Lun', completed: true, score: 88 },
    { day: 'Mar', completed: false, score: 0 },
    { day: 'Mer', completed: true, score: 92 },
    { day: 'Gio', completed: false, score: 0 },
    { day: 'Ven', completed: true, score: 85 },
    { day: 'Sab', completed: false, score: 0 },
    { day: 'Dom', completed: false, score: 0 }
  ]

  const achievements = [
    { name: 'Prima Sessione', icon: StarIcon, unlocked: true, color: 'text-yellow-500' },
    { name: 'Streak 5 Giorni', icon: FireIcon, unlocked: true, color: 'text-orange-500' },
    { name: 'Forma Perfetta', icon: TrophyIcon, unlocked: false, color: 'text-gray-400' },
    { name: 'Consistency Master', icon: CalendarIcon, unlocked: false, color: 'text-gray-400' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Benvenuto nel tuo centro di controllo fitness</p>
            </div>
            <Link 
              href="/exercises"
              className="btn-primary inline-flex items-center gap-2"
            >
              <PlayCircleIcon className="w-5 h-5" />
              Nuovo Allenamento
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Allenamenti</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.totalWorkouts}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Minuti Totali</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.totalMinutes}</p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Punteggio Medio</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.averageScore}%</p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center">
                <StarIcon className="w-6 h-6 text-warning-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Streak Attuale</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.streak} giorni</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <FireIcon className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Weekly Progress */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Progresso Settimanale</h2>
                  <span className="text-sm text-gray-600">
                    {userStats.completedThisWeek}/{userStats.weeklyGoal} obiettivo
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-7 gap-4">
                  {weeklyProgress.map((day, index) => (
                    <div key={index} className="text-center">
                      <p className="text-xs text-gray-600 mb-2">{day.day}</p>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                        day.completed 
                          ? 'bg-success-500 text-white' 
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        {day.completed ? (
                          <span className="text-xs font-bold">{day.score}</span>
                        ) : (
                          <span className="text-xs">-</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Progresso obiettivo settimanale</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round((userStats.completedThisWeek / userStats.weeklyGoal) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-success-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(userStats.completedThisWeek / userStats.weeklyGoal) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Workouts */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Allenamenti Recenti</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {recentWorkouts.map((workout) => (
                  <div key={workout.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                          <PlayCircleIcon className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{workout.exercise}</h3>
                          <p className="text-sm text-gray-600">{workout.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{workout.duration} min</span>
                          <span>{workout.reps} reps</span>
                          <span className="font-semibold text-success-600">{workout.avgScore}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {workout.improvements.length > 0 && (
                      <div className="bg-success-50 rounded-lg p-3">
                        <p className="text-sm text-success-800 font-medium mb-1">Miglioramenti:</p>
                        <ul className="text-sm text-success-700">
                          {workout.improvements.map((improvement, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <ArrowTrendingUpIcon className="w-4 h-4 flex-shrink-0" />
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Azioni Rapide</h3>
              </div>
              <div className="p-6 space-y-3">
                <Link 
                  href="/exercises/squat"
                  className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-200 hover:bg-primary-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Continua Squat</div>
                  <div className="text-sm text-gray-600">Ultima sessione: 92%</div>
                </Link>
                
                <Link 
                  href="/exercises/bench-press"
                  className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:border-success-200 hover:bg-success-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Pratica Panca</div>
                  <div className="text-sm text-gray-600">Migliora gomiti</div>
                </Link>
                
                <Link 
                  href="/exercises/deadlift"
                  className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:border-warning-200 hover:bg-warning-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Stacco da Terra</div>
                  <div className="text-sm text-gray-600">Focus schiena</div>
                </Link>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
              </div>
              <div className="p-6 space-y-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className={`flex items-center gap-3 ${
                    achievement.unlocked ? 'opacity-100' : 'opacity-50'
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      achievement.unlocked ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}>
                      <achievement.icon className={`w-5 h-5 ${achievement.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{achievement.name}</p>
                      <p className="text-sm text-gray-600">
                        {achievement.unlocked ? 'Sbloccato!' : 'Da sbloccare'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}