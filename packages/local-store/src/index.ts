import Dexie, { type Table } from 'dexie';
import { SCHEMA_VERSION, songSchema, type SongProject } from '@songbird/song-core';

export const DATABASE_NAME = 'songbird';
export type SavedRevision = { id: string; revision: number };
export type AudioAsset = { id: string; blob: Blob };
type Snapshot = { slot: 'current'; document: unknown };

export class StorageConflictError extends Error {
  constructor() {
    super(
      'The saved song changed in another session. Your in-memory work is retained; download it before reopening the saved song.',
    );
    this.name = 'StorageConflictError';
  }
}

export function restoreDocument(value: unknown): SongProject {
  if (!value || typeof value !== 'object' || !('schemaVersion' in value)) {
    throw new Error(
      'The saved song has no readable schema version. Stored data has not been changed.',
    );
  }
  // Version 1 is the first production schema. Add explicit migrations here, never defaults.
  if (value.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(
      `Saved song schema ${String(value.schemaVersion)} is not supported by this build. Stored data has not been changed.`,
    );
  }
  const result = songSchema.safeParse(value);
  if (!result.success) {
    throw new Error(
      `The saved song needs recovery: ${result.error.issues.map((issue) => issue.message).join(' ')}`,
    );
  }
  return result.data;
}

export interface SongRepository {
  load(): Promise<SongProject | null>;
  save(
    song: SongProject,
    expected: SavedRevision | null,
    assets?: readonly AudioAsset[],
  ): Promise<void>;
  readRaw(): Promise<unknown>;
  close(): void;
}

export class SongbirdDatabase extends Dexie {
  snapshots!: Table<Snapshot, string>;
  audio!: Table<AudioAsset, string>;

  constructor(name = DATABASE_NAME) {
    super(name);
    this.version(1).stores({ snapshots: 'slot', audio: 'id' });
  }
}

export class LocalSongRepository implements SongRepository {
  readonly database: SongbirdDatabase;

  constructor(name = DATABASE_NAME) {
    this.database = new SongbirdDatabase(name);
  }

  async load(): Promise<SongProject | null> {
    return this.database.transaction(
      'r',
      this.database.snapshots,
      this.database.audio,
      async () => {
        const snapshot = await this.database.snapshots.get('current');
        if (!snapshot) return null;
        const song = restoreDocument(snapshot.document);
        for (const source of song.sources) await this.readAudio(source.assetId);
        return song;
      },
    );
  }

  async readAudio(id: string): Promise<Blob> {
    const asset = await this.database.audio.get(id);
    if (!asset || !(asset.blob instanceof Blob)) {
      throw new Error(
        `A locally saved recording (${id}) is unavailable. Stored song data has not been removed.`,
      );
    }
    return asset.blob;
  }

  async readRaw(): Promise<unknown> {
    return (await this.database.snapshots.get('current'))?.document ?? null;
  }

  async save(
    input: SongProject,
    expected: SavedRevision | null,
    assets: readonly AudioAsset[] = [],
  ): Promise<void> {
    const song = restoreDocument(input);
    await this.database.transaction(
      'rw',
      this.database.snapshots,
      this.database.audio,
      async () => {
        const snapshot = await this.database.snapshots.get('current');
        const previous = snapshot ? restoreDocument(snapshot.document) : null;
        if (
          (previous === null) !== (expected === null) ||
          (previous &&
            (!expected ||
              previous.id !== expected.id ||
              previous.revision !== expected.revision ||
              song.id !== previous.id ||
              song.revision <= previous.revision))
        ) {
          throw new StorageConflictError();
        }
        for (const asset of assets) {
          if (
            !asset.id ||
            !(asset.blob instanceof Blob) ||
            !song.sources.some((source) => source.assetId === asset.id)
          ) {
            throw new Error(
              'An audio asset is invalid or is not referenced by this song.',
            );
          }
          const existing = await this.database.audio.get(asset.id);
          if (existing)
            throw new Error(
              'Source audio is immutable. A replacement needs a new asset ID.',
            );
          await this.database.audio.add(asset);
        }
        for (const source of song.sources) await this.readAudio(source.assetId);
        await this.database.snapshots.put({ slot: 'current', document: song });
      },
    );
  }

  close(): void {
    this.database.close();
  }
}
