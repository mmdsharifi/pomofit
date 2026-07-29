import { useEffect, useCallback } from "react";
import {
  isPomodoroActive,
  isRestSessionActive,
  refreshAppData,
} from "@/lib/session";
import { STORAGE_KEYS } from "@/lib/constants";

const TASKS_STORAGE_KEY = STORAGE_KEYS.TASKS;
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Export these for testing
export const saveTasks = (tasks: any[]): void => {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Failed to save tasks", error);
  }
};

export const getTasks = (): any[] => {
  try {
    const tasks = localStorage.getItem(TASKS_STORAGE_KEY);
    return tasks ? JSON.parse(tasks) : [];
  } catch (error) {
    console.error("Failed to load tasks", error);
    return [];
  }
};

export function useDailyRefresh() {
  const handleRefresh = useCallback(async () => {
    try {
      // Save current tasks before refresh
      const currentTasks = getTasks();

      // Perform refresh
      await refreshAppData();

      // Restore tasks
      if (currentTasks.length > 0) {
        saveTasks(currentTasks);
      }
    } catch (error) {
      console.error("Failed to refresh app data:", error);
    }
  }, []);

  useEffect(() => {
    const calculateTimeUntilMidnight = (): number => {
      const now = new Date();
      const target = new Date(now);
      target.setHours(24, 0, 0, 0);
      return target.getTime() - now.getTime();
    };

    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    const checkAndRefresh = () => {
      if (!isPomodoroActive() && !isRestSessionActive()) {
        handleRefresh().finally(() => {
          // After successful refresh, schedule next refresh for next day
          const timeUntilMidnight = calculateTimeUntilMidnight();
          timeoutId = setTimeout(checkAndRefresh, timeUntilMidnight);
        });
      } else {
        // If session is active, check again after interval
        intervalId = setInterval(() => {
          if (!isPomodoroActive() && !isRestSessionActive()) {
            clearInterval(intervalId);
            checkAndRefresh();
          }
        }, CHECK_INTERVAL);
      }
    };

    // Initial schedule
    const timeUntilMidnight = calculateTimeUntilMidnight();
    timeoutId = setTimeout(checkAndRefresh, timeUntilMidnight);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [handleRefresh]);
}
