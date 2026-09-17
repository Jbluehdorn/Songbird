import type { SongProject } from '@songbird/song-core';
import { ToolWorkspace, type StageDescription } from '../../components/ToolWorkspace';

const harmonyStages: readonly StageDescription[] = [
  {
    location: { tool: 'harmonizer', stage: 'entry' },
    label: 'Bring an idea',
    heading: 'Start with your melody.',
    description:
      'A hum, a voice memo, a tune you keep coming back to. You will not need a key, tempo, or chords to begin.',
  },
  {
    location: { tool: 'harmonizer', stage: 'review' },
    label: 'Review melody',
    heading: 'Keep the melody you meant.',
    description:
      'The melody review will make detected notes yours to hear, align, and correct before adding harmony.',
  },
  {
    location: { tool: 'harmonizer', stage: 'builder' },
    label: 'Build harmony',
    heading: 'Make room for another voice.',
    description:
      'The harmony builder will offer reversible alternatives around your lead, with or without chords.',
  },
  {
    location: { tool: 'harmonizer', stage: 'export' },
    label: 'Export',
    heading: 'Take your parts with you.',
    description:
      'MIDI export will preserve your accepted notes, voice identities, and shared musical timing.',
  },
];

export function HarmonizerPage({ stage, song }: { stage: string; song: SongProject }) {
  const active = harmonyStages.find((item) => item.location.stage === stage);
  if (!active) return <h1>This Harmonizer stage does not exist.</h1>;
  return (
    <ToolWorkspace
      active={active}
      stages={harmonyStages}
      entryHeading="Your idea goes here."
      entryCopy="Recording and import are the next shared-media step. For now, give this song a name and explore its workspace. The Shell keeps your place."
      alternate={{ tool: 'chord-finder', stage: song.workspace.stages['chord-finder'] }}
      alternateCopy="You will be able to build harmony from a confirmed key and scale alone, or shape a progression in Chord Finder."
      helpTopic="keys"
    />
  );
}
