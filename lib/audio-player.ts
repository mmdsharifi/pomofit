import { SOUND_PATHS } from "./constants";

interface ToastOptions {
  title: string;
  description: string;
}

/**
 * Audio player utility for managing timer sounds
 */
class AudioPlayer {
  private currentAudio: HTMLAudioElement | null = null;

  /**
   * Play an audio file
   */
  play(soundPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Stop any currently playing audio
        this.stop();

        const audio = new Audio(soundPath);
        this.currentAudio = audio;

        audio.onended = () => {
          this.currentAudio = null;
          resolve();
        };

        audio.onerror = () => {
          this.currentAudio = null;
          reject(new Error(`Failed to play audio: ${soundPath}`));
        };

        audio.play().catch((error) => {
          this.currentAudio = null;
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the current audio
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}

// Global audio player instance
const audioPlayer = new AudioPlayer();

/**
 * Play timer start sound
 */
export async function playStartSound(): Promise<void> {
  try {
    await audioPlayer.play(SOUND_PATHS.TIMER_START);
  } catch (error) {
    console.error("Error playing start sound:", error);
  }
}

/**
 * Play timer end sound
 */
export async function playEndSound(
  showFallbackToast?: (options: ToastOptions) => void
): Promise<void> {
  try {
    await audioPlayer.play(SOUND_PATHS.TIMER_END);
  } catch (error) {
    console.error("Error playing end sound:", error);
    // Fallback to toast notification if audio fails
    if (showFallbackToast) {
      showFallbackToast({
        title: "Timer completed",
        description: "Your timer has finished.",
      });
    }
  }
}

/**
 * Play break start sound
 */
export async function playBreakStartSound(): Promise<void> {
  try {
    await audioPlayer.play(SOUND_PATHS.BREAK_START);
  } catch (error) {
    console.error("Error playing break start sound:", error);
  }
}

/**
 * Play break end sound
 */
export async function playBreakEndSound(): Promise<void> {
  try {
    await audioPlayer.play(SOUND_PATHS.BREAK_END);
  } catch (error) {
    console.error("Error playing break end sound:", error);
  }
}

/**
 * Stop all audio playback
 */
export function stopAllAudio(): void {
  audioPlayer.stop();
}

/**
 * Check if audio is currently playing
 */
export function isAudioPlaying(): boolean {
  return audioPlayer.isPlaying();
}
