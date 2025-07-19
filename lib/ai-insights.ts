import { Task } from "@/types/task";

export interface TaskHistory {
  id: string;
  taskId: string;
  completedAt: Date;
  duration: number;
}

export interface TimerSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  taskId?: string;
}

export interface UserInsights {
  productivityScore: number;
  focusTrends: {
    bestTimeOfDay: string;
    averageSessionLength: number;
    completionRate: number;
    mostProductiveDay: string;
  };
  recommendations: string[];
  weeklyProgress: {
    tasksCompleted: number;
    totalSessions: number;
    averageFocusTime: number;
    improvement: number;
  };
  patterns: {
    peakHours: string[];
    commonInterruptions: string[];
    taskCategories: { [key: string]: number };
  };
}

export interface InsightAnalysis {
  type: "productivity" | "focus" | "schedule" | "health";
  title: string;
  description: string;
  actionable: boolean;
  priority: "high" | "medium" | "low";
  data?: any;
}

export class AIInsightsAnalyzer {
  private tasks: Task[];
  private history: TaskHistory[];
  private sessions: TimerSession[];

  constructor(tasks: Task[], history: TaskHistory[], sessions: TimerSession[]) {
    this.tasks = tasks;
    this.history = history;
    this.sessions = sessions;
  }

  async generateInsights(): Promise<UserInsights> {
    const productivityScore = this.calculateProductivityScore();
    const focusTrends = this.analyzeFocusTrends();
    const recommendations = await this.generateRecommendations();
    const weeklyProgress = this.calculateWeeklyProgress();
    const patterns = this.analyzePatterns();

    return {
      productivityScore,
      focusTrends,
      recommendations,
      weeklyProgress,
      patterns,
    };
  }

  private calculateProductivityScore(): number {
    if (this.tasks.length === 0) return 0;

    const completedTasks = this.tasks.filter((task) => task.completed).length;
    const totalTasks = this.tasks.length;
    const completionRate = completedTasks / totalTasks;

    const averageSessionLength =
      this.sessions.length > 0
        ? this.sessions.reduce((sum, session) => sum + session.duration, 0) /
          this.sessions.length
        : 0;

    const focusEfficiency = Math.min(averageSessionLength / 25, 1); // 25 minutes is ideal
    const consistency = this.calculateConsistency();

    return Math.round(
      (completionRate * 0.4 + focusEfficiency * 0.3 + consistency * 0.3) * 100
    );
  }

  private analyzeFocusTrends() {
    const sessionHours = this.sessions.map((session) => {
      const date = new Date(session.startTime);
      return date.getHours();
    });

    const hourCounts = sessionHours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number });

    const bestHour =
      Object.entries(hourCounts).length > 0
        ? Object.entries(hourCounts).reduce((a, b) =>
            hourCounts[Number(a[0])] > hourCounts[Number(b[0])] ? a : b
          )[0]
        : "9"; // Default to 9 AM if no sessions

    const averageSessionLength =
      this.sessions.length > 0
        ? this.sessions.reduce((sum, session) => sum + session.duration, 0) /
          this.sessions.length
        : 0;

    const completionRate =
      this.tasks.length > 0
        ? this.tasks.filter((task) => task.completed).length / this.tasks.length
        : 0;

    const dayOfWeekCounts = this.sessions.reduce((acc, session) => {
      const day = new Date(session.startTime).toLocaleDateString("en-US", {
        weekday: "long",
      });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const mostProductiveDay =
      Object.entries(dayOfWeekCounts).length > 0
        ? Object.entries(dayOfWeekCounts).reduce((a, b) =>
            dayOfWeekCounts[a[0]] > dayOfWeekCounts[b[0]] ? a : b
          )[0]
        : "Monday"; // Default to Monday if no sessions

    return {
      bestTimeOfDay: `${bestHour}:00`,
      averageSessionLength: Math.round(averageSessionLength),
      completionRate: Math.round(completionRate * 100),
      mostProductiveDay,
    };
  }

  private async generateRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];
    const insights = await this.generateDetailedInsights();

    insights.forEach((insight) => {
      if (insight.actionable && insight.priority === "high") {
        recommendations.push(insight.description);
      }
    });

    // Add default recommendations if none generated
    if (recommendations.length === 0) {
      recommendations.push(
        "Try starting your day with a 25-minute focus session",
        "Take regular breaks to maintain mental clarity",
        "Group similar tasks together for better efficiency"
      );
    }

    return recommendations.slice(0, 3); // Limit to top 3
  }

  private calculateWeeklyProgress() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentTasks = this.tasks.filter(
      (task) => new Date(task.createdAt) >= weekAgo
    );

    const recentSessions = this.sessions.filter(
      (session) => new Date(session.startTime) >= weekAgo
    );

    const tasksCompleted = recentTasks.filter((task) => task.completed).length;
    const totalSessions = recentSessions.length;
    const averageFocusTime =
      recentSessions.length > 0
        ? recentSessions.reduce((sum, session) => sum + session.duration, 0) /
          recentSessions.length
        : 0;

    // Calculate improvement (simplified)
    const improvement =
      totalSessions > 0 ? Math.min(totalSessions * 5, 100) : 0;

    return {
      tasksCompleted,
      totalSessions,
      averageFocusTime: Math.round(averageFocusTime),
      improvement,
    };
  }

  private analyzePatterns() {
    const sessionHours = this.sessions.map((session) => {
      const date = new Date(session.startTime);
      return date.getHours();
    });

    const hourCounts = sessionHours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number });

    const peakHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    const taskCategories = this.tasks.reduce((acc, task) => {
      const category = "General"; // Default category since Task doesn't have category property
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      peakHours,
      commonInterruptions: [
        "Phone notifications",
        "Email checking",
        "Social media",
      ],
      taskCategories,
    };
  }

  private calculateConsistency(): number {
    if (this.sessions.length < 2) return 0;

    const sessionDates = this.sessions.map((session) =>
      new Date(session.startTime).toDateString()
    );

    const uniqueDays = new Set(sessionDates).size;
    const totalDays = Math.ceil(
      (Date.now() -
        Math.min(
          ...this.sessions.map((s) => new Date(s.startTime).getTime())
        )) /
        (1000 * 60 * 60 * 24)
    );

    return Math.min(uniqueDays / Math.max(totalDays, 1), 1);
  }

  private async generateDetailedInsights(): Promise<InsightAnalysis[]> {
    const insights: InsightAnalysis[] = [];

    // Productivity insights
    const productivityScore = this.calculateProductivityScore();
    if (productivityScore < 50) {
      insights.push({
        type: "productivity",
        title: "Low Productivity Detected",
        description:
          "Your productivity score is below average. Try breaking tasks into smaller chunks.",
        actionable: true,
        priority: "high",
      });
    }

    // Focus insights
    const averageSessionLength =
      this.sessions.length > 0
        ? this.sessions.reduce((sum, session) => sum + session.duration, 0) /
          this.sessions.length
        : 0;

    if (averageSessionLength < 15) {
      insights.push({
        type: "focus",
        title: "Short Focus Sessions",
        description:
          "Your sessions are shorter than ideal. Try extending them gradually.",
        actionable: true,
        priority: "medium",
      });
    }

    // Schedule insights
    const { bestTimeOfDay } = this.analyzeFocusTrends();
    insights.push({
      type: "schedule",
      title: "Peak Performance Time",
      description: `You're most productive at ${bestTimeOfDay}. Schedule important tasks during this time.`,
      actionable: true,
      priority: "medium",
    });

    // Health insights
    const totalFocusTime = this.sessions.reduce(
      (sum, session) => sum + session.duration,
      0
    );
    if (totalFocusTime > 240) {
      // More than 4 hours
      insights.push({
        type: "health",
        title: "Extended Focus Time",
        description:
          "You've been focusing for a long time. Remember to take breaks for your well-being.",
        actionable: true,
        priority: "low",
      });
    }

    return insights;
  }
}

export async function generateUserInsights(
  tasks: Task[],
  history: TaskHistory[],
  sessions: TimerSession[]
): Promise<UserInsights> {
  const analyzer = new AIInsightsAnalyzer(tasks, history, sessions);
  return await analyzer.generateInsights();
}

export function getInsightEmoji(type: string): string {
  switch (type) {
    case "productivity":
      return "📈";
    case "focus":
      return "🎯";
    case "schedule":
      return "⏰";
    case "health":
      return "💪";
    default:
      return "💡";
  }
}

export function formatInsightMessage(insight: InsightAnalysis): string {
  const emoji = getInsightEmoji(insight.type);
  return `${emoji} ${insight.title}: ${insight.description}`;
}
