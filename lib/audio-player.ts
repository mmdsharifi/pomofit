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

        // Ensure path starts with a slash and remove any duplicate slashes
        const normalizedPath = `/${soundPath.replace(/^\/+/, "")}`;
        console.log("Attempting to play audio at path:", normalizedPath);

        const audio = new Audio(normalizedPath);
        this.currentAudio = audio;

        audio.onended = () => {
          console.log("Audio playback ended:", normalizedPath);
          this.currentAudio = null;
          resolve();
        };

        audio.onerror = (event) => {
          console.error("Audio playback error:", {
            path: normalizedPath,
            error: event,
            readyState: audio.readyState,
            errorState: audio.error,
          });
          this.currentAudio = null;
          reject(new Error(`Failed to play audio: ${normalizedPath}`));
        };

        const playPromise = audio.play();

        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Audio play() failed:", error);
            this.currentAudio = null;
            reject(error);
          });
        }
      } catch (error) {
        console.error("Unexpected error in play():", error);
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
    // First try to play the break start sound (since we know it exists)
    console.log("Playing break start sound as timer start sound");
    await audioPlayer.play(SOUND_PATHS.BREAK_START);
  } catch (error) {
    console.error("Failed to play any start sound:", error);
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
