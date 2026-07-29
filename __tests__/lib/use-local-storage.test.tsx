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

  test("synchronizes state across multiple hook instances using the same key in the same tab", () => {
    const { result: hook1 } = renderHook(() => useLocalStorage("sync-key", "initial"));
    const { result: hook2 } = renderHook(() => useLocalStorage("sync-key", "initial"));

    act(() => {
      hook1.current[1]("updated-value");
      jest.advanceTimersByTime(100);
    });

    expect(hook1.current[0]).toBe("updated-value");
    expect(hook2.current[0]).toBe("updated-value");
  });

  test("handles storage events from another tab", () => {
    const { result } = renderHook(() => useLocalStorage("tab-key", "initial"));

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "tab-key",
          newValue: JSON.stringify("external-value"),
        })
      );
    });

    expect(result.current[0]).toBe("external-value");
  });

  test("gracefully handles invalid JSON from storage events", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useLocalStorage("corrupt-key", "initial"));

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "corrupt-key",
          newValue: "{invalid-json",
        })
      );
    });

    expect(result.current[0]).toBe("initial");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error parsing storage change for corrupt-key:"),
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  test("gracefully handles localStorage.getItem throwing an error", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const getItemSpy = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError: Access is denied");
    });

    const { result } = renderHook(() => useLocalStorage("error-key", "default-val"));

    expect(result.current[0]).toBe("default-val");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error reading error-key from localStorage:",
      expect.any(Error)
    );

    getItemSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  test("gracefully handles localStorage.setItem quota error during debounced write", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useLocalStorage("quota-key", "val"));

    const setItemSpy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    act(() => {
      result.current[1]("new-val");
    });

    // Advance timer to trigger debounced write
    act(() => {
      jest.advanceTimersByTime(100);
    });

    setItemSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  test("gracefully handles error when flushing write on unmount", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { result, unmount } = renderHook(() => useLocalStorage("unmount-err-key", "start"));

    act(() => {
      result.current[1]("end");
    });

    const setItemSpy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Unmount flush error");
    });

    unmount();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error flushing unmount-err-key on unmount:",
      expect.any(Error)
    );

    setItemSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  test("gracefully handles error when setValue callback throws", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useLocalStorage("err-cb-key", "start"));

    act(() => {
      result.current[1](() => {
        throw new Error("Callback error");
      });
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error setting err-cb-key in localStorage:",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
