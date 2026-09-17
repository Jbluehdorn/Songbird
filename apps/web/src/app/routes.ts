import {
  lessonSchema,
  locationSchema,
  type SongCommand,
  type ToolLocation,
} from '@songbird/song-core';

export const toolNames = { harmonizer: 'Harmonizer', 'chord-finder': 'Chord Finder' };

export type LearningOrigin = 'dashboard' | ToolLocation;
export type LearningNavigationState = { learningOrigin: LearningOrigin };

export function toolPath(location: ToolLocation): string {
  return `/${location.tool}/${location.stage}`;
}

export function readLearningOrigin(state: unknown): LearningOrigin | undefined {
  if (!state || typeof state !== 'object' || !('learningOrigin' in state)) {
    return undefined;
  }
  if (state.learningOrigin === 'dashboard') return 'dashboard';
  const location = locationSchema.safeParse(state.learningOrigin);
  return location.success ? location.data : undefined;
}

export function routeCommand(pathname: string): SongCommand | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] === 'learn' && segments.length <= 2) {
    if (!segments[1]) return { type: 'open-help', lesson: null };
    const lesson = lessonSchema.safeParse(segments[1]);
    return lesson.success ? { type: 'open-help', lesson: lesson.data } : null;
  }
  if (segments.length !== 2) return null;
  const location = locationSchema.safeParse({ tool: segments[0], stage: segments[1] });
  return location.success ? { type: 'navigate', location: location.data } : null;
}
