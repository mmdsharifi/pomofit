import { renderHook, act } from "@testing-library/react";
import { useDebounce, useThrottle } from "@/lib/hooks/use-debounce";

describe("useDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should debounce value changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 1000),
      { initialProps: { value: "initial" } }
    );

    // Initial value should be returned immediately
    expect(result.current).toBe("initial");

    // Change the value
    rerender({ value: "changed" });

    // Value should not change immediately
    expect(result.current).toBe("initial");

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Value should now be updated
    expect(result.current).toBe("changed");
  });

  it("should handle multiple rapid changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 1000),
      { initialProps: { value: "initial" } }
    );

    // Make multiple rapid changes
    rerender({ value: "change1" });
    rerender({ value: "change2" });
    rerender({ value: "change3" });

    // Value should still be initial
    expect(result.current).toBe("initial");

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should have the last value
    expect(result.current).toBe("change3");
  });

  it("should reset timer on new changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 1000),
      { initialProps: { value: "initial" } }
    );

    // Change value
    rerender({ value: "change1" });

    // Wait half the delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Value should still be initial
    expect(result.current).toBe("initial");

    // Change again
    rerender({ value: "change2" });

    // Wait half the delay again
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Value should still be initial
    expect(result.current).toBe("initial");

    // Wait the full delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now should have the last value
    expect(result.current).toBe("change2");
  });
});

describe("useThrottle", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should throttle value changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 1000),
      { initialProps: { value: "initial" } }
    );

    // Initial value should be returned immediately
    expect(result.current).toBe("initial");

    // Change the value
    rerender({ value: "changed" });

    // Value should change immediately (throttle allows first change)
    expect(result.current).toBe("changed");

    // Change again quickly
    rerender({ value: "changed2" });

    // Value should not change (throttled)
    expect(result.current).toBe("changed");

    // Wait for throttle period
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Now should update
    expect(result.current).toBe("changed2");
  });

  it("should handle multiple changes within throttle period", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 1000),
      { initialProps: { value: "initial" } }
    );

    // Make multiple changes
    rerender({ value: "change1" });
    rerender({ value: "change2" });
    rerender({ value: "change3" });

    // Should have the first change
    expect(result.current).toBe("change1");

    // Wait for throttle period
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should have the last change
    expect(result.current).toBe("change3");
  });

  it("should allow changes after throttle period", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 1000),
      { initialProps: { value: "initial" } }
    );

    // First change
    rerender({ value: "change1" });
    expect(result.current).toBe("change1");

    // Wait for throttle period
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Second change should work
    rerender({ value: "change2" });
    expect(result.current).toBe("change2");
  });
});
