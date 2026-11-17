import type { Note } from "@/lib/types";
import { noteKey } from "@/lib/storage";
import { gapLabel } from "@/lib/notes";
import { translate } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { Icon } from "./Icon";

const EMPTY_NOTES: Note[] = [];

type NoteGapProps = {
  container: string;
  anchor: string;
  onOpenNotes: (container: string, anchor: string) => void;
};

export const NoteGap = ({ container, anchor, onOpenNotes }: NoteGapProps) => {
  const notesMap = useStore((state) => state.notes);
  const notes = notesMap[noteKey(container, anchor)] ?? EMPTY_NOTES;
  const lang = useStore((state) => state.lang);
  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const gap = gapLabel(lang, container, anchor);

  return (
    <div className="gap">
      {notes.length > 0 && (
        <div className="gap-notes">
          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              className="player-note"
              aria-label={t("ui.editNoteAria", { text: note.text })}
              onClick={() => onOpenNotes(container, anchor)}
            >
              {note.text}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="gap-add"
        title={t("ui.addNoteTitle")}
        aria-label={t("ui.addNoteAria", { gap })}
        onClick={() => onOpenNotes(container, anchor)}
      >
        <Icon kind="plus" />
      </button>
    </div>
  );
};
