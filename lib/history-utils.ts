"use client";

import { generateId } from "@/lib/generate-id";

export interface PomodoroSession {
  id: string;
  startTime: Date;
  duration: number;
  mode: "pomodoro" | "shortBreak" | "longBreak";
  note?: string;
  tags?: string[];
  taskId?: string;
  taskTitle?: string;
}

export interface TaskCompletionEvent {
  id: string;
  taskId: string;
  taskTitle: string;
  completedAt: Date;
}

// Safely access localStorage
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    if (typeof window === "undefined") return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
      return false;
    }
  },
};

// Cache for history data to reduce localStorage access
let historyCache: PomodoroSession[] | null = null;
let historyCacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get history with caching
export function getHistory(): PomodoroSession[] {
  if (typeof window === "undefined") {
    return [];
  }

  const now = Date.now();

  // Return cached data if it's still valid
  if (historyCache && now - historyCacheTimestamp < CACHE_DURATION) {
    return historyCache;
  }

  const history = safeLocalStorage.getItem("pomofit-history");
  if (!history) {
    historyCache = [];
    historyCacheTimestamp = now;
    return [];
  }

  try {
    const parsedHistory = JSON.parse(history);

    if (!Array.isArray(parsedHistory)) {
      console.error("History is not an array:", parsedHistory);
      historyCache = [];
      historyCacheTimestamp = now;
      return [];
    }

    // Convert string dates back to Date objects and validate sessions
    const validSessions = parsedHistory
      .map((session, index): PomodoroSession | null => {
        try {
          if (!session || typeof session !== "object") {
            if (process.env.NODE_ENV === "development") {
              console.warn(`Invalid session at index ${index}:`, session);
            }
            return null;
          }

          const candidate = session as Record<string, unknown>;
          const id = typeof candidate.id === "string" ? candidate.id : null;
          const duration =
            typeof candidate.duration === "number" ? candidate.duration : null;
          const rawStartTime = candidate.startTime;

          if (!id || duration === null || rawStartTime == null) {
            if (process.env.NODE_ENV === "development") {
              console.warn(
                `Session missing required fields at index ${index}:`,
                session
              );
            }
            return null;
          }

          const startTime =
            rawStartTime instanceof Date
              ? rawStartTime
              : new Date(
                  typeof rawStartTime === "number" ||
                    typeof rawStartTime === "string"
                    ? rawStartTime
                    : NaN
                );

          if (Number.isNaN(startTime.getTime())) {
            if (process.env.NODE_ENV === "development") {
              console.warn(
                `Invalid startTime in session at index ${index}:`,
                rawStartTime
              );
            }
            return null;
          }

          const mode =
            candidate.mode === "shortBreak"
              ? "shortBreak"
              : candidate.mode === "longBreak"
              ? "longBreak"
              : "pomodoro";

          const tags = Array.isArray(candidate.tags)
            ? candidate.tags.filter((tag): tag is string => typeof tag === "string")
            : undefined;

          return {
            id,
            startTime,
            duration,
            mode,
            note: typeof candidate.note === "string" ? candidate.note : undefined,
            tags,
            taskId: typeof candidate.taskId === "string" ? candidate.taskId : undefined,
            taskTitle:
              typeof candidate.taskTitle === "string" ? candidate.taskTitle : undefined,
          };
        } catch (error) {
          console.error(
            `Error processing session at index ${index}:`,
            error,
            session
          );
          return null;
        }
      })
      .filter((session): session is PomodoroSession => session !== null);

    // Update cache
    historyCache = validSessions;
    historyCacheTimestamp = now;

    return validSessions;
  } catch (error) {
    console.error("Error parsing history:", error);
    historyCache = [];
    historyCacheTimestamp = now;
    return [];
  }
}

// Clear cache when adding new sessions
export function addSessionToHistory(session: PomodoroSession) {
  try {
    const history = getHistory();
    const updatedHistory = [session, ...history];

    const success = safeLocalStorage.setItem(
      "pomofit-history",
      JSON.stringify(updatedHistory)
    );

    // Clear cache to force refresh on next getHistory call
    if (success) {
      historyCache = null;
    }

    return success;
  } catch (error) {
    console.error("Error adding session to history:", error);
    return false;
  }
}

