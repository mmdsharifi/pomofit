import { renderHook, act } from "@testing-library/react";
import {
  useDailyRefresh,
  saveTasks,
  getTasks,
} from "@/hooks/use-daily-refresh";
import {
  isPomodoroActive,
  isRestSessionActive,
  refreshAppData,
} from "@/lib/session";

// Mock session-related functions
jest.mock("@/lib/session", () => ({
  isPomodoroActive: jest.fn(),
  isRestSessionActive: jest.fn(),
  refreshAppData: jest.fn().mockResolvedValue(undefined),
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

describe("useDailyRefresh", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-12-29T12:00:00"));
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should schedule refresh at midnight when no sessions are active", async () => {
    (isPomodoroActive as jest.Mock).mockReturnValue(false);
    (isRestSessionActive as jest.Mock).mockReturnValue(false);

    renderHook(() => useDailyRefresh());

    // Fast-forward to just before midnight
    act(() => {
      jest.advanceTimersByTime(11 * 60 * 60 * 1000); // 11 hours
    });

    expect(refreshAppData).not.toHaveBeenCalled();

    // Fast-forward past midnight
    await act(async () => {
      jest.advanceTimersByTime(2 * 60 * 60 * 1000); // 2 more hours
    });

    expect(refreshAppData).toHaveBeenCalled();
  });

  it("should wait for sessions to complete before refreshing", async () => {
    (isPomodoroActive as jest.Mock).mockReturnValue(true);
    (isRestSessionActive as jest.Mock).mockReturnValue(false);

    renderHook(() => useDailyRefresh());

    // Fast-forward past midnight
    act(() => {
      jest.advanceTimersByTime(13 * 60 * 60 * 1000);
    });

    // Shouldn't refresh yet because pomodoro is active
    expect(refreshAppData).not.toHaveBeenCalled();

    // Complete pomodoro
    (isPomodoroActive as jest.Mock).mockReturnValue(false);

    // Fast-forward check interval (5 minutes)
    await act(async () => {
      jest.advanceTimersByTime(5 * 60 * 1000);
    });

    // Now it should refresh
    expect(refreshAppData).toHaveBeenCalled();
  });

  it("should persist tasks during refresh", async () => {
    const mockTasks = [{ id: "1", title: "Test Task", completed: false }];

    // Set initial tasks in localStorage
    saveTasks(mockTasks);

    (isPomodoroActive as jest.Mock).mockReturnValue(false);
    (isRestSessionActive as jest.Mock).mockReturnValue(false);
    (refreshAppData as jest.Mock).mockResolvedValue(undefined);

    renderHook(() => useDailyRefresh());

    // Fast-forward to trigger refresh
    await act(async () => {
      jest.advanceTimersByTime(24 * 60 * 60 * 1000);
    });

    // Verify tasks were saved and restored
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "pomofit-tasks",
      JSON.stringify(mockTasks)
    );

    // Verify refresh was called
    expect(refreshAppData).toHaveBeenCalled();
  });

  it("should handle empty tasks gracefully", async () => {
    (isPomodoroActive as jest.Mock).mockReturnValue(false);
    (isRestSessionActive as jest.Mock).mockReturnValue(false);
    (refreshAppData as jest.Mock).mockResolvedValue(undefined);

    renderHook(() => useDailyRefresh());

    // Fast-forward to trigger refresh
    await act(async () => {
      jest.advanceTimersByTime(24 * 60 * 60 * 1000);
    });

    // Should not try to save empty tasks
    expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith(
      "pomofit-tasks",
      expect.anything()
    );
    expect(refreshAppData).toHaveBeenCalled();
  });
});
