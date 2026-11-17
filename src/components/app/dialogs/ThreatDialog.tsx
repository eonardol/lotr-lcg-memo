import { useEffect, useRef, useState } from "react";
import { THREAT_MAX } from "@/lib/constants";
import { playerName } from "@/lib/game";
import { translate } from "@/lib/i18n";
import { store, useStore } from "@/lib/store";
import { vibrate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogShell } from "./DialogShell";

type ThreatDialogProps = {
  targetId: string | null;
  onClose: () => void;
};

export const ThreatDialog = ({ targetId, onClose }: ThreatDialogProps) => {
  const players = useStore((state) => state.game.players);
  const lang = useStore((state) => state.lang);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const index = players.findIndex((player) => player.id === targetId);
  const player = index === -1 ? null : players[index];
  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);

  useEffect(() => {
    if (!player) return;
    setValue(String(player.threat));
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
    const raw = value.trim();
    onClose();
    if (raw === "") return;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return;
    const next = Math.min(THREAT_MAX, Math.max(0, parsed));
    if (next === player.threat) {
      if (!player.setup) store.confirmSameThreat(player.id);
      return;
    }
    store.setThreat(player.id, next);
    vibrate(8);
  };

  if (!player) return null;

  return (
    <DialogShell
      open={targetId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t("ui.threatTitle")}
      description={t("ui.threatSubNamed", { name: playerName(lang, player, index) })}
    >
      <Input
        ref={inputRef}
        id="threatInput"
        value={value}
        inputMode="numeric"
        autoComplete="off"
        enterKeyHint="done"
        aria-label={t("ui.threatInputAria")}
        onChange={(event) => {
          const next = event.target.value.replace(/\D+/g, "").slice(0, 3);
          setValue(next);
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
          {t("ui.set")}
        </Button>
      </div>
    </DialogShell>
  );
};