// Get sessions for a specific date
export function getHistoryByDate(date: Date): PomodoroSession[] {
  const history = getHistory();

  // If date is very old (like new Date(0)), return all sessions
  if (date.getFullYear() < 2000) {
    return history;
  }

  const targetDate = {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  };

  const filteredSessions = history.filter((session) => {
    try {
      const sessionDate = new Date(session.startTime);
      const sessionDateInfo = {
        year: sessionDate.getFullYear(),
        month: sessionDate.getMonth(),
        day: sessionDate.getDate(),
      };

      const matches =
        sessionDateInfo.day === targetDate.day &&
        sessionDateInfo.month === targetDate.month &&
        sessionDateInfo.year === targetDate.year;

      return matches;
    } catch (error) {
      console.error("Error filtering session by date:", error, session);
      return false;
    }
  });

  return filteredSessions.sort((a, b) => {
    try {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    } catch (error) {
      console.error("Error sorting sessions:", error);
      return 0;
    }
  });
}

// Get count of today's pomodoro sessions
export function countTodaysPomodoroSessions(): number {
  const today = new Date();
  const sessions = getHistoryByDate(today);
  return sessions.filter(session => session.mode === "pomodoro").length;
}

// Get task completions
export function getTaskCompletions(): TaskCompletionEvent[] {
  const completions = safeLocalStorage.getItem("pomofit-task-completions");
  if (!completions) return [];

  try {
    const parsedCompletions = JSON.parse(completions);

    if (!Array.isArray(parsedCompletions)) {
      console.error("Task completions is not an array:", parsedCompletions);
      return [];
    }

    // Convert string dates back to Date objects
    return parsedCompletions
      .map((completion, index): TaskCompletionEvent | null => {
        try {
          if (!completion || typeof completion !== "object") {
            return null;
          }

          const candidate = completion as Record<string, unknown>;
          const id = typeof candidate.id === "string" ? candidate.id : null;
          const taskId =
            typeof candidate.taskId === "string" ? candidate.taskId : null;
          const taskTitle =
            typeof candidate.taskTitle === "string"
              ? candidate.taskTitle
              : null;
          const rawCompletedAt = candidate.completedAt;

          if (!id || !taskId || !taskTitle || rawCompletedAt == null) {
            if (process.env.NODE_ENV === "development") {
              console.warn(
                `Completion missing required fields at index ${index}:`,
                completion
              );
            }
            return null;
          }

          const completedAt =
            rawCompletedAt instanceof Date
              ? rawCompletedAt
              : new Date(
                  typeof rawCompletedAt === "number" ||
                    typeof rawCompletedAt === "string"
                    ? rawCompletedAt
                    : NaN
                );

          if (Number.isNaN(completedAt.getTime())) {
            return null;
          }

          return {
            id,
            taskId,
            taskTitle,
            completedAt,
          };
        } catch (error) {
          console.error("Error processing completion:", error, completion);
          return null;
        }
      })
      .filter(
        (completion): completion is TaskCompletionEvent => completion !== null
      );
  } catch (error) {
    console.error("Error parsing task completions:", error);
    return [];
  }
}

// Add a task completion to history
export function addTaskCompletion(taskId: string, taskTitle: string) {
  try {
    const completions = getTaskCompletions();
    const newCompletion: TaskCompletionEvent = {
      id: generateId(),
      taskId,
      taskTitle,
      completedAt: new Date(),
    };

    const updatedCompletions = [newCompletion, ...completions];
    return safeLocalStorage.setItem(
      "pomofit-task-completions",
      JSON.stringify(updatedCompletions)
    );
  } catch (error) {
    console.error("Error adding task completion:", error);
    return false;
  }
}

// Get task completions for a specific date
export function getTaskCompletionsByDate(date: Date): TaskCompletionEvent[] {
  const completions = getTaskCompletions();

  // If date is very old (like new Date(0)), return all completions
  if (date.getFullYear() < 2000) {
    return completions;
  }

  return completions
    .filter((completion) => {
      try {
        const completionDate = new Date(completion.completedAt);
        return (
          completionDate.getDate() === date.getDate() &&
          completionDate.getMonth() === date.getMonth() &&
          completionDate.getFullYear() === date.getFullYear()
        );
      } catch (error) {
        console.error("Error filtering completion by date:", error, completion);
        return false;
      }
    })
    .sort((a, b) => {
      try {
        return (
          new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
        );
      } catch (error) {
        console.error("Error sorting completions:", error);
        return 0;
      }
    });
}

// Custom hook for history with sync
export function useHistory() {
  return {
    history: getHistory(),
    taskCompletions: getTaskCompletions(),
    addSession: addSessionToHistory,
    addCompletion: addTaskCompletion,
    getSessionsByDate: getHistoryByDate,
    getCompletionsByDate: getTaskCompletionsByDate,
    isSyncing: false,
  };
}
