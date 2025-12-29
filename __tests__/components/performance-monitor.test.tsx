
import { render } from "@testing-library/react";
import PerformanceMonitor from "@/components/performance-monitor";

// Mock implementation of PerformanceObserver
class MockPerformanceObserver {
  callback: PerformanceObserverCallback;

  constructor(callback: PerformanceObserverCallback) {
    this.callback = callback;
  }

  observe = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn().mockReturnValue([]);
}

// Helper to simulate performance entries
const triggerObserver = (
  ObserverClass: any,
  entries: Partial<PerformanceEntry>[]
) => {
  // Find the observer instance created for the specific entry type
  // This is a bit tricky since we can't easily access the internal instances created inside useEffect
  // For this test, we might need to rely on the fact that we mock the global class
  // and we can capture the callback passed to the constructor.
};

describe("PerformanceMonitor", () => {
  let originalObserver: any;
  let observerInstances: MockPerformanceObserver[] = [];

  beforeAll(() => {
    originalObserver = window.PerformanceObserver;
    // @ts-ignore
    window.PerformanceObserver = class extends MockPerformanceObserver {
      constructor(callback: PerformanceObserverCallback) {
        super(callback);
        observerInstances.push(this);
      }
    };
  });

  afterAll(() => {
    window.PerformanceObserver = originalObserver;
  });

  beforeEach(() => {
    observerInstances = [];
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should observe LCP, FID, CLS, and FCP", () => {
    render(<PerformanceMonitor />);

    // We expect 4 observers to be created
    expect(observerInstances).toHaveLength(4);

    // Verify LCP observer
    expect(observerInstances[0].observe).toHaveBeenCalledWith({
      entryTypes: ["largest-contentful-paint"],
    });

    // Verify FID observer
    expect(observerInstances[1].observe).toHaveBeenCalledWith({
      entryTypes: ["first-input"],
    });

    // Verify CLS observer
    expect(observerInstances[2].observe).toHaveBeenCalledWith({
      entryTypes: ["layout-shift"],
    });

    // Verify FCP observer
    expect(observerInstances[3].observe).toHaveBeenCalledWith({
      entryTypes: ["first-contentful-paint"],
    });
  });

  it("should log LCP metrics correctly", () => {
    render(<PerformanceMonitor />);
    const lcpCallback = observerInstances[0].callback;

    // Simulate LCP entry
    const entries = {
      getEntries: () => [{ startTime: 1200, entryType: "largest-contentful-paint", name: "", toJSON: () => {} }],
    } as unknown as PerformanceObserverEntryList;

    lcpCallback(entries, observerInstances[0]);

    expect(console.log).toHaveBeenCalledWith("LCP:", 1200);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("should warn if LCP is too slow", () => {
    render(<PerformanceMonitor />);
    const lcpCallback = observerInstances[0].callback;

    // Simulate slow LCP entry
    const entries = {
      getEntries: () => [{ startTime: 3000, entryType: "largest-contentful-paint", name: "", toJSON: () => {} }],
    } as unknown as PerformanceObserverEntryList;

    lcpCallback(entries, observerInstances[0]);

    expect(console.log).toHaveBeenCalledWith("LCP:", 3000);
    expect(console.warn).toHaveBeenCalledWith("LCP is too slow:", 3000);
  });

  it("should log FID metrics correctly", () => {
    render(<PerformanceMonitor />);
    const fidCallback = observerInstances[1].callback;

    // Simulate FID entry
    const entries = {
        getEntries: () => [{ 
            startTime: 100, 
            processingStart: 150, 
            entryType: "first-input", 
            name: "", 
            toJSON: () => {} 
        }],
    } as unknown as PerformanceObserverEntryList;

    fidCallback(entries, observerInstances[1]);

    // FID = processingStart - startTime = 150 - 100 = 50
    expect(console.log).toHaveBeenCalledWith("FID:", 50);
  });

  it("should log CLS metrics correctly (ignoring recent input)", () => {
    render(<PerformanceMonitor />);
    const clsCallback = observerInstances[2].callback;

    // Simulate CLS entries
    const entries = {
        getEntries: () => [
            { value: 0.25, hadRecentInput: false },
            { value: 0.2, hadRecentInput: true }, // Should be ignored
            { value: 0.25, hadRecentInput: false }
        ],
    } as unknown as PerformanceObserverEntryList;

    clsCallback(entries, observerInstances[2]);

    // CLS = 0.25 + 0.25 = 0.5
    expect(console.log).toHaveBeenCalledWith("CLS:", 0.5);
  });

  it("should log FCP metrics correctly", () => {
    render(<PerformanceMonitor />);
    const fcpCallback = observerInstances[3].callback;

    // Simulate FCP entry
    const entries = {
      getEntries: () => [{ startTime: 800, entryType: "first-contentful-paint", name: "", toJSON: () => {} }],
    } as unknown as PerformanceObserverEntryList;

    fcpCallback(entries, observerInstances[3]);

    expect(console.log).toHaveBeenCalledWith("FCP:", 800);
  });

  it("should disconnect observers on unmount", () => {
    const { unmount } = render(<PerformanceMonitor />);
    
    unmount();

    observerInstances.forEach(observer => {
        expect(observer.disconnect).toHaveBeenCalled();
    });
  });

  it("should safely handle environments without PerformanceObserver", () => {
    // Save original
    const original = window.PerformanceObserver;
    // Delete PerformanceObserver
    // @ts-ignore
    delete window.PerformanceObserver;

    expect(() => render(<PerformanceMonitor />)).not.toThrow();

    // Restore
    window.PerformanceObserver = original;
  });
});
