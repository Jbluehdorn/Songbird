# Songbird: Chord Finder

**Status:** Draft v0.1 for team planning  
**Updated:** 2026-09-14  
**Related specs:** [Shell and shared contract](shell.md) | [Harmonizer](harmonizer.md)

## 1. Purpose and MVP boundary

The Chord Finder is the place to build and hear a chord progression for the current song. The MVP is a progression builder, not an automatic chord-recommendation engine.

It supports two entry paths: bring a melodic recording and explore its likely key, or choose a starting key directly. The result is a timed progression that other tools can use without re-entry.

Use "Chord Finder" as the tool name, but make the current action clear in the UI: build chords, set their duration, and hear the sequence.

### Scope

| ID | Required behavior |
|---|---|
| CF-01 | Accept WAV/MP3 uploads and browser microphone recording, using the shared capture capability. |
| CF-02 | Reuse an existing song recording and analysis rather than requiring another upload. |
| CF-03 | Offer candidate keys after melody analysis and let the user confirm or override tonic and major/minor quality. |
| CF-04 | Allow a starting-key entry path that skips recording and analysis. |
| CF-05 | Support 4/4, 3/4, and 6/8 with a shared tempo and a phrase of no more than eight bars. |
| CF-06 | Let the user add, change, reorder, remove, and resize chord events in half-bar increments. |
| CF-07 | Play an individual chord or the whole sequence, with guitar or piano sound. |
| CF-08 | Explain tempo, meter, chords, and voicings through optional contextual help and learning pages. |
| CF-09 | Save valid edits into the shared current song and preserve them across navigation and refresh. |
| CF-10 | Provide a clear route back to the Harmonizer with the current musical context intact. |

Future: automatic chord suggestions, advanced substitutions, custom inversions, guitar fingering/voicing exploration, richer instrument arrangements, and independent verse/chorus sections.

The initial editor is one flat phrase. Song structures remain the broader product vision; the MVP does not have a separate multi-section arrangement model.

## 2. Entry paths and user flow

### A. Start with audio

1. Reuse the current recording, choose a WAV/MP3 file, or explicitly start microphone recording.
2. Select the portion of the recording to analyze when needed. The complete source remains available locally.
3. Analyze the selected melody using the shared service and show likely key candidates.
4. Let the user confirm or change the tonic and major/minor quality.
5. Establish timing and select the working section, limited to eight bars.
6. Build and audition chords, then remain in this tool or return to the Harmonizer.

No known key, tempo, or chord sequence is required before importing or recording. The eight-bar musical limit becomes meaningful once timing and alignment are established.

### B. Start with a key

Choose a tonic and starting quality, such as C major or A minor, then move directly to the timing and progression editor. There is no transcription step.

This is the intended meaning of the earlier "root chord" entry point: select the tonic/key, not a rule that the first chord must be that chord. The progression can begin on a different chord.

Choosing a key does not require the app to insert a whole progression automatically. A clearly labeled starter preset can be offered; it must remain editable and must not be presented as a recommendation inferred from a recording.

### C. Arrive from the Harmonizer

Open with the same recording, selected phrase, key choice, and timing already available. Preserve the user's melody-review or builder stage as the return destination.

If the lead is already confirmed, use it for chord audition. If only an analysis draft exists, identify it as a draft and direct the user to melody review when correction is needed.

## 3. Key analysis and confirmation

A short melody can fit several keys. Detection should offer useful candidates, not a single unquestionable verdict.

| Situation | Expected behavior |
|---|---|
| Analysis suggests a key | Show the tonic and major/minor form, allow alternatives, and require user confirmation before treating it as the song's chosen key. |
| The user selects a different key | Keep the source and note pitches unchanged. Update musical context only. |
| Major/minor is changed | Make the full key visible, including the tonic. C minor and A minor are different choices. |
| Analysis is inconclusive | Allow manual selection and continued work; do not invent a high-confidence answer. |
| Analysis fails completely | Preserve the recording and offer retry, another source, or the starting-key path. |

Changing the key is not the same as transposing the melody. The MVP does not silently pitch-shift the recording or rewrite notes when a key is selected.

