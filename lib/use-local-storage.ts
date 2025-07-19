"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Use a ref to track if this is the first render
  const isFirstRender = useRef(true);
  // Store initialValue in a ref to avoid dependency issues
  const initialValueRef = useRef(initialValue);
  // Debounce timer for localStorage writes
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize on first render only
  useEffect(() => {
    if (isFirstRender.current) {
      try {
        // Get from local storage by key
        const item = localStorage.getItem(key);
        // Parse stored json or if none return initialValue
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        // If error also return initialValue
        console.log(error);
      }
      isFirstRender.current = false;
    }
  }, [key]); // Only re-run if key changes

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage with debouncing.
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        // Save state immediately
        setStoredValue(valueToStore);

        // Debounce localStorage writes to reduce performance impact
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          // Save to local storage
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
        }, 100); // 100ms debounce
      } catch (error) {
        // A more advanced implementation would handle the error case
        console.log(error);
      }
    },
    [storedValue, key]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return [storedValue, setValue] as const;
}
