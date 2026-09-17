import {
  createSong,
  songSchema,
  ticksPerBar,
  type Meter,
  type SongProject,
} from '@songbird/song-core';

export function arrangedSong(meter: Meter = '4/4'): SongProject {
  const song = createSong('synthetic-song', '2026-09-15T00:00:00.000Z');
  song.name = 'Synthetic fixture';
  song.timing = { meter, displayBpm: 80, confirmed: true };
  song.key = { tonic: 0, spelling: 'C', quality: 'major' };
  song.phrase = { lengthTicks: ticksPerBar(meter) * 2 };
  song.lead = {
    confirmed: true,
    sourceId: null,
    alignmentRevision: null,
    notes: [
      {
        id: 'lead-1',
        pitchMidi: 60,
        startTick: 120,
        durationTick: 480,
        velocity: 80,
        origin: 'manual',
        protected: false,
      },
    ],
  };
  song.harmony = {
    id: 'arrangement-1',
    status: 'current',
    settings: {
      scale: 'major',
      style: 'close',
      layout: 'one-below',
      context: 'key-only',
    },
    inputs: { lead: 0, key: 0, timing: 0 },
    voices: [
      {
        id: 'voice-1',
        role: 'below-1',
        range: { low: 48, high: 72 },
        notes: [
          {
            id: 'harmony-1',
            pitchMidi: 55,
            startTick: 120,
            durationTick: 480,
            velocity: 80,
            origin: 'manual',
            protected: true,
          },
        ],
      },
    ],
    facts: [],
  };
  return songSchema.parse(song);
}

export function withSource(song: SongProject): SongProject {
  const copy = structuredClone(song);
  copy.sources.push({
    id: 'source-1',
    assetId: 'audio-1',
    filename: 'synthetic.wav',
    mediaType: 'audio/wav',
    durationSeconds: 10,
    origin: 'import',
  });
  copy.activeSourceId = 'source-1';
  copy.selection = { sourceId: 'source-1', startSeconds: 1, endSeconds: 8 };
  copy.analysis = {
    sourceId: 'source-1',
    inputs: { source: 0, selection: 0 },
    notes: [
      {
        id: 'detected-1',
        pitchMidi: 60,
        startSeconds: 1.13,
        durationSeconds: 0.58,
        reviewFlags: [],
      },
    ],
    candidateKeys: [],
    reviewFlags: ['needs-review'],
  };
  copy.workspace.reviewDraft = structuredClone(copy.lead);
  return songSchema.parse(copy);
}
