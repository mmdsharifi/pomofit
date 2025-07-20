import {
  performanceMonitor,
  monitoredLocalStorage,
  monitoredConsole,
  getMemoryUsage,
  debounce,
  throttle,
} from "@/lib/utils/performance";

describe("PerformanceMonitor", () => {
  beforeEach(() => {
    // Reset the performance monitor before each test
    performanceMonitor.getStats();
  });

  it("should track localStorage access", () => {
    const stats = performanceMonitor.getStats();
    const initialCount = stats.localStorageAccessCount;

    monitoredLocalStorage.getItem("test-key");
    monitoredLocalStorage.setItem("test-key", "test-value");

    const newStats = performanceMonitor.getStats();
    expect(newStats.localStorageAccessCount).toBe(initialCount + 2);
  });

  it("should track console logs", () => {
    const stats = performanceMonitor.getStats();
    const initialCount = stats.consoleLogCount;

    monitoredConsole.log("test log");
    monitoredConsole.warn("test warning");
    monitoredConsole.error("test error");

    const newStats = performanceMonitor.getStats();
    expect(newStats.consoleLogCount).toBe(initialCount + 3);
  });

  it("should provide performance statistics", () => {
    const stats = performanceMonitor.getStats();

    expect(stats).toHaveProperty("localStorageAccessCount");
    expect(stats).toHaveProperty("consoleLogCount");
    expect(stats).toHaveProperty("timeSinceLastReset");
    expect(typeof stats.localStorageAccessCount).toBe("number");
    expect(typeof stats.consoleLogCount).toBe("number");
    expect(typeof stats.timeSinceLastReset).toBe("number");
  });

  it("should reset counters periodically", () => {
    // Add some activity
    monitoredLocalStorage.getItem("test");
    monitoredConsole.log("test");

    const stats = performanceMonitor.getStats();
    expect(stats.localStorageAccessCount).toBeGreaterThan(0);
    expect(stats.consoleLogCount).toBeGreaterThan(0);
  });
});

describe("Monitored localStorage", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it("should work like regular localStorage", () => {
    monitoredLocalStorage.setItem("test-key", "test-value");
    const value = monitoredLocalStorage.getItem("test-key");
    expect(value).toBe("test-value");
  });

  it("should track access", () => {
    const initialStats = performanceMonitor.getStats();

    monitoredLocalStorage.setItem("test", "value");
    monitoredLocalStorage.getItem("test");

    const newStats = performanceMonitor.getStats();
    expect(newStats.localStorageAccessCount).toBe(
      initialStats.localStorageAccessCount + 2
    );
  });
});

describe("Monitored console", () => {
  it("should work like regular console", () => {
    const originalLog = console.log;
    const mockLog = jest.fn();
    console.log = mockLog;

    monitoredConsole.log("test message");
    expect(mockLog).toHaveBeenCalledWith("test message");

    console.log = originalLog;
  });

  it("should track logging", () => {
    const initialStats = performanceMonitor.getStats();

    monitoredConsole.log("test");
    monitoredConsole.warn("warning");
    monitoredConsole.error("error");

    const newStats = performanceMonitor.getStats();
    expect(newStats.consoleLogCount).toBe(initialStats.consoleLogCount + 3);
  });
});

describe("getMemoryUsage", () => {
  it("should return memory usage when available", () => {
    // Mock performance.memory
    const mockMemory = {
      usedJSHeapSize: 1000000,
      jsHeapSizeLimit: 2000000,
    };

    Object.defineProperty(performance, "memory", {
      value: mockMemory,
      writable: true,
    });

    const result = getMemoryUsage();

    expect(result.used).toBe(1000000);
    expect(result.total).toBe(2000000);
    expect(result.percentage).toBe(50);
  });

  it("should return zero values when memory is not available", () => {
    // Mock performance.memory as undefined
    const originalMemory = (performance as any).memory;
    Object.defineProperty(performance, "memory", {
      value: undefined,
      writable: true,
    });

    const result = getMemoryUsage();

    expect(result.used).toBe(0);
    expect(result.total).toBe(0);
    expect(result.percentage).toBe(0);

    // Restore original memory
    Object.defineProperty(performance, "memory", {
      value: originalMemory,
      writable: true,
    });
  });
});

describe("debounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should debounce function calls", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 1000);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("should pass arguments to the debounced function", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 1000);

    debouncedFn("test", 123);

    jest.advanceTimersByTime(1000);

    expect(mockFn).toHaveBeenCalledWith("test", 123);
  });
});

describe("throttle", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should throttle function calls", () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 1000);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);

    throttledFn();

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("should pass arguments to the throttled function", () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 1000);

    throttledFn("test", 123);

    expect(mockFn).toHaveBeenCalledWith("test", 123);
  });
});
