import { useCallback, useMemo, useRef } from "react";

/**
 * Custom hook for creating memoized callbacks with deep comparison
 * @param callback - The function to memoize
 * @param deps - Dependencies array
 * @returns A memoized version of the callback
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): T {
  const depsRef = useRef(deps);
  const callbackRef = useRef(callback);

  // Update refs
  callbackRef.current = callback;
  depsRef.current = deps;

  return useCallback(
    ((...args: Parameters<T>) => {
      return callbackRef.current(...args);
    }) as T,
    deps
  );
}

/**
 * Custom hook for memoizing expensive computations
 * @param factory - The factory function
 * @param deps - Dependencies array
 * @returns The memoized value
 */
export function useMemoizedValue<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}

/**
 * Custom hook for memoizing objects to prevent unnecessary re-renders
 * @param obj - The object to memoize
 * @returns The memoized object
 */
export function useMemoizedObject<T extends object>(obj: T): T {
  return useMemo(() => obj, Object.values(obj));
}
