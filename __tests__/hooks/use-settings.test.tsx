import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useSettingsSync } from "../../lib/settings-sync-service";
import { AuthProvider } from "../../lib/auth-context";
import { useLocalStorage } from "../../lib/use-local-storage";

describe("useSettingsSync Hook API", () => {
  test("provides updateSettings and sync functions", () => {
    const { result } = renderHook(() => useSettingsSync(), {
      wrapper: AuthProvider,
    });
    expect(typeof result.current.updateSettings).toBe("function");
    expect(typeof result.current.syncSettings).toBe("function");
    expect(typeof result.current.fetchSettings).toBe("function");
    expect(typeof result.current.initialSync).toBe("function");
  });

  test("updateSettings can be called without error", () => {
    const { result } = renderHook(() => useSettingsSync(), {
      wrapper: AuthProvider,
    });
    expect(() =>
      result.current.updateSettings({
        pomodoroTime: 25,
        shortBreakTime: 5,
        longBreakTime: 15,
        pomodoroGoal: 8,
        workoutGifs: ["pushups"],
        autoStartBreaks: false,
        autoStartPomodoros: false,
        longBreakInterval: 4,
        alarmSound: "bell",
        alarmVolume: 50,
        darkMode: false,
      })
    ).not.toThrow();
  });
});

describe("useLocalStorage for settings state", () => {
  test("initializes with default settings and updates state", () => {
    const { result } = renderHook(() =>
      useLocalStorage("pomofit-settings", {
        pomodoroTime: 25,
        shortBreakTime: 5,
        longBreakTime: 15,
        pomodoroGoal: 8,
        workoutGifs: ["pushups", "squats"],
        autoStartBreaks: false,
        autoStartPomodoros: false,
        longBreakInterval: 4,
        alarmSound: "bell",
        alarmVolume: 50,
        darkMode: false,
      })
    );
    const [settings, setSettings] = result.current;
    expect(settings.pomodoroTime).toBe(25);
    act(() => {
      setSettings({ ...settings, pomodoroTime: 30 });
    });
    const [updated] = result.current;
    expect(updated.pomodoroTime).toBe(30);
  });
});
