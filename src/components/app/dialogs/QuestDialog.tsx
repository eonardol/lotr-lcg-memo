import { useEffect, useState } from "react";
import progress from "@/assets/progress.png";
import threat from "@/assets/threat.png";
import willpower from "@/assets/willpower.png";
import { THREAT_MAX, WILLPOWER_MAX, WILLPOWER_MIN } from "@/lib/constants";
import { clampQuestThreat, clampWillpower } from "@/lib/game";
import { translate } from "@/lib/i18n";
import { store, useStore } from "@/lib/store";
import { vibrate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLongPress } from "@/hooks/useLongPress";
import { DialogShell } from "./DialogShell";

type QuestField = "willpower" | "threat";

type QuestDialogProps = {
  open: boolean;
  onClose: () => void;
  onApplied: (amount: number) => void;
};

export const QuestDialog = ({ open, onClose, onApplied }: QuestDialogProps) => {
  const quest = useStore((state) => state.game.quest);
  const lang = useStore((state) => state.lang);
  const [willpowerText, setWillpowerText] = useState("0");
  const [threatText, setThreatText] = useState("0");

  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);

  useEffect(() => {
    if (!open) return;
    const current = store.getSnapshot().game.quest;
    setWillpowerText(String(current.willpower));
    setThreatText(String(current.threat));
  }, [open]);

  const setField = (field: QuestField, value: number) => {
    store.setGame((draft) => {
      if (draft.quest.applied) return;
      if (field === "willpower") draft.quest.willpower = clampWillpower(value);
      else draft.quest.threat = clampQuestThreat(value);
    });
  };

  const applyStep = (field: QuestField, delta: number) => {
    const current = store.getSnapshot().game.quest;
    if (current.applied) return;
    const next =
      field === "willpower"
        ? Math.min(WILLPOWER_MAX, Math.max(WILLPOWER_MIN, current.willpower + delta))
        : Math.min(THREAT_MAX, Math.max(0, current.threat + delta));
    setField(field, next);
    if (field === "willpower") setWillpowerText(String(next));
    else setThreatText(String(next));
  };

  const willpowerMinus = useLongPress({
    onStart: () => vibrate(4),
    onStep: () => applyStep("willpower", -1),
    disabled: quest.applied || quest.willpower <= WILLPOWER_MIN,
  });
  const willpowerPlus = useLongPress({
    onStart: () => vibrate(4),
    onStep: () => applyStep("willpower", 1),
    disabled: quest.applied || quest.willpower >= WILLPOWER_MAX,
  });
  const threatMinus = useLongPress({
    onStart: () => vibrate(4),
    onStep: () => applyStep("threat", -1),
    disabled: quest.applied || quest.threat <= 0,
  });
  const threatPlus = useLongPress({
    onStart: () => vibrate(4),
    onStep: () => applyStep("threat", 1),
    disabled: quest.applied || quest.threat >= THREAT_MAX,
  });

  const diff = quest.willpower - quest.threat;
  const negative = diff < 0;
  const amount = Math.abs(diff);

  const raiseThreat = () => {
    if (diff >= 0 || quest.applied) return;
    store.applyQuestThreat(amount);
    onApplied(amount);
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t("ui.questTitle")}
      description={t("ui.questSub")}
      className="panel-quest"
      closeLabel={t("ui.questClose")}
    >
      <div className="quest-field">
        <img className="quest-token" src={willpower} alt="" aria-hidden="true" />
        <span className="quest-label">{t("ui.questWillpower")}</span>
        <div className="quest-stepper">
          <button
            type="button"
            className="step quest-step"
            aria-label={t("ui.questMinusAria", { field: t("ui.questWillpower") })}
            disabled={quest.applied || quest.willpower <= WILLPOWER_MIN}
            {...willpowerMinus}
          >
            −
          </button>
          <Input
            className="quest-input"
            id="questWillpowerInput"
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="done"
            aria-label={t("ui.questWillpower")}
            value={willpowerText}
            disabled={quest.applied}
            onChange={(event) => {
              const text = event.target.value
                .replace(/[^\d-]/g, "")
                .replace(/(?!^)-/g, "")
                .slice(0, 4);
              setWillpowerText(text);
              const parsed = text === "" || text === "-" ? 0 : Number.parseInt(text, 10);
              setField("willpower", Number.isFinite(parsed) ? parsed : 0);
            }}
            onBlur={() => setWillpowerText(String(store.getSnapshot().game.quest.willpower))}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
          />
          <button
            type="button"
            className="step quest-step"
            aria-label={t("ui.questPlusAria", { field: t("ui.questWillpower") })}
            disabled={quest.applied || quest.willpower >= WILLPOWER_MAX}
            {...willpowerPlus}
          >
            +
          </button>
        </div>
      </div>

      <div className="quest-field">
        <img className="quest-token" src={threat} alt="" aria-hidden="true" />
        <span className="quest-label">{t("ui.questThreat")}</span>
        <div className="quest-stepper">
          <button
            type="button"
            className="step quest-step"
            aria-label={t("ui.questMinusAria", { field: t("ui.questThreat") })}
            disabled={quest.applied || quest.threat <= 0}
            {...threatMinus}
          >
            −
          </button>
          <Input
            className="quest-input"
            id="questThreatInput"
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="done"
            aria-label={t("ui.questThreat")}
            value={threatText}
            disabled={quest.applied}
            onChange={(event) => {
              const text = event.target.value.replace(/\D/g, "").slice(0, 3);
              setThreatText(text);
              const parsed = text === "" ? 0 : Number.parseInt(text, 10);
              setField("threat", Number.isFinite(parsed) ? parsed : 0);
            }}
            onBlur={() => setThreatText(String(store.getSnapshot().game.quest.threat))}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
          />
          <button
            type="button"
            className="step quest-step"
            aria-label={t("ui.questPlusAria", { field: t("ui.questThreat") })}
            disabled={quest.applied || quest.threat >= THREAT_MAX}
            {...threatPlus}
          >
            +
          </button>
        </div>
      </div>

      <div className="quest-result" aria-live="polite">
        {!negative && (
          <>
            <div
              className="quest-progress"
              aria-label={t("ui.questProgressAria", { n: diff })}
            >
              <img className="quest-token quest-token-progress" src={progress} alt="" aria-hidden="true" />
              <span className="quest-progress-label">{t("ui.questProgress")}</span>
              <span className="quest-progress-value">{diff}</span>
            </div>
            <Button type="button" variant="goldGhost" className="quest-done w-full" onClick={onClose}>
              {t("ui.questDone")}
            </Button>
          </>
        )}

        {negative && (
          <button
            type="button"
            className="quest-raise"
            disabled={quest.applied}
            aria-label={
              quest.applied
                ? t("ui.questRaised", { n: amount })
                : t("ui.questRaiseThreat", { n: amount })
            }
            onClick={raiseThreat}
          >
            <img className="quest-token quest-token-threat" src={threat} alt="" aria-hidden="true" />
            <span>
              {quest.applied
                ? t("ui.questRaised", { n: amount })
                : t("ui.questRaiseThreat", { n: amount })}
            </span>
          </button>
        )}
      </div>

      {quest.applied && <p className="quest-lock">{t("ui.questLocked")}</p>}
    </DialogShell>
  );
};
