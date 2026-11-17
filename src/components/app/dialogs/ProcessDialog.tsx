import { processName, translate } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { StepList } from "../StepList";
import { DialogShell } from "./DialogShell";
import type { NotesScope } from "./dialog-state";
import type { ProcessKind } from "@/lib/types";

type ProcessDialogProps = {
  kind: ProcessKind | null;
  onClose: () => void;
  onOpenNotes: (scope: NotesScope) => void;
};

export const ProcessDialog = ({ kind, onClose, onOpenNotes }: ProcessDialogProps) => {
  const lang = useStore((state) => state.lang);
  if (!kind) return null;
  const t = (key: string) => translate(lang, key);

  return (
    <DialogShell
      open={kind !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={processName(lang, kind)}
      description={t("ui.processSub")}
      className="panel-process"
      closeLabel={t("ui.closeProcess")}
    >
      <StepList
        container={`proc:${kind}`}
        onOpenNotes={(container, anchor) => onOpenNotes({ container, anchor })}
      />
    </DialogShell>
  );
};
