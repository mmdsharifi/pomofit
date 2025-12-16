export function registerServiceWorker() {
  if (typeof window === "undefined") return

  if ("serviceWorker" in navigator) {
    // Wait for the page to load
    window.addEventListener("load", () => {
      // Delay registration slightly to ensure page is fully loaded
      setTimeout(() => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("[ServiceWorker] Registration successful with scope:", registration.scope)

            // Check for updates
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    console.log("[ServiceWorker] New content is available; please refresh.")

                    // Optional: Show a notification to the user that an update is available
                    if (window.confirm("New version available! Reload to update?")) {
                      window.location.reload()
                    }
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.error("[ServiceWorker] Registration failed:", error)
            // Continue without service worker
          })
      }, 1000)
    })

    // Handle controller changes
    let refreshing = false
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })

    // Add error handling for service worker
    window.addEventListener("error", (event) => {
      if (event.filename && event.filename.includes("service-worker.js")) {
        console.warn("[ServiceWorker] Error in service worker, continuing without it:", event.message)
      }
    })
  }
}

// Function to check if the app is installed
export function isPWAInstalled() {
  if (typeof window === "undefined") return false

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean(navigatorWithStandalone.standalone) || // for iOS
    document.referrer.includes("android-app://")
  )
}

// Function to check if the app is online
export function isOnline() {
  if (typeof window === "undefined") return true

  return navigator.onLine
}
