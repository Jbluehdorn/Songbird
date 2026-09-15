# Songbird: Shell and shared song contract

**Status:** Draft v0.1 for team planning  
**Updated:** 2026-09-14  
**Related specs:** [Chord Finder](chord-finder.md) | [Harmonizer](harmonizer.md)

## 1. Purpose and ownership

Songbird helps everyday songwriters develop musical ideas and learn the practical theory behind their choices. The Shell connects the tools around one current song. It is not a separate music generator.

The Shell owns project identity, navigation, shared song state, local recovery, and access to learning content. The two musical tools read and update that shared state rather than maintaining competing copies.

The [Chord Finder](chord-finder.md) builds the backing progression. The [Harmonizer](harmonizer.md) turns a reviewed melody into editable additional parts, with or without a chord progression.

### Requirement status

| Label | Meaning |
|---|---|
| Required | Part of the agreed MVP behavior. |
| Proposed contract | A concrete engineering baseline for contributors to review together. Changes must be reflected in all three specs. |
| Open decision | Not yet settled. Do not present the choice as agreed or an implemented capability. |
| Future | Explicitly outside the MVP. |

These documents specify intended behavior. They do not claim the current mockup implements it, or that transcription quality or performance has been established.

## 2. MVP scope

| ID | Required behavior |
|---|---|
| SH-01 | Maintain one current song with an editable project name. |
| SH-02 | Auto-save that current song locally and restore it after a refresh or reopening the app in the same browser. |
| SH-03 | Provide navigation to Chord Finder, Harmonizer, and learning content without losing work. |
| SH-04 | Let either musical tool be the starting point. Importing or recording an idea must not require a known key, chords, or tempo. |
| SH-05 | Share one selected working phrase of up to eight bars between both tools. Retain longer source audio while the user selects the section to use. |
| SH-06 | Make media capture, analysis, musical timing, and playback reusable capabilities instead of separate implementations in each tool. |
| SH-07 | Preserve user work across musical-context changes and asynchronous processing. |
| SH-08 | Keep educational help optional, contextual, and usable without an external video. |

Future: accounts, cloud saving, a library of projects, multiple independent song sections, collaboration, full-song arranging, a full DAW, and native/plugin packaging.

Local autosave is recovery for one song, not cloud backup. Clearing browser storage, changing devices, or some private-browsing behavior can remove access to it.

## 3. User experience

### First visit

Create an empty current song using an "Untitled song" display name. Let the user rename it and choose either tool. A blank name should retain an understandable untitled display state, not prevent music creation.

The user can start with audio in either tool, or with a starting key in the Chord Finder. Timing is established when arranging or aligning the melody, not as a gate before capture.

### Moving between tools

Returning to a tool restores its current stage and unfinished edits. The Harmonizer's "Build chords" action opens the Chord Finder with the current song and provides a return path to the melody or builder stage.

An uploaded recording, selected phrase, confirmed key, and timing choices should not have to be entered twice. Unreviewed analysis remains visibly unreviewed when another tool uses it.

Learning pages retain the originating tool and stage. Returning from help must not reset the project or restart playback unexpectedly.

### Replacing the current song

There is no project library in the MVP. If a start-over action is provided, it replaces the current song only after clear confirmation. Replacing a recording within the same song is a separate action, governed by the change rules below.

## 4. Shared song contract

This section is the canonical cross-tool contract. Its field names describe concepts, not a required framework or exact implementation API.

### Shared entities

