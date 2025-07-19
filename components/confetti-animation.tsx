"use client";

import { useEffect, useRef, useState } from "react";
import { Player } from "@lottiefiles/react-lottie-player";

interface ConfettiAnimationProps {
  play: boolean;
  times?: number;
  continuous?: boolean;
  onComplete?: () => void;
}

export default function ConfettiAnimation({
  play,
  times = 1,
  continuous = false,
  onComplete,
}: ConfettiAnimationProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<Player>(null);
  const playCountRef = useRef(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (play && !isPlaying) {
      setIsPlaying(true);
      playCountRef.current = 0;

      // Use requestAnimationFrame to ensure smooth playback
      const startAnimation = () => {
        if (playerRef.current) {
          playerRef.current.play();
        }
      };

      animationFrameRef.current = requestAnimationFrame(startAnimation);
    } else if (!play && isPlaying) {
      setIsPlaying(false);

      if (playerRef.current) {
        playerRef.current.stop();
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [play, isPlaying]);

  const handleComplete = () => {
    if (continuous) {
      // For continuous mode, just replay with a small delay to prevent excessive CPU usage
      if (playerRef.current && isPlaying) {
        setTimeout(() => {
          if (playerRef.current && isPlaying) {
            playerRef.current.play();
          }
        }, 100);
      }
    } else {
      // For non-continuous mode, count plays
      playCountRef.current += 1;

      if (playCountRef.current < times && isPlaying) {
        // Play again if we haven't reached the desired count
        setTimeout(() => {
          if (playerRef.current && isPlaying) {
            playerRef.current.play();
          }
        }, 100);
      } else {
        // Stop and notify when we've played enough times
        setIsPlaying(false);
        if (onComplete) {
          onComplete();
        }
      }
    }
  };

  if (!play && !isPlaying) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <Player
        ref={playerRef}
        src="https://lottie.host/c971c480-1b79-46c0-a6c3-8d0b61d9517b/IwvBG0988S.json"
        style={{ width: "100%", height: "100%" }}
        autoplay={true}
        keepLastFrame={false}
        speed={1.5}
        onEvent={(event) => {
          if (event === "complete") {
            handleComplete();
          }
        }}
      />
    </div>
  );
}
