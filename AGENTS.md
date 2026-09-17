# Songbird contributor guidance

## Read before working

Read `PROJECT-CONTEXT.md` and the specification for your assigned feature. The shared entities, timing rules, and capability interfaces are defined once in `songbird-specs\shell.md`.

The three specs are v0.1 planning drafts. Respect their distinctions between required MVP behavior, proposed engineering contracts, open decisions, and future scope.

## Accepted decisions

Keep this log current when the user approves a cross-cutting decision. Record
approval separately from implementation; the specifications remain authoritative
for detailed musical and data contracts.

- **2026-09-15 - Foundation:** one React/TypeScript/Vite browser app, npm
  workspaces, Zustand, Zod, and Dexie. Shared rules belong in `song-core` and
  browser persistence in `local-store`. No backend or account system.
- **2026-09-15 - Timing:** 480 ticks per quarter is the approved implementation
  convention, with a 120-tick sixteenth-note grid and original source seconds
  preserved independently.
- **2026-09-16 - Repository:** track Markdown documentation, source code/scripts,
  dependency manifests/lockfiles, configuration, and this decision log. Generated
  readers, decks, archives, screenshots, build output, dependencies, and local
  credentials do not belong in Git. Keep existing generated artifacts on disk;
  do not delete them or rewrite Git history as part of this cleanup.
- **2026-09-17 - Initial publication:** the user authorized committing the
  current work and publishing it to `https://github.com/Jbluehdorn/Songbird`
  on `main`. Preserve the existing commit history and source-only current tree.
  This does not authorize unrelated publications, pull requests, or automations.
- **2026-09-17 - Active repository scope:** keep only active development and
  deployment code, tooling, tests, specifications, and contributor documentation.
  Remove `second-voice-mockup` and `songbird-kickoff` from Git tracking; preserve
  and ignore any local copies. Neither directory is an application or build
  dependency. The user approved committing and pushing this cleanup to `main`.
- **2026-09-16 - Dashboard:** the approved home screen has compact square
  Harmonizer and Chord Finder tiles with centered icons, names, and short blurbs.
  Use "Add harmony to your melody." and "Find a progression that fits."
  Do not add a visible page title/subtitle, arrows, or "Open workspace" labels.
  Keep current-song identity in the header, with a secondary learning link below
  the grid. Opening a tool restores its stage.
- **2026-09-16 - Song naming:** make the shared header's "Song name" field
  visibly editable without hovering, using a persistent outline and pencil cue.
  Renaming remains inline and auto-saved, without a dialog or extra save button.
  Read-only tabs show a disabled field without the editing cue.
- **2026-09-16 - Module sidebar:** show a back-to-dashboard arrow and shared
  song context, not a repeated directory of tools and learning pages. Desktop
  users can collapse the panel to a narrow rail; mobile keeps the home control
  available when context is folded away. Use a compact, borderless hamburger
  toggle in both layouts, retaining a 44px interaction target. Keep stage
  navigation, contextual help, and musical handoffs inside the workspace.
- **2026-09-16 - Quiet saving:** remove routine saved/saving labels and repeated
  local-device, backup, and no-upload reminders from the workspace. Autosave
  continues unchanged. Keep actionable save failures, recovery controls, and
  read-only warnings visible and accessible.
- **2026-09-16 - Appearance:** implement the approved bright light theme and
  charcoal dark theme, with lime Harmonizer and cyan Chord Finder accents,
  controlled icon/edge glow, readable contrast, and keyboard focus. Follow
  `prefers-color-scheme`, including changes while open. A manual appearance
  setting is deferred; mockup-only theme URL overrides are not application
  settings.
- **2026-09-16 - Scope:** dashboard and themes extend the existing Shell
  foundation. Capture, transcription, musical editors, generation, sampled
  playback, full learning activities, and MIDI export remain separate work.

## Current Shell behavior

`/` opens the dashboard; tool entry links resolve to their saved stages. Returning
home does not edit the song or reset tool state. Refreshing a tool/lesson URL
keeps that route. Learning origin is carried in validated browser-history state,
including through topic navigation and refresh; direct lesson entry falls back
to the saved tool origin. Read-only navigation must work without writing to the
song. These UI changes do not change the version-1 song schema.

Theme colors live in the app's shared CSS tokens, with browser-driven dark
overrides. Keep all surfaces, recovery notices, active controls, and disabled
states readable in both themes; do not copy mockup-only forcing code into the app.

Sidebar collapse is local UI state, not a song edit or a saved preference. The
home arrow and hamburger stay available on the desktop rail. Mobile context is
initially closed and uses the same hamburger treatment beside the home arrow.
Desktop and mobile expansion states are independent and remain local to the
mounted Shell. Shared context contains musical information, not routine storage
reminders.

## Scope and coordination

- Work on the concrete task assigned by the user; do not infer permission to implement the entire application from the presence of the planning documents.
- Use an isolated worktree for independent agent implementation tasks. Avoid concurrent edits or Git mutations in the same checkout.
- Coordinate changes to shared data, timing, capture, analysis, playback, and persistence interfaces before relying on them in separate tools.
- Keep feature-specific logic in its tool or the appropriate shared core; the Shell owns shared state and navigation, not every musical algorithm.
- Preserve user-approved melody-first entry, optional chords for harmonization, one locally auto-saved song, and the shared eight-bar phrase.
- Keep educational help optional, musically accurate, and tied to choices the user can hear and make.

## Important caveats

- Archived prototypes and presentations are historical context, not authoritative specifications or active development inputs.
- 480 ticks per quarter note is the approved initial implementation convention, not a product requirement. Use the shared timing helpers and explicitly configure or convert playback/export units; update all related contracts consistently if that convention changes.
- No measured transcription accuracy, latency, user demand, or finished music-generation capability is established by the current artifacts.
- Do not send source recordings to remote services without a separately agreed processing/privacy design.
- Existing creators' educational videos are optional external links. No original video production, copying, or re-hosting is required.

## Documentation and generated artifacts

Keep the three Markdown specifications cross-linked and consistent. Their ZIP and HTML readers can be refreshed with `songbird-specs\Build-Specs.ps1`.

Generated artifacts are ignored and untracked, not removed from local storage.
New clones and worktrees must generate specification readers before serving
the documentation preview. Source-controlled application assets are allowed; do not use
blanket image or HTML exclusions that would hide future source assets.

The historical prototype and kickoff directories are excluded from the repository.
Local tooling may ignore those directories when retained on disk, but active
application, test, build, and deployment code must not depend on them.

Do not publish, push, create remote repositories, or add automations unless the user asks.
