'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  UserCircleIcon,
  CogIcon,
  ChartBarIcon,
  FireIcon,
  TrophyIcon,
  CalendarIcon,
  BellIcon,
  GlobeAltIcon,
  CameraIcon,
  ArrowRightOnRectangleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { User, UserPreferences, ExerciseStats } from '@/types'

export default function ProfiloPage() {
  const [user, setUser] = useState<User | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences>({
    defaultExercise: 'squat',
    feedbackVoice: true,
    feedbackSensitivity: 'medium',
    units: 'metric',
    language: 'it'
  })
  const [stats, setStats] = useState<ExerciseStats[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [loading, setLoading] = useState(true)

  // Mock data - in produzione verranno da Firebase
  useEffect(() => {
    const mockUser: User = {
      id: '1',
      email: 'utente@flexcoach.it',
      displayName: 'Marco Rossi',
      photoURL: null,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date(),
      preferences
    }

    const mockStats: ExerciseStats[] = [
      {
        exerciseType: 'squat',
        totalSessions: 24,
        totalReps: 480,
        averageFormScore: 87,
        bestFormScore: 95,
        improvementTrend: 'improving',
        lastSessionDate: new Date('2024-08-04'),
        commonIssues: ['Ginocchia troppo avanti', 'Busto inclinato']
      },
      {
        exerciseType: 'bench-press',
        totalSessions: 18,
        totalReps: 324,
        averageFormScore: 82,
        bestFormScore: 91,
        improvementTrend: 'stable',
        lastSessionDate: new Date('2024-08-03'),
        commonIssues: ['Traiettoria barra irregolare']
      },
      {
        exerciseType: 'deadlift',
        totalSessions: 15,
        totalReps: 225,
        averageFormScore: 78,
        bestFormScore: 88,
        improvementTrend: 'improving',
        lastSessionDate: new Date('2024-08-02'),
        commonIssues: ['Schiena arrotondata', 'Barra lontana dal corpo']
      }
    ]

    setUser(mockUser)
    setEditName(mockUser.displayName || '')
    setStats(mockStats)
    setLoading(false)
  }, [])

  const handleSaveName = () => {
    if (user) {
      setUser({ ...user, displayName: editName })
      setIsEditing(false)
      // Qui salveresti su Firebase
    }
  }

  const handlePreferenceChange = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    // Qui salveresti le preferenze su Firebase
  }

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <div className="text-green-500">↗️</div>
      case 'stable':
        return <div className="text-yellow-500">→</div>
      case 'declining':
        return <div className="text-red-500">↘️</div>
    }
  }

  const getExerciseName = (type: string) => {
    const names = {
      'squat': 'Squat',
      'bench-press': 'Panca Piana',
      'deadlift': 'Stacco'
    }
    return names[type as keyof typeof names] || type
  }

  const totalStats = stats.reduce((acc, stat) => ({
    sessions: acc.sessions + stat.totalSessions,
    reps: acc.reps + stat.totalReps,
    avgScore: Math.round((acc.avgScore + stat.averageFormScore) / stats.length)
  }), { sessions: 0, reps: 0, avgScore: 0 })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento profilo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Il Tuo Profilo</h1>
          <p className="text-gray-600 mt-2">Gestisci il tuo account e visualizza i tuoi progressi</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonna sinistra - Profilo e Impostazioni */}
          <div className="lg:col-span-1 space-y-6">
            {/* Card Profilo */}
            <Card>
              <CardBody className="text-center">
                <div className="relative inline-block mb-4">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Foto profilo"
                      className="w-24 h-24 rounded-full mx-auto"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                      <UserCircleIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <button className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors">
                    <CameraIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Nome utente editabile */}
                <div className="mb-4">
                  {isEditing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-center text-xl font-semibold bg-transparent border-b-2 border-primary-500 focus:outline-none"
                      />
                      <button onClick={handleSaveName} className="text-green-600 hover:text-green-700">
                        <CheckIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => setIsEditing(false)} className="text-red-600 hover:text-red-700">
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <h2 className="text-xl font-semibold text-gray-900">{user?.displayName}</h2>
                      <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-gray-700">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 mb-4">{user?.email}</p>
                
                <div className="text-sm text-gray-500">
                  <p>Membro dal {user?.createdAt.toLocaleDateString('it-IT')}</p>
                </div>
              </CardBody>
            </Card>

            {/* Card Impostazioni */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <CogIcon className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold">Impostazioni</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Esercizio predefinito */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Esercizio Predefinito
                  </label>
                  <select
                    value={preferences.defaultExercise}
                    onChange={(e) => handlePreferenceChange('defaultExercise', e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="squat">Squat</option>
                    <option value="bench-press">Panca Piana</option>
                    <option value="deadlift">Stacco</option>
                  </select>
                </div>

                {/* Feedback vocale */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BellIcon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Feedback Vocale</span>
                  </div>
                  <button
                    onClick={() => handlePreferenceChange('feedbackVoice', !preferences.feedbackVoice)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.feedbackVoice ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.feedbackVoice ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Sensibilità feedback */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sensibilità Feedback
                  </label>
                  <select
                    value={preferences.feedbackSensitivity}
                    onChange={(e) => handlePreferenceChange('feedbackSensitivity', e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="low">Bassa</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>

                {/* Unità di misura */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unità di Misura
                  </label>
                  <select
                    value={preferences.units}
                    onChange={(e) => handlePreferenceChange('units', e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="metric">Metrico (kg, cm)</option>
                    <option value="imperial">Imperiale (lbs, ft)</option>
                  </select>
                </div>

                {/* Lingua */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <GlobeAltIcon className="w-4 h-4 text-gray-600" />
                    <label className="text-sm font-medium text-gray-700">Lingua</label>
                  </div>
                  <select
                    value={preferences.language}
                    onChange={(e) => handlePreferenceChange('language', e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="it">Italiano</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Colonna destra - Statistiche */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistiche generali */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <ChartBarIcon className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold">Statistiche Generali</h3>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <CalendarIcon className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{totalStats.sessions}</div>
                    <div className="text-sm text-gray-600">Sessioni Totali</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <FireIcon className="w-8 h-8 text-red-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{totalStats.reps}</div>
                    <div className="text-sm text-gray-600">Ripetizioni Totali</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrophyIcon className="w-8 h-8 text-yellow-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{totalStats.avgScore}%</div>
                    <div className="text-sm text-gray-600">Form Score Medio</div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Statistiche per esercizio */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Statistiche per Esercizio</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {stats.map((stat) => (
                    <div key={stat.exerciseType} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{getExerciseName(stat.exerciseType)}</h4>
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(stat.improvementTrend)}
                          <span className="text-sm text-gray-600">
                            {stat.improvementTrend === 'improving' ? 'Migliorando' :
                             stat.improvementTrend === 'stable' ? 'Stabile' : 'In calo'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Sessioni</div>
                          <div className="font-semibold">{stat.totalSessions}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Ripetizioni</div>
                          <div className="font-semibold">{stat.totalReps}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Form Score</div>
                          <div className="font-semibold">{stat.averageFormScore}%</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Miglior Score</div>
                          <div className="font-semibold text-green-600">{stat.bestFormScore}%</div>
                        </div>
                      </div>

                      {stat.commonIssues.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-600 mb-1">Aree di Miglioramento:</div>
                          <div className="flex flex-wrap gap-1">
                            {stat.commonIssues.map((issue, index) => (
                              <span key={index} className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                {issue}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Azioni rapide */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Azioni Rapide</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/exercises">
                    <Button className="w-full justify-center">
                      Inizia Allenamento
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="secondary" className="w-full justify-center">
                      Vai alla Dashboard
                    </Button>
                  </Link>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors">
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span>Esci dal Account</span>
                  </button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}