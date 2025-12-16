"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, Target, Lightbulb, Activity, BarChart3 } from "lucide-react";
import {
  UserInsights,
  generateUserInsights,
  type TaskHistory,
  type TimerSession,
} from "@/lib/ai-insights";
import { Task } from "@/types/task";

interface AIInsightsDashboardProps {
  tasks: Task[];
  history: TaskHistory[];
  sessions: TimerSession[];
}

export default function AIInsightsDashboard({
  tasks,
  history,
  sessions,
}: AIInsightsDashboardProps) {
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInsights() {
      try {
        setLoading(true);
        const userInsights = await generateUserInsights(
          tasks,
          history,
          sessions
        );
        setInsights(userInsights);
      } catch (err) {
        setError("Failed to generate insights");
        console.error("Error generating insights:", err);
      } finally {
        setLoading(false);
      }
    }

    loadInsights();
  }, [tasks, history, sessions]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2" />
            <p>Unable to generate insights at this time.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Productivity Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Productivity Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {insights.productivityScore}%
              </span>
              <Badge
                variant={
                  insights.productivityScore >= 70 ? "default" : "secondary"
                }
              >
                {insights.productivityScore >= 70 ? "Excellent" : "Good"}
              </Badge>
            </div>
            <Progress value={insights.productivityScore} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Based on task completion, focus efficiency, and consistency
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Focus Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Focus Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Best Time</p>
              <p className="text-lg font-semibold">
                {insights.focusTrends.bestTimeOfDay}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Avg Session</p>
              <p className="text-lg font-semibold">
                {insights.focusTrends.averageSessionLength}m
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Completion Rate</p>
              <p className="text-lg font-semibold">
                {insights.focusTrends.completionRate}%
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Best Day</p>
              <p className="text-lg font-semibold">
                {insights.focusTrends.mostProductiveDay}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Tasks Completed</p>
              <p className="text-lg font-semibold">
                {insights.weeklyProgress.tasksCompleted}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Focus Sessions</p>
              <p className="text-lg font-semibold">
                {insights.weeklyProgress.totalSessions}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Avg Focus Time</p>
              <p className="text-lg font-semibold">
                {insights.weeklyProgress.averageFocusTime}m
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Improvement</p>
              <p className="text-lg font-semibold">
                +{insights.weeklyProgress.improvement}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <span className="text-lg">💡</span>
                <p className="text-sm">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Your Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Peak Hours</p>
              <div className="flex gap-2">
                {insights.patterns.peakHours.map((hour, index) => (
                  <Badge key={index} variant="outline">
                    {hour}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Common Interruptions</p>
              <div className="flex gap-2">
                {insights.patterns.commonInterruptions.map(
                  (interruption, index) => (
                    <Badge key={index} variant="secondary">
                      {interruption}
                    </Badge>
                  )
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
