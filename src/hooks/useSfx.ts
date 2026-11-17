import { useCallback, useMemo } from "react";
import tap from "@/assets/tap.mp3";
import undo from "@/assets/undo.mp3";
import round from "@/assets/new-round.mp3";
import over from "@/assets/game-over.mp3";

type SoundName = "tap" | "undo" | "round" | "over";

const SOURCES: Record<SoundName, { src: string; volume: number }> = {
  tap: { src: tap, volume: 0.45 },
  undo: { src: undo, volume: 0.7 },
  round: { src: round, volume: 0.9 },
  over: { src: over, volume: 0.9 },
};

const makeSound = (src: string, volume: number): HTMLAudioElement | null => {
  if (typeof Audio === "undefined") return null;
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.volume = volume;
  return audio;
};

export const useSfx = () => {
  const sounds = useMemo(() => {
    const map = {} as Record<SoundName, HTMLAudioElement | null>;
    (Object.keys(SOURCES) as SoundName[]).forEach((name) => {
      map[name] = makeSound(SOURCES[name].src, SOURCES[name].volume);
    });
    return map;
  }, []);

  const playSfx = useCallback(
    (name: SoundName) => {
      const audio = sounds[name];
      if (!audio) return;
      try {
        audio.currentTime = 0;
      } catch {
        /* metadati non ancora caricati */
      }
      try {
        const playback = audio.play();
        if (playback && typeof playback.catch === "function") {
          playback.catch(() => {});
        }
      } catch {
        /* audio non disponibile */
      }
    },
    [sounds]
  );

  return playSfx;
};

export type PlaySfx = ReturnType<typeof useSfx>;