| Entity | Required information and rules |
|---|---|
| `SongProject` | Stable ID, schema version, current revision, display name, last successfully saved revision, and references to the shared entities below. |
| `SourceAudio` | Stable source ID, locally stored audio/blob reference, original filename when applicable, media type, duration, and capture/import origin. Do not infer the actual format only from the filename. |
| `SourceSelection` | Start and end in source seconds. The original source remains intact; selecting a phrase is not destructive cropping. |
| `AnalysisDraft` | Source/selection revision, detected notes in source seconds, candidate keys, and review flags. Candidate output is not an approved melody. |
| `ConfirmedKey` | Tonic pitch class and display spelling, plus starting key quality: major or natural minor. Detection candidates are stored separately from the user's choice. |
| `Timing` | Time-signature numerator/denominator, displayed tempo and pulse unit, normalized quarter-note tempo, and confirmation status. |
| `PhraseAlignment` | Mapping between source seconds and the musical timeline, including the source-time position assigned to musical tick zero. |
| `WorkingPhrase` | Musical length, constrained to no more than eight bars under the confirmed meter. Proposed length increments are half a bar. |
| `LeadMelody` | Stable note events on the musical grid, review/confirmation status, and the source/alignment revision from which they were derived. |
| `ChordSequence` | Ordered chord events with roots, qualities, spellings, start positions, and durations. An empty sequence is valid. |
| `HarmonySettings` | Scale/mode, arrangement style, part layout, voice ranges, and whether this arrangement uses chords or only key/scale context. |
| `HarmonyArrangement` | Separate generated/edited voices, protected notes, settings/input revisions, explanatory metadata, and current/stale status. |
| `MixState` | Mute/solo state for chord accompaniment, the lead, and each harmony voice; preview instrument selection. |
| `WorkspaceState` | Last tool/stage, recoverable editing drafts, and optional help-display preferences. Do not mix lesson fixtures into the current song. |

The selected harmony scale can differ from the starting key's major/minor form. Store that choice as harmony configuration, not as a silent rewrite of the detected melody key or chord progression.

### Musical event types

| Type | Proposed fields |
|---|---|
| `DetectedNote` | `id`, `pitchMidi`, `startSeconds`, `durationSeconds`, optional amplitude, optional model-provided confidence, and review flags. |
| `NoteEvent` | `id`, `pitchMidi`, `startTick`, `durationTick`, `velocity`, `origin`, optional `sourceNoteId`, and a protection flag for harmony edits. |
| `ChordEvent` | `id`, `rootPitchClass`, `rootSpelling`, `qualityId`, `startTick`, `durationTick`. |
| `HarmonyVoice` | Stable voice ID, role such as `above-1` or `below-2`, note events, range, and links to explanatory facts. |

MIDI pitches are integers from 0 through 127. Proposed MIDI velocities are integers from 1 through 127; rests are gaps, not zero-velocity visible notes.

Editable notes have nonnegative starts and positive durations. The approved lead and each individual harmony voice are monophonic. Ambiguous overlaps or quantization collisions require correction; do not silently discard one of the notes.

Confidence is optional. Do not invent percentages or treat note amplitude as a calibrated measure of transcription confidence.

## 5. Timing rules

### Proposed timing representation

Use integer musical ticks with **480 ticks per quarter note**. A sixteenth note is **120 ticks**. Preserve source timings in seconds separately.

| Meter | Ticks per bar | Sixteenth-note positions per bar | Half-bar duration | Displayed tempo pulse |
|---|---:|---:|---:|---|
| 4/4 | 1920 | 16 | 960 ticks | Quarter note |
| 3/4 | 1440 | 12 | 720 ticks | Quarter note |
| 6/8 | 1440 | 12 | 720 ticks | Dotted quarter note |

In 6/8, there are normally two dotted-quarter pulses per bar. For example, a display of 80 dotted-quarter pulses per minute corresponds to 120 quarter notes per minute in a MIDI tempo event. Exporters and audio scheduling must use the normalized value.

3/4 and 6/8 have the same notated bar duration at an equal quarter-note tempo, but different beat grouping. The metronome, grid accents, tempo labels, and learning examples must reflect that difference.

### Alignment and editing

Record or import first. Before confirming an editable musical timeline, establish meter, tempo, and phrase alignment. Both tools must have access to these shared controls.

The user can shift the whole detected phrase to place it on the grid. Tempo alone does not identify beat one. Preserve leading rests where intended. Notes that would fall before tick zero need explicit realignment or a revised phrase selection, not silent deletion.

The finest editable grid is a sixteenth note. Snap note starts and ends to that grid, with a minimum positive duration of one grid step. Keep pre-quantization data for recovery. True triplets in simple meter, swing microtiming, and unrestricted rubato are outside this initial grid contract.

