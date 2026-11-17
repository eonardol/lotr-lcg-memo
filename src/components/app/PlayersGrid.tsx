import { PLAYER_LIMIT } from "@/lib/constants";
import { translate } from "@/lib/i18n";
import { store, useStore } from "@/lib/store";
import { vibrate } from "@/lib/utils";
import { Icon } from "./Icon";
import { PlayerCard } from "./PlayerCard";

type PlayersGridProps = {
  tablet: boolean;
  pulseNonce: number;
  flash: { nonce: number; amount: number };
  onOpenThreat: (id: string) => void;
  onOpenName: (id: string) => void;
  onPulse: () => void;
};

export const PlayersGrid = ({
  tablet,
  pulseNonce,
  flash,
  onOpenThreat,
  onOpenName,
  onPulse,
}: PlayersGridProps) => {
  const players = useStore((state) => state.game.players);
  const lang = useStore((state) => state.lang);
  const t = (key: string) => translate(lang, key);
  const visible = tablet ? players : players.slice(0, 1);
  const canRemove = tablet && players.length > 1;

  const addPlayer = () => {
    if (store.addPlayer()) {
      onPulse();
      vibrate(8);
    }
  };

  const removePlayer = (id: string, name: string) => {
    store.removePlayer(id, name);
    vibrate(8);
  };

  return (
    <>
      {visible.map((player, index) => (
        <PlayerCard
          key={player.id}
          player={player}
          index={index}
          tablet={tablet}
          canRemove={canRemove}
          pulseNonce={pulseNonce}
          flash={flash}
          onOpenThreat={onOpenThreat}
          onOpenName={onOpenName}
          onRemove={removePlayer}
        />
      ))}

      {tablet && players.length < PLAYER_LIMIT && (
        <button
          type="button"
          className="counter counter-add"
          aria-label={t("ui.addPlayerAria")}
          onClick={addPlayer}
        >
          <Icon kind="plus" className="add-mark" />
          <span className="add-label">{t("ui.addPlayer")}</span>
        </button>
      )}
    </>
  );
};
