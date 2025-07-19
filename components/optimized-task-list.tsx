"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { TaskItem } from "./task-item";
import { useTasks } from "@/lib/task-context";
import { useTimer } from "@/lib/timer-context";
import { useMobile } from "@/hooks/use-mobile";
import { useVirtualScroll } from "@/lib/hooks/use-virtual-scroll";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useMemoizedCallback } from "@/lib/hooks/use-memoized-callback";
import { AnimatePresence, motion } from "framer-motion";
import type { Task } from "@/types/task";

// Development-only component - not for production use
if (process.env.NODE_ENV === "production") {
  throw new Error("OptimizedTaskList is not available in production");
}

interface OptimizedTaskListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ITEM_HEIGHT = 60; // Approximate height of each task item
const CONTAINER_HEIGHT = 400; // Height of the scrollable container

export function OptimizedTaskList({
  open,
  onOpenChange,
}: OptimizedTaskListProps) {
  const isMobile = useMobile();
  const [inputValue, setInputValue] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState("");
  const [focusedTaskIndex, setFocusedTaskIndex] = useState<number | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const {
    tasks,
    addTask,
    removeTask,
    toggleTask,
    updateTask,
    setCurrentTaskId,
    getNextTask,
  } = useTasks();

  const { toggleTimer } = useTimer();

  // Debounced search input
  const debouncedSearch = useDebounce(setInputValue, 300);

  // Memoized filtered tasks
  const filteredTasks = useMemo(() => {
    if (!inputValue.trim()) return tasks;

    const normalizedQuery = inputValue.toLowerCase().trim();
    return tasks.filter((task) =>
      task.title.toLowerCase().includes(normalizedQuery)
    );
  }, [tasks, inputValue]);

  // Separate active and completed tasks
  const activeTasks = useMemo(
    () => filteredTasks.filter((task) => !task.completed),
    [filteredTasks]
  );

  const completedTasks = useMemo(
    () => filteredTasks.filter((task) => task.completed),
    [filteredTasks]
  );

  // Display tasks (active first, then completed if expanded)
  const displayTasks = useMemo(
    () => [
      ...activeTasks.sort((a, b) => a.order - b.order),
      ...(showCompletedTasks ? completedTasks : []),
    ],
    [activeTasks, completedTasks, showCompletedTasks]
  );

  // Virtual scroll for active tasks
  const activeVirtualScroll = useVirtualScroll(activeTasks, {
    itemHeight: ITEM_HEIGHT,
    containerHeight: CONTAINER_HEIGHT,
    overscan: 3,
  });

  // Virtual scroll for completed tasks
  const completedVirtualScroll = useVirtualScroll(completedTasks, {
    itemHeight: ITEM_HEIGHT,
    containerHeight: Math.min(completedTasks.length * ITEM_HEIGHT, 200),
    overscan: 2,
  });

  // Memoized handlers
  const handleAddTask = useMemoizedCallback(
    (title: string) => {
      if (title.trim()) {
        addTask(title.trim());
        setInputValue("");
      }
    },
    [addTask]
  );

  const handleEditTask = useMemoizedCallback((task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskText(task.title);
  }, []);

  const handlePlayTask = useMemoizedCallback(
    (taskId: string) => {
      setCurrentTaskId(taskId);
      toggleTimer();
      onOpenChange(false);
    },
    [setCurrentTaskId, toggleTimer, onOpenChange]
  );

  const handleSaveEdit = useMemoizedCallback(
    (task: Task) => {
      if (editingTaskText.trim() && editingTaskText !== task.title) {
        updateTask(task.id, { title: editingTaskText.trim() });
      }
      setEditingTaskId(null);
      setEditingTaskText("");
    },
    [editingTaskText, updateTask]
  );

  const handleEditKeyDown = useMemoizedCallback(
    (e: React.KeyboardEvent, task: Task) => {
      if (e.key === "Enter") {
        handleSaveEdit(task);
      } else if (e.key === "Escape") {
        setEditingTaskId(null);
        setEditingTaskText("");
      }
    },
    [handleSaveEdit]
  );

  const handleTaskFocus = useMemoizedCallback((index: number) => {
    setFocusedTaskIndex(index);
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setFocusedTaskIndex(null);
      setTimeout(() => {
        inputRef.current?.focus();
        setIsInputFocused(true);
      }, 100);
    } else {
      setFocusedTaskIndex(null);
      setIsInputFocused(false);
      setInputValue("");
    }
  }, [open]);

  // Focus edit input when editing
  useEffect(() => {
    if (editingTaskId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingTaskId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "Escape") {
        onOpenChange(false);
      } else if (e.key === "Enter" && isInputFocused) {
        e.preventDefault();
        handleAddTask(inputValue);
      } else if (e.key === "ArrowDown" && !isInputFocused) {
        e.preventDefault();
        setFocusedTaskIndex((prev) =>
          prev === null ? 0 : Math.min(prev + 1, displayTasks.length - 1)
        );
      } else if (e.key === "ArrowUp" && !isInputFocused) {
        e.preventDefault();
        setFocusedTaskIndex((prev) =>
          prev === null ? displayTasks.length - 1 : Math.max(prev - 1, 0)
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    open,
    isInputFocused,
    inputValue,
    displayTasks.length,
    handleAddTask,
    onOpenChange,
  ]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-background rounded-lg shadow-lg border">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Add a task or search..."
                value={inputValue}
                onChange={(e) => debouncedSearch(e.target.value)}
                className="flex-1"
              />
              {inputValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => debouncedSearch("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="h-96">
            <div className="p-4 space-y-2">
              {/* Active Tasks */}
              <div
                style={{
                  height: `${activeVirtualScroll.totalHeight}px`,
                  position: "relative",
                }}
              >
                {activeVirtualScroll.virtualItems.map(
                  ({ data: task, offsetTop, index }) => (
                    <div
                      key={task.id}
                      style={{
                        position: "absolute",
                        top: offsetTop,
                        width: "100%",
                        height: ITEM_HEIGHT,
                      }}
                    >
                      {editingTaskId === task.id ? (
                        <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                          <Input
                            ref={editInputRef}
                            value={editingTaskText}
                            onChange={(e) => setEditingTaskText(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(e, task)}
                            onBlur={() => handleSaveEdit(task)}
                            className="flex-1"
                          />
                        </div>
                      ) : (
                        <TaskItem
                          task={task}
                          onToggle={() => toggleTask(task.id)}
                          onDelete={() => {
                            setTaskToDelete(task);
                            setShowDeleteConfirmation(true);
                          }}
                          onPlay={() => handlePlayTask(task.id)}
                          onEdit={() => handleEditTask(task)}
                          isFocused={focusedTaskIndex === index}
                          searchQuery={inputValue}
                        />
                      )}
                    </div>
                  )
                )}
              </div>

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div className="mt-4">
                  <Button
                    variant="ghost"
                    className="w-full flex justify-between items-center py-2 h-auto"
                    onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                  >
                    <span className="font-medium">
                      Done tasks ({completedTasks.length})
                    </span>
                    {showCompletedTasks ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>

                  {showCompletedTasks && (
                    <div
                      style={{
                        height: `${completedVirtualScroll.totalHeight}px`,
                        position: "relative",
                      }}
                    >
                      {completedVirtualScroll.virtualItems.map(
                        ({ data: task, offsetTop, index }) => (
                          <div
                            key={task.id}
                            style={{
                              position: "absolute",
                              top: offsetTop,
                              width: "100%",
                              height: ITEM_HEIGHT,
                            }}
                          >
                            <TaskItem
                              task={task}
                              onToggle={() => toggleTask(task.id)}
                              onDelete={() => {
                                setTaskToDelete(task);
                                setShowDeleteConfirmation(true);
                              }}
                              onPlay={() => handlePlayTask(task.id)}
                              onEdit={() => handleEditTask(task)}
                              isFocused={
                                focusedTaskIndex === activeTasks.length + index
                              }
                              searchQuery={inputValue}
                            />
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span>
                <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
                  Esc
                </code>{" "}
                to close
              </span>
              <span>
                <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
                  Enter
                </code>
                {focusedTaskIndex !== null ? "to start session" : "to add task"}
              </span>
              <span>
                <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
                  ↑↓
                </code>{" "}
                to navigate
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
