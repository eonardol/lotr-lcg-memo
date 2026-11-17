import bookmark from "@/assets/bookmark.svg";
import bookmarkFilled from "@/assets/bookmark-filled.svg";
import pencil from "@/assets/pencil-1.svg";
import trash from "@/assets/trash.svg";
import eyeOpen from "@/assets/eye-open.svg";
import eyeClosed from "@/assets/eye-closed.svg";
import screenPortrait from "@/assets/screen-portrait.svg";
import screenLandscape from "@/assets/screen-landscape.svg";
import reset from "@/assets/reset.svg";
import update from "@/assets/update.svg";
import cross from "@/assets/cross-2.svg";
import plus from "@/assets/plus.svg";

export const iconMask = {
  bookmark: `url("${bookmark}")`,
  bookmarkFilled: `url("${bookmarkFilled}")`,
  pencil: `url("${pencil}")`,
  trash: `url("${trash}")`,
  eyeOpen: `url("${eyeOpen}")`,
  eyeClosed: `url("${eyeClosed}")`,
  screenPortrait: `url("${screenPortrait}")`,
  screenLandscape: `url("${screenLandscape}")`,
  undo: `url("${reset}")`,
  restart: `url("${update}")`,
  close: `url("${cross}")`,
  plus: `url("${plus}")`,
} as const;

export type IconKind = keyof typeof iconMask;
