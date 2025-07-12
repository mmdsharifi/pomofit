"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { getHistory } from "@/lib/history-utils"
import { BarChart, Clock, Calendar, Tag, Zap, Brain, TrendingUp, Focus, AlertCircle, CheckSquare } from "lucide-react"
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface InsightProps {
  title: string
  description: string
  suggestion: string
  icon: string
}

interface TaskWithSessions {
  taskTitle: string
  sessionCount: number
  totalDuration: number
  percentage: number
}

interface WeeklyData {
  day: string
  currentWeek: number
  previousWeek: number
}

interface ProductivityStatistics {
  totalSessions: number
  totalFocusTime: number
  averageSessionLength: number
  productiveHours: { hour: number; count: number; percentage: number }[]
  tasksWithMostSessions: TaskWithSessions[]
  weeklyComparison: WeeklyData[]
}

export default function ProductivityInsights() {
  const { toast } = useToast()
  const [insights, setInsights] = useState<InsightProps[]>([])
  const [statistics, setStatistics] = useState<ProductivityStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Helper function to get week start date
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  // Helper function to get day name
  const getDayName = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" })
  }

  // Calculate weekly comparison data
  const calculateWeeklyComparison = useMemo(() => {
    return (sessions: any[]) => {
      const now = new Date()
      const currentWeekStart = getWeekStart(now)
      const previousWeekStart = new Date(currentWeekStart)
      previousWeekStart.setDate(previousWeekStart.getDate() - 7)

      // Initialize data structure for 7 days
      const weeklyData: WeeklyData[] = []
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

      for (let i = 0; i < 7; i++) {
        weeklyData.push({
          day: dayNames[i],
          currentWeek: 0,
          previousWeek: 0,
        })
      }

      // Count sessions for each day
      sessions.forEach((session) => {
        if (session.mode !== "pomodoro") return

        const sessionDate = new Date(session.startTime)
        const dayOfWeek = sessionDate.getDay()

        // Check if session is in current week
        if (
          sessionDate >= currentWeekStart &&
          sessionDate < new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
        ) {
          weeklyData[dayOfWeek].currentWeek++
        }
        // Check if session is in previous week
        else if (sessionDate >= previousWeekStart && sessionDate < currentWeekStart) {
          weeklyData[dayOfWeek].previousWeek++
        }
      })

      return weeklyData
    }
  }, [])

  useEffect(() => {
    if (!isClient) return

    const analyzeData = () => {
      try {
        setLoading(true)

        // Get history data
        const history = getHistory()

        if (history.length === 0) {
          setLoading(false)
          setError("Not enough session data to generate insights.")
          return
        }

        // Calculate basic statistics locally
        const pomodoroSessions = history.filter((s) => s.mode === "pomodoro")
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

        // Calculate tasks with most sessions
        const taskSessionCounts: Record<string, { count: number; duration: number }> = {}
        pomodoroSessions.forEach((session) => {
          const taskTitle = session.taskTitle || session.note || "Untitled Task"
          if (!taskSessionCounts[taskTitle]) {
            taskSessionCounts[taskTitle] = { count: 0, duration: 0 }
          }
          taskSessionCounts[taskTitle].count++
          taskSessionCounts[taskTitle].duration += session.duration
        })

        const tasksWithMostSessions = Object.entries(taskSessionCounts)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5)
          .map(([taskTitle, data]) => ({
            taskTitle,
            sessionCount: data.count,
            totalDuration: data.duration,
            percentage: Math.round((data.count / pomodoroSessions.length) * 100),
          }))

        // Calculate weekly comparison
        const weeklyComparison = calculateWeeklyComparison(history)

        // Set statistics
        const stats = {
          totalSessions: pomodoroSessions.length,
          totalFocusTime,
          averageSessionLength,
          productiveHours,
          tasksWithMostSessions,
          weeklyComparison,
        }

        setStatistics(stats)

        // Generate simple insights locally
        const generatedInsights: InsightProps[] = []

        // Insight 1: Most productive time
        if (productiveHours.length > 0) {
          const topHour = productiveHours[0]
          const hourFormatted = formatHour(topHour.hour)
          generatedInsights.push({
            title: `Peak Productivity at ${hourFormatted}`,
            description: `You complete ${topHour.percentage}% of your focus sessions around ${hourFormatted}.`,
            suggestion: `Schedule your most important tasks during this productive time.`,
            icon: "Clock",
          })
        }

        // Insight 2: Session length
        const avgMinutes = Math.round(averageSessionLength / 60)
        if (avgMinutes > 0) {
          generatedInsights.push({
            title: `Average Focus Duration: ${avgMinutes} minutes`,
            description: `Your focus sessions last ${avgMinutes} minutes on average.`,
            suggestion:
              avgMinutes < 20
                ? `Try extending your sessions by 5 minutes to build focus endurance.`
                : `Your session length is good. Consider taking short breaks between sessions.`,
            icon: "Focus",
          })
        }

        // Insight 3: Top task
        if (tasksWithMostSessions.length > 0) {
          const topTask = tasksWithMostSessions[0]
          generatedInsights.push({
            title: `Most Worked Task: ${topTask.taskTitle}`,
            description: `You've completed ${topTask.sessionCount} sessions on this task (${topTask.percentage}% of all sessions).`,
            suggestion: `Consider if this task allocation aligns with your priorities.`,
            icon: "CheckSquare",
          })
        }

        // Insight 4: Weekly trend
        const currentWeekTotal = weeklyComparison.reduce((sum, day) => sum + day.currentWeek, 0)
        const previousWeekTotal = weeklyComparison.reduce((sum, day) => sum + day.previousWeek, 0)
        const weeklyChange = currentWeekTotal - previousWeekTotal

        if (previousWeekTotal > 0) {
          const changePercentage = Math.round((weeklyChange / previousWeekTotal) * 100)
          generatedInsights.push({
            title: `Weekly Progress: ${weeklyChange >= 0 ? "+" : ""}${changePercentage}%`,
            description: `You completed ${currentWeekTotal} sessions this week vs ${previousWeekTotal} last week.`,
            suggestion:
              weeklyChange >= 0
                ? `Great progress! Keep up the momentum.`
                : `Consider setting smaller daily goals to build consistency.`,
            icon: "TrendingUp",
          })
        }

        // Set insights
        setInsights(
          generatedInsights.length > 0
            ? generatedInsights
            : [
                {
                  title: "Getting Started",
                  description: "Complete more focus sessions to get personalized insights.",
                  suggestion: "Try to complete at least 5 focus sessions to see patterns.",
                  icon: "BarChart",
                },
              ],
        )

        setLoading(false)
      } catch (error) {
        console.error("Error generating insights:", error)
        setError("Failed to generate insights. Please try again later.")
        setLoading(false)
        toast({
          title: "Error",
          description: "Failed to generate productivity insights.",
          variant: "destructive",
        })
      }
    }

    analyzeData()
  }, [toast, isClient, calculateWeeklyComparison])

  // Helper function to format time from hour number
  const formatHour = (hour: number) => {
    try {
      const period = hour >= 12 ? "PM" : "AM"
      const displayHour = hour % 12 === 0 ? 12 : hour % 12
      return `${displayHour} ${period}`
    } catch (error) {
      console.error("Error formatting hour:", error)
      return "Unknown"
    }
  }

  // Helper function to format duration in hours and minutes
  const formatDuration = (seconds: number) => {
    try {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)

      if (hours > 0) {
        return `${hours}h ${minutes}m`
      }
      return `${minutes}m`
    } catch (error) {
      console.error("Error formatting duration:", error)
      return "0m"
    }
  }

  // Function to render the appropriate icon
  const renderIcon = (iconName: string) => {
    try {
      const props = { className: "h-5 w-5 text-primary" }

      switch (iconName) {
        case "BarChart":
          return <BarChart {...props} />
        case "Clock":
          return <Clock {...props} />
        case "Calendar":
          return <Calendar {...props} />
        case "Tag":
          return <Tag {...props} />
        case "Zap":
          return <Zap {...props} />
        case "Brain":
          return <Brain {...props} />
        case "TrendingUp":
          return <TrendingUp {...props} />
        case "Focus":
          return <Focus {...props} />
        case "CheckSquare":
          return <CheckSquare {...props} />
        default:
          return <BarChart {...props} />
      }
    } catch (error) {
      console.error("Error rendering icon:", error)
      return <BarChart className="h-5 w-5 text-primary" />
    }
  }

  // If not client-side yet, show a loading state
  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <div className="h-8 bg-muted rounded-md animate-pulse w-3/4 mb-2"></div>
          <div className="h-4 bg-muted rounded-md animate-pulse w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-md animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-3/4" />
          </CardTitle>
          <div className="mt-1">
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex gap-4 items-start">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Productivity Insights</CardTitle>
          <CardDescription>Analyze your productivity patterns and get personalized suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Not enough data</h3>
            <div className="text-muted-foreground max-w-md">
              {error === "Not enough session data to generate insights."
                ? "Complete more focus sessions to get personalized productivity insights."
                : error}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productivity Insights</CardTitle>
        <CardDescription>Analyze your productivity patterns and get personalized suggestions</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="insights">
          <TabsList className="mb-4">
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-4">
            {insights.length > 0 ? (
              insights.map((insight, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex gap-4 items-start">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {renderIcon(insight.icon)}
                      </div>
                      <div>
                        <h3 className="font-medium text-base">{insight.title}</h3>
                        <div className="text-sm text-muted-foreground mt-1">{insight.description}</div>
                        <div className="text-sm font-medium mt-2">
                          <span className="text-primary">Suggestion:</span> {insight.suggestion}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No insights available</h3>
                <div className="text-muted-foreground max-w-md">
                  Complete more focus sessions to get personalized productivity insights.
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="statistics">
            {statistics ? (
              <div className="space-y-6">
                {/* Weekly Comparison Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Weekly Session Comparison</CardTitle>
                    <CardDescription>Current week vs previous week session distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        currentWeek: {
                          label: "Current Week",
                          color: "hsl(var(--primary))", // Orange primary color
                        },
                        previousWeek: {
                          label: "Previous Week",
                          color: "hsl(0, 0%, 0%)", // Black
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={statistics.weeklyComparison}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Bar dataKey="currentWeek" fill="var(--color-currentWeek)" name="Current Week" />
                          <Bar dataKey="previousWeek" fill="var(--color-previousWeek)" name="Previous Week" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{statistics.totalSessions}</div>
                        <div className="text-sm text-muted-foreground mt-1">Focus Sessions</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{formatDuration(statistics.totalFocusTime)}</div>
                        <div className="text-sm text-muted-foreground mt-1">Total Focus Time</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{formatDuration(statistics.averageSessionLength)}</div>
                        <div className="text-sm text-muted-foreground mt-1">Avg. Session Length</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Most Productive Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {statistics.productiveHours.length > 0 ? (
                        <div className="space-y-4">
                          {statistics.productiveHours.map((hour, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{formatHour(hour.hour)}</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden mr-3">
                                  <div
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${hour.percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground w-12 text-right">
                                  {hour.count} ({hour.percentage}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Not enough data</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tasks with Most Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {statistics.tasksWithMostSessions.length > 0 ? (
                        <div className="space-y-4">
                          {statistics.tasksWithMostSessions.map((task, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center min-w-0 flex-1">
                                  <CheckSquare className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                                  <span className="truncate" title={task.taskTitle}>
                                    {task.taskTitle}
                                  </span>
                                </div>
                                <span className="text-sm text-muted-foreground ml-2">
                                  {task.sessionCount} ({task.percentage}%)
                                </span>
                              </div>
                              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all duration-300"
                                  style={{ width: `${task.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No task data available</div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No statistics available</h3>
                <div className="text-muted-foreground max-w-md">
                  Complete more focus sessions to see your productivity statistics.
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
