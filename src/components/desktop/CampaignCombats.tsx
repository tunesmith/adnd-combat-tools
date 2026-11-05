import { ownedHistory } from '../../helpers/campaignHistory';
import { useRef, useState } from 'react';
import CombatTracker from '../tracker/CombatTracker';
import VersionToolbar from './VersionToolbar';
import HistoricalCombat from './HistoricalCombat';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import {
  createWorkingCombat,
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
  const newEncounterRef = useRef<HTMLDetailsElement>(null);
  const [name, setName] = useState('');
  const [historyId, setHistoryId] = useState('');
  const combats = document.workingCombats.filter(
    (c) => c.sessionId === sessionId
  );
  const selected =
    combats.find(
      (c) => c.id === document.workspace.combatSelections?.[sessionId]
    ) || combats[0];
  const owned = selected
    ? ownedHistory(document, 'combat', selected)
    : { records: new Set<string>(), checkpoints: new Set<string>() };
  const history = [
    ...document.records
      .filter((r) => r.type === 'combat' && owned.records.has(r.id))
      .flatMap((r) =>
        r.revisions.map((v, i) => ({
          id: v.id,
          title: `${r.title} · imported revision ${i + 1}`,
          time: v.importedAt,
          state: v.payload as unknown as TrackerState,
          origin: { kind: 'import' as const, recordId: r.id, revisionId: v.id },
        }))
      ),
    ...document.combatCheckpoints
      .filter((c) => owned.checkpoints.has(c.id))
      .map((c) => ({
        id: c.id,
        title: `${c.state.title || 'Untitled encounter'} · ${c.label}`,
        time: c.capturedAt,
        state: c.state,
        origin: { kind: 'checkpoint' as const, checkpointId: c.id },
      })),
  ];
  const historical = history.find((h) => h.id === historyId);
  const create = (state: TrackerState, origin: WorkingCombat['origin']) => {
    const id = uid();
    if (
      onChange((d) =>
        createWorkingCombat(
          d,
          sessionId,
          name || state.title || 'Untitled encounter',
          state,
          origin,
          id
        )
      )
    ) {
      if (newEncounterRef.current) newEncounterRef.current.open = false;
      setName('');
      setHistoryId('');
    }
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
                <button
                  key={c.id}
                  aria-pressed={selected?.id === c.id && !historical}
                  onClick={() => {
                    setHistoryId('');
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
                >
                  {c.title}
                </button>
              ))}
              <details ref={newEncounterRef} className={styles['newEncounter']}>
                <summary>New encounter…</summary>
                <div className={styles['newEncounterForm']}>
                  <label>
                    New encounter name
                    <input
                      maxLength={1000}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>
                  <button
                    onClick={() =>
                      create(emptyWorkingCombat(), { kind: 'empty' })
                    }
                  >
                    Create empty encounter
                  </button>
                </div>
              </details>
            </div>
          </div>
          {!selected && (
            <p>
              Create an encounter above, or choose a stored source in Campaign
              Details → Import.
            </p>
          )}
          {selected && !historical && <p>Current · editable</p>}
          {selected && !historical && (
            <CombatTracker
              key={`${selected.id}:${selected.generation}:${editorVersion}`}
              campaign={{
                active,
                state: selected.state,
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
        </>
      )}
    </>
  );
}