Chord boundaries and durations use half-bar increments under the current meter. A sequence may be shorter than the working phrase while being edited. In chord-aware harmony mode it must cover the working phrase; see [Harmonizer context rules](harmonizer.md#4-key-only-and-chord-aware-context).

### Changes after arranging

| Change | Required handling |
|---|---|
| Tempo | Keep musical event positions unchanged and change scheduled playback speed. Original audio is not automatically time-stretched to match. |
| Meter | Preview/review the impact on bar boundaries, half-bar chord durations, and the eight-bar limit before committing a valid replacement layout. Never silently truncate or overwrite notes. The exact remapping policy is an open decision. |
| Phrase selection or length | Show affected material before applying. Retain source audio and provide a way back from the edit. |
| Confirmed key | Preserve note pitches and chord names. Mark dependent harmonies for review/regeneration. |
| Harmony scale/mode | Create a reversible harmony preview; do not modify the lead or chord sequence. |

## 6. Shared capability interfaces

The Shell document owns these interface definitions, not necessarily their implementation. Capture, analysis, playback, and musical logic can live in a shared core used by both tools.

| Capability | Inputs | Outputs / guarantees |
|---|---|---|
| Capture/import | User-selected file or an explicit microphone action | A local source reference or a visible error. Accept WAV/MP3 uploads; negotiate supported browser recording formats internally. |
| Analyze melody | Source reference and selected source-time window | Detected note draft, candidate keys, and review flags, tagged with the input revision. No automatic replacement of confirmed music. |
| Align and quantize | Detected notes, timing, source alignment, and working phrase | An editable note draft plus any collisions, out-of-bounds events, or corrections needing review. |
| Schedule playback | Musical events, timing, instrument, mix, and loop range | One coordinated transport. Starting another audition stops or replaces the previous audition rather than stacking independent players. |
| Commit project edit | Current revision and a validated change | New shared revision, dependency status updates, and a queued local save. |
| Preview harmony | Confirmed lead, musical context, settings, and protected notes | A candidate arrangement or an explicit diagnostic. The current arrangement remains available. |
| Export MIDI | Explicitly selected voices and shared timing/origin | Aligned MIDI files; playback mute/solo is not an export-selection rule. |

Audio capture does not imply permission to send audio to a server. No remote audio transmission is assumed by this spec. Processing location remains an engineering decision; any server-based path needs an explicit privacy design and corresponding user-facing disclosure.

## 7. State, persistence, and recovery

### Local saving

Persist source references/blobs, selections, confirmed music, recoverable drafts, settings, and the current tool/stage. A blob-capable local store such as IndexedDB is the proposed approach; do not put encoded recordings into small string-only storage.

Show saving, saved, and save-failed states. "Saved" means the current revision has actually been committed to local storage. If saving fails, retain the in-memory work, explain that recovery after closing is unavailable, and keep relevant exports accessible.

Refresh restores the latest saved work, including an unconfirmed melody draft. A processing job that cannot resume must be shown as interrupted/retryable, not falsely complete. Unlimited undo history across browser restarts is not an MVP promise.

### Processing and invalidation

| Situation | Required result |
|---|---|
| A new recording is captured | Keep the existing confirmed melody until the replacement draft is accepted. |
| Analysis finishes after its source or selection changed | Ignore the stale result and retain the newer work. |
| A source is unavailable or undecodable | Show the failure and offer another file or recording; do not substitute sample music as if analysis succeeded. |
| A confirmed melody or chord sequence changes | Keep existing harmonies but mark them stale. Do not silently regenerate over edits. |
| A scale/style/layout preview is rejected | Keep the current arrangement and protected edits unchanged. |
| A layout removes a manually edited voice | Make the removal explicit before applying; preserve a rollback route. |
| A generated result cannot satisfy hard constraints | Explain the constraint and possible changes. Do not silently return fewer parts or transpose the lead. |

For the initial demo, assume one active editing tab. The team must choose how to detect and warn about concurrent tabs before broader use.

## 8. Learning contract

Education is part of making a musical choice, not an admission test. A user can complete the creative workflow without opening a lesson.

### Three layers

| Layer | Required pattern |
|---|---|
| Contextual explanation | A short, optional explanation attached to the selected chord, note, or setting. Use the user's current musical context when it exists. |
| Try and compare | A small optional activity using playback and editing, with a reversible comparison. Do not grade musical taste as right/wrong. |
| Learning page | Plain-language explanation, an audible example, one action to try, and a return link to the originating tool/stage. |

### Initial learning topics

| Topic ID / proposed route | Content | Primary entry points |
|---|---|---|
| `keys` / `/learn/keys` | Tonal center, scale versus key, ambiguity in short melodies, and choosing a key by listening | Key review in either tool |
| `rhythm` / `/learn/rhythm` | Tempo, pulse, 4/4 versus 3/4 versus 6/8, bars, subdivisions, and quantization | Timing controls and melody alignment |
| `chords` / `/learn/chords-and-voicings` | Chord tones, chord quality, duration, voicing versus instrument sound | Chord Finder |
| `harmony` / `/learn/harmony` | Intervals, additional voices, chord/non-chord tones, and intentional tension | Harmony builder and note inspection |
| `scales` / `/learn/scales-and-modes` | Major/minor, the standard modes, harmonic minor, fixed/jazz melodic minor, and comparisons | Scale/mode selector |

A non-chord tone is a general category; a passing tone is one particular kind. When no chord progression is supplied, explanations must use intervals and scale degrees rather than inventing an implied backing chord.

Explanations about generated notes must be based on structured musical facts from the arrangement, not an invented after-the-fact justification. Rich harmonic interpretation is optional; accurate simple facts are sufficient for MVP.

Lesson audio uses isolated examples or a reversible preview. It must not overwrite the current song, and it must not play over a second song transport. Recorded educational videos are not required.

### Existing-creator video links

Videos are optional links to existing material from other creators, not a requirement to produce Songbird videos. Attribute the creator, label the destination as external, and prefer captioned material. Do not copy or re-host the videos.

The written explanation, audio example, and exercise must stand on their own. Curate and recheck links during content review; remove or replace known dead links. The MVP does not need a YouTube account/API integration, embedded player, or automated link-monitoring service.

No specific videos are selected by these specs.

## 9. Accessibility and trust

All navigation, note/chord editing, playback controls, and mute/solo actions need keyboard-operable equivalents and understandable labels. Notes cannot depend only on color to communicate voice, selection, or musical role.

Microphone denial, decoding failures, interrupted analysis, unavailable instrument assets, and local save failures must have visible recovery paths. The app must not quietly fall back to demo content or claim an action completed when it did not.

Learning links and external videos must not discard a draft. Audio starts through an intentional user action.

## 10. Acceptance scenarios

| ID | Scenario and expected outcome |
|---|---|
| SH-A1 | Start in either tool, rename the song, navigate away and back: the name and work remain. |
| SH-A2 | Refresh after a successful save: source, selected phrase, melody/chords/parts, settings, and stage are restored. |
| SH-A3 | Capture in Chord Finder, then open Harmonizer: the same source and analysis draft are available without re-uploading. |
| SH-A4 | Skip chords in Harmonizer: timing and key can be confirmed and key/scale-only generation remains available. |
| SH-A5 | Select part of a longer recording: both tools use the same phrase of no more than eight bars; the original recording remains available. |
| SH-A6 | Replace audio while analysis is running: the old result cannot overwrite the new selection. |
| SH-A7 | Change a chord after editing a harmony: the harmony is marked stale but the edit is retained. |
| SH-A8 | Compare 3/4 and 6/8: subdivisions, beat accents, tempo labels, and exported timing agree with the timing table. |
| SH-A9 | Open a lesson or an unavailable external video and return: the song remains usable and unchanged. |
| SH-A10 | Local storage fails: the UI does not show "Saved"; in-memory work and an explicit recovery explanation remain. |

## 11. Open decisions and handoff

| ID | Decision | Proposed owner |
|---|---|---|
| OPEN-AUDIO | Local versus server inference, supported browser/device matrix, recording codecs, maximum upload bytes, and maximum source duration | Audio and platform contributors |
| OPEN-SOUNDS | Licensed guitar/piano soundfont or sample assets, loading strategy, and default playback voicings | Audio contributor |
| OPEN-RHYTHM | Exact meter-change remapping policy and practical tempo limits | Shared-core and musical-logic contributors |
| OPEN-CHORDS | Chord quality vocabulary beyond the proposed major/minor triad baseline | Chord Finder and musical-logic contributors |
| OPEN-HARMONY | Exact style behavior, voice-range defaults, and constraint priorities | Harmonizer and musical-logic contributors |
| OPEN-STORAGE | Storage schema/migrations, quota behavior, and concurrent-tab protection | Shell contributor |
| OPEN-LEARNING | Review the original explanations/examples and curate optional existing-creator video links | Product/learning-content contributor |

Agree the shared data and timing contract before implementing separate screens. Use the two tool specs for feature-specific behavior. Keep changes to shared fields and dependency rules synchronized across all three documents.
