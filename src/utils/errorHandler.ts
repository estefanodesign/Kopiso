import { notifications } from './notifications'

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  timestamp?: Date
  url?: string
  userAgent?: string
  additionalData?: Record<string, any>
}

export interface ApiError {
  message: string
  code?: string
  status?: number
  field?: string
  details?: any
}

export interface ErrorLogEntry {
  id: string
  type: 'api' | 'network' | 'validation' | 'runtime' | 'chunk'
  message: string
  stack?: string
  context: ErrorContext
  timestamp: Date
  resolved: boolean
}

// Error types enum
export enum ErrorType {
  NETWORK = 'network',
  API = 'api',
  VALIDATION = 'validation',
  RUNTIME = 'runtime',
  CHUNK_LOAD = 'chunk',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  TIMEOUT = 'timeout'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Global error store
class ErrorStore {
  private errors: ErrorLogEntry[] = []
  private maxErrors = 100

  addError(error: Omit<ErrorLogEntry, 'id' | 'timestamp'>): void {
    const errorEntry: ErrorLogEntry = {
      ...error,
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }

    this.errors.unshift(errorEntry)
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors)
    }

    // Save to localStorage in development
    if (process.env.NODE_ENV === 'development') {
      localStorage.setItem('kopiso_errors', JSON.stringify(this.errors.slice(0, 20)))
    }
  }

  getErrors(): ErrorLogEntry[] {
    return [...this.errors]
  }

  clearErrors(): void {
    this.errors = []
    localStorage.removeItem('kopiso_errors')
  }

  markResolved(errorId: string): void {
    const error = this.errors.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
    }
  }
}

const errorStore = new ErrorStore()

// Main error handler class
export class ErrorHandler {
  private static instance: ErrorHandler
  private retryAttempts = new Map<string, number>()
  private maxRetries = 3

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  // Handle API errors
  handleApiError(error: any, context: ErrorContext = {}): ApiError {
    const apiError = this.parseApiError(error)
    
    errorStore.addError({
      type: 'api',
      message: apiError.message,
      context: {
        ...context,
        status: apiError.status,
        code: apiError.code
      },
      resolved: false
    })

    // Handle specific error types
    switch (apiError.status) {
      case 401:
        this.handleUnauthorizedError(apiError, context)
        break
      case 403:
        this.handleForbiddenError(apiError, context)
        break
      case 404:
        this.handleNotFoundError(apiError, context)
        break
      case 429:
        this.handleRateLimitError(apiError, context)
        break
      case 500:
      case 502:
      case 503:
      case 504:
        this.handleServerError(apiError, context)
        break
      default:
        this.handleGenericApiError(apiError, context)
    }

    return apiError
  }

  // Handle network errors
  handleNetworkError(error: any, context: ErrorContext = {}): void {
    errorStore.addError({
      type: 'network',
      message: 'Network connection failed',
      context,
      resolved: false
    })

    if (navigator.onLine === false) {
      notifications.warning('You appear to be offline. Please check your internet connection.')
    } else {
      notifications.network.error()
    }
  }

  // Handle validation errors
  handleValidationError(errors: string[] | Record<string, string>, context: ErrorContext = {}): void {
    const errorMessage = Array.isArray(errors) 
      ? errors.join(', ') 
      : Object.values(errors).join(', ')

    errorStore.addError({
      type: 'validation',
      message: errorMessage,
      context,
      resolved: false
    })

    if (Array.isArray(errors)) {
      notifications.form.validationErrors(errors)
    } else {
      notifications.form.validationErrors(Object.values(errors))
    }
  }

  // Handle runtime errors
  handleRuntimeError(error: Error, context: ErrorContext = {}): void {
    errorStore.addError({
      type: 'runtime',
      message: error.message,
      stack: error.stack,
      context,
      resolved: false
    })

    console.error('Runtime error:', error)
    
    if (process.env.NODE_ENV === 'development') {
      notifications.error(`Runtime Error: ${error.message}`)
    } else {
      notifications.error('An unexpected error occurred. Please refresh the page and try again.')
    }
  }

  // Handle chunk loading errors (code splitting)
  handleChunkLoadError(error: any, context: ErrorContext = {}): void {
    errorStore.addError({
      type: 'chunk',
      message: 'Failed to load application chunk',
      context,
      resolved: false
    })

    notifications.warning(
      'Failed to load the latest version. Please refresh the page.',
      'Update Required',
      {
        label: 'Refresh Page',
        onClick: () => window.location.reload()
      }
    )
  }

