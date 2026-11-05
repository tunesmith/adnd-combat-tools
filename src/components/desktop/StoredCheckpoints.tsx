import { useState } from 'react';
import { activateCheckpoint } from '../../helpers/campaignImport';
import HistoricalCombat from './HistoricalCombat';
import HistoricalInventory from './HistoricalInventory';
import type { CampaignDocument } from '../../helpers/campaignDocument';
function required<T>(v: T | undefined): T {
  if (!v) throw new Error('Missing checkpoint');
  return v;
}
export default function StoredCheckpoints({
  document,
  sessionId,
  busy,
  apply,
}: {
  document: CampaignDocument;
  sessionId: string;
  busy: boolean;
  apply: (
    doc: CampaignDocument,
    token?: number,
    purpose?: 'import' | 'activate-source'
  ) => Promise<boolean>;
}) {
  const [selected, setSelected] = useState(''),
    [confirm, setConfirm] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState('');
  const entries = [
    ...document.combatCheckpoints
      .filter((c) => c.sessionId === sessionId)
      .map((c) => ({
        id: c.id,
        label: c.label,
        at: c.capturedAt,
        type: 'combat' as const,
      })),
    ...document.inventoryCheckpoints
      .filter((c) => c.sessionId === sessionId)
      .map((c) => ({
        id: c.id,
        label: c.label,
        at: c.capturedAt,
        type: 'inventory' as const,
      })),
  ];
  const entry = entries.find((e) => e.id === selected),
    current = document.workingInventories.find(
      (w) => w.sessionId === sessionId
    );
  async function activate() {
    if (!entry || pending) return;
    setPending(true);
    try {
      const next = activateCheckpoint(
        document,
        entry.type,
        entry.id,
        sessionId,
        {
          workingId: crypto.randomUUID(),
          checkpointId: crypto.randomUUID(),
          at: new Date().toISOString(),
        }
      );
      if (await apply(next, undefined, 'activate-source')) {
        setConfirm(false);
        setSelected('');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setPending(false);
    }
  }
  if (!entries.length) return null;
  return (
    <details>
      <summary>Stored checkpoints</summary>
      <label>
        Checkpoint{' '}
        <select
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            setConfirm(false);
          }}
        >
          <option value="">Choose a stored checkpoint</option>
          {entries.map((e) => (
            <option key={e.id} value={e.id}>
              {e.type} · {e.label} · {new Date(e.at).toLocaleString()}
            </option>
          ))}
        </select>
      </label>
      {entry && (
        <>
          <button
            disabled={busy || pending}
            onClick={() => {
              if (entry.type === 'inventory' && current) setConfirm(true);
              else void activate();
            }}
          >
            {entry.type === 'combat'
              ? 'Create encounter from checkpoint'
              : current
              ? 'Replace current inventory…'
              : 'Use as current inventory'}
          </button>
          {confirm && (
            <div
              role="dialog"
              aria-label="Replace inventory"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setConfirm(false);
              }}
            >
              <p>
                Replace {current?.title} in{' '}
                {document.sessions.find((s) => s.id === sessionId)?.label}?
                Current work will be checkpointed.
              </p>
              <button autoFocus onClick={() => setConfirm(false)}>
                Cancel
              </button>
              <button disabled={pending} onClick={() => void activate()}>
                Replace inventory
              </button>
            </div>
          )}
          <details>
            <summary>Readable preview</summary>
            {entry.type === 'combat' ? (
              <HistoricalCombat
                key={entry.id}
                state={
                  required(
                    document.combatCheckpoints.find((c) => c.id === entry.id)
                  ).state
                }
              />
            ) : (
              <HistoricalInventory
                key={entry.id}
                document={
                  required(
                    document.inventoryCheckpoints.find((c) => c.id === entry.id)
                  ).document
                }
              />
            )}
          </details>
        </>
      )}
      <p role="status">{error}</p>
    </details>
  );
}
