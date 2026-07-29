"use client";

import type React from "react";

import { useEffect, useRef, useState, useCallback } from "react";
import { useMemoizedCallback } from "@/lib/hooks/use-memoized-callback";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { TaskItem } from "./task-item";
import { useTasks } from "@/lib/task-context";
import { useTimer } from "@/lib/timer-context";
import { useMobile } from "@/hooks/use-mobile";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { AnimatePresence, motion } from "framer-motion";
import { createContext, useContext } from "react";
import type { Task } from "@/types/task";

// Create a context to expose the open state and setOpen function
interface TaskListContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TaskListContext = createContext<TaskListContextType | undefined>(
  undefined
);

export function useTaskList() {
  const context = useContext(TaskListContext);
  if (!context) {
    throw new Error("useTaskList must be used within a TaskListProvider");
  }
  return context;
}

export function TaskListProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // Add global keyboard shortcut for Option+Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.code === "Space") {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <TaskListContext.Provider value={{ open, setOpen }}>
      {children}
    </TaskListContext.Provider>
  );
}

export function TaskList() {
  const isMobile = useMobile();
  const { open, setOpen } = useTaskList();
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const taskRefs = useRef<(HTMLDivElement | null)[]>([]);
  const {
    tasks,
    addTask,
    removeTask,
    toggleTask,
    updateTask,
    reorderTasks,
    setCurrentTaskId,
    getNextTask,
  } = useTasks();
  const { toggleTimer } = useTimer();

  // Filter tasks based on search query with memoization
  const getFilteredTasks = useMemoizedCallback(
    (taskList: Task[], query: string) => {
      if (!query.trim()) return taskList;

      const normalizedQuery = query.toLowerCase().trim();
      return taskList.filter((task) =>
        task.title.toLowerCase().includes(normalizedQuery)
      );
    },
    []
  );

  // Separate active and completed tasks
  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  // Filter active and completed tasks based on search query
  const filteredActiveTasks = inputValue.trim()
    ? getFilteredTasks(activeTasks, inputValue)
    : activeTasks;
  const filteredCompletedTasks = inputValue.trim()
    ? getFilteredTasks(completedTasks, inputValue)
    : completedTasks;

  // All tasks in display order (active tasks first, then completed tasks if expanded)
  const displayTasks = [
    ...filteredActiveTasks.sort((a, b) => a.order - b.order),
    ...(showCompletedTasks ? filteredCompletedTasks : []),
  ];

  // Check if there are any search results
  const hasSearchResults = inputValue.trim()
    ? filteredActiveTasks.length > 0 || filteredCompletedTasks.length > 0
    : true;

  // Check if we're searching (have input and tasks exist)
  const isSearching = inputValue.trim() !== "" && tasks.length > 0;

  // Reset task refs array when tasks change
  useEffect(() => {
    taskRefs.current = taskRefs.current.slice(0, displayTasks.length);
  }, [displayTasks.length]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Reset focused task when modal opens/closes
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

  useEffect(() => {
    if (editingTaskId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingTaskId]);

  // Focus the task element when focusedTaskIndex changes
  useEffect(() => {
    if (focusedTaskIndex !== null && taskRefs.current[focusedTaskIndex]) {
      taskRefs.current[focusedTaskIndex]?.focus();
      setIsInputFocused(false);
    }
  }, [focusedTaskIndex]);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskText(task.title);
  }, []);

  const handlePlayTask = useCallback(
    (taskId: string) => {
      setCurrentTaskId(taskId);
      setOpen(false);
      toggleTimer();
    },
    [setCurrentTaskId, setOpen, toggleTimer]
  );

  const handleConfirmDelete = useCallback(() => {
    if (taskToDelete) {
      removeTask(taskToDelete.id);
      setShowDeleteConfirmation(false);
      setTaskToDelete(null);

      // If we're deleting the last task, focus the previous one
      if (focusedTaskIndex !== null) {
        if (displayTasks.length <= 1) {
          // If this was the last task, focus the input
          setFocusedTaskIndex(null);
          inputRef.current?.focus();
          setIsInputFocused(true);
        } else if (focusedTaskIndex >= displayTasks.length - 1) {
          // If we're deleting the last task in the list, focus the previous one
          setFocusedTaskIndex(displayTasks.length - 2);
        }
        // Otherwise keep the same index (it will point to the next task after deletion)
      }
    }
  }, [taskToDelete, removeTask, focusedTaskIndex, displayTasks.length]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirmation(false);
    setTaskToDelete(null);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process if the task list is open and we're not editing a task
      if (open && !editingTaskId) {
        // Check if the key is a number between 1-9
        const keyNum = Number.parseInt(e.key);
        if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 9) {
          // Only trigger the shortcut if the input is NOT focused
          if (!isInputFocused) {
            // Find the task with the matching order
            const taskToStart = displayTasks.find(
              (task) => task.order === keyNum
            );
            if (taskToStart) {
              e.preventDefault();
              handlePlayTask(taskToStart.id);
            }
          }
        }

        // Handle arrow key navigation
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          // If input is focused and pressing down arrow, focus the first task
          if (
            isInputFocused &&
            e.key === "ArrowDown" &&
            displayTasks.length > 0
          ) {
            e.preventDefault();
            setFocusedTaskIndex(0);
            return;
          }

          // If first task is focused and pressing up arrow, focus the input
          if (focusedTaskIndex === 0 && e.key === "ArrowUp") {
            e.preventDefault();
            setFocusedTaskIndex(null);
            inputRef.current?.focus();
            setIsInputFocused(true);
            return;
          }

          // If no task is focused and not on input, focus the first or last task
          if (focusedTaskIndex === null && !isInputFocused) {
            e.preventDefault();
            if (displayTasks.length > 0) {
              setFocusedTaskIndex(
                e.key === "ArrowDown" ? 0 : displayTasks.length - 1
              );
            }
            return;
          }

          // Navigate between tasks
          if (focusedTaskIndex !== null) {
            e.preventDefault();
            if (e.key === "ArrowDown") {
              setFocusedTaskIndex((prev) =>
                prev === null || prev >= displayTasks.length - 1 ? 0 : prev + 1
              );
            } else {
              setFocusedTaskIndex((prev) =>
                prev === null || prev <= 0 ? displayTasks.length - 1 : prev - 1
              );
            }
          }
        }

        // Handle Enter key to start focused task
        if (e.key === "Enter" && focusedTaskIndex !== null && !isInputFocused) {
          e.preventDefault();
          if (displayTasks[focusedTaskIndex]) {
            handlePlayTask(displayTasks[focusedTaskIndex].id);
          }
        }

        // Handle Escape key to clear focus and focus input
        if (e.key === "Escape" && focusedTaskIndex !== null) {
          e.preventDefault();
          setFocusedTaskIndex(null);
          inputRef.current?.focus();
          setIsInputFocused(true);
        }

        // New keyboard shortcuts for focused tasks
        if (focusedTaskIndex !== null && !isInputFocused) {
          const focusedTask = displayTasks[focusedTaskIndex];

          // 'E' key to edit task
          if (e.key.toLowerCase() === "e") {
            e.preventDefault();
            handleEditTask(focusedTask);
          }

          // 'D' key to delete task (with confirmation)
          if (e.key.toLowerCase() === "d") {
            e.preventDefault();
            setTaskToDelete(focusedTask);
            setShowDeleteConfirmation(true);
          }

          // Space key to toggle task completion
          if (e.key === " " || e.code === "Space") {
            e.preventDefault();
            toggleTask(focusedTask.id);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    open,
    tasks,
    displayTasks,
    editingTaskId,
    focusedTaskIndex,
    isInputFocused,
    handlePlayTask,
    toggleTask,
    handleEditTask,
  ]);

  // Scroll focused task into view
  useEffect(() => {
    if (focusedTaskIndex !== null && scrollAreaRef.current) {
      const taskElement = taskRefs.current[focusedTaskIndex];
      if (taskElement) {
        taskElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [focusedTaskIndex]);

  const handleNewTask = useCallback(() => {
    if (inputValue.trim()) {
      addTask(inputValue.trim());
      setInputValue("");
    }
  }, [inputValue, addTask]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleNewTask();
      }
    },
    [handleNewTask]
  );

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent, task: Task) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (editingTaskText.trim() && editingTaskText !== task.title) {
          updateTask(task.id, { title: editingTaskText.trim() });
        }
        setEditingTaskId(null);
      } else if (e.key === "Escape") {
        setEditingTaskId(null);
      }
    },
    [editingTaskText, updateTask]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        // Only reorder active tasks
        const activeTasks = tasks.filter((task) => !task.completed);
        const oldIndex = activeTasks.findIndex((task) => task.id === active.id);
        const newIndex = activeTasks.findIndex((task) => task.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newActiveTasks = arrayMove(activeTasks, oldIndex, newIndex);
          reorderTasks(newActiveTasks);
        }
      }
    },
    [tasks, reorderTasks]
  );

  const handleSaveEdit = useCallback(
    (task: Task) => {
      if (editingTaskText.trim() && editingTaskText !== task.title) {
        updateTask(task.id, { title: editingTaskText.trim() });
      }
      setEditingTaskId(null);
    },
    [editingTaskText, updateTask]
  );

  const handleTaskFocus = (index: number) => {
    setFocusedTaskIndex(index);
    setIsInputFocused(false);
  };

  const toggleCompletedTasks = () => {
    setShowCompletedTasks(!showCompletedTasks);
    // Reset focused task when toggling completed tasks
    setFocusedTaskIndex(null);
  };

  const handleClearSearch = () => {
    setInputValue("");
    inputRef.current?.focus();
  };

  const Content = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          placeholder={
            isSearching ? "Search tasks..." : "What do you want to do today?"
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`flex-1 pl-8 ${
            isInputFocused ? "ring-2 ring-primary ring-offset-2" : ""
          }`}
          onFocus={() => {
            setFocusedTaskIndex(null);
            setIsInputFocused(true);
          }}
          onBlur={() => {
            if (focusedTaskIndex === null) {
              setIsInputFocused(false);
            }
          }}
        />
        {inputValue && (
          <>
            {isSearching && !hasSearchResults ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleNewTask}
                aria-label="Add task"
                className="h-8 w-8"
                data-testid="add-task-button"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>

      <ScrollArea className="h-[400px] pr-4" ref={scrollAreaRef}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={displayTasks}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence>
              {displayTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center justify-center gap-2 py-8 text-center"
                >
                  {isSearching && !hasSearchResults ? (
                    <>
                      <p className="text-muted-foreground">
                        No matching tasks found
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearSearch}
                        >
                          Clear search
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleNewTask}
                        >
                          Add &quot;{inputValue}&quot;
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-muted-foreground">No tasks yet</p>
                      <p className="text-sm text-muted-foreground">
                        Add a task to get started
                      </p>
                    </>
                  )}
                </motion.div>
              ) : (
                <div className="space-y-2" data-testid="task-list">
                  {filteredActiveTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      onFocus={() => handleTaskFocus(index)}
                      ref={(el) => {
                        taskRefs.current[index] = el;
                      }}
                      tabIndex={-1}
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
                          onEdit={() =>
                            editingTaskId !== task.id && handleEditTask(task)
                          }
                          isFocused={focusedTaskIndex === index}
                          searchQuery={inputValue}
                          ref={(el) => {
                            taskRefs.current[index] = el;
                          }}
                        />
                      )}
                    </motion.div>
                  ))}

                  {/* Completed Tasks Section */}
                  {completedTasks.length > 0 && (
                    <div className="mt-4">
                      <Button
                        variant="ghost"
                        className="w-full flex justify-between items-center py-2 h-auto"
                        onClick={toggleCompletedTasks}
                        aria-label={
                          showCompletedTasks
                            ? "Hide completed tasks"
                            : "Show completed tasks"
                        }
                        aria-expanded={showCompletedTasks}
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

                      {/* Completed Tasks List */}
                      {showCompletedTasks && (
                        <div className="space-y-2 mt-2">
                          {filteredCompletedTasks.map(
                            (task, completedIndex) => {
                              const displayIndex =
                                filteredActiveTasks.length + completedIndex;
                              return (
                                <motion.div
                                  key={task.id}
                                  layout
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  onFocus={() => handleTaskFocus(displayIndex)}
                                  ref={(el) => {
                                    taskRefs.current[displayIndex] = el;
                                  }}
                                  tabIndex={-1}
                                >
                                  {editingTaskId === task.id ? (
                                    <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                                      <Input
                                        ref={editInputRef}
                                        value={editingTaskText}
                                        onChange={(e) =>
                                          setEditingTaskText(e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                          handleEditKeyDown(e, task)
                                        }
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
                                      onEdit={() =>
                                        editingTaskId !== task.id &&
                                        handleEditTask(task)
                                      }
                                      isFocused={
                                        focusedTaskIndex === displayIndex
                                      }
                                      searchQuery={inputValue}
                                      ref={(el) => {
                                        taskRefs.current[displayIndex] = el;
                                      }}
                                    />
                                  )}
                                </motion.div>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </SortableContext>
        </DndContext>
      </ScrollArea>

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
        {!isInputFocused && (
          <>
            <span>
              <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
                1-9
              </code>{" "}
              to start task
            </span>
            {focusedTaskIndex !== null && (
              <>
                <span>
                  <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
                    E
                  </code>{" "}
                  to edit
                </span>
                <span>
                  <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
                    D
                  </code>{" "}
                  to delete
                </span>
                <span>
                  <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
                    Space
                  </code>{" "}
                  to toggle
                </span>
              </>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {taskToDelete && (
              <p className="text-sm font-medium">
                &quot;{taskToDelete.title}&quot;
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>🎯 Tasks</DrawerTitle>
            <DrawerDescription>
              Manage your tasks and start focusing
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-8">{Content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[60%] mx-auto left-[50%] translate-x-[-50%]">
        <DialogHeader>
          <DialogTitle>🎯 Tasks</DialogTitle>
          <DialogDescription>
            Manage your tasks and start focusing
          </DialogDescription>
        </DialogHeader>
        {Content}
      </DialogContent>
    </Dialog>
  );
}
