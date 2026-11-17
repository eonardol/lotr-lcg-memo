import { useCallback, useEffect, useRef, useState } from "react";
import { BottomBar } from "@/components/app/BottomBar";
import { NextButton } from "@/components/app/NextButton";
import { PhaseCard } from "@/components/app/PhaseCard";
import { PlayersGrid } from "@/components/app/PlayersGrid";
import { PortalContainerProvider } from "@/components/app/PortalContainer";
import { Stepper } from "@/components/app/Stepper";
import { TopBar } from "@/components/app/TopBar";
import { TurnCounter } from "@/components/app/TurnCounter";
import { NameDialog } from "@/components/app/dialogs/NameDialog";
import { NotesDialog } from "@/components/app/dialogs/NotesDialog";
import { ProcessDialog } from "@/components/app/dialogs/ProcessDialog";
import { QuestDialog } from "@/components/app/dialogs/QuestDialog";
import { ResetDialog } from "@/components/app/dialogs/ResetDialog";
import { ThreatDialog } from "@/components/app/dialogs/ThreatDialog";
import {
  anyDialogOpen,
  emptyDialogs,
  type DialogState,
  type NotesScope,
} from "@/components/app/dialogs/dialog-state";
import { useSfx } from "@/hooks/useSfx";
import { useThreatAlert } from "@/hooks/useThreatAlert";
import { useViewportLayout } from "@/hooks/useViewportLayout";
import { useWakeLock } from "@/hooks/useWakeLock";
import { nextLanguage, translate } from "@/lib/i18n";
import { store, useStore } from "@/lib/store";
import { vibrate } from "@/lib/utils";
import type { ProcessKind } from "@/lib/types";

const appVersion = (window as Window & { APP_VERSION?: string }).APP_VERSION;

export const App = () => {
  const players = useStore((state) => state.game.players);
  const lang = useStore((state) => state.lang);
  const rotation = useStore((state) => state.rotation);
  const wakeWanted = useStore((state) => state.wake);
  const layout = useViewportLayout(rotation);
  const playSfx = useSfx();
  const threatAlert = useThreatAlert(players, playSfx);
  const wakeLock = useWakeLock(wakeWanted, (value) => store.setWake(value));

  const [rotatorEl, setRotatorEl] = useState<HTMLDivElement | null>(null);
  const [dialogs, setDialogs] = useState<DialogState>(emptyDialogs);
  const [pulseNonce, setPulseNonce] = useState(0);
  const [flash, setFlash] = useState({ nonce: 0, amount: 0 });
  const rotatorRef = useRef<HTMLDivElement | null>(null);

  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);

  const setRotator = useCallback((node: HTMLDivElement | null) => {
    rotatorRef.current = node;
    setRotatorEl(node);
  }, []);

  useEffect(() => {
    document.title = t("ui.appTitle");
    document.documentElement.lang = lang;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", t("ui.appDescription"));
  }, [lang]);

  useEffect(() => {
    const rotator = rotatorRef.current;
    if (!rotator) return;
    rotator.classList.toggle("modal-open", anyDialogOpen(dialogs));
  }, [dialogs]);

  useEffect(() => {
    rotatorRef.current?.scrollTo({ top: 0 });
  }, [rotation]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest("button");
      if (button && !button.disabled && !button.hasAttribute("data-no-tap")) {
        playSfx("tap");
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return;
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest("button");
      if (button && !button.disabled && !button.hasAttribute("data-no-tap")) {
        playSfx("tap");
      }
    };
    document.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true });
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, { capture: true });
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [playSfx]);

  const openNotes = (scope: NotesScope) => {
    setDialogs((current) => ({ ...current, notes: scope }));
  };

  const handleUndo = () => {
    playSfx("undo");
    threatAlert.muteNext();
    setFlash({ nonce: 0, amount: 0 });
    const result = store.undo();
    if (!result.hadPending && result.hasPending) setPulseNonce((value) => value + 1);
    vibrate(8);
  };

  const handleReset = () => {
    setDialogs((current) => ({ ...current, reset: false }));
    store.resetGame();
    setPulseNonce((value) => value + 1);
    vibrate(10);
  };

  const handleQuestApplied = (amount: number) => {
    setDialogs((current) => ({ ...current, quest: false }));
    setFlash({ nonce: Date.now(), amount });
    vibrate(12);
  };

  const openProcess = (kind: ProcessKind) => {
    setDialogs((current) => ({ ...current, process: kind }));
  };

  return (
    <div ref={setRotator} id="rotator" data-rotation={rotation}>
      <PortalContainerProvider value={rotatorEl}>
        <main className="app-shell">
          <TopBar
            lang={lang}
            version={appVersion || "dev"}
            rotation={rotation}
            targetLandscape={layout.targetLandscape}
            wakeMode={wakeLock.mode}
            onRotate={() => {
              store.setRotation(rotation === 0 ? 90 : 0);
              vibrate(6);
            }}
            onLanguage={() => {
              store.setLang(nextLanguage(lang));
              vibrate(6);
            }}
            onWake={() => {
              wakeLock.toggle();
              vibrate(6);
            }}
          />

          <section className="counters" aria-label={t("ui.counters")}>
            <TurnCounter />
            <PlayersGrid
              tablet={layout.tablet}
              pulseNonce={pulseNonce}
              flash={flash}
              onOpenThreat={(id) => setDialogs((current) => ({ ...current, threat: id }))}
              onOpenName={(id) => setDialogs((current) => ({ ...current, name: id }))}
              onPulse={() => setPulseNonce((value) => value + 1)}
            />
          </section>

          <section className="phase" aria-label={t("ui.currentPhase")}>
            <Stepper />
            <PhaseCard
              onOpenProcess={openProcess}
              onOpenQuest={() => setDialogs((current) => ({ ...current, quest: true }))}
              onOpenNotes={(container, anchor) => openNotes({ container, anchor })}
            />
          </section>

          <NextButton playSfx={playSfx} />

          <BottomBar
            onUndo={handleUndo}
            onReset={() => setDialogs((current) => ({ ...current, reset: true }))}
          />
        </main>

        <ProcessDialog
          kind={dialogs.process}
          onClose={() => setDialogs((current) => ({ ...current, process: null }))}
          onOpenNotes={openNotes}
        />

        <QuestDialog
          open={dialogs.quest}
          onClose={() => setDialogs((current) => ({ ...current, quest: false }))}
          onApplied={handleQuestApplied}
        />

        <NotesDialog
          scope={dialogs.notes}
          onClose={() => setDialogs((current) => ({ ...current, notes: null }))}
        />

        <ThreatDialog
          targetId={dialogs.threat}
          onClose={() => setDialogs((current) => ({ ...current, threat: null }))}
        />

        <NameDialog
          targetId={dialogs.name}
          onClose={() => setDialogs((current) => ({ ...current, name: null }))}
        />

        <ResetDialog
          open={dialogs.reset}
          onClose={() => setDialogs((current) => ({ ...current, reset: false }))}
          onConfirm={handleReset}
        />
      </PortalContainerProvider>
    </div>
  );
};

export default App;
