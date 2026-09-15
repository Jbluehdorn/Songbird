# Songbird project handoff

**Handoff date:** 2026-09-15  
**Original conversation:** [Harmony generator](ghapp://sessions/592e9cd2-3891-433c-9e62-f86453abd416)  
**Initial project directory:** `C:\Songbird`

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

The existing v0.1 Markdown still proposes 480 ticks and labels it as a proposed contract. This transfer preserves those files unchanged. Do not elevate that number into a mandatory product requirement.

## Existing artifacts and limitations

### Specifications

Three linked editable Markdown documents, generated HTML readers, and a three-document ZIP are in `songbird-specs`. They cover flows, inputs/outputs, musical timing, recovery, education, acceptance scenarios, and open decisions.

No specific educational videos were selected.

### Kickoff deck

The current deck has seven slides with editable PowerPoint content, presenter notes, PDF, and rendered slide images. Slides 4-5 cover the Harmonizer; slides 6-7 cover the wider chord-tool vision and the demo minimum.

The deck is broader product-alignment material and predates the latest detailed specifications. The term "Chord Workshop" in the deck refers to the current Chord Finder tool.

### Earlier mockup

The `second-voice-mockup` directory contains four editable SVG screens, a Figma-import ZIP, a local interactive demo, and screenshots. It still uses the earlier working title "Second Voice."

It demonstrates example notes, drag editing, mute/solo, navigation, and simple synthesis. It does not implement real capture, transcription, harmony generation, or MIDI/audio export. Its original setup-first workflow is superseded by the melody-first direction.

### Research context

Earlier feasibility work considered Spotify Basic Pitch TypeScript for transcription, Tonal for musical utilities, Tone.js for playback, and `@tonejs/midi` for MIDI handling. These are candidates, not an approved application stack.

The market is not empty: the earlier discontinued vielklang product, Band-in-a-Box, Hookpad, and transcription tools overlap parts of the concept. The product hypothesis is a simpler connected songwriting/learning workflow, not a claim that harmony generation is novel.

## Open engineering and content decisions

- Application framework, shared-core boundaries, repository/package structure, and tooling.
- Local versus server transcription, privacy, browser/device support, recording codecs, upload limits, and measured correction effort.
- Internal musical timing resolution, exact meter-change remapping, and supported tempo ranges.
- Licensed guitar/piano assets and default playback voicings.
- Chord-quality vocabulary beyond the proposed major/minor triad baseline.
- Exact arrangement-style behavior, voice ranges, musical constraint priorities, and useful evaluation phrases.
- Local storage schema, migrations, quota errors, and concurrent-tab handling.
- Reviewed educational examples and optional external video selection.

The next implementation planning task should resolve the shared contracts before assigning independent agents to the Shell, Chord Finder, and Harmonizer.

## Handoff completion target

Create one project session that reads this context and the three specs, then stops ready for the user's next task. Do not launch multiple implementation agents, install dependencies, rewrite specifications, or choose a stack as part of the handoff.
