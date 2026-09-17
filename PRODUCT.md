# Songbird product context

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users and purpose

Everyday songwriters bring an unfinished melody or a starting key, develop musical
ideas, and learn practical theory while making choices they can hear. Notation,
a known key, tempo, and chords are not prerequisites for bringing an idea.

## Authority and evidence

`PROJECT-CONTEXT.md` records the product handoff. The three documents in
`songbird-specs` remain the canonical requirements; this file is a short UI
context, not a replacement specification. Historical prototypes and presentation
materials are excluded from the active repository and are not implementation
evidence.

## Approved implementation boundary

The first milestone is a browser Shell: one named current song, local recovery,
navigation, shared contracts, and honest integration points. React, TypeScript,
Vite, npm workspaces, Zustand, Zod, and Dexie were approved on 2026-09-15.
Desktop Chrome/Edge are the initial development targets. Broader media support
remains an open decision.

Capture, transcription, editors, generation, sampled playback, audible lesson
activities, and MIDI export are later milestones. There is no backend, account,
cloud saving, remote recording upload, or native wrapper in this milestone.

## Approved dashboard and appearance

The 2026-09-16 mockups define the Shell's visual direction: a compact home grid
of centered square Harmonizer and Chord Finder tiles, each with an icon, name,
and one short blurb. Keep song identity above the grid and learning as a secondary
link. No visible dashboard title/subtitle or repeated open-workspace labels.
Autosave is quiet: omit routine saved/saving labels and repeated storage/privacy
reminders, but retain actionable save failures, recovery, and read-only warnings.

Light mode uses bright surfaces and readable lime/cyan accents with controlled
glow. Dark mode uses charcoal surfaces and neon lime/cyan accents. Appearance
follows the browser preference; a manual setting is deferred. Preserve keyboard
focus, contrast, and reduced-motion behavior across all Shell surfaces.

Modules use a collapsible shared-context sidebar with a dashboard return arrow,
not a repeated list of global pages. Use a compact, borderless hamburger on
desktop and mobile, with an accessible interaction target. The home control stays
available when context is collapsed. Keep stage navigation and contextual links
in the workspace.

Opening a tool restores its stage. Learning returns to the dashboard when opened
there, or the visible tool/stage when opened contextually. The dashboard and
appearance do not change the musical document or require a schema migration.
See `AGENTS.md` for the approved-decision log.

## Product principles

- Preserve authorship, source material, accepted notes, and protected edits.
- Share one current song and one working phrase of up to eight bars.
- Keep chords optional for harmonization and education optional for creation.
- Distinguish drafts, suggestions, accepted work, and unavailable capabilities.
- Surface save failures and actual processing outcomes; never substitute example music.

## Accessibility and inclusion

Use keyboard-operable navigation and controls, visible focus, readable labels,
and text as well as color for state. Help returns to its originating tool without
discarding drafts or starting audio.