Key review includes a "What is a key?" link to the shared [learning content](shell.md#8-learning-contract). Help should explain that key is a tonal center and context, not simply the first note or first chord.

## 4. Timing and chord editing

### Shared timing

Use the [canonical timing rules](shell.md#5-timing-rules), including tick units, tempo pulse definitions, and the distinction between 3/4 and 6/8.

The user chooses meter and tempo before committing an arranged timeline. Initial values can be suggested, but they must remain visible and editable. Both tools use the same confirmed values.

A half-bar is the minimum chord duration and the editing increment. In 3/4 it is one and a half quarter-note beats; the UI must not round it to a whole beat.

### Editor behavior

| Operation | Required result |
|---|---|
| Add a chord | Choose a root and supported chord quality; proposed initial duration is one bar and is immediately editable. |
| Change a chord | Update the selected event while retaining its position and duration. |
| Change duration | Use a positive multiple of half a bar, and show the effect on the remaining sequence. |
| Reorder | Move an event with drag and a keyboard-operable alternative; recalculate following positions. |
| Remove | Remove that event and close the gap in the ordered sequence. Offer undo. |
| Exceed the limit | Explain the eight-bar bound and retain the previous valid sequence; do not cut the last chord silently. |
| Undo | Restore the previous chord edit and its effect on sequence timing. |

Proposed MVP layout: contiguous chord events with no separate rest blocks or overlaps. Event starts are derived from the ordered durations. At the half-bar minimum, eight bars contain at most sixteen chord events.

The proposed minimum chord vocabulary is major and minor triads at all twelve roots. Additional sevenths, suspended, or diminished qualities are an [open decision](shell.md#11-open-decisions-and-handoff). Do not accept an unsupported chord label and then silently play a different chord.

For example, with seven and a half bars filled, another half-bar chord fits; a one-bar chord does not.

### Working phrase versus sequence coverage

When no working phrase exists, the chord sequence can establish its initial length. Once there is an active melody/phrase, chord edits must not silently shrink or truncate it.

A chord sequence may temporarily cover less than the active phrase. Show that coverage clearly, for example "Chords cover 4 of 8 bars." To extend beyond the current phrase, ask the user to explicitly extend the shared range, still within eight bars.

Do not silently repeat the progression, hold the last chord through uncovered time, or crop the melody to fit. The user can finish the progression, deliberately change the working phrase, or choose key/scale-only harmonization.

Chord-aware generation requires complete coverage of the working phrase, as defined in [Harmonizer context rules](harmonizer.md#4-key-only-and-chord-aware-context). An empty chord sequence is valid and does not make the whole song invalid.

## 5. Playback and instrument choice

Use the shared transport. Auditioning a new chord or sequence replaces the previous audition rather than creating overlapping independent players.

| Control | Behavior |
|---|---|
| Play selected chord | Play that chord for its configured duration at the current tempo. |
| Play sequence | Play the ordered sequence from its start to its end; show the active chord. |
| Stop | Stop the current audition and release sounding notes. |
| Loop | Repeat the selected sequence range only when the user enables looping. |
| Guitar / Piano | Change the preview instrument, not the saved chord roots, qualities, or durations. |
| Melody audition | Include the current reviewed melody over the same playback range when available. Make an unreviewed draft explicit if it is previewed. |

Provide licensed guitar and piano soundfonts or equivalent sampled instruments. The asset and playback-engine decision is [OPEN-SOUNDS](shell.md#11-open-decisions-and-handoff).

The MVP uses documented default playback voicings. Choosing a guitar sound does not imply a particular playable fingering, and changing instrument sound is not the same as changing voicing.

Original source audio is a reference, not an automatically synchronized backing track after note quantization or tempo changes. Do not play it as if it had been time-stretched to match the edited notes.

## 6. Inputs, outputs, and shared-state effects

Use the entity definitions in the [shared song contract](shell.md#4-shared-song-contract).

### Inputs

| Input | Source | Notes |
|---|---|---|
| Current song | Shell | Includes name, current revision, active phrase, and any existing musical data. |
| Audio source / selection | Shared capture, current song, or file input | Optional when starting from a key. WAV/MP3 uploads and negotiated browser recording formats are supported at the media boundary. |
| Analysis draft | Shared analysis service | Candidate keys and reusable detected notes; not a confirmed lead. |
| Starting or confirmed key | User or existing song | Tonic plus major/minor form, independent of the first chord. |
| Timing and alignment | Shared controls | Required for arranging musical events, not for initial capture. |
| Chord edits | User | Supported root/quality, order, and half-bar duration. |
| Preview instrument | User/current song | Guitar or piano. |

### Outputs

| Output | Consumers | Meaning |
|---|---|---|
| Shared source and analysis draft | Harmonizer, Shell | Reusable input; no second upload or unnecessary re-analysis. |
| Confirmed key | Harmonizer, Shell | User-selected context, separate from the detector's suggestion. |
| Confirmed timing and phrase | Both tools | One shared musical timeline and eight-bar working range. |
| `ChordEvent[]` | Playback, Harmonizer, future tools | Roots/qualities and exact tick positions/durations, not only display strings. |
| Preview instrument preference | Playback | Does not alter harmonic content. |
| Coverage/validation state | Harmonizer, UI | Indicates whether the sequence fully covers the phrase and is valid for chord-aware generation. |

### Concrete output example

This is a contract fragment for a two-bar progression in 4/4 using the proposed 480-tick quarter note.

```json
{
  "phraseLengthTicks": 3840,
  "chords": [
    {
      "id": "chord-1",
      "rootPitchClass": 0,
      "rootSpelling": "C",
      "qualityId": "major",
      "startTick": 0,
      "durationTick": 1920
    },
    {
      "id": "chord-2",
      "rootPitchClass": 9,
      "rootSpelling": "A",
      "qualityId": "minor",
      "startTick": 1920,
      "durationTick": 1920
    }
  ],
  "previewInstrument": "piano"
}
```

Each valid committed edit updates the shared revision and queues local autosave. Chord/key/timing changes mark dependent harmonies for review, without overwriting their note edits. The tools must not copy independent progressions to each other through an export/import handoff.

## 7. Educational experience

Follow the [shared learning contract](shell.md#8-learning-contract). Keep help optional and attached to an action.

### Contextual content

| Location | Learning purpose |
|---|---|
| Key confirmation | Explain tonal center and why more than one key can fit a short melody. |
| Tempo control | Explain pulse and speed; changing tempo does not change the chord names. |
| Meter control | Let the user hear 3/4 and 6/8 accents, not merely read their definitions. |
| Chord inspection | Show the selected chord's notes and explain its quality. |
| Instrument/voicing explanation | Distinguish the notes and their arrangement from the instrument sound playing them. |

### Small optional activity

Let the user build a short progression, change one chord, and compare before/after using the same tempo and melody. Show the selected chord's tones without scoring the user's taste.

A fixed learning example can compare C major and A minor beneath an E melody note: both chords contain E, but the backing changes. Clearly identify it as an example; it is not an automatic chord-suggestion feature.

A separate voicing example may play C-E-G and E-G-C with the same piano sound. This teaches voicing without adding a custom-voicing editor to the MVP.

Optional videos link to existing creators' material under the [shared video policy](shell.md#existing-creator-video-links). No original video production is required.

## 8. States and recovery

| State | User-visible behavior |
|---|---|
| No input | Offer recording/upload, reuse of current audio when available, or starting-key entry. |
| Recording | Show active recording, elapsed time, stop, and cancel. Require an intentional microphone action. |
| Analyzing | Show progress/activity and retain the current song; navigation must not lose the source. |
| Key needs review | Offer candidates and manual selection without claiming certainty. |
| Editing empty sequence | Make adding a first chord clear; preserve any existing melody. |
| Sequence incomplete | Allow editing/audition, show coverage, and explain the chord-aware generation requirement. |
| Invalid duration or unsupported chord | Keep the previous valid data and explain what needs correction. |
| Instrument unavailable | Explain the failed asset load; do not label a different sound as the requested instrument. |
| Save failed | Use the Shell's visible recovery state; do not claim the sequence is safely stored. |

Recording/input limits and supported browser behavior must be agreed under [OPEN-AUDIO](shell.md#11-open-decisions-and-handoff), not silently inferred from the eight-bar editing limit.

## 9. Acceptance scenarios

| ID | Scenario and expected outcome |
|---|---|
| CF-A1 | Choose a starting key: the user reaches the editor without uploading audio. |
| CF-A2 | Import a melody without knowing its key: analysis offers candidates and the user can override them. |
| CF-A3 | Change the confirmed key: the original recording and melody pitches are unchanged. |
| CF-A4 | Add, resize, reorder, and remove chords: tick positions, displayed bars, and playback order agree. |
| CF-A5 | Use half-bar chords in all three meters: durations follow the shared timing contract. |
| CF-A6 | Reach eight bars: a further addition is rejected clearly, without cropping existing music. |
| CF-A7 | Switch guitar/piano: instrument sound changes while chord data and sequence timing remain identical. |
| CF-A8 | Play one chord or the sequence: the requested range plays without stacked transports. |
| CF-A9 | Return from Harmonizer, edit a chord, and go back: the same progression is available and existing harmony edits are retained but marked for review. |
| CF-A10 | Leave the sequence empty or incomplete: the Harmonizer still offers its key/scale-only path. |
| CF-A11 | Refresh after a successful save: valid chord edits and the current stage return. |
| CF-A12 | Open an explanation or external video: progress is not lost and the exercise does not depend on the video remaining available. |

## 10. Implementation handoff

The feature owner depends on the Shell/shared core for media reuse, timing, persistence, and transport. The Harmonizer consumes the chord events directly.

Settle chord-quality vocabulary, preview voicings/assets, tempo limits, and meter-change behavior through the [shared open-decision register](shell.md#11-open-decisions-and-handoff). Do not grow the MVP into a full chord-suggestion or guitar-fingering engine before the progression editor and shared handoff work.
