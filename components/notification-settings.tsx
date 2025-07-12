"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Bell, BellOff, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { areNotificationsSupported, requestNotificationPermission } from "@/lib/notification-service"
import { useTimer } from "@/lib/timer-context"

export default function NotificationSettings() {
  const { toast } = useToast()
  const { notificationsEnabled, setNotificationsEnabled } = useTimer()
  const [isSupported, setIsSupported] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | "unsupported">("default")

  // Check if notifications are supported
  useEffect(() => {
    setIsSupported(areNotificationsSupported())
    if (areNotificationsSupported()) {
      setPermissionStatus(Notification.permission)
    } else {
      setPermissionStatus("unsupported")
    }
  }, [])

  // Handle toggle notifications
  const handleToggleNotifications = async () => {
    if (!isSupported) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications.",
        variant: "destructive",
      })
      return
    }

    if (notificationsEnabled) {
      // Turn off notifications
      setNotificationsEnabled(false)
      toast({
        title: "Notifications disabled",
        description: "You won't receive notifications when timers complete.",
      })
      return
    }

    // Request permission if not already granted
    const granted = await requestNotificationPermission()
    if (granted) {
      setNotificationsEnabled(true)
      setPermissionStatus("granted")
      toast({
        title: "Notifications enabled",
        description: "You'll receive notifications when timers complete.",
      })
    } else {
      toast({
        title: "Permission denied",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive",
      })
    }
  }

  // Reset notification settings
  const handleResetNotifications = () => {
    setNotificationsEnabled(false)
    toast({
      title: "Notification settings reset",
      description: "Notification preferences have been reset to default.",
    })
  }

  if (!isSupported) {
    return (
      <div className="p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-2 mb-2">
          <BellOff className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Notifications</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Notifications are not supported in your browser.</p>
      </div>
    )
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-medium">Notifications</h3>
        </div>
        <Switch
          checked={notificationsEnabled}
          onCheckedChange={handleToggleNotifications}
          disabled={permissionStatus === "denied"}
          aria-label="Enable notifications"
        />
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {notificationsEnabled
          ? "You'll receive notifications when timers complete."
          : permissionStatus === "denied"
            ? "Notifications are blocked. Please update your browser settings."
            : "Enable notifications to be alerted when timers complete."}
      </p>

      <Button
        variant="outline"
        size="sm"
        className="w-full flex items-center gap-2"
        onClick={handleResetNotifications}
        aria-label="Reset notification settings"
      >
        <RefreshCw className="h-4 w-4" />
        Reset Notification Settings
      </Button>
    </div>
  )
}
