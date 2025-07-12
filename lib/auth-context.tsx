"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"

// Mock user type to maintain compatibility
interface User {
  id: string
  email: string
}

interface AuthContextType {
  user: User | null
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Set isLoading to false immediately since we're not using Supabase
  useState(() => {
    setIsLoading(false)
  })

  const signUp = async (email: string, password: string) => {
    // Mock sign up functionality
    toast({
      title: "Offline Mode",
      description: "Supabase integration is temporarily disabled. Working in offline mode only.",
    })
    throw new Error("Supabase integration is temporarily disabled")
  }

  const signIn = async (email: string, password: string) => {
    // Mock sign in functionality
    toast({
      title: "Offline Mode",
      description: "Supabase integration is temporarily disabled. Working in offline mode only.",
    })
    throw new Error("Supabase integration is temporarily disabled")
  }

  const signOut = async () => {
    // Mock sign out functionality
    setUser(null)
    toast({
      title: "Offline Mode",
      description: "Working in offline mode only. Supabase integration is temporarily disabled.",
    })
  }

  return <AuthContext.Provider value={{ user, signUp, signIn, signOut, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
