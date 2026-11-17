import { useEffect, useRef, useState } from "react";
import type { Rotation } from "@/lib/types";

type Size = { width: number; height: number };

const keyboardOpen = (): boolean => {
  const viewport = window.visualViewport;
  return viewport ? window.innerHeight - viewport.height > 160 : false;
};

const measure = (): Size => {
  const viewport = window.visualViewport;
  let width = window.innerWidth;
  let height = window.innerHeight;
  if (viewport) {
    width = Math.max(width, Math.round(viewport.width));
    height = Math.max(height, Math.round(viewport.height));
  }

  const standalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches;
  const screenWidth = window.screen ? Math.round(window.screen.width) : 0;
  const screenHeight = window.screen ? Math.round(window.screen.height) : 0;
  const fullscreen = !!(
    document.fullscreenElement ||
    (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement
  );

  if (fullscreen && screenWidth > 0 && screenHeight > 0) {
    width = screenWidth;
    height = screenHeight;
  } else if (standalone) {
    if (screenWidth > 0) width = Math.min(width, screenWidth);
    if (screenHeight > 0) height = Math.min(height, screenHeight);
  }

  return { width: Math.max(1, width || 0), height: Math.max(1, height || 0) };
};

const updateViewportVars = () => {
  const viewport = window.visualViewport;
  const height = viewport ? viewport.height : window.innerHeight;
  const top = viewport ? viewport.offsetTop : 0;
  document.documentElement.style.setProperty("--vv-h", `${Math.max(0, Math.round(height))}px`);
  document.documentElement.style.setProperty("--vv-top", `${Math.max(0, Math.round(top))}px`);
};

export const useViewportLayout = (rotation: Rotation) => {
  const [size, setSize] = useState<Size>(() => measure());
  const [tablet, setTablet] = useState(false);
  const sizeRef = useRef(size);
  const tabletRef = useRef(tablet);
  const timers = useRef<number[]>([]);

  sizeRef.current = size;
  tabletRef.current = tablet;

  useEffect(() => {
    const update = () => {
      updateViewportVars();
      if (keyboardOpen()) return;

      const next = measure();
      if (next.width !== sizeRef.current.width || next.height !== sizeRef.current.height) {
        sizeRef.current = next;
        setSize(next);
        document.documentElement.style.setProperty("--app-w", `${next.width}px`);
        document.documentElement.style.setProperty("--app-h", `${next.height}px`);
      }

      const shortSide = Math.min(next.width, next.height);
      const nextTablet = shortSide >= 600;
      if (nextTablet !== tabletRef.current) {
        tabletRef.current = nextTablet;
        setTablet(nextTablet);
      }

      const swapped = rotation === 90;
      const logicalWidth = swapped ? next.height : next.width;
      const logicalHeight = swapped ? next.width : next.height;
      document.documentElement.classList.toggle("tablet", nextTablet);
      document.documentElement.classList.toggle("narrow", logicalWidth <= 350);
      document.documentElement.classList.toggle("tight-head", logicalWidth <= 379);
      document.documentElement.classList.toggle("compact-height", logicalHeight <= 600);
      document.documentElement.classList.toggle("very-short", logicalHeight < 480);
    };

    const schedule = () => {
      update();
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [window.setTimeout(update, 260), window.setTimeout(update, 800)];
    };

    const onResize = () => update();
    schedule();

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", schedule);
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener("change", schedule);
    }
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onResize);
      window.visualViewport.addEventListener("scroll", onResize);
    }

    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", schedule);
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener("change", schedule);
      }
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", onResize);
        window.visualViewport.removeEventListener("scroll", onResize);
      }
    };
  }, [rotation]);

  useEffect(() => {
    const swapped = rotation === 90;
    const logicalWidth = swapped ? sizeRef.current.height : sizeRef.current.width;
    const logicalHeight = swapped ? sizeRef.current.width : sizeRef.current.height;
    document.documentElement.classList.toggle("narrow", logicalWidth <= 350);
    document.documentElement.classList.toggle("tight-head", logicalWidth <= 379);
    document.documentElement.classList.toggle("compact-height", logicalHeight <= 600);
    document.documentElement.classList.toggle("very-short", logicalHeight < 480);
  }, [rotation]);

  const swapped = rotation === 90;
  const logicalWidth = swapped ? size.height : size.width;
  const logicalHeight = swapped ? size.width : size.height;

  return {
    size,
    tablet,
    logicalWidth,
    logicalHeight,
    targetLandscape:
      rotation === 90 ? window.innerWidth > window.innerHeight : window.innerHeight > window.innerWidth,
  };
};
