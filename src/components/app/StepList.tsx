import progress from "@/assets/progress.png";
import { blocksFor } from "@/lib/constants";
import { processName, stepText, translate } from "@/lib/i18n";
import { isBookmarked } from "@/lib/notes";
import { store, useStore } from "@/lib/store";
import { vibrate } from "@/lib/utils";
import { NoteGap } from "./NoteGap";
import { Icon } from "./Icon";
import type { ProcessKind } from "@/lib/types";

type StepListProps = {
  container: string;
  onOpenProcess?: (kind: ProcessKind) => void;
  onOpenQuest?: () => void;
  onOpenNotes: (container: string, anchor: string) => void;
};

export const StepList = ({
  container,
  onOpenProcess,
  onOpenQuest,
  onOpenNotes,
}: StepListProps) => {
  const lang = useStore((state) => state.lang);
  const bookmark = useStore((state) => state.game.bookmark);
  const blocks = blocksFor(container);
  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);

  const toggle = (step: string) => {
    store.toggleBookmark(container, step);
    vibrate(6);
  };

  return (
    <div className="step-list">
      {blocks.map((block, index) => (
        <div key={`${block.kind}-${block.id}-${index}`}>
          {block.kind === "window" ? (
            <div className="action-window">{t("ui.actionWindow")}</div>
          ) : (
            <div
              className={`step-block${isBookmarked(bookmark, container, block.id) ? " bookmarked" : ""}`}
              onClick={(event) => {
                const target = event.target instanceof Element ? event.target : null;
                if (target && target.closest("button")) return;
                const selection = window.getSelection();
                if (selection && !selection.isCollapsed) return;
                toggle(block.id);
              }}
            >
              <span className="step-num">{block.id}</span>
              <div className="step-body">
                <p className="step-text">{stepText(lang, block)}</p>
              </div>
              <button
                type="button"
                className="step-bookmark"
                aria-pressed={isBookmarked(bookmark, container, block.id)}
                aria-label={
                  isBookmarked(bookmark, container, block.id)
                    ? t("ui.bookmarkRemove", { step: block.id })
                    : t("ui.bookmarkAdd", { step: block.id })
                }
                title={
                  isBookmarked(bookmark, container, block.id)
                    ? t("ui.bookmarkRemoveShort")
                    : t("ui.bookmarkAddShort")
                }
                onClick={() => toggle(block.id)}
              >
                <Icon kind="bookmark" filled={isBookmarked(bookmark, container, block.id)} />
              </button>
            </div>
          )}

          {block.kind === "step" && block.process && onOpenProcess && (
            <button
              type="button"
              className="process-btn"
              aria-label={t("ui.openProcessAria", {
                name: processName(lang, block.process),
              })}
              onClick={() => onOpenProcess(block.process as ProcessKind)}
            >
              {t("ui.openProcess")}
            </button>
          )}

          {block.kind === "step" && block.quest && onOpenQuest && (
            <button
              type="button"
              className="process-btn quest-btn"
              aria-label={t("ui.questOpenAria")}
              onClick={onOpenQuest}
            >
              <img className="quest-btn-icon" src={progress} alt="" aria-hidden="true" />
              <span>{t("ui.questOpen")}</span>
            </button>
          )}

          {index < blocks.length - 1 && (
            <NoteGap container={container} anchor={block.id} onOpenNotes={onOpenNotes} />
          )}
        </div>
      ))}
      <NoteGap container={container} anchor="end" onOpenNotes={onOpenNotes} />
    </div>
  );
};
