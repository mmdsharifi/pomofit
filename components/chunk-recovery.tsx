"use client";

import { useEffect } from "react";

const CHUNK_ERROR_FLAG = "__pomofitChunkRecovered";
const ERROR_MATCHERS = [
  "ChunkLoadError",
  "loading chunk",
  "reading 'call'",
  "options.factory",
];

export default function ChunkRecovery() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const shouldReload = (message?: string) => {
      if (!message) return false;
      return ERROR_MATCHERS.some((matcher) => message.includes(matcher));
    };

    const triggerReload = () => {
      if (window.sessionStorage.getItem(CHUNK_ERROR_FLAG)) {
        window.sessionStorage.removeItem(CHUNK_ERROR_FLAG);
        return;
      }
      window.sessionStorage.setItem(CHUNK_ERROR_FLAG, "1");
      window.location.reload();
    };

    const handleErrorEvent = (event: ErrorEvent) => {
      const message = event?.error?.message || event?.message;
      if (shouldReload(message)) {
        triggerReload();
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      const message = typeof reason === "string" ? reason : reason?.message;
      if (shouldReload(message)) {
        triggerReload();
      }
    };

    window.addEventListener("error", handleErrorEvent);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleErrorEvent);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
