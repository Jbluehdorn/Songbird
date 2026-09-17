import { useEffect } from 'react';
import { useStore } from 'zustand';
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router';
import { displayName, type SongProject } from '@songbird/song-core';
import type { ShellSession } from '../application/shell-session';
import { Shell } from '../shell/Shell';
import { Dashboard } from '../shell/Dashboard';
import { HarmonizerPage } from '../features/harmonizer/HarmonizerPage';
import { ChordFinderPage } from '../features/chord-finder/ChordFinderPage';
import { LearnPage } from '../features/learn/LearnPage';
import { RecoveryDownload } from '../components/RecoveryDownload';
import { routeCommand } from './routes';
import styles from '../styles/workspace.module.css';

function ToolRoute({
  song,
  tool,
}: {
  song: SongProject;
  tool: 'harmonizer' | 'chord-finder';
}) {
  const { stage = 'entry' } = useParams();
  return tool === 'harmonizer' ? (
    <HarmonizerPage stage={stage} song={song} />
  ) : (
    <ChordFinderPage stage={stage} song={song} />
  );
}

function LessonRoute({ song }: { song: SongProject }) {
  const { topic } = useParams();
  return <LearnPage topic={topic} song={song} />;
}

export function App({ session }: { session: ShellSession }) {
  const state = useStore(session.store);
  const { pathname } = useLocation();
  const songId = state.song?.id;
  const songName = state.song ? displayName(state.song) : 'Songbird';
  const { phase, writable } = state;

  useEffect(() => {
    document.title = `${songName} - Songbird`;
  }, [songName]);

  useEffect(() => {
    if (phase !== 'ready' || !writable || !songId) return;
    const command = routeCommand(pathname);
    if (command) session.edit(command);
  }, [pathname, phase, writable, songId, session]);

  useEffect(() => {
    if (phase === 'ready') {
      document.getElementById('main-content')?.focus({ preventScroll: true });
    }
  }, [pathname, phase]);

  if (phase !== 'ready' || !state.song) {
    return (
      <main className={styles.bootstrap} aria-busy={phase === 'opening'}>
        <span className={styles.bootstrapBrand}>Songbird</span>
        <h1>
          {phase === 'opening'
            ? 'Opening your workspace...'
            : phase === 'error'
              ? 'Your saved song needs attention.'
              : 'The song is open in another tab.'}
        </h1>
        {phase === 'opening' ? (
          <div
            className={styles.loadingLines}
            role="status"
            aria-label="Loading local song"
          >
            <span />
            <span />
            <span />
          </div>
        ) : (
          <>
            <p role={phase === 'error' ? 'alert' : undefined}>
              {state.error ?? state.readOnlyReason}
            </p>
            <p>
              No stored data has been replaced. Close the editing tab if one is open, then
              retry.
            </p>
            <button className={styles.primaryButton} onClick={() => void session.start()}>
              Retry opening workspace
            </button>
            {phase === 'error' && <RecoveryDownload session={session} />}
          </>
        )}
      </main>
    );
  }
  const song = state.song;
  return (
    <Shell state={state} song={song} session={session}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/harmonizer"
          element={
            <Navigate to={`/harmonizer/${song.workspace.stages.harmonizer}`} replace />
          }
        />
        <Route
          path="/chord-finder"
          element={
            <Navigate
              to={`/chord-finder/${song.workspace.stages['chord-finder']}`}
              replace
            />
          }
        />
        <Route
          path="/harmonizer/:stage"
          element={<ToolRoute song={song} tool="harmonizer" />}
        />
        <Route
          path="/chord-finder/:stage"
          element={<ToolRoute song={song} tool="chord-finder" />}
        />
        <Route path="/learn" element={<LearnPage song={song} />} />
        <Route path="/learn/:topic" element={<LessonRoute song={song} />} />
        <Route
          path="*"
          element={
            <>
              <h1>This workspace page does not exist.</h1>
              <p>Your song is unchanged.</p>
              <Link to="/">Return to dashboard</Link>
            </>
          }
        />
      </Routes>
    </Shell>
  );
}
