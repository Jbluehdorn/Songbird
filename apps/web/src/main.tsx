import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { LocalSongRepository } from '@songbird/local-store';
import { App } from './app/App';
import { ShellSession } from './application/shell-session';
import { browserEditingLock } from './application/editing-lock';
import './styles/global.css';

function createSession() {
  return new ShellSession(
    new LocalSongRepository(),
    navigator.locks ? browserEditingLock(navigator.locks) : null,
  );
}
let session = createSession();
const container = document.getElementById('root');
if (!container) throw new Error('Songbird could not find its application root.');
const root = createRoot(container);
function openWorkspace() {
  root.render(
    <StrictMode>
      <BrowserRouter>
        <App session={session} />
      </BrowserRouter>
    </StrictMode>,
  );
  void session.start();
}
openWorkspace();

const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
  if (session.hasUnsavedWork()) {
    event.preventDefault();
    event.returnValue = '';
  }
};
const flushWhenHidden = () => {
  if (document.visibilityState === 'hidden') void session.flush();
};
const releaseOnPageHide = () => {
  void session.dispose();
};
const restoreFromPageCache = (event: PageTransitionEvent) => {
  if (event.persisted) {
    session = createSession();
    openWorkspace();
  }
};
window.addEventListener('beforeunload', warnBeforeLeaving);
document.addEventListener('visibilitychange', flushWhenHidden);
window.addEventListener('pagehide', releaseOnPageHide);
window.addEventListener('pageshow', restoreFromPageCache);
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener('beforeunload', warnBeforeLeaving);
    document.removeEventListener('visibilitychange', flushWhenHidden);
    window.removeEventListener('pagehide', releaseOnPageHide);
    window.removeEventListener('pageshow', restoreFromPageCache);
    void session.dispose();
  });
}
