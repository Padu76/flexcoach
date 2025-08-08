// components/ErrorBoundary.tsx - Error Boundary con Sentry integration

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'
import { 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
  BugAntIcon
} from '@heroicons/react/24/outline'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  eventId: string | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    }
  }
  
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      eventId: null
    }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
    
    // Send to Sentry
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack
        }
      },
      tags: {
        component: 'ErrorBoundary',
        location: window.location.pathname
      }
    })
    
    // Update state
    this.setState({
      errorInfo,
      eventId
    })
  }
  
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    })
  }
  
  handleReload = () => {
    window.location.reload()
  }
  
  handleGoHome = () => {
    window.location.href = '/'
  }
  
  handleReportFeedback = () => {
    if (this.state.eventId) {
      const user = {
        email: 'user@example.com', // Prendi da auth context se disponibile
        name: 'User'
      }
      
      Sentry.showReportDialog({
        eventId: this.state.eventId,
        user,
        title: 'Sembra che ci sia stato un problema',
        subtitle: 'Il nostro team è stato notificato.',
        subtitle2: 'Se vuoi, puoi descrivere cosa è successo:',
        labelName: 'Nome',
        labelEmail: 'Email',
        labelComments: 'Cosa stavi facendo quando si è verificato l\'errore?',
        labelClose: 'Chiudi',
        labelSubmit: 'Invia',
        errorGeneric: 'Si è verificato un errore durante l\'invio del report. Riprova più tardi.',
        successMessage: 'Grazie per il feedback! Il team lo riceverà a breve.'
      })
    }
  }
  
  render() {
    if (this.state.hasError) {
      // Custom fallback UI se fornito
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }
      
      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* Header */}
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-10 h-10 text-red-600" />
                </div>
              </div>
              
              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
                Oops! Qualcosa è andato storto
              </h1>
              
              {/* Description */}
              <p className="text-gray-600 text-center mb-8">
                Si è verificato un errore inaspettato. Il nostro team è stato automaticamente 
                notificato e risolveremo il problema al più presto.
              </p>
              
              {/* Error details (solo in dev o se showDetails è true) */}
              {(process.env.NODE_ENV === 'development' || this.props.showDetails) && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-900 mb-2">Dettagli errore:</h3>
                  <p className="text-sm text-red-800 font-mono">{this.state.error.message}</p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-red-700 hover:text-red-900">
                        Stack trace
                      </summary>
                      <pre className="mt-2 text-xs text-red-700 overflow-auto max-h-40 p-2 bg-red-100 rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              {/* Event ID */}
              {this.state.eventId && (
                <div className="mb-6 text-center">
                  <p className="text-xs text-gray-500">
                    ID Errore: <span className="font-mono">{this.state.eventId}</span>
                  </p>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  Riprova
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  Ricarica Pagina
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <HomeIcon className="w-5 h-5" />
                  Torna alla Home
                </button>
                
                {this.state.eventId && (
                  <button
                    onClick={this.handleReportFeedback}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <BugAntIcon className="w-5 h-5" />
                    Segnala Problema
                  </button>
                )}
              </div>
              
              {/* Help text */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  Se il problema persiste, contatta il supporto all'indirizzo{' '}
                  <a href="mailto:support@flexcoach.it" className="text-blue-600 hover:underline">
                    support@flexcoach.it
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    return this.props.children
  }
}

export default ErrorBoundary

// Hook per usare ErrorBoundary più facilmente
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )
}