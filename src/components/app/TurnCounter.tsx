import { useRef } from "react";
import { actionLabel, translate } from "@/lib/i18n";
import { store, useStore } from "@/lib/store";
import { useLongPress } from "@/hooks/useLongPress";
import { vibrate } from "@/lib/utils";
import type { GameState } from "@/lib/types";

type Session = { snapshot: GameState; value: number };

export const TurnCounter = () => {
  const turno = useStore((state) => state.game.turno);
  const lang = useStore((state) => state.lang);
  const session = useRef<Session | null>(null);

  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);

  const start = () => {
    session.current = { snapshot: store.snapshotGame(), value: store.getSnapshot().game.turno };
    vibrate(4);
  };

  const step = (delta: number) => {
    store.setGame((draft) => {
      draft.turno = Math.min(999, Math.max(1, draft.turno + delta));
    }, false);
  };

  const end = () => {
    const current = session.current;
    session.current = null;
    if (!current) return;
    const amount = store.getSnapshot().game.turno - current.value;
    if (amount === 0) return;
    store.pushHistory(
      current.snapshot,
      actionLabel("history.counter", {
        label: t("ui.turn"),
        amount: `${amount > 0 ? "+" : ""}${amount}`,
      })
    );
  };

  const minusPress = useLongPress({
    onStart: start,
    onStep: () => step(-1),
    onEnd: end,
    disabled: turno <= 1,
  });
  const plusPress = useLongPress({
    onStart: start,
    onStep: () => step(1),
    onEnd: end,
    disabled: turno >= 999,
  });

  const value = String(turno);

  return (
    <article className="counter counter-turno">
      <h2 className="counter-label" id="turnoLabel">
        {t("ui.turn")}
      </h2>
      <div className="counter-row">
        <button
          type="button"
          className="step"
          aria-label={t("ui.turnMinus")}
          disabled={turno <= 1}
          {...minusPress}
        >
          −
        </button>
        <span
          key={turno}
          className={`counter-value pop${value.length > 2 ? " long" : ""}`}
          id="turnoValue"
          aria-labelledby="turnoLabel"
          aria-live="polite"
        >
          {turno}
        </span>
        <button
          type="button"
          className="step"
          aria-label={t("ui.turnPlus")}
          disabled={turno >= 999}
          {...plusPress}
        >
          +
        </button>
      </div>
    </article>
  );
};
