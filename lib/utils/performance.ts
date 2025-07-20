/**
 * Performance utilities for monitoring and optimization
 */

// Performance monitoring utilities
class PerformanceMonitor {
  private localStorageAccessCount = 0;
  private consoleLogCount = 0;
  private lastResetTime = Date.now();
  private readonly RESET_INTERVAL = 60000; // 1 minute

  incrementLocalStorageAccess() {
    this.localStorageAccessCount++;
    this.checkThresholds();
  }

  incrementConsoleLog() {
    this.consoleLogCount++;
    this.checkThresholds();
  }

  private checkThresholds() {
    const now = Date.now();

    // Reset counters every minute
    if (now - this.lastResetTime > this.RESET_INTERVAL) {
      this.resetCounters();
      this.lastResetTime = now;
      return;
    }

    // Warn if too many localStorage accesses in a minute
    if (this.localStorageAccessCount > 100) {
      console.warn(
        `Performance: ${this.localStorageAccessCount} localStorage accesses in the last minute. Consider implementing caching.`
      );
    }

    // Warn if too many console logs in a minute
    if (this.consoleLogCount > 50) {
      console.warn(
        `Performance: ${this.consoleLogCount} console logs in the last minute. Consider reducing debug output.`
      );
    }
  }

  private resetCounters() {
    this.localStorageAccessCount = 0;
    this.consoleLogCount = 0;
  }

  getStats() {
    return {
      localStorageAccessCount: this.localStorageAccessCount,
      consoleLogCount: this.consoleLogCount,
      timeSinceLastReset: Date.now() - this.lastResetTime,
    };
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

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Wrapper for localStorage access with monitoring
export const monitoredLocalStorage = {
  getItem: (key: string) => {
    performanceMonitor.incrementLocalStorageAccess();
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    performanceMonitor.incrementLocalStorageAccess();
    return localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    performanceMonitor.incrementLocalStorageAccess();
    return localStorage.removeItem(key);
  },
};

// Wrapper for console.log with monitoring
export const monitoredConsole = {
  log: (...args: any[]) => {
    performanceMonitor.incrementConsoleLog();
    console.log(...args);
  },
  warn: (...args: any[]) => {
    performanceMonitor.incrementConsoleLog();
    console.warn(...args);
  },
  error: (...args: any[]) => {
    performanceMonitor.incrementConsoleLog();
    console.error(...args);
  },
};
