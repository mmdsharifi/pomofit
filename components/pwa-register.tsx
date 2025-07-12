"use client"

import { useEffect, useState } from "react"
import { registerServiceWorker } from "@/lib/register-sw"
import { useToast } from "@/components/ui/use-toast"

export default function PWARegister() {
  const { toast } = useToast()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Prevent multiple initializations
    if (initialized) return

    // Register service worker
    registerServiceWorker()

    // Handle online/offline events
    const handleOnline = () => {
      toast({
        title: "You're back online",
        description: "Your changes will now be synchronized.",
        duration: 3000,
      })
    }

    const handleOffline = () => {
      toast({
        title: "You're offline",
        description: "The app will continue to work, but changes won't be synchronized until you're back online.",
        duration: 5000,
      })
    }

    // Only add event listeners if we're in the browser
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)
      setInitialized(true)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
      }
    }
  }, [toast, initialized])

  return null
}
