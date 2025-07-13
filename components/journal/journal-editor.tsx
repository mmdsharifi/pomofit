"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bold, Italic, List, Quote } from "lucide-react";
import type { JournalEntry } from "@/app/journal/journal-client";

interface JournalEditorProps {
  selectedDate: Date;
  selectedEntry: JournalEntry | null;
  onSave: (entry: Partial<JournalEntry>) => void;
}

export function JournalEditor({
  selectedDate,
  selectedEntry,
  onSave,
}: JournalEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Update content when selectedEntry changes
  useEffect(() => {
    if (selectedEntry) {
      setTitle(selectedEntry.title);
      setContent(selectedEntry.content);
    } else {
      // Create default title for daily entries
      const dateStr = selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      setTitle(dateStr);
      setContent("");
    }
  }, [selectedEntry, selectedDate]);

  // Update word count when content changes
  useEffect(() => {
    const words = content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  // Auto-save on title/content change (debounced)
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      const entry: Partial<JournalEntry> = {
        id: selectedEntry?.id,
        title,
        content,
        date: selectedDate.toISOString().split("T")[0],
        type: selectedEntry?.type || "daily",
      };
      onSave(entry);
    }, 600);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [title, content]);

  const handleContentChange = (value: string) => {
    setContent(value);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
  };

  const insertMarkdown = (syntax: string, placeholder = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let newText = "";
    let newCursorPos = start;

    switch (syntax) {
      case "bold":
        newText = `**${selectedText || placeholder}**`;
        newCursorPos = start + 2 + (selectedText || placeholder).length;
        break;
      case "italic":
        newText = `*${selectedText || placeholder}*`;
        newCursorPos = start + 1 + (selectedText || placeholder).length;
        break;
      case "list":
        newText = `\n- ${selectedText || placeholder}`;
        newCursorPos = start + newText.length;
        break;
      case "quote":
        newText = `\n> ${selectedText || placeholder}`;
        newCursorPos = start + newText.length;
        break;
    }

    const newContent =
      content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);

    // Set cursor position after state update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 bg-background pt-8">
        <div className="flex items-center justify-between">
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-xl font-semibold border-none p-0 h-auto bg-transparent focus-visible:ring-0"
            placeholder="Journal title..."
          />
        </div>
        {/* Formatting Toolbar */}
        <div className="flex gap-1 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("bold", "bold text")}
          >
            {" "}
            <Bold className="h-4 w-4" />{" "}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("italic", "italic text")}
          >
            {" "}
            <Italic className="h-4 w-4" />{" "}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("list", "list item")}
          >
            {" "}
            <List className="h-4 w-4" />{" "}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("quote", "quote text")}
          >
            {" "}
            <Quote className="h-4 w-4" />{" "}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start writing your thoughts..."
          className="flex-1 resize-none border-none p-0 focus-visible:ring-0 text-base leading-relaxed"
        />

        {/* Footer with word count */}
        <div className="flex justify-between items-center pt-4 border-t text-sm text-muted-foreground">
          <span>{wordCount} words</span>
        </div>
      </CardContent>
    </Card>
  );
}
