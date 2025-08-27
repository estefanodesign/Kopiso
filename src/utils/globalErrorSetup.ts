import { errorMonitoring, ErrorSeverity, ErrorCategory, addBreadcrumb } from './errorMonitoring'
import { ErrorHandler } from './errorHandler'
import { notifications } from './notifications'
import * as React from 'react'

// Global error handling configuration
interface GlobalErrorConfig {
  enableConsoleLogging: boolean
  enableServerReporting: boolean
  enableUserNotifications: boolean
  enablePerformanceMonitoring: boolean
  maxErrorsInMemory: number
  rateLimitNotifications: boolean
  serverEndpoint?: string
}

// Default configuration
const defaultConfig: GlobalErrorConfig = {
  enableConsoleLogging: typeof process !== 'undefined' && process.env?.NODE_ENV === 'development',
  enableServerReporting: typeof process !== 'undefined' && process.env?.NODE_ENV === 'production',
  enableUserNotifications: true,
  enablePerformanceMonitoring: true,
  maxErrorsInMemory: 100,
  rateLimitNotifications: true,
  serverEndpoint: '/api/errors'
}

// Setup global error handling
export const setupGlobalErrorHandling = (config: Partial<GlobalErrorConfig> = {}): void => {
  const finalConfig = { ...defaultConfig, ...config }
  
  // Configure error monitoring
  errorMonitoring.updateConfig({
    enabled: true,
    logLevel: typeof process !== 'undefined' && process.env?.NODE_ENV === 'development' ? ErrorSeverity.LOW : ErrorSeverity.MEDIUM,
    maxErrorsInMemory: finalConfig.maxErrorsInMemory,
    reportToConsole: finalConfig.enableConsoleLogging,
    reportToServer: finalConfig.enableServerReporting,
    serverEndpoint: finalConfig.serverEndpoint,
    includePerformanceMetrics: finalConfig.enablePerformanceMonitoring,
    autoNotifyUsers: finalConfig.enableUserNotifications,
    rateLimitNotifications: finalConfig.rateLimitNotifications
  })

  // Set up global error handlers only in browser environment
  if (typeof window !== 'undefined') {
    setupBrowserErrorHandlers()
    setupNetworkErrorHandlers()
    setupPerformanceMonitoring()
    setupUserActionTracking()
  }

  addBreadcrumb('Global error handling initialized', 'info', { config: finalConfig })
}

// Setup browser-specific error handlers
const setupBrowserErrorHandlers = (): void => {
  const errorHandler = ErrorHandler.getInstance()

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = new Error(event.reason?.message || 'Unhandled promise rejection')
    
    errorMonitoring.logError(
      error,
      {
        component: 'window',
        action: 'unhandledrejection',
        additionalData: {
          reason: event.reason,
          promise: event.promise
        }
      },
      ErrorSeverity.HIGH,
      ErrorCategory.SYSTEM
    )

    // Prevent the default browser behavior
    event.preventDefault()
  })

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message || 'Unknown error')
    
    errorMonitoring.logError(
      error,
      {
        component: 'window',
        action: 'javascript_error',
        additionalData: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          source: event.target
        }
      },
      ErrorSeverity.MEDIUM,
      ErrorCategory.SYSTEM
    )
  })

  // Handle resource loading errors (images, scripts, etc.)
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      const target = event.target as HTMLElement
      const error = new Error(`Failed to load resource: ${target.tagName}`)
      
      errorMonitoring.logError(
        error,
        {
          component: 'window',
          action: 'resource_load_error',
          additionalData: {
            tagName: target.tagName,
            src: (target as any).src || (target as any).href,
            id: target.id,
            className: target.className
          }
        },
        ErrorSeverity.LOW,
        ErrorCategory.SYSTEM
      )
    }
  }, true) // Use capture phase for resource errors

  // Handle chunk loading errors (code splitting failures)
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args)
      
      // Check for chunk loading failures
      if (!response.ok && args[0]?.toString().includes('/_next/static/')) {
        const error = new Error(`Chunk loading failed: ${response.status}`)
        
        errorMonitoring.logError(
          error,
          {
            component: 'window',
            action: 'chunk_load_error',
            additionalData: {
              url: args[0],
              status: response.status,
              statusText: response.statusText
            }
          },
          ErrorSeverity.MEDIUM,
          ErrorCategory.SYSTEM
        )

        // Show user-friendly message for chunk errors
        notifications.warning(
          'The application has been updated. Please refresh the page to load the latest version.',
          'Update Required'
        )
      }
      
      return response
    } catch (error) {
      // Network errors
      if (error instanceof Error) {
        errorMonitoring.logError(
          error,
          {
            component: 'window',
            action: 'fetch_error',
            additionalData: {
              url: args[0],
              method: args[1]?.method || 'GET'
            }
          },
          ErrorSeverity.MEDIUM,
          ErrorCategory.NETWORK
        )
      }
      
      throw error
    }
  }
}

// Setup network error monitoring
const setupNetworkErrorHandlers = (): void => {
  // Monitor online/offline status
  window.addEventListener('online', () => {
    addBreadcrumb('Network connection restored', 'info')
    notifications.success('Connection restored', 'Network Status')
  })

  window.addEventListener('offline', () => {
    addBreadcrumb('Network connection lost', 'warning')
    notifications.warning('You appear to be offline. Some features may not work properly.', 'Network Status')
  })

  // Monitor connection quality
  if ('connection' in navigator) {
    const connection = (navigator as any).connection
    
    const logConnectionChange = () => {
      addBreadcrumb('Connection changed', 'info', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      })

      // Warn about slow connections
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        notifications.warning('Slow connection detected. Some features may load slowly.', 'Connection Quality')
      }
    }

    connection.addEventListener('change', logConnectionChange)
  }
}

