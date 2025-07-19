"use client";

import { Suspense, useEffect, useState, lazy } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Timer from "@/components/timer";
import { useTimer, TimerProvider } from "@/lib/timer-context";
import { useTasks } from "@/lib/task-context";
import { useAuth } from "@/lib/auth-context";
import {
  TaskList,
  useTaskList,
  TaskListProvider,
} from "@/components/task-list";
import { Loader2, History, Settings, BookOpen } from "lucide-react";
import ConfettiAnimation from "@/components/confetti-animation";
import GoalReachedModal from "@/components/goal-reached-modal";
import PWAInstallPrompt from "@/components/pwa-install-prompt";
import OfflineIndicator from "@/components/offline-indicator";
import NotificationPermissionPrompt from "@/components/notification-permission-prompt";
import ServiceWorkerErrorHandler from "@/components/sw-error-handler";
import PerformanceMonitor from "@/components/performance-monitor";

// Lazy load pages to reduce initial bundle size
const JournalPage = lazy(() => import("./journal/journal-client"));
const HistoryPage = lazy(() => import("./history/history-client"));
const SettingsPage = lazy(() => import("./settings/settings-client"));

// Fallback components
const JournalFallback = () => (
  <div className="flex items-center justify-center h-full">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

const HistoryFallback = () => (
  <div className="flex items-center justify-center h-full">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

const SettingsFallback = () => (
  <div className="flex items-center justify-center h-full">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

// Client content component that uses the timer context
function ClientContent() {
  const [activeTab, setActiveTab] = useState("timer");
  const {
    playConfetti,
    setPlayConfetti,
    showGoalReachedModal,
    setShowGoalReachedModal,
    settings,
    toggleTimer,
    mode,
    formatTime,
    timeLeft,
  } = useTimer();
  const { tasks, getNextTask, setCurrentTaskId } = useTasks();
  const { setOpen } = useTaskList();
  const { isLoading, user } = useAuth(); // Get loading state from auth context

  // Add global keyboard shortcut for Option+Cmd+Space to start first task
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Option (Alt) + Command (Meta) + Space
      if (e.altKey && e.metaKey && e.code === "Space") {
        e.preventDefault();

        // Get the first incomplete task
        const nextTask = getNextTask();

        if (nextTask) {
          // Set the current task and start the timer
          setCurrentTaskId(nextTask.id);
          toggleTimer();
        } else {
          // If no tasks, open the task list
          setOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [getNextTask, setCurrentTaskId, toggleTimer, setOpen]);

  // Show loading indicator when auth is loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your data...</p>
          <p className="text-xs text-muted-foreground max-w-xs text-center">
            This may take a moment. We've disabled automatic sync to prevent
            freezing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="container flex flex-col items-center justify-start min-h-screen pt-0 mx-auto overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          defaultValue="timer"
          className="w-full max-w-7xl"
        >
          <div className="w-full flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <h1
                className="text-xs font-bold cursor-pointer"
                style={{ fontSize: "14px" }}
                onClick={() => setActiveTab("timer")}
              >
                Pomo<span className="text-primary">Fit</span>
              </h1>
              {activeTab !== "timer" && (
                <span className="text-xs text-muted-foreground font-mono">
                  {formatTime(timeLeft)} {mode === "pomodoro" ? "🎯" : "🏃‍♂️"}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <TabsList className="h-8 bg-transparent">
                <TabsTrigger
                  value="journal"
                  className="bg-transparent px-2"
                  aria-label="View journal"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="sr-only">Journal</span>
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="bg-transparent px-2"
                  aria-label="View history"
                >
                  <History className="h-3.5 w-3.5" />
                  <span className="sr-only">History</span>
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="bg-transparent px-2"
                  aria-label="View settings"
                  data-testid="settings-button"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span className="sr-only">Settings</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent
            value="timer"
            className="w-full h-[calc(100vh-60px)] overflow-hidden"
          >
            <Timer useIconButtons={true} />
          </TabsContent>
          <TabsContent
            value="journal"
            className="w-full h-[calc(100vh-60px)] overflow-hidden"
          >
            <Suspense fallback={<JournalFallback />}>
              {activeTab === "journal" && <JournalPage />}
            </Suspense>
          </TabsContent>
          <TabsContent
            value="history"
            className="w-full h-[calc(100vh-60px)] overflow-auto"
          >
            <Suspense fallback={<HistoryFallback />}>
              {activeTab === "history" && <HistoryPage />}
            </Suspense>
          </TabsContent>
          <TabsContent
            value="settings"
            className="w-full h-[calc(100vh-60px)] overflow-auto"
          >
            <Suspense fallback={<SettingsFallback />}>
              {activeTab === "settings" && <SettingsPage />}
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>

      {/* Confetti animation that plays 3 times when a pomodoro is completed */}
      <ConfettiAnimation
        play={playConfetti}
        times={3}
        onComplete={() => setPlayConfetti(false)}
      />

      {/* Goal reached modal with continuous confetti */}
      <GoalReachedModal
        open={showGoalReachedModal}
        onOpenChange={setShowGoalReachedModal}
        goal={settings.pomodoroGoal}
      />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Add the Notification Permission Prompt */}
      <NotificationPermissionPrompt />

      {/* Service Worker Error Handler */}
      <ServiceWorkerErrorHandler />

      {/* Performance Monitor (development only) */}
      <PerformanceMonitor />
    </>
  );
}

// Wrapper component that provides the timer context
export default function ClientPage() {
  return (
    <TimerProvider>
      <TaskListProvider>
        <ClientContent />
      </TaskListProvider>
    </TimerProvider>
  );
}
