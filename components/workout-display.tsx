"use client"

import { useState, useEffect, useRef } from "react"
import { workoutGifs } from "@/lib/workout-data"
import { type TimerMode, useTimer } from "@/lib/timer-context"
import { Player } from "@lottiefiles/react-lottie-player"
import { AlertTriangle } from "lucide-react"

interface WorkoutDisplayProps {
  isActive: boolean
  mode: TimerMode
}

export default function WorkoutDisplay({ isActive, mode }: WorkoutDisplayProps) {
  const { settings } = useTimer()
  const [currentWorkout, setCurrentWorkout] = useState<string | null>(null)
  const [lottieError, setLottieError] = useState(false)
  const playerRef = useRef<Player>(null)

  useEffect(() => {
    if (isActive && settings.workoutGifs.length > 0) {
      // Select a random workout from the available options
      const randomIndex = Math.floor(Math.random() * settings.workoutGifs.length)
      setCurrentWorkout(settings.workoutGifs[randomIndex])
      setLottieError(false) // Reset error state when changing workouts
    } else {
      setCurrentWorkout(null)
    }
  }, [isActive, settings.workoutGifs])

  if (!isActive || !currentWorkout) {
    return (
      <div className="w-full max-w-md text-center">
        <p className="text-lg font-medium">Break Time Workout</p>
        <p className="text-sm text-muted-foreground">Start the timer to see a workout suggestion</p>
      </div>
    )
  }

  const workout = workoutGifs.find((w) => w.id === currentWorkout)

  if (!workout) {
    return (
      <div className="w-full max-w-md text-center">
        <p className="text-lg font-medium">Workout</p>
        <p className="text-sm text-muted-foreground">{currentWorkout}</p>
      </div>
    )
  }

  const handleLottieError = () => {
    setLottieError(true)
  }

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
                ref={playerRef}
                src={workout.gifUrl}
                autoplay={true}
                loop={true}
                renderer="canvas"
                background="transparent"
                style={{ height: "100%", width: "100%" }}
                onError={handleLottieError}
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
          <h3 className="text-lg font-medium">Recommended Activity: {workout.name}</h3>
          <p className="text-sm text-muted-foreground">{workout.description}</p>
        </div>
      </div>
    </div>
  )
}
