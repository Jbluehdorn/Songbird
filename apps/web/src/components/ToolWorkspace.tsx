import { Link, NavLink } from 'react-router';
import type { ToolLocation } from '@songbird/song-core';
import { toolNames, toolPath, type LearningNavigationState } from '../app/routes';
import styles from '../styles/workspace.module.css';

export type StageDescription = {
  location: ToolLocation;
  label: string;
  heading: string;
  description: string;
};

export function ToolWorkspace({
  active,
  stages,
  entryHeading,
  entryCopy,
  alternate,
  alternateCopy,
  helpTopic,
}: {
  active: StageDescription;
  stages: readonly StageDescription[];
  entryHeading: string;
  entryCopy: string;
  alternate: ToolLocation;
  alternateCopy: string;
  helpTopic: 'keys' | 'harmony';
}) {
  const entry = active.location.stage === 'entry';
  return (
    <div data-tool={active.location.tool}>
      <div className={styles.pageHeading}>
        <h1>{active.heading}</h1>
        <p>{active.description}</p>
      </div>
      <nav
        className={styles.stages}
        aria-label={`${toolNames[active.location.tool]} stages`}
      >
        {stages.map((stage) => (
          <NavLink
            key={stage.location.stage}
            to={toolPath(stage.location)}
            className={({ isActive }) => (isActive ? styles.activeStage : styles.stage)}
          >
            {stage.label}
          </NavLink>
        ))}
      </nav>
      <section className={styles.workspace} aria-labelledby="workspace-title">
        <div className={styles.emptyWork}>
          <div className={styles.blankStaff} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h2 id="workspace-title">
            {entry ? entryHeading : `${active.label} comes next.`}
          </h2>
          <p>
            {entry ? entryCopy : 'This stage is not implemented in the Shell foundation.'}
          </p>
          {entry && (
            <div className={styles.futureActions}>
              <button disabled className={styles.secondaryButton}>
                Import WAV or MP3
              </button>
              <button disabled className={styles.secondaryButton}>
                {active.location.tool === 'harmonizer'
                  ? 'Record a melody'
                  : 'Choose a starting key'}
              </button>
            </div>
          )}
          <span className={styles.unavailable}>
            Musical tools are not available in this build
          </span>
        </div>
        <div className={styles.handoff}>
          <div>
            <h2>
              {active.location.tool === 'harmonizer'
                ? 'Chords are optional.'
                : 'The same song, another way in.'}
            </h2>
            <p>{alternateCopy}</p>
          </div>
          <Link className={styles.textLink} to={toolPath(alternate)}>
            Open {toolNames[alternate.tool]} <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </section>
      <div className={styles.helpStrip}>
        <p>A little theory, only when you want it.</p>
        <Link
          to={`/learn/${helpTopic}`}
          state={{ learningOrigin: active.location } satisfies LearningNavigationState}
        >
          {helpTopic === 'keys' ? 'What is a key?' : 'How do harmony parts work?'}
        </Link>
      </div>
    </div>
  );
}
