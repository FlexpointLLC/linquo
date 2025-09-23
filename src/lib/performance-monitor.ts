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
      console.warn(`🐌 Slow operation detected: ${key} took ${duration.toFixed(2)}ms`);
    } else if (duration > 500) {
      console.log(`⏱️ Operation: ${key} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  measureAsync<T>(key: string, fn: () => Promise<T>): Promise<T> {
    this.startTiming(key);
    return fn().finally(() => {
      this.endTiming(key);
    });
  }

  measureSync<T>(key: string, fn: () => T): T {
    this.startTiming(key);
    try {
      return fn();
    } finally {
      this.endTiming(key);
    }
  }
}

export const perfMonitor = PerformanceMonitor.getInstance();

// React hook for measuring component render times
export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now();
  
  return {
    endTiming: () => {
      const duration = performance.now() - startTime;
      if (duration > 16) { // More than one frame (60fps)
        console.log(`🎨 ${componentName} render took ${duration.toFixed(2)}ms`);
      }
    }
  };
}
