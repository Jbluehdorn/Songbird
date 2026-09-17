import { afterEach, describe, expect, it } from 'vitest';
import { createSong } from '@songbird/song-core';
import { LocalSongRepository, StorageConflictError } from './index';
import { arrangedSong, withSource } from '../../../tests/fixtures/song';

const repositories: LocalSongRepository[] = [];
function repository() {
  const result = new LocalSongRepository(`songbird-test-${crypto.randomUUID()}`);
  repositories.push(result);
  return result;
}
afterEach(async () => {
  for (const repo of repositories.splice(0)) await repo.database.delete();
});

describe('transactional local recovery', () => {
  it('round-trips the full song, raw draft, and original source blob', async () => {
    const repo = repository();
    const song = withSource(arrangedSong());
    await repo.save(song, null, [
      { id: 'audio-1', blob: new Blob(['synthetic bytes'], { type: 'audio/wav' }) },
    ]);
    expect(await repo.load()).toEqual(song);
    expect(await (await repo.readAudio('audio-1')).text()).toBe('synthetic bytes');
  });

  it('checks the stored revision and stable project identity', async () => {
    const repo = repository();
    const song = createSong('a');
    await repo.save(song, null);
    await expect(
      repo.save({ ...song, revision: 2 }, { id: 'a', revision: 1 }),
    ).rejects.toBeInstanceOf(StorageConflictError);
    await expect(
      repo.save({ ...song, id: 'b', revision: 1 }, { id: 'a', revision: 0 }),
    ).rejects.toBeInstanceOf(StorageConflictError);
    expect(await repo.load()).toEqual(song);
  });

  it('allows only one initial current-song transaction to win', async () => {
    const repo = repository();
    const results = await Promise.allSettled([
      repo.save(createSong('a'), null),
      repo.save(createSong('b'), null),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(await repo.database.snapshots.count()).toBe(1);
  });

  it('rolls back a new audio blob when the document transaction fails', async () => {
    const repo = repository();
    const song = withSource(arrangedSong());
    song.sources.push({ ...song.sources[0]!, id: 'second', assetId: 'missing' });
    await expect(
      repo.save(song, null, [{ id: 'audio-1', blob: new Blob(['synthetic']) }]),
    ).rejects.toThrow('unavailable');
    expect(await repo.database.audio.count()).toBe(0);
    expect(await repo.load()).toBeNull();
  });

  it('does not reset a corrupt or newer-version snapshot', async () => {
    const repo = repository();
    const future = { ...createSong('future'), schemaVersion: 99 };
    await repo.database.snapshots.put({ slot: 'current', document: future });
    await expect(repo.load()).rejects.toThrow('not supported');
    await expect(repo.save(createSong('new'), null)).rejects.toThrow('not supported');
    expect(await repo.readRaw()).toEqual(future);
  });

  it('reports missing source blobs rather than substituting empty music', async () => {
    const repo = repository();
    const song = withSource(arrangedSong());
    await repo.database.snapshots.put({ slot: 'current', document: song });
    await expect(repo.load()).rejects.toThrow('unavailable');
    expect(await repo.readRaw()).toEqual(song);
  });
});
