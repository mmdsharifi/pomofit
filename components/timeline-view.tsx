"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PomodoroSession, TaskCompletionEvent } from "@/lib/history-utils";

interface TimelineViewProps {
  sessions: PomodoroSession[];
  completions: TaskCompletionEvent[];
  getTaskName: (note: string) => string | null;
  formatTime: (date: Date) => string;
  formatDuration: (seconds: number) => string;
  containerHeight?: number;
  className?: string;
}

interface ProcessedEvent {
  id: string;
  type: "session" | "completion";
  data: any;
  startTime: Date;
  endTime: Date;
  title: string;
  column: number;
}

export default function TimelineView({
  sessions,
  completions,
  getTaskName,
  formatTime,
  formatDuration,
  containerHeight = 600,
  className = "",
}: TimelineViewProps) {
  const [timeRange, setTimeRange] = useState<{ start: number; end: number }>({
    start: 8,
    end: 20,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Debug logging removed for performance

  // Assign columns to events to prevent overlapping - MOVED BEFORE processedEvents
  const assignColumns = (events: ProcessedEvent[]) => {
    if (!events || events.length === 0) {
      return { events: [], columnCount: 1 };
    }

    try {
      // Sort events by start time
      const sortedEvents = [...events].sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime()
      );

      // Track the end time of the last event in each column
      const columnEndTimes: number[] = [];

      // Assign columns to events
      sortedEvents.forEach((event) => {
        const startTime = event.startTime.getTime();

        // Find the first column where this event doesn't overlap
        let column = 0;
        while (true) {
          if (!columnEndTimes[column] || columnEndTimes[column] <= startTime) {
            // Found a column where this event can be placed
            break;
          }
          column++;
        }

        // Assign the column and update the end time
        event.column = column;
        columnEndTimes[column] = event.endTime.getTime();
      });

      // Count the number of columns needed
      const columnCount = Math.max(
        1,
        Math.max(...sortedEvents.map((e) => e.column), 0) + 1
      );

      return { events: sortedEvents, columnCount };
    } catch (error) {
      console.error("Error assigning columns:", error);
      return { events: [], columnCount: 1 };
    }
  };

  // Process sessions and completions
  const processedEvents = useMemo(() => {
    try {
      // Ensure sessions and completions are arrays
      const safeSessions = Array.isArray(sessions) ? sessions : [];
      const safeCompletions = Array.isArray(completions) ? completions : [];

      // Convert sessions to events with start and end times
      const sessionEvents = safeSessions
        .map((session, index) => {
          try {
            if (!session || !session.startTime) {
              console.warn(`Invalid session at index ${index}:`, session);
              return null;
            }

            // Ensure startTime is a Date object
            let startTime: Date;
            if (session.startTime instanceof Date) {
              startTime = session.startTime;
            } else {
              startTime = new Date(session.startTime);
            }

            if (isNaN(startTime.getTime())) {
              console.warn(
                `Invalid date in session at index ${index}:`,
                session
              );
              return null;
            }

            const endTime = new Date(
              startTime.getTime() + (session.duration || 0) * 1000
            );
            const taskName =
              getTaskName(session.note || "") ||
              session.taskTitle ||
              (session.mode === "pomodoro"
                ? "Focus Session"
                : session.mode === "shortBreak"
                ? "Short Break"
                : "Long Break");

            const event = {
              id:
                session.id ||
                `session-${Math.random().toString(36).substring(2, 9)}`,
              type: "session" as const,
              data: session,
              startTime,
              endTime,
              title: taskName,
              column: 0, // Will be assigned later
            };

            return event;
          } catch (error) {
            console.error(
              `Error processing session at index ${index}:`,
              error,
              session
            );
            return null;
          }
        })
        .filter(Boolean) as ProcessedEvent[];

      // Convert completions to events
      const completionEvents = safeCompletions
        .map((completion, index) => {
          try {
            if (!completion || !completion.completedAt) {
              console.warn(`Invalid completion at index ${index}:`, completion);
              return null;
            }

            // Ensure completedAt is a Date object
            let startTime: Date;
            if (completion.completedAt instanceof Date) {
              startTime = completion.completedAt;
            } else {
              startTime = new Date(completion.completedAt);
            }

            if (isNaN(startTime.getTime())) {
              console.warn(
                `Invalid date in completion at index ${index}:`,
                completion
              );
              return null;
            }

            // Completions are point events, but give them a small duration for display
            const endTime = new Date(startTime.getTime() + 15 * 60 * 1000); // 15 minutes

            const event = {
              id:
                completion.id ||
                `completion-${Math.random().toString(36).substring(2, 9)}`,
              type: "completion" as const,
              data: completion,
              startTime,
              endTime,
              title: completion.taskTitle || "Task Completed",
              column: 0, // Will be assigned later
            };

            return event;
          } catch (error) {
            console.error(
              `Error processing completion at index ${index}:`,
              error,
              completion
            );
            return null;
          }
        })
        .filter(Boolean) as ProcessedEvent[];

      // Combine and sort all events by start time
      const allEvents = [...sessionEvents, ...completionEvents].sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime()
      );

      // Calculate time range for the timeline
      if (allEvents.length > 0) {
        const startHours = allEvents.map((event) => event.startTime.getHours());
        const endHours = allEvents.map(
          (event) =>
            event.endTime.getHours() + (event.endTime.getMinutes() > 0 ? 1 : 0)
        );

        const minHour = Math.max(0, Math.min(...startHours) - 1);
        const maxHour = Math.min(24, Math.max(...endHours) + 1);

        setTimeRange({ start: minHour, end: maxHour });
      } else {
        // Default to business hours if no events
        setTimeRange({ start: 8, end: 20 });
      }

      // Assign columns to prevent overlapping
      return assignColumns(allEvents);
    } catch (error) {
      console.error("Error processing events:", error);
      return { events: [], columnCount: 1 };
    }
  }, [sessions, completions, getTaskName]);

  const { events, columnCount } = processedEvents;

  // Generate hour markers for the timeline
  const hourMarkers = useMemo(() => {
    try {
      return Array.from(
        { length: timeRange.end - timeRange.start + 1 },
        (_, i) => timeRange.start + i
      ).map((hour) => {
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const period = hour >= 12 ? "PM" : "AM";
        return {
          hour: `${displayHour} ${period}`,
          position:
            ((hour - timeRange.start) / (timeRange.end - timeRange.start)) *
            100,
        };
      });
    } catch (error) {
      console.error("Error generating hour markers:", error);
      return [];
    }
  }, [timeRange]);

  // Calculate position on timeline based on time
  const calculatePosition = (time: Date) => {
    try {
      const hours = time.getHours() + time.getMinutes() / 60;
      const totalHours = timeRange.end - timeRange.start;
      const percentage = ((hours - timeRange.start) / totalHours) * 100;
      return Math.max(0, Math.min(100, percentage));
    } catch (error) {
      console.error("Error calculating position:", error);
      return 0;
    }
  };

  // Calculate height based on duration
  const calculateHeight = (startTime: Date, endTime: Date) => {
    try {
      const durationHours =
        (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const totalHours = timeRange.end - timeRange.start;
      const percentage = (durationHours / totalHours) * 100;

      // Ensure a minimum height
      return Math.max(60, percentage);
    } catch (error) {
      console.error("Error calculating height:", error);
      return 60; // Default minimum height
    }
  };

  // Debug information
  const debugInfo = {
    sessionsReceived: sessions.length,
    completionsReceived: completions.length,
    eventsProcessed: events.length,
    timeRange,
    columnCount,
  };

  // Debug info removed for performance

  // If no events, show a message with debug info
  if (events.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center h-[400px]">
            <p className="text-muted-foreground mb-4">
              No sessions found for this date
            </p>
            {process.env.NODE_ENV === "development" && (
              <div className="text-xs text-muted-foreground bg-muted p-4 rounded max-w-md">
                <p>
                  <strong>Debug Info:</strong>
                </p>
                <p>Sessions received: {debugInfo.sessionsReceived}</p>
                <p>Completions received: {debugInfo.completionsReceived}</p>
                <p>Events processed: {debugInfo.eventsProcessed}</p>
                <p>
                  Time range: {debugInfo.timeRange.start}:00 -{" "}
                  {debugInfo.timeRange.end}:00
                </p>
                <p>Columns: {debugInfo.columnCount}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div
          className="relative"
          style={{ height: `${containerHeight}px` }}
          ref={containerRef}
        >
          {/* Time markers */}
          <div className="absolute left-0 top-0 bottom-0 w-16 border-r border-border bg-background z-10">
            {hourMarkers.map((marker, index) => (
              <div
                key={index}
                className="absolute left-0 right-0 text-xs text-muted-foreground px-2"
                style={{ top: `${marker.position}%` }}
              >
                {marker.hour}
                <div
                  className="absolute left-16 w-full border-t border-border"
                  style={{ top: "50%" }}
                ></div>
              </div>
            ))}
          </div>

          {/* Timeline content */}
          <ScrollArea className="h-full pl-16">
            <div className="relative min-h-full">
              {events.map((event, index) => {
                try {
                  const topPosition = calculatePosition(event.startTime);
                  const height = calculateHeight(
                    event.startTime,
                    event.endTime
                  );
                  const columnWidth = 100 / columnCount;
                  const leftPosition = event.column * columnWidth;

                  if (event.type === "session") {
                    const session = event.data;

                    return (
                      <div
                        key={`session-${event.id}`}
                        className="absolute bg-card border rounded-md p-3 shadow-sm"
                        style={{
                          top: `${topPosition}%`,
                          left: `${leftPosition}%`,
                          width: `calc(${columnWidth}% - 8px)`,
                          height: `${height}px`,
                          minHeight: "60px",
                          borderLeftWidth: "4px",
                          borderLeftColor:
                            session.mode === "pomodoro"
                              ? "hsl(var(--primary))"
                              : session.mode === "shortBreak"
                              ? "hsl(220 70% 50%)"
                              : "hsl(142 76% 36%)",
                        }}
                      >
                        <div className="flex flex-col h-full">
                          <h3 className="font-medium text-sm line-clamp-2 mb-1">
                            {event.title}
                          </h3>

                          <div className="flex items-center justify-between mt-auto">
                            <Badge variant="outline" className="text-xs">
                              {session.mode === "pomodoro"
                                ? "Focus"
                                : session.mode === "shortBreak"
                                ? "Short Break"
                                : "Long Break"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(session.duration)}
                            </span>
                          </div>

                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(session.startTime)}
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    const completion = event.data;

                    return (
                      <div
                        key={`completion-${event.id}`}
                        className="absolute bg-card border-l-4 border-l-green-500 border rounded-md p-3 shadow-sm"
                        style={{
                          top: `${topPosition}%`,
                          left: `${leftPosition}%`,
                          width: `calc(${columnWidth}% - 8px)`,
                          minHeight: "50px",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          <div>
                            <h3 className="font-medium text-sm">
                              {event.title}
                            </h3>
                            <div className="text-xs text-muted-foreground">
                              Completed at {formatTime(completion.completedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                } catch (error) {
                  console.error("Error rendering event:", error);
                  return null;
                }
              })}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
