'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { createLazyComponent, webVitals, usePerformanceMonitor } from '@/utils/performance'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: string
  className?: string
}

// Optimized loading spinner component
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'text-primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  return (
    <div className={`animate-spin ${sizeClasses[size]} ${color} ${className}`}>
      <svg 
        className="w-full h-full" 
        fill="none" 
        viewBox="0 0 24 24"
        role="img"
        aria-label="Loading"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
}

interface SkeletonProps {
  className?: string
  lines?: number
  height?: string
  animated?: boolean
}

// Skeleton loading component
export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '',
  lines = 1,
  height = 'h-4',
  animated = true
}) => {
  const skeletonClass = `bg-gray-200 rounded ${height} ${animated ? 'animate-pulse' : ''} ${className}`
  
  if (lines === 1) {
    return <div className={skeletonClass} />
  }
  
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={skeletonClass} />
      ))}
    </div>
  )
}

interface ProductCardSkeletonProps {
  count?: number
}

// Product card skeleton for better UX
export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-4">
          <Skeleton height="h-48" className="w-full" />
          <div className="space-y-2">
            <Skeleton height="h-4" className="w-3/4" />
            <Skeleton height="h-4" className="w-1/2" />
            <div className="flex justify-between items-center">
              <Skeleton height="h-6" className="w-1/4" />
              <Skeleton height="h-8" className="w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
}

// Optimized lazy loading image component
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  onLoad,
  onError
}) => {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [imageSrc, setImageSrc] = useState(priority ? src : '')

  useEffect(() => {
    if (!priority && src) {
      const img = new Image()
      img.onload = () => {
        setImageSrc(src)
        setLoaded(true)
        onLoad?.()
      }
      img.onerror = () => {
        setError(true)
        onError?.()
      }
      img.src = src
    } else if (priority) {
      setLoaded(true)
    }
  }, [src, priority, onLoad, onError])

  if (error) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <svg 
          className="w-8 h-8 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      )}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          onLoad={() => {
            setLoaded(true)
            onLoad?.()
          }}
          onError={() => {
            setError(true)
            onError?.()
          }}
        />
      )}
    </div>
  )
}

interface OptimizedSuspenseProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  errorFallback?: React.ReactNode
}

// Optimized Suspense wrapper with error boundaries
export const OptimizedSuspense: React.FC<OptimizedSuspenseProps> = ({
  children,
  fallback = <LoadingSpinner size="lg" className="mx-auto" />,
  errorFallback = <div className="text-center text-red-500">Something went wrong</div>
}) => {
  return (
    <Suspense fallback={fallback}>
      <ErrorBoundary fallback={errorFallback}>
        {children}
      </ErrorBoundary>
    </Suspense>
  )
}

// Error boundary component
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

interface PerformanceMonitorProps {
  enabled?: boolean
  onMetricsUpdate?: (metrics: any) => void
}

// Performance monitoring component
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  enabled = process.env.NODE_ENV === 'development',
  onMetricsUpdate
}) => {
  const [metrics, setMetrics] = useState<any>(null)
  const performanceData = usePerformanceMonitor()

  useEffect(() => {
    if (!enabled) return

    const measureMetrics = () => {
      const newMetrics = {
        ...performanceData,
        cls: webVitals.measureCLS(),
        lcp: webVitals.measureLCP(),
        fid: webVitals.measureFID(),
        timestamp: Date.now()
      }
      
      setMetrics(newMetrics)
      onMetricsUpdate?.(newMetrics)
    }

    // Measure metrics after page load
    const timer = setTimeout(measureMetrics, 1000)
    
    // Measure on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        measureMetrics()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, performanceData, onMetricsUpdate])

  if (!enabled || !metrics) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50">
      <div>CLS: {metrics.cls?.toFixed(3)}</div>
      <div>LCP: {metrics.lcp?.toFixed(0)}ms</div>
      <div>FID: {metrics.fid?.toFixed(0)}ms</div>
      <div>DOM: {metrics.domContentLoaded?.toFixed(0)}ms</div>
      <div>Resources: {metrics.totalResources}</div>
      {metrics.memoryUsage && (
        <div>Memory: {(metrics.memoryUsage.used / 1024 / 1024).toFixed(1)}MB</div>
      )}
    </div>
  )
}

interface IntersectionObserverProps {
  children: React.ReactNode
  onIntersect?: () => void
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

// Intersection Observer wrapper for lazy loading
export const IntersectionObserver: React.FC<IntersectionObserverProps> = ({
  children,
  onIntersect,
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true
}) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || (triggerOnce && hasTriggered)) return

    const observer = new window.IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting
        setIsIntersecting(isIntersecting)
        
        if (isIntersecting && !hasTriggered) {
          onIntersect?.()
          if (triggerOnce) {
            setHasTriggered(true)
          }
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [onIntersect, threshold, rootMargin, triggerOnce, hasTriggered])

  return (
    <div ref={ref}>
      {children}
    </div>
  )
}

// Export performance monitoring hook
export { usePerformanceMonitor }

// Lazy loaded components factory
export const LazyComponents = {
  AdminDashboard: createLazyComponent(
    () => import('@/app/admin/page'),
    () => <Skeleton lines={5} height="h-8" />
  ),
  ProductManagement: createLazyComponent(
    () => import('@/app/admin/products/page'),
    () => <ProductCardSkeleton count={6} />
  ),
  OrderManagement: createLazyComponent(
    () => import('@/app/admin/orders/page'),
    () => <Skeleton lines={8} height="h-6" />
  ),
  UserProfile: createLazyComponent(
    () => import('@/app/profile/page'),
    () => <Skeleton lines={6} height="h-6" />
  ),
  ProductDetail: createLazyComponent(
    () => import('@/app/products/[id]/page'),
    () => (
      <div className="grid md:grid-cols-2 gap-8">
        <Skeleton height="h-96" />
        <div className="space-y-4">
          <Skeleton height="h-8" />
          <Skeleton lines={3} height="h-4" />
          <Skeleton height="h-12" />
        </div>
      </div>
    )
  )
}