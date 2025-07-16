"use client";

import { useEffect, useState } from "react";
import { registerServiceWorker } from "@/lib/register-sw";
import { useToast } from "@/components/ui/use-toast";

export default function PWARegister() {
  const { toast } = useToast();

  useEffect(() => {
    console.log("About to call registerServiceWorker in PWARegister");
    // Register service worker (idempotent)
    registerServiceWorker();

    // Handle online/offline events
    const handleOnline = () => {
      console.log("handleOnline called");
      toast({
        title: "You're back online",
        description: "Your changes will now be synchronized.",
        duration: 3000,
      });
    };

    const handleOffline = () => {
      console.log("handleOffline called");
      toast({
        title: "You're offline",
        description:
          "The app will continue to work, but changes won't be synchronized until you're back online.",
        duration: 5000,
      });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  return null;
}
