"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Coffee, Pause, CheckCircle } from "lucide-react";
import type { PomodoroSession, TaskCompletionEvent } from "@/lib/history-utils";

interface SessionListProps {
  sessions: PomodoroSession[];
  completions: TaskCompletionEvent[];
  getTaskName: (note: string) => string | null;
  formatTime: (date: Date) => string;
  formatDuration: (seconds: number) => string;
}

type TimeCategory = {
  name: string;
  emoji: string;
  startHour: number;
  endHour: number;
};

const TIME_CATEGORIES: TimeCategory[] = [
  { name: "Morning", emoji: "🌅", startHour: 0, endHour: 12 },
  { name: "Afternoon", emoji: "☀️", startHour: 12, endHour: 18 },
  { name: "Evening", emoji: "🌙", startHour: 18, endHour: 24 },
];

export default function SessionList({
  sessions,
  completions,
  getTaskName,
  formatTime,
  formatDuration,
}: SessionListProps) {
  // Combine sessions and completions into a single list
  const allEvents = [
    ...sessions.map((session) => ({
      type: "session" as const,
      time: session.startTime,
      data: session,
    })),
    ...completions.map((completion) => ({
      type: "completion" as const,
      time: completion.completedAt,
      data: completion,
    })),
  ].sort((a, b) => a.time.getTime() - b.time.getTime());

  if (allEvents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center">
            No activity recorded for this date.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group events by time category
  const groupedEvents = TIME_CATEGORIES.reduce((acc, category) => {
    const categoryEvents = allEvents.filter((event) => {
      const hour = event.time.getHours();
      return hour >= category.startHour && hour < category.endHour;
    });

    if (categoryEvents.length > 0) {
      acc[category.name] = {
        category,
        events: categoryEvents,
      };
    }

    return acc;
  }, {} as Record<string, { category: TimeCategory; events: typeof allEvents }>);

  const getSessionIcon = (mode: string) => {
    switch (mode) {
      case "pomodoro":
        return <Play className="h-4 w-4" />;
      case "shortBreak":
        return <Coffee className="h-4 w-4" />;
      case "longBreak":
        return <Pause className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getSessionColor = (mode: string) => {
    switch (mode) {
      case "pomodoro":
        return "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300";
      case "shortBreak":
        return "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300";
      case "longBreak":
        return "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300";
      default:
        return "bg-gray-500/10 border-gray-500/20 text-gray-700 dark:text-gray-300";
    }
  };

  const getSessionLabel = (mode: string) => {
    switch (mode) {
      case "pomodoro":
        return "Focus";
      case "shortBreak":
        return "Short Break";
      case "longBreak":
        return "Long Break";
      default:
        return "Session";
    }
  };

  const getSessionTitle = (session: PomodoroSession) => {
    if (session.mode !== "pomodoro") {
      return getSessionLabel(session.mode);
    }

    // First, check if taskTitle is directly available
    if (session.taskTitle) {
      return session.taskTitle;
    }

    // Try to get task name from note using the provided function
    if (session.note) {
      const taskFromNote = getTaskName(session.note);
      if (taskFromNote) {
        return taskFromNote;
      }
    }

    // Check if taskId exists and try to get task name
    if (session.taskId) {
      const taskFromId = getTaskName(session.taskId);
      if (taskFromId) {
        return taskFromId;
      }
    }

    // If note exists and doesn't start with "task:", use it as title
    if (session.note && !session.note.startsWith("task:")) {
      return session.note;
    }

    // Fallback to "Untitled Task"
    return "Untitled Task";
  };

  const getPomodoroCount = (events: typeof allEvents) => {
    return events.filter(
      (event) => event.type === "session" && event.data.mode === "pomodoro"
    ).length;
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedEvents).map(
        ([categoryName, { category, events }]) => (
          <div key={categoryName} className="space-y-3">
            {/* Category Header - Simple row without card */}
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xl">{category.emoji}</span>
                <h3 className="text-lg font-semibold">{category.name}</h3>
              </div>
              <Badge variant="secondary">
                {getPomodoroCount(events)} pomodoros
              </Badge>
            </div>

            {/* Events List */}
            <div className="space-y-3">
              {events.map((event, index) => (
                <Card key={index} className="border border-border/50">
                  <CardContent className="p-4">
                    {event.type === "session" ? (
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-full ${getSessionColor(
                              event.data.mode
                            )}`}
                          >
                            {getSessionIcon(event.data.mode)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">
                              {getSessionTitle(event.data)}
                            </h3>
                            {/* Session description - show note if available */}
                            {event.data.note &&
                              event.data.note !==
                                getSessionTitle(event.data) && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {event.data.note}
                                </p>
                              )}
                          </div>
                        </div>
                        {/* Right side - duration and time */}
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="text-xs">
                            {formatDuration(event.data.duration)}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {formatTime(event.data.startTime)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">
                              {event.data.taskTitle}
                            </h3>
                          </div>
                        </div>
                        {/* Right side - completion badge and time */}
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            variant="outline"
                            className="text-xs bg-green-500/10 text-green-700 dark:text-green-300"
                          >
                            ✓ Completed
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {formatTime(event.data.completedAt)}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
