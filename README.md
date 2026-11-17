# Rings Turn Log

**Official app: <https://rings-turn-log.pages.dev/>**

<img src="./screenshot.png" alt="Rings Turn Log running on a phone" width="320">

A featherweight companion for **The Lord of the Rings: The Card Game**, built to
sit next to your playmat without getting in the way.

It keeps the turn and every player's threat in sight, walks you through all the
numbered steps of the seven phases, and takes care of the bookkeeping nobody
enjoys mid-game: the starting-threat reminder, the combat process pop-ups, the
quest progress maths, quick notes between steps and a single bookmark so you
never lose your place — even after the table gets wiped by a troll.

No account, no network, no tracking: one page you install from the browser and
use on the phone propped against the card box, or on a tablet in the middle of
the table. Interface in **Italian and English**, dark gold-on-black theme, and
it works offline.

## Features

- **Turn** and **Threat** (one per player) with `−` / `+` buttons (long-press to
  scroll fast).
- Tap the Threat number to set any value (default 30).
- Tap the player name to rename it, on phones and tablets alike.
- **Multi-player on tablet** (short side ≥ 600 px): up to **4 threat counters**,
  one per player, with custom names (minimum 1, maximum 4). On phones you get a
  single card for player 1.
- **Starting threat reminder**: on first launch and after “New game” the card
  pulses with a gold ring, shows a “!” badge and a “Set the starting threat”
  pill until you set the value (30 is just a default), one per player. Pressing
  NEXT or jumping to another phase counts the current value (30) as confirmed.
- **7-phase tracker** with every numbered rules step (1.1, 1.2, …) and
  **action windows** highlighted in red.
- **Combat processes in pop-ups**: “Resolve Enemy Attacks” and “Player Attacks”,
  opened from steps 6.4a and 6.8a.
- **Quest resolution (3.4)**: the pill under the step opens a pop-up with
  Willpower and Threat (`−`/`+` buttons, direct entry and long-press to repeat
  fast). If
  `Willpower − Threat` is zero or positive it shows the progress (with a
  **Close** button); if negative it raises every player's threat by that
  amount, with a visual effect, and the pop-up closes itself. After use it
  unlocks only with Undo; values reset at the next turn.
- **Single-step bookmark**: the ribbon next to each step marks one point at a
  time; the row is highlighted and a yellow dot appears on the matching phase in
  the stepper (combat processes mark phase 6). “New game” clears it.
- **Notes between steps**: the `＋` in every gap opens that gap's panel; notes
  show inline in purple and can be added, edited and deleted. They survive
  “New game” and are flagged by a purple dot on the stepper.
- **Bilingual IT/EN interface**: the top-right button toggles Italian and
  English (the choice is remembered). Phase names, processes, rules steps,
  history labels and pop-up texts are translated too. The initial language
  follows `?lang=`, then the saved preference, then the browser locale.
- **Phase names in the tablet stepper**: when there is room, buttons 1–7 show
  both the number and the phase name.
- **NEXT** advances the phase; from Refresh it starts the next turn (`Turn +1`,
  `Threat +1` for every player, back to Resource).
- **Threat turns red from 50**.
- **Undo** up to 30 steps: reverts mis-taps, phase changes, advances and even
  the reset.
- **Rotate the UI** with the `↻` button: switches between portrait and
  landscape, handy when the phone is propped up or mounted. The choice is
  remembered.
- **Screen wake lock on/off**: the top badge is a switch; the preference is
  saved.
- **Sounds**: `tap.mp3` on every button, `undo.mp3` when you undo,
  `new-round.mp3` when a new turn starts from Refresh, and `game-over.mp3`
  when a player's threat reaches 50 (once per crossing, also when the increase
  comes from Refresh or from the quest resolution).
- State, phase, bookmark, language, notes and history are stored in
  `localStorage` (key `rings-turn-log/v1`): reopen the app and find the game
  where you left it. Notes survive “New game”. Saves from the app's old name
  (`lotr-lcg-memo/v1`) are read and migrated automatically.
- **Installable, offline-first PWA** (manifest + service worker): works without
  a network after the first load. The version next to the brand also checks for
  updates and shows a gold dot when a new version is ready.

## Run locally

```bash
npm install
npm run dev       # development server with HMR
npm run build     # typecheck + production build in dist/
npm run preview   # serve the production build
npm test          # Vitest unit tests
npm run test:e2e  # Playwright smoke tests (phone, tablet and offline PWA)
```

The dev server is HTTP, so the manifest, service worker and wake lock work as
they do in production.

## Deploy to Cloudflare Pages

1. Connect the repository to Cloudflare Pages.
2. Build command: `npm run build`; output directory: `dist`.
3. Deploy. The PWA manifest, service worker and precache are generated in
   `dist/` by `vite-plugin-pwa`.

