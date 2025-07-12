// Notification service for Pomofit app

// Check if notifications are supported in this browser
export function areNotificationsSupported(): boolean {
  return "Notification" in window
}

// Check if notifications are currently enabled
export function areNotificationsEnabled(): boolean {
  if (!areNotificationsSupported()) return false
  return Notification.permission === "granted"
}

// Request notification permissions
export async function requestNotificationPermission(): Promise<boolean> {
  if (!areNotificationsSupported()) {
    console.log("Notifications not supported in this browser")
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission === "denied") {
    console.log("Notification permission previously denied")
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  } catch (error) {
    console.error("Error requesting notification permission:", error)
    return false
  }
}

// Send a notification
export function sendNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!areNotificationsEnabled()) {
    console.log("Notifications not enabled")
    return null
  }

  try {
    const notification = new Notification(title, {
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      ...options,
    })

    // Handle notification clicks
    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    return notification
  } catch (error) {
    console.error("Error sending notification:", error)
    return null
  }
}

// Send a timer completion notification
export function sendTimerNotification(mode: string, message?: string): Notification | null {
  const title =
    mode === "pomodoro" ? "Pomodoro Completed!" : mode === "shortBreak" ? "Short Break Ended" : "Long Break Ended"

  const body = message || (mode === "pomodoro" ? "Time to take a break!" : "Time to focus again!")

  return sendNotification(title, {
    body,
    vibrate: [200, 100, 200],
    tag: "pomofit-timer",
    renotify: true,
  })
}
