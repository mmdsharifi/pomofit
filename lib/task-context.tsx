"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { useLocalStorage } from "./use-local-storage"
import type { Task } from "@/types/task"
import { addTaskCompletion } from "./history-utils"
import { useTaskSync } from "./task-sync-service"
import { useAuth } from "./auth-context"
import { useOnlineStatus } from "./sync-utils"
import { toast } from "sonner"

interface TaskContextType {
  tasks: Task[]
  addTask: (title: string) => void
  removeTask: (id: string) => void
  toggleTask: (id: string) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  reorderTasks: (tasks: Task[]) => void
  currentTaskId: string | null
  setCurrentTaskId: (id: string | null) => void
  getNextTask: () => Task | null
  incrementTaskPomodoros: (id: string) => void
  getTaskPomodoroCount: (id: string) => number
  isSyncing: boolean
  manualSync: () => Promise<void>
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useLocalStorage<Task[]>("pomofit-tasks", [])
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const { user } = useAuth()
  const isOnline = useOnlineStatus()

  // Get task sync functions
  const {
    initialSync,
    addTask: addTaskToRemote,
    updateTask: updateTaskRemote,
    deleteTask: deleteTaskRemote,
  } = useTaskSync()

  // Helper function to get the next order for active tasks
  const getNextActiveTaskOrder = useCallback((taskList: Task[]) => {
    const activeTasks = taskList.filter((task) => !task.completed)
    return activeTasks.length > 0 ? Math.max(...activeTasks.map((task) => task.order)) + 1 : 1
  }, [])

  // Helper function to reorder active tasks sequentially
  const reorderActiveTasks = useCallback((taskList: Task[]) => {
    const activeTasks = taskList.filter((task) => !task.completed).sort((a, b) => a.order - b.order)
    const completedTasks = taskList.filter((task) => task.completed)

    // Reassign orders to active tasks sequentially
    const reorderedActiveTasks = activeTasks.map((task, index) => ({
      ...task,
      order: index + 1,
    }))

    return [...reorderedActiveTasks, ...completedTasks]
  }, [])

  // Manual sync function that users can trigger
  const manualSync = useCallback(async () => {
    toast({
      title: "Offline Mode",
      description: "Supabase integration is temporarily disabled. Working in offline mode only.",
    })
    return tasks
  }, [tasks, toast])

  const addTask = useCallback(
    (title: string) => {
      const nextOrder = getNextActiveTaskOrder(tasks)

      const newTask: Task = {
        id: crypto.randomUUID(),
        title,
        completed: false,
        order: nextOrder,
        createdAt: new Date(),
        pomodoros: 0,
      }

      setTasks((prev) => [...prev, newTask])

      // Queue sync operation instead of doing it immediately
      // Sync disabled temporarily
      // if (user) {
      //   queueSyncOperation(async () => {
      //     await addTaskToRemote(newTask)
      //   })
      // }
    },
    [tasks, setTasks, user, addTaskToRemote, getNextActiveTaskOrder],
  )

