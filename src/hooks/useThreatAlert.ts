import { useEffect, useRef } from "react";
import { THREAT_ALERT } from "@/lib/constants";
import type { Player } from "@/lib/types";
import type { PlaySfx } from "./useSfx";

export const useThreatAlert = (players: Player[], playSfx: PlaySfx) => {
  const previous = useRef(new Map<string, number>());
  const initialized = useRef(false);
  const muteNext = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      players.forEach((player) => previous.current.set(player.id, player.threat));
      initialized.current = true;
      return;
    }

    const ids = new Set(players.map((player) => player.id));
    previous.current.forEach((_value, id) => {
      if (!ids.has(id)) previous.current.delete(id);
    });

    let crossed = false;
    players.forEach((player) => {
      const before = previous.current.get(player.id);
      if (before !== undefined && before < THREAT_ALERT && player.threat >= THREAT_ALERT) {
        crossed = true;
      }
      previous.current.set(player.id, player.threat);
    });

    if (muteNext.current) {
      muteNext.current = false;
      return;
    }
    if (crossed) playSfx("over");
  }, [players, playSfx]);

  return {
    muteNext: () => {
      muteNext.current = true;
    },
  };
};
