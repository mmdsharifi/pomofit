"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_SYNC_EVENT = "pomofit-storage-sync";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Unique ID per hook instance to prevent echo loops
  const instanceIdRef = useRef<string>(Math.random().toString(36).substring(2, 9));

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Use a ref to track if this is the first render
  const isFirstRender = useRef(true);
  // Track latest value in a ref for unmount flush & stale closure prevention
  const latestValueRef = useRef<T>(storedValue);
  latestValueRef.current = storedValue;

  // Debounce timer for localStorage writes
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize on first render only
  useEffect(() => {
    if (isFirstRender.current) {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          setStoredValue(parsed);
          latestValueRef.current = parsed;
        }
      } catch (error) {
        console.error(`Error reading ${key} from localStorage:`, error);
      }
      isFirstRender.current = false;
    }
  }, [key]);

  // Listen for storage events (other tabs) and custom sync events (same tab)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const parsed = JSON.parse(e.newValue);
          setStoredValue(parsed);
          latestValueRef.current = parsed;
        } catch (error) {
          console.error(`Error parsing storage change for ${key}:`, error);
        }
      }
    };

    const handleCustomSync = (e: Event) => {
      const customEvent = e as CustomEvent<{
        key: string;
        value: T;
        senderId: string;
      }>;
      if (
        customEvent.detail &&
        customEvent.detail.key === key &&
        customEvent.detail.senderId !== instanceIdRef.current
      ) {
        setStoredValue(customEvent.detail.value);
        latestValueRef.current = customEvent.detail.value;
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
      window.addEventListener(STORAGE_SYNC_EVENT, handleCustomSync);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(STORAGE_SYNC_EVENT, handleCustomSync);
      }
    };
  }, [key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function
            ? value(latestValueRef.current)
            : value;

        latestValueRef.current = valueToStore;
        setStoredValue(valueToStore);

        // Dispatch custom sync event immediately for instant same-tab reactiveness
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent(STORAGE_SYNC_EVENT, {
              detail: {
                key,
                value: valueToStore,
                senderId: instanceIdRef.current,
              },
            })
          );
        }

        // Debounce localStorage writes
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem(key, JSON.stringify(valueToStore));
            } catch (error) {
              console.error(`Error setting ${key} in localStorage:`, error);
            }
            debounceTimerRef.current = null;
          }
        }, 100);
      } catch (error) {
        console.error(`Error setting ${key} in localStorage:`, error);
      }
    },
    [key]
  );

  // Flush pending write on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(
              key,
              JSON.stringify(latestValueRef.current)
            );
          } catch (error) {
            console.error(`Error flushing ${key} on unmount:`, error);
          }
        }
      }
    };
  }, [key]);

  return [storedValue, setValue] as const;
}
