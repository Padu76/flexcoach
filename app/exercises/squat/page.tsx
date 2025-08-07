import ExerciseDetector from '@/components/exercises/ExerciseDetector'
import type { WorkoutSession, ExerciseFeedback } from '@/types'

export default function SquatPage() {
  const session: WorkoutSession = {
    exercise: 'squat',
    reps: 0,
    feedback: [] as ExerciseFeedback[],
  }

  return <ExerciseDetector session={session} />
}
