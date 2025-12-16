"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Lightbulb, TrendingUp, Target } from "lucide-react";
import { Task } from "@/types/task";
import {
  generateUserInsights,
  type TaskHistory,
  type TimerSession,
} from "@/lib/ai-insights";

interface AIInsightsNotificationProps {
  tasks: Task[];
  history: TaskHistory[];
  sessions: TimerSession[];
  onDismiss?: () => void;
}

export default function AIInsightsNotification({
  tasks,
  history,
  sessions,
  onDismiss,
}: AIInsightsNotificationProps) {
  const [currentInsight, setCurrentInsight] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    async function generateInsight() {
      try {
        setLoading(true);
        const insights = await generateUserInsights(tasks, history, sessions);

        // Select a random recommendation or generate a contextual insight
        const recommendations = insights.recommendations;
        if (recommendations.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * recommendations.length
          );
          setCurrentInsight(recommendations[randomIndex]);
        } else {
          setCurrentInsight(
            "Try starting your day with a 25-minute focus session for better productivity!"
          );
        }
      } catch (error) {
        console.error("Error generating insight:", error);
        setCurrentInsight(
          "Take regular breaks to maintain mental clarity and focus."
        );
      } finally {
        setLoading(false);
      }
    }

    // Only show insights if user has some data
    if (tasks.length > 0 || sessions.length > 0) {
      generateInsight();
    } else {
      setCurrentInsight(
        "Welcome! Start by creating your first task to get personalized insights."
      );
      setLoading(false);
    }
  }, [tasks, history, sessions]);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0">
              <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  AI Insight
                </span>
                <Badge variant="secondary" className="text-xs">
                  💡
                </Badge>
              </div>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-blue-200 dark:bg-blue-800 rounded w-1/2"></div>
                </div>
              ) : (
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                  {currentInsight}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0 h-6 w-6 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick insight component for specific contexts
export function QuickInsight({
  type,
  message,
  onDismiss,
}: {
  type: "success" | "tip" | "warning";
  message: string;
  onDismiss?: () => void;
}) {
  const [visible, setVisible] = useState(true);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "tip":
        return <Lightbulb className="h-4 w-4 text-blue-600" />;
      case "warning":
        return <Target className="h-4 w-4 text-orange-600" />;
      default:
        return <Lightbulb className="h-4 w-4 text-blue-600" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case "success":
        return "border-green-500 bg-green-50 dark:bg-green-950/20";
      case "tip":
        return "border-blue-500 bg-blue-50 dark:bg-blue-950/20";
      case "warning":
        return "border-orange-500 bg-orange-50 dark:bg-orange-950/20";
      default:
        return "border-blue-500 bg-blue-50 dark:bg-blue-950/20";
    }
  };

  if (!visible) return null;

  return (
    <Card className={`border-l-4 ${getColorClasses()}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {getIcon()}
          <p className="text-sm flex-1">{message}</p>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setVisible(false);
                onDismiss();
              }}
              className="h-5 w-5 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
