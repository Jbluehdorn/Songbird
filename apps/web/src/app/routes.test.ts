import { describe, expect, it } from 'vitest';
import { readLearningOrigin, routeCommand } from './routes';

describe('dashboard and learning navigation', () => {
  it('opens the dashboard without rewriting the saved tool workspace', () => {
    expect(routeCommand('/')).toBeNull();
    expect(readLearningOrigin({ learningOrigin: 'dashboard' })).toBe('dashboard');
  });

  it('recognizes the visible tool stage carried by contextual help links', () => {
    expect(
      readLearningOrigin({
        learningOrigin: { tool: 'chord-finder', stage: 'progression' },
      }),
    ).toEqual({ tool: 'chord-finder', stage: 'progression' });
  });

  it('only accepts dashboard or validated tool origins from browser history', () => {
    expect(readLearningOrigin(null)).toBeUndefined();
    expect(readLearningOrigin({ learningOrigin: 'https://example.com' })).toBeUndefined();
    expect(
      readLearningOrigin({
        learningOrigin: { tool: 'harmonizer', stage: 'progression' },
      }),
    ).toBeUndefined();
    expect(
      readLearningOrigin({ learningOrigin: { tool: 'harmonizer', stage: 'review' } }),
    ).toEqual({ tool: 'harmonizer', stage: 'review' });
    expect(routeCommand('/harmonizer/missing')).toBeNull();
  });
});
