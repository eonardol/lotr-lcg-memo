import { useCallback, useEffect, useRef, useState } from "react";

type WakeMode = "on" | "off" | "unsupported";

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: string, listener: () => void) => void;
};

export const useWakeLock = (wakeWanted: boolean, setWakeWanted: (value: boolean) => void) => {
  const [mode, setMode] = useState<WakeMode>(() =>
    typeof navigator !== "undefined" && "wakeLock" in navigator ? "off" : "unsupported"
  );
  const lock = useRef<WakeLockSentinelLike | null>(null);
  const request = useRef<Promise<void> | null>(null);
  const wantedRef = useRef(wakeWanted);
  wantedRef.current = wakeWanted;

  const supported = typeof navigator !== "undefined" && "wakeLock" in navigator;

  const release = useCallback(() => {
    const current = lock.current;
    if (!current) return;
    lock.current = null;
    current.release().catch(() => {});
  }, []);

  const ensure = useCallback(async () => {
    if (!supported) {
      setMode("unsupported");
      return;
    }
    if (!wantedRef.current) return;
    if (lock.current || request.current) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

    const navigatorWithWakeLock = navigator as Navigator & {
      wakeLock: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
    };

    request.current = navigatorWithWakeLock.wakeLock
      .request("screen")
      .then((sentinel) => {
        if (!wantedRef.current) {
          sentinel.release().catch(() => {});
          return;
        }
        lock.current = sentinel;
        setMode("on");
        sentinel.addEventListener("release", () => {
          if (lock.current === sentinel) lock.current = null;
          if (typeof document !== "undefined" && document.visibilityState === "visible") {
            setMode("off");
          }
        });
      })
      .catch(() => {
        setMode("off");
      })
      .finally(() => {
        request.current = null;
      });
    await request.current;
  }, [supported]);

  useEffect(() => {
    if (!supported) {
      setMode("unsupported");
      return;
    }
    if (!wakeWanted) {
      release();
      setMode("off");
      return;
    }
    void ensure();
  }, [wakeWanted, ensure, release, supported]);

  useEffect(() => {
    if (!supported) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") void ensure();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pointerdown", ensure, { passive: true });
    window.addEventListener("focus", ensure);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pointerdown", ensure);
      window.removeEventListener("focus", ensure);
    };
  }, [ensure, supported]);

  const toggle = useCallback(() => {
    if (!supported) {
      setMode("unsupported");
      return;
    }
    if (wakeWanted) {
      setWakeWanted(false);
      release();
      setMode("off");
    } else {
      setWakeWanted(true);
      void ensure();
    }
  }, [ensure, release, setWakeWanted, supported, wakeWanted]);

  return { mode, toggle, supported };
};
