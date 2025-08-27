import { ErrorContext, ErrorLogEntry } from './errorHandler'
import { notifications } from './notifications'

// Error severity levels for monitoring
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories for better classification
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  USER_ACTION = 'user_action',
  SYSTEM = 'system',
  THIRD_PARTY = 'third_party'
}

// Enhanced error log entry
export interface EnhancedErrorLog extends ErrorLogEntry {
  severity: ErrorSeverity
  category: ErrorCategory
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
  fingerprint?: string
  stackTrace?: string
  breadcrumbs: Array<{
    timestamp: Date
    message: string
    level: 'info' | 'warning' | 'error'
    data?: any
  }>
  tags: string[]
  metadata: Record<string, any>
}

// Performance metrics
export interface PerformanceMetrics {
  responseTime: number
  memoryUsage?: number
  cpuUsage?: number
  networkLatency?: number
  domContentLoaded?: number
  firstContentfulPaint?: number
  largestContentfulPaint?: number
}

// Error monitoring configuration
export interface ErrorMonitoringConfig {
  enabled: boolean
  logLevel: ErrorSeverity
  maxErrorsInMemory: number
  reportToConsole: boolean
  reportToServer: boolean
  serverEndpoint?: string
  includePerformanceMetrics: boolean
  includeBreadcrumbs: boolean
  maxBreadcrumbs: number
  sensitiveDataKeys: string[]
  autoNotifyUsers: boolean
  rateLimitNotifications: boolean
}

// Default configuration
const DEFAULT_CONFIG: ErrorMonitoringConfig = {
  enabled: true,
  logLevel: ErrorSeverity.LOW,
  maxErrorsInMemory: 100,
  reportToConsole: typeof process !== 'undefined' && process.env?.NODE_ENV === 'development',
  reportToServer: typeof process !== 'undefined' && process.env?.NODE_ENV === 'production',
  serverEndpoint: '/api/errors',
  includePerformanceMetrics: true,
  includeBreadcrumbs: true,
  maxBreadcrumbs: 20,
  sensitiveDataKeys: ['password', 'token', 'apiKey', 'secret', 'credit', 'ssn'],
  autoNotifyUsers: true,
  rateLimitNotifications: true
}

// Error monitoring class
export class ErrorMonitoring {
  private static instance: ErrorMonitoring
  private config: ErrorMonitoringConfig
  private errorLog: EnhancedErrorLog[] = []
  private breadcrumbs: EnhancedErrorLog['breadcrumbs'] = []
  private sessionId: string
  private notificationRateLimit = new Map<string, number>()
  private performanceMetrics: PerformanceMetrics = { responseTime: 0 }

  private constructor(config: Partial<ErrorMonitoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.sessionId = this.generateSessionId()
    this.initializePerformanceMonitoring()
  }

