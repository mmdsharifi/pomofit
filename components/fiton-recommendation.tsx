"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, RefreshCw, Loader2 } from "lucide-react";
import {
  fitOnMoods,
  type FitOnMoodId,
  type FitOnWorkout,
} from "@/lib/fiton-data";
import { cn } from "@/lib/utils";
import { useOnlineStatus } from "@/lib/sync-utils";
import { Player, PlayerEvent } from "@lottiefiles/react-lottie-player";

interface FitOnRecommendationProps {
  workouts: FitOnWorkout[];
  className?: string;
}

type MoodStats = Record<
  string,
  {
    count: number;
    lastUsed?: number;
  }
>;

export default function FitOnRecommendation({
  workouts,
  className,
}: FitOnRecommendationProps) {
  const isOnline = useOnlineStatus();
  // If no workouts configured at all, render nothing (test expectation)
  if (!workouts || workouts.length === 0) {
    return null;
  }

  const moodMap = useMemo(() => {
    const map = new Map<FitOnMoodId, FitOnWorkout[]>();
    workouts.forEach((workout) => {
      if (!map.has(workout.mood)) {
        map.set(workout.mood, []);
      }
      map.get(workout.mood)!.push(workout);
    });
    return map;
  }, [workouts]);

  // Lightweight personalization data loaded client-side to avoid hydration mismatch
  const [moodStats, setMoodStats] = useState<MoodStats>({});
  const [clientHour, setClientHour] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("fiton-mood-stats");
      if (raw) {
        setMoodStats(JSON.parse(raw));
      }
    } catch {
      // Ignore malformed data
    }
    setClientHour(new Date().getHours());
  }, []);

  const persistMoodStats = useCallback(
    (updater: (prev: MoodStats) => MoodStats) => {
      setMoodStats((prev) => {
        const next = updater(prev);
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(
              "fiton-mood-stats",
              JSON.stringify(next)
            );
          } catch {
            // noop
          }
        }
        return next;
      });
    },
    []
  );

  const timeOfDayWeight = useCallback(
    (moodId: FitOnMoodId) => {
      if (clientHour === null) return 1;
      const ranges: Record<FitOnMoodId, number> = {
        sleepy: clientHour < 9 || clientHour >= 21 ? 1.4 : 1.0,
        energetic: clientHour >= 11 && clientHour <= 15 ? 1.4 : 1.0,
        stressed: clientHour >= 14 && clientHour <= 18 ? 1.2 : 1.0,
        calm:
          (clientHour >= 10 && clientHour <= 12) ||
          (clientHour >= 15 && clientHour <= 17)
            ? 1.3
            : 1.0,
        stiff: clientHour >= 13 && clientHour <= 16 ? 1.2 : 1.0,
      };
      return ranges[moodId] ?? 1.0;
    },
    [clientHour]
  );

  const availableMoods = useMemo(() => {
    const moods = fitOnMoods.filter((mood) => moodMap.has(mood.id));
    if (clientHour === null && Object.keys(moodStats).length === 0) {
      return moods;
    }
    return [...moods].sort((a, b) => {
      const sa = (moodStats[a.id]?.count ?? 0) * 0.7 + timeOfDayWeight(a.id);
      const sb = (moodStats[b.id]?.count ?? 0) * 0.7 + timeOfDayWeight(b.id);
      return sb - sa;
    });
  }, [moodMap, moodStats, clientHour, timeOfDayWeight]);

  const [selectedMood, setSelectedMood] = useState<FitOnMoodId | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(
    null
  );
  const [isShuffling, setIsShuffling] = useState(false);
  const [prefetchQueue, setPrefetchQueue] = useState<string[]>([]);
  const lottieRef = useRef<Player | null>(null);
  const [lottieError, setLottieError] = useState(false);

  // Simple local analytics to measure interactions
  const logEvent = useCallback(
    (type: string, payload?: Record<string, any>) => {
      if (typeof window === "undefined") return;
      try {
        const key = "fiton-analytics";
        const current = JSON.parse(window.localStorage.getItem(key) || "[]");
        const entry = { type, ts: Date.now(), ...(payload || {}) };
        const next = [entry, ...current].slice(0, 200);
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {}
    },
    []
  );

  useEffect(() => {
    if (availableMoods.length === 0) {
      setSelectedMood(null);
      setSelectedWorkoutId(null);
      return;
    }

    setSelectedMood((prev) => {
      if (prev && availableMoods.some((mood) => mood.id === prev)) {
        return prev;
      }
      return availableMoods[0]?.id ?? null;
    });
  }, [availableMoods]);

  const buildQueue = useCallback(
    (mood: FitOnMoodId | null, excludeId?: string | null) => {
      if (!mood) {
        return [] as string[];
      }

      const candidates = moodMap.get(mood) ?? [];
      if (candidates.length === 0) {
        return [] as string[];
      }
      // Shuffle ids excluding current when provided
      const ids = candidates.map((c) => c.id).filter((id) => id !== excludeId);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      return ids;
    },
    [moodMap]
  );

  const pickRandomWorkout = useCallback(
    (mood: FitOnMoodId | null, currentId?: string | null) => {
      if (!mood) {
        setSelectedWorkoutId(null);
        setPrefetchQueue([]);
        return;
      }

      // Use prefetch queue first
      setPrefetchQueue((queue) => {
        let nextQueue = [...queue];
        if (nextQueue.length === 0) {
          nextQueue = buildQueue(mood, currentId);
        }
        const nextId = nextQueue.shift();
        if (nextId) setSelectedWorkoutId(nextId);
        if (nextQueue.length < 2) {
          nextQueue = nextQueue.concat(buildQueue(mood, nextId ?? currentId));
        }
        return nextQueue;
      });
    },
    [buildQueue]
  );

  useEffect(() => {
    // When mood changes, build a fresh queue and set an initial selection quickly
    if (!selectedMood) {
      setSelectedWorkoutId(null);
      setPrefetchQueue([]);
      return;
    }
    const candidates = moodMap.get(selectedMood) ?? [];
    // Deterministic initial pick: first candidate in provided order
    const initialId = candidates[0]?.id ?? null;
    setSelectedWorkoutId(initialId);
    // Prepare a shuffled prefetch queue excluding the initially selected id
    const initialQueue = buildQueue(selectedMood, initialId);
    setPrefetchQueue(initialQueue);
  }, [selectedMood, buildQueue]);

  const selectedWorkout = useMemo(() => {
    if (!selectedWorkoutId) return null;
    return workouts.find((workout) => workout.id === selectedWorkoutId) ?? null;
  }, [selectedWorkoutId, workouts]);

  const currentMood = availableMoods.find((mood) => mood.id === selectedMood);
  const currentMoodCount =
    (selectedMood && moodMap.get(selectedMood)?.length) ?? 0;

  // Empty state when no moods are available (should not happen if workouts exist)
  if (availableMoods.length === 0) {
    return null;
  }

  // If the chosen mood has no workouts, show a friendly empty state
  const renderEmptyMood = () => (
    <div className="rounded-md border p-3 bg-card/40 text-sm">
      <div className="flex items-center justify-between">
        <span>Try another mood</span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedMood(availableMoods[0]?.id ?? null)}
          >
            Switch mood
          </Button>
          <Button
            size="sm"
            onClick={() => pickRandomWorkout(availableMoods[0]?.id ?? null)}
          >
            Shuffle all moods
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "w-full max-w-md space-y-4 rounded-lg border p-4 bg-card/60 shadow-sm",
        className
      )}
    >
      <div>
        <p className="text-sm font-medium">Break suggestion</p>
        <p className="text-xs text-muted-foreground">
          Choose a mood to get a random FitOn workout. Shuffle for another idea.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {availableMoods.map((mood) => {
          const isSelected = selectedMood === mood.id;
          return (
            <Button
              key={mood.id}
              type="button"
              size="sm"
              variant={isSelected ? "default" : "outline"}
              aria-pressed={isSelected}
              aria-label={mood.label}
              className={cn("min-w-10 justify-center", !isSelected && "px-3")}
              onClick={() => {
                setSelectedMood(mood.id);
                persistMoodStats((s) => ({
                  ...s,
                  [mood.id]: {
                    count: (s[mood.id]?.count ?? 0) + 1,
                    lastUsed: Date.now(),
                  },
                }));
                logEvent("mood_select", { mood: mood.id });
              }}
            >
              <span className="text-lg" aria-hidden="true">
                {mood.emoji}
              </span>
              {isSelected && (
                <span className="ml-2 text-xs font-medium">{mood.label}</span>
              )}
            </Button>
          );
        })}
      </div>
      {currentMoodCount === 0 ? (
        renderEmptyMood()
      ) : isOnline ? (
        selectedWorkout && (
          <div className="rounded-lg border bg-card/40 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="font-semibold flex items-center gap-2 text-sm">
                <span>{selectedWorkout.emoji}</span>
                {selectedWorkout.title}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full border"
                onClick={() => {
                  if (isShuffling) return;
                  setIsShuffling(true);
                  pickRandomWorkout(selectedMood, selectedWorkoutId);
                  setTimeout(() => setIsShuffling(false), 250);
                  logEvent("shuffle", { mood: selectedMood });
                }}
                disabled={
                  (currentMoodCount <= 1 && prefetchQueue.length === 0) ||
                  isShuffling
                }
                aria-label="Shuffle suggestion"
              >
                {isShuffling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {selectedWorkout.type} • {selectedWorkout.minutes} min
              </span>
              <a
                href={selectedWorkout.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                onClick={() => {
                  persistMoodStats((s) => ({
                    ...s,
                    [selectedMood as string]: {
                      count: (s[selectedMood as string]?.count ?? 0) + 1,
                      lastUsed: Date.now(),
                    },
                  }));
                  logEvent("open", {
                    mood: selectedMood,
                    workoutId: selectedWorkout.id,
                  });
                }}
              >
                Open in FitOn
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
            {selectedWorkout.note && (
              <p className="mt-2 text-xs text-muted-foreground" dir="auto">
                {selectedWorkout.note}
              </p>
            )}
          </div>
        )
      ) : (
        <OfflineStretch
          isOnline={false}
          lottieRef={lottieRef}
          lottieError={lottieError}
          setLottieError={setLottieError}
        />
      )}
    </div>
  );
}

