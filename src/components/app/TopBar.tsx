import { Button } from "@/components/ui/button";
import { Icon } from "./Icon";
import { languageNames, nextLanguage, translate } from "@/lib/i18n";
import type { Rotation } from "@/lib/types";

type WakeMode = "on" | "off" | "unsupported";

type TopBarProps = {
  lang: string;
  version: string;
  rotation: Rotation;
  targetLandscape: boolean;
  wakeMode: WakeMode;
  onRotate: () => void;
  onLanguage: () => void;
  onWake: () => void;
};

export const TopBar = ({
  lang,
  version,
  rotation,
  targetLandscape,
  wakeMode,
  onRotate,
  onLanguage,
  onWake,
}: TopBarProps) => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(lang, key, vars);
  const next = nextLanguage(lang);
  const names = languageNames(lang);
  const currentName = names[lang] || lang;
  const nextName = names[next] || next;
  const wakeActive = wakeMode === "on";
  const wakeLabel =
    wakeMode === "unsupported"
      ? t("ui.wakeUnsupported")
      : t(wakeActive ? "ui.wakeOn" : "ui.wakeOff");

  return (
    <header className="top-bar">
      <span className="brand">
        <span className="brand-mark" aria-hidden="true">
          ◈
        </span>
        <span className="brand-text">
          <span className="brand-title">{t("ui.appTitle")}</span>
          <span className="brand-version">{version ? `v${version}` : ""}</span>
        </span>
      </span>

      <div className="top-actions">
        <Button
          type="button"
          variant="goldGhost"
          size="icon"
          className="rounded-full"
          aria-label={t(targetLandscape ? "ui.rotateLandscape" : "ui.rotatePortrait")}
          title={t(targetLandscape ? "ui.rotateTitleLandscape" : "ui.rotateTitlePortrait")}
          onClick={onRotate}
        >
          <Icon kind={rotation === 90 ? "screenPortrait" : "screenLandscape"} />
        </Button>

        <Button
          type="button"
          variant="goldGhost"
          size="icon"
          className="lang-toggle rounded-full"
          aria-label={t("ui.languageAria", { current: currentName, next: nextName })}
          title={t("ui.languageTitle", { next: nextName })}
          onClick={onLanguage}
        >
          {lang.toUpperCase()}
        </Button>

        <button
          type="button"
          className="wake"
          data-state={wakeMode}
          aria-pressed={wakeMode === "unsupported" ? undefined : wakeActive}
          aria-disabled={wakeMode === "unsupported" ? "true" : undefined}
          aria-label={
            wakeMode === "unsupported"
              ? t("ui.wakeUnsupportedAria")
              : t(wakeActive ? "ui.wakeOnAria" : "ui.wakeOffAria")
          }
          title={
            wakeMode === "unsupported"
              ? t("ui.wakeUnsupportedTitle")
              : t(wakeActive ? "ui.wakeOnTitle" : "ui.wakeOffTitle")
          }
          onClick={onWake}
        >
          <span className="wake-dot" aria-hidden="true" />
          <span>{wakeLabel}</span>
        </button>
      </div>
    </header>
  );
};
