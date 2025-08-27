'use client'

import * as React from 'react'
import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug, Wifi, ShoppingBag, User, Settings } from 'lucide-react'
import { notifications } from '@/utils/notifications'
import { errorMonitoring, ErrorSeverity, ErrorCategory } from '@/utils/errorMonitoring'
import { ErrorBoundary } from './ErrorBoundary'

// Props for specialized error boundaries
interface SpecializedErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  level?: 'page' | 'component' | 'widget'
  context?: string
}

// Network Error Boundary for handling network-related errors
export class NetworkErrorBoundary extends React.Component<
  SpecializedErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: SpecializedErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log network-specific error
    errorMonitoring.logError(
      error,
      {
        component: this.props.context || 'NetworkErrorBoundary',
        action: 'network_error',
        additionalData: { errorInfo }
      },
      ErrorSeverity.MEDIUM,
      ErrorCategory.NETWORK
    )

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
            <Wifi className="h-8 w-8 text-orange-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Connection Problem
          </h3>
          
          <p className="text-gray-600 mb-6 max-w-md">
            We're having trouble connecting to our servers. Please check your internet connection and try again.
          </p>

          <div className="flex space-x-3">
            <button
              onClick={this.handleRetry}
              className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Go Home</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Authentication Error Boundary
export class AuthErrorBoundary extends React.Component<
  SpecializedErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: SpecializedErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorMonitoring.logError(
      error,
      {
        component: this.props.context || 'AuthErrorBoundary',
        action: 'auth_error',
        additionalData: { errorInfo }
      },
      ErrorSeverity.HIGH,
      ErrorCategory.AUTHENTICATION
    )

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleLogin = () => {
    window.location.href = '/auth/login'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <User className="h-8 w-8 text-red-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h3>
          
          <p className="text-gray-600 mb-6 max-w-md">
            You need to be signed in to access this content. Please log in to continue.
          </p>

          <div className="flex space-x-3">
            <button
              onClick={this.handleLogin}
              className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <User className="h-4 w-4" />
              <span>Sign In</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Go Home</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// E-commerce specific error boundary
export class EcommerceErrorBoundary extends React.Component<
  SpecializedErrorBoundaryProps & {
    fallbackType?: 'cart' | 'checkout' | 'product' | 'order'
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: SpecializedErrorBoundaryProps & { fallbackType?: 'cart' | 'checkout' | 'product' | 'order' }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorMonitoring.logError(
      error,
      {
        component: this.props.context || 'EcommerceErrorBoundary',
        action: `${this.props.fallbackType || 'unknown'}_error`,
        additionalData: { errorInfo, fallbackType: this.props.fallbackType }
      },
      ErrorSeverity.HIGH,
      ErrorCategory.BUSINESS_LOGIC
    )

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const fallbackType = this.props.fallbackType || 'product'
      const fallbackContent = this.getFallbackContent(fallbackType)

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          {fallbackContent}
        </div>
      )
    }

    return this.props.children
  }

  private getFallbackContent(type: string) {
    switch (type) {
      case 'cart':
        return (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Cart Error</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              There was a problem loading your cart. Your items are still saved.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Cart</span>
            </button>
          </>
        )

      case 'checkout':
        return (
          <>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Checkout Error</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              We encountered an issue during checkout. Don't worry, your cart is still saved.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.href = '/cart'}
                className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Return to Cart</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
            </div>
          </>
        )

      case 'product':
        return (
          <>
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Product Error</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              We couldn't load this product. It might be temporarily unavailable.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.href = '/products'}
                className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Browse Products</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
            </div>
          </>
        )

      case 'order':
        return (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Order Error</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              We couldn't load your order details. Please try again.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.href = '/profile/orders'}
                className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>View Orders</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
            </div>
          </>
        )

      default:
        return (
          <>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Page</span>
            </button>
          </>
        )
    }
  }
}

// Admin Error Boundary
export class AdminErrorBoundary extends React.Component<
  SpecializedErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: SpecializedErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorMonitoring.logError(
      error,
      {
        component: this.props.context || 'AdminErrorBoundary',
        action: 'admin_error',
        additionalData: { errorInfo }
      },
      ErrorSeverity.CRITICAL,
      ErrorCategory.SYSTEM
    )

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <Settings className="h-8 w-8 text-red-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Admin Panel Error
          </h3>
          
          <p className="text-gray-600 mb-6 max-w-md">
            There was an error in the admin panel. This has been reported to the development team.
          </p>

          <div className="flex space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Panel</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/admin'}
              className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Admin Home</span>
            </button>
          </div>

          {typeof process !== 'undefined' && process.env?.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left max-w-md">
              <h4 className="font-medium text-gray-900 mb-2">Error Details:</h4>
              <pre className="text-xs text-gray-700 overflow-auto max-h-32">
                {this.state.error?.stack}
              </pre>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

// Form Error Boundary for form-specific errors
export const FormErrorBoundary: React.FC<{
  children: ReactNode
  formName?: string
  onError?: (error: Error) => void
}> = ({ children, formName = 'Form', onError }) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        errorMonitoring.logError(
          error,
          {
            component: 'FormErrorBoundary',
            action: 'form_error',
            additionalData: { formName, errorInfo }
          },
          ErrorSeverity.MEDIUM,
          ErrorCategory.VALIDATION
        )

        if (onError) {
          onError(error)
        }
      }}
      fallback={
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                {formName} Error
              </h3>
              <p className="text-sm text-red-700 mt-1">
                There was an error with the form. Please refresh the page and try again.
              </p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// Widget Error Boundary for small components
export const WidgetErrorBoundary: React.FC<{
  children: ReactNode
  widgetName?: string
}> = ({ children, widgetName = 'Widget' }) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        errorMonitoring.logError(
          error,
          {
            component: 'WidgetErrorBoundary',
            action: 'widget_error',
            additionalData: { widgetName, errorInfo }
          },
          ErrorSeverity.LOW,
          ErrorCategory.USER_ACTION
        )
      }}
      fallback={
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <AlertTriangle className="h-4 w-4 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            {widgetName} temporarily unavailable
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}