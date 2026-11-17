import { useCallback, useEffect, useRef } from "react";

type Options = {
  onStep: () => void;
  onStart?: () => void;
  onEnd?: () => void;
  disabled?: boolean;
  delay?: number;
  interval?: number;
};

export const useLongPress = ({
  onStep,
  onStart,
  onEnd,
  disabled = false,
  delay = 380,
  interval = 80,
}: Options) => {
  const timer = useRef<number | null>(null);
  const repeater = useRef<number | null>(null);
  const active = useRef(false);
  const callbacks = useRef({ onStep, onStart, onEnd });
  callbacks.current = { onStep, onStart, onEnd };

  const stop = useCallback(() => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    if (repeater.current) {
      window.clearInterval(repeater.current);
      repeater.current = null;
    }
    document.removeEventListener("pointerup", stop);
    document.removeEventListener("pointercancel", stop);
    if (active.current) {
      active.current = false;
      callbacks.current.onEnd?.();
    }
  }, []);

  useEffect(() => stop, [stop]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled || (event.button !== undefined && event.button !== 0)) return;
      event.preventDefault();
      stop();
      active.current = true;
      callbacks.current.onStart?.();
      callbacks.current.onStep();
      timer.current = window.setTimeout(() => {
        repeater.current = window.setInterval(() => callbacks.current.onStep(), interval);
      }, delay);
      document.addEventListener("pointerup", stop);
      document.addEventListener("pointercancel", stop);
    },
    [delay, disabled, interval, stop]
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return;
      event.preventDefault();
      callbacks.current.onStart?.();
      callbacks.current.onStep();
      callbacks.current.onEnd?.();
    },
    [disabled]
  );

  return {
    onPointerDown,
    onKeyDown,
    onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
    onClick: (event: React.MouseEvent) => event.preventDefault(),
  };
};
