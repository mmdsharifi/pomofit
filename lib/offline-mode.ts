/**
 * This file provides utilities for offline mode when Supabase is disabled
 */

// Flag to indicate that we're in offline-only mode
export const OFFLINE_MODE = true

// Mock Supabase client that does nothing
export const createOfflineClient = () => {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ data: null, error: new Error("Offline mode: Supabase disabled") }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error("Offline mode: Supabase disabled") }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  }
}

// Helper function to log offline mode messages
export function logOfflineMode(operation: string) {
  console.log(`[Offline Mode] ${operation} - Supabase integration is disabled`)
}
