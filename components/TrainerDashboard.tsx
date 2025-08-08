// components/TrainerDashboard.tsx - Dashboard completo per Personal Trainer

'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  UsersIcon,
  CalendarDaysIcon,
  VideoCameraIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  FireIcon,
  TrophyIcon,
  AcademicCapIcon,
  StarIcon,
  PencilSquareIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentArrowDownIcon,
  PaperAirplaneIcon,
  MicrophoneIcon,
  CameraIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

// Types
interface Client {
  id: string
  name: string
  email: string
  avatar?: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'athlete'
  joinDate: string
  lastWorkout?: string
  totalWorkouts: number
  currentProgram?: string
  goals: string[]
  injuries?: string[]
  notes?: string
  subscription: 'active' | 'paused' | 'expired'
  stats: {
    weeklyWorkouts: number
    monthlyProgress: number
    formScore: number
    consistency: number
  }
}

interface WorkoutProgram {
  id: string
  name: string
  description: string
  duration: number // weeks
  frequency: number // per week
  type: 'strength' | 'hypertrophy' | 'endurance' | 'mixed'
  exercises: WorkoutExercise[]
  createdAt: string
  assignedTo: string[] // client IDs
}

interface WorkoutExercise {
  id: string
  name: string
  sets: number
  reps: string // "8-12" or "12,10,8"
  rest: number // seconds
  weight?: string // "70% 1RM" or "bodyweight"
  notes?: string
  videoUrl?: string
}

interface VideoReview {
  id: string
  clientId: string
  clientName: string
  exerciseName: string
  videoUrl: string
  uploadDate: string
  status: 'pending' | 'reviewed' | 'in-progress'
  duration: number // seconds
  annotations: VideoAnnotation[]
  overallRating?: number
  feedback?: string
}

interface VideoAnnotation {
  timestamp: number // seconds
  type: 'form' | 'depth' | 'tempo' | 'posture' | 'general'
  severity: 'good' | 'warning' | 'error'
  message: string
  drawing?: string // base64 canvas drawing
}

interface Message {
  id: string
  clientId: string
  clientName: string
  content: string
  timestamp: string
  read: boolean
  type: 'text' | 'workout-complete' | 'injury-alert' | 'question'
}

type DashboardView = 'clients' | 'programs' | 'reviews' | 'analytics' | 'messages'

