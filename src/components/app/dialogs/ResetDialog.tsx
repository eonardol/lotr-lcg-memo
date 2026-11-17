import { translate } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { vibrate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DialogShell } from "./DialogShell";

type ResetDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const ResetDialog = ({ open, onClose, onConfirm }: ResetDialogProps) => {
  const lang = useStore((state) => state.lang);
  const t = (key: string) => translate(lang, key);

  const confirm = () => {
    onConfirm();
    vibrate(10);
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t("ui.newGame")}
      description={t("ui.newGameSub")}
    >
      <div className="panel-actions">
        <Button type="button" variant="ghost" onClick={onClose}>
          {t("ui.cancel")}
        </Button>
        <Button type="button" variant="destructive" onClick={confirm}>
          {t("ui.resetConfirm")}
        </Button>
      </div>
    </DialogShell>
  );
};
