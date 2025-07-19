import { useState, useCallback, useMemo, useRef, useEffect } from "react";

// Development-only hooks - not for production use
if (process.env.NODE_ENV === "production") {
  throw new Error("Virtual scroll hooks are not available in production");
}

interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface VirtualScrollReturn<T> {
  virtualItems: Array<{
    index: number;
    data: T;
    offsetTop: number;
  }>;
  totalHeight: number;
  startIndex: number;
  endIndex: number;
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Custom hook for virtual scrolling
 * @param items - Array of items to virtualize
 * @param options - Virtual scroll options
 * @returns Virtual scroll data and container ref
 */
export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
): VirtualScrollReturn<T> {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate virtual scroll data
  const virtualData = useMemo(() => {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    );
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const virtualItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i]) {
        virtualItems.push({
          index: i,
          data: items[i],
          offsetTop: i * itemHeight,
        });
      }
    }

    return {
      virtualItems,
      totalHeight: items.length * itemHeight,
      startIndex,
      endIndex,
    };
  }, [items, scrollTop, itemHeight, containerHeight, overscan]);

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  // Add scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScrollEvent = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener("scroll", handleScrollEvent);
    return () => container.removeEventListener("scroll", handleScrollEvent);
  }, []);

  return {
    ...virtualData,
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
