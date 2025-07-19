import React, { useEffect, useRef } from "react";

/**
 * Custom hook for debouncing values
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for throttling values
 * @param value - The value to throttle
 * @param limit - The throttle limit in milliseconds
 * @returns The throttled value
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastExecuted = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (throttledValue === value) return;
    const now = Date.now();
    if (lastExecuted.current === 0 || now - lastExecuted.current >= limit) {
      setThrottledValue(value);
      lastExecuted.current = now;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const remaining = limit - (now - lastExecuted.current);
      timeoutRef.current = setTimeout(() => {
        setThrottledValue(value);
        lastExecuted.current = Date.now();
      }, remaining);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, limit, throttledValue]);

  return throttledValue;
}
