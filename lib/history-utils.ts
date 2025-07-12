"use client"

export interface PomodoroSession {
  id: string
  startTime: Date
  duration: number
  mode: "pomodoro" | "shortBreak" | "longBreak"
  note?: string
  tags?: string[]
  taskId?: string
  taskTitle?: string
}

export interface TaskCompletionEvent {
  id: string
  taskId: string
  taskTitle: string
  completedAt: Date
}

// Safely access localStorage
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error)
      return null
    }
  },
  setItem: (key: string, value: string): boolean => {
    if (typeof window === "undefined") return false
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error)
      return false
    }
  },
}

// Get history from local storage
export function getHistory(): PomodoroSession[] {
  const history = safeLocalStorage.getItem("pomofit-history")
  if (!history) {
    console.log("No history found in localStorage")
    return []
  }

  try {
    const parsedHistory = JSON.parse(history)
    console.log("Raw history from localStorage:", parsedHistory)

    if (!Array.isArray(parsedHistory)) {
      console.error("History is not an array:", parsedHistory)
      return []
    }

    // Convert string dates back to Date objects and validate sessions
    const validSessions = parsedHistory
      .map((session: any, index: number) => {
        try {
          if (!session || typeof session !== "object") {
            console.warn(`Invalid session at index ${index}:`, session)
            return null
          }

          // Ensure required fields exist
          if (!session.id || !session.startTime || typeof session.duration !== "number") {
            console.warn(`Session missing required fields at index ${index}:`, session)
            return null
          }

          // Convert startTime to Date object
          let startTime: Date
          if (session.startTime instanceof Date) {
            startTime = session.startTime
          } else {
            startTime = new Date(session.startTime)
          }

          if (isNaN(startTime.getTime())) {
            console.warn(`Invalid startTime in session at index ${index}:`, session.startTime)
            return null
          }

          return {
            ...session,
            startTime,
          }
        } catch (error) {
          console.error(`Error processing session at index ${index}:`, error, session)
          return null
        }
      })
      .filter(Boolean)

    console.log(`Processed ${validSessions.length} valid sessions out of ${parsedHistory.length}`)
    return validSessions
  } catch (error) {
    console.error("Error parsing history:", error)
    return []
  }
}

// Add a session to history
export function addSessionToHistory(session: PomodoroSession) {
  try {
    console.log("Adding session to history:", session)
    const history = getHistory()
    const updatedHistory = [session, ...history]

    const success = safeLocalStorage.setItem("pomofit-history", JSON.stringify(updatedHistory))
    console.log("Session added successfully:", success)
    return success
  } catch (error) {
    console.error("Error adding session to history:", error)
    return false
  }
}

// Get sessions for a specific date
export function getHistoryByDate(date: Date): PomodoroSession[] {
  console.log("Getting history for date:", date)

  const history = getHistory()
  console.log("Total sessions in history:", history.length)

  // If date is very old (like new Date(0)), return all sessions
  if (date.getFullYear() < 2000) {
    console.log("Returning all sessions (date < 2000)")
    return history
  }

  const targetDate = {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  }

  console.log("Target date:", targetDate)

  const filteredSessions = history.filter((session) => {
    try {
      const sessionDate = new Date(session.startTime)
      const sessionDateInfo = {
        year: sessionDate.getFullYear(),
        month: sessionDate.getMonth(),
        day: sessionDate.getDate(),
      }

      const matches =
        sessionDateInfo.day === targetDate.day &&
        sessionDateInfo.month === targetDate.month &&
        sessionDateInfo.year === targetDate.year

      if (matches) {
        console.log("Session matches date:", session, sessionDateInfo)
      }

      return matches
    } catch (error) {
      console.error("Error filtering session by date:", error, session)
      return false
    }
  })

  console.log(`Found ${filteredSessions.length} sessions for date ${date.toDateString()}`)

  return filteredSessions.sort((a, b) => {
    try {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    } catch (error) {
      console.error("Error sorting sessions:", error)
      return 0
    }
  })
}

// Get task completions
export function getTaskCompletions(): TaskCompletionEvent[] {
  const completions = safeLocalStorage.getItem("pomofit-task-completions")
  if (!completions) return []

  try {
    const parsedCompletions = JSON.parse(completions)

    if (!Array.isArray(parsedCompletions)) {
      console.error("Task completions is not an array:", parsedCompletions)
      return []
    }

    // Convert string dates back to Date objects
    return parsedCompletions
      .map((completion: any) => {
        try {
          if (!completion || typeof completion !== "object") {
            return null
          }

          let completedAt: Date
          if (completion.completedAt instanceof Date) {
            completedAt = completion.completedAt
          } else {
            completedAt = new Date(completion.completedAt)
          }

          if (isNaN(completedAt.getTime())) {
            return null
          }

          return {
            ...completion,
            completedAt,
          }
        } catch (error) {
          console.error("Error processing completion:", error, completion)
          return null
        }
      })
      .filter(Boolean)
  } catch (error) {
    console.error("Error parsing task completions:", error)
    return []
  }
}

// Add a task completion to history
export function addTaskCompletion(taskId: string, taskTitle: string) {
  try {
    const completions = getTaskCompletions()
    const newCompletion: TaskCompletionEvent = {
      id: Date.now().toString(),
      taskId,
      taskTitle,
      completedAt: new Date(),
    }

    const updatedCompletions = [newCompletion, ...completions]
    return safeLocalStorage.setItem("pomofit-task-completions", JSON.stringify(updatedCompletions))
  } catch (error) {
    console.error("Error adding task completion:", error)
    return false
  }
}

// Get task completions for a specific date
export function getTaskCompletionsByDate(date: Date): TaskCompletionEvent[] {
  const completions = getTaskCompletions()

  // If date is very old (like new Date(0)), return all completions
  if (date.getFullYear() < 2000) {
    return completions
  }

  return completions
    .filter((completion) => {
      try {
        const completionDate = new Date(completion.completedAt)
        return (
          completionDate.getDate() === date.getDate() &&
          completionDate.getMonth() === date.getMonth() &&
          completionDate.getFullYear() === date.getFullYear()
        )
      } catch (error) {
        console.error("Error filtering completion by date:", error, completion)
        return false
      }
    })
    .sort((a, b) => {
      try {
        return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
      } catch (error) {
        console.error("Error sorting completions:", error)
        return 0
      }
    })
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
  }
}
