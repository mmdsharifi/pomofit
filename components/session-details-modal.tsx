"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Play, Coffee, Pause, Calendar, FileText } from "lucide-react";
import type { PomodoroSession } from "@/lib/history-utils";

interface SessionDetailsModalProps {
  session: PomodoroSession | null;
  isOpen: boolean;
  onClose: () => void;
  formatTime: (date: Date) => string;
  formatDuration: (seconds: number) => string;
}

export default function SessionDetailsModal({
  session,
  isOpen,
  onClose,
  formatTime,
  formatDuration,
}: SessionDetailsModalProps) {
  if (!session) return null;

  const getSessionIcon = (mode: string) => {
    switch (mode) {
      case "pomodoro":
        return <Play className="h-5 w-5" />;
      case "shortBreak":
        return <Coffee className="h-5 w-5" />;
      case "longBreak":
        return <Pause className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getSessionColor = (mode: string) => {
    switch (mode) {
      case "pomodoro":
        return "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300";
      case "shortBreak":
        return "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300";
      case "longBreak":
        return "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300";
      default:
        return "bg-gray-500/10 border-gray-500/20 text-gray-700 dark:text-gray-300";
    }
  };

  const getSessionLabel = (mode: string) => {
    switch (mode) {
      case "pomodoro":
        return "Focus Session";
      case "shortBreak":
        return "Short Break";
      case "longBreak":
        return "Long Break";
      default:
        return "Session";
    }
  };

  const getSessionTitle = (session: PomodoroSession) => {
    if (session.mode !== "pomodoro") {
      return getSessionLabel(session.mode);
    }

    if (session.taskTitle) {
      return session.taskTitle;
    }

    if (session.note && !session.note.startsWith("task:")) {
      return session.note;
    }

    return "Untitled Task";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${getSessionColor(session.mode)}`}
            >
              {getSessionIcon(session.mode)}
            </div>
            <span>{getSessionTitle(session)}</span>
          </DialogTitle>
          <DialogDescription>Session details and notes</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Session Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">
                  {formatDuration(session.duration)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Start Time</p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(session.startTime)}
                </p>
              </div>
            </div>
          </div>

          {/* Session Type Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getSessionColor(session.mode)}>
              {getSessionLabel(session.mode)}
            </Badge>
          </div>

          {/* Session Description/Notes */}
          {session.note && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Notes</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm whitespace-pre-wrap">{session.note}</p>
              </div>
            </div>
          )}

          {/* Tags */}
          {session.tags && session.tags.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Tags</p>
              <div className="flex flex-wrap gap-1">
                {session.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
