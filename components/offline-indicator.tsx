"use client";

import React from "react";
import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    // Function to check online status
    const checkOnlineStatus = () => {
      setOffline(!navigator.onLine);
    };

    // Set initial online status
    checkOnlineStatus();

    // Handle online/offline events
    window.addEventListener("online", checkOnlineStatus);
    window.addEventListener("offline", checkOnlineStatus);

    return () => {
      window.removeEventListener("online", checkOnlineStatus);
      window.removeEventListener("offline", checkOnlineStatus);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-yellow-500 text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 shadow-lg">
      <WifiOff className="h-3.5 w-3.5" />
      <span>You&apos;re offline. The app will continue to work.</span>
    </div>
  );
}
