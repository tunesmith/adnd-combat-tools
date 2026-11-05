import CreateSessionDialog from './CreateSessionDialog';
import RenamableTab from './RenamableTab';
import { ownedHistory, ownsVersion } from '../../helpers/campaignHistory';
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
  const [continuing, setContinuing] = useState<{
    sessionId: string;
    owner: DocumentState;
  } | null>(null);
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
  const [inventoryHistorySelections, setInventoryHistorySelections] = useState<
    Record<string, string>
  >({});
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
  async function createSession(
    change: (doc: CampaignDocument) => CampaignDocument,
    owner: DocumentState
  ) {
    const storage = window.campaignStorage;
    if (!storage || !owner.document) throw new Error('Campaign unavailable.');
    if (
      current.current?.epoch !== owner.epoch ||
      current.current.document?.id !== owner.document.id
    )
      throw new Error('Campaign changed. Reopen New session.');
    change(current.current.document);
    pending.current += 1;
    setError(null);
    try {
      const accepted = await storage.mutate(
        owner.document.id,
        owner.epoch,
        change
      );
      if (
        !accepted ||
        current.current?.epoch !== owner.epoch ||
        current.current.document?.id !== owner.document.id
      )
        throw new Error('Campaign changed while creating the session.');
      pending.current = Math.max(0, pending.current - 1);
      receive(accepted);
    } catch (e) {
      if (current.current?.epoch === owner.epoch) {
        pending.current = Math.max(0, pending.current - 1);
        needsEditorReset.current = true;
        setError(String(e));
      }
      throw e;
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
          'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="dialog"]'
        )
      )
        return;
      const views: Record<string, WorkspaceView> = {
        '1': 'possessions',
        '2': 'combats',
        '3': 'details',
        '4': 'details',
        '5': 'session',
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
  const inventoryVersionKey = `${state?.epoch}:${working?.id || sessionId}`;
  const inventoryVersion =
    inventoryHistorySelections[inventoryVersionKey] || '';
  function setInventoryVersion(id: string) {
    setInventoryHistorySelections((old) => ({
      ...old,
      [inventoryVersionKey]: id,
    }));
  }
  const inventoryHistory =
    document && working
      ? ownedHistory(document, 'inventory', working)
      : { records: new Set<string>(), checkpoints: new Set<string>() };
  const inventoryVersions = [
    ...(document?.records || [])
      .filter(
        (r) => r.type === 'inventory' && inventoryHistory.records.has(r.id)
      )
      .flatMap((r) =>
        r.revisions.map((v, i) => ({
          id: v.id,
          title: `${r.title} · imported ${i + 1}${
            r.sessionId !== sessionId
              ? ' · from ' +
                document?.sessions.find((s) => s.id === r.sessionId)?.label
              : ''
          }`,
          time: v.importedAt,
          document: v.payload as unknown as EncumbranceDmDocumentV9,
          origin: { kind: 'import' as const, recordId: r.id, revisionId: v.id },
        }))
      ),
    ...(document?.inventoryCheckpoints || [])
      .filter((c) => inventoryHistory.checkpoints.has(c.id))
      .map((c) => ({
        id: c.id,
        title: `${c.label}${
          c.sessionId !== sessionId
            ? ' · from ' +
              document?.sessions.find((s) => s.id === c.sessionId)?.label
            : ''
        }`,
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
        (() => {
          const current = d.workingInventories.find(
            (w) => w.sessionId === sessionId
          );
          if (
            current &&
            origin.kind !== 'empty' &&
            !ownsVersion(d, 'inventory', current, origin)
          )
            throw new Error('Choose unrelated sources through Imports.');
          return d;
        })(),
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
      {continuing &&
        document &&
        continuing.owner.epoch === state?.epoch &&
        continuing.owner.document?.id === document.id && (
          <CreateSessionDialog
            key={`${state.epoch}:${continuing.sessionId}`}
            document={document}
            sessionId={continuing.sessionId}
            onCreate={(change) => createSession(change, continuing.owner)}
            onClose={() => setContinuing(null)}
          />
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
          <div className={styles['sessionStrip']} aria-label="Sessions">
            {document.sessions.map((s) => (
              <RenamableTab
                key={s.id}
                kind="session"
                label={s.label}
                selected={s.id === sessionId}
                onSelect={() => {
                  if (s.id !== sessionId)
                    mutate((d) => ({
                      ...d,
                      workspace: { ...d.workspace, sessionId: s.id },
                    }));
                }}
                onRename={(label) =>
                  mutate(
                    (d) => ({
                      ...d,
                      sessions: d.sessions.map((item) =>
                        item.id === s.id ? { ...item, label } : item
                      ),
                    }),
                    state
                  )
                }
              />
            ))}
            <button
              className={styles['addTab']}
              disabled={state.busy || pending.current > 0}
              onClick={() => setContinuing({ sessionId, owner: state })}
            >
              + Session
            </button>
          </div>
          <nav className={styles['navigation']} aria-label="Campaign views">
            {(
              [
                ['possessions', 'Possessions'],
                ['combats', 'Combats'],
                ['session', 'Session notes'],
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
              style={{ display: view === 'session' ? undefined : 'none' }}
              aria-label="Session overview"
            >
              <h2>
                {document.sessions.find((s) => s.id === sessionId)?.label ||
                  'Select a session'}
              </h2>
              <p>
                Encounters:{' '}
                {
                  document.workingCombats.filter(
                    (c) => c.sessionId === sessionId
                  ).length
                }{' '}
                ·{' '}
                {working
                  ? 'Current inventory available'
                  : 'No current inventory'}
              </p>
              <label>
                Session notes
                <textarea
                  rows={10}
                  maxLength={1_000_000}
                  disabled={!sessionId}
                  value={
                    document.sessions.find((s) => s.id === sessionId)?.notes ||
                    ''
                  }
                  onChange={(e) => {
                    const notes = e.target.value,
                      ownerId = sessionId;
                    mutate(
                      (d) => ({
                        ...d,
                        sessions: d.sessions.map((s) =>
                          s.id === ownerId ? { ...s, notes } : s
                        ),
                      }),
                      scope
                    );
                  }}
                />
              </label>
            </section>
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
                    Import an inventory in Campaign Details, or start empty.
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
                replacementName={`${working?.title || 'inventory'} in ${
                  document.sessions.find((s) => s.id === sessionId)?.label
                }`}
                firstActivation={!working}
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
