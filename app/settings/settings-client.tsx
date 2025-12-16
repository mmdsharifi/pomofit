"use client";

import type React from "react";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LucideIcon } from "lucide-react";
import {
  Check,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Info,
  ArrowUpRight,
  Trash2,
  Sun,
  Moon,
  Laptop,
  LayoutGrid,
  Timer,
  Dumbbell,
  Database,
} from "lucide-react";
import { useLocalStorage } from "@/lib/use-local-storage";
import { workoutGifs } from "@/lib/workout-data";
import { useTimer } from "@/lib/timer-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Player, PlayerEvent } from "@lottiefiles/react-lottie-player";
import { useTheme } from "@/lib/theme-context";
import NotificationSettings from "@/components/notification-settings";
import { useTasks } from "@/lib/task-context";
import { useHistory } from "@/lib/history-utils";
import { convertToCSV, parseCSVData } from "@/lib/csv-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import VersionDisplay from "@/components/version-display";
import { Switch } from "@/components/ui/switch";
import {
  defaultFitOnWorkouts,
  defaultWorkoutSources,
  fitOnMoods,
  type FitOnMoodId,
  type FitOnWorkout,
} from "@/lib/fiton-data";
import { cn } from "@/lib/utils";

type SectionId = "general" | "focus" | "movement" | "data";

type SectionConfig = {
  id: SectionId;
  label: string;
  description: string;
  icon: LucideIcon;
};

const SETTINGS_SECTIONS: SectionConfig[] = [
  {
    id: "general",
    label: "General",
    description: "Theme, notifications, offline info",
    icon: LayoutGrid,
  },
  {
    id: "focus",
    label: "Focus",
    description: "Timer lengths & fast testing",
    icon: Timer,
  },
  {
    id: "movement",
    label: "Movement",
    description: "Break workouts & FitOn links",
    icon: Dumbbell,
  },
  {
    id: "data",
    label: "Data",
    description: "Exports, imports, backups",
    icon: Database,
  },
];

