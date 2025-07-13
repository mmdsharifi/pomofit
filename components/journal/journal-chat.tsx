"use client";

import React from "react";
import ReactMarkdown from "react-markdown";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Plus } from "lucide-react";
import type { JournalEntry } from "@/app/journal/journal-client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestedTasks?: string[];
}

interface JournalChatProps {
  journals: JournalEntry[];
  onAddTasks: (tasks: string[]) => void;
}

export function JournalChat({ journals, onAddTasks }: JournalChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! I'm your journal AI assistant. I can help you analyze your journal entries, provide insights, and even suggest tasks based on your thoughts. What would you like to explore?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // Prepare journal context for AI
      const journalContext = journals
        .filter((j) => j.content.trim())
        .map((j) => `Date: ${j.date}\nTitle: ${j.title}\nContent: ${j.content}`)
        .join("\n\n---\n\n");

      // Call our API route instead of directly calling Groq
      const response = await fetch("/api/journal-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          journalContext: journalContext,
        }),
      });

      const data = await response.json();

      let responseText = "";
      let suggestedTasks: string[] = [];

      if (data.success) {
        responseText = data.response;
        suggestedTasks = data.suggestedTasks || [];
      } else {
        responseText =
          data.fallbackResponse ||
          "I'm sorry, I encountered an error while processing your message.";
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
        suggestedTasks: suggestedTasks.length > 0 ? suggestedTasks : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "I'm having trouble connecting right now. Please check your internet connection and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addTasksToList = (tasks: string[]) => {
    onAddTasks(tasks);
    // You could show a toast notification here
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Journal AI
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0 justify-between">
        <ScrollArea
          className="flex-1 px-4 h-full min-h-0 max-h-[60vh] overflow-y-auto"
          ref={scrollAreaRef}
        >
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-full w-full ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div className="space-y-2 w-full">
                    <div
                      className={`rounded-lg p-3 w-full break-words ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground text-right ml-auto"
                          : "bg-muted text-left mr-auto"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap w-full">
                        {message.role === "assistant" ? (
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        ) : (
                          message.content
                        )}
                      </p>
                    </div>
                    {message.suggestedTasks &&
                      message.suggestedTasks.length > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-orange-800 mb-2">
                            Suggested Tasks:
                          </p>
                          <div className="space-y-1">
                            {message.suggestedTasks.map((task, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-orange-700">{task}</span>
                              </div>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() =>
                              addTasksToList(message.suggestedTasks!)
                            }
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add to Task List
                          </Button>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={endOfMessagesRef} />

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t mt-0">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your journals..."
              disabled={isLoading}
            />
            <Button onClick={sendMessage} disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
