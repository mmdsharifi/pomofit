"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
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

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue((prevValue) => {
          const valueToStore =
            value instanceof Function ? value(prevValue) : value;
          latestValueRef.current = valueToStore;

          // Debounce localStorage writes
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }

          debounceTimerRef.current = setTimeout(() => {
            if (typeof window !== "undefined") {
              window.localStorage.setItem(key, JSON.stringify(valueToStore));
              debounceTimerRef.current = null;
            }
          }, 100);

          return valueToStore;
        });
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
