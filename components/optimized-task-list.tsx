"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Task } from "@/types/task";
import { useTasks } from "@/lib/task-context";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useVirtualScroll } from "@/lib/hooks/use-virtual-scroll";
import { useIntersectionObserver } from "@/lib/hooks/use-intersection-observer";
import { TaskItem } from "./task-item";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Search, Plus, Filter } from "lucide-react";

interface OptimizedTaskListProps {
  className?: string;
  showCompleted?: boolean;
  maxHeight?: number;
}

/**
 * Optimized task list component with virtual scrolling and performance optimizations
 */
export function OptimizedTaskList({
  className = "",
  showCompleted = false,
  maxHeight = 400,
}: OptimizedTaskListProps) {
  const { tasks, addTask, toggleTask, removeTask } = useTasks();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && !task.completed) ||
        (filter === "completed" && task.completed);
      return matchesSearch && matchesFilter;
    });
  }, [tasks, debouncedSearchTerm, filter]);

  // Virtual scroll setup
  const { virtualItems, totalHeight, containerRef } = useVirtualScroll(
    filteredTasks,
    {
      itemHeight: 60,
      containerHeight: maxHeight,
      overscan: 5,
    }
  );

  // Intersection observer for infinite scroll (if needed)
  const [loadMoreRef, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
  });

  // Memoized callbacks
  const handleAddTask = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (newTaskTitle.trim()) {
        addTask(newTaskTitle.trim());
        setNewTaskTitle("");
        setShowAddForm(false);
      }
    },
    [newTaskTitle, addTask]
  );

  const handleQuickAddFromSearch = useCallback(() => {
    const title = searchTerm.trim();
    if (!title) return;
    addTask(title);
    setSearchTerm("");
    setShowAddForm(false);
  }, [searchTerm, addTask]);

  const handleToggleTask = useCallback(
    (id: string) => {
      toggleTask(id);
    },
    [toggleTask]
  );

  const handleDeleteTask = useCallback(
    (id: string) => {
      removeTask(id);
    },
    [removeTask]
  );

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tasks</h2>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setFilter(
                filter === "all"
                  ? "active"
                  : filter === "active"
                  ? "completed"
                  : "all"
              )
            }
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {filter}
          </Button>
        </div>

        {/* Add Task Form */}
        {showAddForm && (
          <form onSubmit={handleAddTask} className="flex gap-2">
            <Input
              placeholder="Enter task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="sm">
              Add
            </Button>
          </form>
        )}

        {debouncedSearchTerm.trim() !== "" && filteredTasks.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              No tasks found for “{debouncedSearchTerm.trim()}”.
            </p>
            <Button
              type="button"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleQuickAddFromSearch}
            >
              <Plus className="w-4 h-4" />
              Add “{debouncedSearchTerm.trim()}”
            </Button>
          </div>
        )}

        {/* Task List */}
        <div
          ref={containerRef as React.RefObject<HTMLDivElement>}
          className="border rounded-lg overflow-auto"
          style={{ height: maxHeight }}
        >
          <div style={{ height: totalHeight, position: "relative" }}>
            {virtualItems.map((task, index) => (
              <div
                key={task.id}
                style={{
                  position: "absolute",
                  top: (index + 1) * 60,
                  width: "100%",
                  height: 60,
                }}
              >
                <TaskItem
                  task={task}
                  onToggle={() => handleToggleTask(task.id)}
                  onDelete={() => handleDeleteTask(task.id)}
                  onPlay={() => {
                    // Handle play functionality - could be implemented later
                    console.log("Play task:", task.id);
                  }}
                  onEdit={() => {
                    // Handle edit functionality - could be implemented later
                    console.log("Edit task:", task.id);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-between text-sm text-gray-500">
          <span>
            {filteredTasks.length} of {tasks.length} tasks
          </span>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {tasks.filter((t) => !t.completed).length} active
            </Badge>
            <Badge variant="outline">
              {tasks.filter((t) => t.completed).length} completed
            </Badge>
          </div>
        </div>

        {/* Load More Trigger */}
        <div
          ref={loadMoreRef as React.RefObject<HTMLDivElement>}
          className="h-4"
        />
      </div>
    </Card>
  );
}
