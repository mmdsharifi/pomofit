"use client"

import { createClient } from "@/lib/supabase-client"
import { useAuth } from "@/lib/auth-context"
import { useState, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useSyncQueue, useOnlineStatus } from "@/lib/sync-utils"
import type { Task } from "@/types/task"
import { isSupabaseConfigured } from "@/lib/supabase-utils"

export function useTaskSync() {
  const { user } = useAuth()
  const isOnline = useOnlineStatus()
  const { toast } = useToast()
  const [isInitialSyncComplete, setIsInitialSyncComplete] = useState(false)
  const { addToSyncQueue } = useSyncQueue()

  // Check if Supabase is configured
  const isConfigured = isSupabaseConfigured()

  // Convert Supabase task to local task format
  const convertFromSupabase = useCallback((task: any): Task => {
    return {
      id: task.id,
      title: task.title,
      completed: task.completed,
      order: task.order,
      createdAt: new Date(task.created_at),
      pomodoros: task.pomodoros || 0,
      ...(task.completed_at && { completedAt: new Date(task.completed_at) }),
    }
  }, [])

  // Convert local task to Supabase format
  const convertToSupabase = useCallback((task: Task): any => {
    return {
      id: task.id,
      title: task.title,
      completed: task.completed,
      order: task.order,
      created_at: task.createdAt.toISOString(),
      pomodoros: task.pomodoros || 0,
      ...(task.completedAt && { completed_at: task.completedAt.toISOString() }),
    }
  }, [])

  // Fetch tasks from Supabase
  const fetchTasks = useCallback(async (): Promise<Task[]> => {
    if (!user || !isConfigured) return []

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("order", { ascending: true })

      if (error) throw error

      return (data || []).map(convertFromSupabase)
    } catch (error) {
      console.error("Error fetching tasks:", error)
      toast({
        title: "Failed to fetch tasks",
        description: "Could not retrieve your tasks from the server.",
        variant: "destructive",
      })
      return []
    }
  }, [user, isConfigured, convertFromSupabase, toast])

  // Add a task to Supabase
  const addTask = useCallback(
    (task: Task) => {
      if (!user || !isConfigured) return

      addToSyncQueue({
        table: "tasks",
        operation: "insert",
        data: {
          ...convertToSupabase(task),
          user_id: user.id,
        },
      })
    },
    [user, isConfigured, addToSyncQueue, convertToSupabase],
  )

  // Sync local tasks with Supabase
  const syncTasks = useCallback(
    async (localTasks: Task[]) => {
      if (!user || !isOnline || !isConfigured) return localTasks

      try {
        // Fetch remote tasks
        const remoteTasks = await fetchTasks()

        // Create maps for easier lookup
        const remoteTasksMap = new Map(remoteTasks.map((task) => [task.id, task]))
        const localTasksMap = new Map(localTasks.map((task) => [task.id, task]))

        // Tasks to be added to local storage (from remote)
        const tasksToAdd: Task[] = []

        // Tasks to be updated in local storage (from remote)
        const tasksToUpdate: Task[] = []

        // Tasks to be added to remote (from local)
        const tasksToAddRemote: Task[] = []

        // Tasks to be updated in remote (from local)
        const tasksToUpdateRemote: Task[] = []

        // Process remote tasks
        remoteTasks.forEach((remoteTask) => {
          const localTask = localTasksMap.get(remoteTask.id)

          if (!localTask) {
            // Task exists remotely but not locally - add to local
            tasksToAdd.push(remoteTask)
          } else {
            // Task exists in both places - check which is newer
            // For simplicity, we'll use the completed status as a heuristic
            // In a real app, you'd want to use timestamps or version numbers
            if (remoteTask.completed !== localTask.completed) {
              tasksToUpdate.push(remoteTask)
            }
          }
        })

        // Process local tasks
        localTasks.forEach((localTask) => {
          const remoteTask = remoteTasksMap.get(localTask.id)

          if (!remoteTask) {
            // Task exists locally but not remotely - add to remote
            tasksToAddRemote.push(localTask)
          } else {
            // Task exists in both places - check if local has updates
            // Again, using completed status as a simple heuristic
            if (
              localTask.completed !== remoteTask.completed ||
              localTask.title !== remoteTask.title ||
              localTask.pomodoros !== remoteTask.pomodoros
            ) {
              tasksToUpdateRemote.push(localTask)
            }
          }
        })

        // Add new remote tasks to local
        const updatedLocalTasks = [...localTasks]

        if (tasksToAdd.length > 0) {
          updatedLocalTasks.push(...tasksToAdd)
        }

        // Update existing tasks in local
        tasksToUpdate.forEach((task) => {
          const index = updatedLocalTasks.findIndex((t) => t.id === task.id)
          if (index !== -1) {
            updatedLocalTasks[index] = task
          }
        })

        // Add new local tasks to remote
        for (const task of tasksToAddRemote) {
          addToSyncQueue({
            table: "tasks",
            operation: "insert",
            data: {
              ...convertToSupabase(task),
              user_id: user.id,
            },
          })
        }

        // Update existing tasks in remote
        for (const task of tasksToUpdateRemote) {
          addToSyncQueue({
            table: "tasks",
            operation: "update",
            data: convertToSupabase(task),
          })
        }

        return updatedLocalTasks
      } catch (error) {
        console.error("Error syncing tasks:", error)
        return localTasks
      }
    },
    [user, isOnline, isConfigured, fetchTasks, addToSyncQueue, convertToSupabase, toast],
  )

  // Initial sync when user logs in
  const initialSync = useCallback(
    async (localTasks: Task[]) => {
      if (!user || !isOnline || isInitialSyncComplete || !isConfigured) return localTasks

      try {
        // Set a flag to indicate sync is in progress
        setIsInitialSyncComplete(true)

        // Limit the number of tasks to sync initially to prevent UI freezing
        const tasksToSync = localTasks.slice(0, 50) // Only sync up to 50 tasks initially
        const syncedTasks = await syncTasks(tasksToSync)

        // If there are more tasks, schedule them for later sync
        if (localTasks.length > 50) {
          setTimeout(() => {
            // Queue the remaining tasks for background sync
            const remainingTasks = localTasks.slice(50)
            remainingTasks.forEach((task) => {
              addTask(task)
            })
          }, 5000) // Wait 5 seconds before syncing remaining tasks
        }

        return syncedTasks
      } catch (error) {
        console.error("Error during initial sync:", error)
        setIsInitialSyncComplete(false) // Reset flag on error
        return localTasks
      }
    },
    [user, isOnline, isInitialSyncComplete, isConfigured, syncTasks, addTask],
  )

  // Update a task in Supabase
  const updateTask = useCallback(
    (task: Task) => {
      if (!user || !isConfigured) return

      addToSyncQueue({
        table: "tasks",
        operation: "update",
        data: convertToSupabase(task),
      })
    },
    [user, isConfigured, addToSyncQueue, convertToSupabase],
  )

  // Delete a task from Supabase
  const deleteTask = useCallback(
    (taskId: string) => {
      if (!user || !isConfigured) return

      addToSyncQueue({
        table: "tasks",
        operation: "delete",
        data: { id: taskId },
      })
    },
    [user, isConfigured, addToSyncQueue],
  )

  return {
    fetchTasks,
    syncTasks,
    initialSync,
    addTask,
    updateTask,
    deleteTask,
    isInitialSyncComplete,
  }
}
