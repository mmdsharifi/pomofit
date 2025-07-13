import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "../../test/test-utils";
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
      settings: { workoutGifs: ["pushups"] },
    } as any);
    render(<WorkoutDisplay isActive={true} mode="pomodoro" />);
    expect(screen.getByText(/Push-ups/i)).toBeInTheDocument();
    expect(screen.getByText(/Great for chest/i)).toBeInTheDocument();
    expect(screen.getByTestId("lottie-player")).toBeInTheDocument();
  });

  it("shows fallback if Lottie error occurs", () => {
    // Directly set lottieError to true by mocking useState
    jest
      .spyOn(React, "useState")
      .mockImplementationOnce(() => ["pushups", jest.fn()])
      .mockImplementationOnce(() => [true, jest.fn()]);
    render(<WorkoutDisplay isActive={true} mode="pomodoro" />);
    expect(screen.getByText(/Animation unavailable/i)).toBeInTheDocument();
  });

  it("shows break time message when not active", () => {
    render(<WorkoutDisplay isActive={false} mode="pomodoro" />);
    expect(screen.getByText(/Break Time Workout/i)).toBeInTheDocument();
  });
});
