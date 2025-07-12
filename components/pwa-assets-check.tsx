"use client"

import { useEffect } from "react"

// This component checks if all PWA assets exist and logs any missing ones
export default function PWAAssetsCheck() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      const requiredAssets = [
        "/manifest.json",
        "/success-83493.mp3",
        "/icons/icon-192x192.png",
        "/icons/icon-512x512.png",
        "/favicon.ico", // This should be at the root of public
      ]

      // Check each asset
      Promise.all(
        requiredAssets.map((url) =>
          fetch(url, { method: "HEAD" })
            .then((response) => {
              if (!response.ok) {
                console.warn(`[PWA] Asset not found or error: ${url}`)
                return false
              }
              return true
            })
            .catch(() => {
              console.warn(`[PWA] Asset not found or error: ${url}`)
              return false
            }),
        ),
      ).then((results) => {
        const allExist = results.every(Boolean)
        if (allExist) {
          console.log("[PWA] All required assets exist")
        } else {
          console.warn("[PWA] Some required assets are missing")
        }
      })
    }
  }, [])

  return null
}
