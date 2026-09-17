import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSong, type SongProject } from '@songbird/song-core';
import {
  StorageConflictError,
  type SavedRevision,
  type SongRepository,
} from '@songbird/local-store';
import { ShellSession } from './shell-session';
import type { EditingLock } from './editing-lock';

class MemoryRepository implements SongRepository {
  document: SongProject | null = null;
  async load() {
    return structuredClone(this.document);
  }
  async readRaw() {
    return this.load();
  }
  async save(song: SongProject, expected: SavedRevision | null) {
    if (this.document && this.document.revision !== expected?.revision)
      throw new StorageConflictError();
    this.document = structuredClone(song);
  }
  close() {}
}

const sessions: ShellSession[] = [];
const lock: EditingLock = { acquire: async () => ({ release() {} }) };
function session(repo = new MemoryRepository(), editingLock: EditingLock | null = lock) {
  const result = new ShellSession(repo, editingLock, () => 'song', 60_000);
  sessions.push(result);
  return result;
}
afterEach(async () => {
  for (const item of sessions.splice(0)) await item.dispose();
  vi.restoreAllMocks();
});

describe('Shell coordinator', () => {
  it('creates exactly one song and acknowledges only a committed revision', async () => {
    const repo = new MemoryRepository();
    const runtime = session(repo);
    await Promise.all([runtime.start(), runtime.start()]);
    expect(runtime.store.getState()).toMatchObject({
      writable: true,
      saveState: 'saved',
      saved: { id: 'song', revision: 0 },
    });
    runtime.edit({ type: 'rename', name: 'New name' });
    expect(runtime.store.getState().saveState).toBe('unsaved');
    expect(repo.document!.name).toBe('');
    await runtime.flush();
    expect(repo.document!.name).toBe('New name');
    expect(runtime.store.getState().saved!.revision).toBe(1);
  });

  it('serializes an older in-flight save before saving newer edits', async () => {
    const repo = new MemoryRepository();
    const runtime = session(repo);
    await runtime.start();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const save = repo.save.bind(repo);
    const spy = vi.spyOn(repo, 'save').mockImplementationOnce(async (song, expected) => {
      await gate;
      await save(song, expected);
    });
    runtime.edit({ type: 'rename', name: 'First' });
    const pending = runtime.flush();
    runtime.edit({ type: 'rename', name: 'Second' });
    expect(runtime.store.getState().saved!.revision).toBe(0);
    release();
    await pending;
    expect(spy).toHaveBeenCalledTimes(2);
    expect(repo.document!.name).toBe('Second');
    expect(runtime.store.getState().saveState).toBe('saved');
  });

  it('retains in-memory changes and retries after a quota failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const repo = new MemoryRepository();
    const runtime = session(repo);
    await runtime.start();
    vi.spyOn(repo, 'save').mockRejectedValueOnce(
      new DOMException('Storage quota reached', 'QuotaExceededError'),
    );
    runtime.edit({ type: 'rename', name: 'Keep this idea' });
    await runtime.flush();
    expect(runtime.store.getState()).toMatchObject({
      saveState: 'failed',
      saved: { revision: 0 },
      song: { name: 'Keep this idea' },
    });
    expect(runtime.hasUnsavedWork()).toBe(true);
    await runtime.flush();
    expect(runtime.store.getState().saveState).toBe('saved');
  });

  it('stops stale writes while keeping unsaved data available for recovery', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const repo = new MemoryRepository();
    const runtime = session(repo);
    await runtime.start();
    repo.document!.revision = 9;
    runtime.edit({ type: 'rename', name: 'Unsaved work' });
    await runtime.flush();
    expect(runtime.store.getState()).toMatchObject({
      writable: false,
      saveState: 'failed',
      song: { name: 'Unsaved work' },
    });
    expect(runtime.hasUnsavedWork()).toBe(true);
    expect(await runtime.rawRecovery()).toMatchObject({ name: 'Unsaved work' });
  });

  it('opens a read-only snapshot when another tab holds the lock', async () => {
    const repo = new MemoryRepository();
    repo.document = createSong('existing');
    const runtime = session(repo, { acquire: async () => null });
    await runtime.start();
    expect(runtime.store.getState()).toMatchObject({
      writable: false,
      song: { id: 'existing' },
    });
    expect(runtime.edit({ type: 'rename', name: 'Not permitted' })).toBe(false);
    expect(repo.document.name).toBe('');
  });

  it('does not create a new document when required lock support is absent', async () => {
    const repo = new MemoryRepository();
    const runtime = session(repo, null);
    await runtime.start();
    expect(repo.document).toBeNull();
    expect(runtime.store.getState().readOnlyReason).toContain(
      'cannot provide the editing lock',
    );
  });

  it('does not replace persisted data when loading fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const repo = new MemoryRepository();
    repo.document = createSong('recover-me');
    vi.spyOn(repo, 'load').mockRejectedValueOnce(new Error('A recording is missing'));
    const runtime = session(repo);
    await runtime.start();
    expect(runtime.store.getState().phase).toBe('error');
    expect(repo.document.id).toBe('recover-me');
  });
});
