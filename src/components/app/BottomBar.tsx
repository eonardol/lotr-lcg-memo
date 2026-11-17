import { labelText, translate } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { Icon } from "./Icon";

type BottomBarProps = {
  onUndo: () => void;
  onReset: () => void;
};

export const BottomBar = ({ onUndo, onReset }: BottomBarProps) => {
  const history = useStore((state) => state.history);
  const lang = useStore((state) => state.lang);
  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const last = history[history.length - 1];
  const undoLabel = last ? labelText(lang, last.label) : t("ui.undo");

  return (
    <footer className="bottom-bar">
      <button
        type="button"
        className="bottom-button"
        data-no-tap="true"
        disabled={!last}
        aria-label={last ? t("ui.undoAria", { label: undoLabel }) : t("ui.undoNone")}
        onClick={onUndo}
      >
        <Icon kind="undo" />
        <span>{undoLabel}</span>
      </button>
      <button type="button" className="bottom-button" onClick={onReset}>
        <Icon kind="restart" />
        <span>{t("ui.newGame")}</span>
      </button>
    </footer>
  );
};
