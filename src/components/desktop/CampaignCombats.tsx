import { setEncounterRemoval } from '../../helpers/campaignEncounterRemoval';
import {
  combatValuesForProfile,
  profilesInSession,
} from '../../helpers/campaignParty';
import { ownedHistory } from '../../helpers/campaignHistory';
import { useState } from 'react';
import CreateEncounterDialog from './CreateEncounterDialog';
import RenamableTab from './RenamableTab';
import CombatTracker from '../tracker/CombatTracker';
import VersionToolbar from './VersionToolbar';
import HistoricalCombat from './HistoricalCombat';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import {
  createWorkingCombat,
  changeWorkingCombat,
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
  onCreateEncounter,
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
  onCreateEncounter: (
    change: (d: CampaignDocument) => CampaignDocument
  ) => Promise<void>;
  editorVersion: number;
  active: boolean;
}) {
  const [creating, setCreating] = useState(false);
  const [confirmRemovalId, setConfirmRemovalId] = useState<string>();
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
  const partyProfiles = profilesInSession(document, sessionId).flatMap(
    (profile) => {
      const character = document.party?.roster.find(
        (c) => c.id === profile.characterId
      );
      return character
        ? [
            {
              id: character.id,
              name: character.name,
              player: character.player,
              combatValues: combatValuesForProfile(profile),
            },
          ]
        : [];
    }
  );
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
      setConfirmRemovalId(undefined);
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
    if (meaningful) setConfirmRemovalId(combat.id);
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
                onClick={() => setCreating(true)}
              >
                + Encounter
              </button>
            </div>
          </div>
          {creating && active && (
            <CreateEncounterDialog
              key={`${document.id}:${sessionId}`}
              document={document}
              sessionId={sessionId}
              selectedId={selected?.id}
              onCreate={onCreateEncounter}
              onClose={() => setCreating(false)}
            />
          )}
          {!selected && (
            <p>
              Create an encounter above, or choose a stored source in Campaign
              Details → Import.
            </p>
          )}
          {selected && !historical && (
            <CombatTracker
              key={`${selected.id}:${selected.generation}:${editorVersion}`}
              campaign={{
                active,
                state: selected.state,
                partyProfiles,
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
          {confirmRemovalId && selected?.id === confirmRemovalId && (
            <div className={styles['dialogShade']}>
              <section
                role="dialog"
                aria-modal="true"
                aria-label="Remove encounter"
                className={styles['continuationDialog']}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    setConfirmRemovalId(undefined);
                  }
                }}
              >
                <p>
                  Remove <strong>{selected.title}</strong> from{' '}
                  <strong>{sessionLabel}</strong>? Recover it from Removed
                  encounters.
                </p>
                <footer className={styles['sessionDialogFooter']}>
                  <button
                    autoFocus
                    onClick={() => setConfirmRemovalId(undefined)}
                  >
                    Cancel
                  </button>
                  <button onClick={() => remove(selected)}>
                    Remove from session
                  </button>
                </footer>
              </section>
            </div>
          )}
        </>
      )}
    </>
  );
}
