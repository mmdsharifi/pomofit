import type { Task } from "@/types/task"
import type { PomodoroSession, TaskCompletionEvent } from "@/lib/history-utils"

// Define the structure of our export data
export interface ExportData {
  version: string
  exportDate: string
  tasks: Task[]
  sessions: PomodoroSession[]
  taskCompletions: TaskCompletionEvent[]
  settings: any
}

/**
 * Convert application data to CSV format
 */
export function convertToCSV(data: ExportData): string {
  // Create CSV sections for each data type
  const sections: string[] = []

  // Add metadata
  sections.push(`"POMOFIT_EXPORT_DATA","version:${data.version}","date:${data.exportDate}"`)
  sections.push("") // Empty line as separator

  // Add settings section
  sections.push('"SETTINGS"')
  const settingsEntries = Object.entries(data.settings)
  if (settingsEntries.length > 0) {
    // Create header row
    sections.push('"' + Object.keys(data.settings).join('","') + '"')
    // Create values row
    sections.push('"' + Object.values(data.settings).map(formatCSVValue).join('","') + '"')
  } else {
    sections.push('"No settings found"')
  }
  sections.push("") // Empty line as separator

  // Add tasks section
  sections.push('"TASKS"')
  if (data.tasks.length > 0) {
    // Get all possible keys from all tasks
    const taskKeys = Array.from(new Set(data.tasks.flatMap((task) => Object.keys(task))))
    // Create header row
    sections.push('"' + taskKeys.join('","') + '"')
    // Create data rows
    data.tasks.forEach((task) => {
      const row = taskKeys.map((key) => {
        // @ts-ignore - We're dynamically accessing properties
        const value = task[key]
        return formatCSVValue(value)
      })
      sections.push('"' + row.join('","') + '"')
    })
  } else {
    sections.push('"No tasks found"')
  }
  sections.push("") // Empty line as separator

  // Add sessions section
  sections.push('"SESSIONS"')
  if (data.sessions.length > 0) {
    // Get all possible keys from all sessions
    const sessionKeys = Array.from(new Set(data.sessions.flatMap((session) => Object.keys(session))))
    // Create header row
    sections.push('"' + sessionKeys.join('","') + '"')
    // Create data rows
    data.sessions.forEach((session) => {
      const row = sessionKeys.map((key) => {
        // @ts-ignore - We're dynamically accessing properties
        const value = session[key]
        return formatCSVValue(value)
      })
      sections.push('"' + row.join('","') + '"')
    })
  } else {
    sections.push('"No sessions found"')
  }
  sections.push("") // Empty line as separator

  // Add task completions section
  sections.push('"TASK_COMPLETIONS"')
  if (data.taskCompletions.length > 0) {
    // Get all possible keys from all task completions
    const completionKeys = Array.from(new Set(data.taskCompletions.flatMap((completion) => Object.keys(completion))))
    // Create header row
    sections.push('"' + completionKeys.join('","') + '"')
    // Create data rows
    data.taskCompletions.forEach((completion) => {
      const row = completionKeys.map((key) => {
        // @ts-ignore - We're dynamically accessing properties
        const value = completion[key]
        return formatCSVValue(value)
      })
      sections.push('"' + row.join('","') + '"')
    })
  } else {
    sections.push('"No task completions found"')
  }

  // Join all sections with newlines
  return sections.join("\n")
}

/**
 * Parse CSV data and convert it back to application data
 */
export function parseCSVData(csvData: string): ExportData | null {
  try {
    const lines = csvData
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    // Initialize result object
    const result: ExportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      tasks: [],
      sessions: [],
      taskCompletions: [],
      settings: {},
    }

    // Check if this is a valid export file
    const firstLine = parseCSVLine(lines[0])
    if (firstLine[0] !== "POMOFIT_EXPORT_DATA") {
      throw new Error("Invalid export file format")
    }

    // Extract metadata
    const versionMatch = firstLine[1]?.match(/version:(.+)/)
    if (versionMatch) {
      result.version = versionMatch[1]
    }

    const dateMatch = firstLine[2]?.match(/date:(.+)/)
    if (dateMatch) {
      result.exportDate = dateMatch[1]
    }

    // Process each section
    let currentSection = ""
    let headers: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const parsedLine = parseCSVLine(line)

      // Check if this is a section header
      if (parsedLine.length === 1 && ["SETTINGS", "TASKS", "SESSIONS", "TASK_COMPLETIONS"].includes(parsedLine[0])) {
        currentSection = parsedLine[0]
        headers = []
        continue
      }

      // If we have a current section and this is the first data line, it's the headers
      if (currentSection && headers.length === 0) {
        headers = parsedLine
        continue
      }

      // Process data based on current section
      if (headers.length > 0 && parsedLine.length > 0) {
        const item: Record<string, any> = {}

        // Map values to headers
        for (let j = 0; j < Math.min(headers.length, parsedLine.length); j++) {
          item[headers[j]] = parseCSVValue(parsedLine[j])
        }

        // Add to appropriate section
        switch (currentSection) {
          case "SETTINGS":
            result.settings = item
            break
          case "TASKS":
            result.tasks.push(item as unknown as Task)
            break
          case "SESSIONS":
            result.sessions.push(item as unknown as PomodoroSession)
            break
          case "TASK_COMPLETIONS":
            result.taskCompletions.push(item as unknown as TaskCompletionEvent)
            break
        }
      }
    }

    // Convert date strings back to Date objects
    result.tasks = result.tasks.map((task) => ({
      ...task,
      createdAt: new Date(task.createdAt),
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
    }))

    result.sessions = result.sessions.map((session) => ({
      ...session,
      startTime: new Date(session.startTime),
    }))

    result.taskCompletions = result.taskCompletions.map((completion) => ({
      ...completion,
      completedAt: new Date(completion.completedAt),
    }))

    return result
  } catch (error) {
    console.error("Error parsing CSV data:", error)
    return null
  }
}

/**
 * Parse a CSV line into an array of values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      // Check if this is an escaped quote
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++ // Skip the next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }

  // Add the last field
  result.push(current)

  return result
}

/**
 * Format a value for CSV export
 */
function formatCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return ""
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === "object") {
    return JSON.stringify(value)
  }

  // Escape quotes by doubling them
  if (typeof value === "string") {
    return value.replace(/"/g, '""')
  }

  return String(value)
}

/**
 * Parse a value from CSV import
 */
function parseCSVValue(value: string): any {
  if (value === "") {
    return null
  }

  // Try to parse as JSON
  if ((value.startsWith("{") && value.endsWith("}")) || (value.startsWith("[") && value.endsWith("]"))) {
    try {
      return JSON.parse(value)
    } catch (e) {
      // Not valid JSON, continue with other parsing
    }
  }

  // Try to parse as date
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date
    }
  }

  // Try to parse as number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value)
  }

  // Try to parse as boolean
  if (value.toLowerCase() === "true") return true
  if (value.toLowerCase() === "false") return false

  // Return as string
  return value
}
