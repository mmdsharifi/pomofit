/**
 * Application constants
 * Centralized constants to avoid magic strings throughout the codebase
 */

// LocalStorage keys
export const STORAGE_KEYS = {
  TASKS: "pomofit-tasks",
  SETTINGS: "pomofit-settings",
  HISTORY: "pomofit-history",
  THEME: "pomofit-theme",
  NOTIFICATIONS_ENABLED: "pomofit-notifications-enabled",
} as const;

// Sound file paths
export const SOUND_PATHS = {
  BREAK_START: "/sounds/break-start.mp3",
  BREAK_END: "/sounds/break-end.mp3",
  // Using break-start.mp3 for timer start/end since timer-specific sounds don't exist
  TIMER_START: "/sounds/break-start.mp3",
  TIMER_END: "/sounds/break-end.mp3",
} as const;

// Timer modes
export const TIMER_MODES = {
  POMODORO: "pomodoro",
  SHORT_BREAK: "shortBreak",
  LONG_BREAK: "longBreak",
} as const;

// Default timer durations (in seconds)
export const DEFAULT_DURATIONS = {
  POMODORO: 25 * 60, // 25 minutes
  SHORT_BREAK: 5 * 60, // 5 minutes
  LONG_BREAK: 15 * 60, // 15 minutes
} as const;

// Emoji variations
export const BREAK_TITLE_EMOJIS = [
  "💪",
  "🧘",
  "🤸",
  "🏃‍♂️",
  "🚴",
  "🥊",
  "⛹️‍♀️",
  "🏋️",
] as const;

// API endpoints
export const API_ENDPOINTS = {
  TASKS: "/api/tasks",
  SESSIONS: "/api/sessions",
  HISTORY: "/api/history",
  SETTINGS: "/api/settings",
  INSIGHTS: "/api/insights",
  JOURNAL_CHAT: "/api/journal-chat",
} as const;

// Error messages
export const ERROR_MESSAGES = {
  OFFLINE_MODE:
    "Supabase integration is temporarily disabled. Working in offline mode only.",
  TASK_CREATION_FAILED: "Failed to create task",
  SYNC_FAILED: "Failed to sync data",
  NOTIFICATION_FAILED: "Failed to send notification",
} as const;

// Toast messages
export const TOAST_MESSAGES = {
  OFFLINE_MODE: {
    title: "Offline Mode",
    description:
      "Supabase integration is temporarily disabled. Working in offline mode only.",
  },
  SYNC_COMPLETE: {
    title: "Sync Complete",
    description: "Your data has been synchronized.",
  },
  TASK_ADDED: {
    title: "Task Added",
    description: "New task created successfully.",
  },
} as const;

// Constraints
export const CONSTRAINTS = {
  MAX_TASK_TITLE_LENGTH: 255,
  MAX_NOTE_LENGTH: 2000,
  MAX_SYNC_TIME_MS: 5000,
  SYNC_QUEUE_DELAY_MS: 300,
  POMODORO_GOAL_MIN: 1,
  POMODORO_GOAL_MAX: 20,
} as const;

// Feature flags
export const FEATURES = {
  SUPABASE_ENABLED: false, // Temporarily disabled
  OFFLINE_MODE_ENABLED: true,
  NOTIFICATIONS_ENABLED: true,
  AI_INSIGHTS_ENABLED: true,
} as const;
