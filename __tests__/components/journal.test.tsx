import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, act } from "../../test/test-utils";
import { JournalEditor } from "@/components/journal/journal-editor";
import type { JournalEntry } from "@/app/journal/journal-client";

jest.useFakeTimers();

describe("JournalEditor", () => {
  it("renders the journal editor with default title", () => {
    render(
      <JournalEditor
        selectedDate={new Date("2024-01-01")}
        selectedEntry={null}
        onSave={jest.fn()}
      />
    );
    expect(screen.getByPlaceholderText("Journal title...")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Start writing your thoughts...")
    ).toBeInTheDocument();
  });

  it("calls onSave when title or content changes (auto-save)", async () => {
    const onSave = jest.fn();
    render(
      <JournalEditor
        selectedDate={new Date("2024-01-01")}
        selectedEntry={null}
        onSave={onSave}
      />
    );
    const titleInput = screen.getByPlaceholderText("Journal title...");
    const contentInput = screen.getByPlaceholderText(
      "Start writing your thoughts..."
    );
    fireEvent.change(titleInput, { target: { value: "My Title" } });
    fireEvent.change(contentInput, { target: { value: "My Content" } });
    // Wait for debounce
    act(() => {
      jest.advanceTimersByTime(700);
    });
    expect(onSave).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("renders with a selectedEntry and allows editing", () => {
    const entry: JournalEntry = {
      id: "1",
      title: "Old Title",
      content: "Old Content",
      date: "2024-01-01",
      createdAt: new Date(),
      updatedAt: new Date(),
      type: "custom",
    };
    const onSave = jest.fn();
    render(
      <JournalEditor
        selectedDate={new Date("2024-01-01")}
        selectedEntry={entry}
        onSave={onSave}
      />
    );
    expect(screen.getByDisplayValue("Old Title")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Old Content")).toBeInTheDocument();
    // Edit title
    fireEvent.change(screen.getByPlaceholderText("Journal title..."), {
      target: { value: "New Title" },
    });
    // Edit content
    fireEvent.change(
      screen.getByPlaceholderText("Start writing your thoughts..."),
      { target: { value: "New Content" } }
    );
    // Wait for debounce
    act(() => {
      jest.advanceTimersByTime(700);
    });
    expect(onSave).toHaveBeenCalled();
  });
});
// Additional tests for listing, deleting, and date selection would be in integration tests or in the parent component tests, as JournalEditor itself does not handle lists or deletion directly.
