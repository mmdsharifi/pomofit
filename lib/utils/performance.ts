/**
 * Performance utilities for monitoring and optimization
 */

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: Set<(metrics: Map<string, number[]>) => void> = new Set();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Measure execution time of a function
   */
  measureTime<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;

    this.recordMetric(name, duration);
    return result;
  }

  /**
   * Measure execution time of an async function
   */
  async measureTimeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    this.recordMetric(name, duration);
    return result;
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);

    // Keep only last 100 measurements
    if (this.metrics.get(name)!.length > 100) {
      this.metrics.get(name)!.shift();
    }

    this.notifyObservers();
  }

  /**
   * Get average metric value
   */
  getAverageMetric(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Get all metrics
   */
  getMetrics(): Map<string, number[]> {
    return new Map(this.metrics);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.notifyObservers();
  }

  /**
   * Subscribe to metric updates
   */
  subscribe(callback: (metrics: Map<string, number[]>) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers(): void {
    this.observers.forEach((callback) => callback(this.getMetrics()));
  }
}

// Memory usage monitoring
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} {
  if ("memory" in performance && (performance as any).memory) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }
  return { used: 0, total: 0, percentage: 0 };
}

// Frame rate monitoring
export class FrameRateMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;
  private isRunning = false;

  start(): void {
    this.isRunning = true;
    this.measureFrameRate();
  }

  stop(): void {
    this.isRunning = false;
  }

  getFPS(): number {
    return this.fps;
  }

  private measureFrameRate(): void {
    if (!this.isRunning) return;

    this.frameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;

    if (deltaTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / deltaTime);
      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    requestAnimationFrame(() => this.measureFrameRate());
  }
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Batch updates utility
export class BatchUpdater {
  private updates: Array<() => void> = [];
  private scheduled = false;

  schedule(update: () => void): void {
    this.updates.push(update);
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => this.flush());
    }
  }

  private flush(): void {
    const updates = this.updates;
    this.updates = [];
    this.scheduled = false;
    updates.forEach((update) => update());
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
export const batchUpdater = new BatchUpdater();
