import { renderHook, act } from "@testing-library/react";
import { useDebounce, useThrottle } from "@/lib/hooks/use-debounce";

describe("useDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should debounce function calls", () => {
    const mockFn = jest.fn();
    const { result } = renderHook(() => useDebounce(mockFn, 1000));

    // Call the debounced function multiple times
    act(() => {
      result.current();
      result.current();
      result.current();
    });

    // Function should not be called immediately
    expect(mockFn).not.toHaveBeenCalled();

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Function should be called only once
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("should pass arguments to the debounced function", () => {
    const mockFn = jest.fn();
    const { result } = renderHook(() => useDebounce(mockFn, 1000));

    act(() => {
      result.current("test", 123);
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockFn).toHaveBeenCalledWith("test", 123);
  });

  it("should clear previous timeout when called again", () => {
    const mockFn = jest.fn();
    const { result } = renderHook(() => useDebounce(mockFn, 1000));

    act(() => {
      result.current();
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Call again before timeout
    act(() => {
      result.current();
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Function should not be called yet
    expect(mockFn).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Function should be called only once
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

describe("useThrottle", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should throttle function calls", () => {
    const mockFn = jest.fn();
    const { result } = renderHook(() => useThrottle(mockFn, 1000));

    // Call the throttled function multiple times
    act(() => {
      result.current();
      result.current();
      result.current();
    });

    // Function should be called only once immediately
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Call again
    act(() => {
      result.current();
    });

    // Function should be called again
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("should pass arguments to the throttled function", () => {
    const mockFn = jest.fn();
    const { result } = renderHook(() => useThrottle(mockFn, 1000));

    act(() => {
      result.current("test", 123);
    });

    expect(mockFn).toHaveBeenCalledWith("test", 123);
  });

  it("should not call function if called before throttle period", () => {
    const mockFn = jest.fn();
    const { result } = renderHook(() => useThrottle(mockFn, 1000));

    act(() => {
      result.current();
    });

    expect(mockFn).toHaveBeenCalledTimes(1);

    act(() => {
      result.current();
    });

    // Function should not be called again
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
