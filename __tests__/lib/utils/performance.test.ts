import {
  PerformanceMonitor,
  getMemoryUsage,
  debounce,
  throttle,
  batchUpdater,
} from "@/lib/utils/performance";

describe("PerformanceMonitor", () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = PerformanceMonitor.getInstance();
    monitor.clearMetrics();
  });

  it("should be a singleton", () => {
    const instance1 = PerformanceMonitor.getInstance();
    const instance2 = PerformanceMonitor.getInstance();
    expect(instance1).toBe(instance2);
  });

  it("should measure execution time of synchronous functions", () => {
    const mockFn = jest.fn(() => "result");
    const result = monitor.measureTime("test-sync", mockFn);

    expect(result).toBe("result");
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(monitor.getAverageMetric("test-sync")).toBeGreaterThan(0);
  });

  it("should measure execution time of asynchronous functions", async () => {
    const mockFn = jest.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return "async-result";
    });

    const result = await monitor.measureTimeAsync("test-async", mockFn);

    expect(result).toBe("async-result");
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(monitor.getAverageMetric("test-async")).toBeGreaterThan(0);
  });

  it("should record metrics", () => {
    monitor.recordMetric("test-metric", 100);
    monitor.recordMetric("test-metric", 200);

    expect(monitor.getAverageMetric("test-metric")).toBe(150);
  });

  it("should limit metric history to 100 entries", () => {
    for (let i = 0; i < 150; i++) {
      monitor.recordMetric("test-metric", i);
    }

    const metrics = monitor.getMetrics().get("test-metric");
    expect(metrics).toHaveLength(100);
    expect(metrics![0]).toBe(50); // First entry should be 50 (after trimming)
  });

  it("should notify observers when metrics change", () => {
    const mockObserver = jest.fn();
    const unsubscribe = monitor.subscribe(mockObserver);

    monitor.recordMetric("test-metric", 100);

    expect(mockObserver).toHaveBeenCalledWith(expect.any(Map));
    expect(mockObserver.mock.calls[0][0].get("test-metric")).toEqual([100]);

    unsubscribe();
  });

  it("should clear all metrics", () => {
    monitor.recordMetric("test-metric", 100);
    monitor.clearMetrics();

    expect(monitor.getMetrics().size).toBe(0);
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

describe("BatchUpdater", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should batch updates", () => {
    const mockUpdate1 = jest.fn();
    const mockUpdate2 = jest.fn();
    const mockUpdate3 = jest.fn();

    batchUpdater.schedule(mockUpdate1);
    batchUpdater.schedule(mockUpdate2);
    batchUpdater.schedule(mockUpdate3);

    // Updates should not be called immediately
    expect(mockUpdate1).not.toHaveBeenCalled();
    expect(mockUpdate2).not.toHaveBeenCalled();
    expect(mockUpdate3).not.toHaveBeenCalled();

    // Fast forward to trigger requestAnimationFrame
    jest.runAllTimers();

    // All updates should be called
    expect(mockUpdate1).toHaveBeenCalledTimes(1);
    expect(mockUpdate2).toHaveBeenCalledTimes(1);
    expect(mockUpdate3).toHaveBeenCalledTimes(1);
  });

  it("should only schedule one animation frame for multiple updates", () => {
    const mockRequestAnimationFrame = jest.spyOn(
      window,
      "requestAnimationFrame"
    );

    batchUpdater.schedule(() => {});
    batchUpdater.schedule(() => {});
    batchUpdater.schedule(() => {});

    expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);

    mockRequestAnimationFrame.mockRestore();
  });
});
