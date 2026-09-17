import { describe, expect, it } from 'vitest';
import {
  commitEdit,
  createSong,
  displayName,
  halfBarTicks,
  inputsMatch,
  quarterBpm,
  songSchema,
  sourceSecondsToTicks,
  ticksPerBar,
  ticksToSeconds,
  type EditResult,
  type SongProject,
} from './index';
import { arrangedSong, withSource } from '../../../tests/fixtures/song';

function accepted(result: EditResult): SongProject {
  if (!result.ok) throw new Error(result.message);
  return result.song;
}

describe('shared timing', () => {
  it.each([
    ['4/4', 1920, 960, 80],
    ['3/4', 1440, 720, 80],
    ['6/8', 1440, 720, 120],
  ] as const)('normalizes %s without confusing its pulse', (meter, bar, half, bpm) => {
    expect(ticksPerBar(meter)).toBe(bar);
    expect(halfBarTicks(meter)).toBe(half);
    expect(quarterBpm({ meter, displayBpm: 80, confirmed: true })).toBe(bpm);
  });

  it('preserves source seconds and negative pre-alignment positions', () => {
    const timing = { meter: '6/8', displayBpm: 80, confirmed: true } as const;
    expect(ticksToSeconds(1440, timing)).toBe(1.5);
    expect(sourceSecondsToTicks(1, 2, timing)).toBe(-960);
    expect(() => quarterBpm({ ...timing, displayBpm: 0 })).toThrow();
  });
});

