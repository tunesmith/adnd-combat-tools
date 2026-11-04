import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import CampaignSnapshots from './CampaignSnapshots';
import CampaignHistory from './CampaignHistory';
import EncumbranceApp from '../encumbrance/EncumbranceApp';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import {
  captureInventoryCheckpoint,
  changeWorkingInventory,
  emptyWorkingInventory,
  startWorkingInventory,
} from '../../helpers/campaignWorkingInventory';
import type {
  WorkspaceView,
  WorkingInventory,
} from '../../helpers/campaignWorkingInventory';
import type { EncumbranceDmDocumentV9 } from '../../types/encumbrance';
import type {
  DocumentState,
  DocumentCommand,
} from '../../types/campaignStorage';
import styles from './campaignWorkspace.module.css';
const uid = () => crypto.randomUUID();
export default function DesktopWorkspace({
  children,
}: {
  children?: ReactNode;
}) {
  const [state, setState] = useState<DocumentState | null>(null);
  const current = useRef<DocumentState | null>(null);
  const pending = useRef(0);
  const needsEditorReset = useRef(false);
  const editorVersionRef = useRef(0);
  const [editorVersion, setEditorVersion] = useState(0);
  const resetEditor = useCallback(() => {
    editorVersionRef.current += 1;
    setEditorVersion(editorVersionRef.current);
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [sessionLabel, setSessionLabel] = useState('');
  const [checkpointLabel, setCheckpointLabel] = useState('');
  const receive = useCallback(
    (next: DocumentState) => {
      if (current.current?.epoch !== next.epoch) {
        pending.current = 0;
        needsEditorReset.current = false;
        setError(null);
        current.current = next;
        setState(next);
        return;
      }
      if (pending.current === 0) {
        if (needsEditorReset.current) {
          needsEditorReset.current = false;
          resetEditor();
        }
        current.current = next;
        setState(next);
      }
    },
    [resetEditor]
  );
  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    void import('../../helpers/tauriCampaignStorage')
      .then(async ({ createTauriStorage }) => {
        const storage = window.campaignStorage || (await createTauriStorage());
        if (!storage || disposed) return;
        window.campaignStorage = storage;
        unsubscribe = storage.subscribe((next) => {
          if (!disposed) receive(next);
        });
        const next = await storage.getState();
        if (!disposed) receive(next);
      })
      .catch((e) => setError(String(e)));
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [receive]);
  function mutate(
    change: (document: CampaignDocument) => CampaignDocument,
    owner = current.current
  ) {
    if (!owner?.document || !window.campaignStorage) return false;
    const id = owner.document.id,
      epoch = owner.epoch;
    if (current.current?.epoch !== epoch || current.current.document?.id !== id)
      return false;
    try {
      const next = change(current.current.document);
      pending.current += 1;
      setError(null);
      const optimistic = {
        ...current.current,
        document: next,
        dirty: true,
        status: 'Unsaved campaign changes',
      };
      current.current = optimistic;
      setState(optimistic);
      void window.campaignStorage
        .mutate(id, epoch, change)
        .then((accepted) => {
          if (
            current.current?.epoch !== epoch ||
            current.current.document?.id !== id
          )
            return;
          pending.current = Math.max(0, pending.current - 1);
          if (accepted && pending.current === 0) {
            setError(null);
            receive(accepted);
          }
        })
        .catch((e) => {
          if (current.current?.epoch === epoch) {
            pending.current = Math.max(0, pending.current - 1);
            needsEditorReset.current = true;
            setError(String(e));
          }
        });
      return true;
    } catch (e) {
      needsEditorReset.current = true;
      setError(String(e));
      return false;
    }
  }
  function navigate(view: WorkspaceView) {
    mutate((d) => ({ ...d, workspace: { ...d.workspace, view } }));
  }
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (
        !event.metaKey ||
        event.defaultPrevented ||
        !event.altKey ||
        event.isComposing
      )
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest(
          'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]'
        )
      )
        return;
      const views: Record<string, WorkspaceView> = {
        '1': 'possessions',
        '2': 'combats',
        '3': 'history',
        '4': 'details',
      };
      const view = views[event.code.replace('Digit', '')];
      if (view && current.current?.document) {
        event.preventDefault();
        navigate(view);
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });
  const command = (action: DocumentCommand) => {
    void window.campaignStorage
      ?.command(action)
      .catch((e) => setError(String(e)));
  };
  const document = state?.document;
  const sessionId =
    document?.workspace.sessionId || document?.sessions[0]?.id || '';
  const view = document?.workspace.view || 'possessions';
  const working = document?.workingInventories.find(
    (w) => w.sessionId === sessionId
  );
  function start(
    inventory: EncumbranceDmDocumentV9,
    origin: WorkingInventory['origin']
  ) {
    const id = uid(),
      checkpointId = uid(),
      at = new Date().toISOString();
    mutate((d) => ({
      ...startWorkingInventory(
        d,
        sessionId,
        inventory,
        origin,
        id,
        checkpointId,
        at
      ),
      workspace: { sessionId, view: 'possessions' },
    }));
  }
  const scope = state;
  return (
    <div className={styles['shell']}>
      <header className={styles['header']}>
        <div>
          <small>AD&amp;D TOOLS · CAMPAIGN WORKSPACE</small>
          <h1>{document?.title || 'Open a campaign'}</h1>
        </div>
        <div className={styles['status']} role="status">
          {state?.busy
            ? 'Working…'
            : pending.current
            ? 'Applying edits…'
            : state?.status || 'Opening workspace…'}
          {state?.dirty ? ' •' : ''}
        </div>
      </header>
      {(error || state?.error) && (
        <div role="alert" className={styles['error']}>
          {error || state?.error}
          {error && needsEditorReset.current && (
            <button
              onClick={() => {
                void window.campaignStorage
                  ?.discardRejectedEdits()
                  .then((accepted) => {
                    pending.current = 0;
                    setError(null);
                    receive(accepted);
                  });
              }}
            >
              Discard rejected edits
            </button>
          )}
        </div>
      )}
      {!document ? (
        <main className={styles['welcome']}>
          <h2>Your campaign, ready for play</h2>
          <p>
            Keep working possessions, captured combats, and historical
            checkpoints together in one local file.
          </p>
          <button onClick={() => command('new')}>New campaign</button>
          <button onClick={() => command('open')}>Open campaign…</button>
          {state?.recentPath && (
            <button onClick={() => command('reopen')}>Reopen last</button>
          )}
          <details>
            <summary>Standalone tools</summary>
            {children}
          </details>
        </main>
      ) : (
        <>
          <div className={styles['sessionStrip']}>
            <strong>Session</strong>
            {document.sessions.map((s) => (
              <button
                key={s.id}
                aria-pressed={s.id === sessionId}
                onClick={() =>
                  mutate((d) => ({
                    ...d,
                    workspace: { ...d.workspace, sessionId: s.id },
                  }))
                }
              >
                {s.label}
              </button>
            ))}
            <details>
              <summary>Sessions…</summary>
              <label>
                Session label
                <input
                  maxLength={1000}
                  value={sessionLabel}
                  onChange={(e) => setSessionLabel(e.target.value)}
                />
              </label>
              <button
                disabled={!sessionLabel.trim()}
                onClick={() => {
                  const id = uid(),
                    label = sessionLabel.trim();
                  mutate((d) => ({
                    ...d,
                    sessions: [...d.sessions, { id, label }],
                    workspace: { ...d.workspace, sessionId: id },
                  }));
                  setSessionLabel('');
                }}
              >
                Add session
              </button>
              <button
                disabled={!sessionId || !sessionLabel.trim()}
                onClick={() =>
                  mutate((d) => ({
                    ...d,
                    sessions: d.sessions.map((s) =>
                      s.id === sessionId
                        ? { ...s, label: sessionLabel.trim() }
                        : s
                    ),
                  }))
                }
              >
                Rename selected session
              </button>
            </details>
          </div>
          <nav className={styles['navigation']} aria-label="Campaign views">
            {(
              [
                ['possessions', 'Possessions'],
                ['combats', 'Combats'],
                ['history', 'History & imports'],
                ['details', 'Campaign Details'],
                ['tools', 'Standalone tools'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                aria-pressed={view === id}
                onClick={() => navigate(id)}
              >
                {label}
              </button>
            ))}
            <small>⌘⌥1–4 · shortcuts pause while typing</small>
          </nav>
          <main className={styles['main']}>
            <section
              className={styles['view']}
              style={{ display: view === 'possessions' ? undefined : 'none' }}
              aria-label="Possessions"
            >
              <div className={styles['viewHeading']}>
                <div>
                  <span className={styles['working']}>Working</span>
                  <h2>Possessions</h2>
                  <p>
                    Edits here belong to this session and are saved by Campaign
                    Save. Historical sources stay unchanged.
                  </p>
                </div>
                {working && (
                  <details>
                    <summary>Capture checkpoint…</summary>
                    <label>
                      Checkpoint name
                      <input
                        maxLength={1000}
                        value={checkpointLabel}
                        onChange={(e) => setCheckpointLabel(e.target.value)}
                      />
                    </label>
                    <button
                      disabled={!checkpointLabel.trim()}
                      onClick={() => {
                        const id = uid(),
                          at = new Date().toISOString();
                        mutate((d) =>
                          captureInventoryCheckpoint(
                            d,
                            working.id,
                            checkpointLabel,
                            id,
                            at
                          )
                        );
                        setCheckpointLabel('');
                      }}
                    >
                      Capture checkpoint
                    </button>
                  </details>
                )}
              </div>
              {!sessionId ? (
                <p>Add or select a session to start.</p>
              ) : !working ? (
                <div className={styles['start']}>
                  <h3>Start this session’s working inventory</h3>
                  <p>
                    Choose a historical inventory below, or start empty. Nothing
                    is carried between sessions automatically.
                  </p>
                  <button
                    onClick={() =>
                      start(emptyWorkingInventory(), { kind: 'empty' })
                    }
                  >
                    Create empty working inventory
                  </button>
                  <CampaignHistory
                    key={sessionId}
                    document={document}
                    sessionId={sessionId}
                    type="inventory"
                    onStart={start}
                  />
                </div>
              ) : (
                <EncumbranceApp
                  key={`${state.epoch}:${working.id}:${editorVersion}`}
                  mode="dm"
                  campaign={{
                    document: working.document,
                    onDocumentChange: (next) => {
                      if (
                        next.kind !== 'adnd-encumbrance-dm' ||
                        editorVersion !== editorVersionRef.current
                      )
                        return false;
                      const workId = working.id,
                        owner = scope;
                      if (
                        !current.current?.document?.workingInventories.some(
                          (w) => w.id === workId && w.sessionId === sessionId
                        )
                      )
                        return false;
                      return mutate(
                        (d) =>
                          changeWorkingInventory(d, workId, sessionId, next),
                        owner
                      );
                    },
                    onExport: () => {
                      void window.campaignStorage
                        ?.exportWorking(document.id, state.epoch, working.id)
                        .catch((e) => setError(String(e)));
                    },
                  }}
                />
              )}
            </section>
            <section
              className={styles['view']}
              style={{ display: view === 'combats' ? undefined : 'none' }}
              aria-label="Combats"
            >
              <div className={styles['viewHeading']}>
                <div>
                  <span className={styles['historical']}>
                    Historical · read only
                  </span>
                  <h2>Combats</h2>
                  <p>
                    Browse captured encounters for this session. Combat editing
                    is the next integration slice.
                  </p>
                </div>
              </div>
              <CampaignHistory
                key={sessionId}
                document={document}
                sessionId={sessionId}
                type="combat"
              />
            </section>
            <section
              className={styles['view']}
              style={{ display: view === 'history' ? undefined : 'none' }}
              aria-label="History and imports"
            >
              <h2>Historical inventories &amp; checkpoints</h2>
              <CampaignHistory
                key={sessionId}
                document={document}
                sessionId={sessionId}
                type="inventory"
                onStart={sessionId ? start : undefined}
              />
              <details className={styles['secondary']}>
                <summary>Import, provenance &amp; revision management</summary>
                <CampaignSnapshots
                  key={`${state.epoch}:${sessionId}`}
                  document={document}
                  token={state.token}
                  busy={state.busy || pending.current > 0}
                  activeSessionId={sessionId}
                />
              </details>
            </section>
            <section
              className={styles['view']}
              style={{ display: view === 'details' ? undefined : 'none' }}
              aria-label="Campaign Details"
            >
              <h2>Campaign Details</h2>
              <label>
                Campaign title
                <input
                  maxLength={1000}
                  value={document.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    mutate((d) => ({ ...d, title }));
                  }}
                />
              </label>
              <label>
                Campaign notes
                <textarea
                  rows={8}
                  maxLength={1_000_000}
                  value={document.notes}
                  onChange={(e) => {
                    const notes = e.target.value;
                    mutate((d) => ({ ...d, notes }));
                  }}
                />
              </label>
              <p>{state.path || 'Choose a location with File → Save As.'}</p>
              <p>
                Campaign Save includes all working inventories, checkpoints, and
                imported evidence.
              </p>
            </section>
            <section
              className={styles['view']}
              style={{ display: view === 'tools' ? undefined : 'none' }}
              aria-label="Standalone tools"
            >
              <h2>Standalone tools</h2>
              <p>
                These tools are separate from working campaign inventories.
                Their edits require an explicit import into the campaign.
              </p>
              <nav>
                <Link href="/">All tools</Link> ·{' '}
                <Link href="/tracker">Tracker</Link> ·{' '}
                <Link href="/encumbrance">Encumbrance</Link> ·{' '}
                <Link href="/calculator">Calculator</Link>
              </nav>
              {children}
            </section>
          </main>
        </>
      )}
    </div>
  );
}
