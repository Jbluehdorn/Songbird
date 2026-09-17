# Songbird: Harmonizer

**Status:** Draft v0.1 for team planning  
**Updated:** 2026-09-16  
**Related specs:** [Shell and shared contract](shell.md) | [Chord Finder](chord-finder.md)

## 1. Purpose and MVP boundary

The Harmonizer helps a songwriter turn a reviewed lead melody into additional parts they can hear, edit, understand, and take into a recording workflow.

The input is one clean melodic line. The output is the original lead plus up to four added harmony voices. The songwriter remains in control of the notes; this is not synthesized singing or automatic full-song composition.

### Scope

| ID | Required behavior |
|---|---|
| HZ-01 | Reuse the current melody/audio or accept WAV/MP3 upload and browser recording through shared capture. |
| HZ-02 | Transcribe the line into an editable note draft, preserving the source and pre-quantization data. |
| HZ-03 | Support key confirmation/override and musical alignment, with a finest grid of sixteenth notes. |
| HZ-04 | Offer a Chord Finder handoff but also allow generation from key/scale alone. |
| HZ-05 | Generate using the selected scale/mode, arrangement style, and one of the six specified part layouts. |
| HZ-06 | Let the user edit separate harmony voices and preserve protected edits during regeneration. |
| HZ-07 | Provide mute/solo for chord accompaniment, the original melody, and each harmony voice. |
| HZ-08 | Provide optional explanations and learning activities based on the actual musical context. |
| HZ-09 | Export individual voice MIDI files or one multitrack MIDI containing the melody/harmony voices. |
| HZ-10 | Save current work through the Shell, including recoverable review drafts and accepted arrangements. |

Future: live harmonization, separating a melody from a mixed recording, independent counterpoint rhythms, generated sung vocals, WAV/audio-guide export, full score engraving, unrestricted timing, and DAW plugin integration.

The working phrase is the same shared range of up to eight bars used by the Chord Finder.

