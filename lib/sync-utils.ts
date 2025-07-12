"use client"

import { createClient } from "@/lib/supabase-client"
import { useAuth } from "@/lib/auth-context"
import { useEffect, useState, useCallback, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import { isSupabaseConfigured } from "@/lib/supabase-utils"

// Type for sync operations
export type SyncOperation = {
  id: string
  table: string
  operation: "insert" | "update" | "delete"
  data: any
  timestamp: number
  synced: boolean
}

// Hook to detect online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}

// Hook to manage sync queue
export function useSyncQueue() {
  const { user } = useAuth()
  const isOnline = useOnlineStatus()
  const { toast } = useToast()
  const [isSyncing, setIsSyncing] = useState(false)

  // Check if Supabase is configured
  const isConfigured = isSupabaseConfigured()

  // Get sync queue from localStorage
  const getSyncQueue = useCallback((): SyncOperation[] => {
    if (typeof window === "undefined") return []

    try {
      const queue = localStorage.getItem("pomofit-sync-queue")
      return queue ? JSON.parse(queue) : []
    } catch (error) {
      console.error("Failed to get sync queue:", error)
      return []
    }
  }, [])

  // Save sync queue to localStorage
  const saveSyncQueue = useCallback((queue: SyncOperation[]) => {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem("pomofit-sync-queue", JSON.stringify(queue))
    } catch (error) {
      console.error("Failed to save sync queue:", error)
    }
  }, [])

  // Process the sync queue
  const processQueue = useCallback(async () => {
    if (!user || !isOnline || isSyncing || !isConfigured) return

    const queue = getSyncQueue()
    if (queue.length === 0) return

    setIsSyncing(true)

    try {
      // Process only a limited number of operations at once
      const BATCH_SIZE = 10
      const operationsToProcess = queue.filter((op) => !op.synced).slice(0, BATCH_SIZE)

      if (operationsToProcess.length === 0) {
        setIsSyncing(false)
        return
      }

      // Group operations by table for batch processing
      const operationsByTable: Record<string, SyncOperation[]> = {}

      operationsToProcess.forEach((op) => {
        if (!operationsByTable[op.table]) {
          operationsByTable[op.table] = []
        }
        operationsByTable[op.table].push(op)
      })

      // Process each table's operations
      for (const [table, operations] of Object.entries(operationsByTable)) {
        for (const op of operations) {
          try {
            const supabase = createClient()

            switch (op.operation) {
              case "insert":
                await supabase.from(table).insert({
                  ...op.data,
                  user_id: user.id,
                })
                break

              case "update":
                await supabase.from(table).update(op.data).eq("id", op.data.id).eq("user_id", user.id)
                break

              case "delete":
                await supabase.from(table).delete().eq("id", op.data.id).eq("user_id", user.id)
                break
            }

            // Mark as synced
            op.synced = true
          } catch (error) {
            console.error(`Failed to sync operation ${op.id}:`, error)
          }
        }
      }

      // Update the queue with synced operations
      const updatedQueue = [...queue]
      operationsToProcess.forEach((op) => {
        const index = updatedQueue.findIndex((item) => item.id === op.id)
        if (index !== -1) {
          updatedQueue[index] = op
        }
      })

      saveSyncQueue(updatedQueue)

      // If there are more operations to process, schedule them for later
      if (updatedQueue.filter((op) => !op.synced).length > 0) {
        setTimeout(() => processQueue(), 1000) // Process next batch after 1 second
      } else {
        toast({
          title: "Data synchronized",
          description: `Successfully synced all items.`,
        })
      }
    } catch (error) {
      console.error("Error processing sync queue:", error)
      toast({
        title: "Sync error",
        description: "There was an error syncing your data. Will try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }, [user, isOnline, isSyncing, isConfigured, getSyncQueue, saveSyncQueue, toast])

  // Add a debounce mechanism to the addToSyncQueue function
  const pendingOperations = useRef<{ [key: string]: NodeJS.Timeout }>({})

  const addToSyncQueue = useCallback(
    (operation: Omit<SyncOperation, "id" | "timestamp" | "synced">) => {
      if (!user) return

      // Create a key for this operation to identify duplicates
      const opKey = `${operation.table}-${operation.operation}-${operation.data.id || "new"}`

      // Clear any pending operation with the same key
      if (pendingOperations.current[opKey]) {
        clearTimeout(pendingOperations.current[opKey])
      }

      // Debounce the operation
      pendingOperations.current[opKey] = setTimeout(() => {
        const queue = getSyncQueue()
        const newOperation: SyncOperation = {
          id: crypto.randomUUID(),
          ...operation,
          timestamp: Date.now(),
          synced: false,
        }

        saveSyncQueue([...queue, newOperation])

        // If online, try to sync immediately
        if (isOnline && isConfigured) {
          processQueue()
        }

        // Remove from pending operations
        delete pendingOperations.current[opKey]
      }, 300) // 300ms debounce
    },
    [user, isOnline, isConfigured, getSyncQueue, saveSyncQueue, processQueue],
  )

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && user && isConfigured) {
      processQueue()
    }
  }, [isOnline, user, isConfigured, processQueue])

  return {
    addToSyncQueue,
    processQueue,
    isSyncing,
    isOnline,
  }
}
