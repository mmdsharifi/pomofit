"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { isPWAInstalled } from "@/lib/register-sw";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const STORAGE_KEY = "pwa-prompt-dismissed";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

type GlobalWithStorage = typeof globalThis & {
  localStorage?: StorageLike | null;
};

type WindowWithDescriptor = Window & {
  localStorage?: StorageLike;
};

const getWindowStorage = (): StorageLike | null => {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage as StorageLike;
  }
  return null;
};

const getGlobalStorage = (): StorageLike | null => {
  if (typeof globalThis === "undefined") return null;
  const store = (globalThis as GlobalWithStorage).localStorage;
  return store ?? null;
};

const getDescriptorStorage = (): StorageLike | null => {
  if (typeof window === "undefined") return null;
  const descriptor = Object.getOwnPropertyDescriptor(
    window as WindowWithDescriptor,
    "localStorage"
  );
  const candidate = descriptor?.value as StorageLike | undefined;
  if (candidate && typeof candidate.setItem === "function") {
    return candidate;
  }
  return null;
};

const readDismissedAt = () =>
  getWindowStorage()?.getItem(STORAGE_KEY) ??
  getGlobalStorage()?.getItem(STORAGE_KEY) ??
  getDescriptorStorage()?.getItem(STORAGE_KEY) ??
  null;

const writeDismissedFlag = () => {
  const value = Date.now().toString();
  const seen = new Set<StorageLike>();
  [getWindowStorage(), getGlobalStorage(), getDescriptorStorage()].forEach(
    (store) => {
      if (!store || seen.has(store)) return;
      seen.add(store);
      store.setItem(STORAGE_KEY, value);
    }
  );
};

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (isPWAInstalled()) {
      return;
    }

    const promptDismissed = readDismissedAt();
    if (
      promptDismissed &&
      Date.now() - Number.parseInt(promptDismissed) < 7 * 24 * 60 * 60 * 1000
    ) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      console.log("PWA was installed");
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
        writeDismissedFlag();
      }
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    });
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowInstallPrompt(false);
    writeDismissedFlag();
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
