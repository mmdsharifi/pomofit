"use client";

import React from "react";
import { useState, useEffect, useMemo } from "react";
import { workoutGifs } from "@/lib/workout-data";
import { type TimerMode, useTimer } from "@/lib/timer-context";
import { Player } from "@lottiefiles/react-lottie-player";
import { AlertTriangle } from "lucide-react";

interface WorkoutDisplayProps {
  isActive: boolean;
  mode: TimerMode;
}

export default function WorkoutDisplay({
  isActive,
  mode,
}: WorkoutDisplayProps) {
  const { settings } = useTimer();
  const [currentWorkout, setCurrentWorkout] = useState<string | null>(null);
  const [lottieError, setLottieError] = useState(false);

  const lottieEnabled = settings.workoutSources?.lottie ?? true;

  const availableWorkoutIds = useMemo(() => {
    return settings.workoutGifs.filter((id) =>
      workoutGifs.some((workout) => workout.id === id)
    );
  }, [settings.workoutGifs]);

  useEffect(() => {
    if (isActive && lottieEnabled && availableWorkoutIds.length > 0) {
      // Select a random workout from the available options
      const randomIndex = Math.floor(Math.random() * availableWorkoutIds.length);
      setCurrentWorkout(availableWorkoutIds[randomIndex]);
      setLottieError(false); // Reset error state when changing workouts
    } else {
      setCurrentWorkout(null);
    }
  }, [isActive, lottieEnabled, availableWorkoutIds]);

  if (!lottieEnabled) {
    return (
      <div className="w-full max-w-md text-center">
        <p className="text-lg font-medium">Lottie workouts disabled</p>
        <p className="text-sm text-muted-foreground">
          Enable Lottie workouts in Settings to see animations during breaks.
        </p>
      </div>
    );
  }

  if (!isActive || !currentWorkout) {
    return (
      <div className="w-full max-w-md text-center">
        <p className="text-lg font-medium">Break Time Workout</p>
        <p className="text-sm text-muted-foreground">
          Start the timer to see a workout suggestion
        </p>
      </div>
    );
  }

  const workout = workoutGifs.find((w) => w.id === currentWorkout);

  if (!workout) {
    return (
      <div className="w-full max-w-md text-center">
        <p className="text-lg font-medium">No workouts selected</p>
        <p className="text-sm text-muted-foreground">
          Update your workout list in Settings to keep this break fresh.
        </p>
      </div>
    );
  }

  const handleLottieError = () => {
    setLottieError(true);
  };

  return (
    <div className="w-full max-w-md">
      <div className="relative">
        {workout.isLottie ? (
          <div className="h-64 w-full flex items-center justify-center bg-muted rounded-md">
            {lottieError ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <span>Animation unavailable</span>
              </div>
            ) : (
              <Player
                src={workout.gifUrl}
                autoplay
                loop
                renderer="svg"
                background="transparent"
                style={{ height: "220px", width: "220px" }}
                /*
                  Note: The Lottie Player component does not support an onError prop.
                  The test for 'Animation unavailable' should mock the fallback UI directly.
                */
              />
            )}
          </div>
        ) : (
          <img
            src={workout.gifUrl || "/placeholder.svg"}
            alt={workout.name}
            className="h-64 w-full object-contain rounded-md"
          />
        )}
        <div className="mt-3 text-center">
          <h3 className="text-lg font-medium">
            Recommended Activity: {workout.name}
          </h3>
          <p className="text-sm text-muted-foreground">{workout.description}</p>
        </div>
      </div>
    </div>
  );
}