function OfflineStretch({
  isOnline,
  lottieRef,
  lottieError,
  setLottieError,
}: {
  isOnline: boolean;
  lottieRef?: React.MutableRefObject<Player | null>;
  lottieError?: boolean;
  setLottieError?: (v: boolean) => void;
}) {
  const defaultLottie =
    "https://assets-v2.lottiefiles.com/a/a48a9a00-1171-11ee-b960-63b518b1c7e7/gs1ympxGu6.lottie";
  return (
    <div className="rounded-lg border bg-card/40 p-3">
      <div className="flex items-start gap-3">
        {!lottieError && (
          <div className="w-24 h-24 shrink-0 overflow-hidden rounded-md">
            <Player
              ref={(el) => {
                if (lottieRef) lottieRef.current = el;
              }}
              src={defaultLottie}
              autoplay
              loop
              renderer="canvas"
              background="transparent"
              style={{ width: "100%", height: "100%" }}
              onEvent={(ev) => {
                if (ev === PlayerEvent.Error && setLottieError)
                  setLottieError(true);
              }}
            />
          </div>
        )}
        <div className="flex-1">
          <p className="font-medium text-sm">Stretch guidance</p>
          <p className="text-xs text-muted-foreground">
            You appear to be offline. Try this quick posture reset: roll
            shoulders 5×, neck side-stretches 2× each, 20-second chest opener.
            When you’re back online, open a FitOn workout.
          </p>
        </div>
      </div>
    </div>
  );
}
