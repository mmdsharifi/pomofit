import { renderHook, act } from "@testing-library/react"
import { useTimer } from "@/hooks/use-timer"

// Mock the success sound
jest.mock("@/lib/utils", () => ({
  ...jest.requireActual("@/lib/utils"),
  playSound: jest.fn(),
}))

describe("useTimer Hook", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test("initializes with default values", () => {
    const { result } = renderHook(() => useTimer())

    expect(result.current.isActive).toBe(false)
    expect(result.current.isPaused).toBe(false)
    expect(result.current.timeRemaining).toBe(25 * 60) // 25 minutes in seconds
    expect(result.current.timerType).toBe("pomodoro")
  })

  test("starts the timer correctly", () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.startTimer()
    })

    expect(result.current.isActive).toBe(true)
    expect(result.current.isPaused).toBe(false)
  })

  test("pauses the timer correctly", () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.startTimer()
      result.current.pauseTimer()
    })

    expect(result.current.isActive).toBe(true)
    expect(result.current.isPaused).toBe(true)
  })

  test("resumes the timer correctly", () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.startTimer()
      result.current.pauseTimer()
      result.current.resumeTimer()
    })

    expect(result.current.isActive).toBe(true)
    expect(result.current.isPaused).toBe(false)
  })

  test("resets the timer correctly", () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.startTimer()
      // Advance timer by 5 seconds
      jest.advanceTimersByTime(5000)
      result.current.resetTimer()
    })

    expect(result.current.isActive).toBe(false)
    expect(result.current.isPaused).toBe(false)
    expect(result.current.timeRemaining).toBe(25 * 60)
  })

  test("changes timer type correctly", () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.changeTimerType("shortBreak")
    })

    expect(result.current.timerType).toBe("shortBreak")
    expect(result.current.timeRemaining).toBe(5 * 60) // 5 minutes in seconds

    act(() => {
      result.current.changeTimerType("longBreak")
    })

    expect(result.current.timerType).toBe("longBreak")
    expect(result.current.timeRemaining).toBe(15 * 60) // 15 minutes in seconds
  })

  test("decrements time correctly", () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.startTimer()
    })

    // Advance timer by 1 second
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(result.current.timeRemaining).toBe(25 * 60 - 1)
  })

  test("completes timer cycle correctly", () => {
    const playSound = require("@/lib/utils").playSound
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.startTimer()
    })

    // Fast-forward to almost the end of the timer
    act(() => {
      jest.advanceTimersByTime((25 * 60 - 1) * 1000)
    })

    expect(result.current.timeRemaining).toBe(1)

    // Complete the timer
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(playSound).toHaveBeenCalled()
    expect(result.current.isActive).toBe(false)
  })
})
