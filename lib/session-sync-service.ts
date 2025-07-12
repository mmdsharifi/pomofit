"use client"

import { createClient } from "@/lib/supabase-client"
import { useAuth } from "@/lib/auth-context"
import { useState, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useSyncQueue, useOnlineStatus } from "@/lib/sync-utils"
import type { PomodoroSession } from "@/lib/history-utils"
import { isSupabaseConfigured } from "@/lib/supabase-utils"

export function useSessionSync() {
  const { user } = useAuth()
  const isOnline = useOnlineStatus()
  const { toast } = useToast()
  const [isInitialSyncComplete, setIsInitialSyncComplete] = useState(false)
  const { addToSyncQueue } = useSyncQueue()

  // Check if Supabase is configured
  const isConfigured = isSupabaseConfigured()

  // Convert Supabase session to local session format
  const convertFromSupabase = useCallback((session: any): PomodoroSession => {
    return {
      id: session.id,
      startTime: new Date(session.start_time),
      duration: session.duration,
      mode: session.mode as "pomodoro" | "shortBreak" | "longBreak",
      note: session.note || undefined,
      tags: session.tags || undefined,
      taskId: session.task_id || undefined,
      taskTitle: session.task_title || undefined,
    }
  }, [])

  // Convert local session to Supabase format
  const convertToSupabase = useCallback((session: PomodoroSession): any => {
    return {
      id: session.id,
      start_time: session.startTime.toISOString(),
      duration: session.duration,
      mode: session.mode,
      note: session.note || null,
      tags: session.tags || null,
      task_id: session.taskId || null,
      task_title: session.taskTitle || null,
    }
  }, [])

  // Add a session to Supabase
  const addSession = useCallback(
    (session: PomodoroSession) => {
      if (!user || !isConfigured) return

      addToSyncQueue({
        table: "sessions",
        operation: "insert",
        data: {
          ...convertToSupabase(session),
          user_id: user.id,
        },
      })
    },
    [user, isConfigured, addToSyncQueue, convertToSupabase],
  )

  // Fetch sessions from Supabase
  const fetchSessions = useCallback(async (): Promise<PomodoroSession[]> => {
    if (!user || !isConfigured) return []

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("start_time", { ascending: false })

      if (error) throw error

      return (data || []).map(convertFromSupabase)
    } catch (error) {
      console.error("Error fetching sessions:", error)
      toast({
        title: "Failed to fetch session history",
        description: "Could not retrieve your session history from the server.",
        variant: "destructive",
      })
      return []
    }
  }, [user, isConfigured, convertFromSupabase, toast])

  // Sync local sessions with Supabase
  const syncSessions = useCallback(
    async (localSessions: PomodoroSession[]) => {
      if (!user || !isOnline || !isConfigured) return localSessions

      try {
        // Fetch remote sessions
        const remoteSessions = await fetchSessions()

        // Create maps for easier lookup
        const remoteSessionsMap = new Map(remoteSessions.map((session) => [session.id, session]))
        const localSessionsMap = new Map(localSessions.map((session) => [session.id, session]))

        // Sessions to be added to local storage (from remote)
        const sessionsToAdd: PomodoroSession[] = []

        // Sessions to be added to remote (from local)
        const sessionsToAddRemote: PomodoroSession[] = []

        // Process remote sessions
        remoteSessions.forEach((remoteSession) => {
          const localSession = localSessionsMap.get(remoteSession.id)

          if (!localSession) {
            // Session exists remotely but not locally - add to local
            sessionsToAdd.push(remoteSession)
          }
          // We don't update existing sessions as they should be immutable
        })

        // Process local sessions
        localSessions.forEach((localSession) => {
          const remoteSession = remoteSessionsMap.get(localSession.id)

          if (!remoteSession) {
            // Session exists locally but not remotely - add to remote
            sessionsToAddRemote.push(localSession)
          }
          // We don't update existing sessions as they should be immutable
        })

        // Add new remote sessions to local
        const updatedLocalSessions = [...localSessions]

        if (sessionsToAdd.length > 0) {
          updatedLocalSessions.push(...sessionsToAdd)
        }

        // Add new local sessions to remote
        for (const session of sessionsToAddRemote) {
          addToSyncQueue({
            table: "sessions",
            operation: "insert",
            data: {
              ...convertToSupabase(session),
              user_id: user.id,
            },
          })
        }

        return updatedLocalSessions
      } catch (error) {
        console.error("Error syncing sessions:", error)
        return localSessions
      }
    },
    [user, isOnline, isConfigured, fetchSessions, addToSyncQueue, convertToSupabase, toast],
  )

  // Initial sync when user logs in
  const initialSync = useCallback(
    async (localSessions: PomodoroSession[]) => {
      if (!user || !isOnline || isInitialSyncComplete || !isConfigured) return localSessions

      try {
        // Set a flag to indicate sync is in progress
        setIsInitialSyncComplete(true)

        // Limit the number of sessions to sync initially to prevent UI freezing
        const sessionsToSync = localSessions.slice(0, 20) // Only sync up to 20 sessions initially
        const syncedSessions = await syncSessions(sessionsToSync)

        // If there are more sessions, schedule them for later sync
        if (localSessions.length > 20) {
          setTimeout(() => {
            // Queue the remaining sessions for background sync
            const remainingSessions = localSessions.slice(20)
            remainingSessions.forEach((session) => {
              addSession(session)
            })
          }, 5000) // Wait 5 seconds before syncing remaining sessions
        }

        return syncedSessions
      } catch (error) {
        console.error("Error during initial sync:", error)
        setIsInitialSyncComplete(false) // Reset flag on error
        return localSessions
      }
    },
    [user, isOnline, isInitialSyncComplete, isConfigured, syncSessions, addSession],
  )

  // Add a session to Supabase

  return {
    fetchSessions,
    syncSessions,
    initialSync,
    addSession,
    isInitialSyncComplete,
  }
}
