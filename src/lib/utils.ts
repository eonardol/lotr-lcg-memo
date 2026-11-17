import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const vibrate = (ms: number): void => {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch {
      /* ignorato */
    }
  }
};
