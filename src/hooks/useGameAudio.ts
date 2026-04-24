import { useCallback, useEffect, useRef } from "react";

type AudioCue = "gameOver" | "winner" | "lose";

const AUDIO_FILES: Record<AudioCue, string> = {
  gameOver: "/music/game_over.mp3",
  lose: "/music/game_lose.mp3",
  winner: "/music/game_winner.mp3",
};

export function useGameAudio() {
  const audioMapRef = useRef<Record<AudioCue, HTMLAudioElement | null>>({
    gameOver: null,
    lose: null,
    winner: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const audioMap = {
      gameOver: new Audio(AUDIO_FILES.gameOver),
      lose: new Audio(AUDIO_FILES.lose),
      winner: new Audio(AUDIO_FILES.winner),
    };

    Object.values(audioMap).forEach((audio) => {
      audio.preload = "auto";
    });

    audioMapRef.current = audioMap;

    return () => {
      Object.values(audioMap).forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, []);

  return useCallback((cue: AudioCue) => {
    const audio = audioMapRef.current[cue];
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Ignore autoplay errors until the browser has a user gesture.
    });
  }, []);
}
