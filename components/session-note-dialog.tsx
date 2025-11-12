"use client";

import type React from "react";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export interface SessionNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (note: string, tags: string[], autoStartRest: boolean) => void;
  sessionTitle: string;
  sessionId: string | number;
}

export default function SessionNoteDialog({
  open,
  onOpenChange,
  onSubmit,
  sessionTitle,
  sessionId,
}: SessionNoteDialogProps) {
  const [note, setNote] = useState("");
  const [autoStartRest, setAutoStartRest] = useState(true);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const autoSkipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialNoteRef = useRef("");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    if (autoSkipTimeoutRef.current) {
      clearTimeout(autoSkipTimeoutRef.current);
      autoSkipTimeoutRef.current = null;
    }

    setCountdown(60);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          autoSkipTimeoutRef.current = window.setTimeout(() => {
            onSubmit("", [], autoStartRest);
            autoSkipTimeoutRef.current = null;
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onSubmit, autoStartRest]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setNote(newValue);

    if (newValue !== initialNoteRef.current) {
      startCountdown();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    let tags: string[] = [];
    try {
      const res = await fetch("/api/ai-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sessionTitle,
          note,
          sessionNumber: sessionId,
        }),
      });
      const data = await res.json();
      tags = Array.isArray(data.tags) ? data.tags : [];
    } catch {
      tags = [];
    }
    setLoading(false);
    onSubmit(note, tags, autoStartRest);
    setNote("");
  };

  useEffect(() => {
    if (open) {
      setNote("");
      setCountdown(60);
      initialNoteRef.current = "";
      startCountdown();
    } else {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      if (autoSkipTimeoutRef.current) {
        clearTimeout(autoSkipTimeoutRef.current);
        autoSkipTimeoutRef.current = null;
      }
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      if (autoSkipTimeoutRef.current) {
        clearTimeout(autoSkipTimeoutRef.current);
        autoSkipTimeoutRef.current = null;
      }
    };
  }, [open, startCountdown]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      if (autoSkipTimeoutRef.current) {
        clearTimeout(autoSkipTimeoutRef.current);
        autoSkipTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Session Completed</DialogTitle>
          <DialogDescription>
            Add notes to track your productivity session. Tags will be suggested
            automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="note">Session Notes</Label>
            <Textarea
              id="note"
              placeholder="What did you accomplish?"
              value={note}
              onChange={handleNoteChange}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="auto-start-rest"
              checked={autoStartRest}
              onCheckedChange={setAutoStartRest}
            />
            <Label htmlFor="auto-start-rest">
              Automatically start rest session
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onSubmit("", [], autoStartRest)}
            aria-label="Skip adding notes"
          >
            Skip ({formatTime(countdown)})
          </Button>
          <Button
            onClick={handleSubmit}
            aria-label="Save notes"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
        <div className="text-xs text-muted-foreground text-center mt-2">
          Press{" "}
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌘</kbd> +{" "}
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to
          save
        </div>
      </DialogContent>
    </Dialog>
  );
}
