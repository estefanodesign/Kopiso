'use client'

import * as React from 'react'
import { useEffect } from 'react'
import setupGlobalErrorHandling, { useErrorReporting } from '@/utils/globalErrorSetup'

export const GlobalErrorHandler: React.FC = () => {
  const { addBreadcrumb } = useErrorReporting()

  useEffect(() => {
    // Initialize global error handling system
    setupGlobalErrorHandling({
      enableConsoleLogging: typeof process !== 'undefined' && process.env?.NODE_ENV === 'development',
      enableServerReporting: typeof process !== 'undefined' && process.env?.NODE_ENV === 'production',
      enableUserNotifications: true,
      enablePerformanceMonitoring: true,
      rateLimitNotifications: true,
      maxErrorsInMemory: 100
    })

    // Add initial breadcrumb
    addBreadcrumb('Application initialized', 'info', {
      environment: typeof process !== 'undefined' ? process.env?.NODE_ENV : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date().toISOString()
    })

    // Set up additional browser-specific monitoring
    if (typeof window !== 'undefined') {
      // Monitor page visibility changes
      document.addEventListener('visibilitychange', () => {
        addBreadcrumb(`Page visibility changed to ${document.visibilityState}`, 'info')
      })

      // Monitor focus/blur events
      window.addEventListener('focus', () => {
        addBreadcrumb('Window focused', 'info')
      })

      window.addEventListener('blur', () => {
        addBreadcrumb('Window blurred', 'info')
      })

      // Monitor resize events for responsive issues
      window.addEventListener('resize', () => {
        addBreadcrumb('Window resized', 'info', {
          width: window.innerWidth,
          height: window.innerHeight
        })
      })
    }

    // Cleanup function
    return () => {
      addBreadcrumb('Application cleanup', 'info')
    }
  }, [addBreadcrumb])

  // This component renders nothing - it's just for initialization
  return null
}

export default GlobalErrorHandler