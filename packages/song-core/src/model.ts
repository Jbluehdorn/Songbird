import { z } from 'zod';
import { halfBarTicks, MAX_PHRASE_BARS, SIXTEENTH_TICKS, ticksPerBar } from './timing';

export const SCHEMA_VERSION = 1;
export const toolSchema = z.enum(['harmonizer', 'chord-finder']);
export const harmonyStageSchema = z.enum(['entry', 'review', 'builder', 'export']);
export const chordStageSchema = z.enum(['entry', 'key', 'progression']);
export const lessonSchema = z.enum(['keys', 'rhythm', 'chords', 'harmony', 'scales']);
export const locationSchema = z.discriminatedUnion('tool', [
  z.object({ tool: z.literal('harmonizer'), stage: harmonyStageSchema }).strict(),
  z.object({ tool: z.literal('chord-finder'), stage: chordStageSchema }).strict(),
]);
export type Tool = z.infer<typeof toolSchema>;
export type ToolLocation = z.infer<typeof locationSchema>;
export type Lesson = z.infer<typeof lessonSchema>;

const id = z.string().min(1);
const revision = z.number().int().nonnegative();
const pitch = z.number().int().min(0).max(127);
const tick = z.number().int().nonnegative().multipleOf(SIXTEENTH_TICKS);
const duration = z.number().int().positive().multipleOf(SIXTEENTH_TICKS);
const pitchClass = z.number().int().min(0).max(11);
export const keySchema = z
  .object({
    tonic: pitchClass,
    spelling: z.string().min(1),
    quality: z.enum(['major', 'natural-minor']),
  })
  .strict();
export const timingSchema = z
  .object({
    meter: z.enum(['4/4', '3/4', '6/8']),
    displayBpm: z.number().finite().positive(),
    confirmed: z.boolean(),
  })
  .strict();
export const noteSchema = z
  .object({
    id,
    pitchMidi: pitch,
    startTick: tick,
    durationTick: duration,
    velocity: z.number().int().min(1).max(127),
    origin: z.enum(['detected', 'manual', 'generated']),
    protected: z.boolean(),
    sourceNoteId: id.optional(),
  })
  .strict();
export const detectedNoteSchema = z
  .object({
    id,
    pitchMidi: pitch,
    startSeconds: z.number().finite().nonnegative(),
    durationSeconds: z.number().finite().positive(),
    amplitude: z.number().finite().nonnegative().optional(),
    confidence: z.number().min(0).max(1).optional(),
    reviewFlags: z.array(z.string()),
  })
  .strict();
export const sourceSchema = z
  .object({
    id,
    assetId: id,
    filename: z.string().nullable(),
    mediaType: z.string().min(1),
    durationSeconds: z.number().finite().positive(),
    origin: z.enum(['import', 'capture']),
  })
  .strict();
export const selectionSchema = z
  .object({
    sourceId: id,
    startSeconds: z.number().finite().nonnegative(),
    endSeconds: z.number().finite().positive(),
  })
  .strict()
  .refine((value) => value.endSeconds > value.startSeconds, {
    message: 'The source selection must have a positive duration.',
  });
export const revisionSchema = z
  .object({
    source: revision,
    selection: revision,
    timing: revision,
    key: revision,
    lead: revision,
    chords: revision,
  })
  .strict();
export const inputStampSchema = revisionSchema.partial();
export type InputStamp = z.infer<typeof inputStampSchema>;
export type MusicRevisions = z.infer<typeof revisionSchema>;
export const analysisSchema = z
  .object({
    sourceId: id,
    inputs: inputStampSchema.required({ source: true, selection: true }),
    notes: z.array(detectedNoteSchema),
    candidateKeys: z.array(keySchema),
    reviewFlags: z.array(z.string()),
  })
  .strict();
export const leadSchema = z
  .object({
    notes: z.array(noteSchema),
    sourceId: id.nullable(),
    alignmentRevision: revision.nullable(),
    confirmed: z.boolean(),
  })
  .strict();
export const chordSchema = z
  .object({
    id,
    rootPitchClass: pitchClass,
    rootSpelling: z.string().min(1),
    qualityId: z.enum(['major', 'minor']),
    startTick: tick,
    durationTick: duration,
  })
  .strict();
export const voiceRoleSchema = z.enum(['above-1', 'above-2', 'below-1', 'below-2']);
export const layoutVoices = {
  'one-below': ['below-1'],
  'one-above': ['above-1'],
  'one-each': ['above-1', 'below-1'],
  'two-above-one-below': ['above-1', 'above-2', 'below-1'],
  'one-above-two-below': ['above-1', 'below-1', 'below-2'],
  'two-each': ['above-1', 'above-2', 'below-1', 'below-2'],
} as const;
const rangeSchema = z
  .object({ low: pitch, high: pitch })
  .strict()
  .refine((range) => range.low <= range.high, 'Voice range is inverted.');