  static getInstance(config?: Partial<ErrorMonitoringConfig>): ErrorMonitoring {
    if (!ErrorMonitoring.instance) {
      ErrorMonitoring.instance = new ErrorMonitoring(config)
    }
    return ErrorMonitoring.instance
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring(): void {
    if (!this.config.includePerformanceMetrics || typeof window === 'undefined') {
      return
    }

    // Monitor page load performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')

      this.performanceMetrics = {
        responseTime: navigation.responseEnd - navigation.requestStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        largestContentfulPaint: 0 // Will be updated by LCP observer
      }

      // Observe Largest Contentful Paint
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            this.performanceMetrics.largestContentfulPaint = lastEntry.startTime
          })
          observer.observe({ entryTypes: ['largest-contentful-paint'] })
        } catch (error) {
          console.warn('Performance observer not supported:', error)
        }
      }
    })

    // Monitor memory usage if available
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        this.performanceMetrics.memoryUsage = memory.usedJSHeapSize
      }, 30000) // Update every 30 seconds
    }
  }

  // Add breadcrumb
  addBreadcrumb(message: string, level: 'info' | 'warning' | 'error' = 'info', data?: any): void {
    if (!this.config.includeBreadcrumbs) return

    const breadcrumb = {
      timestamp: new Date(),
      message,
      level,
      data: this.sanitizeData(data)
    }

    this.breadcrumbs.push(breadcrumb)

    // Limit breadcrumbs
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs)
    }
  }

  // Sanitize sensitive data
  private sanitizeData(data: any): any {
    if (!data) return data

    const sanitized = JSON.parse(JSON.stringify(data))
    
    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj

      for (const key in obj) {
        const lowerKey = key.toLowerCase()
        if (this.config.sensitiveDataKeys.some(sensitive => lowerKey.includes(sensitive))) {
          obj[key] = '[REDACTED]'
        } else if (typeof obj[key] === 'object') {
          obj[key] = sanitizeObject(obj[key])
        }
      }
      return obj
    }

    return sanitizeObject(sanitized)
  }

  // Generate error fingerprint for deduplication
  private generateFingerprint(error: Error, context: ErrorContext): string {
    const message = error.message || 'Unknown error'
    const component = context.component || 'Unknown'
    const action = context.action || 'Unknown'
    
    return btoa(`${message}-${component}-${action}`)
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 32)
  }

  // Determine error severity
  private determineSeverity(error: Error, context: ErrorContext): ErrorSeverity {
    // Network errors are typically medium severity
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return ErrorSeverity.MEDIUM
    }

    // Authentication errors are high severity
    if (context.component === 'auth' || error.message.includes('unauthorized')) {
      return ErrorSeverity.HIGH
    }

    // Validation errors are low severity
    if (error.name === 'ValidationError' || context.action === 'validation') {
      return ErrorSeverity.LOW
    }

    // Critical errors
    if (error.message.includes('critical') || context.component === 'payment') {
      return ErrorSeverity.CRITICAL
    }

    return ErrorSeverity.MEDIUM
  }

  // Determine error category
  private determineCategory(error: Error, context: ErrorContext): ErrorCategory {
    if (context.component === 'auth' || error.message.includes('auth')) {
      return ErrorCategory.AUTHENTICATION
    }

    if (error.message.includes('permission') || error.message.includes('forbidden')) {
      return ErrorCategory.AUTHORIZATION
    }

    if (error.message.includes('fetch') || error.message.includes('network')) {
      return ErrorCategory.NETWORK
    }

    if (error.name === 'ValidationError' || context.action === 'validation') {
      return ErrorCategory.VALIDATION
    }

    if (context.component === 'payment' || context.component === 'checkout') {
      return ErrorCategory.BUSINESS_LOGIC
    }

    if (error.message.includes('performance') || error.message.includes('timeout')) {
      return ErrorCategory.PERFORMANCE
    }

    return ErrorCategory.SYSTEM
  }

  // Log error with enhanced metadata
  logError(
    error: Error,
    context: ErrorContext = {},
    severity?: ErrorSeverity,
    category?: ErrorCategory
  ): EnhancedErrorLog {
    if (!this.config.enabled) {
      return {} as EnhancedErrorLog
    }

    const errorSeverity = severity || this.determineSeverity(error, context)
    const errorCategory = category || this.determineCategory(error, context)
    const fingerprint = this.generateFingerprint(error, context)

    // Skip if severity is below log level
    const severityLevels = [ErrorSeverity.LOW, ErrorSeverity.MEDIUM, ErrorSeverity.HIGH, ErrorSeverity.CRITICAL]
    if (severityLevels.indexOf(errorSeverity) < severityLevels.indexOf(this.config.logLevel)) {
      return {} as EnhancedErrorLog
    }

    const enhancedError: EnhancedErrorLog = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'runtime',
      message: error.message,
      stack: error.stack,
      context: this.sanitizeData(context),
      timestamp: new Date(),
      resolved: false,
      severity: errorSeverity,
      category: errorCategory,
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      fingerprint,
      stackTrace: error.stack,
      breadcrumbs: [...this.breadcrumbs],
      tags: this.generateTags(error, context, errorCategory),
      metadata: {
        performanceMetrics: { ...this.performanceMetrics },
        timestamp: Date.now(),
        environment: typeof process !== 'undefined' ? process.env?.NODE_ENV : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight
        } : undefined
      }
    }

    // Add to error log
    this.errorLog.unshift(enhancedError)

    // Limit errors in memory
    if (this.errorLog.length > this.config.maxErrorsInMemory) {
      this.errorLog = this.errorLog.slice(0, this.config.maxErrorsInMemory)
    }

    // Report error
    this.reportError(enhancedError)

    // Notify user if configured
    if (this.config.autoNotifyUsers) {
      this.notifyUser(enhancedError)
    }

    return enhancedError
  }

  // Generate tags for error
  private generateTags(error: Error, context: ErrorContext, category: ErrorCategory): string[] {
    const tags: string[] = [category]

    if (context.component) tags.push(`component:${context.component}`)
    if (context.action) tags.push(`action:${context.action}`)
    if (error.name) tags.push(`type:${error.name}`)

    // Add browser/environment tags
    if (typeof window !== 'undefined') {
      tags.push('client-side')
      if (navigator.userAgent.includes('Mobile')) tags.push('mobile')
      if (navigator.userAgent.includes('Chrome')) tags.push('chrome')
      if (navigator.userAgent.includes('Firefox')) tags.push('firefox')
      if (navigator.userAgent.includes('Safari')) tags.push('safari')
    } else {
      tags.push('server-side')
    }

    return tags
  }

  // Get current user ID (implement based on your auth system)
  private getCurrentUserId(): string | undefined {
    if (typeof window !== 'undefined') {
      // Try to get from localStorage or auth store
      try {
        const token = localStorage.getItem('token')
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]))
          return payload.userId
        }
      } catch (error) {
        // Ignore error
      }
    }
    return undefined
  }

  // Report error to console and/or server
  private async reportError(errorLog: EnhancedErrorLog): Promise<void> {
    // Console reporting
    if (this.config.reportToConsole) {
      console.group(`🚨 Error [${errorLog.severity.toUpperCase()}] - ${errorLog.category}`)
      console.error('Message:', errorLog.message)
      console.error('Stack:', errorLog.stackTrace)
      console.error('Context:', errorLog.context)
      console.error('Breadcrumbs:', errorLog.breadcrumbs)
      console.error('Metadata:', errorLog.metadata)
      console.groupEnd()
    }

    // Server reporting
    if (this.config.reportToServer && this.config.serverEndpoint) {
      try {
        await fetch(this.config.serverEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(errorLog)
        })
      } catch (reportingError) {
        console.error('Failed to report error to server:', reportingError)
      }
    }
  }

  // Notify user about error
  private notifyUser(errorLog: EnhancedErrorLog): void {
    if (!this.config.rateLimitNotifications || !this.isRateLimited(errorLog.fingerprint)) {
      switch (errorLog.severity) {
        case ErrorSeverity.CRITICAL:
          notifications.error(
            'A critical error occurred. Please refresh the page and try again.',
            'Critical Error'
          )
          break
        case ErrorSeverity.HIGH:
          notifications.error(
            'An error occurred while processing your request.',
            'Error'
          )
          break
        case ErrorSeverity.MEDIUM:
          notifications.warning(
            'Something went wrong. Please try again.',
            'Warning'
          )
          break
        // Don't notify for low severity errors
      }

      // Update rate limit
      if (this.config.rateLimitNotifications) {
        this.notificationRateLimit.set(errorLog.fingerprint, Date.now())
      }
    }
  }

  // Check if notification is rate limited
  private isRateLimited(fingerprint: string): boolean {
    const lastNotification = this.notificationRateLimit.get(fingerprint)
    if (!lastNotification) return false

    const rateLimitWindow = 60000 // 1 minute
    return Date.now() - lastNotification < rateLimitWindow
  }

  // Get error statistics
  getErrorStats(): {
    total: number
    bySeverity: Record<ErrorSeverity, number>
    byCategory: Record<ErrorCategory, number>
    recentErrors: EnhancedErrorLog[]
  } {
    const bySeverity = {} as Record<ErrorSeverity, number>
    const byCategory = {} as Record<ErrorCategory, number>

    Object.values(ErrorSeverity).forEach(severity => {
      bySeverity[severity] = 0
    })

    Object.values(ErrorCategory).forEach(category => {
      byCategory[category] = 0
    })

    this.errorLog.forEach(error => {
      bySeverity[error.severity]++
      byCategory[error.category]++
    })

    return {
      total: this.errorLog.length,
      bySeverity,
      byCategory,
      recentErrors: this.errorLog.slice(0, 10)
    }
  }

  // Clear error log
  clearErrors(): void {
    this.errorLog = []
    this.breadcrumbs = []
    this.notificationRateLimit.clear()
  }

  // Export errors for debugging
  exportErrors(): string {
    return JSON.stringify(this.errorLog, null, 2)
  }

  // Update configuration
  updateConfig(config: Partial<ErrorMonitoringConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// Create singleton instance
export const errorMonitoring = ErrorMonitoring.getInstance()

// Convenience functions
export const logError = (error: Error, context?: ErrorContext, severity?: ErrorSeverity, category?: ErrorCategory) => {
  return errorMonitoring.logError(error, context, severity, category)
}

export const addBreadcrumb = (message: string, level?: 'info' | 'warning' | 'error', data?: any) => {
  errorMonitoring.addBreadcrumb(message, level, data)
}

export const getErrorStats = () => {
  return errorMonitoring.getErrorStats()
}

// Error monitoring React hook
export const useErrorMonitoring = () => {
  return {
    logError,
    addBreadcrumb,
    getErrorStats,
    clearErrors: () => errorMonitoring.clearErrors(),
    exportErrors: () => errorMonitoring.exportErrors()
  }
}

// Performance monitoring utilities
export const performanceMonitor = {
  // Measure function execution time
  measureAsync: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now()
    addBreadcrumb(`Starting ${name}`, 'info')
    
    try {
      const result = await fn()
      const duration = performance.now() - start
      addBreadcrumb(`Completed ${name} in ${duration.toFixed(2)}ms`, 'info', { duration })
      return result
    } catch (error) {
      const duration = performance.now() - start
      addBreadcrumb(`Failed ${name} after ${duration.toFixed(2)}ms`, 'error', { duration, error })
      throw error
    }
  },

  // Measure synchronous function execution time
  measure: <T>(name: string, fn: () => T): T => {
    const start = performance.now()
    addBreadcrumb(`Starting ${name}`, 'info')
    
    try {
      const result = fn()
      const duration = performance.now() - start
      addBreadcrumb(`Completed ${name} in ${duration.toFixed(2)}ms`, 'info', { duration })
      return result
    } catch (error) {
      const duration = performance.now() - start
      addBreadcrumb(`Failed ${name} after ${duration.toFixed(2)}ms`, 'error', { duration, error })
      throw error
    }
  }
}