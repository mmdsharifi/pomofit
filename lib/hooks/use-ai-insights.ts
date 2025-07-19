import { useState, useEffect, useCallback } from "react";
import { Task } from "@/types/task";
import {
  UserInsights,
  generateUserInsights,
  type TaskHistory,
  type TimerSession,
} from "@/lib/ai-insights";

interface UseAIInsightsProps {
  tasks: Task[];
  history: TaskHistory[];
  sessions: TimerSession[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseAIInsightsReturn {
  insights: UserInsights | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useAIInsights({
  tasks,
  history,
  sessions,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
}: UseAIInsightsProps): UseAIInsightsReturn {
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const generateInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userInsights = await generateUserInsights(tasks, history, sessions);
      setInsights(userInsights);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate insights"
      );
      console.error("Error generating AI insights:", err);
    } finally {
      setLoading(false);
    }
  }, [tasks, history, sessions]);

  const refresh = useCallback(async () => {
    await generateInsights();
  }, [generateInsights]);

  // Initial load
  useEffect(() => {
    if (tasks.length > 0 || sessions.length > 0) {
      generateInsights();
    }
  }, [generateInsights]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (tasks.length > 0 || sessions.length > 0) {
        generateInsights();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [
    autoRefresh,
    refreshInterval,
    generateInsights,
    tasks.length,
    sessions.length,
  ]);

  return {
    insights,
    loading,
    error,
    refresh,
    lastUpdated,
  };
}

// Hook for quick insights (lightweight version)
export function useQuickInsight(tasks: Task[], sessions: TimerSession[]) {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function generateQuickInsight() {
      if (tasks.length === 0 && sessions.length === 0) {
        setInsight(
          "Start by creating your first task to get personalized insights!"
        );
        return;
      }

      try {
        setLoading(true);

        // Create mock history for quick insights
        const mockHistory: TaskHistory[] = tasks
          .filter((task) => task.completed)
          .map((task) => ({
            id: `history-${task.id}`,
            taskId: task.id,
            completedAt: task.createdAt,
            duration: 25, // Default pomodoro duration
          }));

        const mockSessions: TimerSession[] = sessions.map((session, index) => ({
          id: `session-${index}`,
          startTime: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ), // Random time in last week
          duration: session.duration,
          taskId: session.taskId,
        }));

        const insights = await generateUserInsights(
          tasks,
          mockHistory,
          mockSessions
        );

        if (insights.recommendations.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * insights.recommendations.length
          );
          setInsight(insights.recommendations[randomIndex]);
        } else {
          setInsight(
            "Try starting your day with a 25-minute focus session for better productivity!"
          );
        }
      } catch (error) {
        console.error("Error generating quick insight:", error);
        setInsight("Take regular breaks to maintain mental clarity and focus.");
      } finally {
        setLoading(false);
      }
    }

    generateQuickInsight();
  }, [tasks, sessions]);

  return { insight, loading };
}

// Hook for productivity score
export function useProductivityScore(tasks: Task[], sessions: TimerSession[]) {
  const [score, setScore] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function calculateScore() {
      if (tasks.length === 0) {
        setScore(0);
        return;
      }

      try {
        setLoading(true);

        const mockHistory: TaskHistory[] = tasks
          .filter((task) => task.completed)
          .map((task) => ({
            id: `history-${task.id}`,
            taskId: task.id,
            completedAt: task.createdAt,
            duration: 25,
          }));

        const mockSessions: TimerSession[] = sessions.map((session, index) => ({
          id: `session-${index}`,
          startTime: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ),
          duration: session.duration,
          taskId: session.taskId,
        }));

        const insights = await generateUserInsights(
          tasks,
          mockHistory,
          mockSessions
        );
        setScore(insights.productivityScore);
      } catch (error) {
        console.error("Error calculating productivity score:", error);
        setScore(0);
      } finally {
        setLoading(false);
      }
    }

    calculateScore();
  }, [tasks, sessions]);

  return { score, loading };
}
