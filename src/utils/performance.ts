/**
 * Performance utilities for lazy loading, optimization, and monitoring
 */

import { lazy, ComponentType } from 'react'
import dynamic from 'next/dynamic'

// Lazy loading wrapper with loading component
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
) => {
  return dynamic(importFn, {
    loading: fallback || (() => <div className="animate-pulse bg-gray-200 h-32 rounded"></div>),
    ssr: false
  })
}

// Image lazy loading optimization
export const optimizeImageLoading = {
  // Preload critical images
  preloadImage: (src: string) => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = src
      document.head.appendChild(link)
    }
  },

  // Lazy load images with intersection observer
  lazyLoadImage: (img: HTMLImageElement, src: string) => {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLImageElement
            target.src = src
            target.classList.remove('opacity-0')
            target.classList.add('opacity-100', 'transition-opacity', 'duration-300')
            imageObserver.unobserve(target)
          }
        })
      })
      img.classList.add('opacity-0')
      imageObserver.observe(img)
    } else {
      // Fallback for browsers without IntersectionObserver
      img.src = src
    }
  }
}

// Bundle optimization utilities
export const bundleOptimization = {
  // Dynamic import with error handling
  dynamicImport: async <T>(importFn: () => Promise<T>): Promise<T | null> => {
    try {
      return await importFn()
    } catch (error) {
      console.error('Dynamic import failed:', error)
      return null
    }
  },

  // Preload next page
  preloadRoute: (route: string) => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = route
      document.head.appendChild(link)
    }
  }
}

// Web Vitals monitoring
export const webVitals = {
  // Core Web Vitals measurement
  measureCLS: () => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      let clsValue = 0
      let clsEntries: PerformanceEntry[] = []

      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            const firstSessionEntry = clsEntries[0]
            const lastSessionEntry = clsEntries[clsEntries.length - 1]

            if (!firstSessionEntry || 
                entry.startTime - lastSessionEntry.startTime < 1000 ||
                entry.startTime - firstSessionEntry.startTime < 5000) {
              clsEntries.push(entry)
              clsValue += (entry as any).value
            } else {
              clsEntries = [entry]
              clsValue = (entry as any).value
            }
          }
        }
      })

      observer.observe({ type: 'layout-shift', buffered: true })
      return clsValue
    }
    return 0
  },

  // Largest Contentful Paint
  measureLCP: () => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      let lcpValue = 0

      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        lcpValue = lastEntry.renderTime || lastEntry.loadTime
      })

      observer.observe({ type: 'largest-contentful-paint', buffered: true })
      return lcpValue
    }
    return 0
  },

  // First Input Delay
  measureFID: () => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      let fidValue = 0

      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          fidValue = (entry as any).processingStart - entry.startTime
        }
      })

      observer.observe({ type: 'first-input', buffered: true })
      return fidValue
    }
    return 0
  }
}

// Memory optimization
export const memoryOptimization = {
  // Cleanup function for components
  cleanup: (cleanupFunctions: (() => void)[]) => {
    return () => {
      cleanupFunctions.forEach(fn => {
        try {
          fn()
        } catch (error) {
          console.error('Cleanup function failed:', error)
        }
      })
    }
  },

  // Debounce function for performance
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  },

  // Throttle function for scroll/resize events
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }
}

// Resource loading optimization
export const resourceOptimization = {
  // Critical CSS injection
  injectCriticalCSS: (css: string) => {
    if (typeof window !== 'undefined') {
      const style = document.createElement('style')
      style.textContent = css
      document.head.appendChild(style)
    }
  },

  // Font loading optimization
  preloadFont: (fontUrl: string, fontDisplay = 'swap') => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'font'
      link.type = 'font/woff2'
      link.href = fontUrl
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)

      // Add font-display: swap
      const style = document.createElement('style')
      style.textContent = `
        @font-face {
          font-display: ${fontDisplay};
        }
      `
      document.head.appendChild(style)
    }
  },

  // Service Worker registration for caching
  registerServiceWorker: async () => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered:', registration)
        return registration
      } catch (error) {
        console.error('Service Worker registration failed:', error)
        return null
      }
    }
    return null
  }
}

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  if (typeof window !== 'undefined') {
    // Monitor navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    const metrics = {
      // Page load metrics
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      
      // Network metrics
      dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpConnect: navigation.connectEnd - navigation.connectStart,
      serverResponse: navigation.responseEnd - navigation.requestStart,
      
      // Rendering metrics
      domProcessing: navigation.domComplete - navigation.domLoading,
      
      // Resource metrics
      totalResources: performance.getEntriesByType('resource').length,
      
      // Memory usage (if available)
      ...(('memory' in performance) && {
        memoryUsage: {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit
        }
      })
    }
    
    return metrics
  }
  
  return null
}

export default {
  createLazyComponent,
  optimizeImageLoading,
  bundleOptimization,
  webVitals,
  memoryOptimization,
  resourceOptimization,
  usePerformanceMonitor
}