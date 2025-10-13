// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTiming(key: string): void {
    this.metrics.set(key, performance.now());
  }

  endTiming(key: string): number {
    const startTime = this.metrics.get(key);
    if (!startTime) {
      console.warn(`No start time found for key: ${key}`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.metrics.delete(key);
    
    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${key} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  measureAsync<T>(key: string, fn: () => Promise<T>): Promise<T> {
    this.startTiming(key);
    return fn().finally(() => {
      this.endTiming(key);
    });
  }

  measure<T>(key: string, fn: () => T): T {
    this.startTiming(key);
    const result = fn();
    this.endTiming(key);
    return result;
  }
}

// Global performance monitor instance
export const perfMonitor = PerformanceMonitor.getInstance();

// React hook for measuring component render times
export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now();
  
  return {
    endTiming: () => {
      const duration = performance.now() - startTime;
      if (duration > 100) {
        console.warn(`Slow render detected: ${componentName} took ${duration.toFixed(2)}ms`);
      }
    }
  };
}

// Utility to measure page load times
export function measurePageLoad(pageName: string) {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      console.log(`Page ${pageName} loaded in ${loadTime.toFixed(2)}ms`);
    });
  }
}
