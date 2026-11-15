# AGENTS.md — working on Rings Turn Log

Read this before changing anything that is persisted or affects existing saves.

## LocalStorage is a public contract (critical)

The app is already released (PWA, installable, offline-first): users' games live
in `localStorage`. **Never break an existing save.** Treat the stored document as
a public API you cannot change at will.

- Current key: `rings-turn-log/v1` — `STORAGE_KEY` in `app.js`.
- Legacy key, still read once and migrated automatically: `lotr-lcg-memo/v1` —
  `LEGACY_STORAGE_KEY` in `app.js`.
- Stored document shape:
  ```js
  {
    state,   // { turno, fase, players: [{ id, name, threat, setup }],
             //   bookmark: { container, step } | null,
             //   quest: { willpower, threat, applied } }
    history, // [{ state, label }] undo snapshots (max HISTORY_LIMIT)
    notes,   // { "container::anchor": [{ id, text }, ...] }
    wake,    // boolean
    rotation,// 0 | 90
    lang     // "it" | "en"
  }
  ```
- Where it lives in `app.js`: `load()`, `save()`, `sanitize()`,
  `sanitizeNotes()`, `sanitizeActionLabel()`, `initialState()`, `cloneState()`.

### Rules for any change to persisted data

1. **Keep reading the current key.** Old saves must load unchanged.
2. **New fields are optional.** Give them a default in `initialState()` and a
   fallback in `sanitize()`; never assume a field exists.
3. **Never rename, remove or change the type of a persisted field** without a
   migration that reads the old value first (for example `minaccia` → `players`
   in 1.1.0, or the legacy key rename).
4. **Do not reinterpret existing values.** If semantics change, migrate them
   explicitly.
5. **If compatibility is truly impossible**, bump the storage key (`/v2`), read
   `/v1`, migrate, and write the new key. Keep the old key readable for at least
   one release.
6. **Test with an old save.** Seed `localStorage` with a previous-shaped document
   before the app boots and check that turn, phase, players, threat, notes,
   bookmark, quest and settings are restored.
7. Bumping `version.js` is unrelated to the storage format: a new app version
   must still load the saves written by previous versions.

## Other project notes

- Static PWA: plain HTML/CSS/JS, no build step, no dependencies.
- Service worker is cache-first. Bump `version.js` on every release that changes
  a precached file (`index.html`, `styles.css`, `app.js`, `i18n.js`, icons,
  audio, manifest); README/CHANGELOG are not precached.
- UI texts live in `i18n.js` (`it` and `en`): keep both in sync, and keep the
  stable step keys (notes and bookmarks are anchored to them).
- Icons: [Radix Icons](https://www.radix-ui.com/icons). Only the SVGs actually
  used are in the root (and in the precache); the full `icons/` folder is
  gitignored.
- The layout reacts to `narrow`, `tight-head`, `compact-height`, `very-short`
  and `tablet` classes set by `app.js`; check pop-ups in landscape and with the
  UI rotated.
