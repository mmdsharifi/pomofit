import "@testing-library/jest-dom";
import { render, screen, fireEvent, act } from "../../test/test-utils";
import React from "react";
import { useState } from "react";
import { JournalEditor } from "@/components/journal/journal-editor";
import type { JournalEntry } from "@/app/journal/journal-client";

describe("Journal Integration", () => {
  function JournalTestWrapper() {
    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(
      null
    );
    const [selectedDate, setSelectedDate] = useState(new Date("2024-01-01"));

    const handleSave = (entry: Partial<JournalEntry>) => {
      if (entry.id) {
        setJournals((prev) =>
          prev.map((j) =>
            j.id === entry.id ? ({ ...j, ...entry } as JournalEntry) : j
          )
        );
        setSelectedEntry((prev) =>
          prev && prev.id === entry.id
            ? ({ ...prev, ...entry } as JournalEntry)
            : prev
        );
      } else {
        const newEntry: JournalEntry = {
          id: Math.random().toString(),
          title: entry.title || "",
          content: entry.content || "",
          date: entry.date || "2024-01-01",
          createdAt: new Date(),
          updatedAt: new Date(),
          type: "custom",
        };
        setJournals((prev) => [...prev, newEntry]);
        setSelectedEntry(newEntry);
      }
    };

    const handleDelete = (id: string) => {
      setJournals((prev) => prev.filter((j) => j.id !== id));
      setSelectedEntry(null);
    };

    return (
      <div>
        <button onClick={() => setSelectedEntry(null)}>New Journal</button>
        <ul data-testid="journal-list">
          {journals.map((j) => (
            <li key={j.id}>
              <button onClick={() => setSelectedEntry(j)}>
                {j.title || "Untitled"}
              </button>
              <button onClick={() => handleDelete(j.id)}>Delete</button>
            </li>
          ))}
        </ul>
        <JournalEditor
          selectedDate={selectedDate}
          selectedEntry={selectedEntry}
          onSave={handleSave}
        />
      </div>
    );
  }

  it("can create, list, select, edit, and delete journal entries", () => {
    jest.useFakeTimers();
    render(<JournalTestWrapper />);

    // Create a new journal
    fireEvent.click(screen.getByText("New Journal"));
    fireEvent.change(screen.getByPlaceholderText("Journal title..."), {
      target: { value: "First Journal" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Start writing your thoughts..."),
      { target: { value: "Hello world" } }
    );
    act(() => {
      jest.advanceTimersByTime(700);
    });
    // Should appear in the list
    expect(screen.getByText("First Journal")).toBeInTheDocument();

    // Select the journal
    fireEvent.click(screen.getByText("First Journal"));
    expect(screen.getByDisplayValue("First Journal")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Hello world")).toBeInTheDocument();

    // Edit the journal
    fireEvent.change(screen.getByPlaceholderText("Journal title..."), {
      target: { value: "Updated Journal" },
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    expect(screen.getByDisplayValue("Updated Journal")).toBeInTheDocument();
    expect(screen.getByText("Updated Journal")).toBeInTheDocument();

    // Delete the journal
    fireEvent.click(screen.getByText("Delete"));
    expect(screen.queryByText("Updated Journal")).not.toBeInTheDocument();
    jest.useRealTimers();
  });
});