export default function SettingsClient() {
  const { toast } = useToast();
  const { resetTimer } = useTimer();
  const playerRefs = useRef<{ [key: string]: Player | null }>({});
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { manualSync, isSyncing } = useTasks();
  const { tasks } = useTasks();
  const { history, taskCompletions } = useHistory();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("general");

  // Add this useEffect to handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get settings from local storage
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

  // Local state for form values
  const [pomodoroTime, setPomodoroTime] = useState(25);
  const [shortBreakTime, setShortBreakTime] = useState(5);
  const [longBreakTime, setLongBreakTime] = useState(15);
  const [pomodoroGoal, setPomodoroGoal] = useState(8);
  const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([
    "pushups",
    "squats",
    "lunges",
    "jumping-jacks",
    "plank",
  ]);
  const [workoutSources, setWorkoutSources] = useState({
    ...defaultWorkoutSources,
  });
  const [fitonWorkouts, setFitonWorkouts] = useState<FitOnWorkout[]>([
    ...defaultFitOnWorkouts,
  ]);
  const [showWorkoutManager, setShowWorkoutManager] = useState(false);
  const [previewMood, setPreviewMood] = useState<FitOnMoodId | null>(null);
  const [previewWorkoutId, setPreviewWorkoutId] = useState<string | null>(null);
  const [newFitOnWorkout, setNewFitOnWorkout] = useState<
    Omit<FitOnWorkout, "id" | "emoji">
  >({
    mood: fitOnMoods[0]?.id ?? "sleepy",
    title: "",
    minutes: 5,
    type: "",
    url: "",
    note: "",
  });

  const [hoveredWorkout, setHoveredWorkout] = useState<string | null>(null);
  const [lottieErrors, setLottieErrors] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [devModeFastTimers, setDevModeFastTimers] = useState(false);
  const isAddFitOnWorkoutDisabled =
    !newFitOnWorkout.title.trim() ||
    !newFitOnWorkout.type.trim() ||
    !newFitOnWorkout.url.trim();

  const moodsWithWorkouts = useMemo(() => {
    const moodSet = new Set(fitonWorkouts.map((workout) => workout.mood));
    return fitOnMoods.filter((mood) => moodSet.has(mood.id));
  }, [fitonWorkouts]);

  const pickRandomPreview = useCallback(
    (mood: FitOnMoodId | null) => {
      if (!mood) {
        setPreviewWorkoutId(null);
        return;
      }

      const candidates = fitonWorkouts.filter((workout) => workout.mood === mood);
      if (candidates.length === 0) {
        setPreviewWorkoutId(null);
        return;
      }

      const randomIndex = Math.floor(Math.random() * candidates.length);
      setPreviewWorkoutId(candidates[randomIndex].id);
    },
    [fitonWorkouts]
  );

  useEffect(() => {
    if (fitonWorkouts.length === 0) {
      setPreviewMood(null);
      setPreviewWorkoutId(null);
      return;
    }

    setPreviewMood((prev) => {
      if (prev && fitonWorkouts.some((workout) => workout.mood === prev)) {
        return prev;
      }
      return moodsWithWorkouts[0]?.id ?? null;
    });
  }, [fitonWorkouts, moodsWithWorkouts]);

  useEffect(() => {
    if (previewMood) {
      pickRandomPreview(previewMood);
    } else {
      setPreviewWorkoutId(null);
    }
  }, [previewMood, pickRandomPreview]);

  const previewWorkout = useMemo(() => {
    if (!previewWorkoutId) return null;
    return fitonWorkouts.find((workout) => workout.id === previewWorkoutId) || null;
  }, [fitonWorkouts, previewWorkoutId]);

  const previewMoodCount = useMemo(() => {
    if (!previewMood) return 0;
    return fitonWorkouts.filter((workout) => workout.mood === previewMood).length;
  }, [fitonWorkouts, previewMood]);

  const handleShufflePreview = () => {
    if (previewMood) {
      pickRandomPreview(previewMood);
    }
  };

  useEffect(() => {
    if (fitonWorkouts.length === 0) {
      setShowWorkoutManager(true);
    }
  }, [fitonWorkouts.length]);

  // Update local state when settings change - only once when component mounts
  useEffect(() => {
    setPomodoroTime(settings.pomodoroTime);
    setShortBreakTime(settings.shortBreakTime);
    setLongBreakTime(settings.longBreakTime);
    setPomodoroGoal(settings.pomodoroGoal || 8);
    setSelectedWorkouts(settings.workoutGifs);
    setWorkoutSources(
      settings.workoutSources || { ...defaultWorkoutSources }
    );
    setFitonWorkouts(
      settings.fitonWorkouts && settings.fitonWorkouts.length > 0
        ? settings.fitonWorkouts
        : [...defaultFitOnWorkouts]
    );
    setDevModeFastTimers(Boolean(settings.devModeFastTimers));
  }, [
    settings.pomodoroTime,
    settings.shortBreakTime,
    settings.longBreakTime,
    settings.pomodoroGoal,
    settings.workoutGifs,
    settings.workoutSources,
    settings.fitonWorkouts,
    settings.devModeFastTimers,
  ]);

  const handleSave = () => {
    // Ensure at least one workout is selected
    if (selectedWorkouts.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one workout.",
        variant: "destructive",
      });
      return;
    }

    if (!workoutSources.lottie && !workoutSources.fiton) {
      toast({
        title: "Error",
        description: "Enable at least one workout source.",
        variant: "destructive",
      });
      return;
    }

    if (workoutSources.fiton && fitonWorkouts.length === 0) {
      toast({
        title: "Error",
        description: "Add at least one FitOn workout or disable FitOn source.",
        variant: "destructive",
      });
      return;
    }

    // Validate pomodoro goal
    const goalValue = Math.max(1, Math.min(20, pomodoroGoal));

    // Save settings to local storage
    setSettings({
      pomodoroTime,
      shortBreakTime,
      longBreakTime,
      pomodoroGoal: goalValue,
      workoutGifs: selectedWorkouts,
      workoutSources,
      fitonWorkouts,
      devModeFastTimers: isDevEnvironment ? devModeFastTimers : false,
    });

    // Reset the timer to apply new duration settings
    resetTimer();

    // Show success toast
    toast({
      title: "Settings saved",
      description: "Your timer settings have been updated.",
    });

    // Force a reload to ensure all components pick up the new settings
    window.location.reload();
  };

  const toggleWorkout = (workoutId: string) => {
    if (selectedWorkouts.includes(workoutId)) {
      setSelectedWorkouts(selectedWorkouts.filter((id) => id !== workoutId));
    } else {
      setSelectedWorkouts([...selectedWorkouts, workoutId]);
    }
  };

  const handlePomodoroGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value);
    if (!isNaN(value)) {
      setPomodoroGoal(Math.max(1, Math.min(20, value)));
    }
  };

  const handleMouseEnter = (workoutId: string) => {
    setHoveredWorkout(workoutId);
    const player = playerRefs.current[workoutId];
    if (player && !lottieErrors[workoutId]) {
      player.play();
    }
  };

  const handleMouseLeave = (workoutId: string) => {
    setHoveredWorkout(null);
    const player = playerRefs.current[workoutId];
    if (player) {
      player.stop();
    }
  };

  const handleLottieError = (workoutId: string) => {
    setLottieErrors((prev) => ({ ...prev, [workoutId]: true }));
  };

  const handleLottieLoad = (workoutId: string) => {
    setLottieErrors((prev) => ({ ...prev, [workoutId]: false }));
  };

  const handleWorkoutSourceToggle = (
    source: keyof typeof workoutSources,
    value: boolean
  ) => {
    setWorkoutSources((prev) => ({ ...prev, [source]: value }));
  };

  const addFitOnWorkout = () => {
    const trimmedTitle = newFitOnWorkout.title.trim();
    const trimmedType = newFitOnWorkout.type.trim();
    const trimmedUrl = newFitOnWorkout.url.trim();

    if (!trimmedTitle || !trimmedType || !trimmedUrl) {
      toast({
        title: "Incomplete workout",
        description: "Title, type, and URL are required.",
        variant: "destructive",
      });
      return;
    }

    const moodMeta = fitOnMoods.find((mood) => mood.id === newFitOnWorkout.mood);
    const safeId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${newFitOnWorkout.mood}-${Date.now()}`;

    const nextWorkout: FitOnWorkout = {
      id: safeId,
      mood: newFitOnWorkout.mood,
      emoji: moodMeta?.emoji ?? "🏋️",
      title: trimmedTitle,
      minutes: Math.max(1, newFitOnWorkout.minutes),
      type: trimmedType,
      url: trimmedUrl,
      note: newFitOnWorkout.note?.trim() || undefined,
    };

    setFitonWorkouts((prev) => [...prev, nextWorkout]);
    setNewFitOnWorkout((prev) => ({
      ...prev,
      title: "",
      minutes: 5,
      type: "",
      url: "",
      note: "",
    }));
  };

  const removeFitOnWorkout = (workoutId: string) => {
    setFitonWorkouts((prev) =>
      prev.filter((workout) => workout.id !== workoutId)
    );
  };

  // Export data to CSV
  const handleExportData = () => {
    try {
      // Gather all data
      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        tasks: tasks,
        sessions: history,
        taskCompletions: taskCompletions,
        settings: settings,
      };

      // Convert to CSV
      const csvData = convertToCSV(exportData);

      // Create a blob and download link
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pomofit-export-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);

      toast({
        title: "Export successful",
        description: "Your data has been exported to a CSV file.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your data.",
        variant: "destructive",
      });
    }
  };

  // Handle file selection for import
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportPreview(null);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvData = event.target?.result as string;
        const parsedData = parseCSVData(csvData);

        if (!parsedData) {
          setImportError(
            "Could not parse the import file. Please make sure it's a valid Pomofit export."
          );
          return;
        }

        // Set preview data
        setImportPreview({
          tasks: parsedData.tasks.length,
          sessions: parsedData.sessions.length,
          taskCompletions: parsedData.taskCompletions.length,
          settings: parsedData.settings ? "Yes" : "No",
          exportDate: new Date(parsedData.exportDate).toLocaleString(),
        });

        // Store the full parsed data in a ref for later use
        // @ts-ignore - Adding a custom property to the file input
        fileInputRef.current.parsedData = parsedData;
      } catch (error) {
        console.error("Import preview error:", error);
        setImportError("There was an error reading the import file.");
      }
    };

    reader.onerror = () => {
      setImportError("There was an error reading the file.");
    };

    reader.readAsText(file);
  };

  // Handle import confirmation
  const handleImportConfirm = () => {
    try {
      // @ts-ignore - Accessing the custom property we added
      const parsedData = fileInputRef.current?.parsedData;

      if (!parsedData) {
        toast({
          title: "Import failed",
          description: "No valid import data found.",
          variant: "destructive",
        });
        return;
      }

      // Import settings
      if (parsedData.settings && Object.keys(parsedData.settings).length > 0) {
        setSettings(parsedData.settings);
      }

      // Import tasks (using localStorage directly to avoid hooks limitations)
      if (parsedData.tasks && parsedData.tasks.length > 0) {
        localStorage.setItem("pomofit-tasks", JSON.stringify(parsedData.tasks));
      }

      // Import sessions
      if (parsedData.sessions && parsedData.sessions.length > 0) {
        localStorage.setItem(
          "pomofit-history",
          JSON.stringify(parsedData.sessions)
        );
      }

      // Import task completions
      if (parsedData.taskCompletions && parsedData.taskCompletions.length > 0) {
        localStorage.setItem(
          "pomofit-task-completions",
          JSON.stringify(parsedData.taskCompletions)
        );
      }

      // Close dialog
      setImportDialogOpen(false);

      // Show success message
      toast({
        title: "Import successful",
        description:
          "Your data has been imported. The page will reload to apply changes.",
      });

      // Reload the page to apply all changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: "There was an error importing your data.",
        variant: "destructive",
      });
    }
  };

  // Render workout preview based on type (Lottie or image)
  const renderWorkoutPreview = (workout: (typeof workoutGifs)[0]) => {
    const hasError = lottieErrors[workout.id];
    const lottieUrl = workout.isLottie
      ? workout.gifUrl
      : "https://assets-v2.lottiefiles.com/a/a48a9a00-1171-11ee-b960-63b518b1c7e7/gs1ympxGu6.lottie";

    return (
      <div
        className="h-48 bg-muted rounded-md overflow-hidden flex items-center justify-center"
        onMouseEnter={() => handleMouseEnter(workout.id)}
        onMouseLeave={() => handleMouseLeave(workout.id)}
      >
        {hasError ? (
          // Fallback for error state
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <span className="text-xs">Animation unavailable</span>
          </div>
        ) : (
          <Player
            ref={(el) => {
              playerRefs.current[workout.id] = el;
            }}
            src={lottieUrl}
            autoplay={false}
            loop={true}
            renderer="canvas"
            background="transparent"
            style={{ width: "100%", height: "100%" }}
            onEvent={(event) => {
              if (event === PlayerEvent.Error) {
                handleLottieError(workout.id);
              } else if (event === PlayerEvent.Load) {
                handleLottieLoad(workout.id);
              }
            }}
          />
        )}
      </div>
    );
  };
  const contentSectionId = "settings-panel-content";

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Choose a section on the left to keep the right side focused on what
          you are editing.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav
          className="space-y-3 rounded-2xl border bg-card/30 p-4 shadow-sm lg:sticky lg:top-6 lg:h-fit lg:w-1/3 lg:max-w-sm"
          aria-label="Settings sections"
        >
          {SETTINGS_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/40"
                )}
                aria-current={isActive ? "page" : undefined}
                aria-controls={contentSectionId}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border",
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium">{section.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="flex-1 space-y-6" id={contentSectionId}>
          {activeSection === "general" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize the look and feel of the app
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="inline-flex rounded-md border border-input overflow-hidden">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-none border-0 ${
                          theme === "light" ? "bg-accent" : ""
                        }`}
                        onClick={() => setTheme("light")}
                      >
                        <Sun className="h-4 w-4 mr-2" />
                        <span>Light</span>
                      </Button>
                      <div className="w-px h-full bg-input"></div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-none border-0 ${
                          theme === "dark" ? "bg-accent" : ""
                        }`}
                        onClick={() => setTheme("dark")}
                      >
                        <Moon className="h-4 w-4 mr-2" />
                        <span>Dark</span>
                      </Button>
                      <div className="w-px h-full bg-input"></div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-none border-0 ${
                          theme === "system" ? "bg-accent" : ""
                        }`}
                        onClick={() => setTheme("system")}
                      >
                        <Laptop className="h-4 w-4 mr-2" />
                        <span>System</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Offline Mode</CardTitle>
                  <CardDescription>
                    Supabase integration is temporarily disabled
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground">
                      The Supabase integration has been temporarily disabled. The
                      app is currently working in offline mode only. All data is
                      stored locally in your browser.
                    </p>
                    <Button disabled className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Sync Disabled
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Manage timer notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <NotificationSettings />
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === "focus" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Timer Settings</CardTitle>
                  <CardDescription>
                    Customize your Pomodoro timer durations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label htmlFor="pomodoro-time">
                        Pomodoro Duration: {pomodoroTime} minutes
                      </label>
                    </div>
                    <Slider
                      id="pomodoro-time"
                      min={5}
                      max={60}
                      step={5}
                      value={[pomodoroTime]}
                      onValueChange={(value) => setPomodoroTime(value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label htmlFor="short-break-time">
                        Short Break: {shortBreakTime} minutes
                      </label>
                    </div>
                    <Slider
                      id="short-break-time"
                      min={1}
                      max={15}
                      step={1}
                      value={[shortBreakTime]}
                      onValueChange={(value) => setShortBreakTime(value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label htmlFor="long-break-time">
                        Long Break: {longBreakTime} minutes
                      </label>
                    </div>
                    <Slider
                      id="long-break-time"
                      min={5}
                      max={30}
                      step={5}
                      value={[longBreakTime]}
                      onValueChange={(value) => setLongBreakTime(value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pomodoro-goal">Daily Pomodoro Goal</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="pomodoro-goal"
                        type="number"
                        min="1"
                        max="20"
                        value={pomodoroGoal}
                        onChange={handlePomodoroGoalChange}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">
                        pomodoros
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Set your daily goal (1-20 pomodoros)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {isDevEnvironment && (
                <Card>
                  <CardHeader>
                    <CardTitle>Dev Mode</CardTitle>
                    <CardDescription>
                      Tools to speed up local testing (ignored in production builds)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">
                          5-second sessions & breaks
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Override pomodoro and rest timers to 5 seconds so you
                          can iterate quickly while developing.
                        </p>
                      </div>
                      <Switch
                        checked={devModeFastTimers}
                        onCheckedChange={(checked) =>
                          setDevModeFastTimers(Boolean(checked))
                        }
                        aria-label="Enable dev fast timers"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This toggle only works when running Pomofit in development.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {activeSection === "movement" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Workout Sources</CardTitle>
                  <CardDescription>
                    Choose which experiences appear during your breaks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                      id="source-lottie"
                      checked={workoutSources.lottie}
                      onCheckedChange={(checked) =>
                        handleWorkoutSourceToggle("lottie", checked === true)
                      }
                    />
                    <div>
                      <p className="font-medium">Lottie Workouts</p>
                      <p className="text-sm text-muted-foreground">
                        Looping bodyweight animations that play directly in
                        Pomofit.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                      id="source-fiton"
                      checked={workoutSources.fiton}
                      onCheckedChange={(checked) =>
                        handleWorkoutSourceToggle("fiton", checked === true)
                      }
                    />
                    <div>
                      <p className="font-medium">FitOn Recommendations</p>
                      <p className="text-sm text-muted-foreground">
                        Mood-based FitOn workout links so you can jump straight
                        into a guided session.
                      </p>
                    </div>
                  </label>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lottie Workouts</CardTitle>
                  <CardDescription>
                    Select which animations rotate during breaks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!workoutSources.lottie && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Enable Lottie workouts above to edit this list.
                    </p>
                  )}
                  <div
                    className={cn(
                      "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3",
                      !workoutSources.lottie && "pointer-events-none opacity-50"
                    )}
                  >
                    {workoutGifs.map((workout) => (
                      <div
                        key={workout.id}
                        className="border rounded-lg overflow-hidden cursor-pointer transition-colors hover:border-primary"
                        onClick={() => toggleWorkout(workout.id)}
                      >
                        {renderWorkoutPreview(workout)}
                        <div className="flex justify-between items-center p-3 bg-background">
                          <h3 className="font-medium">{workout.name}</h3>
                          {selectedWorkouts.includes(workout.id) ? (
                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-full border border-muted-foreground/30" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>FitOn Workouts</CardTitle>
                  <CardDescription>
                    Manage the mood-based FitOn links shown after each session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {workoutSources.fiton ? (
                    <>
                      <div className="space-y-3 rounded-lg border border-dashed p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">
                              Preview recommendation
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Users see one random workout per mood. Shuffle to
                              preview another pick.
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                            onClick={handleShufflePreview}
                            disabled={!previewMood || previewMoodCount <= 1}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Another suggestion
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {moodsWithWorkouts.map((mood) => (
                            <Button
                              key={`preview-${mood.id}`}
                              type="button"
                              size="sm"
                              variant={
                                previewMood === mood.id ? "default" : "outline"
                              }
                              onClick={() => setPreviewMood(mood.id)}
                            >
                              {mood.emoji} {mood.label}
                            </Button>
                          ))}
                        </div>
                        {previewWorkout ? (
                          <a
                            href={previewWorkout.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-lg border bg-muted/40 p-3 transition-colors hover:border-primary"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium flex items-center gap-2 text-sm">
                                  <span>{previewWorkout.emoji}</span>
                                  {previewWorkout.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {previewWorkout.type} • {previewWorkout.minutes} min
                                </p>
                              </div>
                              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {previewWorkout.note && (
                              <p className="mt-2 text-xs text-muted-foreground">
                                {previewWorkout.note}
                              </p>
                            )}
                          </a>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Add at least one workout for any mood to preview
                            suggestions.
                          </p>
                        )}
                      </div>

                      <div className="space-y-4">
                        {moodsWithWorkouts.map((mood) => {
                          const workouts = groupedWorkouts[mood.id] || [];
                          if (workouts.length === 0) {
                            return null;
                          }

                          return (
                            <div
                              key={mood.id}
                              className="rounded-lg border border-border/50 p-4"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold">
                                    {mood.emoji} {mood.label}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {workouts.length} curated workout
                                    {workouts.length === 1 ? "" : "s"}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {workouts.reduce((acc, workout) => acc + workout.minutes, 0)}
                                  min of options
                                </span>
                              </div>
                              <div className="mt-3 space-y-2">
                                {workouts.map((workout) => (
                                  <div
                                    key={workout.id}
                                    className="flex flex-col gap-2 rounded-md border border-border/50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                                  >
                                    <div>
                                      <p className="font-medium flex items-center gap-2">
                                        <span>{workout.emoji}</span>
                                        {workout.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {workout.type} • {workout.minutes} min
                                      </p>
                                      {workout.note && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                          {workout.note}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <a
                                        href={workout.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                      >
                                        Open
                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                      </a>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-foreground self-start"
                                        onClick={() => removeFitOnWorkout(workout.id)}
                                        aria-label={`Remove ${workout.title}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {fitonWorkouts.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No FitOn workouts yet. Add your favorites below.
                          </p>
                        )}

                        <div className="space-y-3 border-t pt-4">
                          <p className="text-sm font-medium">
                            Add FitOn workout
                          </p>
                          <div className="space-y-3 rounded-md border p-4">
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="fiton-mood">Mood</Label>
                                <Select
                                  value={newFitOnWorkout.mood}
                                  onValueChange={(value) =>
                                    setNewFitOnWorkout((prev) => ({
                                      ...prev,
                                      mood: value as FitOnWorkout["mood"],
                                    }))
                                  }
                                >
                                  <SelectTrigger id="fiton-mood">
                                    <SelectValue placeholder="Select mood" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fitOnMoods.map((mood) => (
                                      <SelectItem key={mood.id} value={mood.id}>
                                        {mood.emoji} {mood.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="fiton-minutes">Minutes</Label>
                                <Input
                                  id="fiton-minutes"
                                  type="number"
                                  min={1}
                                  value={newFitOnWorkout.minutes}
                                  onChange={(e) =>
                                    setNewFitOnWorkout((prev) => ({
                                      ...prev,
                                      minutes: Math.max(
                                        1,
                                        Number.parseInt(e.target.value || "1", 10) || 1
                                      ),
                                    }))
                                  }
                                />
                              </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="fiton-title">Title</Label>
                                <Input
                                  id="fiton-title"
                                  value={newFitOnWorkout.title}
                                  onChange={(e) =>
                                    setNewFitOnWorkout((prev) => ({
                                      ...prev,
                                      title: e.target.value,
                                    }))
                                  }
                                  placeholder="e.g. Standing Stretch"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="fiton-type">Type</Label>
                                <Input
                                  id="fiton-type"
                                  value={newFitOnWorkout.type}
                                  onChange={(e) =>
                                    setNewFitOnWorkout((prev) => ({
                                      ...prev,
                                      type: e.target.value,
                                    }))
                                  }
                                  placeholder="Stretch, Cardio, Meditation..."
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="fiton-url">FitOn Link</Label>
                              <Input
                                id="fiton-url"
                                type="url"
                                value={newFitOnWorkout.url}
                                onChange={(e) =>
                                  setNewFitOnWorkout((prev) => ({
                                    ...prev,
                                    url: e.target.value,
                                  }))
                                }
                                placeholder="https://app.fitonapp.com/..."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="fiton-note">Note (optional)</Label>
                              <Textarea
                                id="fiton-note"
                                value={newFitOnWorkout.note}
                                onChange={(e) =>
                                  setNewFitOnWorkout((prev) => ({
                                    ...prev,
                                    note: e.target.value,
                                  }))
                                }
                                placeholder="Why you like this workout or when to use it"
                              />
                            </div>
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                onClick={addFitOnWorkout}
                                disabled={isAddFitOnWorkoutDisabled}
                              >
                                Add Workout
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Enable FitOn recommendations above to manage your list.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === "data" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>
                    Export and import your Pomofit data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Data is stored locally</AlertTitle>
                    <AlertDescription>
                      Your data is stored in your browser's local storage. Export
                      your data regularly to avoid losing it when clearing browser
                      data.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleExportData}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export Data
                    </Button>

                    <Dialog
                      open={importDialogOpen}
                      onOpenChange={setImportDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => {
                            setImportError(null);
                            setImportPreview(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                        >
                          <Upload className="h-4 w-4" />
                          Import Data
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Import Data</DialogTitle>
                          <DialogDescription>
                            Upload a Pomofit CSV export file to restore your data.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="import-file">Select CSV file</Label>
                            <Input
                              id="import-file"
                              type="file"
                              accept=".csv"
                              ref={fileInputRef}
                              onChange={handleFileSelect}
                            />
                            <p className="text-xs text-muted-foreground">
                              Only Pomofit export files are supported
                            </p>
                          </div>

                          {importError && (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>Import Error</AlertTitle>
                              <AlertDescription>{importError}</AlertDescription>
                            </Alert>
                          )}

                          {importPreview && (
                            <div className="border rounded-md p-3 space-y-2">
                              <h4 className="font-medium">Import Preview</h4>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                <span className="text-muted-foreground">Tasks:</span>
                                <span>{importPreview.tasks}</span>

                                <span className="text-muted-foreground">
                                  Sessions:
                                </span>
                                <span>{importPreview.sessions}</span>

                                <span className="text-muted-foreground">
                                  Task Completions:
                                </span>
                                <span>{importPreview.taskCompletions}</span>

                                <span className="text-muted-foreground">
                                  Settings:
                                </span>
                                <span>{importPreview.settings}</span>

                                <span className="text-muted-foreground">
                                  Export Date:
                                </span>
                                <span>{importPreview.exportDate}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setImportDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleImportConfirm}
                            disabled={!importPreview}
                          >
                            Import Data
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Importing data will replace your current data and reload the
                    application.
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          <div className="space-y-3 border-t pt-6">
            <Button
              onClick={handleSave}
              className="w-full max-w-xs"
              aria-label="Save all settings"
            >
              Save Settings
            </Button>

            <VersionDisplay />
          </div>
        </div>
      </div>
    </div>
  );
}
