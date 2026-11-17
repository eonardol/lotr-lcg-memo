import { LAST_PHASE } from "@/lib/constants";
import { actionLabel, phaseName, translate } from "@/lib/i18n";
import { acceptThreatSetup } from "@/lib/game";
import { store, useStore } from "@/lib/store";
import { vibrate } from "@/lib/utils";
import type { PlaySfx } from "@/hooks/useSfx";

type NextButtonProps = {
  playSfx: PlaySfx;
};

export const NextButton = ({ playSfx }: NextButtonProps) => {
  const fase = useStore((state) => state.game.fase);
  const turno = useStore((state) => state.game.turno);
  const lang = useStore((state) => state.lang);
  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);

  const advance = () => {
    if (fase === LAST_PHASE) {
      store.nextTurn();
      playSfx("round");
    } else {
      const target = fase + 1;
      store.mutate(actionLabel("history.phase", { name: phaseName(lang, target) }), (draft) => {
        acceptThreatSetup(draft);
        draft.fase = target;
      });
    }
    vibrate(12);
  };

  return (
    <button type="button" className="next" id="next" onClick={advance}>
      <span className="next-main">{t("ui.next")}</span>
      <span className="next-hint">
        {fase === LAST_PHASE
          ? t("ui.nextTurnHint", { n: turno + 1 })
          : t("ui.nextPhaseHint", { name: phaseName(lang, fase + 1) })}
      </span>
    </button>
  );
};
