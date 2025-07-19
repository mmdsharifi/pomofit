import { useEffect, useRef, useState } from "react";

/**
 * Custom hook for intersection observer
 * @param options - Intersection observer options
 * @returns [ref, isIntersecting, entry]
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<Element>, boolean, IntersectionObserverEntry | null] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const ref = useRef<Element>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      setEntry(entry);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options]);

  return [ref, isIntersecting, entry];
}

/**
 * Custom hook for infinite scrolling
 * @param callback - Function to call when intersection occurs
 * @param options - Intersection observer options
 * @returns Object with ref and isIntersecting state
 */
export function useInfiniteScroll(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const [ref, isIntersecting, entry] = useIntersectionObserver(options);

  useEffect(() => {
    if (isIntersecting) {
      callback();
    }
  }, [isIntersecting, callback]);

  return { ref, isIntersecting };
}
