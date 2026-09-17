# Songbird project handoff

**Handoff date:** 2026-09-15  
**Original conversation:** [Harmony generator](ghapp://sessions/592e9cd2-3891-433c-9e62-f86453abd416)  
**Initial project directory:** `C:\Songbird`

## Publication authorization: 2026-09-17

The user authorized committing the current Shell and documentation and publishing
them to [Jbluehdorn/Songbird](https://github.com/Jbluehdorn/Songbird) as the initial
`main` branch. Preserve the existing commit history; generated reference artifacts
remain excluded from the current tracked tree. Earlier publication restrictions
below describe the authorization available at those earlier milestones, not a
restriction on this approved initial push.

## Dashboard and repository update: 2026-09-16

The user approved the compact dashboard and both neon light/dark mockups, then
authorized their implementation on the existing Shell foundation. The home
route now shows centered Harmonizer and Chord Finder icon/name/blurb tiles.
Current-song naming remains in the header. Tool stages
and drafts are retained, and learning returns to its dashboard or tool origin.

Appearance follows the browser preference, with lime/cyan accents on bright
light surfaces or charcoal dark surfaces. A manual appearance setting is
deferred. The mockup's forced-theme review links are not application settings.
This work does not add musical capabilities or change the stored song schema.

The module sidebar was subsequently simplified to a dashboard return arrow and
shared song context. A compact, borderless hamburger toggles the narrow desktop
rail or mobile context without modifying the song. Routine saved/saving labels
and repeated local-device/privacy reminders have been removed; autosave,
actionable failures, recovery controls, and read-only warnings remain. Global
tool/learning navigation stays on the dashboard; stage navigation and contextual
links stay inside modules.

Git now tracks Markdown docs, source code/scripts, configuration, and dependency
manifests/lockfiles. Generated readers, decks, slide data/images, archives, and
screenshots are untracked and ignored but retained locally. New clones/worktrees
must rebuild those optional reference outputs. `AGENTS.md` is the maintained
decision log. No remote repository or publication was authorized.

## Implementation update: 2026-09-15

The user approved the architecture proposal and authorized the first Shell
foundation milestone. `apps\web`, `packages\song-core`, and
`packages\local-store` now implement the React/TypeScript/Vite Shell, canonical
schemas and timing helpers, revision-checked commands, Dexie recovery, and a
single-writer browser lease. See `README.md` for commands and package ownership.

The Shell can name/save/reopen one song, navigate tool stages and learning pages,
and expose recovery failures without pretending to have saved. Source blobs and
drafts have persistence contracts, but capture, transcription, musical editors,
generation, sampled playback, full learning activities, and MIDI export remain
unimplemented. Future stages say so explicitly.

480 ticks per quarter was approved as an **engineering convention**, not a
product requirement. The source timing remains separate and the editable grid
remains sixteenths. The three specifications still distinguish full MVP behavior
from proposals and unresolved decisions.

The original handoff below is historical context, not a new instruction to stop
at project setup. No publishing, remote repository, or automation was authorized.

## Why this project exists

The user asked to move from a long workshop chat into a project where multiple agents can work. The available tools could not reassign the original chat itself. The user approved creating a new local Git-backed project at `C:\Songbird`, copying the specifications, kickoff deck, and mockup, and creating a project session with a context handoff.

The original chat and source artifacts remain intact. This is a project setup and handoff, not authorization to begin implementation or publish a repository.

## Product intent

Songbird is for everyday songwriters who want to develop an idea and learn the practical music theory useful in popular songwriting. A user can bring a short voice memo or hum without already knowing the key, tempo, or chords.

The platform helps the user make and hear musical choices rather than promising to generate a finished song from any recording. The Harmonizer is the primary initial build target, with a basic working Chord Finder alongside it.

## Current three-part structure

| Piece | Responsibility |
|---|---|
| Shell | One named current song, local autosave/recovery, navigation, shared state and capability interfaces, and access to learning content. |
| Chord Finder | Audio or starting-key entry, key confirmation, meter/tempo, timed chord structures within eight bars, guitar/piano audition, and shared musical context. |
| Harmonizer | Audio reuse/capture, melody transcription and correction, optional chord-aware generation, editable harmony voices, mute/solo, education, and MIDI export. |

Read the complete requirements in `songbird-specs\shell.md`, `songbird-specs\chord-finder.md`, and `songbird-specs\harmonizer.md`. The shared contract is defined in the Shell spec rather than copied independently into each feature.

## Confirmed direction

- Keep one current song locally auto-saved across refresh or reopening in the same browser. A project library, accounts, and cloud saving are future work.
- Both musical tools use one selected phrase of up to eight bars. Keep longer source recordings intact and let the user select the working section.
- Capture and import do not require a known key, tempo, or chord sequence. Confirm musical context while developing the idea.
- The Chord Finder accepts WAV/MP3 upload or browser recording, or lets the user choose a starting tonic and major/minor form directly.
- Use 4/4, 3/4, or 6/8. Chord editing uses half-bar increments. Melody/harmony editing snaps to a finest grid of sixteenth notes.
- Harmonization must also work from confirmed key/scale without chords. The Chord Finder is an optional handoff, not a generation gate.
- Additional-part layouts are: one below; one above; one above and one below; two above and one below; one above and two below; two above and two below. The maximum is four added voices plus the lead.
- Use one scale/mode selector: major/Ionian, natural minor/Aeolian, harmonic minor, fixed/jazz melodic minor, Dorian, Phrygian, Lydian, Mixolydian, and Locrian. Do not duplicate the major/minor aliases.
- Preserve the lead and protected edits when settings change. Regeneration should provide reversible previews rather than overwrite accepted work silently.
- The current export scope is individual voice MIDI files or a multitrack MIDI with a shared musical origin. Audio-guide export appeared in earlier discussions/deck material but is outside the current MVP spec.
- Educational support should explain the current musical choice, let the user try/compare, and offer optional learning pages. It must not become a forced course or a taste-grading system.
- Optional videos link to existing creators' content. The user has no time/resources to produce original videos. In-app text, audio examples, and activities must still work if a link disappears.

## Latest clarification: ticks

After receiving the specs, the user questioned the 480-tick timing convention. The discussion clarified that 480 ticks per quarter note is a common MIDI/library default, not something derived from Songbird's product requirements.

The actual requirement is a consistent musical timeline across tools and exports. A sixteenth-step internal model with conversion at export is also possible. The exact timing representation should follow the implementation/library decision.

At the original handoff, the v0.1 Markdown still proposed 480 ticks. The later
Shell approval adopted that convention deliberately; see the implementation
update above. Do not elevate it into a mandatory product requirement.

## Existing artifacts and limitations

### Specifications

Three linked editable Markdown documents and their build script are in
`songbird-specs`. Generated HTML readers and the three-document ZIP remain local,
ignored outputs. They cover flows, inputs/outputs, musical timing, recovery,
education, acceptance scenarios, and open decisions.

No specific educational videos were selected.

### Kickoff deck

The source script builds seven slides with editable PowerPoint content, presenter
notes, PDF, and rendered slide images. Existing generated copies are kept locally,
not in Git. Slides 4-5 cover the Harmonizer; slides 6-7 cover the wider chord-tool
vision and the demo minimum.

The deck is broader product-alignment material and predates the latest detailed specifications. The term "Chord Workshop" in the deck refers to the current Chord Finder tool.

### Earlier mockup

The `second-voice-mockup` directory retains source for the local interactive
demo and four SVG screens. Generated artboards, the archived Figma-import ZIP,
and screenshots are local artifacts rather than versioned source. It still uses
the earlier working title "Second Voice."

It demonstrates example notes, drag editing, mute/solo, navigation, and simple synthesis. It does not implement real capture, transcription, harmony generation, or MIDI/audio export. Its original setup-first workflow is superseded by the melody-first direction.

### Research context

Earlier feasibility work considered Spotify Basic Pitch TypeScript for transcription, Tonal for musical utilities, Tone.js for playback, and `@tonejs/midi` for MIDI handling. These are candidates, not an approved application stack.

The market is not empty: the earlier discontinued vielklang product, Band-in-a-Box, Hookpad, and transcription tools overlap parts of the concept. The product hypothesis is a simpler connected songwriting/learning workflow, not a claim that harmony generation is novel.

## Open engineering and content decisions

- Framework, initial package boundaries, and Shell tooling are now resolved as described above. Future engine implementations remain separate work.
- Local versus server transcription, privacy, browser/device support, recording codecs, upload limits, and measured correction effort.
- Exact meter-change remapping and supported tempo ranges. Internal resolution is now the approved 480-tick convention.
- Licensed guitar/piano assets and default playback voicings.
- Chord-quality vocabulary beyond the proposed major/minor triad baseline.
- Exact arrangement-style behavior, voice ranges, musical constraint priorities, and useful evaluation phrases.
- Future storage migrations and broader browser qualification. The first schema, visible quota/error behavior, and single-writer handling are implemented.
- Reviewed educational examples and optional external video selection.

The next implementation planning task should resolve the shared contracts before assigning independent agents to the Shell, Chord Finder, and Harmonizer.

## Handoff completion target

Create one project session that reads this context and the three specs, then stops ready for the user's next task. Do not launch multiple implementation agents, install dependencies, rewrite specifications, or choose a stack as part of the handoff.
