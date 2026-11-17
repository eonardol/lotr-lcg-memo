import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icon } from "../Icon";
import { usePortalContainer } from "../PortalContainer";

type DialogShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  closeLabel?: string;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
};

export const DialogShell = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  closeLabel,
  onEscapeKeyDown,
}: DialogShellProps) => {
  const portalContainer = usePortalContainer();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        portalContainer={portalContainer}
        className={cn("app-dialog", className)}
        onEscapeKeyDown={onEscapeKeyDown}
      >
        <DialogHeader className="panel-head">
          <div className="min-w-0">
            <DialogTitle className="font-display">{title}</DialogTitle>
            <DialogDescription className="panel-sub">{description}</DialogDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full text-muted-foreground"
            aria-label={closeLabel ?? title}
            onClick={() => onOpenChange(false)}
          >
            <Icon kind="close" />
          </Button>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};
