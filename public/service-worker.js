// This is the service worker for the Pomofit PWA

const CACHE_NAME = "pomofit-cache-v2" // Increment cache version

// Assets to cache immediately on service worker install
const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/success-83493.mp3",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/favicon.ico",
  "/offline.html",
]

// Install event - precache key assets
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Install")

  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting()

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[ServiceWorker] Precaching assets")

        // Use individual cache.add() calls instead of cache.addAll()
        // This way, if one resource fails, it won't fail the entire precaching process
        return Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            cache.add(url).catch((error) => {
              console.error(`[ServiceWorker] Failed to cache: ${url}`, error)
              // Continue despite the error
              return Promise.resolve()
            }),
          ),
        )
      })
      .catch((error) => {
        console.error("[ServiceWorker] Precaching failed:", error)
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activate")

  // Claim clients to ensure the service worker controls all pages immediately
  event.waitUntil(self.clients.claim())

  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[ServiceWorker] Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

// Helper function to determine if a request should be cached
function shouldCache(url) {
  // Parse the URL
  const parsedUrl = new URL(url)

  // Don't cache API requests
  if (parsedUrl.pathname.startsWith("/api/")) {
    return false
  }

  // Don't cache Next.js chunks - let the browser handle these
  if (parsedUrl.pathname.includes("/_next/static/chunks/")) {
    return false
  }

  // Don't cache query parameters (dynamic routes)
  if (parsedUrl.search) {
    return false
  }

  // Cache static assets
  if (
    parsedUrl.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|mp3|json)$/i) ||
    parsedUrl.pathname.includes("/_next/static/")
  ) {
    return true
  }

  // Cache HTML pages
  if (parsedUrl.pathname === "/" || parsedUrl.pathname.endsWith("/")) {
    return true
  }

  // Default to not caching
  return false
}

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Handle only GET requests
  if (event.request.method !== "GET") {
    return
  }

  // Skip Next.js chunks - let the browser handle these normally
  if (event.request.url.includes("/_next/static/chunks/")) {
    return
  }

  // For HTML navigations, use a network-first strategy
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If we got a valid response, clone it and cache it
          if (networkResponse && networkResponse.status === 200) {
            const clonedResponse = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse)
            })
          }
          return networkResponse
        })
        .catch(() => {
          // If offline, try to serve from cache
          return caches.match(event.request).then((cacheResponse) => {
            // Return cached response or fallback to offline page
            return cacheResponse || caches.match("/offline.html")
          })
        }),
    )
    return
  }

  // For other requests, use a cache-first strategy
  event.respondWith(
    caches.match(event.request).then((cacheResponse) => {
      // Return cached response if available
      if (cacheResponse) {
        return cacheResponse
      }

      // Otherwise fetch from network
      return fetch(event.request)
        .then((networkResponse) => {
          // If we should cache this response and it's valid
          if (shouldCache(event.request.url) && networkResponse && networkResponse.status === 200) {
            const clonedResponse = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse)
            })
          }
          return networkResponse
        })
        .catch((error) => {
          console.error("[ServiceWorker] Fetch failed:", error)

          // For image requests, return a fallback image
          if (event.request.destination === "image") {
            return caches.match("/icons/icon-192x192.png")
          }

          // For other assets, just propagate the error
          throw error
        })
    }),
  )
})

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[ServiceWorker] Notification click received:", event)

  event.notification.close()

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
      })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes("/") && "focus" in client) {
            return client.focus()
          }
        }

        if (clients.openWindow) {
          return clients.openWindow("/")
        }
      }),
  )
})
