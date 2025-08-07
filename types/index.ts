// types/index.ts - Tipi minimi essenziali per FlexCoach

export type ExerciseType = 'squat' | 'bench-press' | 'deadlift'

export interface Exercise {
  id: ExerciseType
  name: string
  description: string
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzato'
  muscleGroups: string[]
  tips: string[]
}

// Hook types per webcam
export interface UseCameraOptions {
  width?: number
  height?: number
  facingMode?: 'user' | 'environment'
}

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>
  isStreamActive: boolean
  error: string | null
  startCamera: () => Promise<void>
  stopCamera: () => void
}