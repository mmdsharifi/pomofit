import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const playSound = async (soundFile: string) => {
  try {
    const audio = new Audio(soundFile)
    await audio.play()
  } catch (error) {
    console.error("Failed to play sound:", error)
  }
}
