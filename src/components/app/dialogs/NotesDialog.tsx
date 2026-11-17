import { useEffect, useRef, useState } from "react";
import { NOTE_LIMIT } from "@/lib/constants";
import { makeId } from "@/lib/game";
import { translate } from "@/lib/i18n";
import { containerTitle, gapLabel } from "@/lib/notes";
import { noteKey } from "@/lib/storage";
import { store, useStore } from "@/lib/store";
import { vibrate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "../Icon";
import type { Note } from "@/lib/types";
import { DialogShell } from "./DialogShell";
import type { NotesScope } from "./dialog-state";

type NotesDialogProps = {
  scope: NotesScope | null;
  onClose: () => void;
};

export const NotesDialog = ({ scope, onClose }: NotesDialogProps) => {
  const notesMap = useStore((state) => state.notes);
  const lang = useStore((state) => state.lang);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const editRef = useRef<HTMLTextAreaElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const list = scope ? notesMap[noteKey(scope.container, scope.anchor)] || [] : [];

  useEffect(() => {
    setDraft("");
    setEditingId(null);
    setDeletingId(null);
    setEditText("");
  }, [scope]);

  useEffect(() => {
    if (!editingId) return;
    requestAnimationFrame(() => {
      editRef.current?.focus();
      const length = editRef.current?.value.length ?? 0;
      editRef.current?.setSelectionRange(length, length);
    });
  }, [editingId]);

  const updateList = (apply: (items: Note[]) => Note[]) => {
    if (!scope) return;
    const key = noteKey(scope.container, scope.anchor);
    store.updateNotes((draftNotes) => {
      const items = draftNotes[key] || [];
      const next = apply(items.map((note) => ({ ...note })));
      if (next.length > 0) draftNotes[key] = next;
      else delete draftNotes[key];
    });
  };

  const addNote = () => {
    const text = draft.trim().slice(0, NOTE_LIMIT);
    if (!text) {
      composerRef.current?.focus();
      return;
    }
    updateList((items) => [...items, { id: makeId(), text }]);
    setDraft("");
    vibrate(6);
    composerRef.current?.focus();
  };

  const saveEdit = () => {
    const text = editText.trim().slice(0, NOTE_LIMIT);
    if (!text) {
      editRef.current?.focus();
      return;
    }
    updateList((items) =>
      items.map((note) => (note.id === editingId ? { ...note, text } : note))
    );
    setEditingId(null);
    vibrate(6);
  };

  const deleteNote = () => {
    updateList((items) => items.filter((note) => note.id !== deletingId));
    setDeletingId(null);
    vibrate(8);
  };

  const toggleHidden = (id: string) => {
    updateList((items) =>
      items.map((note) => {
        if (note.id !== id) return note;
        if (note.hidden) {
          const clone = { ...note };
          delete clone.hidden;
          return clone;
        }
        return { ...note, hidden: true };
      })
    );
    vibrate(6);
  };

  const onEscapeKeyDown = (event: KeyboardEvent) => {
    if (!editingId && !deletingId) return;
    event.preventDefault();
    setEditingId(null);
    setDeletingId(null);
  };

  if (!scope) return null;

  const title = t("ui.notesTitle", { container: containerTitle(lang, scope.container) });
  const description = t("ui.notesSub", {
    gap: gapLabel(lang, scope.container, scope.anchor),
  });

  return (
    <DialogShell
      open={scope !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={title}
      description={description}
      className="panel-notes"
      closeLabel={t("ui.closeNotes")}
      onEscapeKeyDown={onEscapeKeyDown}
    >
      <ul className="notes-list" id="notesList">
        {list.map((note) => (
          <li
            key={note.id}
            className={`note-row${editingId === note.id ? " editing" : ""}${deletingId === note.id ? " confirming" : ""}${note.hidden ? " hidden" : ""}`}
          >
            {editingId === note.id ? (
              <>
                <textarea
                  ref={editRef}
                  className="note-edit"
                  maxLength={NOTE_LIMIT}
                  value={editText}
                  aria-label={t("ui.noteEditAria", { text: note.text })}
                  onChange={(event) => setEditText(event.target.value)}
                />
                <div className="note-actions">
                  <button type="button" className="note-text-btn primary-mini" onClick={saveEdit}>
                    {t("ui.noteSave")}
                  </button>
                  <button
                    type="button"
                    className="note-text-btn"
                    onClick={() => setEditingId(null)}
                  >
                    {t("ui.noteCancel")}
                  </button>
                </div>
              </>
            ) : deletingId === note.id ? (
              <>
                <p className="note-text">{note.text}</p>
                <div className="note-actions">
                  <button type="button" className="note-text-btn danger" onClick={deleteNote}>
                    {t("ui.noteDelete")}
                  </button>
                  <button
                    type="button"
                    className="note-text-btn"
                    onClick={() => setDeletingId(null)}
                  >
                    {t("ui.noteCancel")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="note-text">
                  {note.hidden && <span className="note-hidden-badge">{t("ui.noteHidden")}</span>}
                  {note.text}
                </p>
                <div className="note-actions">
                  <button
                    type="button"
                    className="note-icon"
                    aria-pressed={!!note.hidden}
                    title={note.hidden ? t("ui.noteShow") : t("ui.noteHide")}
                    aria-label={
                      note.hidden
                        ? t("ui.noteShowAria", { text: note.text })
                        : t("ui.noteHideAria", { text: note.text })
                    }
                    onClick={() => toggleHidden(note.id)}
                  >
                    <Icon kind={note.hidden ? "eyeOpen" : "eyeClosed"} />
                  </button>
                  <button
                    type="button"
                    className="note-icon"
                    aria-label={t("ui.noteEditAria", { text: note.text })}
                    onClick={() => {
                      setEditingId(note.id);
                      setEditText(note.text);
                      setDeletingId(null);
                    }}
                  >
                    <Icon kind="pencil" />
                  </button>
                  <button
                    type="button"
                    className="note-icon"
                    aria-label={t("ui.noteDeleteAria", { text: note.text })}
                    onClick={() => {
                      setDeletingId(note.id);
                      setEditingId(null);
                    }}
                  >
                    <Icon kind="trash" />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="notes-empty">{t("ui.notesEmpty")}</p>}

      <form
        className="notes-composer"
        onSubmit={(event) => {
          event.preventDefault();
          addNote();
        }}
      >
        <Textarea
          ref={composerRef}
          id="notesInput"
          rows={2}
          maxLength={NOTE_LIMIT}
          value={draft}
          placeholder={t("ui.notePlaceholder")}
          aria-label={t("ui.noteAria")}
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="composer-row">
          <span className="char-count">
            {draft.length}/{NOTE_LIMIT}
          </span>
          <Button type="submit" size="sm" disabled={draft.trim().length === 0}>
            {t("ui.add")}
          </Button>
        </div>
      </form>
    </DialogShell>
  );
};
