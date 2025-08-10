import { useCallback } from 'react'

/**
 * Performance monitoring hook for ADFD Tracking System
 * Provides utilities for tracking page load times and user interactions
 */
export const usePerformance = () => {
  
  // Log performance metrics
  const logPerformanceMetrics = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0]
        
        if (navigation) {
          const metrics = {
            pageLoadTime: Math.round(navigation.loadEventEnd - navigation.fetchStart),
            domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
            firstContentfulPaint: 0,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
          }

          // Get First Contentful Paint if available
          const paintEntries = performance.getEntriesByType('paint')
          const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
          if (fcpEntry) {
            metrics.firstContentfulPaint = Math.round(fcpEntry.startTime)
          }

          // Performance metrics collected (could be sent to analytics)
          
          // In production, you could send these metrics to an analytics service
          // analytics.track('page_performance', metrics)
        }
      }
    } catch (error) {
      console.warn('Performance monitoring error:', error)
    }
  }, [])

  // Track user interactions
  const trackInteraction = useCallback((action, details = {}) => {
    try {
      const _interactionData = {
        action,
        details,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }

      // User interaction tracked (could be sent to analytics)
      
      // In production, send to analytics
      // analytics.track('user_interaction', interactionData)
    } catch (error) {
      console.warn('Interaction tracking error:', error)
    }
  }, [])

  // Measure function execution time
  const measureExecutionTime = useCallback((fn) => {
    return async (...args) => {
      const startTime = performance.now()
      try {
        const result = await fn(...args)
        const endTime = performance.now()
        const _executionTime = Math.round(endTime - startTime)
        
        // Execution time measured (could be sent to analytics)
        
        return result
      } catch (error) {
        const endTime = performance.now()
        const _executionTime = Math.round(endTime - startTime)
        
        // Function execution failed (could be sent to error tracking)
        throw error
      }
    }
  }, [])

  return {
    logPerformanceMetrics,
    trackInteraction,
    measureExecutionTime
  }
}

/**
 * Preload a resource for better performance
 * @param {string} href - Resource URL to preload
 * @param {string} as - Resource type (script, style, image, document, etc.)
 */
export const preloadResource = (href, as = 'script') => {
  try {
    if (typeof document !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = href
      link.as = as
      document.head.appendChild(link)
      
      console.log(`🚀 Preloading resource: ${href} as ${as}`)
    }
  } catch (error) {
    console.warn('Resource preload error:', error)
  }
}
