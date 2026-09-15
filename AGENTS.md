# Songbird contributor guidance

## Read before working

Read `PROJECT-CONTEXT.md` and the specification for your assigned feature. The shared entities, timing rules, and capability interfaces are defined once in `songbird-specs\shell.md`.

The three specs are v0.1 planning drafts. Respect their distinctions between required MVP behavior, proposed engineering contracts, open decisions, and future scope.

## Scope and coordination

- Work on the concrete task assigned by the user; do not infer permission to implement the entire application from the presence of the planning documents.
- Use an isolated worktree for independent agent implementation tasks. Avoid concurrent edits or Git mutations in the same checkout.
- Coordinate changes to shared data, timing, capture, analysis, playback, and persistence interfaces before relying on them in separate tools.
- Keep feature-specific logic in its tool or the appropriate shared core; the Shell owns shared state and navigation, not every musical algorithm.
- Preserve user-approved melody-first entry, optional chords for harmonization, one locally auto-saved song, and the shared eight-bar phrase.
- Keep educational help optional, musically accurate, and tied to choices the user can hear and make.

## Important caveats

- `second-voice-mockup` is an earlier interaction prototype. Its branding, setup-first flow, and example playback are not the authoritative specification.
- The kickoff deck calls the chord tool "Chord Workshop"; the current specifications call it "Chord Finder."
- 480 ticks per quarter note is a proposed implementation convention, not a product requirement. Select the internal timing representation deliberately with the chosen playback/export libraries, then update all related contracts consistently.
- No measured transcription accuracy, latency, user demand, or finished music-generation capability is established by the current artifacts.
- Do not send source recordings to remote services without a separately agreed processing/privacy design.
- Existing creators' educational videos are optional external links. No original video production, copying, or re-hosting is required.

## Documentation and generated artifacts

Keep the three Markdown specifications cross-linked and consistent. Their ZIP and HTML readers can be refreshed with `songbird-specs\Build-Specs.ps1`.

Use the existing source scripts for changes to the presentation or mockup, and distinguish generated examples from implemented functionality. Do not change the old mockup or deck merely to match a new implementation task unless it is within that task's scope.

Do not publish, push, create remote repositories, or add automations unless the user asks.