All paths are relative, so the same build works at a domain root or in a
subfolder.

## Customization

The React app lives in `src/`; the version stays in `version.js`:

- `version.js`: `self.APP_VERSION` is the single source of truth for the version
  shown in the app. The Vite build copies it to `dist/version.js` and the PWA
  precaches it.
- `src/lib/i18n/dictionaries.ts`: the `it` and `en` dictionaries (phase names,
  processes, rules step texts, UI, history). Step keys are the stable ids used
  by notes and the bookmark.
- `src/lib/constants.ts`: `FASI`, `PROCESSI`, limits and storage keys. For each
  phase the blocks are built with `step("1.1")` and `actionWindow("w-1")`; the
  text comes from the dictionaries via the id.
- `src/lib/game.ts`: `initialState()` (`turno: 1`, `fase: 0`, one player with
  `threat: 30` and `setup: false`, quest resolution at zero), cloning and
  helpers.
- `src/lib/storage.ts`: load/save, migration and sanitisation of the
  `localStorage` document.
- `src/lib/store.ts`: state store, mutations, undo history and persistence.
- `src/lib/types.ts`: persisted and UI types.
- `state.quest`: `{ willpower, threat, applied }` for the quest resolution; it
  is part of the undo snapshots.
- `PLAYER_LIMIT` (4) and `PLAYER_NAME_MAX` (18): maximum number of players and
  name length.
- `HISTORY_LIMIT`: how many undo steps to keep.
- `THREAT_ALERT`: threshold (50) above which the Threat turns red and the
  game-over sound plays once per crossing.
- `THREAT_MAX`: maximum settable Threat (999).
- `NOTE_LIMIT`: maximum length of a note (240 characters).
- `src/hooks/useSfx.ts`: audio files and volumes (`tap` 0.45, `undo` 0.7,
  `round` 0.9, `over` 0.9). The files live in `src/assets/`.

## Players and tablet mode

- Tablet mode turns on by itself when the **short side** of the screen is at
  least **600 px**: it works in portrait, in landscape and with the UI rotated.
  Below that threshold the app is identical to the phone version.
- On tablets up to 4 threat cards appear (plus Turn), in a grid that wraps. The
  `＋` button adds a player (disabled at 4), the `×` removes one (only with at
  least 2).
- Tap the name to open the rename dialog; an empty name falls back to
  “Player N”.
- On phones only player 1 is shown, labelled “Threat · Name” when a name is
  set. The name is editable on phones too: tap the label to open the rename
  dialog.
- Data lives in `state.players`: `[{ id, name, threat, setup }]`. `setup` is
  the starting-threat reminder of each player.
- 1.0.0 saves (single `minaccia` field) are migrated automatically to the first
  player on first launch.

Notes are stored in the same `localStorage` document under `notes`, indexed by
container and gap: `"0::1.3"` = after step 1.3 of the Resource phase, `"0::end"`
= end of phase, `"proc:nemici::6.4.1"` = after 6.4.1 in the enemy attacks
process. Saves from the old format (notes per phase) are migrated automatically
to the end of the phase. Notes are not part of the game state, so “New game”
does not clear them and Undo does not touch them.

## Bookmark

- There is **one bookmark**: tap a step (number or text) or its ribbon on the
  right to mark it; tap the same step again to remove it, or another step to
  move it. The “Open the process” buttons do not trigger it.
- It works for phase steps and for combat process steps (6.4.x and 6.8.x); in
  that case the dot appears on phase 6.
- The marked row gets a gold bar; in the stepper the bookmark is the **yellow**
  dot at the bottom right, while notes stay the **purple** dot at the top
  right.
- It is saved in `state.bookmark` (`{ container, step }`), so it survives
  sessions; “New game” clears it and Undo restores it. Like notes, it does not
  take an undo slot.

## Quest resolution

- Step **3.4** has a **“Calculate progress”** pill that opens the resolution
  pop-up.
- **Willpower** accepts negative values (−999…999), **Threat** stays between 0
  and 999; both can be changed with `−`/`+` or by typing the number. Press and
  hold `−`/`+` to repeat fast, with the same timing as Turn and Threat.
- The result is `Willpower − Threat`:
  - **≥ 0**: shows the progress counter with its own icon (even 0) and, below
    it, the **Close** button;
  - **< 0**: shows “Raise threat by X”. The button raises the threat of **every**
    player by X, with a flash and `+X` on the visible counters, then **closes
    the pop-up itself**.
- After the increase the fields lock and the button stays disabled: the only way
  back is **Undo** (which restores threats and values) or a new
  turn/“New game”. Reopening the pop-up shows “Threat raised by X”.
- Values are saved in `state.quest` and create no history entry until the
  increase is applied.