// Setup performance monitoring
const setupPerformanceMonitoring = (): void => {
  // Monitor page load performance
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const loadTime = navigation.loadEventEnd - navigation.fetchStart

      addBreadcrumb('Page loaded', 'info', {
        loadTime: loadTime,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        responseTime: navigation.responseEnd - navigation.requestStart
      })

      // Warn about slow page loads
      if (loadTime > 5000) {
        console.warn(`Slow page load detected: ${loadTime}ms`)
      }
    }, 0)
  })

  // Monitor long tasks (main thread blocking)
  if ('PerformanceObserver' in window) {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            addBreadcrumb('Long task detected', 'warning', {
              duration: entry.duration,
              startTime: entry.startTime
            })
          }
        }
      })
      
      longTaskObserver.observe({ entryTypes: ['longtask'] })
    } catch (error) {
      console.warn('Performance observer not supported:', error)
    }
  }

  // Monitor memory usage
  if ('memory' in performance) {
    setInterval(() => {
      const memory = (performance as any).memory
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576)
      const totalMB = Math.round(memory.totalJSHeapSize / 1048576)
      
      // Warn about high memory usage
      if (usedMB > 100) {
        addBreadcrumb('High memory usage detected', 'warning', {
          usedMB,
          totalMB,
          percentage: Math.round((usedMB / totalMB) * 100)
        })
      }
    }, 30000) // Check every 30 seconds
  }
}

// Setup user action tracking for better error context
const setupUserActionTracking = (): void => {
  // Track navigation
  window.addEventListener('popstate', () => {
    addBreadcrumb('Navigation', 'info', { 
      url: window.location.href,
      type: 'back/forward' 
    })
  })

  // Track clicks
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (target.tagName === 'BUTTON' || target.tagName === 'A') {
      addBreadcrumb('User click', 'info', {
        element: target.tagName,
        text: target.textContent?.slice(0, 50),
        id: target.id,
        className: target.className
      })
    }
  })

  // Track form submissions
  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement
    addBreadcrumb('Form submission', 'info', {
      formId: form.id,
      formName: form.name,
      action: form.action,
      method: form.method
    })
  })

  // Track input focus for form errors
  document.addEventListener('focusin', (event) => {
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      addBreadcrumb('Input focus', 'info', {
        element: target.tagName,
        name: (target as HTMLInputElement).name,
        type: (target as HTMLInputElement).type
      })
    }
  })
}

// Error reporting utilities
const internalReportError = async (error: Error, context?: any): Promise<void> => {
  errorMonitoring.logError(
    error,
    {
      component: 'manual_report',
      action: 'user_reported',
      additionalData: context
    },
    ErrorSeverity.MEDIUM,
    ErrorCategory.USER_ACTION
  )
}

// React integration utilities
const internalWithErrorReporting = <T extends Record<string, any>>(
  Component: React.ComponentType<T>
): React.ComponentType<T> => {
  const WrappedComponent = (props: T) => {
    React.useEffect(() => {
      addBreadcrumb(`Component mounted: ${Component.displayName || Component.name}`, 'info')
      
      return () => {
        addBreadcrumb(`Component unmounted: ${Component.displayName || Component.name}`, 'info')
      }
    }, [])

    return React.createElement(Component, props)
  }

  WrappedComponent.displayName = `withErrorReporting(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Hook for manual error reporting
const internalUseErrorReporting = () => {
  return {
    reportError: (error: Error, context?: any) => {
      errorMonitoring.logError(
        error,
        {
          component: 'useErrorReporting',
          action: 'hook_reported',
          additionalData: context
        },
        ErrorSeverity.MEDIUM,
        ErrorCategory.USER_ACTION
      )
    },
    addBreadcrumb: (message: string, level?: 'info' | 'warning' | 'error', data?: any) => {
      addBreadcrumb(message, level, data)
    }
  }
}

// Development utilities
const internalDevTools = {
  // Get current error stats
  getErrorStats: () => errorMonitoring.getErrorStats(),
  
  // Export errors for debugging
  exportErrors: () => errorMonitoring.exportErrors(),
  
  // Clear all errors
  clearErrors: () => errorMonitoring.clearErrors(),
  
  // Simulate an error for testing
  simulateError: (type: 'network' | 'validation' | 'runtime' | 'chunk' = 'runtime') => {
    switch (type) {
      case 'network':
        fetch('/nonexistent-endpoint').catch(() => {})
        break
      case 'validation':
        const validationError = new Error('Test validation error')
        validationError.name = 'ValidationError'
        throw validationError
      case 'runtime':
        throw new Error('Test runtime error')
      case 'chunk':
        // Simulate chunk loading error without actually importing
        console.warn('Simulating chunk loading error for testing')
        break
    }
  }
}

// Make dev tools available globally in development
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).kopisoDevTools = internalDevTools
}

// Export setup function and utilities
export {
  setupGlobalErrorHandling as default,
  internalReportError as reportError,
  internalWithErrorReporting as withErrorReporting,
  internalUseErrorReporting as useErrorReporting,
  internalDevTools as devTools
}