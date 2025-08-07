import React from 'react';
import type { ExerciseFeedback } from '@/types';

export default function FeedbackDisplay({ feedback }: { feedback: ExerciseFeedback[] }) {
  return (
    <div className="mt-4">
      {feedback.map((item, index) => (
        <div key={index} className={`text-sm font-semibold ${item.color}`}>
          {item.message}
        </div>
      ))}
    </div>
  );
}
