# Songbird

A practical songwriting platform: bring a musical idea, develop it into a song, and learn the basic theory behind the choices.

**Current state:** planning specifications, a seven-slide kickoff deck, and an illustrative interactive mockup. There is no production application yet.

## Start here

| File | Purpose |
|---|---|
| `PROJECT-CONTEXT.md` | Handoff from the original workshop conversation, including the latest decisions and evidence limits. |
| `AGENTS.md` | Guidance for contributors and agents working in this project. |
| `songbird-specs\shell.md` | Shell responsibilities and the canonical shared song/data contract. |
| `songbird-specs\chord-finder.md` | Chord Finder MVP flows, editing, playback, education, and inputs/outputs. |
| `songbird-specs\harmonizer.md` | Melody review, harmony generation, editing, education, and MIDI export. |
| `songbird-specs\Songbird-Specifications.zip` | All three Markdown specifications packaged for sharing. |
| `songbird-kickoff\Songbird-Team-Kickoff.pptx` | Editable kickoff deck with presenter notes. |
| `songbird-kickoff\Songbird-Team-Kickoff.pdf` | Shareable kickoff deck. |
| `second-voice-mockup\` | Earlier UI exploration under the old working name; not the current product specification. |

The Markdown, PowerPoint, PDF, and SVG files are persistent local files. They do not require the temporary preview servers to remain running.

The original workshop history remains in the [Harmony generator chat](ghapp://sessions/592e9cd2-3891-433c-9e62-f86453abd416). This project carries its files and an explicit context handoff; the chat itself was not moved or deleted.

## Optional local previews

Run the relevant command from the root of this checkout. Each server prints its own loopback URL; old port numbers are not permanent.

```powershell
node '.\songbird-specs\serve.mjs'
node '.\songbird-kickoff\serve.mjs'
node '.\second-voice-mockup\server.mjs'
```

Use a separate terminal or session for each preview you want to leave running. These commands do not start the planned Songbird application.

To refresh the specification reader and ZIP after editing the Markdown:

```powershell
& '.\songbird-specs\Build-Specs.ps1'
```

The specification renderer uses PowerShell's `ConvertFrom-Markdown`. Rebuilding the presentation requires installed Windows PowerPoint:

```powershell
& '.\songbird-kickoff\Build-SongbirdDeck.ps1'
```

## Working in parallel

This is a local Git-backed project so separate agent sessions can use isolated worktrees. Begin with the shared contract before assigning implementation of the Shell, Chord Finder, and Harmonizer.

No framework or runtime architecture has been selected. No remote repository has been configured, and nothing has been published. Starting implementation agents is a separate next task, not something this project initialization performs.
