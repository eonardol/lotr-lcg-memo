import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { iconMask, type IconKind } from "@/lib/icons";

type IconProps = {
  kind: IconKind;
  className?: string;
  filled?: boolean;
};

export const Icon = ({ kind, className, filled = false }: IconProps) => {
  const source = filled ? iconMask.bookmarkFilled : iconMask[kind];
  return (
    <span
      aria-hidden="true"
      className={cn("icon-mask", className)}
      style={{ "--icon": source } as CSSProperties}
    />
  );
};
