"use client";

import { DialogFooter } from "@/components/ui/dialog";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Clock } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { useLocalStorage } from "@/lib/use-local-storage";
import * as DialogPrimitive from "@radix-ui/react-dialog";

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
      tags = data.tags || [];
      if (!Array.isArray(tags)) {
        tags = [];
      }
    } catch (e) {
      tags = [];
    }
    setLoading(false);
    onSubmit(note, tags, autoStartRest);
    setNote("");
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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
              onChange={(e) => setNote(e.target.value)}
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
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            aria-label="Save notes"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
