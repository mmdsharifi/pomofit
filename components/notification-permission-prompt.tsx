"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell, X } from "lucide-react"
import { areNotificationsSupported, requestNotificationPermission } from "@/lib/notification-service"
import { useTimer } from "@/lib/timer-context"

export default function NotificationPermissionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const { notificationsEnabled, setNotificationsEnabled } = useTimer()

  useEffect(() => {
    // Only show the prompt if:
    // 1. Notifications are supported
    // 2. Permission is not already granted or denied
    // 3. Notifications are not already enabled
    // 4. User hasn't dismissed the prompt recently
    const shouldShowPrompt =
      areNotificationsSupported() &&
      Notification.permission === "default" &&
      !notificationsEnabled &&
      !localStorage.getItem("notification-prompt-dismissed")

    if (shouldShowPrompt) {
      // Delay showing the prompt to avoid overwhelming the user
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 5000) // Show after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [notificationsEnabled])

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission()
    if (granted) {
      setNotificationsEnabled(true)
    }
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setDismissed(true)
    setShowPrompt(false)
    // Remember that user dismissed the prompt for 7 days
    localStorage.setItem("notification-prompt-dismissed", Date.now().toString())
  }

  if (!showPrompt || dismissed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 md:left-auto md:w-80">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">Enable Notifications</h3>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleDismiss} aria-label="Close prompt">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Get notified when your Pomodoro sessions end, even when the app is in the background.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleDismiss} aria-label="Dismiss notification prompt">
          Not now
        </Button>
        <Button
          size="sm"
          onClick={handleEnableNotifications}
          className="flex items-center gap-2"
          aria-label="Enable notifications"
        >
          <Bell className="h-4 w-4" />
          Enable
        </Button>
      </div>
    </div>
  )
}