export const harmonySettingsSchema = z
  .object({
    scale: z.enum([
      'major',
      'natural-minor',
      'harmonic-minor',
      'melodic-minor',
      'dorian',
      'phrygian',
      'lydian',
      'mixolydian',
      'locrian',
    ]),
    style: z.enum(['close', 'open', 'parallel']),
    layout: z.enum([
      'one-below',
      'one-above',
      'one-each',
      'two-above-one-below',
      'one-above-two-below',
      'two-each',
    ]),
    context: z.enum(['key-only', 'chord-aware']),
  })
  .strict();
export const arrangementSchema = z
  .object({
    id,
    settings: harmonySettingsSchema,
    inputs: inputStampSchema,
    status: z.enum(['current', 'stale']),
    voices: z.array(
      z
        .object({
          id,
          role: voiceRoleSchema,
          range: rangeSchema,
          notes: z.array(noteSchema),
        })
        .strict(),
    ),
    facts: z.array(
      z
        .object({
          voiceId: id,
          leadNoteId: id,
          harmonyNoteId: id,
          intervalSemitones: z.number().int(),
          activeChordIds: z.array(id),
          chordMembership: z.enum(['member', 'non-member', 'not-applicable']),
          scaleMembership: z.enum(['member', 'non-member']),
        })
        .strict(),
    ),
  })
  .strict();
export const jobSchema = z
  .object({
    id,
    kind: z.enum(['analysis', 'harmony']),
    status: z.enum(['running', 'interrupted', 'failed']),
    inputs: inputStampSchema,
    message: z.string().nullable(),
  })
  .strict();
const mixSource = z.enum(['lead', 'chords', 'above-1', 'above-2', 'below-1', 'below-2']);
export const workspaceSchema = z
  .object({
    lastTool: toolSchema,
    stages: z
      .object({
        harmonizer: harmonyStageSchema,
        'chord-finder': chordStageSchema,
      })
      .strict(),
    activeView: z.enum(['tool', 'learn']),
    lesson: lessonSchema.nullable(),
    helpReturn: locationSchema.nullable(),
    reviewDraft: leadSchema.nullable(),
    harmonyPreview: arrangementSchema.nullable(),
    jobs: z.array(jobSchema),
  })
  .strict();

const documentSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    id,
    revision,
    name: z.string().max(160),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    musicRevisions: revisionSchema,
    sources: z.array(sourceSchema),
    activeSourceId: id.nullable(),
    selection: selectionSchema.nullable(),
    analysis: analysisSchema.nullable(),
    key: keySchema.nullable(),
    timing: timingSchema.nullable(),
    alignment: z
      .object({
        sourceId: id,
        revision,
        sourceSecondsAtTickZero: z.number().finite(),
      })
      .strict()
      .nullable(),
    phrase: z.object({ lengthTicks: duration }).strict().nullable(),
    lead: leadSchema.nullable(),
    chords: z.array(chordSchema),
    harmony: arrangementSchema.nullable(),
    mix: z
      .object({
        muted: z.array(mixSource),
        soloed: z.array(mixSource),
        instrument: z.enum(['piano', 'guitar']),
      })
      .strict(),
    workspace: workspaceSchema,
  })
  .strict();

export type SongProject = z.infer<typeof documentSchema>;
export type NoteEvent = z.infer<typeof noteSchema>;
export type SourceAudio = z.infer<typeof sourceSchema>;
export type AnalysisDraft = z.infer<typeof analysisSchema>;
export type HarmonyArrangement = z.infer<typeof arrangementSchema>;

