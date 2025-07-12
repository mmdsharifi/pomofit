// A utility to manage sync operations and prevent browser freezing

// Flag to track if we're currently syncing
let isSyncingInProgress = false

// Queue for operations that need to be performed
const operationQueue: Array<() => Promise<void>> = []

// Maximum time a sync operation can take before being considered stuck
const MAX_SYNC_TIME = 5000 // 5 seconds

// Process the queue one operation at a time
export async function processSyncQueue() {
  if (isSyncingInProgress || operationQueue.length === 0) {
    return
  }

  isSyncingInProgress = true

  try {
    // Get the next operation
    const operation = operationQueue.shift()
    if (!operation) {
      isSyncingInProgress = false
      return
    }

    // Set a timeout to prevent operations from blocking too long
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Sync operation timed out"))
      }, MAX_SYNC_TIME)
    })

    // Execute the operation with a timeout
    await Promise.race([operation(), timeoutPromise])
  } catch (error) {
    console.error("Error in sync operation:", error)
  } finally {
    isSyncingInProgress = false

    // Schedule the next operation with a delay to prevent UI freezing
    if (operationQueue.length > 0) {
      setTimeout(() => {
        processSyncQueue()
      }, 300) // 300ms delay between operations
    }
  }
}

// Add an operation to the queue
export function queueSyncOperation(operation: () => Promise<void>) {
  operationQueue.push(operation)

  // Start processing if not already in progress
  if (!isSyncingInProgress) {
    processSyncQueue()
  }
}

// Clear all pending operations
export function clearSyncQueue() {
  operationQueue.length = 0
}

// Get the number of pending operations
export function getPendingOperationsCount() {
  return operationQueue.length
}

// Check if sync is in progress
export function isSyncing() {
  return isSyncingInProgress
}
