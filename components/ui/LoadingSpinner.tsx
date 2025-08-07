import React from 'react'
import { clsx } from 'clsx'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'white' | 'gray'
  className?: string
  text?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
  text
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    primary: 'border-primary-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  if (text) {
    return (
      <div className={clsx('flex flex-col items-center justify-center space-y-3', className)}>
        <div
          className={clsx(
            'border-2 rounded-full animate-spin',
            sizeClasses[size],
            colorClasses[color]
          )}
        />
        <p className={clsx('text-gray-600 font-medium', textSizeClasses[size])}>
          {text}
        </p>
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'border-2 rounded-full animate-spin inline-block',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  )
}

// Full-screen loading overlay
interface LoadingOverlayProps {
  text?: string
  className?: string
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  text = 'Loading...',
  className
}) => {
  return (
    <div className={clsx(
      'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50',
      className
    )}>
      <div className="bg-white rounded-lg p-8 shadow-2xl">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  )
}

// Inline loading state for buttons/components
interface LoadingDotsProps {
  className?: string
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({ className }) => {
  return (
    <span className={clsx('loading-dots', className)}>
      Loading<span className="animate-pulse">...</span>
    </span>
  )
}