export default function TrainerDashboard() {
  // Stati principali
  const [currentView, setCurrentView] = useState<DashboardView>('clients')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewProgramModal, setShowNewProgramModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoReview | null>(null)
  
  // Dati mock - in produzione verrebbero da API/database
  const [clients, setClients] = useState<Client[]>([
    {
      id: '1',
      name: 'Marco Rossi',
      email: 'marco.rossi@email.com',
      level: 'intermediate',
      joinDate: '2024-01-15',
      lastWorkout: '2024-11-28',
      totalWorkouts: 45,
      currentProgram: 'Ipertrofia Upper/Lower',
      goals: ['Aumentare massa muscolare', 'Migliorare squat'],
      subscription: 'active',
      stats: {
        weeklyWorkouts: 4,
        monthlyProgress: 12,
        formScore: 85,
        consistency: 92
      }
    },
    {
      id: '2',
      name: 'Laura Bianchi',
      email: 'laura.b@email.com',
      level: 'beginner',
      joinDate: '2024-09-20',
      lastWorkout: '2024-11-27',
      totalWorkouts: 12,
      currentProgram: 'Full Body Principiante',
      goals: ['Perdere peso', 'Tonificare'],
      injuries: ['Dolore ginocchio destro'],
      subscription: 'active',
      stats: {
        weeklyWorkouts: 3,
        monthlyProgress: 8,
        formScore: 72,
        consistency: 85
      }
    },
    {
      id: '3',
      name: 'Giuseppe Verdi',
      email: 'g.verdi@email.com',
      level: 'advanced',
      joinDate: '2023-06-10',
      lastWorkout: '2024-11-26',
      totalWorkouts: 156,
      currentProgram: 'Powerlifting Avanzato',
      goals: ['Gara powerlifting', '200kg squat'],
      subscription: 'active',
      stats: {
        weeklyWorkouts: 5,
        monthlyProgress: 5,
        formScore: 94,
        consistency: 98
      }
    }
  ])
  
  const [programs, setPrograms] = useState<WorkoutProgram[]>([
    {
      id: '1',
      name: 'Ipertrofia Upper/Lower',
      description: 'Programma 4 giorni per aumento massa muscolare',
      duration: 8,
      frequency: 4,
      type: 'hypertrophy',
      exercises: [
        {
          id: '1',
          name: 'Squat',
          sets: 4,
          reps: '8-12',
          rest: 120,
          weight: '75% 1RM'
        },
        {
          id: '2',
          name: 'Panca Piana',
          sets: 4,
          reps: '8-12',
          rest: 90,
          weight: '70% 1RM'
        }
      ],
      createdAt: '2024-10-01',
      assignedTo: ['1']
    }
  ])
  
  const [videoReviews, setVideoReviews] = useState<VideoReview[]>([
    {
      id: '1',
      clientId: '1',
      clientName: 'Marco Rossi',
      exerciseName: 'Squat',
      videoUrl: '/videos/squat-marco.mp4',
      uploadDate: '2024-11-28',
      status: 'pending',
      duration: 45,
      annotations: []
    },
    {
      id: '2',
      clientId: '2',
      clientName: 'Laura Bianchi',
      exerciseName: 'Deadlift',
      videoUrl: '/videos/deadlift-laura.mp4',
      uploadDate: '2024-11-27',
      status: 'reviewed',
      duration: 38,
      annotations: [
        {
          timestamp: 5,
          type: 'posture',
          severity: 'warning',
          message: 'Schiena leggermente curva nella fase iniziale'
        },
        {
          timestamp: 12,
          type: 'form',
          severity: 'good',
          message: 'Ottima attivazione dei glutei!'
        }
      ],
      overallRating: 7,
      feedback: 'Buona esecuzione generale, ma attenzione alla posizione della schiena nella fase iniziale del movimento.'
    }
  ])
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      clientId: '1',
      clientName: 'Marco Rossi',
      content: 'Ho completato il workout di oggi! 💪',
      timestamp: '2024-11-28T18:30:00',
      read: false,
      type: 'workout-complete'
    },
    {
      id: '2',
      clientId: '2',
      clientName: 'Laura Bianchi',
      content: 'Sento un po\' di dolore al ginocchio durante lo squat',
      timestamp: '2024-11-28T16:45:00',
      read: false,
      type: 'injury-alert'
    }
  ])
  
  // Filtri e ricerca
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const pendingReviews = videoReviews.filter(v => v.status === 'pending').length
  const unreadMessages = messages.filter(m => !m.read).length
  
  // Client Detail Modal
  const ClientDetailModal = ({ client }: { client: Client }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {client.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{client.name}</h2>
                <p className="text-gray-600">{client.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    client.level === 'beginner' ? 'bg-green-100 text-green-700' :
                    client.level === 'intermediate' ? 'bg-blue-100 text-blue-700' :
                    client.level === 'advanced' ? 'bg-purple-100 text-purple-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {client.level === 'beginner' ? '🌱 Principiante' :
                     client.level === 'intermediate' ? '💪 Intermedio' :
                     client.level === 'advanced' ? '🔥 Avanzato' :
                     '🏆 Atleta'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    client.subscription === 'active' ? 'bg-green-100 text-green-700' :
                    client.subscription === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {client.subscription === 'active' ? '✓ Attivo' :
                     client.subscription === 'paused' ? '⏸ In pausa' :
                     '✗ Scaduto'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedClient(null)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{client.totalWorkouts}</div>
              <div className="text-sm text-gray-600">Allenamenti Totali</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{client.stats.consistency}%</div>
              <div className="text-sm text-gray-600">Costanza</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{client.stats.formScore}%</div>
              <div className="text-sm text-gray-600">Qualità Forma</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">+{client.stats.monthlyProgress}%</div>
              <div className="text-sm text-gray-600">Progresso Mensile</div>
            </div>
          </div>
          
          {/* Info Sections */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Obiettivi</h3>
              <ul className="space-y-1">
                {client.goals.map((goal, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Programma Attuale</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium">{client.currentProgram || 'Nessun programma assegnato'}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Ultimo allenamento: {client.lastWorkout ? new Date(client.lastWorkout).toLocaleDateString('it-IT') : 'Mai'}
                </p>
              </div>
            </div>
            
            {client.injuries && client.injuries.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-red-600">⚠️ Infortuni/Limitazioni</h3>
                <ul className="space-y-1">
                  {client.injuries.map((injury, idx) => (
                    <li key={idx} className="text-sm text-red-600">
                      • {injury}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold mb-2">Note Trainer</h3>
              <textarea
                className="w-full p-2 border rounded-lg text-sm"
                rows={3}
                placeholder="Aggiungi note personali..."
                defaultValue={client.notes}
              />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              📋 Assegna Programma
            </button>
            <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              💬 Invia Messaggio
            </button>
            <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              📊 Visualizza Report
            </button>
            <button className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
              📹 Review Video
            </button>
          </div>
        </div>
      </div>
    </div>
  )
  
  // Video Review Component
  const VideoReviewInterface = ({ review }: { review: VideoReview }) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [rating, setRating] = useState(review.overallRating || 0)
    const [feedback, setFeedback] = useState(review.feedback || '')
    const [annotations, setAnnotations] = useState<VideoAnnotation[]>(review.annotations || [])
    const [isRecording, setIsRecording] = useState(false)
    
    const addAnnotation = () => {
      const newAnnotation: VideoAnnotation = {
        timestamp: currentTime,
        type: 'form',
        severity: 'warning',
        message: 'Nuova annotazione'
      }
      setAnnotations([...annotations, newAnnotation])
    }
    
    const saveReview = () => {
      // Salva review nel database
      console.log('Saving review:', { rating, feedback, annotations })
      setSelectedVideo(null)
    }
    
    return (
      <div className="fixed inset-0 bg-black/90 flex z-50">
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">{review.clientName} - {review.exerciseName}</h2>
              <p className="text-sm text-gray-400">Caricato il {new Date(review.uploadDate).toLocaleDateString('it-IT')}</p>
            </div>
            <button
              onClick={() => setSelectedVideo(null)}
              className="p-2 hover:bg-gray-800 rounded"
            >
              ✕
            </button>
          </div>
          
          {/* Video Area */}
          <div className="flex-1 flex">
            {/* Video Player */}
            <div className="flex-1 bg-black flex items-center justify-center relative">
              <video
                src={review.videoUrl}
                className="max-w-full max-h-full"
                controls
              />
              
              {/* Timeline Annotations */}
              <div className="absolute bottom-20 left-0 right-0 h-8 bg-black/50 px-4">
                <div className="relative h-full">
                  {annotations.map((ann, idx) => (
                    <div
                      key={idx}
                      className={`absolute top-1 w-2 h-6 rounded-full cursor-pointer ${
                        ann.severity === 'good' ? 'bg-green-500' :
                        ann.severity === 'warning' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ left: `${(ann.timestamp / review.duration) * 100}%` }}
                      title={ann.message}
                    />
                  ))}
                </div>
              </div>
              
              {/* Controls */}
              <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                </button>
                <button
                  onClick={addAnnotation}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  + Annotazione
                </button>
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`px-4 py-2 rounded ${
                    isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-600'
                  } text-white hover:opacity-90`}
                >
                  <MicrophoneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="w-96 bg-white p-6 overflow-auto">
              <h3 className="text-lg font-bold mb-4">Review & Feedback</h3>
              
              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Valutazione Forma</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                    <button
                      key={i}
                      onClick={() => setRating(i)}
                      className={`w-8 h-8 rounded ${
                        i <= rating ? 'bg-yellow-400' : 'bg-gray-200'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Annotations List */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Annotazioni ({annotations.length})</h4>
                <div className="space-y-2 max-h-60 overflow-auto">
                  {annotations.map((ann, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded border-l-4 ${
                        ann.severity === 'good' ? 'border-green-500 bg-green-50' :
                        ann.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                        'border-red-500 bg-red-50'
                      }`}
                    >
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{ann.timestamp}s</span>
                        <span className="capitalize">{ann.type}</span>
                      </div>
                      <p className="text-sm">{ann.message}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Feedback */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Feedback Generale</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  rows={6}
                  placeholder="Scrivi il tuo feedback..."
                />
              </div>
              
              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={saveReview}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Salva Review
                </button>
                <button
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Navigation
  const navigationItems = [
    { id: 'clients', label: 'Clienti', icon: UsersIcon, badge: clients.length },
    { id: 'programs', label: 'Programmi', icon: DocumentTextIcon, badge: programs.length },
    { id: 'reviews', label: 'Video Review', icon: VideoCameraIcon, badge: pendingReviews },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'messages', label: 'Messaggi', icon: ChatBubbleLeftRightIcon, badge: unreadMessages }
  ]
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">
                🏋️‍♂️ FlexCoach Trainer Hub
              </h1>
              <span className="text-sm text-gray-500">
                Dashboard Trainer Professionale
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <BellIcon className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadMessages}
                  </span>
                )}
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                TR
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {navigationItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as DashboardView)}
                className={`flex items-center gap-2 px-1 py-4 border-b-2 transition-colors ${
                  currentView === item.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-xs rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Clients View */}
        {currentView === 'clients' && (
          <div>
            {/* Search and Actions */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cerca clienti..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <PlusCircleIcon className="w-5 h-5" />
                Aggiungi Cliente
              </button>
            </div>
            
            {/* Clients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map(client => (
                <div
                  key={client.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedClient(client)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="font-semibold">{client.name}</h3>
                          <p className="text-sm text-gray-500">{client.email}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        client.subscription === 'active' ? 'bg-green-100 text-green-700' :
                        client.subscription === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {client.subscription === 'active' ? '✓' : client.subscription === 'paused' ? '⏸' : '✗'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Livello:</span>
                        <span className="font-medium capitalize">{client.level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Allenamenti:</span>
                        <span className="font-medium">{client.totalWorkouts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Costanza:</span>
                        <span className="font-medium">{client.stats.consistency}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Form Score:</span>
                        <span className="font-medium">{client.stats.formScore}%</span>
                      </div>
                    </div>
                    
                    {client.injuries && client.injuries.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="text-xs text-red-600 flex items-center gap-1">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          Infortunio segnalato
                        </span>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t flex gap-2">
                      <button className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 text-sm rounded hover:bg-blue-100">
                        Programma
                      </button>
                      <button className="flex-1 px-3 py-1.5 bg-green-50 text-green-600 text-sm rounded hover:bg-green-100">
                        Messaggio
                      </button>
                      <button className="flex-1 px-3 py-1.5 bg-purple-50 text-purple-600 text-sm rounded hover:bg-purple-100">
                        Report
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Programs View */}
        {currentView === 'programs' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Programmi di Allenamento</h2>
              <button
                onClick={() => setShowNewProgramModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Crea Programma
              </button>
            </div>
            
            <div className="grid gap-6">
              {programs.map(program => (
                <div key={program.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{program.name}</h3>
                      <p className="text-gray-600">{program.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      program.type === 'strength' ? 'bg-red-100 text-red-700' :
                      program.type === 'hypertrophy' ? 'bg-blue-100 text-blue-700' :
                      program.type === 'endurance' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {program.type}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-600">Durata:</span>
                      <span className="ml-2 font-medium">{program.duration} settimane</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Frequenza:</span>
                      <span className="ml-2 font-medium">{program.frequency}x/settimana</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Esercizi:</span>
                      <span className="ml-2 font-medium">{program.exercises.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Assegnato a:</span>
                      <span className="ml-2 font-medium">{program.assignedTo.length} clienti</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                      Modifica
                    </button>
                    <button className="px-4 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100">
                      Duplica
                    </button>
                    <button className="px-4 py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100">
                      Assegna
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Video Reviews View */}
        {currentView === 'reviews' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Video Review</h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                  {pendingReviews} in attesa
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {videoReviews.filter(v => v.status === 'reviewed').length} completate
                </span>
              </div>
            </div>
            
            <div className="grid gap-4">
              {videoReviews.map(review => (
                <div
                  key={review.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedVideo(review)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <VideoCameraIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{review.clientName}</h3>
                        <p className="text-gray-600">{review.exerciseName}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.uploadDate).toLocaleDateString('it-IT')} • {review.duration}s
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {review.status === 'reviewed' && review.overallRating && (
                        <div className="flex items-center gap-1">
                          <StarSolid className="w-5 h-5 text-yellow-400" />
                          <span className="font-medium">{review.overallRating}/10</span>
                        </div>
                      )}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        review.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        review.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {review.status === 'pending' ? 'In attesa' :
                         review.status === 'in-progress' ? 'In corso' :
                         'Completata'}
                      </span>
                      <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <PlayIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Analytics View */}
        {currentView === 'analytics' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Analytics & Report</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <DocumentArrowDownIcon className="w-5 h-5" />
                Export Report
              </button>
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <UsersIcon className="w-8 h-8 text-blue-600" />
                  <span className="text-sm text-green-600">+12%</span>
                </div>
                <div className="text-2xl font-bold">{clients.length}</div>
                <div className="text-sm text-gray-600">Clienti Attivi</div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <FireIcon className="w-8 h-8 text-orange-600" />
                  <span className="text-sm text-green-600">+8%</span>
                </div>
                <div className="text-2xl font-bold">
                  {clients.reduce((sum, c) => sum + c.totalWorkouts, 0)}
                </div>
                <div className="text-sm text-gray-600">Allenamenti Totali</div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrophyIcon className="w-8 h-8 text-purple-600" />
                  <span className="text-sm text-green-600">+15%</span>
                </div>
                <div className="text-2xl font-bold">
                  {Math.round(clients.reduce((sum, c) => sum + c.stats.consistency, 0) / clients.length)}%
                </div>
                <div className="text-sm text-gray-600">Costanza Media</div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <StarIcon className="w-8 h-8 text-yellow-600" />
                  <span className="text-sm text-green-600">+5%</span>
                </div>
                <div className="text-2xl font-bold">
                  {Math.round(clients.reduce((sum, c) => sum + c.stats.formScore, 0) / clients.length)}%
                </div>
                <div className="text-sm text-gray-600">Form Score Medio</div>
              </div>
            </div>
            
            {/* Charts Placeholder */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4">Progressi Clienti (Ultimo Mese)</h3>
                <div className="h-64 bg-gray-50 rounded flex items-center justify-center text-gray-400">
                  📊 Grafico Progressi
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4">Distribuzione Allenamenti</h3>
                <div className="h-64 bg-gray-50 rounded flex items-center justify-center text-gray-400">
                  📈 Grafico Distribuzione
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Messages View */}
        {currentView === 'messages' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Messaggi e Notifiche</h2>
            
            <div className="bg-white rounded-lg shadow divide-y">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`p-6 hover:bg-gray-50 cursor-pointer ${
                    !message.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        message.type === 'workout-complete' ? 'bg-green-100 text-green-600' :
                        message.type === 'injury-alert' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {message.type === 'workout-complete' ? <CheckCircleIcon className="w-5 h-5" /> :
                         message.type === 'injury-alert' ? <ExclamationTriangleIcon className="w-5 h-5" /> :
                         <ChatBubbleLeftRightIcon className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{message.clientName}</span>
                          {!message.read && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              Nuovo
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700">{message.content}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(message.timestamp).toLocaleString('it-IT')}
                        </p>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                      Rispondi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      
      {/* Modals */}
      {selectedClient && <ClientDetailModal client={selectedClient} />}
      {selectedVideo && <VideoReviewInterface review={selectedVideo} />}
    </div>
  )
}