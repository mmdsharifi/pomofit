"use client";

import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Battery, Zap } from "lucide-react";

export default function PerformanceMonitor() {
  const [performanceData, setPerformanceData] = useState({
    memoryUsage: 0,
    cpuUsage: 0,
    batteryLevel: 0,
    isLowPowerMode: false,
  });
  const [showWarning, setShowWarning] = useState(false);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    // Only run in development or when explicitly enabled
    if (
      process.env.NODE_ENV !== "development" &&
      !process.env.NEXT_PUBLIC_ENABLE_PERF_MONITOR
    ) {
      return;
    }

    const updatePerformanceData = () => {
      const newData: typeof performanceData = {
        memoryUsage: 0,
        cpuUsage: 0,
        batteryLevel: 0,
        isLowPowerMode: false,
      };

      // Memory usage (if available)
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        newData.memoryUsage = Math.round(
          (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        );
      }

      // CPU usage estimation based on frame rate
      const now = performance.now();
      const deltaTime = now - lastTimeRef.current;
      frameCountRef.current++;

      if (deltaTime >= 1000) {
        const fps = frameCountRef.current / (deltaTime / 1000);
        newData.cpuUsage = Math.max(0, Math.min(100, 100 - fps * 2)); // Rough estimation
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      // Battery level (if available)
      if ("getBattery" in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          newData.batteryLevel = Math.round(battery.level * 100);
          newData.isLowPowerMode =
            battery.charging === false && battery.level < 0.2;
        });
      }

      setPerformanceData(newData);

      // Show warning if performance is poor
      const isPoorPerformance =
        newData.memoryUsage > 80 || newData.cpuUsage > 70;
      setShowWarning(isPoorPerformance);

      // Request next frame
      requestAnimationFrame(updatePerformanceData);
    };

    const animationId = requestAnimationFrame(updatePerformanceData);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Don't render anything if not in development
  if (
    process.env.NODE_ENV !== "development" &&
    !process.env.NEXT_PUBLIC_ENABLE_PERF_MONITOR
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {showWarning && (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          High Energy Usage
        </Badge>
      )}

      <div className="bg-background border rounded-lg p-2 space-y-1 text-xs">
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          <span>CPU: {performanceData.cpuUsage}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Battery className="h-3 w-3" />
          <span>Memory: {performanceData.memoryUsage}%</span>
        </div>
        {performanceData.batteryLevel > 0 && (
          <div className="flex items-center gap-1">
            <Battery className="h-3 w-3" />
            <span>Battery: {performanceData.batteryLevel}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
