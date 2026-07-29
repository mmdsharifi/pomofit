import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "../../lib/use-local-storage";

describe("useLocalStorage Hook", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("initializes with initial value when localStorage is empty", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "initial"));
    expect(result.current[0]).toBe("initial");
  });

  test("initializes from localStorage if item exists", () => {
    localStorage.setItem("test-key", JSON.stringify("stored-val"));
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    expect(result.current[0]).toBe("stored-val");
  });

  test("handles rapid updater function calls without stale closures (BUG-02)", () => {
    const { result } = renderHook(() => useLocalStorage("count-key", 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
      result.current[1]((prev) => prev + 1);
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(3);

    // Fast-forward debounce timer
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(localStorage.getItem("count-key")).toBe("3");
  });

  test("flushes pending debounced write on unmount (BUG-03)", () => {
    const { result, unmount } = renderHook(() => useLocalStorage("unmount-key", "start"));

    act(() => {
      result.current[1]("new-value");
    });

    // Before timer fires and before unmount, localStorage hasn't updated yet due to debounce
    expect(localStorage.getItem("unmount-key")).toBeNull();

    // Unmount before 100ms debounce timer finishes
    unmount();

    // The cleanup effect should flush the pending write immediately
    expect(localStorage.getItem("unmount-key")).toBe(JSON.stringify("new-value"));
  });
});
