import { useAppUpdate, type UpdatePhase } from "@/hooks/useAppUpdate";
import { translate } from "@/lib/i18n";

type UpdateVersionButtonProps = {
  lang: string;
  version: string;
};

const visibleLabel = (phase: UpdatePhase, version: string): string => {
  if (phase === "current") return "✓";
  if (phase === "error" || phase === "offline") return "!";
  return `v${version}`;
};

export const UpdateVersionButton = ({ lang, version }: UpdateVersionButtonProps) => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(lang, key, vars);
  const update = useAppUpdate(version);
  const availableVersion = update.latestVersion ?? version;
  const state =
    update.phase === "available" && update.confirming ? "confirming" : update.phase;

  const ariaLabel =
    update.phase === "checking"
      ? t("ui.versionCheckingAria")
      : update.phase === "applying"
        ? t("ui.versionApplyingAria")
        : update.phase === "current"
          ? t("ui.versionCurrentAria", { version })
          : update.phase === "error"
            ? t("ui.versionErrorAria")
            : update.phase === "offline"
              ? t("ui.versionOfflineAria")
              : update.confirming
                ? t("ui.versionConfirmAria", { version: availableVersion })
                : update.hasUpdate
                  ? t("ui.versionAvailableAria", { version: availableVersion })
                  : t("ui.versionCheckAria", { version });

  const announcement =
    update.phase === "checking"
      ? t("ui.versionChecking")
      : update.phase === "current"
        ? t("ui.versionUpToDate")
        : update.phase === "error"
          ? t("ui.versionError")
          : update.phase === "offline"
            ? t("ui.versionOffline")
            : update.phase === "applying"
              ? t("ui.versionApplying")
              : update.hasUpdate
                ? t("ui.versionAvailable", { version: availableVersion })
                : "";

  return (
    <>
      <button
        type="button"
        className="brand-version"
        data-state={state}
        aria-label={ariaLabel}
        title={ariaLabel}
        aria-busy={update.phase === "checking" || update.phase === "applying"}
        disabled={update.phase === "checking" || update.phase === "applying"}
        onClick={update.activate}
      >
        <span>
          {update.phase === "available" && update.confirming
            ? t("ui.versionUpdateAction")
            : visibleLabel(update.phase, version)}
        </span>
        <span className="update-dot" aria-hidden="true" />
      </button>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </>
  );
};
