import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import SessionNoteDialog from "@/components/session-note-dialog";


// Mock the AI tags API
global.fetch = jest.fn();

describe("Session Description Flow", () => {
  const originalError = console.error;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation((...args) => {
      if (
        typeof args[0] === "string" &&
        args[0].includes("not wrapped in act")
      ) {
        return;
      }
      originalError(...args);
    });
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ tags: ["test", "session"] }),
    });
  });

  const flushPromises = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };

  const clickSaveButton = async () => {
    const saveButton = screen.getByText("Save");
    await act(async () => {
      fireEvent.click(saveButton);
      await flushPromises();
    });
  };

  it("should save session description when note is submitted", async () => {
    const mockOnSubmit = jest.fn();

    render(
      <SessionNoteDialog
        open={true}
        onOpenChange={() => {}}
        onSubmit={mockOnSubmit}
        sessionTitle="Test Session"
        sessionId="1"
      />
    );

    // Find the textarea and enter a description
    const textarea = screen.getByPlaceholderText("What did you accomplish?");
    fireEvent.change(textarea, {
      target: {
        value:
          "Completed the first part of the project. Made good progress on the UI components.",
      },
    });

    // Click the save button
    await clickSaveButton();

    // Wait for the submission to complete
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        "Completed the first part of the project. Made good progress on the UI components.",
        ["test", "session"],
        true
      );
    });
  });

  it("should handle empty description submission", async () => {
    const mockOnSubmit = jest.fn();

    render(
      <SessionNoteDialog
        open={true}
        onOpenChange={() => {}}
        onSubmit={mockOnSubmit}
        sessionTitle="Test Session"
        sessionId="1"
      />
    );

    // Click save without entering any description
    await clickSaveButton();

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith("", ["test", "session"], true);
    });
  });

  it("should skip description when skip button is clicked", async () => {
    const mockOnSubmit = jest.fn();

    render(
      <SessionNoteDialog
        open={true}
        onOpenChange={() => {}}
        onSubmit={mockOnSubmit}
        sessionTitle="Test Session"
        sessionId="1"
      />
    );

    // Click the skip button
    const skipButton = screen.getByText(/Skip/);
    fireEvent.click(skipButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith("", [], true);
    });
  });

  it("should handle keyboard shortcuts for saving", async () => {
    const mockOnSubmit = jest.fn();

    render(
      <SessionNoteDialog
        open={true}
        onOpenChange={() => {}}
        onSubmit={mockOnSubmit}
        sessionTitle="Test Session"
        sessionId="1"
      />
    );

    // Find the textarea and enter a description
    const textarea = screen.getByPlaceholderText("What did you accomplish?");
    fireEvent.change(textarea, {
      target: { value: "Test description with keyboard shortcut" },
    });

    // Simulate Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
    await act(async () => {
      fireEvent.keyDown(textarea, {
        key: "Enter",
        metaKey: true, // Cmd key on Mac
        ctrlKey: false,
      });
      await flushPromises();
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        "Test description with keyboard shortcut",
        ["test", "session"],
        true
      );
    });
  });

  it("should handle auto-start rest toggle", async () => {
    const mockOnSubmit = jest.fn();

    render(
      <SessionNoteDialog
        open={true}
        onOpenChange={() => {}}
        onSubmit={mockOnSubmit}
        sessionTitle="Test Session"
        sessionId="1"
      />
    );

    // Find and toggle the auto-start rest switch
    const autoStartSwitch = screen.getByRole("switch");
    fireEvent.click(autoStartSwitch);

    // Enter a description and save
    const textarea = screen.getByPlaceholderText("What did you accomplish?");
    fireEvent.change(textarea, {
      target: { value: "Test description" },
    });

    await clickSaveButton();

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        "Test description",
        ["test", "session"],
        false // autoStartRest should be false after toggle
      );
    });
  });

  it("should handle API errors gracefully", async () => {
    // Mock API error
    (global.fetch as jest.Mock).mockRejectedValue(new Error("API Error"));

    const mockOnSubmit = jest.fn();

    render(
      <SessionNoteDialog
        open={true}
        onOpenChange={() => {}}
        onSubmit={mockOnSubmit}
        sessionTitle="Test Session"
        sessionId="1"
      />
    );

    // Enter a description and save
    const textarea = screen.getByPlaceholderText("What did you accomplish?");
    fireEvent.change(textarea, {
      target: { value: "Test description with API error" },
    });

    await clickSaveButton();

    // Should still submit with empty tags array when API fails
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        "Test description with API error",
        [],
        true
      );
    });
  });

  it("should handle countdown auto-skip", async () => {
    jest.useFakeTimers();

    const mockOnSubmit = jest.fn();

    render(
      <SessionNoteDialog
        open={true}
        onOpenChange={() => {}}
        onSubmit={mockOnSubmit}
        sessionTitle="Test Session"
        sessionId="1"
      />
    );

    // Fast-forward time to trigger auto-skip
    act(() => {
      jest.advanceTimersByTime(61000); // 61 seconds
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith("", [], true);
    });

    jest.useRealTimers();
  });

  it("should reset countdown when user types", async () => {
    jest.useFakeTimers();

    const mockOnSubmit = jest.fn();

    render(
      <SessionNoteDialog
        open={true}
        onOpenChange={() => {}}
        onSubmit={mockOnSubmit}
        sessionTitle="Test Session"
        sessionId="1"
      />
    );

    // Wait 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // User starts typing
    const textarea = screen.getByPlaceholderText("What did you accomplish?");
    fireEvent.change(textarea, {
      target: { value: "User is typing" },
    });

    // Wait another 30 seconds - should not auto-skip because user typed
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Should not have auto-submitted
    expect(mockOnSubmit).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});
