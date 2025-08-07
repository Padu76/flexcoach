import React from 'react';
import type { ExerciseFeedback, FeedbackSeverity } from '@/types';

// Funzione per mappare severity a colore CSS
const getColorFromSeverity = (severity: FeedbackSeverity): string => {
  switch(severity) {
    case 'success': 
      return 'text-green-500';
    case 'warning': 
      return 'text-yellow-500';
    case 'danger': 
      return 'text-red-500';
    default: 
      return 'text-gray-500';
  }
}

export default function FeedbackDisplay({ feedback }: { feedback: ExerciseFeedback[] }) {
  if (!feedback || feedback.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      {feedback.map((item, index) => (
        <div key={index} className="rounded-lg p-3 bg-gray-50">
          <div className={`text-sm font-semibold ${getColorFromSeverity(item.severity)}`}>
            {item.message}
          </div>
          {item.correction && (
            <div className="text-xs text-gray-600 mt-1">
              💡 {item.correction}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Named export per compatibilità
export { default as FeedbackDisplay } from './FeedbackDisplay';