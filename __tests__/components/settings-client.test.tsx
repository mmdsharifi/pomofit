import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import SettingsClient from "../../app/settings/settings-client";
import { AuthProvider } from "../../lib/auth-context";
import { TaskProvider } from "../../lib/task-context";
import { TimerProvider } from "../../lib/timer-context";
import { ThemeProvider } from "../../lib/theme-context";

// Mock matchMedia for ThemeProvider
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock framer-motion for synchronous unmounting in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    path: (props: any) => <path {...props} />,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock resize observer for lottie player or sliders
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock audio
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  currentTime: 0,
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ThemeProvider>
      <TaskProvider>
        <TimerProvider>{children}</TimerProvider>
      </TaskProvider>
    </ThemeProvider>
  </AuthProvider>
);

describe("SettingsClient Auto-Save & Interactive Guardrails", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("renders auto-save status indicator instead of manual save button", async () => {
    render(<SettingsClient />, { wrapper: Wrapper });

    // The manual "Save Settings" button should not exist
    expect(screen.queryByRole("button", { name: /save all settings/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Save Settings")).not.toBeInTheDocument();

    // Auto-save status indicator should be present
    expect(await screen.findByText(/all changes saved/i)).toBeInTheDocument();
  });

  test("automatically hides 'All changes saved' badge after 5 seconds", async () => {
    jest.useFakeTimers();
    render(<SettingsClient />, { wrapper: Wrapper });

    expect(screen.getByText(/all changes saved/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.queryByText(/all changes saved/i)).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  test("prevents unchecking the last selected workout source", async () => {
    // Set settings where only Lottie is enabled
    localStorage.setItem(
      "pomofit-settings",
      JSON.stringify({
        pomodoroTime: 25,
        shortBreakTime: 5,
        longBreakTime: 15,
        pomodoroGoal: 8,
        workoutGifs: ["pushups"],
        workoutSources: { lottie: true, fiton: false },
        fitonWorkouts: [],
        devModeFastTimers: false,
      })
    );

    render(<SettingsClient />, { wrapper: Wrapper });

    // Switch to Movement tab
    const movementTab = screen.getByRole("button", { name: /movement/i });
    fireEvent.click(movementTab);

    // Try to uncheck Lottie workouts (the only enabled source)
    const lottieCheckbox = screen.getByRole("checkbox", { name: /lottie workouts/i });
    fireEvent.click(lottieCheckbox);

    // Should remain checked because it's the last active source
    expect(lottieCheckbox).toBeChecked();
  });

  test("prevents unchecking the last selected Lottie workout", async () => {
    localStorage.setItem(
      "pomofit-settings",
      JSON.stringify({
        pomodoroTime: 25,
        shortBreakTime: 5,
        longBreakTime: 15,
        pomodoroGoal: 8,
        workoutGifs: ["pushups"],
        workoutSources: { lottie: true, fiton: false },
        fitonWorkouts: [],
        devModeFastTimers: false,
      })
    );

    render(<SettingsClient />, { wrapper: Wrapper });

    // Switch to Movement tab
    const movementTab = screen.getByRole("button", { name: /movement/i });
    fireEvent.click(movementTab);

    // Attempt to click the Push-ups workout card to unselect it
    const pushupsText = screen.getByText("Push-ups");
    const pushupsCard = pushupsText.closest("div");
    if (pushupsCard) {
      fireEvent.click(pushupsCard);
    }

    // Settings in localStorage should still keep pushups
    const settings = JSON.parse(localStorage.getItem("pomofit-settings") || "{}");
    expect(settings.workoutGifs).toContain("pushups");
  });
});
