import { z } from "zod";
import { CONSTRAINTS } from "./constants";

/**
 * Task validation schemas
 */
export const taskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title cannot be empty")
    .max(
      CONSTRAINTS.MAX_TASK_TITLE_LENGTH,
      `Task title cannot exceed ${CONSTRAINTS.MAX_TASK_TITLE_LENGTH} characters`
    )
    .trim(),
  completed: z.boolean().optional(),
  order: z.number().optional(),
});

export type TaskInput = z.infer<typeof taskSchema>;

/**
 * Session note validation schema
 */
export const sessionNoteSchema = z.object({
  note: z
    .string()
    .max(
      CONSTRAINTS.MAX_NOTE_LENGTH,
      `Note cannot exceed ${CONSTRAINTS.MAX_NOTE_LENGTH} characters`
    )
    .optional(),
  tags: z.array(z.string()).optional(),
  autoStartRest: z.boolean().optional(),
});

export type SessionNoteInput = z.infer<typeof sessionNoteSchema>;

/**
 * Settings validation schema
 */
export const settingsSchema = z.object({
  pomodoroGoal: z
    .number()
    .min(
      CONSTRAINTS.POMODORO_GOAL_MIN,
      `Pomodoro goal must be at least ${CONSTRAINTS.POMODORO_GOAL_MIN}`
    )
    .max(
      CONSTRAINTS.POMODORO_GOAL_MAX,
      `Pomodoro goal cannot exceed ${CONSTRAINTS.POMODORO_GOAL_MAX}`
    )
    .optional(),
  notificationsEnabled: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

/**
 * Validate task input
 */
export function validateTask(data: unknown) {
  return taskSchema.safeParse(data);
}

/**
 * Validate session note
 */
export function validateSessionNote(data: unknown) {
  return sessionNoteSchema.safeParse(data);
}

/**
 * Validate settings
 */
export function validateSettings(data: unknown) {
  return settingsSchema.safeParse(data);
}

/**
 * Get validation error message
 */
export function getValidationErrorMessage(errors: z.ZodError): string {
  const firstError = errors.errors[0];
  return firstError?.message || "Validation failed";
}
