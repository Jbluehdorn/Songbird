import type { SongProject } from '@songbird/song-core';
import { ToolWorkspace, type StageDescription } from '../../components/ToolWorkspace';

const stages: readonly StageDescription[] = [
  {
    location: { tool: 'chord-finder', stage: 'entry' },
    label: 'Start here',
    heading: 'Find the backing for your idea.',
    description:
      'Start with a melody, or choose a key you want to explore. Neither path needs an existing chord progression.',
  },
  {
    location: { tool: 'chord-finder', stage: 'key' },
    label: 'Choose a key',
    heading: 'Choose a musical starting point.',
    description:
      'The key review will let you confirm or change the musical context without changing the notes you brought in.',
  },
  {
    location: { tool: 'chord-finder', stage: 'progression' },
    label: 'Build chords',
    heading: 'Give your melody somewhere to go.',
    description:
      'The progression editor will share its timed chords directly with the Harmonizer, inside the same working phrase.',
  },
];

export function ChordFinderPage({ stage, song }: { stage: string; song: SongProject }) {
  const active = stages.find((item) => item.location.stage === stage);
  if (!active) return <h1>This Chord Finder stage does not exist.</h1>;
  return (
    <ToolWorkspace
      active={active}
      stages={stages}
      entryHeading="A key or a melody. Your choice."
      entryCopy="Audio entry and the starting-key controls are not implemented yet. This workspace will use the same recording, timing, and phrase as the Harmonizer."
      alternate={{ tool: 'harmonizer', stage: song.workspace.stages.harmonizer }}
      alternateCopy="Return to your melody or harmony workspace without copying a progression or uploading the same recording twice."
      helpTopic="harmony"
    />
  );
}
