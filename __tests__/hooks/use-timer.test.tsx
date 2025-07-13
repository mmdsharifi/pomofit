import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useTimer } from "../../lib/timer-context";
import { TimerProvider } from "../../lib/timer-context";
import { TaskProvider } from "../../lib/task-context";
import { AuthProvider } from "../../lib/auth-context";

// Mock the success sound
jest.mock("../../lib/utils", () => ({
  ...jest.requireActual("../../lib/utils"),
  playSound: jest.fn(),
}));

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <TaskProvider>
      <TimerProvider>{children}</TimerProvider>
    </TaskProvider>
  </AuthProvider>
);

describe("useTimer Hook", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("initializes with default values", () => {
    const { result } = renderHook(() => useTimer(), { wrapper: AllProviders });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.mode).toBe("pomodoro");
    expect(result.current.timeLeft).toBe(25 * 60); // 25 minutes in seconds
  });

  test("starts the timer correctly", () => {
    const { result } = renderHook(() => useTimer(), { wrapper: AllProviders });

    act(() => {
      result.current.toggleTimer();
    });

    expect(result.current.isRunning).toBe(true);
  });

  test("pauses the timer correctly", () => {
    const { result } = renderHook(() => useTimer(), { wrapper: AllProviders });

    act(() => {
      result.current.toggleTimer(); // start
      result.current.toggleTimer(); // pause
    });

    expect(result.current.isRunning).toBe(false);
  });

  test("resumes the timer correctly", () => {
    const { result } = renderHook(() => useTimer(), { wrapper: AllProviders });

    act(() => {
      result.current.toggleTimer();
      result.current.toggleTimer();
      result.current.toggleTimer();
    });

    expect(result.current.isRunning).toBe(true);
  });

  test("resets the timer correctly", () => {
    const { result } = renderHook(() => useTimer(), { wrapper: AllProviders });

    act(() => {
      result.current.toggleTimer(); // start
      // Advance timer by 5 seconds
      jest.advanceTimersByTime(5000);
      result.current.resetTimer();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.timeLeft).toBe(25 * 60);
  });

  test("changes timer mode correctly", () => {
    const { result } = renderHook(() => useTimer(), { wrapper: AllProviders });

    act(() => {
      result.current.handleModeChange("shortBreak");
    });

    expect(result.current.mode).toBe("shortBreak");
    expect(result.current.timeLeft).toBe(5 * 60); // 5 minutes in seconds

    act(() => {
      result.current.handleModeChange("longBreak");
    });

    expect(result.current.mode).toBe("longBreak");
    expect(result.current.timeLeft).toBe(15 * 60); // 15 minutes in seconds
  });

  test("decrements time correctly", () => {
    const { result } = renderHook(() => useTimer(), { wrapper: AllProviders });

    act(() => {
      result.current.toggleTimer();
    });

    // Advance timer by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.timeLeft).toBe(25 * 60 - 1);
  });

  test("completes timer cycle correctly", () => {
    const playSound = require("../../lib/utils").playSound;
    const { result } = renderHook(() => useTimer(), { wrapper: AllProviders });

    act(() => {
      result.current.toggleTimer();
    });

    // Fast-forward to almost the end of the timer
    act(() => {
      jest.advanceTimersByTime((25 * 60 - 1) * 1000);
    });

    expect(result.current.timeLeft).toBe(1);

    // Complete the timer
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(playSound).toHaveBeenCalled();
    expect(result.current.isRunning).toBe(false);
  });
});
