import {
  inSessionInventoryOrder,
  reorderInventoryCharacter,
} from '../../helpers/campaignInventoryOrder';
import AddInventoryCharacterDialog from './AddInventoryCharacterDialog';
import CampaignBanking from './CampaignBanking';
import {
  bankingReplacementReview,
  bankHolderName,
} from '../../helpers/campaignBanking';
import BankBalances from './BankBalances';
import { reorderCampaignSession } from '../../helpers/campaignSessionOrder';
import CampaignXp from './CampaignXp';
import PartyReference from './PartyReference';
import AutoHeightTextarea from '../tracker/AutoHeightTextarea';
import CreateSessionDialog from './CreateSessionDialog';
import RenamableTab from './RenamableTab';
import { ownedHistory, ownsVersion } from '../../helpers/campaignHistory';
import { useCallback, useEffect, useRef, useState } from 'react';
import StandaloneToolHost from './StandaloneToolHost';
import {
  standaloneTools,
  standaloneToolForRoute,
} from '../../helpers/standaloneTools';
import type { StandaloneTool } from '../../helpers/standaloneTools';
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
import type { EncumbranceDmDocument } from '../../types/encumbrance';
import type {
  DocumentState,
  CombatEditKey,
  DocumentCommand,
} from '../../types/campaignStorage';
import styles from './campaignWorkspace.module.css';
const uid = () => crypto.randomUUID();
export default function DesktopWorkspace() {
  const [continuing, setContinuing] = useState<{
    sessionId: string;
    owner: DocumentState;
  } | null>(null);
  const [addingInventory, setAddingInventory] = useState<{
    owner: DocumentState;
    workingId: string;
    sessionId: string;
  } | null>(null);
  const [state, setState] = useState<DocumentState | null>(null);
  const draggedSession = useRef<string | null>(null);
  const [dropSession, setDropSession] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<StandaloneTool | null>(null);
  const toolMode = useRef(false);
  const [toolPath, setToolPath] = useState('');
  const toolHome = useRef<string | null>(null);
  const returnToWorkspace = useCallback(() => {
    toolMode.current = false;
    setActiveTool(null);
    setToolPath('');
    if (toolHome.current)
      window.history.replaceState(window.history.state, '', toolHome.current);
    toolHome.current = null;
  }, []);
  const openTool = useCallback((path: string) => {
    const tool = standaloneToolForRoute(path);
    if (!tool) return;
    if (!toolMode.current) toolHome.current = window.location.href;
    toolMode.current = true;
    setActiveTool(tool);
    setToolPath(path);
    window.history.replaceState(window.history.state, '', `${path}.html`);
  }, []);
  const editorVersion = state?.editorVersion || 0;
  const pending = (state?.queue?.queued || 0) > 0;
  const [error, setError] = useState<string | null>(null);
  const [inventoryHistorySelections, setInventoryHistorySelections] = useState<
    Record<string, string>
  >({});
  const toolEpoch = useRef<number>();
  useEffect(() => {
    setAddingInventory(null);
    if (toolEpoch.current !== undefined) returnToWorkspace();
    toolEpoch.current = state?.epoch;
  }, [state?.epoch, returnToWorkspace]);
  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    void import('../../helpers/tauriCampaignStorage')
      .then(async ({ createTauriStorage }) => {
        const storage = window.campaignStorage || (await createTauriStorage());
        if (!storage || disposed) return;
        window.campaignStorage = storage;
        unsubscribe = storage.subscribe((next) => {
          if (!disposed) setState(next);
        });
        const next = await storage.getState();
        if (!disposed) setState(next);
      })
      .catch((e) => setError(String(e)));
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, []);
  const acceptMutation = useCallback(
    (
      change: (doc: CampaignDocument) => CampaignDocument,
      owner: DocumentState | null = state,
      combat?: CombatEditKey,
      preview = false
    ) => {
      if (!owner?.document || !window.campaignStorage)
        throw new Error('Campaign unavailable.');
      return window.campaignStorage
        .mutate(owner.document.id, owner.epoch, change, combat, {
          editorVersion: owner.editorVersion,
          preview,
        })
        .then((accepted) => {
          if (!accepted)
            throw new Error('Campaign changed. Reopen the dialog.');
        });
    },
    [state]
  );
  const mutate = useCallback(
    (
      change: (doc: CampaignDocument) => CampaignDocument,
      owner: DocumentState | null = state,
      combat?: CombatEditKey
    ) => {
      try {
        void acceptMutation(change, owner, combat, true).catch(() => undefined);
        return true;
      } catch {
        return false;
      }
    },
    [acceptMutation, state]
  );
  const navigate = useCallback(
    (view: WorkspaceView) => {
      mutate((d) => ({ ...d, workspace: { ...d.workspace, view } }));
    },
    [mutate]
  );
  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;
    void window.__TAURI__?.event
      .listen<string>('open-standalone-tool', ({ payload }) => {
        if (!disposed && standaloneTools.some((tool) => tool.path === payload))
          openTool(payload);
      })
      .then((cleanup) => {
        if (disposed) cleanup();
        else unlisten = cleanup;
      })
      .catch((e) => {
        if (!disposed) setError(String(e));
      });
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [openTool]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (
        toolMode.current ||
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
        '6': 'xp',
      };
      const view = views[event.code.replace('Digit', '')];
      if (view && state?.document) {
        event.preventDefault();
        navigate(view);
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [navigate, state?.document]);
  const command = (action: DocumentCommand) => {
    void window.campaignStorage?.command(action).catch(() => undefined);
  };
  const document = state?.document;
  const sessionId =
    document?.workspace.sessionId || document?.sessions[0]?.id || '';
  const view =
    document?.workspace.view === 'history'
      ? 'details'
      : document?.workspace.view === 'tools'
      ? 'session'
      : document?.workspace.view || 'possessions';
  const sessionList = useRef<HTMLDivElement>(null);
  const selectedSessionTab = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = sessionList.current;
    const tab = selectedSessionTab.current;
    if (!list || !tab || activeTool) return;
    const viewport = list.getBoundingClientRect();
    const selected = tab.getBoundingClientRect();
    if (selected.left < viewport.left + 4)
      list.scrollLeft += selected.left - viewport.left - 4;
    else if (selected.right > viewport.right - 4)
      list.scrollLeft += selected.right - viewport.right + 4;
  }, [state?.epoch, sessionId, view, activeTool]);
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
          document: v.payload as unknown as EncumbranceDmDocument,
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
    inventory: EncumbranceDmDocument,
    origin: WorkingInventory['origin'],
    bankingReview?: string
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
        at,
        bankingReview
      ),
      workspace: { ...d.workspace, sessionId, view: 'possessions' },
    }));
  }
  const scope = state;
  return (
    <div className={styles['shell']}>
      <header className={styles['header']}>
        <div>
          <small>
            AD&amp;D CAMPAIGN ·{' '}
            {activeTool ? 'STANDALONE TOOL' : 'CAMPAIGN WORKSPACE'}
          </small>
          <div className={styles['campaignHeading']}>
            <h1>{activeTool?.label || document?.title || 'Open a campaign'}</h1>
            {document && !activeTool && (
              <button
                type="button"
                aria-pressed={view === 'details'}
                onClick={() => navigate('details')}
              >
                Campaign Details
              </button>
            )}
          </div>
        </div>
        <div className={styles['status']}>
          {activeTool ? (
            <button
              className={styles['returnToWorkspace']}
              onClick={returnToWorkspace}
            >
              {document ? 'Return to campaign' : 'Back to welcome'}
            </button>
          ) : (
            <CampaignSaveStatus state={state} />
          )}
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
          {state?.queue?.rejected && (
            <>
              <button
                onClick={() => {
                  void window.campaignStorage
                    ?.retryRejectedEdits?.()
                    .catch(() => undefined);
                }}
              >
                Retry pending edits
              </button>
              <button
                onClick={() => {
                  void window.campaignStorage
                    ?.discardRejectedEdits()
                    .catch(() => undefined);
                }}
              >
                Discard rejected edits
              </button>
            </>
          )}
        </div>
      )}
      {activeTool && (
        <main
          className={styles['standaloneSurface']}
          aria-label={activeTool.label}
          onClickCapture={(event) => {
            const anchor =
              event.target instanceof Element
                ? event.target.closest('a')
                : null;
            if (!anchor) return;
            const href = anchor.getAttribute('href');
            if (!href) return;
            const url = new URL(href, window.location.href);
            if (
              url.protocol !== window.location.protocol ||
              url.host !== window.location.host
            )
              return;
            const path =
              url.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
            if (path === '/') {
              event.preventDefault();
              event.stopPropagation();
              returnToWorkspace();
            } else if (standaloneToolForRoute(path)) {
              event.preventDefault();
              event.stopPropagation();
              openTool(path);
            }
          }}
        >
          <StandaloneToolHost key={toolPath} path={toolPath} />
        </main>
      )}
      <div style={{ display: activeTool ? 'none' : undefined }}>
        {continuing &&
          document &&
          continuing.owner.epoch === state?.epoch &&
          continuing.owner.document?.id === document.id && (
            <CreateSessionDialog
              key={`${state.epoch}:${continuing.sessionId}`}
              document={document}
              sessionId={continuing.sessionId}
              onCreate={(change) => acceptMutation(change, continuing.owner)}
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
          </main>
        ) : (
          <>
            <div
              className={styles['sessionStrip']}
              role="group"
              aria-label="Sessions"
            >
              <div className={styles['sessionList']} ref={sessionList}>
                {document.sessions.map((s) => (
                  <div
                    key={s.id}
                    ref={s.id === sessionId ? selectedSessionTab : undefined}
                    className={`${styles['sessionDrag']} ${
                      dropSession === s.id ? styles['sessionDrop'] : ''
                    }`}
                    draggable={
                      !(
                        document.xp?.events.length ||
                        document.banking?.entries.length ||
                        document.banking?.openings.length
                      )
                    }
                    title={
                      document.xp?.events.length ||
                      document.banking?.entries.length ||
                      document.banking?.openings.length
                        ? 'Session order is fixed after recorded history'
                        : 'Drag to reorder sessions'
                    }
                    onDragStart={(event) => {
                      if (
                        document.xp?.events.length ||
                        document.banking?.entries.length ||
                        document.banking?.openings.length ||
                        (event.target instanceof HTMLElement &&
                          event.target.closest('input'))
                      ) {
                        event.preventDefault();
                        return;
                      }
                      draggedSession.current = s.id;
                      event.dataTransfer.setData(
                        'application/x-adnd-session',
                        s.id
                      );
                      event.dataTransfer.setData('text/plain', s.id);
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(event) => {
                      if (
                        draggedSession.current &&
                        !(
                          document.xp?.events.length ||
                          document.banking?.entries.length ||
                          document.banking?.openings.length
                        )
                      ) {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                        setDropSession(s.id);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const from = draggedSession.current;
                      draggedSession.current = null;
                      setDropSession(null);
                      if (from)
                        mutate(
                          (d) => reorderCampaignSession(d, from, s.id),
                          state
                        );
                    }}
                    onDragEnd={() => {
                      draggedSession.current = null;
                      setDropSession(null);
                    }}
                    onKeyDown={(event) => {
                      if (
                        !event.altKey ||
                        !event.shiftKey ||
                        document.xp?.events.length ||
                        document.banking?.entries.length ||
                        document.banking?.openings.length ||
                        event.target instanceof HTMLInputElement
                      )
                        return;
                      const direction =
                        event.key === 'ArrowLeft'
                          ? -1
                          : event.key === 'ArrowRight'
                          ? 1
                          : 0;
                      const target =
                        document.sessions[
                          document.sessions.findIndex(
                            (item) => item.id === s.id
                          ) + direction
                        ];
                      if (direction && target) {
                        event.preventDefault();
                        mutate(
                          (d) => reorderCampaignSession(d, s.id, target.id),
                          state
                        );
                      }
                    }}
                  >
                    <RenamableTab
                      kind="session"
                      draggable={
                        !(
                          document.xp?.events.length ||
                          document.banking?.entries.length ||
                          document.banking?.openings.length
                        )
                      }
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
                  </div>
                ))}
              </div>
              <button
                className={styles['addTab']}
                disabled={state.busy || pending}
                onClick={() => setContinuing({ sessionId, owner: state })}
              >
                + Session
              </button>
            </div>
            <nav className={styles['navigation']} aria-label="Session views">
              {(
                [
                  ['session', 'Session'],
                  ['party', 'References'],
                  ['banking', 'Banking'],
                  ['possessions', 'Possessions'],
                  ['combats', 'Combats'],
                  ['xp', 'XP'],
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
                <div className={styles['sessionLayout']}>
                  <div className={styles['sessionRoster']}>
                    {view === 'session' && (
                      <PartyReference
                        key={`${state.epoch}:${sessionId}`}
                        view="session"
                        document={document}
                        sessionId={sessionId}
                        onChange={(change) => mutate(change, scope)}
                      />
                    )}
                  </div>
                  <label className={styles['sessionNotes']}>
                    Session notes
                    <AutoHeightTextarea
                      rows={5}
                      maxLength={1_000_000}
                      disabled={!sessionId}
                      value={
                        document.sessions.find((s) => s.id === sessionId)
                          ?.notes || ''
                      }
                      onChange={(notes) => {
                        const ownerId = sessionId;
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
                </div>
                {sessionId && (
                  <details className={styles['secondary']}>
                    <summary>Session imports</summary>
                    <CampaignSnapshots
                      key={`${state.epoch}:${sessionId}`}
                      document={document}
                      token={state.token}
                      busy={state.busy || pending}
                      activeSessionId={sessionId}
                    />
                  </details>
                )}
              </section>
              <section
                className={styles['view']}
                style={{ display: view === 'possessions' ? undefined : 'none' }}
                aria-label="Possessions"
              >
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
                      Import an inventory under Session → Session imports, or
                      start empty.
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
                    key={`${state.epoch}:${
                      working.id
                    }:${editorVersion}:${working.document.characters
                      .map((c) => c.id)
                      .join()}`}
                    mode="dm"
                    campaign={{
                      document: working.document,
                      characterOrder: inSessionInventoryOrder(
                        document,
                        sessionId,
                        working.document.characters,
                        (c) => c.id
                      ).map((c) => c.id),
                      onReorderCharacter: (fromId, targetId) => {
                        mutate(
                          (d) =>
                            reorderInventoryCharacter(
                              d,
                              sessionId,
                              fromId,
                              targetId
                            ),
                          scope
                        );
                      },
                      onAddCharacter: () => {
                        if (!scope) return;
                        setAddingInventory({
                          owner: scope,
                          workingId: working.id,
                          sessionId,
                        });
                      },
                      active: view === 'possessions' && !activeTool,
                      onDocumentChange: (next) => {
                        if (next.kind !== 'adnd-encumbrance-dm') return false;
                        const workId = working.id,
                          owner = scope;
                        const removal = working.document.characters.some(
                          (c) => !next.characters.some((n) => n.id === c.id)
                        )
                          ? { id: uid(), at: new Date().toISOString() }
                          : undefined;
                        return mutate(
                          (d) =>
                            changeWorkingInventory(
                              d,
                              workId,
                              sessionId,
                              next,
                              removal
                            ),
                          owner
                        );
                      },
                      onExport: () => {
                        void window.campaignStorage
                          ?.exportWorking(document.id, state.epoch, working.id)
                          .catch(() => undefined);
                      },
                    }}
                  />
                )}
                <VersionToolbar
                  key={`${state.epoch}:${sessionId}:${working?.id}`}
                  replacementName={`${working?.title || 'inventory'} in ${
                    document.sessions.find((s) => s.id === sessionId)?.label
                  }`}
                  firstActivation={
                    !working &&
                    !(
                      historicalInventory &&
                      bankingReplacementReview(
                        document,
                        sessionId,
                        historicalInventory.document
                      ).required
                    )
                  }
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
                  replacementDetails={
                    historicalInventory &&
                    document && (
                      <BankBalances
                        label="Inventory money replacement"
                        caption="Possessions comparison · Banking ledger stays unchanged"
                        rows={bankingReplacementReview(
                          document,
                          sessionId,
                          historicalInventory.document
                        ).comparison.flatMap((r) => [
                          {
                            id: r.holderId + '-before',
                            label:
                              bankHolderName(document, r.holderId) +
                              ' · current',
                            amounts: r.before,
                          },
                          {
                            id: r.holderId + '-after',
                            label:
                              bankHolderName(document, r.holderId) +
                              ' · replacement',
                            amounts: r.after,
                          },
                        ])}
                      />
                    )
                  }
                  onRestore={
                    historicalInventory
                      ? () => {
                          start(
                            historicalInventory.document,
                            historicalInventory.origin,
                            bankingReplacementReview(
                              document,
                              sessionId,
                              historicalInventory.document
                            ).fingerprint
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
                  active={view === 'combats' && !activeTool}
                  key={`${state.epoch}`}
                  document={document}
                  sessionId={sessionId}
                  editorVersion={editorVersion}
                  onChange={(change) => mutate(change, scope)}
                  onCreateEncounter={(change) => acceptMutation(change, scope)}
                  onEdit={(id, ownedSession, generation, next) => {
                    return mutate(
                      (d) =>
                        changeWorkingCombat(
                          d,
                          id,
                          ownedSession,
                          generation,
                          next
                        ),
                      scope,
                      { combatId: id, sessionId: ownedSession, generation }
                    );
                  }}
                />
              </section>
              {view === 'banking' && (
                <section className={styles['view']} aria-label="Banking">
                  <CampaignBanking
                    key={`${state.epoch}:${sessionId}:${editorVersion}`}
                    document={document}
                    sessionId={sessionId}
                    onChange={(change) => mutate(change, scope)}
                  />
                </section>
              )}
              {view === 'xp' && (
                <section className={styles['view']} aria-label="XP">
                  <CampaignXp
                    key={`${state.epoch}:${sessionId}:${editorVersion}`}
                    document={document}
                    sessionId={sessionId}
                    onConfirmExtension={(change) =>
                      acceptMutation(change, state)
                    }
                    onChange={(change) => mutate(change, scope)}
                  />
                </section>
              )}
              {view === 'party' && (
                <section className={styles['view']} aria-label="References">
                  <PartyReference
                    key={`${state.epoch}:${sessionId}`}
                    document={document}
                    sessionId={sessionId}
                    onChange={(change) => mutate(change, scope)}
                  />
                </section>
              )}
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
              </section>
            </main>
            {addingInventory && addingInventory.owner.epoch === state.epoch && (
              <AddInventoryCharacterDialog
                key={`${state.epoch}:${addingInventory.workingId}`}
                document={document}
                workingId={addingInventory.workingId}
                sessionId={addingInventory.sessionId}
                onChange={(change) => mutate(change, addingInventory.owner)}
                onClose={() => setAddingInventory(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
