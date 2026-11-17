import { useEffect, useRef, useState } from "react";
import { PLAYER_NAME_MAX } from "@/lib/constants";
import { playerName } from "@/lib/game";
import { translate } from "@/lib/i18n";
import { store, useStore } from "@/lib/store";
import { vibrate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogShell } from "./DialogShell";

type NameDialogProps = {
  targetId: string | null;
  onClose: () => void;
};

export const NameDialog = ({ targetId, onClose }: NameDialogProps) => {
  const players = useStore((state) => state.game.players);
  const lang = useStore((state) => state.lang);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const index = players.findIndex((player) => player.id === targetId);
  const player = index === -1 ? null : players[index];
  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);

  useEffect(() => {
    if (!player) return;
    setValue(player.name);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [targetId, player]);

  const confirm = () => {
    if (!player) {
      onClose();
      return;
    }
    onClose();
    const next = value.replace(/\s+/g, " ").trim().slice(0, PLAYER_NAME_MAX);
    if (next === player.name) return;
    store.setName(player.id, next);
    vibrate(6);
  };

  if (!player) return null;

  return (
    <DialogShell
      open={targetId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t("ui.nameDialogTitle", { name: playerName(lang, player, index) })}
      description={t("ui.nameSub")}
    >
      <Input
        ref={inputRef}
        id="nameInput"
        value={value}
        maxLength={PLAYER_NAME_MAX}
        autoComplete="off"
        enterKeyHint="done"
        aria-label={t("ui.nameInputAria", { name: playerName(lang, player, index) })}
        onChange={(event) => {
          setValue(event.target.value.replace(/\s+/g, " ").replace(/^\s+/, ""));
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            confirm();
          }
        }}
      />
      <div className="panel-actions">
        <Button type="button" variant="ghost" onClick={onClose}>
          {t("ui.cancel")}
        </Button>
        <Button type="button" onClick={confirm}>
          {t("ui.save")}
        </Button>
      </div>
    </DialogShell>
  );
};
