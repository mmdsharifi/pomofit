"use client";

import { useState, useEffect } from "react";
import { JournalCalendar } from "@/components/journal/journal-calendar";
import { JournalEditor } from "@/components/journal/journal-editor";
import { JournalChat } from "@/components/journal/journal-chat";
import { JournalHistory } from "@/components/journal/journal-history";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { generateId } from "@/lib/generate-id";

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
  type: "daily" | "custom";
}

// Inline hook for mobile or tablet detection (width < 1024px)
function useIsMobileOrTablet() {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsMobileOrTablet(w < 1024);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobileOrTablet;
}

export default function JournalClient() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [journals, setJournals] = useState<JournalEntry[]>([]);

  // Load journals from localStorage
  useEffect(() => {
    const savedJournals = localStorage.getItem("pomofit-journals");
    if (savedJournals) {
      try {
        const parsed = JSON.parse(savedJournals);
        setJournals(
          parsed.map((j: any) => ({
            ...j,
            createdAt: new Date(j.createdAt),
            updatedAt: new Date(j.updatedAt),
          }))
        );
      } catch (error) {
        console.error("Error loading journals:", error);
      }
    }
  }, []);

  // Save journals to localStorage
  const saveJournals = (updatedJournals: JournalEntry[]) => {
    setJournals(updatedJournals);
    localStorage.setItem("pomofit-journals", JSON.stringify(updatedJournals));
  };

  // Get journal for specific date
  const getJournalForDate = (date: Date): JournalEntry | null => {
    const dateStr = date.toISOString().split("T")[0];
    return (
      journals.find((j) => j.date === dateStr && j.type === "daily") || null
    );
  };

  // Create or update journal entry
  const saveJournalEntry = (entry: Partial<JournalEntry>) => {
    const now = new Date();

    if (entry.id) {
      // Update existing entry
      const updatedJournals = journals.map((j) =>
        j.id === entry.id
          ? ({ ...j, ...entry, updatedAt: now } as JournalEntry)
          : j
      );
      saveJournals(updatedJournals);
      // Update selectedEntry to the latest version
      const updated = updatedJournals.find((j) => j.id === entry.id);
      if (updated) setSelectedEntry(updated);
    } else {
      // Create new entry
      const newEntry: JournalEntry = {
        id: generateId(),
        title: entry.title || "",
        content: entry.content || "",
        date: entry.date || selectedDate.toISOString().split("T")[0],
        type: entry.type || "daily",
        createdAt: now,
        updatedAt: now,
      };
      saveJournals([...journals, newEntry]);
    }
  };

  // Create a new custom journal entry with empty title/body and select it
  const handleCreateJournalEntry = () => {
    const now = new Date();
    const newEntry: JournalEntry = {
      id: generateId(),
      title: "",
      content: "",
      date: now.toISOString().split("T")[0],
      type: "custom",
      createdAt: now,
      updatedAt: now,
    };
    setJournals((prev) => [newEntry, ...prev]);
    setSelectedEntry(newEntry);
  };

  // Delete journal entry
  const deleteJournalEntry = (id: string) => {
    const updatedJournals = journals.filter((j) => j.id !== id);
    saveJournals(updatedJournals);
    if (selectedEntry?.id === id) {
      setSelectedEntry(null);
    }
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const entry = getJournalForDate(date);
    setSelectedEntry(entry);
  };

  // Handle entry selection from history
  const handleEntrySelect = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    if (entry.type === "daily") {
      setSelectedDate(new Date(entry.date));
    }
  };

  // Debug logging removed for performance

  useEffect(() => {
    const checkAndUpdateDate = () => {
      const today = new Date();
      const isSameDay =
        selectedDate.getFullYear() === today.getFullYear() &&
        selectedDate.getMonth() === today.getMonth() &&
        selectedDate.getDate() === today.getDate();
      if (!isSameDay) {
        setSelectedDate(today);
        setSelectedEntry(getJournalForDate(today));
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkAndUpdateDate();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    checkAndUpdateDate();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [selectedDate]);

  const isMobileOrTablet = useIsMobileOrTablet();

  if (isMobileOrTablet) {
    return (
      <div className="min-h-screen bg-background">
        <div className="min-h-screen pt-14">
          <Tabs defaultValue="journals" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-2">
              <TabsTrigger value="journals">Journals</TabsTrigger>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="ai">AI</TabsTrigger>
            </TabsList>
            <TabsContent value="journals">
              <div className="space-y-6 pr-2 h-full flex flex-col">
                <div className="flex-1 flex flex-col">
                  <div className="mb-4">
                    <JournalCalendar
                      selectedDate={selectedDate}
                      onDateSelect={handleDateSelect}
                      journals={journals}
                    />
                  </div>
                  <JournalHistory
                    journals={journals.filter((j) => j.type === "custom")}
                    onEntrySelect={handleEntrySelect}
                    onEntryDelete={deleteJournalEntry}
                    selectedEntry={selectedEntry}
                    onCreateJournal={handleCreateJournalEntry}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="editor">
              <JournalEditor
                selectedDate={selectedDate}
                selectedEntry={selectedEntry}
                onSave={saveJournalEntry}
              />
            </TabsContent>
            <TabsContent value="ai">
              <div className="h-full flex flex-col">
                <div className="flex-1 flex flex-col">
                  <JournalChat
                    journals={journals}
                    onAddTasks={(tasks) => {
                      // This will be implemented to add tasks to the main task list
                      console.log("Adding tasks:", tasks);
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Layout */}
      <div className="min-h-screen">
        <div className="grid grid-cols-12 gap-2 min-h-[60vh] sm:min-h-[80vh] md:min-h-screen pt-14">
          {/* Left Column - Calendar & History */}
          <div className="col-span-3 space-y-6 pr-2 h-full flex flex-col">
            <div className="flex-1 flex flex-col">
              <div className="mb-4">
                <JournalCalendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  journals={journals}
                />
              </div>
              <JournalHistory
                journals={journals.filter((j) => j.type === "custom")}
                onEntrySelect={handleEntrySelect}
                onEntryDelete={deleteJournalEntry}
                selectedEntry={selectedEntry}
                onCreateJournal={handleCreateJournalEntry}
              />
            </div>
          </div>

          {/* Middle Column - Journal Editor */}
          <div className="col-span-6 px-2">
            <JournalEditor
              selectedDate={selectedDate}
              selectedEntry={selectedEntry}
              onSave={saveJournalEntry}
            />
          </div>

          {/* Right Column - AI Chat */}
          <div className="col-span-3 pl-2 h-full flex flex-col">
            <div className="flex-1 flex flex-col">
              <JournalChat
                journals={journals}
                onAddTasks={(tasks) => {
                  // This will be implemented to add tasks to the main task list
                  console.log("Adding tasks:", tasks);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
