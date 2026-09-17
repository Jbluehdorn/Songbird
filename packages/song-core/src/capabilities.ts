import type {
  AnalysisDraft,
  HarmonyArrangement,
  InputStamp,
  SongProject,
  SourceAudio,
} from './model';

export type CapabilityResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      code: 'unavailable' | 'cancelled' | 'invalid-input' | 'failed';
      message: string;
    };

export interface MediaCapability {
  importAudio(input: {
    bytes: Uint8Array;
    mediaType: string;
    filename: string;
  }): Promise<CapabilityResult<SourceAudio>>;
  capture(): Promise<CapabilityResult<SourceAudio>>;
}

export interface AnalysisCapability {
  analyze(
    input: {
      sourceId: string;
      startSeconds: number;
      endSeconds: number;
      revisions: InputStamp;
    },
    signal: AbortSignal,
  ): Promise<CapabilityResult<AnalysisDraft>>;
}

export interface HarmonyCapability {
  preview(
    song: Readonly<SongProject>,
    signal: AbortSignal,
  ): Promise<CapabilityResult<HarmonyArrangement>>;
}

export interface PlaybackCapability {
  audition(input: {
    song: Readonly<SongProject>;
    owner: 'song' | 'lesson' | 'source';
  }): Promise<CapabilityResult<void>>;
  stop(): void;
}

export interface MidiCapability {
  exportVoices(input: {
    song: Readonly<SongProject>;
    voiceIds: readonly string[];
    combined: boolean;
  }): Promise<CapabilityResult<readonly { filename: string; bytes: Uint8Array }[]>>;
}
