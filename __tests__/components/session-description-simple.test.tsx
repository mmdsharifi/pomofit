import { render, screen } from "@testing-library/react";
import SessionDetailsModal from "@/components/session-details-modal";

// Mock session data
const mockSession = {
  id: "1",
  startTime: new Date("2024-01-15T10:00:00Z"),
  duration: 1500,
  mode: "pomodoro" as const,
  note: "This is a test session description with details about what was accomplished.",
  tags: ["test", "session"],
  taskId: "1",
  taskTitle: "Test Task",
};

describe("Session Description Display", () => {
  it("should display session description in modal", () => {
    render(
      <SessionDetailsModal
        session={mockSession}
        isOpen={true}
        onClose={() => {}}
        formatTime={(date) => date.toLocaleTimeString()}
        formatDuration={(seconds) => `${Math.floor(seconds / 60)} min`}
      />
    );

    // Check that the description is displayed
    expect(
      screen.getByText(
        "This is a test session description with details about what was accomplished."
      )
    ).toBeInTheDocument();

    // Check that the Notes section is present
    expect(screen.getByText("Notes")).toBeInTheDocument();
  });

  it("should not display notes section when session has no description", () => {
    const sessionWithoutNote = {
      ...mockSession,
      note: "",
    };

    render(
      <SessionDetailsModal
        session={sessionWithoutNote}
        isOpen={true}
        onClose={() => {}}
        formatTime={(date) => date.toLocaleTimeString()}
        formatDuration={(seconds) => `${Math.floor(seconds / 60)} min`}
      />
    );

    // Notes section should not be displayed
    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
  });

  it("should display session title and details correctly", () => {
    render(
      <SessionDetailsModal
        session={mockSession}
        isOpen={true}
        onClose={() => {}}
        formatTime={(date) => date.toLocaleTimeString()}
        formatDuration={(seconds) => `${Math.floor(seconds / 60)} min`}
      />
    );

    // Check session details
    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.getByText("25 min")).toBeInTheDocument();
    expect(screen.getByText("Focus Session")).toBeInTheDocument();
  });
});
