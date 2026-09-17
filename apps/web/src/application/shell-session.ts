import { createStore } from 'zustand/vanilla';
import {
  commitEdit,
  createSong,
  type SongCommand,
  type SongProject,
} from '@songbird/song-core';
import {
  StorageConflictError,
  type SavedRevision,
  type SongRepository,
} from '@songbird/local-store';
import type { EditingLease, EditingLock } from './editing-lock';

export type ShellState = {
  phase: 'opening' | 'ready' | 'error';
  song: SongProject | null;
  writable: boolean;
  readOnlyReason: string | null;
  saved: SavedRevision | null;
  saveState: 'unsaved' | 'saving' | 'saved' | 'failed';
  error: string | null;
  editError: string | null;
};

export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'An unexpected storage error occurred. Your work has not been discarded.';
}

export class ShellSession {
  readonly store = createStore<ShellState>(() => ({
    phase: 'opening',
    song: null,
    writable: false,
    readOnlyReason: null,
    saved: null,
    saveState: 'unsaved',
    error: null,
    editError: null,
  }));
  private lease: EditingLease | null = null;
  private opening: Promise<void> | null = null;
  private saving: Promise<void> | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private disposed = false;

  constructor(
    private readonly repository: SongRepository,
    private readonly lock: EditingLock | null,
    private readonly createId: () => string = () => crypto.randomUUID(),
    private readonly saveDelay = 250,
  ) {}

  start(): Promise<void> {
    if (this.opening) return this.opening;
    if (this.disposed) return Promise.resolve();
    this.opening = this.open().finally(() => {
      this.opening = null;
    });
    return this.opening;
  }

  private async open(): Promise<void> {
    this.store.setState({ phase: 'opening', error: null });
    try {
      this.lease ??= this.lock ? await this.lock.acquire() : null;
      if (this.disposed) {
        this.lease?.release();
        return;
      }
      const stored = await this.repository.load();
      if (this.disposed) return;
      const writable = this.lease !== null;
      let song = stored ?? (writable ? createSong(this.createId()) : null);
      const saved = stored ? { id: stored.id, revision: stored.revision } : null;
      if (writable && song?.workspace.jobs.some((job) => job.status === 'running')) {
        const recovered = commitEdit(song, { type: 'interrupt-jobs' }, song.revision);
        if (!recovered.ok) throw new Error(recovered.message);
        song = recovered.song;
      }
      this.store.setState({
        phase: 'ready',
        song,
        saved,
        writable,
        readOnlyReason: writable
          ? null
          : this.lock
            ? 'Another tab is editing this song. This tab is a read-only snapshot; navigation here is not saved.'
            : 'This browser cannot provide the editing lock Songbird requires. Use a current Chrome or Edge browser. Saved data remains available to read.',
        saveState: saved && song?.revision === saved.revision ? 'saved' : 'unsaved',
      });
      if (writable && this.hasUnsavedWork()) await this.flush();
    } catch (error) {
      console.error('Songbird could not open local recovery:', error);
      this.lease?.release();
      this.lease = null;
      if (!this.disposed) {
        this.store.setState({
          phase: 'error',
          writable: false,
          error: errorMessage(error),
        });
      }
    }
  }

  edit(command: SongCommand): boolean {
    const state = this.store.getState();
    if (!state.writable || !state.song || state.phase !== 'ready') {
      this.store.setState({
        editError:
          'This tab cannot edit the song. Open the editing tab or retry the editing lock.',
      });
      return false;
    }
    const result = commitEdit(state.song, command, state.song.revision);
    if (!result.ok) {
      this.store.setState({ editError: result.message });
      return false;
    }
    if (result.song === state.song) return true;
    this.store.setState({
      song: result.song,
      saveState: state.saveState === 'failed' ? 'failed' : 'unsaved',
      editError: null,
    });
    if (state.saveState !== 'failed') {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        void this.flush();
      }, this.saveDelay);
    }
    return true;
  }

  hasUnsavedWork(): boolean {
    const { song, saved, writable, saveState } = this.store.getState();
    return Boolean(
      song &&
      (writable || saveState === 'failed') &&
      (song.id !== saved?.id || song.revision !== saved.revision),
    );
  }

  flush(): Promise<void> {
    clearTimeout(this.timer);
    if (this.saving) return this.saving;
    if (this.disposed) return Promise.resolve();
    this.saving = this.savePending().finally(() => {
      this.saving = null;
    });
    return this.saving;
  }

  private async savePending(): Promise<void> {
    while (!this.disposed && this.store.getState().writable && this.hasUnsavedWork()) {
      const { song, saved } = this.store.getState();
      if (!song) return;
      this.store.setState({ saveState: 'saving', error: null });
      try {
        await this.repository.save(song, saved);
        if (this.disposed) return;
        const current = this.store.getState().song;
        this.store.setState({
          saved: { id: song.id, revision: song.revision },
          saveState: current?.revision === song.revision ? 'saved' : 'unsaved',
        });
      } catch (error) {
        console.error('Songbird local save failed:', error);
        if (this.disposed) return;
        const conflict = error instanceof StorageConflictError;
        if (conflict) {
          this.lease?.release();
          this.lease = null;
        }
        this.store.setState({
          saveState: 'failed',
          error: errorMessage(error),
          ...(conflict
            ? {
                writable: false,
                readOnlyReason:
                  'Saving stopped because the stored song changed. Download your in-memory data before reopening.',
              }
            : {}),
        });
        return;
      }
    }
  }

  async rawRecovery(): Promise<unknown> {
    return this.store.getState().song ?? this.repository.readRaw();
  }

  async dispose(): Promise<void> {
    clearTimeout(this.timer);
    this.disposed = true;
    this.store.setState({ writable: false });
    this.lease?.release();
    this.lease = null;
    await this.saving;
    await this.opening;
    this.repository.close();
  }
}
