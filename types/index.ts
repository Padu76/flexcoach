// Core types for FlexCoach application

// MediaPipe related types
export interface Poselandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

export type ExerciseType = 'squat' | 'bench-press' | 'deadlift'

export type FeedbackSeverity = 'success' | 'warning' | 'danger'

export interface ExerciseFeedback {
  severity: FeedbackSeverity
  message: string
  correction: string
  priority: number
}

export interface PoseAnalysisResult {
  formScore: number
  feedback: ExerciseFeedback[]
  repCount: number
  currentPhase: 'up' | 'down' | 'transition'
  angles: {
    [joint: string]: number
  }
}

// Exercise configuration
export interface ExerciseConfig {
  id: ExerciseType
  name: string
  description: string
  instructions: string[]
  keyPoints: string[]
  commonMistakes: string[]
  targetMuscles: string[]
}

// User and session types
export interface User {
  id: string
  email: string
  displayName?: string
  photoURL?: string
  createdAt: Date
  updatedAt: Date
  preferences?: UserPreferences
}

export interface UserPreferences {
  defaultExercise: ExerciseType
  feedbackVoice: boolean
  feedbackSensitivity: 'low' | 'medium' | 'high'
  units: 'metric' | 'imperial'
  language: 'en' | 'it'
}

export interface WorkoutSession {
  id: string
  userId: string
  exerciseType: ExerciseType
  startTime: Date
  endTime?: Date
  totalReps: number
  averageFormScore: number
  feedback: ExerciseFeedback[]
  duration: number // in seconds
  metadata?: {
    deviceType: 'desktop' | 'mobile' | 'tablet'
    browserName: string
    cameraResolution: string
  }
}

export interface ExerciseStats {
  exerciseType: ExerciseType
  totalSessions: number
  totalReps: number
  averageFormScore: number
  bestFormScore: number
  improvementTrend: 'improving' | 'stable' | 'declining'
  lastSessionDate: Date
  commonIssues: string[]
}

// MediaPipe hook types
export interface UsePoseTrackingOptions {
  modelComplexity?: 'lite' | 'full' | 'heavy'
  minDetectionConfidence?: number
  minTrackingConfidence?: number
  maxNumPoses?: number
}

export interface UsePoseTrackingReturn {
  isInitialized: boolean
  error: string | null
  videoRef: React.RefObject<HTMLVideoElement>
  detectPose: (onResults: (results: any) => void) => void
  cleanup: () => void
}

// Camera hook types
export interface UseCameraOptions {
  width?: number
  height?: number
  facingMode?: 'user' | 'environment'
  frameRate?: number
}

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>
  isStreamActive: boolean
  error: string | null
  startCamera: () => Promise<void>
  stopCamera: () => void
  switchCamera: () => Promise<void>
  capturePhoto: () => string | null
}

// Firebase types
export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

// Component prop types
export interface ExerciseDetectorProps {
  exerciseType: ExerciseType
  onSessionComplete?: (session: WorkoutSession) => void
  onFeedback?: (feedback: ExerciseFeedback) => void
  className?: string
}

export interface FeedbackDisplayProps {
  exerciseType: ExerciseType
  repCount: number
  currentPhase: 'up' | 'down' | 'transition'
  formFeedback: string[]
  formQuality: number
  className?: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface SessionSaveResponse {
  sessionId: string
  saved: boolean
}

// Error types
export interface AppError {
  code: string
  message: string
  severity: 'low' | 'medium' | 'high'
  timestamp: Date
  context?: Record<string, any>
}