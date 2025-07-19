import {
  AIInsightsAnalyzer,
  generateUserInsights,
  getInsightEmoji,
  formatInsightMessage,
} from "@/lib/ai-insights";
import { Task } from "@/types/task";
import type { TaskHistory, TimerSession } from "@/lib/ai-insights";

describe("AI Insights", () => {
  const mockTasks: Task[] = [
    {
      id: "1",
      title: "Complete project",
      completed: true,
      order: 1,
      createdAt: new Date("2024-01-15T10:00:00Z"),
      pomodoros: 2,
    },
    {
      id: "2",
      title: "Review code",
      completed: false,
      order: 2,
      createdAt: new Date("2024-01-15T11:00:00Z"),
      pomodoros: 1,
    },
  ];

  const mockHistory: TaskHistory[] = [
    {
      id: "history-1",
      taskId: "1",
      completedAt: new Date("2024-01-15T10:30:00Z"),
      duration: 25,
    },
  ];

  const mockSessions: TimerSession[] = [
    {
      id: "session-1",
      startTime: new Date("2024-01-15T10:00:00Z"),
      endTime: new Date("2024-01-15T10:25:00Z"),
      duration: 25,
      taskId: "1",
    },
    {
      id: "session-2",
      startTime: new Date("2024-01-15T11:00:00Z"),
      endTime: new Date("2024-01-15T11:15:00Z"),
      duration: 15,
      taskId: "2",
    },
  ];

  describe("AIInsightsAnalyzer", () => {
    let analyzer: AIInsightsAnalyzer;

    beforeEach(() => {
      analyzer = new AIInsightsAnalyzer(mockTasks, mockHistory, mockSessions);
    });

    it("should calculate productivity score correctly", () => {
      const score = (analyzer as any).calculateProductivityScore();
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should analyze focus trends", () => {
      const trends = (analyzer as any).analyzeFocusTrends();
      expect(trends).toHaveProperty("bestTimeOfDay");
      expect(trends).toHaveProperty("averageSessionLength");
      expect(trends).toHaveProperty("completionRate");
      expect(trends).toHaveProperty("mostProductiveDay");
    });

    it("should generate recommendations", async () => {
      const recommendations = await (analyzer as any).generateRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it("should calculate weekly progress", () => {
      const progress = (analyzer as any).calculateWeeklyProgress();
      expect(progress).toHaveProperty("tasksCompleted");
      expect(progress).toHaveProperty("totalSessions");
      expect(progress).toHaveProperty("averageFocusTime");
      expect(progress).toHaveProperty("improvement");
    });

    it("should analyze patterns", () => {
      const patterns = (analyzer as any).analyzePatterns();
      expect(patterns).toHaveProperty("peakHours");
      expect(patterns).toHaveProperty("commonInterruptions");
      expect(patterns).toHaveProperty("taskCategories");
    });
  });

  describe("generateUserInsights", () => {
    it("should generate complete insights", async () => {
      const insights = await generateUserInsights(
        mockTasks,
        mockHistory,
        mockSessions
      );

      expect(insights).toHaveProperty("productivityScore");
      expect(insights).toHaveProperty("focusTrends");
      expect(insights).toHaveProperty("recommendations");
      expect(insights).toHaveProperty("weeklyProgress");
      expect(insights).toHaveProperty("patterns");
    });

    it("should handle empty data", async () => {
      const insights = await generateUserInsights([], [], []);

      expect(insights.productivityScore).toBe(0);
      expect(insights.recommendations.length).toBeGreaterThan(0);
    });

    it("should handle tasks with no sessions", async () => {
      const insights = await generateUserInsights(mockTasks, mockHistory, []);

      expect(insights.productivityScore).toBeGreaterThanOrEqual(0);
      expect(insights.focusTrends.averageSessionLength).toBe(0);
    });
  });

  describe("getInsightEmoji", () => {
    it("should return correct emojis for different types", () => {
      expect(getInsightEmoji("productivity")).toBe("📈");
      expect(getInsightEmoji("focus")).toBe("🎯");
      expect(getInsightEmoji("schedule")).toBe("⏰");
      expect(getInsightEmoji("health")).toBe("💪");
      expect(getInsightEmoji("unknown")).toBe("💡");
    });
  });

  describe("formatInsightMessage", () => {
    it("should format insight message correctly", () => {
      const insight = {
        type: "productivity" as const,
        title: "Test Title",
        description: "Test description",
        actionable: true,
        priority: "high" as const,
      };

      const message = formatInsightMessage(insight);
      expect(message).toContain("📈");
      expect(message).toContain("Test Title");
      expect(message).toContain("Test description");
    });
  });

  describe("Edge cases", () => {
    it("should handle single task", async () => {
      const singleTask = [mockTasks[0]];
      const insights = await generateUserInsights(
        singleTask,
        mockHistory,
        mockSessions
      );

      expect(insights.productivityScore).toBeGreaterThanOrEqual(0);
    });

    it("should handle tasks with no completion history", async () => {
      const incompleteTasks = mockTasks.map((task) => ({
        ...task,
        completed: false,
      }));
      const insights = await generateUserInsights(
        incompleteTasks,
        [],
        mockSessions
      );

      expect(insights.focusTrends.completionRate).toBe(0);
    });

    it("should handle sessions with very short durations", async () => {
      const shortSessions: TimerSession[] = [
        {
          id: "short-1",
          startTime: new Date(),
          duration: 1,
        },
      ];

      const insights = await generateUserInsights(
        mockTasks,
        mockHistory,
        shortSessions
      );
      expect(insights.focusTrends.averageSessionLength).toBe(1);
    });
  });
});
