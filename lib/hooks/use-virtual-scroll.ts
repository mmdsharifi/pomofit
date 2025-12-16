import React, { useState, useEffect, useRef, useCallback } from "react";

interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface VirtualScrollReturn<T> {
  virtualItems: T[];
  totalHeight: number;
  startIndex: number;
  endIndex: number;
  scrollTop: number;
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Custom hook for virtual scrolling
 * @param items - Array of items to virtualize
 * @param options - Virtual scroll options
 * @returns Virtual scroll data and refs
 */
export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
): VirtualScrollReturn<T> {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const virtualItems = items.slice(startIndex, endIndex);

  const handleScroll = useCallback((event: Event) => {
    const target = event.target;
    if (target instanceof HTMLElement) {
      setScrollTop(target.scrollTop);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  return {
    virtualItems,
    totalHeight,
    startIndex,
    endIndex,
    scrollTop,
    containerRef,
  };
}

/**
 * Custom hook for windowed list rendering
 * @param items - Array of items
 * @param itemHeight - Height of each item
 * @param containerHeight - Height of the container
 * @returns Windowed list data
 */
export function useWindowedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  return useVirtualScroll(items, {
    itemHeight,
    containerHeight,
    overscan: 3,
  });
}