**Implementation status:** the Shell now provides stage navigation, shared
schemas, and local recovery boundaries. Transcription, melody editing, harmony
generation, playback, and MIDI export are not implemented. The approved internal
timing convention remains centralized in the [Shell contract](shell.md#5-timing-rules).

The approved [Shell dashboard and appearance](shell.md#3-user-experience) provide
this tool's compact launcher, remembered stage, and browser-preferred light/dark
theme. Returning home or visiting learning does not discard the melody workspace.

## 2. User flow

### Stage 1: Bring in and confirm the melody

1. Reuse the current source/lead or upload/record a new clean line.
2. Select the working source section and analyze it.
3. Review candidate keys and confirm or override the tonic and starting major/minor form.
4. Establish shared meter, tempo, and beat-one alignment.
5. Review the quantized melody in the piano roll, correcting notes as needed.
6. Optionally visit the Chord Finder, then return without losing the draft.
7. Confirm that the melody represents the intended phrase and continue.

If a source or reviewed lead already exists, resume from it rather than asking for a duplicate recording.

### Stage 2: Build and shape harmony

Choose scale/mode, style, and part layout. Generate or audition a candidate, edit notes, isolate voices, and compare alternatives. A candidate does not replace the accepted arrangement until it is applied.

The central surface is a piano-roll editor. Chord accompaniment and voice mute/solo controls sit alongside it, with generation settings and optional explanations available without obscuring the music.

### Stage 3: Export

Choose which voices to export and whether to download separate MIDI files or one multitrack MIDI. Export the accepted note data, not a hidden draft or the currently soloed subset.

The user can return to editing without losing the arrangement or export choices.

## 3. Melody review and quantization

Use the [shared event types](shell.md#4-shared-song-contract) and [timing rules](shell.md#5-timing-rules).

### Capture and analysis

WAV/MP3 are accepted upload formats. Browser recording may use a different negotiated internal format; that must not make the app reject its own recording.

The MVP assumes one clean monophonic line, sung/hummed or played as a single melodic instrument. Mixed accompaniment and multiple simultaneous performers are outside scope.

Transcription produces a draft, not a claim of perfect pitch or rhythm detection. Keep source seconds and the original recording so the user can listen, realign, or replace the take.

### Required editing

| Operation | Rule |
|---|---|
| Move pitch | Edit by semitone with pointer and keyboard alternatives. Do not force a pitch into the chosen scale. |
| Move timing | Snap starts to the musical grid; the finest step is a sixteenth note. |
| Resize | Snap note ends; retain a positive duration of at least one grid step. |
| Add/delete | Allow correction of missed or spurious notes, with undo. |
| Shift phrase | Move the complete draft relative to the shared grid, not only individual notes. |
| Re-record/replace | Keep the existing melody until the replacement is reviewed and accepted. |
| Compare with source | Provide a reference audition without pretending unedited source audio has been time-stretched to match the grid. |

Show collisions, overlaps, or out-of-range notes caused by snapping. Do not silently merge repeated notes, discard notes that snap to the same position, or truncate music beyond the selected phrase.

A confirmed lead has nonnegative grid-aligned starts, positive grid-aligned durations, no unintended overlaps, and fits within the working phrase. A later deliberate lead edit invalidates dependent harmony generation but does not erase those harmonies.

Provide a visible "What is a key?" link. Key confirmation changes interpretation and harmony context, not the recorded sound or existing melody pitches.

## 4. Key-only and chord-aware context

Chord Finder is optional. The two modes must be understandable in the UI and in educational explanations.

| Context | Inputs used | Expected behavior |
|---|---|---|
| Key/scale-only | Confirmed tonic, selected harmony scale, lead, and arrangement settings | Generate using scale relationships, intervals, voice movement, and range. Do not invent a hidden backing progression. |
| Chord-aware | The same inputs plus a valid timed chord sequence covering the phrase | Also evaluate the explicit chords beneath the notes. Show chord accompaniment and chord-based explanations. |

Offer "Build chords" as a helpful route, not an obligatory gate. Return from the [Chord Finder](chord-finder.md#2-entry-paths-and-user-flow) with the same melody and settings intact.

If chords cover only part of the phrase, show the coverage and offer completion or key/scale-only generation. Do not silently loop the sequence, sustain its last chord indefinitely, or use different undocumented fallbacks in uncovered bars.

Explicit user-chosen chords take precedence over the harmony scale where their tones differ. The selected scale still guides other choices. Explain relevant out-of-scale chord tones rather than changing the chord or lead behind the user's back.

The user may also deliberately compare a key-only arrangement against a chord-aware one. Label which context produced each result.

## 5. Harmony controls and generation

### Scale / mode

There is one scale/mode selector, not separate duplicate "scale" and "mode" menus.

| ID | Display name | Interpretation |
|---|---|---|
| `major` | Major (Ionian) | Standard major scale |
| `natural-minor` | Minor (Aeolian) | Natural minor |
| `harmonic-minor` | Harmonic minor | Minor with a raised seventh |
| `melodic-minor` | Melodic minor (fixed/jazz) | Raised sixth and seventh in both directions |
| `dorian` | Dorian | Standard mode of the major scale |
| `phrygian` | Phrygian | Standard mode of the major scale |
| `lydian` | Lydian | Standard mode of the major scale |
| `mixolydian` | Mixolydian | Standard mode of the major scale |
| `locrian` | Locrian | Standard mode of the major scale |

"All the modes" means the seven standard diatonic modes, with Ionian and Aeolian represented by major and natural minor, plus the two additional minor scales above. Modes of harmonic/melodic minor are future scope.

The confirmed tonic is shared song context. The builder's scale choice can override the starting major/minor form for this harmony arrangement without rewriting the melody or progression.

### Part layouts

Counts are derived from the layout; there is no separate count control that can contradict it.

| Layout ID | Display choice | Above | Below | Added voices | Total including lead |
|---|---|---:|---:|---:|---:|
| `one-below` | 1 below | 0 | 1 | 1 | 2 |
| `one-above` | 1 above | 1 | 0 | 1 | 2 |
| `one-each` | 1 above and 1 below | 1 | 1 | 2 | 3 |
| `two-above-one-below` | 2 above and 1 below | 2 | 1 | 3 | 4 |
| `one-above-two-below` | 1 above and 2 below | 1 | 2 | 3 | 4 |
| `two-each` | 2 above and 2 below | 2 | 2 | 4 | 5 |

Use stable voice roles: `lead`, `above-1`, `above-2`, `below-1`, and `below-2`. The first voice on either side is nearest the lead in generated arrangements.

Newly generated above voices are above the lead, below voices are below it, and same-side generated voices retain their ordering. Manual edits remain the user's choice; an out-of-range or crossed-role edit can be indicated without silently moving it back.

### Arrangement styles and ranges

Proposed starting styles are Close, Open, and Parallel. Close favors compact spacing, Open favors wider spacing, and Parallel favors consistent interval relationships and movement with the lead rather than blindly shifting every note by fixed semitones.

Exact style rules, default ranges, and constraint priorities are [OPEN-HARMONY](shell.md#11-open-decisions-and-handoff). A style must have a real, explainable effect; a cosmetic label change is not an implemented style.

Each generated voice has a defined range. Avoid gender-based assumptions. If the selected layout cannot fit the configured ranges, explain the problem and let the user change layout/ranges. Do not silently reduce the part count or move the lead.

### Generation contract

Generate the voices jointly rather than making independent unrelated calls for each line.

| Requirement | Meaning |
|---|---|
| Preserve the lead | Generation does not change original note pitches, starts, or lengths. |
| Share the lead's rhythm | Initial harmony voices follow lead-note onsets and durations, including rests. Independent countermelodies are outside MVP. |
| Consider musical context | Use the selected tonic/scale and, in chord-aware mode, actual timed chords. |
| Respect voice constraints | Consider ranges, above/below roles, spacing, and movement between successive notes. |
| Handle doubling intentionally | Octave doubling can be valid. Avoid accidental identical voices presented as distinct useful parts. |
| Preserve protected edits | Treat protected manual notes as fixed. Surface conflicts rather than ignoring them. |
| Explain facts accurately | Return musical relationships that can support the learning UI. |

A held lead note may span a chord change. Consider the entire sounding interval rather than only the chord at note onset. A harmony tone can become a deliberate non-chord tone later in that span; explain the relevant context. Automatically creating an independent harmony rhythm to conceal the conflict is not part of this initial contract.

## 6. Editing, comparison, and playback

### Safe regeneration

Selecting a different scale/mode automatically prepares a new harmony preview so the user can hear the difference. Style and layout changes should follow the same reversible pattern.

| Action | Required behavior |
|---|---|
| Preview settings | Retain the accepted arrangement while producing the candidate. Show which settings are being previewed. |
| Compare A/B | Use the same lead, chords, tempo, and phrase where possible, so the audible difference reflects the selected change. |
| Apply preview | Commit the candidate and settings together, then auto-save through the Shell. |
| Cancel/reject | Keep the accepted notes, settings, and protected edits. |
| Edit a harmony note | Save the edit and protect it from later regeneration by default. Provide an explicit way to release that protection. |
| Change layout | Make removal of an edited voice explicit before applying the new layout. |
| Undo | Restore the prior accepted edit/arrangement without automatically starting audio. |
| Change source context during generation | Reject the stale result rather than applying it to newer song data. |

Protected notes may remain outside the newly selected scale, range, or intended above/below role. Identify that condition without treating the user's musical choice as a software error. Newly generated material must not silently overwrite it.

The user can return to melody review to edit the lead. Those changes mark harmony material for review; they do not cause silent replacement.

### Piano roll and mixer

Show the original melody and every active harmony voice as distinguishable editable musical data. Keep a visible grid and, in chord-aware mode, the relevant chord context.

The mixer includes chord accompaniment, original melody, and each active harmony voice. Here, "backing track" means the chord accompaniment, not a separately uploaded full-band recording.

| Control | Proposed behavior |
|---|---|
| Mute | Exclude that source from preview playback without deleting it. |
| Solo | When any sources are soloed, play the soloed sources only. Multiple solos can be combined; mute still takes precedence. |
| Clear solos | Restore normal audition without requiring the user to find hidden active solos. |
| Play/stop | Use the shared transport and musical timeline. |
| Loop | Repeat the chosen phrase/range for comparison or practice. |
| Slower practice | Offer a playback-rate/tempo preview without rewriting saved note positions or exported project tempo. |

The lead and harmony voices use piano for the initial preview. Chord accompaniment uses the guitar/piano choice shared from the Chord Finder. No sung-voice synthesis is implied.

When there are no chords, show accompaniment as unavailable rather than silently adding a progression. Lesson audio and source-reference auditions must not stack on top of another active transport.

## 7. MIDI export

### Export choices

| Choice | File contents |
|---|---|
| Separate files | One selected voice per MIDI file, with the shared timing metadata. |
| Combined file | One Standard MIDI File type 1 with separate named tracks for the selected melody/harmony voices, plus conductor metadata. |

Default selection can include the lead and all current harmony voices. Let the user explicitly select fewer. Mute/solo controls affect listening, not export inclusion.

Chord-accompaniment MIDI, source audio, rendered soundfonts, and WAV guides are outside this MVP export contract. MIDI carries note/performance information, not the piano/guitar audio itself.

### Timing and integrity

| Requirement | Expected output |
|---|---|
| Shared origin | Every file starts from the same musical tick zero. Do not trim each part to its first sounding note. |
| Preserved rests | Leading silence, gaps, and intended note lengths remain. |
| Shared duration | Use the working phrase endpoint for end-of-track timing so separate parts retain a common range. |
| Correct tempo | Export normalized quarter-note tempo, including the dotted-quarter UI conversion for 6/8. |
| Correct meter | Include the selected time signature and appropriate metronome/pulse information. |
| Separate voices | Do not flatten the combined file into one indistinguishable note track. |
| Current accepted data | Include manual edits and the accepted arrangement, not a hidden candidate. |
| Clear track names | Identify the lead and above/below harmony roles. Sanitize download filenames without changing the displayed project name. |

MIDI's standard key-signature event does not represent every mode in this tool. Do not mislabel a modal arrangement as an incorrect major/minor key. A text description of tonic/scale is acceptable; tempo, meter, note data, and track separation are the required interoperability contract.

If settings or chords changed after the current arrangement was made, make that status visible before export. The user can deliberately keep their edited notes; do not force regeneration as a condition of authorship. Invalid event data still needs correction before a valid file can be produced.

## 8. Inputs, outputs, and shared-state effects

Use the [canonical shared entities](shell.md#4-shared-song-contract).

### Inputs

| Input | Required when |
|---|---|
| Current song and revision | Always |
| Source audio and selection | Analyzing a new lead; not required to re-upload when data already exists |
| Analysis/alignment draft | During transcription and melody review |
| Confirmed musical timing | Before confirming the grid and generating an arrangement |
| Confirmed tonic/key | Before key/scale-based generation |
| Confirmed lead notes | Before generation |
| Timed chord events | Only in chord-aware mode |
| Harmony scale, style, layout, and ranges | Before generation |
| Protected notes and accepted arrangement | When regenerating an edited arrangement |

### Outputs

| Output | Consumers |
|---|---|
| Shared source/analysis and corrected lead | Shell, Chord Finder, future tools |
| Confirmed key/timing/alignment | Both tools |
| Accepted harmony settings and separate voice notes | Shell, playback, export |
| Candidate arrangement and diagnostics | Builder preview UI |
| Structured explanatory facts | Note inspection and learning UI |
| Mix/practice settings | Playback and workspace recovery |
| MIDI files | User download/recording workflow |

### Explanatory metadata

For a selected generated note, return the reference lead note, interval relationship, selected scale membership, applicable chord events, and chord membership when known. Passing/neighbor-tone labels are optional and require the relevant melodic context.

When no chords exist, chord membership is not applicable, not "false" and not inferred from an undisclosed chord.

One illustrative fact record:

```json
{
  "voiceId": "above-1",
  "leadNoteId": "lead-12",
  "harmonyNoteId": "harmony-12",
  "leadPitchMidi": 64,
  "harmonyPitchMidi": 67,
  "intervalSemitones": 3,
  "activeChordIds": ["chord-1"],
  "chordMembership": "member",
  "scaleMembership": "member"
}
```

With E as the lead, G as the harmony, and a current C major chord, the UI can explain the minor third above E and membership in C-E-G. It must not claim a voice-leading reason unless the generation result actually supports that reason.

## 9. Educational experience

Use the [shared learning topics and video policy](shell.md#8-learning-contract).

| Location | Educational behavior |
|---|---|
| Key review | Explain tonal center, uncertainty, and manual confirmation through "What is a key?" |
| Melody alignment | Explain the grid and how quantization changes timing. Let the user compare with the source. |
| Selected harmony note | Offer "Why this note?" using its real interval, scale, and chord context. |
| Scale/mode selector | Compare arrangements while retaining the lead and chords, making the scope of the change explicit. |
| Chord/non-chord explanation | Distinguish membership from correctness; non-chord tones can create intentional motion or tension. |
| Export stage | Explain that MIDI is editable note information and can sound different in another instrument/DAW. |

### Small optional activity

For a short phrase, let the user try placing one harmony note before revealing a suggestion. Audition their choice alone, with the lead, and with chords if supplied. Then compare with the suggestion and inspect the musical relationships.

Do not require the exercise before generating parts. Do not score one musically valid choice as wrong merely because it differs from the generator.

Another useful comparison changes only the harmony scale or one edited note, with undo and A/B playback. Avoid unrelated random changes that make it impossible to hear what the selected control did.

Links to existing creators' videos are optional supplemental resources. The explanation and exercise remain usable without them; this spec does not require producing videos.

## 10. States, failures, and acceptance scenarios

Required states include empty, recording, analyzing, melody-needs-review, confirmed melody, generating preview, ready preview, accepted arrangement, stale arrangement, and export error.

Show explicit recovery for microphone denial, unsupported/undecodable media, uncertain key, transcription collisions, out-of-phrase notes, insufficient chord coverage, infeasible voice constraints, unavailable sounds, interrupted work, and failed local saves.

| ID | Scenario and expected outcome |
|---|---|
| HZ-A1 | Enter from Chord Finder: reuse the same recording, selected phrase, key, timing, and chords. |
| HZ-A2 | Start with no chords: confirm key/timing and generate in key/scale-only mode without visiting Chord Finder. |
| HZ-A3 | Override the detected key: source and existing melody pitches remain unchanged. |
| HZ-A4 | Correct notes in each supported meter: starts/ends align to the shared grid and no note is silently erased by quantization. |
| HZ-A5 | Select each of the six layouts: added and total voice counts match the table, including four added plus one lead for `two-each`. |
| HZ-A6 | Request an infeasible layout/range: receive an explanation, not fewer voices or a transposed lead. |
| HZ-A7 | Change scale after protecting a note: the note survives the preview; the lead and chords remain unchanged. |
| HZ-A8 | Reject a generated preview: the accepted arrangement and settings remain intact. |
| HZ-A9 | Change source data during generation: the stale result cannot replace newer work. |
| HZ-A10 | Mute/solo several sources: playback follows the defined mixer rule while note data and export selection remain intact. |
| HZ-A11 | Inspect a note without chords: explain intervals/scale membership without inventing chord membership. |
| HZ-A12 | Export separately and combined: manual edits, track identities, tempo/meter, leading rests, and common timing are preserved. |
| HZ-A13 | Export 6/8: normalized quarter-note tempo matches the displayed dotted-quarter pulse. |
| HZ-A14 | Refresh after saving a review draft or accepted arrangement: restore it through the Shell without requiring a new recording. |

## 11. Implementation handoff

Use shared capture/analysis/timing/playback interfaces from [Shell](shell.md#6-shared-capability-interfaces). Consume the Chord Finder's timed events rather than parsing its displayed labels or keeping a second progression.

Define style behavior, voice ranges, protected-note conflicts, and musical-quality examples with the musical-logic contributor before calling the generator complete. Initial input limits and supported runtimes remain in the [shared open-decision register](shell.md#11-open-decisions-and-handoff).

Keep the working editor, useful single-part path, and reliable data/export behavior central while expanding to all six layouts. Do not present the broader music-learning vision as a reason to add unrelated composition features to this MVP.