## Language

- The top-right button shows the active language (`IT` or `EN`) and switches to
  the other one on tap; the choice is saved.
- Order at startup: `?lang=en` parameter (handy for testing), then the saved
  language, then `navigator.languages`, and finally Italian.
- English translations follow the rules terminology; to fix something, edit
  `src/lib/i18n/dictionaries.ts`.
- To add a language you need one entry in `I18N` and one in `I18N_LANG_NAMES`:
  the button includes it in the cycle automatically.

Styling (dark/gold theme) lives in `src/index.css`, CSS variables in `:root`.

## Version, changelog and release cycle

Every release's changes are listed in [`CHANGELOG.md`](./CHANGELOG.md); below are
the rules for keeping it in sync with the version.

### Where the version lives

The version has a single source of truth: **`version.js`**

```js
self.APP_VERSION = "2.0.2";
```

From there the app shows it next to the brand (`Rings Turn Log v2.0.2`); the
build copies the file into `dist/version.js` and the generated service worker
precaches it.

Do not write the version number anywhere else: change `version.js`,
`package.json` and the changelog together.

### Update checks

The same file is the update signal. The version next to the brand is a button:
a gold dot means a newer version is available; tap the version, then tap
`Aggiorna`/`Update` to install it and reload. The game is saved before the
reload, so the current turn, players, notes, bookmark and settings are kept.

Checks are silent on launch, when the app returns to the foreground and every
30 minutes. Tapping the version also checks immediately: the result is a gold
dot for an update, `✓` when up to date, or `!` when offline/the check failed.
The app never reloads on its own.

Apps installed before `2.0.2` do not have this checker, so the first upgrade can
still require closing the app completely and reopening it.

### Version numbers (Semantic Versioning)

- **MAJOR** (`2.0.0`): changes that break existing saves (`localStorage` format,
  notes, history) or radically change how the app is used.
- **MINOR** (`1.1.0`): new backwards-compatible features.
- **PATCH** (`1.3.3`): bug fixes and polish, no new features.

### When to bump the version

Bump it **on every release that changes cached files**: `index.html`,
`src/**`, `manifest.webmanifest`, icons and audio.

The service worker serves those files from the cache: without the bump, a phone
with the app already installed may keep showing the old version.

It is not needed for changes only to `README.md`, `CHANGELOG.md` or
`.nojekyll`, which are not part of the precache.

### Release cycle

1. Finish the changes and test them locally (`npm test`, `npm run test:e2e`,
   `npm run build && npm run preview`).
2. Bump `version.js` with the new number.
3. Add the entry in `CHANGELOG.md` (ISO date, `Added`, `Changed`, `Fixed`,
   `Removed` sections; move any `[Unreleased]` entries there).
4. Commit the changes on the working branch.
5. Open a pull request and merge it into the production branch Cloudflare
   Pages publishes (`master`).
6. On the push to `master`, the **Release tag** workflow
   (`.github/workflows/release-tag.yml`) runs automatically:
   - reads the version from `version.js` and verifies it matches `package.json`;
   - extracts the matching section from `CHANGELOG.md`;
   - creates the annotated tag `vX.Y.Z` if it does not exist;
   - creates the GitHub Release using that changelog section as the notes.
7. You can re-run it manually from **Actions → Release tag → Run workflow**.

The workflow is idempotent: if the tag or the release already exists, it leaves
it alone. Tags are only created for pushes to `master`, never for pull-request
branches. To check: `git show v2.0.2`, the GitHub Releases page, and the version
next to the brand in the app.

If the workflow is temporarily disabled, the manual fallback is:

```bash
git tag -a v2.0.2 -m "v2.0.2"
git push origin v2.0.2
```

Then create the GitHub Release and paste the `[2.0.2]` section from
`CHANGELOG.md`.

Alternatively you can create the tag from the UI:

- **GitHub**: Releases → *Draft a new release* → *Choose a tag* → *Create new tag*;
- **GitLab**: Repository → *Tags* → *New tag*, or Releases → *New release*.

In every case the tag must point **exactly at the commit being published**, and
must be annotated (`-a`) so it keeps author and message.

### Rollback

Never reuse a version number that has already been published: some browsers and
the service worker cache could confuse it with the old one.

To go back:

1. restore the code with `git revert` of the problematic commit (or start again
   from the previous tag with a new commit);
2. bump a **PATCH** (e.g. `1.3.3`);
3. add the entry in `CHANGELOG.md` and repeat the release cycle.

### Quick check

- Brand on top: it must show the version you just released. The previously
  installed version should show the gold update dot after a check.
- DevTools → *Application → Service Workers*: worker active.
- DevTools → *Application → Cache Storage*: Workbox precache for the current
  build; outdated entries are cleaned up on activation.