  const removeTask = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const updatedTasks = prev.filter((task) => task.id !== id)
        // Reorder active tasks after removal
        return reorderActiveTasks(updatedTasks)
      })

      // Queue sync operation
      // Sync disabled temporarily
      // if (user) {
      //   queueSyncOperation(async () => {
      //     await deleteTaskRemote(id)
      //   })
      // }
    },
    [setTasks, user, deleteTaskRemote, reorderActiveTasks],
  )

  const updateTask = useCallback(
    (id: string, updates: Partial<Task>) => {
      setTasks((prev) => {
        const updatedTasks = prev.map((task) => (task.id === id ? { ...task, ...updates } : task))

        // Queue sync operation
        // Sync disabled temporarily
        // if (user) {
        //   const updatedTask = updatedTasks.find((task) => task.id === id)
        //   if (updatedTask) {
        //     queueSyncOperation(async () => {
        //       await updateTaskRemote(updatedTask)
        //     })
        //   }
        // }

        return updatedTasks
      })
    },
    [setTasks, user, updateTaskRemote],
  )

  const toggleTask = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const task = prev.find((t) => t.id === id)
        if (!task) return prev

        // Determine if we're completing or uncompleting the task
        const newCompleted = !task.completed

        // If completing the task, add completion timestamp and log to history
        const updatedTask = {
          ...task,
          completed: newCompleted,
          completedAt: newCompleted ? new Date() : undefined,
        }

        // Log task completion to history if we're marking it as completed
        if (newCompleted) {
          try {
            addTaskCompletion(id, task.title)
          } catch (error) {
            console.error("Failed to log task completion:", error)
          }
        }

        let newTasks = prev.map((t) => (t.id === id ? updatedTask : t))

        // If we're completing a task, reorder active tasks
        if (newCompleted) {
          newTasks = reorderActiveTasks(newTasks)
        } else {
          // If we're uncompleting a task, assign it the next available order
          const nextOrder = getNextActiveTaskOrder(newTasks.filter((t) => t.id !== id))
          newTasks = newTasks.map((t) => (t.id === id ? { ...t, order: nextOrder } : t))
        }

        // If the task was marked as completed and it was the current task,
        // set the next incomplete task as the current task
        if (newCompleted && id === currentTaskId) {
          const nextTask = getNextIncompleteTask(newTasks, id)
          if (nextTask) {
            // Use setTimeout to avoid state updates during render
            setTimeout(() => {
              setCurrentTaskId(nextTask.id)
            }, 0)
          }
        }

        // Queue sync operation
        // Sync disabled temporarily
        // if (user) {
        //   queueSyncOperation(async () => {
        //     await updateTaskRemote(updatedTask)
        //   })
        // }

        return newTasks
      })
    },
    [setTasks, currentTaskId, user, updateTaskRemote, reorderActiveTasks, getNextActiveTaskOrder],
  )

  const incrementTaskPomodoros = useCallback(
    (id: string) => {
      if (!id) {
        console.warn("No task ID provided to incrementTaskPomodoros")
        return
      }

      console.log(`Incrementing pomodoro count for task: ${id}`)

      setTasks((prev) => {
        // Find the task
        const task = prev.find((t) => t.id === id)
        if (!task) {
          console.warn(`Task not found: ${id}`)
          return prev
        }

        // Create a new array with the updated task
        const newTasks = prev.map((t) => {
          if (t.id === id) {
            const newCount = (t.pomodoros || 0) + 1
            console.log(`Updated pomodoro count for ${t.title}: ${newCount}`)
            const updatedTask = {
              ...t,
              pomodoros: newCount,
            }

            // Queue sync operation
            // Sync disabled temporarily
            // if (user) {
            //   queueSyncOperation(async () => {
            //     await updateTaskRemote(updatedTask)
            //   })
            // }

            return updatedTask
          }
          return t
        })

        return newTasks
      })
    },
    [setTasks, user, updateTaskRemote],
  )

  // New function to get the pomodoro count for a specific task
  const getTaskPomodoroCount = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id)
      return task?.pomodoros || 0
    },
    [tasks],
  )

  const getNextIncompleteTask = (taskList: Task[], currentId: string): Task | null => {
    const incompleteTasks = taskList
      .filter((task) => !task.completed && task.id !== currentId)
      .sort((a, b) => a.order - b.order)

    return incompleteTasks.length > 0 ? incompleteTasks[0] : null
  }

  const getNextTask = useCallback(() => {
    const incompleteTasks = tasks.filter((task) => !task.completed).sort((a, b) => a.order - b.order)

    return incompleteTasks.length > 0 ? incompleteTasks[0] : null
  }, [tasks])

  const reorderTasks = useCallback(
    (newTasks: Task[]) => {
      // Only reorder active tasks, keep completed tasks as they are
      const activeTasks = newTasks.filter((task) => !task.completed)
      const completedTasks = tasks.filter((task) => task.completed)

      // Reassign orders to active tasks based on their new positions
      const reorderedActiveTasks = activeTasks.map((task, index) => ({
        ...task,
        order: index + 1,
      }))

      const finalTasks = [...reorderedActiveTasks, ...completedTasks]
      setTasks(finalTasks)

      // Queue sync operations for each task
      // Sync disabled temporarily
      // if (user) {
      //   reorderedActiveTasks.forEach((task) => {
      //     queueSyncOperation(async () => {
      //       await updateTaskRemote(task)
      //     })
      //   })
      // }
    },
    [setTasks, tasks, user, updateTaskRemote],
  )

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        removeTask,
        toggleTask,
        updateTask,
        reorderTasks,
        currentTaskId,
        setCurrentTaskId,
        getNextTask,
        incrementTaskPomodoros,
        getTaskPomodoroCount,
        isSyncing,
        manualSync,
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error("useTasks must be used within a TaskProvider")
  }
  return context
}
