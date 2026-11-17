import { useCallback, useEffect, useRef, useState } from "react";
import { registerServiceWorker } from "@/lib/pwa";
import { compareVersions, fetchLatestVersion } from "@/lib/version";

export type UpdatePhase =
  | "idle"
  | "checking"
  | "available"
  | "current"
  | "error"
  | "offline"
  | "applying";

const AUTO_CHECK_THROTTLE = 60_000;
const AUTO_CHECK_INTERVAL = 30 * 60_000;
const FEEDBACK_MS = 2400;
const CONFIRM_MS = 8000;
const FETCH_TIMEOUT_MS = 6000;
const APPLY_TIMEOUT_MS = 2500;

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

export const useAppUpdate = (currentVersion: string) => {
  const [phase, setPhase] = useState<UpdatePhase>("idle");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const mounted = useRef(true);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const hasUpdateRef = useRef(false);
  const confirmingRef = useRef(false);
  const applyingRef = useRef(false);
  const controllerUpdatedRef = useRef(false);
  const lastCheckRef = useRef(0);
  const feedbackTimer = useRef(0);
  const confirmTimer = useRef(0);

  const setConfirmingState = useCallback((value: boolean) => {
    confirmingRef.current = value;
    setConfirming(value);
    if (!value) window.clearTimeout(confirmTimer.current);
  }, []);

  const scheduleConfirmReset = useCallback(() => {
    window.clearTimeout(confirmTimer.current);
    confirmTimer.current = window.setTimeout(() => {
      setConfirmingState(false);
    }, CONFIRM_MS);
  }, [setConfirmingState]);

  const scheduleFeedbackReset = useCallback(() => {
    window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => {
      setPhase(hasUpdateRef.current ? "available" : "idle");
    }, FEEDBACK_MS);
  }, []);

  const setAvailable = useCallback(
    (version: string | null) => {
      window.clearTimeout(feedbackTimer.current);
      setLatestVersion(version);
      hasUpdateRef.current = true;
      setHasUpdate(true);
      setConfirmingState(false);
      setPhase("available");
    },
    [setConfirmingState]
  );

  const clearAvailable = useCallback(() => {
    setLatestVersion(null);
    hasUpdateRef.current = false;
    setHasUpdate(false);
    setConfirmingState(false);
  }, [setConfirmingState]);

  const runCheck = useCallback(
    async (silent: boolean) => {
      if (applyingRef.current) return;

      const now = Date.now();
      if (silent && now - lastCheckRef.current < AUTO_CHECK_THROTTLE) return;
      lastCheckRef.current = now;

      if (!silent) {
        window.clearTimeout(feedbackTimer.current);
        setConfirmingState(false);
        setPhase("checking");
      }

      if (registrationRef.current) {
        void registrationRef.current.update().catch(() => undefined);
      }

      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const remote = await fetchLatestVersion(controller.signal);
        if (!mounted.current) return;

        if (compareVersions(remote, currentVersion) > 0) {
          setAvailable(remote);
        } else if (!controllerUpdatedRef.current) {
          clearAvailable();
          if (!silent) {
            setPhase("current");
            scheduleFeedbackReset();
          }
        } else if (!silent) {
          setPhase("available");
        }
      } catch {
        if (!mounted.current) return;
        if (!silent) {
          if (controllerUpdatedRef.current) {
            setPhase("available");
          } else {
            setPhase(navigator.onLine === false ? "offline" : "error");
            scheduleFeedbackReset();
          }
        }
      } finally {
        window.clearTimeout(timer);
      }
    },
    [
      clearAvailable,
      currentVersion,
      scheduleFeedbackReset,
      setAvailable,
      setConfirmingState,
    ]
  );

  const applyUpdate = useCallback(async () => {
    if (applyingRef.current) return;
    applyingRef.current = true;
    window.clearTimeout(feedbackTimer.current);
    setConfirmingState(false);
    setPhase("applying");

    const registration = registrationRef.current ?? (await registerServiceWorker());
    if (!mounted.current) return;

    if (!registration) {
      window.location.reload();
      return;
    }

    const waitForController = new Promise<void>((resolve) => {
      if (controllerUpdatedRef.current) {
        resolve();
        return;
      }

      let timer = 0;
      const onChange = () => {
        window.clearTimeout(timer);
        navigator.serviceWorker.removeEventListener("controllerchange", onChange);
        resolve();
      };

      navigator.serviceWorker.addEventListener("controllerchange", onChange);
      timer = window.setTimeout(() => {
        navigator.serviceWorker.removeEventListener("controllerchange", onChange);
        resolve();
      }, APPLY_TIMEOUT_MS);
    });

    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    await Promise.race([
      registration.update().catch(() => undefined),
      delay(APPLY_TIMEOUT_MS),
    ]);
    await waitForController;

    if (mounted.current) window.location.reload();
  }, [setConfirmingState]);

  const activate = useCallback(() => {
    if (applyingRef.current || phase === "checking") return;

    if (hasUpdateRef.current) {
      if (!confirmingRef.current) {
        setConfirmingState(true);
        scheduleConfirmReset();
        return;
      }
      void applyUpdate();
      return;
    }

    void runCheck(false);
  }, [applyUpdate, phase, runCheck, scheduleConfirmReset, setConfirmingState]);

  useEffect(() => {
    mounted.current = true;
    void registerServiceWorker().then((registration) => {
      registrationRef.current = registration;
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") void runCheck(true);
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void runCheck(true);
    }, AUTO_CHECK_INTERVAL);

    void runCheck(true);

    return () => {
      mounted.current = false;
      window.clearTimeout(feedbackTimer.current);
      window.clearTimeout(confirmTimer.current);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [runCheck]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let hadController = Boolean(navigator.serviceWorker.controller);

    const onChange = () => {
      if (!hadController) {
        hadController = true;
        return;
      }

      controllerUpdatedRef.current = true;
      if (applyingRef.current) return;

      hasUpdateRef.current = true;
      setHasUpdate(true);
      setPhase("available");

      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      void fetchLatestVersion(controller.signal)
        .then((version) => {
          if (!mounted.current) return;
          if (compareVersions(version, currentVersion) > 0) {
            setLatestVersion(version);
          }
        })
        .catch(() => undefined)
        .finally(() => window.clearTimeout(timer));
    };

    navigator.serviceWorker.addEventListener("controllerchange", onChange);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
    };
  }, [currentVersion]);

  return {
    phase,
    latestVersion,
    hasUpdate,
    confirming,
    activate,
  };
};
