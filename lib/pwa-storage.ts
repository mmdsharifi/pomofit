/**
 * Enhanced local storage utility for PWA that handles offline scenarios
 */

// Queue for operations that need to be synced when back online
let operationsQueue: Array<{
  key: string
  value: any
  timestamp: number
}> = []

// Initialize the queue from storage
function initQueue() {
  if (typeof window === "undefined") return

  try {
    const savedQueue = localStorage.getItem("pwa-operations-queue")
    if (savedQueue) {
      operationsQueue = JSON.parse(savedQueue)
    }
  } catch (error) {
    console.error("Failed to initialize operations queue:", error)
  }
}

// Save the queue to storage
function saveQueue() {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("pwa-operations-queue", JSON.stringify(operationsQueue))
  } catch (error) {
    console.error("Failed to save operations queue:", error)
  }
}

// Process the queue when online
function processQueue() {
  if (operationsQueue.length === 0) return

  console.log(`Processing ${operationsQueue.length} queued operations`)

  // Sort by timestamp to process in order
  operationsQueue.sort((a, b) => a.timestamp - b.timestamp)

  // Process each operation
  operationsQueue.forEach((operation) => {
    try {
      localStorage.setItem(operation.key, JSON.stringify(operation.value))
    } catch (error) {
      console.error(`Failed to process operation for ${operation.key}:`, error)
    }
  })

  // Clear the queue
  operationsQueue = []
  saveQueue()
}

// Initialize when imported
if (typeof window !== "undefined") {
  initQueue()

  // Set up online/offline handlers
  window.addEventListener("online", () => {
    processQueue()
  })
}

/**
 * Enhanced getItem function that works offline
 */
export function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue

  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Failed to get item ${key}:`, error)
    return defaultValue
  }
}

/**
 * Enhanced setItem function that works offline
 */
export function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Failed to set item ${key}:`, error)

    // If in private browsing mode or storage is full, queue the operation
    operationsQueue.push({
      key,
      value,
      timestamp: Date.now(),
    })
    saveQueue()
  }
}

/**
 * Enhanced removeItem function that works offline
 */
export function removeItem(key: string): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Failed to remove item ${key}:`, error)
  }
}

/**
 * Check if storage is available
 */
export function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false

  try {
    const test = "__storage_test__"
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Get all keys in storage
 */
export function getAllKeys(): string[] {
  if (typeof window === "undefined") return []

  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      keys.push(key)
    }
  }
  return keys
}

/**
 * Clear all data in storage
 */
export function clearAll(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.clear()
  } catch (error) {
    console.error("Failed to clear storage:", error)
  }
}
