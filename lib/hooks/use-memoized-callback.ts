import { useCallback, useMemo, useRef } from "react";

/**
 * Custom hook for creating memoized callbacks with deep comparison
 * @param callback - The function to memoize
 * @param deps - Dependencies array
 * @returns A memoized version of the callback
 */
export function useMemoizedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: ReadonlyArray<unknown>
): T {
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, deps) as T;
}

/**
 * Custom hook for memoizing expensive computations
 * @param factory - The factory function
 * @param deps - Dependencies array
 * @returns The memoized value
 */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: ReadonlyArray<unknown>
): T {
  return useMemo(factory, deps);
}

/**
 * Custom hook for memoizing objects to prevent unnecessary re-renders
 * @param obj - The object to memoize
 * @returns The memoized object
 */
export function useMemoizedObject<T extends Record<string, unknown>>(obj: T): T {
  const valueRef = useRef(obj);
  const keysRef = useRef(Object.keys(obj));

  const keys = Object.keys(obj);
  const hasChanged =
    keysRef.current.length !== keys.length ||
    keys.some((key) => valueRef.current[key as keyof T] !== obj[key as keyof T]);

  if (hasChanged) {
    valueRef.current = obj;
    keysRef.current = keys;
  }

  return valueRef.current;
}
