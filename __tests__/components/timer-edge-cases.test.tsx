import { render, screen } from "@testing-library/react";
import Timer from "@/components/timer";
import { TimerProvider } from "@/lib/timer-context";
import { AuthProvider } from "@/lib/auth-context";
import { TaskProvider } from "@/lib/task-context";
import { ThemeProvider } from "@/components/theme-provider";
import { TaskListProvider } from "@/components/task-list";

// Mock Audio globally for all tests
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn(),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock window.matchMedia for jsdom
global.window.matchMedia =
  global.window.matchMedia ||
  function () {
    return {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  };

// Mock HTMLCanvasElement.getContext for jsdom
global.HTMLCanvasElement.prototype.getContext = jest.fn();

// Mock LottiePlayer
jest.mock("@lottiefiles/react-lottie-player", () => ({
  Player: () => <div data-testid="lottie-player" />,
}));

function renderWithProviders(children: React.ReactNode) {
  return render(
    <AuthProvider>
      <TaskProvider>
        <ThemeProvider>
          <TaskListProvider>
            <TimerProvider>{children}</TimerProvider>
          </TaskListProvider>
        </ThemeProvider>
      </TaskProvider>
    </AuthProvider>
  );
}

describe("Timer Edge Cases", () => {
  it("should render timer component without crashing", () => {
    renderWithProviders(<Timer />);
    expect(screen.getByTestId("timer-display")).toBeInTheDocument();
  });

  it("should not break if rapidly mounted/unmounted", () => {
    const { unmount, rerender } = renderWithProviders(<Timer />);

    // Re-render the component
    rerender(
      <AuthProvider>
        <TaskProvider>
          <ThemeProvider>
            <TaskListProvider>
              <TimerProvider>
                <Timer />
              </TimerProvider>
            </TaskListProvider>
          </ThemeProvider>
        </TaskProvider>
      </AuthProvider>
    );

    // Unmount
    unmount();

    // If we get here without crashing, the test passes
    expect(true).toBe(true);
  });

  it("should not crash if sound/notification is blocked or muted", () => {
    // Mock Notification API
    window.Notification = {
      requestPermission: jest.fn().mockResolvedValue("denied"),
    } as any;

    renderWithProviders(<Timer />);

    // If we get here without crashing, the test passes
    expect(screen.getByTestId("timer-display")).toBeInTheDocument();
  });
});
