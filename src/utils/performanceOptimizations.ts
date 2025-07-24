// Performance optimization utilities

// Debounce function for performance-critical events
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for scroll events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  return new IntersectionObserver(callback, defaultOptions);
};

// Preload critical resources
export const preloadCriticalResources = () => {
  // Preload critical CSS
  const criticalCSS = document.createElement('link');
  criticalCSS.rel = 'preload';
  criticalCSS.as = 'style';
  criticalCSS.href = '/static/css/main.css';
  document.head.appendChild(criticalCSS);

  // Preload critical JavaScript
  const criticalJS = document.createElement('link');
  criticalJS.rel = 'preload';
  criticalJS.as = 'script';
  criticalJS.href = '/static/js/main.js';
  document.head.appendChild(criticalJS);
};

// Optimize images with WebP support detection
export const getOptimizedImageSrc = (src: string): string => {
  const supportsWebP = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  })();

  if (supportsWebP && (src.includes('.jpg') || src.includes('.png'))) {
    return src.replace(/\.(jpg|png)$/, '.webp');
  }
  
  return src;
};

// Memory management for large components
export const cleanupComponent = (componentName: string) => {
  console.log(`🧹 Cleaning up ${componentName} component`);

  // Note: In modern browsers, this cleanup is handled automatically
  // This is kept for legacy support and explicit cleanup
  if (typeof window !== 'undefined') {
    console.log(`Component ${componentName} cleanup completed`);
  }
};

// Bundle size analyzer (development only)
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    console.group('📦 Bundle Analysis');
    
    // Analyze loaded scripts
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    scripts.forEach((script: any) => {
      console.log(`Script: ${script.src}`);
    });
    
    // Analyze loaded stylesheets
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    stylesheets.forEach((link: any) => {
      console.log(`Stylesheet: ${link.href}`);
    });
    
    console.groupEnd();
  }
};

// Performance monitoring
export const monitorPerformance = () => {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        console.group('⚡ Performance Metrics');
        console.log(`DNS Lookup: ${(perfData.domainLookupEnd - perfData.domainLookupStart).toFixed(2)}ms`);
        console.log(`TCP Connection: ${(perfData.connectEnd - perfData.connectStart).toFixed(2)}ms`);
        console.log(`Request: ${(perfData.responseStart - perfData.requestStart).toFixed(2)}ms`);
        console.log(`Response: ${(perfData.responseEnd - perfData.responseStart).toFixed(2)}ms`);
        console.log(`DOM Processing: ${(perfData.domContentLoadedEventEnd - perfData.responseEnd).toFixed(2)}ms`);
        console.log(`Load Complete: ${(perfData.loadEventEnd - perfData.loadEventStart).toFixed(2)}ms`);
        console.log(`Total Load Time: ${(perfData.loadEventEnd - perfData.fetchStart).toFixed(2)}ms`);
        console.groupEnd();
      }, 1000);
    });
  }
};

// Initialize performance optimizations
export const initializePerformanceOptimizations = () => {
  // Preload critical resources
  preloadCriticalResources();
  
  // Monitor performance
  monitorPerformance();
  
  // Analyze bundle size in development
  analyzeBundleSize();
  
  console.log('🚀 Performance optimizations initialized');
};