## Install and offline use

- Serve the app over **HTTPS** (Cloudflare Pages works) or `localhost`: the
  service worker does not work from `file://`.
- On the first load HTML, CSS, JS, icons and audio are cached. From then on the
  app opens and works in airplane mode too.
- Android/Chrome: menu → “Install app” (or the automatic prompt). iOS/Safari:
  Share → “Add to Home Screen”.
- Updates: bump `version.js`; when the app checks and finds the new version, a
  gold dot appears next to the version. Tap it, then confirm to update and
  reload. Fully closing and reopening the app also triggers a check.
- If you change files locally and don't see the changes, bump the version or
  clear the site data.

## Notes on pop-ups and the keyboard

- Pop-ups open **at the top**, no longer centred.
- The overlay height follows the visible area (`visualViewport`): when the
  keyboard opens, the note field and the “Add” button stay above it.
- On short screens (landscape or rotated UI) the panel compacts and never spills
  outside its border; if the content still does not fit, the overlay scrolls.
- The same logic works with the UI rotated 90° (axes swapped).

## Notes on the wake lock

The top-right badge is a **switch**:

- **● Screen on** — lock acquired; a tap turns it off.
- **○ Screen off** — no lock; a tap turns it back on.
- **⚠ Not supported** — the browser does not expose the Screen Wake Lock API.

The preference is saved, so if you turn it off it stays off after a reload; if
it is on, it is reacquired automatically when you come back to the app. The wake
lock is supported by recent Chrome/Edge/Firefox and Safari 16.4+. On iOS you
should **add the app to the Home Screen** and open it from there: in many cases
it is the only way for the lock to work.

## Notes on rotation

- It rotates **the UI only**, not the system screen: the status bar and hardware
  keys stay where they are. It is the only option available from a web page (the
  Screen Orientation API only works in fullscreen on Android and does not exist
  on iOS).
- The button only switches between **portrait (0°) and landscape (90°)**; there
  are no upside-down rotations, which are useless with the phone propped up or
  mounted. Its icon shows the orientation you get by tapping: a landscape screen
  in portrait, a portrait screen when the UI is rotated.
- In landscape the logical width and height swap: the UI compacts to stay fully
  visible.
- The UI has a fixed height in every orientation: the phase stepper and NEXT do
  not move when descriptions or notes change; if the phase content is too tall,
  only that area scrolls. In landscape (logical heights under 480 px) the
  controls compact to stay visible, without making the page scroll.
- The chosen rotation is persisted in `localStorage`.
- UI sizes are computed in pixels from the viewport and realigned after
  fullscreen and orientation changes: on Android the viewport can update late
  and with `vw/dvh` units the rotated fullscreen UI could look “widescreen” with
  squashed phases.

## Notes on audio and fullscreen

- Browsers only allow audio after a user gesture: both the tap and the new-turn
  sound start from a touch, so they play correctly. If you hear nothing, check
  the phone volume and the silent switch.
- Effect volume is set in `src/hooks/useSfx.ts`; you can replace the files in
  `src/assets/` (`tap.mp3`, `undo.mp3`, `new-round.mp3`, `game-over.mp3`). The
  Undo button uses only `undo.mp3`, without the generic tap on top.
- `game-over.mp3` fires once, when a player's threat goes from below 50 to 50 or
  more; staying above the threshold is silent, going back down and crossing it
  again plays it again. Undo never plays it, and neither does reopening the app
  with the threat already high.
- Fullscreen is **disabled**: the language selector takes the place of the old
  `⛶` button. The React app does not expose a fullscreen control; if it is
  reintroduced, apply the Fullscreen API to the page root, not to the rotated
  container, so rotation stays active.

## Structure

```
index.html
version.js
package.json
vite.config.ts
src/
  main.tsx  App.tsx  index.css
  components/app/       layout, counters, phase list, dialogs
  components/ui/        shadcn-style primitives
  hooks/                viewport, wake lock, sounds, long-press, threat alert
  lib/                  storage, game, store, rules constants, i18n, notes
  assets/               icons, images, audio
public/
  manifest.webmanifest  icon.svg  icon-192.png  icon-512.png  _headers
tests/e2e/              Playwright smoke tests
screenshot.png
CHANGELOG.md
README.md
AGENTS.md
CLAUDE.md
.gitignore
.nojekyll
```

UI icons are [Radix Icons](https://www.radix-ui.com/icons) (MIT): only the SVGs
actually used are in `src/assets`, while the full `icons/` folder is excluded by
`.gitignore`.

`AGENTS.md` documents the rules for coding agents (`CLAUDE.md` simply points to
it). The most important one: the app is already released, so the
`localStorage` document is a public contract — old saves must keep loading, and
any change to its format needs backward compatibility or an explicit migration.
