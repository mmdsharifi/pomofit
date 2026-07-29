"use client";

import React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { useToast } from "@/components/ui/use-toast";
import { getHistoryByDate, useHistory, countTodaysPomodoroSessions } from "@/lib/history-utils";
import { sendTimerNotification } from "@/lib/notification-service";
import { useLocalStorage } from "@/lib/use-local-storage";
import { useSettingsSync, type UserSettings } from "@/lib/settings-sync-service";
import { useAuth } from "@/lib/auth-context";
// Import task context directly
import { useTasks as useTasksHook } from "@/lib/task-context";
import { defaultFitOnWorkouts, defaultWorkoutSources } from "@/lib/fiton-data";
import { generateId } from "@/lib/generate-id";

export type TimerMode = "pomodoro" | "shortBreak" | "longBreak";

interface TimerContextType {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  pomodorosCompleted: number;
  showNoteDialog: boolean;
  showGoalReachedModal: boolean;
  progressPercentage: number;
  formatTime: (seconds: number) => string;
  toggleTimer: () => void;
  resetTimer: () => void;
  handleModeChange: (newMode: TimerMode) => void;
  setShowNoteDialog: (show: boolean) => void;
  setShowGoalReachedModal: (show: boolean) => void;
  handleNoteSubmit: (
    note: string,
    tags: string[],
    autoStartRest?: boolean
  ) => void;
  settings: UserSettings;
  playConfetti: boolean;
  setPlayConfetti: (play: boolean) => void;
  getRandomMotivationalMessage: () => string;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Import audio functions
import {
  playStartSound,
  playEndSound as playEndSoundUtil,
  playBreakStartSound,
  playBreakEndSound,
} from "./audio-player";
import {
  REST_MOTIVATIONAL_MESSAGES,
  getRandomMotivationalMessage as getRandomMotivationalMessageUtil,
} from "./timer-helpers";

// Create a wrapper component to handle the circular dependency
function TimerProviderWithTasks({ children }: { children: ReactNode }) {
  // Use the task context hook
  const taskContext = useTasksHook();

  return (
    <TimerProviderInner taskContext={taskContext}>
      {children}
    </TimerProviderInner>
  );
}

// Inner provider that receives task context as props
function TimerProviderInner({
  children,
  taskContext,
}: {
  children: ReactNode;
  taskContext: ReturnType<typeof useTasksHook>;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useLocalStorage("pomofit-settings", {
    pomodoroTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    pomodoroGoal: 8,
    workoutGifs: ["pushups", "squats", "lunges", "jumping-jacks", "plank"],
    workoutSources: { ...defaultWorkoutSources },
    fitonWorkouts: [...defaultFitOnWorkouts],
    devModeFastTimers: false,
  });
  const isDevEnvironment = process.env.NODE_ENV === "development";
  const devFastTimersEnabled =
    isDevEnvironment && settings.devModeFastTimers === true;

  // Get settings sync functions
  const { initialSync: syncSettings, updateSettings } = useSettingsSync();

  // Track latest settings in a ref to avoid infinite loops in effects
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Sync settings when user logs in
  useEffect(() => {
    if (user) {
      syncSettings(settingsRef.current)
        .then((syncedSettings) => {
          setSettings({
            ...syncedSettings,
            devModeFastTimers:
              syncedSettings.devModeFastTimers ??
              settingsRef.current.devModeFastTimers ??
              false,
          });
        })
        .catch((error) => {
          console.error("Error syncing settings:", error);
        });
    }
  }, [user, syncSettings, setSettings]);

  // Push settings updates to Supabase when settings change (debounced)
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        updateSettings(settings);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, settings, updateSettings]);

  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [timeLeft, setTimeLeft] = useState(() =>
    devFastTimersEnabled ? 5 : settings.pomodoroTime * 60
  );
  const [isRunning, setIsRunning] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showGoalReachedModal, setShowGoalReachedModal] = useState(false);
  const [playConfetti, setPlayConfetti] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage(
    "pomofit-notifications-enabled",
    false
  );

  // Extract task context values
  const { currentTaskId, tasks, incrementTaskPomodoros } = taskContext;

  // Use the history hook with sync
  const { addSession } = useHistory();

  // Store current task info in a ref to avoid dependency issues
  const currentTaskRef = useRef<{ id: string | null; title: string | null }>({
    id: null,
    title: null,
  });

  // Update current task info when it changes
  useEffect(() => {
    if (currentTaskId) {
      const task = tasks.find((t) => t.id === currentTaskId);
      if (task) {
        const newTaskInfo = { id: currentTaskId, title: task.title };
        // Only update if the task info actually changed
        if (
          currentTaskRef.current.id !== newTaskInfo.id ||
          currentTaskRef.current.title !== newTaskInfo.title
        ) {
          currentTaskRef.current = newTaskInfo;
          // Remove console.log to reduce noise
        }
      }
    }
  }, [currentTaskId, tasks]);

  // Use refs for values that shouldn't trigger re-renders
  const currentSessionRef = useRef({
    startTime: new Date(),
    duration: 0,
    mode: "pomodoro" as TimerMode,
    taskId: null as string | null,
    taskTitle: null as string | null,
  });

  // Store the next mode in a ref to avoid re-renders
  const nextModeRef = useRef<TimerMode | null>(null);

  // Flag to track if we're in a timer completion state
  const isCompletingTimerRef = useRef(false);

  // Timer refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize pomodorosCompleted by counting actual sessions from history
  const [pomodorosCompleted, setPomodorosCompleted] = useState(() => {
    if (typeof window !== "undefined") {
      // Count actual pomodoro sessions for today from history
      return countTodaysPomodoroSessions();
    }
    return 0;
  });

  // Daily reset check for pomodorosCompleted (BUG-26)
  const lastCountDateRef = useRef<string>("");
  useEffect(() => {
    lastCountDateRef.current = new Date().toDateString();

    const checkAndResetDailyCount = () => {
      const today = new Date().toDateString();
      if (today !== lastCountDateRef.current) {
        lastCountDateRef.current = today;
        setPomodorosCompleted(countTodaysPomodoroSessions());
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAndResetDailyCount();
      }
    };

    const intervalId = setInterval(checkAndResetDailyCount, 60_000);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Calculate total time based on current mode
  const getTotalTime = useCallback(
    (timerMode: TimerMode) => {
      if (devFastTimersEnabled) {
        return 5;
      }
      switch (timerMode) {
        case "pomodoro":
          return settings.pomodoroTime * 60;
        case "shortBreak":
          return settings.shortBreakTime * 60;
        case "longBreak":
          return settings.longBreakTime * 60;
      }
    },
    [
      settings.pomodoroTime,
      settings.shortBreakTime,
      settings.longBreakTime,
      devFastTimersEnabled,
    ]
  );

  // Track previous mode to know if mode changed vs settings changed
  const prevModeRef = useRef<TimerMode>(mode);

  // Reset timer when mode changes or settings change
  useEffect(() => {
    const modeChanged = prevModeRef.current !== mode;
    prevModeRef.current = mode;

    if (modeChanged) {
      const totalTime = getTotalTime(mode);
      setTimeLeft(totalTime);
      if (!isCompletingTimerRef.current) {
        setIsRunning(false);
      }
    } else {
      // If settings changed while timer is not running, update total time
      if (!isRunning) {
        const totalTime = getTotalTime(mode);
        setTimeLeft(totalTime);
      }
      // If isRunning is true, do not reset running timer — new durations apply next session
    }
  }, [mode, getTotalTime, isRunning]);

  // Timer logic effect
  useEffect(() => {
    // Clear any existing timers
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isRunning) {
      // Use a more efficient timer that updates every second
      const updateTimer = () => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          return newTime > 0 ? newTime : 0;
        });
      };

      // Use setInterval for consistent 1-second updates
      intervalRef.current = setInterval(updateTimer, 1000);

      // Cleanup function
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [isRunning]);

  // Sync active mode to localStorage for session checks
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isRunning) {
        localStorage.setItem("pomofit-active-mode", mode);
      } else {
        localStorage.removeItem("pomofit-active-mode");
      }
    }
  }, [isRunning, mode]);

  // Add this new useEffect after the timer logic effect
  useEffect(() => {
    // Only add the event listener if the timer is running
    if (isRunning) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        // Standard way to show a confirmation dialog
        e.preventDefault();

        // Set the returnValue to trigger the confirmation dialog
        // The message is typically ignored by modern browsers, which use their own standard messages
        e.returnValue =
          "Your timer is still running. Are you sure you want to leave?";

        // Return a string to show the confirmation dialog
        return e.returnValue;
      };

      // Add the event listener
      window.addEventListener("beforeunload", handleBeforeUnload);

      // Clean up the event listener when the component unmounts or when isRunning changes
      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [isRunning]); // Only re-run this effect when isRunning changes

  // Handle timer completion separately to avoid infinite loops
  useEffect(() => {
    // Only run this effect when the timer reaches zero while running
    if (isRunning && timeLeft === 0) {
      // Set the completion flag to true
      isCompletingTimerRef.current = true;

      // Stop the timer first
      setIsRunning(false);

      // Play end sound with fallback to toast
      playEndSoundUtil((options) => {
        toast(options);
      });

      // In the timer completion effect, add this after the playEndSound call:
      if (notificationsEnabled) {
        if (mode === "pomodoro") {
          // Send notification for completed pomodoro
          sendTimerNotification("pomodoro");
        } else {
          // Send notification for completed break
          sendTimerNotification(mode);
        }
      }

      // Handle timer completion based on mode
      if (mode === "pomodoro") {
        // Use setTimeout to avoid state update loops
        setTimeout(() => {
          // Update pomodoros completed
          const newPomodorosCompleted = pomodorosCompleted + 1;
          setPomodorosCompleted(newPomodorosCompleted);

          // Play confetti animation
          setPlayConfetti(true);

          // If there's a current task, increment its pomodoro count
          if (currentTaskId && incrementTaskPomodoros) {
            // Remove console.log to reduce noise
            incrementTaskPomodoros(currentTaskId);
          }

          // Save the completed session with task information
          currentSessionRef.current = {
            startTime: currentSessionRef.current.startTime,
            duration: settings.pomodoroTime * 60,
            mode: "pomodoro",
            taskId: currentTaskRef.current.id,
            taskTitle: currentTaskRef.current.title,
          };

          // Check if daily goal is reached
          if (newPomodorosCompleted === settings.pomodoroGoal) {
            setShowGoalReachedModal(true);
          }

          // Determine next break type
          const nextBreakMode =
            newPomodorosCompleted % 4 === 0 ? "longBreak" : "shortBreak";
          nextModeRef.current = nextBreakMode;

          // Show toast notification
          toast({
            title:
              nextBreakMode === "longBreak"
                ? "Time for a long break! 🌴"
                : "Pomodoro completed! ✅",
            description:
              nextBreakMode === "longBreak"
                ? "You've completed 4 pomodoros. Take a longer break."
                : "Time for a short break.",
          });

          // Show note dialog
          setShowNoteDialog(true);

          // Reset the completion flag
          isCompletingTimerRef.current = false;
        }, 0);
      } else {
        // Break completed
        setTimeout(() => {
          toast({
            title: "Break completed! 🔄",
            description: "Ready to focus again?",
          });

          // Switch back to pomodoro mode
          setMode("pomodoro");
          playBreakEndSound();

          // Reset the completion flag
          isCompletingTimerRef.current = false;
        }, 0);
      }
    }
  }, [
    isRunning,
    timeLeft,
    mode,
    pomodorosCompleted,
    settings.pomodoroGoal,
    settings.pomodoroTime,
    toast,
    notificationsEnabled,
    currentTaskId,
    incrementTaskPomodoros,
  ]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Update document title
  useEffect(() => {
    const originalTitle = document.title;

    // Only update title if the page is visible to reduce background processing
    if (document.visibilityState === "visible") {
      if (mode === "pomodoro") {
        document.title = `Focus - ${formatTime(timeLeft)}`;
      } else {
        document.title = `Rest - ${formatTime(timeLeft)}`;
      }
    }

    return () => {
      document.title = originalTitle;
    };
  }, [mode, timeLeft, formatTime]);

  // Pause timer when tab becomes hidden to save energy
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning) {
        // Optionally pause timer when tab is hidden
        // Uncomment the next line if you want to pause timer in background
        // setIsRunning(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRunning]);

  // Calculate progress percentage
  const progressPercentage = (1 - timeLeft / getTotalTime(mode)) * 100;

  // Handle start/pause button click
  const toggleTimer = () => {
    if (!isRunning) {
      // Starting the timer
      if (timeLeft === getTotalTime(mode)) {
        // Starting a new session
        currentSessionRef.current = {
          startTime: new Date(),
          duration: getTotalTime(mode),
          mode,
          taskId: currentTaskRef.current.id,
          taskTitle: currentTaskRef.current.title,
        };
      }

      // Play start sound
      playStartSound();

      setIsRunning(true);
    } else {
      // Pausing the timer
      setIsRunning(false);
    }
  };

  // Handle reset button click
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getTotalTime(mode));
  };

  // Handle mode selection
  const handleModeChange = (newMode: TimerMode) => {
    if (isRunning) {
      const confirm = window.confirm("Timer is running. Change mode anyway?");
      if (!confirm) return;
    }
    setMode(newMode);
    if (newMode === "shortBreak" || newMode === "longBreak") {
      playBreakStartSound();
    } else if (mode === "shortBreak" || mode === "longBreak") {
      // If switching from break to pomodoro
      playBreakEndSound();
    }
  };

  // Handle session note submission
  const handleNoteSubmit = (
    note: string,
    tags: string[],
    autoStartRest = true
  ) => {
    // Create the session object
    const session = {
      id: generateId(),
      startTime: currentSessionRef.current.startTime,
      duration: currentSessionRef.current.duration,
      mode: currentSessionRef.current.mode,
      note,
      tags,
      taskId: currentSessionRef.current.taskId ?? undefined,
      taskTitle: currentSessionRef.current.taskTitle ?? undefined,
    };

    // Add the session to history with sync
    addSession(session);

    // Defer closing the dialog to avoid setState during render
    requestAnimationFrame(() => {
      setShowNoteDialog(false);
    });

    // Start the next session if autoStartRest is enabled
    if (autoStartRest && nextModeRef.current) {
      // Set the mode first
      setMode(nextModeRef.current);
      nextModeRef.current = null;

      // Auto-start the timer after a short delay
      setTimeout(() => {
        // Play start sound before starting the timer
        playStartSound();
        setIsRunning(true);
      }, 500);
    } else {
      // Just set the mode but don't start automatically
      if (nextModeRef.current) {
        setMode(nextModeRef.current);
        nextModeRef.current = null;
      }
    }
  };

  // Use the imported motivational message function
  const getRandomMotivationalMessage = useCallback(() => {
    return getRandomMotivationalMessageUtil();
  }, []);

  const value = {
    mode,
    timeLeft,
    isRunning,
    pomodorosCompleted,
    showNoteDialog,
    showGoalReachedModal,
    progressPercentage,
    formatTime,
    toggleTimer,
    resetTimer,
    handleModeChange,
    setShowNoteDialog,
    setShowGoalReachedModal,
    handleNoteSubmit,
    settings,
    playConfetti,
    setPlayConfetti,
    getRandomMotivationalMessage,
    notificationsEnabled,
    setNotificationsEnabled,
    // Expose nextModeRef for test debug only
    ...(process.env.NODE_ENV === "test" ? { nextModeRef } : {}),
  };

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
}

// Export the wrapper component as TimerProvider
export function TimerProvider({ children }: { children: ReactNode }) {
  return <TimerProviderWithTasks>{children}</TimerProviderWithTasks>;
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}
