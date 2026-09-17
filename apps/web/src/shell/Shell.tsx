import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { displayName, type SongProject } from '@songbird/song-core';
import type { ShellSession, ShellState } from '../application/shell-session';
import { RecoveryDownload } from '../components/RecoveryDownload';
import styles from '../styles/workspace.module.css';

function ContextDetails({ song }: { song: SongProject }) {
  return (
    <dl>
      <div>
        <dt>Key</dt>
        <dd>
          {song.key
            ? `${song.key.spelling} ${song.key.quality.replace('-', ' ')}`
            : 'Not chosen'}
        </dd>
      </div>
      <div>
        <dt>Timing</dt>
        <dd>
          {song.timing
            ? `${song.timing.meter} / ${song.timing.displayBpm} ${song.timing.meter === '6/8' ? 'dotted-quarter' : 'quarter-note'} BPM${song.timing.confirmed ? '' : ' (unconfirmed)'}`
            : 'Not confirmed'}
        </dd>
      </div>
      <div>
        <dt>Phrase</dt>
        <dd>{song.phrase ? 'Working phrase retained' : 'Not selected'}</dd>
      </div>
      <div>
        <dt>Recording</dt>
        <dd>
          {song.activeSourceId
            ? (song.sources.find((source) => source.id === song.activeSourceId)
                ?.filename ?? 'Recorded melody')
            : 'No recording yet'}
        </dd>
      </div>
    </dl>
  );
}

function ContextToggle({
  expanded,
  mobile = false,
  onToggle,
}: {
  expanded: boolean;
  mobile?: boolean;
  onToggle: () => void;
}) {
  const label = expanded ? 'Collapse sidebar' : 'Expand sidebar';
  return (
    <button
      type="button"
      className={styles.contextToggle}
      data-mobile={mobile}
      aria-label={label}
      title={label}
      aria-expanded={expanded}
      aria-controls={mobile ? 'mobile-shared-song-context' : 'shared-song-context'}
      onClick={onToggle}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}

export function Shell({
  state,
  song,
  session,
  children,
}: {
  state: ShellState;
  song: SongProject;
  session: ShellSession;
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileContextExpanded, setMobileContextExpanded] = useState(false);
  const isDashboard = pathname === '/';
  return (
    <div className={styles.app}>
      <a href="#main-content" className={styles.skip}>
        Skip to workspace
      </a>
      <header className={styles.header}>
        <Link className={styles.brand} to="/" aria-label="Songbird dashboard">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M7 22c5 0 9-3 10-9l2-7 6 2-5 3c0 9-5 16-13 16z" />
            <path d="M8 19 3 12l12 5" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          Songbird
        </Link>
        <div className={styles.songIdentity}>
          <label htmlFor="song-name">Song name</label>
          <div className={styles.songNameField}>
            <input
              id="song-name"
              title={state.writable ? 'Edit song name' : undefined}
              value={song.name}
              placeholder="Untitled song"
              maxLength={160}
              autoComplete="off"
              disabled={!state.writable}
              onChange={(event) =>
                session.edit({ type: 'rename', name: event.target.value })
              }
            />
            {state.writable && (
              <svg
                className={styles.songNameIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 5 4 4-11 11H4v-4Z" />
                <path d="m15 5 2-2a2.8 2.8 0 0 1 4 4l-2 2" />
              </svg>
            )}
          </div>
        </div>
      </header>
      <div
        className={isDashboard ? styles.dashboardLayout : styles.layout}
        data-sidebar-collapsed={sidebarCollapsed}
      >
        {!isDashboard && (
          <aside className={styles.sidebar} aria-label="Shared song context">
            <div className={styles.sidebarControls}>
              <Link
                to="/"
                className={styles.dashboardLink}
                aria-label="Back to dashboard"
                title="Back to dashboard"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M19 12H5m6-6-6 6 6 6" />
                </svg>
                <span className={styles.dashboardLinkText}>Dashboard</span>
              </Link>
              <ContextToggle
                expanded={!sidebarCollapsed}
                onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
              />
              <ContextToggle
                mobile
                expanded={mobileContextExpanded}
                onToggle={() => setMobileContextExpanded((expanded) => !expanded)}
              />
            </div>
            <section
              id="shared-song-context"
              className={styles.context}
              aria-labelledby="context-heading"
              hidden={sidebarCollapsed}
            >
              <h2 id="context-heading">Shared song context</h2>
              <ContextDetails song={song} />
            </section>
            <section
              id="mobile-shared-song-context"
              className={styles.mobileContext}
              aria-labelledby="mobile-context-heading"
              hidden={!mobileContextExpanded}
            >
              <h2 id="mobile-context-heading">Shared song context</h2>
              <ContextDetails song={song} />
            </section>
          </aside>
        )}
        <main
          id="main-content"
          className={`${styles.main}${isDashboard ? ` ${styles.dashboardMain}` : ''}`}
          tabIndex={-1}
        >
          {!state.writable && (
            <section
              className={styles.notice}
              role="status"
              aria-label="Read-only workspace"
            >
              <h2>This tab is read-only.</h2>
              <p>{state.readOnlyReason}</p>
              {!session.hasUnsavedWork() && (
                <button
                  className={styles.secondaryButton}
                  onClick={() => void session.start()}
                >
                  Try editing here
                </button>
              )}
            </section>
          )}
          {state.saveState === 'failed' && (
            <section className={styles.errorNotice} role="alert">
              <h2>Your latest changes are not saved.</h2>
              <p>{state.error}</p>
              <p>
                Keep this tab open. Closing it may lose changes since the last successful
                save.
              </p>
              <div className={styles.recoveryActions}>
                {state.writable && (
                  <button
                    className={styles.primaryButton}
                    onClick={() => void session.flush()}
                  >
                    Retry saving
                  </button>
                )}
                <RecoveryDownload session={session} />
              </div>
            </section>
          )}
          {state.editError && (
            <p role="alert" className={styles.errorNotice}>
              {state.editError}
            </p>
          )}
          {song.workspace.jobs.some((job) => job.status === 'interrupted') && (
            <section className={styles.notice}>
              <h2>Processing was interrupted.</h2>
              <p>
                Your accepted music and review drafts are retained. Retry when the
                relevant processing capability is available.
              </p>
            </section>
          )}
          {children}
          {!isDashboard && (
            <footer className={styles.footer}>
              <span title={displayName(song)}>{displayName(song)}</span>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}
