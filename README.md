# D&D Grimoire

A single-page, offline-first reference and campaign journal for tabletop D&D groups. Built as a static HTML/CSS/JS app — no build step, no server, no account. Everything is stored locally in the browser via `localStorage`.

Visually and mechanically reskinned from a personal grimoire/journal app ("Book of Shadows"), with its own D&D-specific data model, content hierarchy, and features layered on top.

## Features

### Entry types
- **📓 Chronicle** — session logs, with a tone tag (tense, peaceful, triumphant, grim, heroic, mysterious, comic, chaotic), tags, an emoji quick-insert strip, and pinning.
- **✦ Spell** — school and level pill-grids, casting time/range/components, duration & classes, and a description field.
- **🗺 Lore** — a four-tier world hierarchy (**Realm → Region → Location → Scenario**), where each entry's Parent dropdown only offers entries from the tier directly above it.
- **⚔ Character** — class, race, level, six ability scores, Max HP, and a background/notes field. Saving a Character creates its live sheet (see below).

All entry types support image attachments (file upload, compressed client-side, or a pasted URL).

### Character Sheet (live play state)
Clicking any Character opens its **Character Sheet** instead of the Reader:
- **HP ticker** — +/−/Set controls, independent of the character's Max HP.
- **Inventory** — add items, adjust quantity, remove.
- **Conditions** — add/remove condition pills (Poisoned, Prone, etc.).
- **Notes** — a running notes field, autosaved as you type.
- **Background** — read-only, with highlights and glossary term-links active.

Editing a character's core fields (class, race, ability scores, etc.) through the composer never resets its live HP, inventory, conditions, or notes.

### Highlighter + My Highlights
Select any body of text in the Reader or a Character Sheet to highlight it in one of five colors. Highlights are stored separately from your entries (as pointers, not embedded markup), so they never touch your actual text. The **Highlights** header button opens **My Highlights** — every highlight you've made, newest first, with a snippet of surrounding context, a jump-back link that opens the entry and scrolls to the exact span, and a remove button.

### Dictionary
A bundled glossary of ~33 core D&D terms (Armor Class, Saving Throw, Advantage/Disadvantage, the six abilities, Hit Points, Cantrip, Long/Short Rest, and more). Any of these terms found in your entries is underlined automatically — click one for a definition, plus (for abilities and Hit Points) a live readout pulled from your actual Characters. A **Terms: On/Off** toggle in the Reader lets you turn this off per session. The **Dictionary** header button opens the full glossary as a searchable list.

### DM / Player mode
A header toggle switches the whole app between **Player** and **DM** views:
- Lore entries can carry **DM Secrets**; Characters can carry **DM Notes** — both edited in the composer regardless of current mode, but only ever rendered (in the Reader, the Character Sheet, and search) when the app is in DM mode.
- Switching *into* DM mode asks for a password (set on first use). This is a **friction gate, not real security** — it's there to stop an accidental tap, not to protect anything. If you forget it, "Forgot password?" lets you reset it.
- Highlights are also separated by role — a Player's highlights are private from the DM's and vice versa.

### Realm Export / Import
Built for a DM and players running the app on separate devices:
- **Export Realm** downloads a JSON file of all your entries, with every DM Secret and DM Note stripped out first — so the file is safe to share even though it's plain text.
- **Import Realm** merges an incoming file into your own Grimoire by entry ID. New entries are added; existing entries are updated, but your own device's live character state (HP, inventory, conditions, notes) and any DM fields you've set locally are never overwritten by an import.

### Search
The sidebar search box gives live autosuggest across titles, tags, and body text as you type; the Reader modal offers full search plus type/category filters and sort order.

## File structure

```
dnd-grimoire.html       — markup, all composer forms, all modals
assets/css/main.css     — all styling (dark tabletop theme, one file)
assets/js/main.js       — all application logic (no dependencies)
README.md
LICENSE
.gitignore
```

No build tools, no package manager, no external JS dependencies. The only external resources are Google Fonts (Cinzel, Syne, Outfit, Courier Prime), loaded over HTTPS.

## Running it

Just open `dnd-grimoire.html` in a browser. For GitHub Pages, enable Pages on this repo (Settings → Pages → deploy from the default branch) and it will be served directly — no configuration needed.

## Storage & privacy

Everything lives in the browser's `localStorage`, scoped to whichever origin you open the file from:
- `dnd_grimoire_entries` — all Chronicle/Spell/Lore/Character entries
- `dnd_grimoire_highlights` — highlight pointers (not embedded in entry text)
- `dnd_grimoire_role` — current Player/DM mode for this device
- `dnd_grimoire_dm_pass_hash` — an obfuscated (not encrypted) copy of the DM friction-gate password
- `dnd_grimoire_terms_on` — the Dictionary term-linking toggle state

Nothing is sent anywhere. Clearing browser data for the page (or using a different browser/device) starts a fresh, empty Grimoire — use Export/Import to move data between devices.

## Known limitations

- The DM password gate is intentionally not real security — it's local, reversible, and stored obfuscated rather than hashed/salted. It exists only to prevent an accidental mode switch.
- `localStorage` has a per-origin size limit (typically 5–10MB depending on browser). Large numbers of attached images will hit this first — the app will warn you if a save fails.
- Realm Import matches entries by ID only; if the same entry was independently edited on two devices before syncing, the imported copy wins for all fields except a character's live sheet and DM-only fields.
