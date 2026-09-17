import { z } from 'zod';
import {
  analysisSchema,
  chordSchema,
  keySchema,
  leadSchema,
  lessonSchema,
  locationSchema,
  songSchema,
  timingSchema,
  lastToolLocation,
  type InputStamp,
  type MusicRevisions,
  type SongProject,
} from './model';

const commandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('rename'), name: z.string().max(160) }).strict(),
  z.object({ type: z.literal('navigate'), location: locationSchema }).strict(),
  z.object({ type: z.literal('open-help'), lesson: lessonSchema.nullable() }).strict(),
  z.object({ type: z.literal('return-from-help') }).strict(),
  z.object({ type: z.literal('set-key'), key: keySchema }).strict(),
  z.object({ type: z.literal('set-timing'), timing: timingSchema }).strict(),
  z.object({ type: z.literal('replace-lead'), lead: leadSchema }).strict(),
  z.object({ type: z.literal('replace-chords'), chords: z.array(chordSchema) }).strict(),
  z.object({ type: z.literal('receive-analysis'), analysis: analysisSchema }).strict(),
  z.object({ type: z.literal('interrupt-jobs') }).strict(),
]);
export type SongCommand = z.infer<typeof commandSchema>;
export type EditResult =
  | { ok: true; song: SongProject }
  | {
      ok: false;
      code: 'conflict' | 'invalid' | 'stale' | 'review-required';
      message: string;
    };

export function inputsMatch(revisions: MusicRevisions, inputs: InputStamp): boolean {
  return (Object.keys(inputs) as (keyof MusicRevisions)[]).every(
    (key) => revisions[key] === inputs[key],
  );
}

export function commitEdit(
  current: SongProject,
  input: SongCommand,
  expectedRevision: number,
  now = new Date().toISOString(),
): EditResult {
  if (current.revision !== expectedRevision) {
    return {
      ok: false,
      code: 'conflict',
      message: 'The song changed. Review the latest state before applying this edit.',
    };
  }
  const parsed = commandSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: 'invalid',
      message: parsed.error.issues.map((issue) => issue.message).join(' '),
    };
  }
  const command = parsed.data;
  const song = structuredClone(current);
  let changedMusic: keyof MusicRevisions | null = null;
  switch (command.type) {
    case 'rename':
      song.name = command.name;
      break;
    case 'navigate': {
      song.workspace.lastTool = command.location.tool;
      song.workspace.activeView = 'tool';
      if (command.location.tool === 'harmonizer') {
        song.workspace.stages.harmonizer = command.location.stage;
      } else {
        song.workspace.stages['chord-finder'] = command.location.stage;
      }
      break;
    }
    case 'open-help':
      if (song.workspace.activeView === 'tool') {
        song.workspace.helpReturn = lastToolLocation(song);
      }
      song.workspace.activeView = 'learn';
      song.workspace.lesson = command.lesson;
      break;
    case 'return-from-help': {
      const origin = song.workspace.helpReturn ?? lastToolLocation(song);
      return commitEdit(
        current,
        { type: 'navigate', location: origin },
        expectedRevision,
        now,
      );
    }
    case 'set-key':
      song.key = command.key;
      changedMusic = 'key';
      break;
    case 'set-timing':
      if (song.timing && command.timing.meter !== song.timing.meter && song.phrase) {
        return {
          ok: false,
          code: 'review-required',
          message:
            'Changing meter on arranged music requires a reviewed replacement layout. Existing notes have not changed.',
        };
      }
      song.timing = command.timing;
      changedMusic = 'timing';
      break;
    case 'replace-lead':
      song.lead = command.lead;
      changedMusic = 'lead';
      break;
    case 'replace-chords':
      song.chords = command.chords;
      changedMusic = 'chords';
      break;
    case 'receive-analysis':
      if (
        command.analysis.sourceId !== song.activeSourceId ||
        command.analysis.inputs.source === undefined ||
        command.analysis.inputs.selection === undefined ||
        !inputsMatch(song.musicRevisions, command.analysis.inputs)
      ) {
        return {
          ok: false,
          code: 'stale',
          message:
            'This analysis belongs to an older source or selection. The newer work is unchanged.',
        };
      }
      song.analysis = command.analysis;
      break;
    case 'interrupt-jobs':
      for (const job of song.workspace.jobs) {
        if (job.status === 'running') {
          job.status = 'interrupted';
          job.message =
            'Processing stopped when the page closed. Retry when this capability is available.';
        }
      }
      break;
  }
  if (JSON.stringify(song) === JSON.stringify(current))
    return { ok: true, song: current };
  if (changedMusic) {
    song.musicRevisions[changedMusic]++;
    if (
      song.harmony &&
      (changedMusic !== 'chords' || song.harmony.settings.context === 'chord-aware')
    ) {
      song.harmony.status = 'stale';
    }
  }
  song.revision++;
  song.updatedAt = now;
  const result = songSchema.safeParse(song);
  return result.success
    ? { ok: true, song: result.data }
    : {
        ok: false,
        code: 'invalid',
        message: result.error.issues.map((issue) => issue.message).join(' '),
      };
}