  // Retry mechanism for failed operations
  async retryOperation<T>(
    operation: () => Promise<T>,
    operationId: string,
    maxRetries = this.maxRetries
  ): Promise<T> {
    const attempts = this.retryAttempts.get(operationId) || 0
    
    try {
      const result = await operation()
      this.retryAttempts.delete(operationId)
      return result
    } catch (error) {
      if (attempts < maxRetries) {
        this.retryAttempts.set(operationId, attempts + 1)
        
        // Exponential backoff
        const delay = Math.pow(2, attempts) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        
        return this.retryOperation(operation, operationId, maxRetries)
      } else {
        this.retryAttempts.delete(operationId)
        throw error
      }
    }
  }

  // Parse API error response
  private parseApiError(error: any): ApiError {
    // Handle fetch API errors
    if (error instanceof Response) {
      return {
        message: error.statusText || 'Request failed',
        status: error.status,
        code: error.status.toString()
      }
    }

    // Handle axios-style errors
    if (error.response) {
      const { data, status, statusText } = error.response
      return {
        message: data?.message || data?.error || statusText || 'Request failed',
        status,
        code: data?.code,
        field: data?.field,
        details: data?.details
      }
    }

    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
      return {
        message: 'Network connection failed',
        code: 'NETWORK_ERROR'
      }
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        message: 'Request timed out. Please try again.',
        code: 'TIMEOUT'
      }
    }

    // Generic error handling
    return {
      message: error.message || 'An unexpected error occurred',
      code: error.code || 'UNKNOWN_ERROR'
    }
  }

  // Specific error handlers
  private handleUnauthorizedError(error: ApiError, context: ErrorContext): void {
    notifications.warning('Your session has expired. Please sign in again.')
    
    // Redirect to login after a delay
    setTimeout(() => {
      window.location.href = '/auth/login'
    }, 2000)
  }

  private handleForbiddenError(error: ApiError, context: ErrorContext): void {
    notifications.error('You do not have permission to perform this action.')
  }

  private handleNotFoundError(error: ApiError, context: ErrorContext): void {
    notifications.error('The requested resource was not found.')
  }

  private handleRateLimitError(error: ApiError, context: ErrorContext): void {
    notifications.warning('Too many requests. Please wait a moment and try again.')
  }

  private handleServerError(error: ApiError, context: ErrorContext): void {
    notifications.error(
      'Our servers are experiencing issues. Please try again in a few minutes.',
      'Server Error'
    )
  }

  private handleGenericApiError(error: ApiError, context: ErrorContext): void {
    notifications.error(error.message || 'An error occurred while processing your request.')
  }
}

// Utility functions
export const createErrorContext = (component?: string, action?: string, additionalData?: any): ErrorContext => ({
  component,
  action,
  timestamp: new Date(),
  url: typeof window !== 'undefined' ? window.location.href : undefined,
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  additionalData
})

// Enhanced fetch wrapper with error handling
export const safeFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const errorHandler = ErrorHandler.getInstance()
  const context = createErrorContext('safeFetch', 'HTTP_REQUEST', { url, method: options.method })

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw response
    }

    return response
  } catch (error: any) {
    if (error.name === 'AbortError') {
      const timeoutError = { message: 'Request timed out', code: 'TIMEOUT' }
      errorHandler.handleApiError(timeoutError, context)
      throw timeoutError
    }

    if (error instanceof Response) {
      errorHandler.handleApiError(error, context)
      throw error
    }

    errorHandler.handleNetworkError(error, context)
    throw error
  }
}

// Global error handler setup
export const setupGlobalErrorHandling = (): void => {
  const errorHandler = ErrorHandler.getInstance()

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    errorHandler.handleRuntimeError(
      new Error(event.reason?.message || 'Unhandled promise rejection'),
      createErrorContext('window', 'unhandledrejection')
    )
  })

  // Handle global errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
    errorHandler.handleRuntimeError(
      event.error || new Error(event.message),
      createErrorContext('window', 'error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    )
  })

  // Handle chunk loading errors
  window.addEventListener('error', (event) => {
    if (event.message?.includes('Loading chunk') || event.message?.includes('ChunkLoadError')) {
      errorHandler.handleChunkLoadError(event.error, createErrorContext('window', 'chunkload'))
    }
  })
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance()

// Export error store methods
export const getErrorLogs = () => errorStore.getErrors()
export const clearErrorLogs = () => errorStore.clearErrors()
export const markErrorResolved = (errorId: string) => errorStore.markResolved(errorId)

export default {
  ErrorHandler,
  ErrorType,
  ErrorSeverity,
  errorHandler,
  safeFetch,
  setupGlobalErrorHandling,
  createErrorContext,
  getErrorLogs,
  clearErrorLogs,
  markErrorResolved
}