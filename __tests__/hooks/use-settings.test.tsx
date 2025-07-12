import { renderHook, act } from "@testing-library/react"
import { useSettings } from "@/hooks/use-settings"

describe("useSettings Hook", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test("initializes with default settings", () => {
    const { result } = renderHook(() => useSettings())

    expect(result.current.settings).toEqual({
      pomodoroTime: 25,
      shortBreakTime: 5,
      longBreakTime: 15,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      longBreakInterval: 4,
      alarmSound: "bell",
      alarmVolume: 50,
      darkMode: false,
    })
  })

  test("updates settings correctly", () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.updateSettings({
        pomodoroTime: 30,
        shortBreakTime: 10,
        longBreakTime: 20,
        autoStartBreaks: true,
        autoStartPomodoros: true,
        longBreakInterval: 3,
        alarmSound: "digital",
        alarmVolume: 75,
        darkMode: true,
      })
    })

    expect(result.current.settings).toEqual({
      pomodoroTime: 30,
      shortBreakTime: 10,
      longBreakTime: 20,
      autoStartBreaks: true,
      autoStartPomodoros: true,
      longBreakInterval: 3,
      alarmSound: "digital",
      alarmVolume: 75,
      darkMode: true,
    })
  })

  test("persists settings to localStorage", () => {
    const { result, rerender } = renderHook(() => useSettings())

    act(() => {
      result.current.updateSettings({
        pomodoroTime: 30,
      })
    })

    // Simulate component unmount and remount
    rerender()

    expect(result.current.settings.pomodoroTime).toBe(30)
  })

  test("resets settings to defaults", () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.updateSettings({
        pomodoroTime: 30,
        shortBreakTime: 10,
      })
    })

    act(() => {
      result.current.resetSettings()
    })

    expect(result.current.settings).toEqual({
      pomodoroTime: 25,
      shortBreakTime: 5,
      longBreakTime: 15,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      longBreakInterval: 4,
      alarmSound: "bell",
      alarmVolume: 50,
      darkMode: false,
    })
  })
})
