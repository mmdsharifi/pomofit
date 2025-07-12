"use client"

import { createClient } from "@/lib/supabase-client"
import { useAuth } from "@/lib/auth-context"
import { useState, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useSyncQueue, useOnlineStatus } from "@/lib/sync-utils"
import { isSupabaseConfigured } from "@/lib/supabase-utils"

// Define settings type
export type UserSettings = {
  pomodoroTime: number
  shortBreakTime: number
  longBreakTime: number
  pomodoroGoal: number
  workoutGifs: string[]
  autoStartBreaks?: boolean
  autoStartPomodoros?: boolean
  longBreakInterval?: number
  alarmSound?: string
  alarmVolume?: number
  darkMode?: boolean
}

export function useSettingsSync() {
  const { user } = useAuth()
  const isOnline = useOnlineStatus()
  const { toast } = useToast()
  const [isInitialSyncComplete, setIsInitialSyncComplete] = useState(false)
  const { addToSyncQueue } = useSyncQueue()

  // Check if Supabase is configured
  const isConfigured = isSupabaseConfigured()

  // Convert Supabase settings to local settings format
  const convertFromSupabase = useCallback((settings: any): UserSettings => {
    return {
      pomodoroTime: settings.pomodoro_time,
      shortBreakTime: settings.short_break_time,
      longBreakTime: settings.long_break_time,
      pomodoroGoal: settings.pomodoro_goal,
      workoutGifs: settings.workout_gifs,
      autoStartBreaks: settings.auto_start_breaks,
      autoStartPomodoros: settings.auto_start_pomodoros,
      longBreakInterval: settings.long_break_interval,
      alarmSound: settings.alarm_sound,
      alarmVolume: settings.alarm_volume,
      darkMode: settings.dark_mode,
    }
  }, [])

  // Convert local settings to Supabase format
  const convertToSupabase = useCallback((settings: UserSettings): any => {
    return {
      pomodoro_time: settings.pomodoroTime,
      short_break_time: settings.shortBreakTime,
      long_break_time: settings.longBreakTime,
      pomodoro_goal: settings.pomodoroGoal,
      workout_gifs: settings.workoutGifs,
      auto_start_breaks: settings.autoStartBreaks,
      auto_start_pomodoros: settings.autoStartPomodoros,
      long_break_interval: settings.longBreakInterval,
      alarm_sound: settings.alarmSound,
      alarm_volume: settings.alarmVolume,
      dark_mode: settings.darkMode,
    }
  }, [])

  // Fetch settings from Supabase
  const fetchSettings = useCallback(async (): Promise<UserSettings | null> => {
    if (!user || !isConfigured) return null

    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("settings").select("*").eq("user_id", user.id).single()

      if (error) {
        if (error.code === "PGRST116") {
          // No settings found for this user
          return null
        }
        throw error
      }

      return data ? convertFromSupabase(data) : null
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast({
        title: "Failed to fetch settings",
        description: "Could not retrieve your settings from the server.",
        variant: "destructive",
      })
      return null
    }
  }, [user, isConfigured, convertFromSupabase, toast])

  // Sync local settings with Supabase
  const syncSettings = useCallback(
    async (localSettings: UserSettings): Promise<UserSettings> => {
      if (!user || !isOnline || !isConfigured) return localSettings

      try {
        // Fetch remote settings
        const remoteSettings = await fetchSettings()

        if (!remoteSettings) {
          // No remote settings, create them
          addToSyncQueue({
            table: "settings",
            operation: "insert",
            data: {
              ...convertToSupabase(localSettings),
              user_id: user.id,
            },
          })
          return localSettings
        }

        // Determine which settings to use (local or remote)
        // For simplicity, we'll use a simple heuristic:
        // If remote has different values, use those
        const mergedSettings = { ...localSettings }
        let hasChanges = false

        // Check each setting
        Object.entries(remoteSettings).forEach(([key, value]) => {
          const localKey = key as keyof UserSettings
          if (localSettings[localKey] !== value) {
            // @ts-ignore - We know this is safe
            mergedSettings[localKey] = value
            hasChanges = true
          }
        })

        // If local settings have changed, update remote
        if (hasChanges) {
          addToSyncQueue({
            table: "settings",
            operation: "update",
            data: {
              ...convertToSupabase(mergedSettings),
              user_id: user.id,
            },
          })
        }

        return mergedSettings
      } catch (error) {
        console.error("Error syncing settings:", error)
        return localSettings
      }
    },
    [user, isOnline, isConfigured, fetchSettings, addToSyncQueue, convertToSupabase, toast],
  )

  // Initial sync when user logs in
  const initialSync = useCallback(
    async (localSettings: UserSettings) => {
      if (!user || !isOnline || isInitialSyncComplete || !isConfigured) return localSettings

      try {
        const syncedSettings = await syncSettings(localSettings)
        setIsInitialSyncComplete(true)
        return syncedSettings
      } catch (error) {
        console.error("Error during initial settings sync:", error)
        return localSettings
      }
    },
    [user, isOnline, isInitialSyncComplete, isConfigured, syncSettings],
  )

  // Update settings in Supabase
  const updateSettings = useCallback(
    (settings: UserSettings) => {
      if (!user || !isConfigured) return

      addToSyncQueue({
        table: "settings",
        operation: "update",
        data: {
          ...convertToSupabase(settings),
          user_id: user.id,
        },
      })
    },
    [user, isConfigured, addToSyncQueue, convertToSupabase],
  )

  return {
    fetchSettings,
    syncSettings,
    initialSync,
    updateSettings,
    isInitialSyncComplete,
  }
}
