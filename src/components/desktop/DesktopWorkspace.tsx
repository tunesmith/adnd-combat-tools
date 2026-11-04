import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import CampaignSnapshots from './CampaignSnapshots';
import type {
  DocumentCommand,
  DocumentState,
} from '../../types/campaignStorage';
import styles from './desktopWorkspace.module.css';

export default function DesktopWorkspace() {
  const [state, setState] = useState<DocumentState | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const savedSignature = useRef<string | null>(null);
  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    const receive = (next: DocumentState) => {
      if (disposed) return;
      if (!next.dirty)
        savedSignature.current = next.document
          ? JSON.stringify(next.document)
          : null;
      setState(next);
    };
    void import('../../helpers/tauriCampaignStorage')
      .then(async ({ createTauriStorage }) => {
        const storage = window.campaignStorage || (await createTauriStorage());
        if (disposed) return;
        if (!storage) {
          setConnectionError('Native bridge unavailable');
          return;
        }
        window.campaignStorage = storage;
        unsubscribe = storage.subscribe(receive);
        receive(await storage.getState());
      })
      .catch((error: unknown) => setConnectionError(String(error)));
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, []);
  if (!state)
    return connectionError ? (
      <p role="alert">Unable to open campaign workspace: {connectionError}</p>
    ) : null;
  const command = (action: DocumentCommand) => {
    void window.campaignStorage
      ?.command(action)
      .catch((error: unknown) =>
        setState((current) => current && { ...current, error: String(error) })
      );
  };
  const edit = (title: string, notes: string) => {
    if (!state.document) return;
    const document = { ...state.document, title, notes };
    const dirty = JSON.stringify(document) !== savedSignature.current;
    setState({
      ...state,
      document,
      token: state.token + 1,
      dirty,
      status: dirty ? 'Unsaved changes' : 'No unsaved changes',
      error: null,
    });
    void window.campaignStorage?.edit(title, notes).catch((error: unknown) => {
      setState(
        (current) =>
          current && {
            ...current,
            error: error instanceof Error ? error.message : 'Edit failed',
          }
      );
    });
  };
  return (
    <section className={styles['workspace']} aria-label="Campaign workspace">
      <header className={styles['header']}>
        <strong>
          AD&amp;D Tools{' '}
          <span className={styles['edition']}>Personal desktop</span>
        </strong>
        <nav aria-label="Tools">
          <Link href="/">All tools</Link>
          <Link href="/tracker">Tracker</Link>
          <Link href="/encumbrance">Encumbrance</Link>
          <Link href="/calculator">Calculator</Link>
        </nav>
      </header>
      <div className={styles['toolbar']}>
        {!state.document && (
          <>
            <button disabled={state.busy} onClick={() => command('new')}>
              New campaign
            </button>
            <button disabled={state.busy} onClick={() => command('open')}>
              Open…
            </button>
            {state.recentPath && (
              <button
                disabled={state.busy}
                title={state.recentPath}
                onClick={() => command('reopen')}
              >
                Reopen last
              </button>
            )}
          </>
        )}
        <span role="status">
          {state.busy ? 'Working…' : state.status}
          {state.dirty ? ' •' : ''}
        </span>
      </div>
      {state.error && (
        <p role="alert" className={styles['error']}>
          {state.error}
        </p>
      )}
      {state.document ? (
        <details open className={styles['editor']}>
          <summary>
            {state.document.title || 'Untitled campaign'}
            {state.dirty ? ' — unsaved' : ''}
          </summary>
          <label>
            Campaign title
            <input
              maxLength={1000}
              disabled={state.busy}
              value={state.document.title}
              onChange={(event) =>
                edit(event.target.value, state.document?.notes || '')
              }
            />
          </label>
          <label>
            Notes
            <textarea
              maxLength={1_000_000}
              disabled={state.busy}
              rows={4}
              value={state.document.notes}
              onChange={(event) =>
                edit(state.document?.title || '', event.target.value)
              }
            />
          </label>
          <CampaignSnapshots
            key={state.document.id}
            document={state.document}
            token={state.token}
            busy={state.busy}
          />
          <small>{state.path || 'Choose a location with Save As.'}</small>
        </details>
      ) : (
        <p className={styles['empty']}>
          Create or open a local campaign to keep a title and notes alongside
          your tools.
        </p>
      )}
    </section>
  );
}
