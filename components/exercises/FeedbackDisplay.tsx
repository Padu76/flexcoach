'use client'

import React from 'react'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  TrophyIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import type { FeedbackDisplayProps } from '@/types'

export const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({
  exerciseType,
  repCount,
  currentPhase,
  formFeedback,
  formQuality,
  className = ''
}) => {
  
  // Determina l'icona e il colore basato sulla qualità della forma
  const getFeedbackIcon = (quality: number) => {
    if (quality >= 90) return <TrophyIcon className="w-6 h-6" />
    if (quality >= 80) return <CheckCircleIcon className="w-6 h-6" />
    if (quality >= 60) return <ExclamationTriangleIcon className="w-6 h-6" />
    return <XCircleIcon className="w-6 h-6" />
  }

  const getFeedbackColor = (quality: number) => {
    if (quality >= 90) return 'bg-yellow-500 text-white' // Oro per eccellente
    if (quality >= 80) return 'bg-green-500 text-white'
    if (quality >= 60) return 'bg-yellow-500 text-white'
    return 'bg-red-500 text-white'
  }

  const getQualityText = (quality: number) => {
    if (quality >= 90) return 'PERFETTO!'
    if (quality >= 80) return 'OTTIMO'
    if (quality >= 60) return 'BUONO'
    return 'DA MIGLIORARE'
  }

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'up':
        return '⬆️'
      case 'down':
        return '⬇️'
      case 'transition':
        return '🔄'
      default:
        return '⏸️'
    }
  }

  const getExerciseName = (type: string) => {
    switch (type) {
      case 'squat':
        return 'Squat'
      case 'bench-press':
        return 'Panca Piana'
      case 'deadlift':
        return 'Stacco da Terra'
      default:
        return 'Esercizio'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header con nome esercizio */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {getExerciseName(exerciseType)}
        </h2>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
          <span>Fase: {getPhaseIcon(currentPhase)} {currentPhase.toUpperCase()}</span>
        </div>
      </div>

      {/* Stats principali */}
      <div className="grid grid-cols-2 gap-4">
        {/* Contatore ripetizioni */}
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {repCount}
          </div>
          <div className="text-sm text-gray-600">
            Ripetizioni
          </div>
        </div>

        {/* Qualità forma */}
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold mb-2" style={{
            color: formQuality >= 90 ? '#eab308' : // oro
                   formQuality >= 80 ? '#10b981' : // verde
                   formQuality >= 60 ? '#f59e0b' : // giallo
                   '#ef4444' // rosso
          }}>
            {formQuality}%
          </div>
          <div className="text-sm text-gray-600">
            Forma
          </div>
        </div>
      </div>

      {/* Feedback principale */}
      <div className={`card p-6 text-center ${getFeedbackColor(formQuality)}`}>
        <div className="flex items-center justify-center mb-3">
          {getFeedbackIcon(formQuality)}
          <span className="ml-2 text-xl font-bold">
            {getQualityText(formQuality)}
          </span>
        </div>
        
        {formFeedback.length > 0 && (
          <div className="space-y-2">
            {formFeedback.slice(0, 2).map((feedback, index) => (
              <div key={index} className="text-sm">
                {feedback}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress bar forma */}
      <div className="card p-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Qualità Forma</span>
          <span>{formQuality}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full transition-all duration-300 ease-out"
            style={{
              width: `${Math.max(5, formQuality)}%`,
              backgroundColor: formQuality >= 90 ? '#eab308' : // oro
                             formQuality >= 80 ? '#10b981' : // verde
                             formQuality >= 60 ? '#f59e0b' : // giallo
                             '#ef4444' // rosso
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Obiettivi/Milestones */}
      {repCount > 0 && (
        <div className="card p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <TrophyIcon className="w-4 h-4 mr-2" />
            Obiettivi
          </h4>
          <div className="space-y-2 text-sm">
            <div className={`flex items-center justify-between ${repCount >= 5 ? 'text-green-600' : 'text-gray-500'}`}>
              <span>5 ripetizioni</span>
              {repCount >= 5 && <CheckCircleIcon className="w-4 h-4" />}
            </div>
            <div className={`flex items-center justify-between ${repCount >= 10 ? 'text-green-600' : 'text-gray-500'}`}>
              <span>10 ripetizioni</span>
              {repCount >= 10 && <CheckCircleIcon className="w-4 h-4" />}
            </div>
            <div className={`flex items-center justify-between ${repCount >= 15 ? 'text-green-600' : 'text-gray-500'}`}>
              <span>15 ripetizioni</span>
              {repCount >= 15 && <CheckCircleIcon className="w-4 h-4" />}
            </div>
          </div>
        </div>
      )}

      {/* Streak/Motivation */}
      {formQuality >= 80 && repCount >= 3 && (
        <div className="card p-4 bg-gradient-to-r from-orange-400 to-red-500 text-white text-center">
          <FireIcon className="w-8 h-8 mx-auto mb-2" />
          <div className="font-bold">Serie di qualità!</div>
          <div className="text-sm opacity-90">
            {repCount} ripetizioni con forma eccellente
          </div>
        </div>
      )}

      {/* Tips specifici per esercizio */}
      <div className="card p-4 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">
          💡 Suggerimento
        </h4>
        <p className="text-sm text-blue-800">
          {exerciseType === 'squat' && 'Mantieni il peso sui talloni e spingi i fianchi indietro.'}
          {exerciseType === 'bench-press' && 'Tieni le scapole addotte e controlla la discesa.'}
          {exerciseType === 'deadlift' && 'Mantieni la schiena dritta e il bilanciere vicino al corpo.'}
        </p>
      </div>
    </div>
  )
}