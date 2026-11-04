import { useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import type { WorkingInventory } from '../../helpers/campaignWorkingInventory';
import type { EncumbranceDmDocumentV9 } from '../../types/encumbrance';
import type { Json } from '../../helpers/campaignSnapshots';
import { Inspection } from './CampaignSnapshots';
import styles from './campaignWorkspace.module.css';
export default function CampaignHistory({
  document,
  sessionId,
  type,
  onStart,
}: {
  document: CampaignDocument;
  sessionId: string;
  type: 'combat' | 'inventory';
  onStart?: (
    inventory: EncumbranceDmDocumentV9,
    origin: WorkingInventory['origin']
  ) => void;
}) {
  const [selected, setSelected] = useState('');
  const entries = [
    ...document.records
      .filter((r) => r.sessionId === sessionId && r.type === type)
      .flatMap((r) =>
        r.revisions.map((v, i) => ({
          id: v.id,
          title: r.title,
          label: `Imported revision ${i + 1}`,
          at: v.importedAt,
          payload: v.payload,
          origin: { kind: 'import' as const, recordId: r.id, revisionId: v.id },
          source: v.sourceText,
        }))
      ),
    ...(type === 'inventory'
      ? document.inventoryCheckpoints
          .filter((c) => c.sessionId === sessionId)
          .map((c) => ({
            id: c.id,
            title: c.label,
            label: 'Named checkpoint',
            at: c.capturedAt,
            payload: JSON.parse(JSON.stringify(c.document)) as Json,
            origin: { kind: 'checkpoint' as const, checkpointId: c.id },
            source: JSON.stringify(c.document, null, 2),
          }))
      : []),
  ];
  const preferred = document.records.find(
    (r) => r.sessionId === sessionId && r.type === type
  )?.currentRevisionId;
  const entry =
    entries.find((e) => e.id === selected) ||
    entries.find((e) => e.id === preferred) ||
    entries[0];
  return (
    <div className={styles['historyGrid']}>
      <aside>
        <h3>{type === 'combat' ? 'Captured combats' : 'Inventory history'}</h3>
        {entries.length === 0 && (
          <p>
            No historical {type === 'combat' ? 'combats' : 'inventories'} for
            this session yet.
          </p>
        )}
        {entries.map((e) => (
          <button
            key={e.id}
            className={styles['historyCard']}
            aria-pressed={entry?.id === e.id}
            onClick={() => setSelected(e.id)}
          >
            <strong>{e.title}</strong>
            <span>{e.label}</span>
            <small>{new Date(e.at).toLocaleString()}</small>
          </button>
        ))}
      </aside>
      {entry && (
        <article className={styles['historyDetail']}>
          <span className={styles['historical']}>Historical · read only</span>
          <h2>{entry.title}</h2>
          <p>
            {entry.label} · captured {new Date(entry.at).toLocaleString()}
          </p>
          {type === 'inventory' && onStart && (
            <>
              <p>
                Starting a working copy preserves this history. Any current
                working inventory is checkpointed before replacement.
              </p>
              <button
                onClick={() =>
                  onStart(
                    entry.payload as unknown as EncumbranceDmDocumentV9,
                    entry.origin
                  )
                }
              >
                Use as working inventory
              </button>
            </>
          )}
          <Inspection key={entry.id} payload={entry.payload} type={type} />
          <details>
            <summary>Original source / checkpoint detail</summary>
            <pre className={styles['source']}>{entry.source}</pre>
          </details>
        </article>
      )}
    </div>
  );
}
