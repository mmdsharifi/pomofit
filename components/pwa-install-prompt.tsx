"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { isPWAInstalled } from "@/lib/register-sw";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (isPWAInstalled()) {
      return;
    }

    // Check if user previously dismissed the prompt
    const promptDismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (
      promptDismissed &&
      Date.now() - Number.parseInt(promptDismissed) < 7 * 24 * 60 * 60 * 1000
    ) {
      // If dismissed less than a week ago, don't show again
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install button
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Handle app installed event
    window.addEventListener("appinstalled", () => {
      console.log("PWA was installed");
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
        // Remember that user dismissed the prompt
        localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
      }
      // Clear the saved prompt since it can't be used again
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    });
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowInstallPrompt(false);
    // Remember that user dismissed the prompt
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  if (!showInstallPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 md:left-auto md:w-80">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">Install Pomofit</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleDismiss}
          aria-label="Close prompt"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Install Pomofit on your device for offline use and a better experience.
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDismiss}
          aria-label="Dismiss installation prompt"
        >
          Not now
        </Button>
        <Button
          size="sm"
          onClick={handleInstallClick}
          className="flex items-center gap-2"
          aria-label="Install application"
        >
          <Download className="h-4 w-4" />
          Install
        </Button>
      </div>
    </div>
  );
}
