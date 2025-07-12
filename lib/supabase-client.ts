// Import the offline mode utilities
import { createOfflineClient, logOfflineMode } from "./offline-mode"

// Modify the createClient function to always return the offline client
export const createClient = () => {
  // Always return the offline client
  logOfflineMode("Creating Supabase client")
  return createOfflineClient()
}
