"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trophy } from "lucide-react"
import { Player } from "@lottiefiles/react-lottie-player"

interface GoalReachedModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: number
}

export default function GoalReachedModal({ open, onOpenChange, goal }: GoalReachedModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Daily Goal Reached!
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Congratulations! You&apos;ve completed your daily goal of {goal} pomodoros.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-4">
          <div className="text-4xl font-bold text-primary mb-2">{goal}</div>
          <p className="text-center text-muted-foreground">
            Great job staying focused and productive today. Take some time to celebrate your achievement!
          </p>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full" aria-label="Continue">
            Continue
          </Button>
        </DialogFooter>

        {/* Continuous confetti animation while modal is open */}
        {open && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <Player
              src="https://assets-v2.lottiefiles.com/a/485d85e0-48ca-11ee-9978-f7849a60e2f8/NUYvA0tXW9.lottie"
              style={{ width: "100%", height: "100%" }}
              autoplay={true}
              loop={true}
              speed={1.5}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