describe('song invariants and reversible boundaries', () => {
  it('allows melody-first entry with no key, timing, chords or source', () => {
    const song = createSong('new');
    expect(song.key).toBeNull();
    expect(song.timing).toBeNull();
    expect(song.chords).toEqual([]);
    expect(displayName(song)).toBe('Untitled song');
    expect(displayName({ name: '  ' })).toBe('Untitled song');
  });

  it('preserves other stages and help origin through navigation', () => {
    let song = createSong('navigation');
    song = accepted(
      commitEdit(
        song,
        { type: 'navigate', location: { tool: 'harmonizer', stage: 'builder' } },
        song.revision,
      ),
    );
    song = accepted(
      commitEdit(song, { type: 'open-help', lesson: 'keys' }, song.revision),
    );
    song = accepted(
      commitEdit(song, { type: 'open-help', lesson: 'rhythm' }, song.revision),
    );
    song = accepted(commitEdit(song, { type: 'return-from-help' }, song.revision));
    expect(song.workspace.activeView).toBe('tool');
    expect(song.workspace.stages.harmonizer).toBe('builder');
    expect(song.workspace.helpReturn).toEqual({ tool: 'harmonizer', stage: 'builder' });
  });

  it('does not advance revisions for no-op navigation', () => {
    const song = createSong('new');
    expect(
      accepted(
        commitEdit(
          song,
          { type: 'navigate', location: { tool: 'harmonizer', stage: 'entry' } },
          0,
        ),
      ),
    ).toBe(song);
  });

  it.each(['4/4', '3/4', '6/8'] as const)(
    'enforces the actual eight-bar bound in %s',
    (meter) => {
      const song = arrangedSong(meter);
      song.phrase = { lengthTicks: ticksPerBar(meter) * 8 };
      expect(songSchema.safeParse(song).success).toBe(true);
      song.phrase.lengthTicks += 120;
      expect(songSchema.safeParse(song).success).toBe(false);
    },
  );

  it('reports collisions and out-of-bounds accepted notes without removing them', () => {
    const song = arrangedSong();
    song.lead!.notes.push({ ...song.lead!.notes[0]!, id: 'collision' });
    expect(songSchema.safeParse(song).success).toBe(false);
    expect(song.lead!.notes).toHaveLength(2);
    song.lead!.notes[1]!.startTick = 3840;
    expect(songSchema.safeParse(song).success).toBe(false);
  });

  it('retains unresolved review collisions and raw detection seconds', () => {
    const song = withSource(arrangedSong());
    song.workspace.reviewDraft!.confirmed = false;
    song.workspace.reviewDraft!.notes.push({
      ...song.lead!.notes[0]!,
      id: 'draft-overlap',
    });
    const result = songSchema.parse(song);
    expect(result.workspace.reviewDraft!.notes).toHaveLength(2);
    expect(result.analysis!.notes[0]!.startSeconds).toBe(1.13);
    expect(result.analysis!.notes[0]!.confidence).toBeUndefined();
  });

  it('preserves the lead and protected harmony while changing key', () => {
    const song = arrangedSong();
    const result = accepted(
      commitEdit(
        song,
        { type: 'set-key', key: { tonic: 2, spelling: 'D', quality: 'major' } },
        0,
      ),
    );
    expect(result.lead).toEqual(song.lead);
    expect(result.harmony!.voices).toEqual(song.harmony!.voices);
    expect(result.harmony!.status).toBe('stale');
    expect(song.harmony!.status).toBe('current');
  });

  it('changes tempo without moving notes and blocks destructive meter changes', () => {
    const song = arrangedSong();
    const result = accepted(
      commitEdit(
        song,
        { type: 'set-timing', timing: { ...song.timing!, displayBpm: 100 } },
        0,
      ),
    );
    expect(result.lead).toEqual(song.lead);
    expect(
      commitEdit(
        song,
        { type: 'set-timing', timing: { meter: '3/4', displayBpm: 80, confirmed: true } },
        0,
      ),
    ).toMatchObject({ ok: false, code: 'review-required' });
  });

  it('allows incomplete chord coverage but marks chord-aware harmony stale', () => {
    const song = arrangedSong();
    song.chords = [
      {
        id: 'chord-1',
        rootPitchClass: 0,
        rootSpelling: 'C',
        qualityId: 'major',
        startTick: 0,
        durationTick: 3840,
      },
    ];
    song.harmony!.settings.context = 'chord-aware';
    song.harmony!.inputs.chords = 0;
    songSchema.parse(song);
    const result = accepted(
      commitEdit(
        song,
        { type: 'replace-chords', chords: [{ ...song.chords[0]!, durationTick: 960 }] },
        0,
      ),
    );
    expect(result.phrase).toEqual(song.phrase);
    expect(result.harmony!.status).toBe('stale');
    expect(result.harmony!.voices).toEqual(song.harmony!.voices);
  });

  it('rejects old analysis but accepts the same inputs after a rename', () => {
    const song = withSource(arrangedSong());
    const renamed = accepted(commitEdit(song, { type: 'rename', name: 'My song' }, 0));
    expect(inputsMatch(renamed.musicRevisions, song.analysis!.inputs)).toBe(true);
    expect(
      commitEdit(
        renamed,
        { type: 'receive-analysis', analysis: song.analysis! },
        renamed.revision,
      ).ok,
    ).toBe(true);
    renamed.musicRevisions.selection++;
    expect(
      commitEdit(
        renamed,
        { type: 'receive-analysis', analysis: song.analysis! },
        renamed.revision,
      ),
    ).toMatchObject({ ok: false, code: 'stale' });
  });

  it('turns persisted running jobs into visibly interrupted jobs', () => {
    const song = arrangedSong();
    song.workspace.jobs.push({
      id: 'job',
      kind: 'analysis',
      status: 'running',
      inputs: {},
      message: null,
    });
    const result = accepted(commitEdit(song, { type: 'interrupt-jobs' }, 0));
    expect(result.workspace.jobs[0]!.status).toBe('interrupted');
    expect(result.lead).toEqual(song.lead);
  });

  it('rejects stale edit revisions, unsupported fields, and invalid pitches', () => {
    const song = arrangedSong();
    expect(commitEdit(song, { type: 'rename', name: 'overwrite' }, 99).ok).toBe(false);
    expect(songSchema.safeParse({ ...song, futureField: true }).success).toBe(false);
    song.lead!.notes[0]!.pitchMidi = 128;
    expect(songSchema.safeParse(song).success).toBe(false);
  });

  it('does not claim current harmony without matching confirmed inputs', () => {
    const song = arrangedSong();
    song.musicRevisions.lead++;
    expect(songSchema.safeParse(song).success).toBe(false);
    song.harmony!.status = 'stale';
    expect(songSchema.safeParse(song).success).toBe(true);
  });

  it('does not stale an arrangement when the chosen key is unchanged', () => {
    const song = arrangedSong();
    expect(accepted(commitEdit(song, { type: 'set-key', key: song.key! }, 0))).toBe(song);
  });
});
