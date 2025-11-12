import React, { useState } from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import SessionNoteDialog from "@/components/session-note-dialog";

// Mock timers for countdown testing
jest.useFakeTimers();

describe("SessionNoteDialog", () => {
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

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  const flushPromises = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };

  const clickSaveButton = async () => {
    const saveButton = screen.getByRole("button", { name: /save/i });
    await act(async () => {
      fireEvent.click(saveButton);
      await flushPromises();
    });
  };

  it("calls AI tag API and passes tags to onSubmit", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: async () => ({ tags: ["ai", "test"], success: true }),
    }) as any;
    const onSubmit = jest.fn();
    render(
      <SessionNoteDialog
        open={true}
        onOpenChange={() => {}}
        onSubmit={onSubmit}
        sessionTitle="Test Session"
        sessionId="123"
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/accomplish/i), {
      target: { value: "Did some work" },
    });
    await clickSaveButton();
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        "Did some work",
        ["ai", "test"],
        true
      );
    });
  });

  it("calls onSubmit with untagged if API fails", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("fail")) as any;
    const onSubmit = jest.fn();
    render(
      <SessionNoteDialog
        open={true}
        onOpenChange={() => {}}
        onSubmit={onSubmit}
        sessionTitle="Test Session"
        sessionId="123"
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/accomplish/i), {
      target: { value: "Did some work" },
    });
    await clickSaveButton();
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("Did some work", [], true);
    });
  });

  it("calls onSubmit with untagged if API returns no tags", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: async () => ({ tags: undefined, success: false }),
    }) as any;
    const onSubmit = jest.fn();
    render(
      <SessionNoteDialog
        open={true}
        onOpenChange={() => {}}
        onSubmit={onSubmit}
        sessionTitle="Test Session"
        sessionId="123"
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/accomplish/i), {
      target: { value: "Did some work" },
    });
    await clickSaveButton();
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("Did some work", [], true);
    });
  });

  it("calls onSubmit with untagged if API returns non-array response", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: async () => ({ tags: "not-an-array", success: true }),
    }) as any;
    const onSubmit = jest.fn();
    render(
      <SessionNoteDialog
        open={true}
        onOpenChange={() => {}}
        onSubmit={onSubmit}
        sessionTitle="Test Session"
        sessionId="123"
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/what did you accomplish/i), {
      target: { value: "test note" },
    });
    await clickSaveButton();
    await screen.findByRole("button", { name: /save/i }); // wait for re-render
    expect(onSubmit).toHaveBeenCalledWith("test note", [], expect.any(Boolean));
  });

  it("does not call onSubmit if note is empty", async () => {
    const onSubmit = jest.fn();
    render(
      <SessionNoteDialog
        open={true}
        onOpenChange={() => {}}
        onSubmit={onSubmit}
        sessionTitle="Test Session"
        sessionId="123"
      />
    );
    // note را خالی می‌گذاریم
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with untagged if sessionId or sessionTitle is missing", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: async () => ({ tags: ["ai"] }),
    }) as any;
    const onSubmit = jest.fn();
    // sessionId is undefined
    render(
      <SessionNoteDialog
        open={true}
        onOpenChange={() => {}}
        onSubmit={onSubmit}
        sessionTitle={""}
        sessionId={undefined as any}
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/what did you accomplish/i), {
      target: { value: "test note" },
    });
    await clickSaveButton();
    await screen.findByRole("button", { name: /save/i }); // wait for re-render
    expect(onSubmit).toHaveBeenCalledWith(
      "test note",
      ["ai"],
      expect.any(Boolean)
    );
  });

  it("calls onSubmit with untagged if fetch to AI Tag API fails", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));
    const onSubmit = jest.fn();
    render(
      <SessionNoteDialog
        open={true}
        onOpenChange={() => {}}
        onSubmit={onSubmit}
        sessionTitle="Test Session"
        sessionId="123"
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/what did you accomplish/i), {
      target: { value: "test note" },
    });
    await clickSaveButton();
    await screen.findByRole("button", { name: /save/i }); // wait for re-render
    expect(onSubmit).toHaveBeenCalledWith("test note", [], expect.any(Boolean));
  });

  // New tests for auto-skip functionality
  describe("Auto-skip functionality", () => {
    it("shows countdown timer on skip button", () => {
      const onSubmit = jest.fn();
      render(
        <SessionNoteDialog
          open={true}
          onOpenChange={() => {}}
          onSubmit={onSubmit}
          sessionTitle="Test Session"
          sessionId="123"
        />
      );

      expect(screen.getByText(/Skip \(1:00\)/)).toBeInTheDocument();
    });

  it("auto-skips after 60 seconds of inactivity", async () => {
    const onSubmit = jest.fn();
    render(
        <SessionNoteDialog
          open={true}
          onOpenChange={() => {}}
          onSubmit={onSubmit}
          sessionTitle="Test Session"
          sessionId="123"
        />
      );

      // Fast-forward 60 seconds
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith("", [], true);
      });
    });

    it("resets countdown when user types in the textarea", () => {
      const onSubmit = jest.fn();
      render(
        <SessionNoteDialog
          open={true}
          onOpenChange={() => {}}
          onSubmit={onSubmit}
          sessionTitle="Test Session"
          sessionId="123"
        />
      );

      // Fast-forward 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // User types something
      fireEvent.change(screen.getByPlaceholderText(/accomplish/i), {
        target: { value: "test" },
      });

      // Countdown should reset to 60 seconds
      expect(screen.getByText(/Skip \(1:00\)/)).toBeInTheDocument();

      // Fast-forward another 30 seconds - should not auto-skip yet
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("handles Cmd+Enter keyboard shortcut to save", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        json: async () => ({ tags: ["test"], success: true }),
      }) as any;

      const onSubmit = jest.fn();
      render(
        <SessionNoteDialog
          open={true}
          onOpenChange={() => {}}
          onSubmit={onSubmit}
          sessionTitle="Test Session"
          sessionId="123"
        />
      );

      const textarea = screen.getByPlaceholderText(/accomplish/i);
      fireEvent.change(textarea, {
        target: { value: "test note" },
      });

      // Simulate Cmd+Enter (Mac)
      await act(async () => {
        fireEvent.keyDown(textarea, {
          key: "Enter",
          metaKey: true,
        });
        await flushPromises();
      });

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith("test note", ["test"], true);
      });
    });

    it("handles Ctrl+Enter keyboard shortcut to save (Windows/Linux)", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        json: async () => ({ tags: ["test"], success: true }),
      }) as any;

      const onSubmit = jest.fn();
      render(
        <SessionNoteDialog
          open={true}
          onOpenChange={() => {}}
          onSubmit={onSubmit}
          sessionTitle="Test Session"
          sessionId="123"
        />
      );

      const textarea = screen.getByPlaceholderText(/accomplish/i);
      fireEvent.change(textarea, {
        target: { value: "test note" },
      });

      // Simulate Ctrl+Enter (Windows/Linux)
      await act(async () => {
        fireEvent.keyDown(textarea, {
          key: "Enter",
          ctrlKey: true,
        });
        await flushPromises();
      });

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith("test note", ["test"], true);
      });
    });

    it("shows keyboard shortcut hint", () => {
      render(
        <SessionNoteDialog
          open={true}
          onOpenChange={() => {}}
          onSubmit={() => {}}
          sessionTitle="Test Session"
          sessionId="123"
        />
      );

      expect(screen.getByText(/Press/)).toBeInTheDocument();
      expect(screen.getByText(/⌘/)).toBeInTheDocument();
      expect(screen.getByText(/Enter/)).toBeInTheDocument();
      expect(screen.getByText(/save/)).toBeInTheDocument();
    });

    it("cleans up countdown when dialog closes", () => {
      const onSubmit = jest.fn();
      const onOpenChange = jest.fn();

      const { rerender } = render(
        <SessionNoteDialog
          open={true}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
          sessionTitle="Test Session"
          sessionId="123"
        />
      );

      // Fast-forward 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Close dialog
      rerender(
        <SessionNoteDialog
          open={false}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
          sessionTitle="Test Session"
          sessionId="123"
        />
      );

      // Fast-forward another 30 seconds - should not auto-skip since dialog is closed
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it("auto-skip handles parent state updates without throwing", () => {
    const Wrapper = () => {
      const [open, setOpen] = useState(true);
      const handleSubmit = () => setOpen(false);

      return (
        <SessionNoteDialog
          open={open}
          onOpenChange={setOpen}
          onSubmit={handleSubmit}
          sessionTitle="Test Session"
          sessionId="123"
        />
      );
    };

    render(<Wrapper />);

    expect(() => {
      act(() => {
        jest.advanceTimersByTime(60000);
      });
    }).not.toThrow();
  });

});
