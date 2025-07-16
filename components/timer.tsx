"use client";

import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, X, Check, List } from "lucide-react";
import WorkoutDisplay from "@/components/workout-display";
import SessionNoteDialog from "@/components/session-note-dialog";
import { useTimer } from "@/lib/timer-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useTasks } from "@/lib/task-context";
import { TaskList, useTaskList } from "@/components/task-list";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface TimerProps {
  useIconButtons?: boolean;
}

export default function Timer({ useIconButtons = false }: TimerProps) {
  const {
    mode,
    timeLeft,
    isRunning,
    pomodorosCompleted,
    showNoteDialog,
    progressPercentage,
    formatTime,
    toggleTimer,
    resetTimer,
    handleModeChange,
    setShowNoteDialog,
    handleNoteSubmit,
    settings,
    getRandomMotivationalMessage,
    showGoalReachedModal,
    setShowGoalReachedModal,
    playConfetti,
    setPlayConfetti,
  } = useTimer();

  const { tasks, currentTaskId, toggleTask, setCurrentTaskId } = useTasks();
  const { setOpen } = useTaskList();
  const currentTask = tasks.find((task) => task.id === currentTaskId);

  // Store motivational message in a ref to prevent re-renders and ensure consistency
  const motivationalMessageRef = useRef("");
  const prevModeRef = useRef(mode);
  const sessionIdRef = useRef("");

  // Use a ref to track if we've already incremented the pomodoro count
  const hasIncrementedPomodoroRef = useRef(false);

  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  // Create an array of the total number of pomodoros (goal)
  const pomodoroGoal = settings.pomodoroGoal || 8;

  const isBreakMode = mode === "shortBreak" || mode === "longBreak";

  // Get a random motivational message only when entering a new break session
  useEffect(() => {
    // Generate a new session ID when mode changes from non-break to break
    if (isBreakMode && prevModeRef.current !== mode) {
      sessionIdRef.current = Date.now().toString();
      motivationalMessageRef.current = getRandomMotivationalMessage();
    }

    // Reset the increment flag when mode changes
    if (prevModeRef.current !== mode) {
      hasIncrementedPomodoroRef.current = false;
    }

    prevModeRef.current = mode;
  }, [isBreakMode, mode, getRandomMotivationalMessage]);

  // Find the reset button and add aria-label
  const handleResetButtonClick = () => {
    setShowResetConfirmation(true);
  };

  // Handle cancel break and start new pomodoro after confirmation
  const handleCancelBreak = () => {
    setShowResetConfirmation(false);
    if (mode === "shortBreak" || mode === "longBreak") {
      handleModeChange("pomodoro");
    } else {
      resetTimer();
    }
  };

  // Determine if user has exceeded their goal
  const hasExceededGoal = pomodorosCompleted > pomodoroGoal;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="flex flex-col items-center space-y-6 p-6 text-center">
        {/* Show task item during pomodoro or motivational message during break */}
        {!isBreakMode && currentTask ? (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg border bg-card text-card-foreground shadow-sm group relative">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 rounded-full p-0 z-10"
                    onClick={() => currentTaskId && toggleTask(currentTaskId)}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full border-2",
                        currentTask.completed
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-primary"
                      )}
                    >
                      {currentTask.completed && <Check className="h-3 w-3" />}
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Mark as {currentTask.completed ? "incomplete" : "complete"}
                </TooltipContent>
              </Tooltip>

              <span
                className={cn(
                  "text-sm z-10",
                  currentTask.completed && "text-muted-foreground line-through"
                )}
              >
                {currentTask.title}
              </span>

              {/* Display Pomodoro count for the current task only if explicitly greater than 0 */}
              {currentTask &&
              typeof currentTask.pomodoros === "number" &&
              currentTask.pomodoros > 0 ? (
                <Badge
                  variant="outline"
                  className="font-mono text-xs z-10 ml-1 bg-gray-200 text-gray-600 border-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600"
                >
                  {currentTask.pomodoros}
                </Badge>
              ) : null}

              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 z-10"
                onClick={() => setOpen(true)}
                title="Open task list"
              >
                <List className="h-3 w-3" />
              </Button>
            </TooltipProvider>
          </div>
        ) : isBreakMode ? (
          <div className="text-xs text-muted-foreground max-w-xs text-center">
            {motivationalMessageRef.current}
          </div>
        ) : (
          <Button
            variant="ghost"
            className="text-muted-foreground text-sm font-normal hover:bg-transparent hover:text-foreground mb-2"
            onClick={() => setOpen(true)}
            aria-label="Open task list"
          >
            What do you want to do? (⌥ Space)
          </Button>
        )}

        {/* Timer type label for Cypress tests */}
        <div className="text-lg font-semibold mt-2" data-testid="timer-type">
          {mode === "pomodoro" && "Pomodoro"}
          {mode === "shortBreak" && "Short Break"}
          {mode === "longBreak" && "Long Break"}
        </div>
        <div
          className="text-7xl font-bold tabular-nums font-mono timer-display"
          data-testid="timer-display"
        >
          {formatTime(timeLeft)}
        </div>

        {/* Mode change buttons for Cypress tests */}
        <div className="flex space-x-2 mt-4">
          <Button
            variant={mode === "pomodoro" ? "default" : "ghost"}
            onClick={() => handleModeChange("pomodoro")}
            className="mx-1"
            data-testid="pomodoro-button"
          >
            Pomodoro
          </Button>
          <Button
            variant={mode === "shortBreak" ? "default" : "ghost"}
            onClick={() => handleModeChange("shortBreak")}
            className="mx-1"
            data-testid="short-break-button"
          >
            Short Break
          </Button>
          <Button
            variant={mode === "longBreak" ? "default" : "ghost"}
            onClick={() => handleModeChange("longBreak")}
            className="mx-1"
            data-testid="long-break-button"
          >
            Long Break
          </Button>
        </div>

        {/* Progress dots below the timer */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-xs">
          {/* Display the goal circles */}
          {Array.from({ length: pomodoroGoal }).map((_, index) => {
            const isCompleted = index < pomodorosCompleted;
            const isActive =
              index === pomodorosCompleted && isRunning && mode === "pomodoro";

            return (
              <div
                key={index}
                className={cn(
                  "transition-all duration-300 ease-in-out rounded-full",
                  isCompleted
                    ? "w-3 h-3 bg-primary"
                    : isActive
                    ? "w-8 h-3 bg-primary/10 border border-primary/30"
                    : "w-3 h-3 border border-primary/30",
                  {
                    "relative overflow-hidden": isActive,
                  }
                )}
              >
                {isActive && (
                  <div
                    className="absolute top-0 left-0 h-full bg-primary"
                    style={{
                      width: `${progressPercentage}%`,
                      transition: "width 1s linear",
                    }}
                  />
                )}
              </div>
            );
          })}

          {/* Display extra circles for sessions beyond the goal */}
          {hasExceededGoal && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 ml-1">
                    {Array.from({
                      length: Math.min(pomodorosCompleted - pomodoroGoal, 5),
                    }).map((_, index) => (
                      <div
                        key={`extra-${index}`}
                        className="w-3 h-3 rounded-full bg-green-500 animate-pulse"
                      />
                    ))}
                    {pomodorosCompleted - pomodoroGoal > 5 && (
                      <Badge
                        variant="outline"
                        className="ml-1 bg-green-500/10 text-green-500 border-green-500/30"
                      >
                        +{pomodorosCompleted - pomodoroGoal}
                      </Badge>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  You've exceeded your daily goal by{" "}
                  {pomodorosCompleted - pomodoroGoal} sessions! 🎉
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="flex space-x-6 mt-6">
          <Button
            onClick={toggleTimer}
            size="lg"
            variant="ghost"
            className="rounded-full h-14 w-14 p-0"
            aria-label={isRunning ? "Pause timer" : "Start timer"}
            data-testid={isRunning ? "pause-button" : "start-button"}
          >
            {isRunning ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>
          {isRunning && (
            <Button
              onClick={handleResetButtonClick}
              variant="ghost"
              size="lg"
              className="rounded-full h-14 w-14 p-0"
              aria-label={isBreakMode ? "Cancel break" : "Reset timer"}
              data-testid={isBreakMode ? "cancel-break-button" : "reset-button"}
            >
              {isBreakMode ? (
                <X className="h-6 w-6" />
              ) : (
                <RotateCcw className="h-6 w-6" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Show workout during breaks */}
      {isBreakMode && <WorkoutDisplay isActive={isRunning} mode={mode} />}

      {/* Dialog for adding notes to completed sessions */}
      <SessionNoteDialog
        open={showNoteDialog}
        onOpenChange={setShowNoteDialog}
        onSubmit={handleNoteSubmit}
      />

      {/* Reset confirmation modal */}
      <Dialog
        open={showResetConfirmation}
        onOpenChange={setShowResetConfirmation}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Reset</DialogTitle>
            <DialogDescription>
              Are you sure you want to{" "}
              {isBreakMode ? "cancel your break" : "reset the timer"}? Your
              current progress will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetConfirmation(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCancelBreak}>
              {isBreakMode ? "End Break" : "Reset Timer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add the TaskList component */}
      <TaskList />
    </div>
  );
}
