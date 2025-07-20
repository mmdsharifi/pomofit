"use client";

import { useState, useMemo, useEffect } from "react";
import { format, isToday, isYesterday, addDays, subDays } from "date-fns";
import {
  CalendarIcon,
  BarChart2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  getHistoryByDate,
  getTaskCompletionsByDate,
} from "@/lib/history-utils";
import { useTasks } from "@/lib/task-context";
import { useTimer } from "@/lib/timer-context";
import SessionList from "@/components/session-list";
import ProductivityInsights from "@/components/productivity-insights";

export default function HistoryClient() {
  const { tasks } = useTasks();
  const { settings } = useTimer();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<string>("day");
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true after component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get sessions and completions for the selected date
  const sessions = useMemo(() => {
    if (!isClient) return [];
    try {
      const result = getHistoryByDate(selectedDate);
      return result;
    } catch (error) {
      console.error("HistoryClient: Error getting sessions:", error);
      return [];
    }
  }, [selectedDate, isClient]);

  const completions = useMemo(() => {
    if (!isClient) return [];
    try {
      const result = getTaskCompletionsByDate(selectedDate);
      return result;
    } catch (error) {
      console.error("HistoryClient: Error getting completions:", error);
      return [];
    }
  }, [selectedDate, isClient]);

  // Format date for display
  const formatDateForDisplay = (date: Date) => {
    try {
      if (isToday(date)) return "Today";
      if (isYesterday(date)) return "Yesterday";
      return format(date, "MMMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown Date";
    }
  };

  // Format time for display
  const formatTimeForDisplay = (date: Date) => {
    try {
      return format(date, "h:mm a");
    } catch (error) {
      console.error("Error formatting time:", error);
      return "--:--";
    }
  };

  // Format duration for display
  const formatDurationForDisplay = (seconds: number) => {
    try {
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) {
        return `${minutes} min`;
      }
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } catch (error) {
      console.error("Error formatting duration:", error);
      return "0 min";
    }
  };

  // Get task name from note
  const getTaskNameFromNote = (note: string) => {
    if (!note) return null;
    try {
      // Check if the note is a task reference
      if (note.startsWith("task:")) {
        const taskId = note.substring(5);
        const task = tasks.find((t) => t.id === taskId);
        return task ? task.title : null;
      }
      return note;
    } catch (error) {
      console.error("Error getting task name:", error);
      return null;
    }
  };

  // Navigation functions
  const goToPreviousDay = () => {
    try {
      setSelectedDate(subDays(selectedDate, 1));
    } catch (error) {
      console.error("Error navigating to previous day:", error);
    }
  };

  const goToNextDay = () => {
    try {
      const nextDay = addDays(selectedDate, 1);
      if (nextDay <= new Date()) {
        setSelectedDate(nextDay);
      }
    } catch (error) {
      console.error("Error navigating to next day:", error);
    }
  };

  const goToToday = () => {
    try {
      setSelectedDate(new Date());
    } catch (error) {
      console.error("Error navigating to today:", error);
    }
  };

  // Calculate total focus time for the selected date
  const totalFocusTime = useMemo(() => {
    try {
      const focusTime = sessions
        .filter((session) => session.mode === "pomodoro")
        .reduce((total, session) => total + session.duration, 0);
      return focusTime;
    } catch (error) {
      console.error("Error calculating total focus time:", error);
      return 0;
    }
  }, [sessions]);

  // Calculate total pomodoros for the selected date
  const totalPomodoros = useMemo(() => {
    try {
      const pomodoroCount = sessions.filter(
        (session) => session.mode === "pomodoro"
      ).length;
      return pomodoroCount;
    } catch (error) {
      console.error("Error calculating total pomodoros:", error);
      return 0;
    }
  }, [sessions]);

  // Calculate total completed tasks for the selected date
  const totalCompletedTasks = useMemo(() => {
    try {
      const taskCount = completions.length;
      return taskCount;
    } catch (error) {
      console.error("Error calculating total completed tasks:", error);
      return 0;
    }
  }, [completions]);

  // Get dates with sessions for highlighting in the calendar
  const datesWithSessions = useMemo(() => {
    if (!isClient) return [];
    try {
      const allSessions = getHistoryByDate(new Date(0)); // Get all sessions by passing a very old date
      const dates = new Set<string>();

      allSessions.forEach((session) => {
        const date = new Date(session.startTime);
        dates.add(format(date, "yyyy-MM-dd"));
      });

      return Array.from(dates).map((dateStr) => new Date(dateStr));
    } catch (error) {
      console.error("Error getting dates with sessions:", error);
      return [];
    }
  }, [isClient]);

  // If not client-side yet, show a loading state
  if (!isClient) {
    return (
      <div className="container max-w-4xl mx-auto py-6 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">History</h1>
          <div className="w-full sm:w-auto">
            <div className="h-10 bg-muted rounded-md animate-pulse"></div>
          </div>
        </div>
        <div className="h-[600px] bg-muted rounded-md animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">History</h1>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full sm:w-auto"
        >
          <TabsList>
            <TabsTrigger value="day">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Daily View
            </TabsTrigger>
            <TabsTrigger value="insights">
              <BarChart2 className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "day" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousDay}
                  aria-label="Previous day"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateForDisplay(selectedDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      disabled={(date) => date > new Date()}
                      modifiers={{
                        hasSessions: datesWithSessions,
                      }}
                      modifiersStyles={{
                        hasSessions: {
                          fontWeight: "bold",
                          backgroundColor: "hsl(var(--primary) / 0.1)",
                        },
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextDay}
                  disabled={isToday(selectedDate)}
                  aria-label="Next day"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
              <Card className="border border-border">
                <CardContent className="p-2 text-center">
                  <p className="text-xs text-muted-foreground">Focus Time</p>
                  <p className="text-lg font-bold">
                    {formatDurationForDisplay(totalFocusTime)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-border">
                <CardContent className="p-2 text-center">
                  <p className="text-xs text-muted-foreground">Pomodoros</p>
                  <p className="text-lg font-bold">
                    {totalPomodoros}/{settings.pomodoroGoal}
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-border">
                <CardContent className="p-2 text-center">
                  <p className="text-xs text-muted-foreground">Tasks Done</p>
                  <p className="text-lg font-bold">{totalCompletedTasks}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <SessionList
            sessions={sessions}
            completions={completions}
            getTaskName={getTaskNameFromNote}
            formatTime={formatTimeForDisplay}
            formatDuration={formatDurationForDisplay}
          />
        </div>
      )}

      {activeTab === "insights" && <ProductivityInsights />}
    </div>
  );
}
