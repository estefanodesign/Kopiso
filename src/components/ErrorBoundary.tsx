'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { notifications } from '@/utils/notifications'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log error to notification system
    notifications.system.error(`Application error: ${error.message}`)

    // In production, you would send this to your error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h1>
            
            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened. Our team has been notified and is working on a fix.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-medium text-red-800 mb-2">Error Details:</h3>
                <pre className="text-xs text-red-700 overflow-auto max-h-32">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-red-600">Component Stack</summary>
                      <div className="mt-1 whitespace-pre-wrap text-xs">
                        {this.state.errorInfo.componentStack}
                      </div>
                    </details>
                  )}
                </pre>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center space-x-2 bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Try Again</span>
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Home className="h-5 w-5" />
                <span>Go Home</span>
              </button>

              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => {
                    console.error('Full error details:', this.state.error, this.state.errorInfo)
                  }}
                  className="w-full flex items-center justify-center space-x-2 text-gray-500 hover:text-gray-700 py-2 text-sm transition-colors"
                >
                  <Bug className="h-4 w-4" />
                  <span>Log Error to Console</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Component Error Boundary for smaller sections
export function ComponentErrorBoundary({ 
  children, 
  fallback, 
  componentName = 'Component' 
}: { 
  children: ReactNode
  fallback?: ReactNode
  componentName?: string 
}) {
  return (
    <ErrorBoundary
      fallback={
        fallback || (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  {componentName} Error
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  This component encountered an error. Please refresh the page or try again later.
                </p>
              </div>
            </div>
          </div>
        )
      }
      onError={(error, errorInfo) => {
        console.error(`${componentName} error:`, error, errorInfo)
        notifications.system.error(`${componentName} encountered an error`)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Async Error Boundary for handling async operations
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Handle async errors specifically
        if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
          notifications.warning('Please refresh the page to load the latest version')
        }
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary