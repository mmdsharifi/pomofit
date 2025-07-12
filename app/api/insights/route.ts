import { NextResponse } from "next/server"
import type { PomodoroSession } from "@/lib/history-utils"

export async function POST(request: Request) {
  try {
    const { sessions } = await request.json()

    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json({ error: "No session data provided" }, { status: 400 })
    }

    // Prepare session data for analysis
    const sessionData = sessions.map((session: PomodoroSession) => ({
      id: session.id,
      startTime: session.startTime,
      duration: session.duration,
      mode: session.mode,
      note: session.note || "",
      tags: session.tags || [],
      taskId: session.taskId || null,
      taskTitle: session.taskTitle || null,
    }))

    // Calculate basic statistics
    const pomodoroSessions = sessionData.filter((s) => s.mode === "pomodoro")
    const totalFocusTime = pomodoroSessions.reduce((sum, s) => sum + s.duration, 0)
    const averageSessionLength = pomodoroSessions.length > 0 ? totalFocusTime / pomodoroSessions.length : 0

    // Group sessions by hour of day
    const sessionsByHour: Record<number, number> = {}
    pomodoroSessions.forEach((session) => {
      const hour = new Date(session.startTime).getHours()
      sessionsByHour[hour] = (sessionsByHour[hour] || 0) + 1
    })

    // Find most productive hours (hours with most sessions)
    const productiveHours = Object.entries(sessionsByHour)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 3)
      .map(([hour, count]) => ({
        hour: Number(hour),
        count: Number(count),
        percentage: Math.round((Number(count) / pomodoroSessions.length) * 100),
      }))

    // Extract common tags
    const tagCounts: Record<string, number> = {}
    pomodoroSessions.forEach((session) => {
      if (session.tags && session.tags.length > 0) {
        session.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }
    })

    const commonTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: Math.round((count / pomodoroSessions.length) * 100),
      }))

    // Generate simple insights
    const insights = [
      {
        title: "Morning Productivity Peak",
        description: "You complete most of your focus sessions in the morning.",
        suggestion: "Schedule your most important tasks during this morning peak.",
        icon: "Clock",
      },
      {
        title: "Focus Session Length",
        description: `Your average focus session is ${Math.round(averageSessionLength / 60)} minutes.`,
        suggestion: "Try to maintain consistent session lengths for better productivity.",
        icon: "Focus",
      },
      {
        title: "Regular Breaks",
        description: "Taking regular breaks helps maintain productivity throughout the day.",
        suggestion: "Consider using the Pomodoro technique with consistent break intervals.",
        icon: "Brain",
      },
    ]

    // Return both raw statistics and insights
    return NextResponse.json({
      statistics: {
        totalSessions: pomodoroSessions.length,
        totalFocusTime,
        averageSessionLength,
        productiveHours,
        commonTags,
      },
      insights: insights,
    })
  } catch (error) {
    console.error("Error generating insights:", error)
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}