export const songSchema = documentSchema.superRefine((song, context) => {
  const issue = (message: string) => context.addIssue({ code: 'custom', message });
  const sources = new Map(song.sources.map((source) => [source.id, source]));
  if (sources.size !== song.sources.length) issue('Source IDs must be unique.');
  if (song.activeSourceId && !sources.has(song.activeSourceId)) {
    issue('The active recording is not in this song.');
  }
  if (song.selection) {
    const source = sources.get(song.selection.sourceId);
    if (
      !source ||
      song.selection.sourceId !== song.activeSourceId ||
      song.selection.endSeconds > source.durationSeconds
    ) {
      issue('The selected range must belong to the active source and stay within it.');
    }
  }
  for (const dependent of [
    song.analysis,
    song.alignment,
    song.lead,
    song.workspace.reviewDraft,
  ]) {
    if (dependent?.sourceId && !sources.has(dependent.sourceId)) {
      issue('A recording referenced by the song is missing.');
    }
  }
  if (song.phrase) {
    if (!song.timing?.confirmed) {
      issue('Confirm timing before arranging a musical phrase.');
    } else if (
      song.phrase.lengthTicks > MAX_PHRASE_BARS * ticksPerBar(song.timing.meter) ||
      song.phrase.lengthTicks % halfBarTicks(song.timing.meter) !== 0
    ) {
      issue('The working phrase must use half-bar increments and fit within eight bars.');
    }
  }
  function checkNotes(notes: NoteEvent[], monophonic: boolean) {
    if (new Set(notes.map((note) => note.id)).size !== notes.length) {
      issue('Note IDs must be unique within a voice.');
    }
    const ordered = [...notes].sort((a, b) => a.startTick - b.startTick);
    for (let index = 0; index < ordered.length; index++) {
      const note = ordered[index]!;
      if (!song.phrase || note.startTick + note.durationTick > song.phrase.lengthTicks) {
        issue('Accepted notes must fit inside the working phrase.');
      }
      const previous = ordered[index - 1];
      if (
        monophonic &&
        previous &&
        previous.startTick + previous.durationTick > note.startTick
      ) {
        issue('Overlapping notes need review; no note has been discarded.');
      }
    }
  }
  if (song.lead?.confirmed) checkNotes(song.lead.notes, true);
  if (new Set(song.chords.map((chord) => chord.id)).size !== song.chords.length) {
    issue('Chord IDs must be unique.');
  }
  let chordEnd = 0;
  for (const chord of song.chords) {
    if (!song.timing?.confirmed || !song.phrase) {
      issue('Chords require confirmed timing and a working phrase.');
      break;
    }
    if (
      chord.startTick !== chordEnd ||
      chord.durationTick % halfBarTicks(song.timing.meter)
    ) {
      issue('Chords must be contiguous and use half-bar durations.');
    }
    chordEnd += chord.durationTick;
    if (chordEnd > song.phrase.lengthTicks)
      issue('Chords cannot extend the phrase implicitly.');
  }
  if (song.harmony) {
    const expectedRoles: readonly string[] = layoutVoices[song.harmony.settings.layout];
    const roles = song.harmony.voices.map((voice) => voice.role);
    if (
      new Set(roles).size !== roles.length ||
      roles.length !== expectedRoles.length ||
      roles.some((role) => !expectedRoles.includes(role))
    ) {
      issue('Harmony voices must match the selected part layout.');
    }
    if (new Set(song.harmony.voices.map((voice) => voice.id)).size !== roles.length) {
      issue('Harmony voice IDs must be unique.');
    }
    if (song.harmony.status === 'current') {
      const dependencies: (keyof MusicRevisions)[] = ['lead', 'key', 'timing'];
      if (song.harmony.settings.context === 'chord-aware') dependencies.push('chords');
      if (
        !song.key ||
        !song.lead?.confirmed ||
        !song.timing?.confirmed ||
        dependencies.some((key) => song.harmony!.inputs[key] !== song.musicRevisions[key])
      ) {
        issue(
          'Current harmony requires confirmed musical context and matching input revisions.',
        );
      }
    }
    for (const voice of song.harmony.voices) checkNotes(voice.notes, true);
    if (
      song.harmony.status === 'current' &&
      song.harmony.settings.context === 'chord-aware' &&
      chordEnd !== song.phrase?.lengthTicks
    ) {
      issue('Current chord-aware harmony requires complete chord coverage.');
    }
  }
});

export function createSong(id: string, now = new Date().toISOString()): SongProject {
  return songSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    id,
    revision: 0,
    name: '',
    createdAt: now,
    updatedAt: now,
    musicRevisions: { source: 0, selection: 0, timing: 0, key: 0, lead: 0, chords: 0 },
    sources: [],
    activeSourceId: null,
    selection: null,
    analysis: null,
    key: null,
    timing: null,
    alignment: null,
    phrase: null,
    lead: null,
    chords: [],
    harmony: null,
    mix: { muted: [], soloed: [], instrument: 'piano' },
    workspace: {
      lastTool: 'harmonizer',
      stages: { harmonizer: 'entry', 'chord-finder': 'entry' },
      activeView: 'tool',
      lesson: null,
      helpReturn: null,
      reviewDraft: null,
      harmonyPreview: null,
      jobs: [],
    },
  });
}

export function displayName(song: Pick<SongProject, 'name'>): string {
  return song.name.trim() || 'Untitled song';
}

export function lastToolLocation(song: SongProject): ToolLocation {
  const { lastTool, stages } = song.workspace;
  return lastTool === 'harmonizer'
    ? { tool: lastTool, stage: stages.harmonizer }
    : { tool: lastTool, stage: stages['chord-finder'] };
}
