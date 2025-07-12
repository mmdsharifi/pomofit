"use client"

import { useState, useEffect } from "react"
import { JournalCalendar } from "@/components/journal/journal-calendar"
import { JournalEditor } from "@/components/journal/journal-editor"
import { JournalChat } from "@/components/journal/journal-chat"
import { JournalHistory } from "@/components/journal/journal-history"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export interface JournalEntry {
  id: string
  title: string
  content: string
  date: string
  createdAt: Date
  updatedAt: Date
  type: "daily" | "custom"
}

export default function JournalClient() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [journals, setJournals] = useState<JournalEntry[]>([])

  // Load journals from localStorage
  useEffect(() => {
    const savedJournals = localStorage.getItem("pomofit-journals")
    if (savedJournals) {
      try {
        const parsed = JSON.parse(savedJournals)
        setJournals(
          parsed.map((j: any) => ({
            ...j,
            createdAt: new Date(j.createdAt),
            updatedAt: new Date(j.updatedAt),
          })),
        )
      } catch (error) {
        console.error("Error loading journals:", error)
      }
    }
  }, [])

  // Save journals to localStorage
  const saveJournals = (updatedJournals: JournalEntry[]) => {
    setJournals(updatedJournals)
    localStorage.setItem("pomofit-journals", JSON.stringify(updatedJournals))
  }

  // Get journal for specific date
  const getJournalForDate = (date: Date): JournalEntry | null => {
    const dateStr = date.toISOString().split("T")[0]
    return journals.find((j) => j.date === dateStr && j.type === "daily") || null
  }

  // Create or update journal entry
  const saveJournalEntry = (entry: Partial<JournalEntry>) => {
    const now = new Date()

    if (entry.id) {
      // Update existing entry
      const updatedJournals = journals.map((j) =>
        j.id === entry.id ? ({ ...j, ...entry, updatedAt: now } as JournalEntry) : j,
      )
      saveJournals(updatedJournals)
    } else {
      // Create new entry
      const newEntry: JournalEntry = {
        id: crypto.randomUUID(),
        title: entry.title || "",
        content: entry.content || "",
        date: entry.date || selectedDate.toISOString().split("T")[0],
        type: entry.type || "daily",
        createdAt: now,
        updatedAt: now,
      }
      saveJournals([...journals, newEntry])
    }
  }

  // Delete journal entry
  const deleteJournalEntry = (id: string) => {
    const updatedJournals = journals.filter((j) => j.id !== id)
    saveJournals(updatedJournals)
    if (selectedEntry?.id === id) {
      setSelectedEntry(null)
    }
  }

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    const entry = getJournalForDate(date)
    setSelectedEntry(entry)
  }

  // Handle entry selection from history
  const handleEntrySelect = (entry: JournalEntry) => {
    setSelectedEntry(entry)
    if (entry.type === "daily") {
      setSelectedDate(new Date(entry.date))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pomofit
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Journal</h1>
        </div>
      </div>

      {/* Main Layout */}
      <div className="h-[calc(100vh-120px)]">
        <div className="grid grid-cols-12 gap-0 h-full divide-x divide-border">
          {/* Left Column - Calendar & History */}
          <div className="col-span-3 space-y-6 pr-4">
            <JournalCalendar selectedDate={selectedDate} onDateSelect={handleDateSelect} journals={journals} />
            <JournalHistory
              journals={journals.filter((j) => j.type === "custom")}
              onEntrySelect={handleEntrySelect}
              onEntryDelete={deleteJournalEntry}
              selectedEntry={selectedEntry}
            />
          </div>

          {/* Middle Column - Journal Editor */}
          <div className="col-span-6 px-4">
            <JournalEditor selectedDate={selectedDate} selectedEntry={selectedEntry} onSave={saveJournalEntry} />
          </div>

          {/* Right Column - AI Chat */}
          <div className="col-span-3 pl-4">
            <JournalChat
              journals={journals}
              onAddTasks={(tasks) => {
                // This will be implemented to add tasks to the main task list
                console.log("Adding tasks:", tasks)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
