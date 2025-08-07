import ExerciseDetector from '@/components/exercises/ExerciseDetector'
import type { WorkoutSession, ExerciseFeedback } from '@/types'

export default function DeadliftPage() {
  const session: WorkoutSession = {
    exercise: 'deadlift',
    reps: 0,
    feedback: [] as ExerciseFeedback[],
  }

  return <ExerciseDetector session={session} />
}
