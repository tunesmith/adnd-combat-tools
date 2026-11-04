import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import CampaignSnapshots from './CampaignSnapshots';
import VersionToolbar from './VersionToolbar';
import HistoricalInventory from './HistoricalInventory';
import CampaignCombats from './CampaignCombats';
import { changeWorkingCombat } from '../../helpers/campaignWorkingCombat';
import CampaignSaveStatus from './CampaignSaveStatus';
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
  const [inventoryVersion, setInventoryVersion] = useState('');
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
        '3': 'details',
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
  const view =
    document?.workspace.view === 'history'
      ? 'details'
      : document?.workspace.view || 'possessions';
  const working = document?.workingInventories.find(
    (w) => w.sessionId === sessionId
  );
  const inventoryVersions = [
    ...(document?.records || [])
      .filter((r) => r.type === 'inventory' && r.sessionId === sessionId)
      .flatMap((r) =>
        r.revisions.map((v, i) => ({
          id: v.id,
          title: `${r.title} · imported ${i + 1}`,
          time: v.importedAt,
          document: v.payload as unknown as EncumbranceDmDocumentV9,
          origin: { kind: 'import' as const, recordId: r.id, revisionId: v.id },
        }))
      ),
    ...(document?.inventoryCheckpoints || [])
      .filter((c) => c.sessionId === sessionId)
      .map((c) => ({
        id: c.id,
        title: c.label,
        time: c.capturedAt,
        document: c.document,
        origin: { kind: 'checkpoint' as const, checkpointId: c.id },
      })),
  ];
  const historicalInventory = inventoryVersions.find(
    (v) => v.id === inventoryVersion
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
      workspace: { ...d.workspace, sessionId, view: 'possessions' },
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
        <div className={styles['status']}>
          <CampaignSaveStatus
            state={state}
            pending={pending.current > 0}
            hasError={Boolean(error)}
          />
        </div>
      </header>
      {state?.status.startsWith('Opened older campaign') && (
        <p className={styles['notice']} role="status">
          Save upgrades this campaign to the current format and keeps the
          previous file in its backup.
        </p>
      )}
      {state?.status.includes('Could not remember path') && (
        <p className={styles['notice']} role="alert">
          Couldn’t remember this file. Use Open next time.
        </p>
      )}
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
            Keep working possessions, combats, and historical checkpoints
            together in one local file.
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
          </nav>
          <main className={styles['main']}>
            <section
              className={styles['view']}
              style={{ display: view === 'possessions' ? undefined : 'none' }}
              aria-label="Possessions"
            >
              <div className={styles['viewHeading']}>
                <div>
                  <h2>Possessions</h2>
                </div>
              </div>
              {historicalInventory ? (
                <HistoricalInventory
                  key={historicalInventory.id}
                  document={historicalInventory.document}
                />
              ) : !sessionId ? (
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
              <VersionToolbar
                key={`${state.epoch}:${sessionId}:${working?.id}`}
                versions={inventoryVersions}
                value={historicalInventory?.id || ''}
                onSelect={setInventoryVersion}
                onCapture={
                  working
                    ? (label) => {
                        const id = uid(),
                          at = new Date().toISOString();
                        mutate((d) =>
                          captureInventoryCheckpoint(
                            d,
                            working.id,
                            label,
                            id,
                            at
                          )
                        );
                      }
                    : undefined
                }
                onRestore={
                  historicalInventory
                    ? () => {
                        start(
                          historicalInventory.document,
                          historicalInventory.origin
                        );
                        setInventoryVersion('');
                      }
                    : undefined
                }
              />
            </section>
            <section
              className={styles['view']}
              style={{ display: view === 'combats' ? undefined : 'none' }}
              aria-label="Combats"
            >
              <CampaignCombats
                active={view === 'combats'}
                key={`${state.epoch}`}
                document={document}
                sessionId={sessionId}
                editorVersion={editorVersion}
                onChange={(change) => mutate(change, scope)}
                onEdit={(id, ownedSession, generation, next) => {
                  if (
                    editorVersion !== editorVersionRef.current ||
                    !current.current?.document?.workingCombats.some(
                      (c) =>
                        c.id === id &&
                        c.sessionId === ownedSession &&
                        c.generation === generation
                    )
                  )
                    return false;
                  return mutate(
                    (d) =>
                      changeWorkingCombat(
                        d,
                        id,
                        ownedSession,
                        generation,
                        next
                      ),
                    scope
                  );
                }}
              />
            </section>
            <section
              className={styles['view']}
              style={{ display: view === 'details' ? undefined : 'none' }}
              aria-label="Campaign Details"
            >
              <h2>Campaign Details</h2>
              <details className={styles['secondary']}>
                <summary>Import…</summary>
                <CampaignSnapshots
                  key={`${state.epoch}:${sessionId}`}
                  document={document}
                  token={state.token}
                  busy={state.busy || pending.current > 0}
                  activeSessionId={sessionId}
                />
              </details>

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
