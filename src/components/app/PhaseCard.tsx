import { useEffect, useRef } from "react";
import progress from "@/assets/progress.png";
import { FASI, blocksFor } from "@/lib/constants";
import { phaseName, translate } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { StepList } from "./StepList";
import type { ProcessKind } from "@/lib/types";

type PhaseCardProps = {
  onOpenProcess: (kind: ProcessKind) => void;
  onOpenQuest: () => void;
  onOpenNotes: (container: string, anchor: string) => void;
};

export const PhaseCard = ({ onOpenProcess, onOpenQuest, onOpenNotes }: PhaseCardProps) => {
  const fase = useStore((state) => state.game.fase);
  const lang = useStore((state) => state.lang);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const hasQuest = blocksFor(String(fase)).some((block) => block.kind === "step" && block.quest);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [fase]);

  return (
    <div className="phase-card" ref={scrollRef} id="phaseCard">
      <div className="phase-heading">
        <p className="phase-eyebrow">
          {t("ui.phaseOf", { n: fase + 1, total: FASI.length })}
        </p>
        <div className="phase-title-row">
          <h2 className="phase-name" aria-live="polite">
            {phaseName(lang, fase)}
          </h2>
          {hasQuest && (
            <button type="button" className="process-btn phase-quest-btn" onClick={onOpenQuest}>
              <img className="quest-btn-icon" src={progress} alt="" aria-hidden="true" />
              <span>{t("ui.questOpen")}</span>
            </button>
          )}
        </div>
      </div>
      <StepList
        container={String(fase)}
        onOpenProcess={onOpenProcess}
        onOpenQuest={onOpenQuest}
        onOpenNotes={onOpenNotes}
      />
    </div>
  );
};
