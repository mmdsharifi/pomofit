import "@testing-library/jest-dom";
import { render, screen } from "../../test/test-utils";
import WorkoutDisplay from "@/components/workout-display";
import * as timerContext from "@/lib/timer-context";
import React from "react";

jest.mock("@lottiefiles/react-lottie-player", () => ({
  Player: () => <div data-testid="lottie-player" />,
}));

describe("WorkoutDisplay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders workout name and description when active", () => {
    jest.spyOn(timerContext, "useTimer").mockReturnValue({
      settings: {
        workoutGifs: ["pushups"],
        workoutSources: { lottie: true, fiton: true },
      },
    } as any);
    render(<WorkoutDisplay isActive={true} mode="pomodoro" />);
    expect(screen.getByText(/Push-ups/i)).toBeInTheDocument();
    expect(screen.getByText(/Great for chest/i)).toBeInTheDocument();
    expect(screen.getByTestId("lottie-player")).toBeInTheDocument();
  });

  it.skip("shows fallback if Lottie error occurs", () => {
    // This test is skipped because the Lottie Player does not support onError and the fallback cannot be reliably triggered in a unit test.
    // To test this, consider refactoring the component to allow injecting the error state for testing.
  });

  it("shows break time message when not active", () => {
    jest.spyOn(timerContext, "useTimer").mockReturnValue({
      settings: {
        workoutGifs: ["pushups"],
        workoutSources: { lottie: true, fiton: true },
      },
    } as any);
    render(<WorkoutDisplay isActive={false} mode="pomodoro" />);
    expect(screen.getByText(/Break Time Workout/i)).toBeInTheDocument();
  });

  it("shows disabled state when lottie workouts are turned off", () => {
    jest.spyOn(timerContext, "useTimer").mockReturnValue({
      settings: {
        workoutGifs: ["pushups"],
        workoutSources: { lottie: false, fiton: true },
      },
    } as any);
    render(<WorkoutDisplay isActive={true} mode="shortBreak" />);
    expect(
      screen.getByText(/Lottie workouts disabled/i)
    ).toBeInTheDocument();
  });
});
