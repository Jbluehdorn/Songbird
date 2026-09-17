import { Link } from 'react-router';
import type { ToolLocation } from '@songbird/song-core';
import { toolNames, type LearningNavigationState } from '../app/routes';
import styles from '../styles/dashboard.module.css';

const tools = [
  { id: 'harmonizer', blurb: 'Add harmony to your melody.' },
  { id: 'chord-finder', blurb: 'Find a progression that fits.' },
] satisfies { id: ToolLocation['tool']; blurb: string }[];

function ToolIcon({ tool }: { tool: ToolLocation['tool'] }) {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={tool === 'harmonizer' ? 2.1 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {tool === 'harmonizer' ? (
        <path d="M4 12c7 0 7-6 14-6s7 6 14 6 7-6 12-6M4 26c7 0 7-6 14-6s7 6 14 6 7-6 12-6M4 40c7 0 7-6 14-6s7 6 14 6 7-6 12-6" />
      ) : (
        <>
          <rect x="4" y="8" width="40" height="32" rx="3" />
          <path d="M14 8v32M24 8v32M34 8v32" />
          <path d="M11 9h6v18h-6zM21 9h6v18h-6z" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}

export function Dashboard() {
  return (
    <div>
      <h1 className={styles.screenReaderOnly}>Songbird dashboard</h1>
      <nav className={styles.tools} aria-label="Songbird tools">
        {tools.map(({ id, blurb }) => (
          <Link
            key={id}
            className={styles.tile}
            data-tool={id}
            to={`/${id}`}
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-blurb`}
          >
            <ToolIcon tool={id} />
            <span className={styles.copy}>
              <strong id={`${id}-title`} className={styles.title}>
                {toolNames[id]}
              </strong>
              <span id={`${id}-blurb`} className={styles.blurb}>
                {blurb}
              </span>
            </span>
          </Link>
        ))}
      </nav>
      <div className={styles.learning}>
        <Link
          to="/learn"
          state={{ learningOrigin: 'dashboard' } satisfies LearningNavigationState}
        >
          Browse learning topics
        </Link>
      </div>
    </div>
  );
}
