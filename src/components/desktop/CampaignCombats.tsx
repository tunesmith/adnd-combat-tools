import { setEncounterRemoval } from '../../helpers/campaignEncounterRemoval';
import {
  linkedCombatValues,
  projectCombatRound,
} from '../../helpers/campaignParty';
import { applyPartyLevelsToLatestRound } from '../../helpers/applyPartyLevels';
import { ownedHistory } from '../../helpers/campaignHistory';
import { useState } from 'react';
import RenamableTab from './RenamableTab';
import CombatTracker from '../tracker/CombatTracker';
import VersionToolbar from './VersionToolbar';
import HistoricalCombat from './HistoricalCombat';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import {
  createWorkingCombat,
  changeWorkingCombat,
  emptyWorkingCombat,
  captureCombatCheckpoint,
  restoreWorkingCombat,
} from '../../helpers/campaignWorkingCombat';
import type { WorkingCombat } from '../../helpers/campaignWorkingCombat';
import type { TrackerState } from '../../types/tracker';
import styles from './campaignWorkspace.module.css';
const uid = () => crypto.randomUUID();
export default function CampaignCombats({
  document,
  sessionId,
  onChange,
  onEdit,
  editorVersion,
  active,
}: {
  document: CampaignDocument;
  sessionId: string;
  onChange: (change: (d: CampaignDocument) => CampaignDocument) => boolean;
  onEdit: (
    id: string,
    sessionId: string,
    generation: number,
    state: TrackerState
  ) => boolean;
  editorVersion: number;
  active: boolean;
}) {
  const [confirm, setConfirm] = useState<{
    id: string;
    action: 'remove' | 'levels';
  }>();
  const [undo, setUndo] = useState<string>();
  const [newEncounterId, setNewEncounterId] = useState<string>();
  const [historySelections, setHistorySelections] = useState<
    Record<string, string>
  >({});
  const combats = document.workingCombats.filter(
    (c) => c.sessionId === sessionId && !c.removedAt
  );
  const selected =
    combats.find(
      (c) => c.id === document.workspace.combatSelections?.[sessionId]
    ) || combats[0];
  const historyId = historySelections[selected?.id || ''] || '';
  function setHistoryId(id: string) {
    if (selected)
      setHistorySelections((old) => ({ ...old, [selected.id]: id }));
  }
  const owned = selected
    ? ownedHistory(document, 'combat', selected)
    : { records: new Set<string>(), checkpoints: new Set<string>() };
  const history = [
    ...document.records
      .filter((r) => r.type === 'combat' && owned.records.has(r.id))
      .flatMap((r) =>
        r.revisions.map((v, i) => ({
          id: v.id,
          title: `${r.title} · imported revision ${i + 1}${
            r.sessionId !== sessionId
              ? ' · from ' +
                document.sessions.find((s) => s.id === r.sessionId)?.label
              : ''
          }`,
          time: v.importedAt,
          state: v.payload as unknown as TrackerState,
          origin: { kind: 'import' as const, recordId: r.id, revisionId: v.id },
        }))
      ),
    ...document.combatCheckpoints
      .filter((c) => owned.checkpoints.has(c.id))
      .map((c) => ({
        id: c.id,
        title: `${c.state.title || 'Untitled encounter'} · ${c.label}${
          c.sessionId !== sessionId
            ? ' · from ' +
              document.sessions.find((s) => s.id === c.sessionId)?.label
            : ''
        }`,
        time: c.capturedAt,
        state: c.state,
        origin: { kind: 'checkpoint' as const, checkpointId: c.id },
      })),
  ];
  const historical = history.find((h) => h.id === historyId);
  const removed = document.workingCombats.filter(
    (c) => c.sessionId === sessionId && c.removedAt
  );
  const undoEncounter = removed.find((c) => c.id === undo);
  const latest = selected ? selected.state.rounds.length - 1 : -1;
  const linked = selected
    ? linkedCombatValues(document, selected, selected.state.rounds[latest])
    : [];
  const pending = linked.filter(
    (l) => l.level !== null && l.level !== l.actor.level
  );
  const manual = linked.filter((l) => l.level === null);
  const currentLinks = selected
    ? linkedCombatValues(
        document,
        selected,
        selected.state.rounds[selected.state.activeRound]
      )
    : [];
  const reservedKey = selected
    ? (document.party?.combatLinks || []).reduce(
        (max, l) => (l.combatId === selected.id ? Math.max(max, l.key) : max),
        -1
      )
    : -1;
  const sessionLabel =
    document.sessions.find((s) => s.id === sessionId)?.label || 'this session';

  function remove(combat: WorkingCombat) {
    const at = new Date().toISOString();
    if (
      onChange((d) =>
        setEncounterRemoval(
          d,
          combat.id,
          combat.sessionId,
          combat.generation,
          at
        )
      )
    ) {
      setUndo(combat.id);
      setConfirm(undefined);
    }
  }
  function requestRemoval(combat: WorkingCombat) {
    const meaningful =
      combat.origin.kind !== 'empty' ||
      !!combat.continuedFrom ||
      combat.state.rounds.length > 1 ||
      combat.state.rounds.some(
        (r) =>
          r.party.length ||
          r.enemies.length ||
          r.summary ||
          r.partyInitiative ||
          r.enemyInitiative
      ) ||
      document.combatCheckpoints.some((c) => c.combatId === combat.id);
    if (meaningful) setConfirm({ id: combat.id, action: 'remove' });
    else remove(combat);
  }
  function recover(combat: WorkingCombat) {
    if (
      onChange((d) =>
        setEncounterRemoval(d, combat.id, combat.sessionId, combat.generation)
      )
    )
      setUndo(undefined);
  }

  const create = (state: TrackerState, origin: WorkingCombat['origin']) => {
    const id = uid();
    const created = onChange((d) =>
      createWorkingCombat(
        d,
        sessionId,
        state.title || 'Untitled encounter',
        state,
        origin,
        id
      )
    );
    if (created && origin.kind === 'empty') setNewEncounterId(id);
  };
  return (
    <>
      <div className={styles['viewHeading']}>
        <div>
          <h2>Combats</h2>
        </div>
      </div>
      {!sessionId ? (
        <p>Select a session first.</p>
      ) : (
        <>
          <div className={styles['combatControls']}>
            <div
              className={styles['encounterStrip']}
              aria-label="Working encounters"
            >
              {combats.map((c) => (
                <RenamableTab
                  key={c.id}
                  kind="encounter"
                  label={c.title}
                  selected={selected?.id === c.id && !historical}
                  renameOnMount={c.id === newEncounterId}
                  onRenameEnd={() => setNewEncounterId(undefined)}
                  onSelect={() => {
                    if (selected?.id === c.id) {
                      setHistoryId('');
                      return;
                    }
                    onChange((d) => ({
                      ...d,
                      workspace: {
                        ...d.workspace,
                        combatSelections: {
                          ...d.workspace.combatSelections,
                          [sessionId]: c.id,
                        },
                      },
                    }));
                  }}
                  onRename={(title) =>
                    onChange((d) => {
                      const current = d.workingCombats.find(
                        (item) => item.id === c.id
                      );
                      if (!current)
                        throw new Error('Encounter is unavailable.');
                      return changeWorkingCombat(
                        d,
                        c.id,
                        sessionId,
                        c.generation,
                        { ...current.state, title }
                      );
                    })
                  }
                />
              ))}
              <button
                className={styles['addTab']}
                onClick={() =>
                  create(
                    { ...emptyWorkingCombat(), title: 'Untitled encounter' },
                    { kind: 'empty' }
                  )
                }
              >
                + Encounter
              </button>
            </div>
          </div>
          {!selected && (
            <p>
              Create an encounter above, or choose a stored source in Campaign
              Details → Import.
            </p>
          )}
          {selected && !historical && pending.length > 0 && (
            <div className={styles['linkedLevelNotice']}>
              <span>
                Latest round has pending levels for{' '}
                {pending.map((l) => l.name).join(', ')}. New rounds use Party
                Reference.
              </span>
              {selected.state.activeRound === latest ? (
                <button
                  onClick={() =>
                    setConfirm({ id: selected.id, action: 'levels' })
                  }
                >
                  Apply levels…
                </button>
              ) : (
                <span>Select the latest round to apply now.</span>
              )}
            </div>
          )}
          {selected && !historical && manual.length > 0 && (
            <p>
              Manual combat level for {manual.map((l) => l.name).join(', ')}.
              Review class and combat basis in Party Reference.
            </p>
          )}
          {selected && !historical && (
            <CombatTracker
              key={`${selected.id}:${selected.generation}:${editorVersion}`}
              campaign={{
                active,
                state: selected.state,
                reservedKey,
                levelManaged: (side, key) =>
                  currentLinks.some(
                    (l) => l.side === side && l.key === key && l.level !== null
                  ),
                projectNewRound: (next) =>
                  projectCombatRound(
                    document,
                    selected,
                    next,
                    next.activeRound
                  ),
                onStateChange: (next) =>
                  onEdit(
                    selected.id,
                    selected.sessionId,
                    selected.generation,
                    next
                  ),
              }}
            />
          )}
          {historical && (
            <HistoricalCombat key={historical.id} state={historical.state} />
          )}
          <VersionToolbar
            key={`${sessionId}:${selected?.id}`}
            versions={history}
            value={historical?.id || ''}
            onSelect={setHistoryId}
            secondaryActions={
              selected && (
                <button onClick={() => requestRemoval(selected)}>
                  Remove encounter from this session
                </button>
              )
            }
            onCapture={
              selected
                ? (label) => {
                    const id = uid(),
                      at = new Date().toISOString();
                    onChange((d) =>
                      captureCombatCheckpoint(d, selected.id, label, id, at)
                    );
                  }
                : undefined
            }
            onRestore={
              selected && historical
                ? () => {
                    const id = uid(),
                      at = new Date().toISOString();
                    if (
                      onChange((d) =>
                        restoreWorkingCombat(
                          d,
                          selected.id,
                          historical.state,
                          historical.origin,
                          id,
                          at
                        )
                      )
                    )
                      setHistoryId('');
                  }
                : undefined
            }
            onCreate={
              historical
                ? () => create(historical.state, historical.origin)
                : undefined
            }
          />
          {undoEncounter && (
            <p role="status">
              Removed {undoEncounter.title}.{' '}
              <button onClick={() => recover(undoEncounter)}>Undo</button>
            </p>
          )}
          {removed.length > 0 && (
            <details className={styles['secondary']}>
              <summary>Removed encounters ({removed.length})</summary>
              {removed.map((c) => (
                <p key={c.id}>
                  {c.title}{' '}
                  <button onClick={() => recover(c)}>Recover encounter</button>
                </p>
              ))}
            </details>
          )}
          {confirm && selected?.id === confirm.id && (
            <div className={styles['dialogShade']}>
              <section
                role="dialog"
                aria-modal="true"
                aria-label={
                  confirm.action === 'remove'
                    ? 'Remove encounter'
                    : 'Apply linked levels'
                }
                className={styles['continuationDialog']}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    setConfirm(undefined);
                  }
                }}
              >
                {confirm.action === 'remove' ? (
                  <p>
                    Remove <strong>{selected.title}</strong> from{' '}
                    <strong>{sessionLabel}</strong>? Recover it from Removed
                    encounters.
                  </p>
                ) : (
                  <>
                    <p>
                      Apply these levels to the latest round of{' '}
                      <strong>{selected.title}</strong>? A checkpoint will
                      preserve the current values.
                    </p>
                    <ul>
                      {pending.map((l) => (
                        <li key={`${l.side}:${l.key}`}>
                          {l.actor.name || l.name} · {l.actor.level} → {l.level}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <footer className={styles['sessionDialogFooter']}>
                  <button autoFocus onClick={() => setConfirm(undefined)}>
                    Cancel
                  </button>
                  {confirm.action === 'remove' ? (
                    <button onClick={() => remove(selected)}>
                      Remove from session
                    </button>
                  ) : (
                    <button
                      disabled={
                        !pending.length || selected.state.activeRound !== latest
                      }
                      onClick={() => {
                        const id = uid(),
                          at = new Date().toISOString();
                        if (
                          onChange((d) =>
                            applyPartyLevelsToLatestRound(
                              d,
                              selected.id,
                              selected.generation,
                              id,
                              at
                            )
                          )
                        )
                          setConfirm(undefined);
                      }}
                    >
                      Apply to latest round
                    </button>
                  )}
                </footer>
              </section>
            </div>
          )}
        </>
      )}
    </>
  );
}
