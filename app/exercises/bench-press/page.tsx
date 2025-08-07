import ExerciseDetector from '@/components/exercises/ExerciseDetector'
import type { WorkoutSession, ExerciseFeedback } from '@/types'

export default function BenchPressPage() {
  const session: WorkoutSession = {
    exercise: 'bench-press',
    reps: 0,
    feedback: [] as ExerciseFeedback[],
  }

  return <ExerciseDetector session={session} />
}
