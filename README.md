# Songbird

A practical songwriting platform: bring a musical idea, develop it into a song, and learn the basic theory behind the choices.

**Current state:** an implemented dashboard Shell with automatic light/dark
appearance and active product/engineering specifications. Musical capture,
analysis, editors, generation, sampled playback, and MIDI export are not
implemented yet.

## Run the Shell

Use Node.js 24 LTS and npm from this checkout:

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. The development server uses a strict port: it fails
instead of silently switching to a different storage origin. Keep the same host
and port to recover the same song. Do not stop another project's server to free
the port.

The home route opens the approved compact Harmonizer and Chord Finder tiles.
Each tile has a centered icon, name, and short blurb, and opens the tool at its
remembered stage. Clicking the Songbird logo or the sidebar's back arrow returns
to the dashboard without resetting either tool. Refreshing a tool or learning
URL keeps that route; reopening the base URL shows the dashboard with the same
saved song.

Inside a module, the sidebar contains only the dashboard return and shared song
context. A compact hamburger toggles the desktop icon rail or mobile context,
while the home control remains visible. Collapse does not edit or save the song.
Stage navigation and contextual help/handoffs remain inside the workspace.

The light and charcoal dark themes share lime/cyan accents and controlled glow.
Appearance follows the browser's `prefers-color-scheme`, including changes while
the app is open. There is no saved theme preference, manual settings control, or
mockup-style theme URL override in the application.

The Shell provides song naming, tool/stage navigation, learning return links,
versioned local recovery, visible save failures, and a single editing tab. Learning
opened from the dashboard returns there; contextual help returns to the visible
tool/stage, including in read-only tabs. Other tabs can retry editing after the
writer closes. Capture/import buttons and the musical stages remain explicitly
unavailable.

Autosave runs quietly without routine saved/saving labels or repeated local-device
and privacy reminders. Save failures, recovery actions, and read-only warnings
remain visible when relevant.

IndexedDB holds the current song, drafts, and separate source blobs. Storage
errors retain in-memory work; recovery JSON downloads do **not** include audio
and are not a complete backup. Unsupported or corrupt schemas are never replaced
with a new empty song. There is no recording upload or application backend.

## Approved project structure

| Workspace / path | Responsibility |
|---|---|
| `apps\web\src\app` | Bootstrap, routing, and composition |
| `apps\web\src\shell` | Tool dashboard, song identity, navigation, shared context, and recovery UI |
| `apps\web\src\application` | Commit coordination, save queue, and editing lease |
| `apps\web\src\features` | Chord Finder, Harmonizer, and learning route areas |
| `apps\web\src\components` / `styles` | Shared accessible UI and CSS Modules |
| `packages\song-core` | Pure TypeScript schemas, timing, revisions, commands, and capability contracts |
| `packages\local-store` | Dexie/IndexedDB transactions and schema recovery boundary |
| `tests\e2e` / `tests\fixtures` | Browser journeys and explicitly synthetic fixtures |

Later capabilities will become `packages\audio-engine`, `melody-analysis`,
`harmony-engine`, and `midi-export`; these packages have not been created as
empty placeholders. The Shell owns coordination, not every musical algorithm.

React, React Router, Zustand, Zod, and Dexie are runtime dependencies. Vite and
TypeScript build the app. ESLint, Prettier, Vitest, Testing Library,
fake-indexeddb, Playwright, and axe support development. Exact resolved versions
are in `package-lock.json`; no monorepo build orchestrator is required.

Tone and focused Tonal modules are later playback/theory dependencies.
`@spotify/basic-pitch` remains a local-inference candidate pending a
browser/backend and quality spike. Licensed instrument assets still need
selection. For MIDI, prefer an adapter over `midi-file`: the reviewed
`@tonejs/midi` 2.0.28 encoder does not directly preserve the required common
end-of-track endpoint and compound-meter metronome metadata.

```powershell
npm run typecheck
npm run lint
npm run format:check
npm test
npm run test:e2e
npm run build
```

If Playwright reports a missing browser, install its development Chromium binary
with `npx playwright install chromium`. Browser journeys use an isolated local
server on port 54173 and separate browser storage. `npm run preview` serves the
production build on port 4173; it is a different storage origin. A deployed
static host must provide an SPA fallback for tool and learning routes.

## Start here

| File | Purpose |
|---|---|
| `PROJECT-CONTEXT.md` | Handoff from the original workshop conversation, including the latest decisions and evidence limits. |
| `AGENTS.md` | Contributor guidance and the log of user-approved decisions. |
| `songbird-specs\shell.md` | Shell responsibilities and the canonical shared song/data contract. |
| `songbird-specs\chord-finder.md` | Chord Finder MVP flows, editing, playback, education, and inputs/outputs. |
| `songbird-specs\harmonizer.md` | Melody review, harmony generation, editing, education, and MIDI export. |
| `songbird-specs\Build-Specs.ps1` | Source script for local HTML readers and a shareable specification ZIP. |

Git tracks active application and shared-package source, tests, development and
deployment configuration, dependency lockfiles, specifications, and contributor
documentation. Generated readers, archives, screenshots, and build/test output
are ignored.

The historical `second-voice-mockup` and `songbird-kickoff` directories are not
part of the active development or deployment tree. Any existing local copies
are retained and ignored; they are not included in new clones. Removing them
from the current tree does not rewrite repository history.

The original workshop history remains in the [Harmony generator chat](ghapp://sessions/592e9cd2-3891-433c-9e62-f86453abd416). `PROJECT-CONTEXT.md` retains the relevant handoff and decisions.

## Optional specification reader

Generate the specification reader and ZIP from the Markdown, then start the
documentation server from the root of this checkout:

```powershell
& '.\songbird-specs\Build-Specs.ps1'
node '.\songbird-specs\serve.mjs'
```

The server prints its loopback URL. It is separate from the application server.
New clones do not include the generated outputs; rerun the build script after
editing the specifications. The renderer uses PowerShell's `ConvertFrom-Markdown`.

## Working in parallel

This is a local Git-backed project so separate agent sessions can use isolated worktrees. Begin with the shared contract before assigning implementation of the Shell, Chord Finder, and Harmonizer.

The architecture and first Shell milestone were approved on 2026-09-15. The
shared internal convention is 480 ticks per quarter, with sixteenth-note editing
at 120 ticks and separately retained source seconds. Meter remapping, practical
tempo/media limits, sounds, and musical algorithms remain open before their
respective feature slices.

The compact dashboard, automatic neon light/dark themes, and source-only Git
policy were approved on 2026-09-16. `AGENTS.md` records those decisions.

The development repository is [Jbluehdorn/Songbird](https://github.com/Jbluehdorn/Songbird).
Independent implementation work still needs explicit assignment and isolated
worktrees; it does not follow automatically from the package plan.
