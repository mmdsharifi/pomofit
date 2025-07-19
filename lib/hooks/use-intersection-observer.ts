import { useEffect, useRef, useState, useCallback } from "react";

interface UseIntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

interface UseIntersectionObserverReturn {
  ref: React.RefObject<Element>;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

/**
 * Custom hook for intersection observer
 * @param options - Intersection observer options
 * @returns Object with ref, isIntersecting state, and entry
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const ref = useRef<Element>(null);

  const callback = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    setIsIntersecting(entry.isIntersecting);
    setEntry(entry);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(callback, options);
    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [callback, options]);

  return { ref, isIntersecting, entry };
}

/**
 * Custom hook for infinite scrolling
 * @param callback - Function to call when intersection occurs
 * @param options - Intersection observer options
 * @returns Object with ref and isIntersecting state
 */
export function useInfiniteScroll(
  callback: () => void,
  options: UseIntersectionObserverOptions = {}
) {
  const { ref, isIntersecting } = useIntersectionObserver(options);

  useEffect(() => {
    if (isIntersecting) {
      callback();
    }
  }, [isIntersecting, callback]);

  return { ref, isIntersecting };
}
