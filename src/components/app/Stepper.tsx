import { FASI } from "@/lib/constants";
import { actionLabel, phaseName, translate } from "@/lib/i18n";
import { acceptThreatSetup } from "@/lib/game";
import { phaseHasBookmark, phaseHasNotes } from "@/lib/notes";
import { store, useStore } from "@/lib/store";
import { vibrate } from "@/lib/utils";

export const Stepper = () => {
  const fase = useStore((state) => state.game.fase);
  const bookmark = useStore((state) => state.game.bookmark);
  const notes = useStore((state) => state.notes);
  const lang = useStore((state) => state.lang);

  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);

  const select = (index: number) => {
    if (index === fase) return;
    store.mutate(actionLabel("history.phase", { name: phaseName(lang, index) }), (draft) => {
      acceptThreatSetup(draft);
      draft.fase = index;
    });
    vibrate(8);
  };

  return (
    <div className="stepper" role="group" aria-label={t("ui.stepper")}>
      {FASI.map((_phase, index) => {
        const current = index === fase;
        const hasNotes = phaseHasNotes(notes, index);
        const hasBookmark = phaseHasBookmark(bookmark, index);
        const extra = [hasNotes ? t("ui.hasNotes") : "", hasBookmark ? t("ui.hasBookmark") : ""]
          .filter(Boolean)
          .join(", ");
        return (
          <button
            key={index}
            type="button"
            className={[
              "step-pill",
              current ? "current" : "",
              index < fase ? "done" : "",
              hasNotes ? "has-notes" : "",
              hasBookmark ? "has-bookmark" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={
              t("ui.phaseAria", { n: index + 1, name: phaseName(lang, index) }) +
              (extra ? ` (${extra})` : "")
            }
            aria-current={current ? "step" : undefined}
            onClick={() => select(index)}
          >
            <span className="step-pill-num">{index + 1}</span>
            <span className="step-pill-name">{phaseName(lang, index)}</span>
          </button>
        );
      })}
    </div>
  );
};
