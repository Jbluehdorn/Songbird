import { useState } from 'react';
import { errorMessage, type ShellSession } from '../application/shell-session';
import styles from '../styles/workspace.module.css';

export function RecoveryDownload({ session }: { session: ShellSession }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const document = await session.rawRecovery();
      if (document === null)
        throw new Error('No saved song data is available to download.');
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(document, null, 2)], {
          type: 'application/json',
        }),
      );
      const link = window.document.createElement('a');
      link.href = url;
      link.download = 'songbird-recovery.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      console.error('Songbird recovery download failed:', cause);
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        className={styles.secondaryButton}
        disabled={busy}
        onClick={() => void download()}
      >
        {busy ? 'Preparing download...' : 'Download song data'}
      </button>
      <p className={styles.finePrint}>
        Recovery JSON only. Audio files are not included.
      </p>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
