"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function ServiceWorkerErrorHandler() {
  const { toast } = useToast();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Listen for service worker errors
    const handleError = (event: ErrorEvent) => {
      if (event.filename && event.filename.includes("service-worker.js")) {
        console.warn("[ServiceWorker] Error detected:", event.message);
        setHasError(true);

        // Show a toast notification
        toast({
          title: "Service Worker Issue",
          description:
            "Some offline features may not work. Please reload the page.",
          duration: 5000,
        });
      }
    };

    // Listen for unhandled promise rejections (common with service workers)
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.toString().includes("service-worker")) {
        console.warn("[ServiceWorker] Promise rejection:", event.reason);
        setHasError(true);

        // Show a toast notification
        toast({
          title: "Service Worker Issue",
          description:
            "Some offline features may not work. Please reload the page.",
          duration: 5000,
        });
      }
    };

    // Listen for chunk loading errors
    const handleChunkError = (event: ErrorEvent) => {
      if (event.message && event.message.includes("ChunkLoadError")) {
        console.warn("[Chunk] Loading error:", event.message);

        // Show a toast notification
        toast({
          title: "Resource Loading Issue",
          description: "Failed to load some resources. Please reload the page.",
          duration: 5000,
        });
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("error", handleChunkError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("error", handleChunkError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [toast]);

  // If there's an error with the service worker, show a reload button
  if (hasError) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4">
        <h3 className="font-medium mb-2">Service Worker Issue</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Some offline features may not work properly.
        </p>
        <button
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm"
          onClick={() => window.location.reload()}
          aria-label="Reload page"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return null;
}
