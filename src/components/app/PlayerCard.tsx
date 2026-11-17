import { useEffect, useRef } from "react";
import { THREAT_ALERT, THREAT_MAX } from "@/lib/constants";
import { actionLabel, translate } from "@/lib/i18n";
import { playerName } from "@/lib/game";
import { store, useStore } from "@/lib/store";
import { useLongPress } from "@/hooks/useLongPress";
import { vibrate } from "@/lib/utils";
import { Icon } from "./Icon";
import type { GameState, Player } from "@/lib/types";

type Session = { snapshot: GameState; value: number; label: string };

type PlayerCardProps = {
  player: Player;
  index: number;
  tablet: boolean;
  canRemove: boolean;
  pulseNonce: number;
  flash: { nonce: number; amount: number };
  onOpenThreat: (id: string) => void;
  onOpenName: (id: string) => void;
  onRemove: (id: string, name: string) => void;
};

export const PlayerCard = ({
  player,
  index,
  tablet,
  canRemove,
  pulseNonce,
  flash,
  onOpenThreat,
  onOpenName,
  onRemove,
}: PlayerCardProps) => {
  const lang = useStore((state) => state.lang);
  const session = useRef<Session | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);

  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const label = playerName(lang, player, index);
  const needsSetup = !player.setup;
  const alert = player.threat >= THREAT_ALERT;

  const counterLabel = player.name.trim()
    ? t("ui.threatNamed", { name: label })
    : t("ui.threat");

  const start = () => {
    session.current = {
      snapshot: store.snapshotGame(),
      value:
        store.getSnapshot().game.players.find((item) => item.id === player.id)?.threat ?? 0,
      label: counterLabel,
    };
    vibrate(4);
  };

  const step = (delta: number) => {
    store.setGame((draft) => {
      const target = draft.players.find((item) => item.id === player.id);
      if (!target) return;
      target.threat = Math.min(THREAT_MAX, Math.max(0, target.threat + delta));
      target.setup = true;
    }, false);
  };

  const end = () => {
    const current = session.current;
    session.current = null;
    if (!current) return;
    const target = store.getSnapshot().game.players.find((item) => item.id === player.id);
    if (!target) return;
    const amount = target.threat - current.value;
    if (amount === 0) return;
    store.pushHistory(
      current.snapshot,
      actionLabel("history.counter", {
        label: current.label,
        amount: `${amount > 0 ? "+" : ""}${amount}`,
      })
    );
  };

  const minusPress = useLongPress({
    onStart: start,
    onStep: () => step(-1),
    onEnd: end,
    disabled: player.threat <= 0,
  });
  const plusPress = useLongPress({
    onStart: start,
    onStep: () => step(1),
    onEnd: end,
    disabled: player.threat >= THREAT_MAX,
  });

  useEffect(() => {
    const card = cardRef.current;
    if (!card || !needsSetup) {
      card?.classList.remove("threat-pulse");
      return;
    }
    card.classList.remove("threat-pulse");
    void card.offsetWidth;
    card.classList.add("threat-pulse");
  }, [needsSetup, pulseNonce]);

  useEffect(() => {
    if (!flash.nonce || flash.amount <= 0) return;
    const card = cardRef.current;
    if (!card) return;
    card.classList.remove("threat-hit");
    void card.offsetWidth;
    card.classList.add("threat-hit");

    const float = document.createElement("span");
    float.className = "threat-float";
    float.textContent = `+${flash.amount}`;
    float.setAttribute("aria-hidden", "true");
    card.appendChild(float);

    const timer = window.setTimeout(() => {
      card.classList.remove("threat-hit");
      float.remove();
    }, 950);
    return () => {
      window.clearTimeout(timer);
      card.classList.remove("threat-hit");
      float.remove();
    };
  }, [flash]);

  const nameText = tablet
    ? label
    : player.name.trim()
      ? t("ui.threatNamed", { name: label })
      : t("ui.threat");
  const value = String(player.threat);

  return (
    <article
      ref={cardRef}
      className={`counter counter-player${needsSetup ? " needs-setup" : ""}`}
      data-id={player.id}
    >
      {tablet && <span className="player-caption">{t("ui.threat")}</span>}
      <div className="player-head">
        <button
          type="button"
          className="player-name"
          title={t("ui.renamePlayerAria", { name: label })}
          aria-label={t("ui.renamePlayerAria", { name: label })}
          onClick={() => onOpenName(player.id)}
        >
          {nameText}
        </button>
        <button
          type="button"
          className="player-remove"
          hidden={!canRemove}
          aria-label={t("ui.removePlayerAria", { name: label })}
          onClick={() => onRemove(player.id, label)}
        >
          <Icon kind="close" />
        </button>
      </div>

      <div className="counter-row">
        <button
          type="button"
          className="step"
          aria-label={t("ui.minusThreatAria", { name: label })}
          disabled={player.threat <= 0}
          {...minusPress}
        >
          −
        </button>
        <button
          type="button"
          className={`counter-value value-btn${value.length > 2 ? " long" : ""}${alert ? " alert" : ""}`}
          aria-live="polite"
          aria-label={t("ui.threatValueAria", {
            name: label,
            value: player.threat,
            alert: alert ? t("ui.alertSuffix") : "",
            setup: needsSetup ? t("ui.setupSuffix") : "",
          })}
          onClick={() => onOpenThreat(player.id)}
        >
          <span key={player.threat} className="pop">
            {player.threat}
          </span>
        </button>
        <button
          type="button"
          className="step"
          aria-label={t("ui.plusThreatAria", { name: label })}
          disabled={player.threat >= THREAT_MAX}
          {...plusPress}
        >
          +
        </button>
      </div>

      <span className="edit-hint">
        {needsSetup ? t("ui.setupHint") : t("ui.editHint")}
      </span>
    </article>
  );
};
