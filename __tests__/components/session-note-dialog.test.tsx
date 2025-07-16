import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SessionNoteDialog from "@/components/session-note-dialog";

describe("SessionNoteDialog", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

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
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
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
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
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
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
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
    fireEvent.click(screen.getByText(/save/i));
    await screen.findByText(/save/i); // wait for re-render
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
    fireEvent.click(screen.getByText(/save/i));
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
    fireEvent.click(screen.getByText(/save/i));
    await screen.findByText(/save/i); // wait for re-render
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
    fireEvent.click(screen.getByText(/save/i));
    await screen.findByText(/save/i); // wait for re-render
    expect(onSubmit).toHaveBeenCalledWith("test note", [], expect.any(Boolean));
  });
});
