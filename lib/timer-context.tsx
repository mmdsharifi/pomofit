"use client";

import React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useToast } from "@/components/ui/use-toast";
import { getHistoryByDate, useHistory } from "@/lib/history-utils";
import { sendTimerNotification } from "@/lib/notification-service";
import { useLocalStorage } from "@/lib/use-local-storage";
import { useSettingsSync } from "@/lib/settings-sync-service";
import { useAuth } from "@/lib/auth-context";
// Import task context directly
import { useTasks as useTasksHook } from "@/lib/task-context";

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
  settings: {
    pomodoroTime: number;
    shortBreakTime: number;
    longBreakTime: number;
    pomodoroGoal: number;
    workoutGifs: string[];
  };
  playConfetti: boolean;
  setPlayConfetti: (play: boolean) => void;
  getRandomMotivationalMessage: () => string;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Remove old beep sound logic and use mp3 files for all timer sounds
const playStartSound = () => {
  try {
    const audio = new Audio("/sounds/break-start.mp3"); // Use your preferred start sound file
    audio.play();
  } catch (error) {
    console.error("Error playing start sound:", error);
  }
};

const playEndSound = (toastFn: any) => {
  try {
    const audio = new Audio("/sounds/break-end.mp3"); // Use your preferred end sound file
    audio.play();
  } catch (error) {
    console.error("Error playing end sound:", error);
    if (toastFn) {
      toastFn({
        title: "Timer completed",
        description: "Your timer has finished.",
      });
    }
  }
};

// Function to play break start sound
const playBreakStartSound = () => {
  try {
    const audio = new Audio("/sounds/break-start.mp3");
    audio.play();
  } catch (error) {
    console.error("Error playing break start sound:", error);
  }
};

// Function to play break end sound
const playBreakEndSound = () => {
  try {
    const audio = new Audio("/sounds/break-end.mp3");
    audio.play();
  } catch (error) {
    console.error("Error playing break end sound:", error);
  }
};

// Updated motivational messages with emojis and more variety
const restMotivationalMessages = [
  "Great job! 🌟 Take a moment to stretch and recharge.",
  "Well done! 🧘‍♀️ Time for a quick break to refresh your mind.",
  "Awesome work! 💪 Stand up and move around a bit.",
  "Nice focus session! 👁️ Give your eyes a rest from the screen.",
  "You're making progress! 💧 Take this time to hydrate.",
  "Excellent work! ⏱️ A short break helps maintain productivity.",
  "You're crushing it! 🧠 Enjoy this moment to breathe and reset.",
  "Fantastic session! 🌈 Use this break to clear your mind.",
  "Solid work! 🔋 Take a moment to relax and recharge.",
  "Great progress! 🎯 A quick break will help you stay focused.",
  "Time to stretch! 🤸‍♂️ Try touching your toes or reaching for the sky.",
  "Break time! 💦 Remember to stay hydrated for optimal brain function.",
  "Pomodoro complete! 🍅 How about a quick workout during this break?",
  "Focus session done! 🌿 Take a deep breath and enjoy this moment.",
  "Nice work! 👏 Your brain deserves this short rest period.",
  "Time to recharge! 🔄 Maybe do a few jumping jacks to get the blood flowing?",
  "Great session! 🧩 Let your mind wander freely during this break.",
  "Well done! 🚶‍♀️ A short walk around the room can boost your creativity.",
  "Break time! 👀 Try the 20-20-20 rule: look at something 20 feet away for 20 seconds.",
  "Excellent focus! 🌊 Use this break to reset your mental state.",
  "Session complete! 🎵 Maybe listen to a quick tune to refresh?",
  "Time to pause! 🧘‍♂️ Try a quick mindfulness exercise during this break.",
  "Good job! 💆‍♀️ Roll your shoulders and stretch your neck.",
  "Break time! 🌱 Each rest period helps grow your productivity.",
  "Focus complete! 🏋️‍♀️ How about a few push-ups or squats?",
];

// Helper function to get today's date as a string
const getTodayDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
};

// Function to count pomodoro sessions for today from history
const countTodaysPomodoroSessions = (): number => {
  try {
    // Get today's sessions from history
    const todaySessions = getHistoryByDate(new Date());

    // Count only pomodoro sessions (not breaks)
    return todaySessions.filter((session) => session.mode === "pomodoro")
      .length;
  } catch (error) {
    console.error("Error counting today's pomodoro sessions:", error);
    return 0;
  }
};

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
  });

  // Get settings sync functions
  const { initialSync: syncSettings, updateSettings } = useSettingsSync();

  // Sync settings when user logs in
  useEffect(() => {
    if (user) {
      syncSettings(settings)
        .then((syncedSettings) => {
          setSettings(syncedSettings);
        })
        .catch((error) => {
          console.error("Error syncing settings:", error);
        });
    }
  }, [user, syncSettings, settings, setSettings]);

  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [timeLeft, setTimeLeft] = useState(settings.pomodoroTime * 60);
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
        currentTaskRef.current = { id: currentTaskId, title: task.title };
        console.log("Current task updated:", currentTaskId, task.title);
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

  // Initialize pomodorosCompleted by counting actual sessions from history
  const [pomodorosCompleted, setPomodorosCompleted] = useState(() => {
    if (typeof window !== "undefined") {
      // Count actual pomodoro sessions for today from history
      return countTodaysPomodoroSessions();
    }
    return 0;
  });

  // Calculate total time based on current mode
  const getTotalTime = useCallback(
    (timerMode: TimerMode) => {
      switch (timerMode) {
        case "pomodoro":
          return settings.pomodoroTime * 60;
        case "shortBreak":
          return settings.shortBreakTime * 60;
        case "longBreak":
          return settings.longBreakTime * 60;
      }
    },
    [settings.pomodoroTime, settings.shortBreakTime, settings.longBreakTime]
  );

  // Reset timer when mode changes or settings change
  useEffect(() => {
    const totalTime = getTotalTime(mode);
    setTimeLeft(totalTime);
    // Only reset isRunning if we're not in a completion state
    if (!isCompletingTimerRef.current) {
      setIsRunning(false);
    }
  }, [mode, getTotalTime]);

  // Timer logic - use a ref for the interval to avoid dependency issues
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

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

      // Play end sound
      playEndSound(toast);

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
            console.log("Incrementing pomodoro count for task:", currentTaskId);
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

  // Update document title
  useEffect(() => {
    const originalTitle = document.title;

    if (mode === "pomodoro") {
      document.title = `Focus - ${formatTime(timeLeft)}`;
    } else {
      document.title = `Rest - ${formatTime(timeLeft)}`;
    }

    return () => {
      document.title = originalTitle;
    };
  }, [mode, timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

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
    console.log(
      "Adding session with task:",
      currentSessionRef.current.taskId,
      currentSessionRef.current.taskTitle
    );

    // Create the session object
    const session = {
      id: Date.now().toString(),
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

    setShowNoteDialog(false);

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

  // Add this function to the TimerProvider component
  const getRandomMotivationalMessage = useCallback(() => {
    const randomIndex = Math.floor(
      Math.random() * restMotivationalMessages.length
    );
    return restMotivationalMessages[randomIndex];
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
