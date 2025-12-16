"use client";

import { useEffect } from "react";

export default function PerformanceMonitor() {
  useEffect(() => {
    // Monitor Core Web Vitals
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      // Monitor Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log("LCP:", lastEntry.startTime);

        // Send to analytics if needed
        if (lastEntry.startTime > 2500) {
          console.warn("LCP is too slow:", lastEntry.startTime);
        }
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

      // Monitor First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEventTiming;
          console.log("FID:", fidEntry.processingStart - fidEntry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ["first-input"] });

      // Monitor Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries() as LayoutShift[];
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        console.log("CLS:", clsValue);
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });

      // Monitor First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0];
        console.log("FCP:", firstEntry.startTime);
      });
      fcpObserver.observe({ entryTypes: ["first-contentful-paint"] });

      // Cleanup observers on unmount
      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
        fcpObserver.disconnect();
      };
    }
  }, []);

  return null; // This component doesn't render anything
}
