import { useEffect, useState } from 'react';
import HistoricalCombat from './HistoricalCombat';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import { captureSnapshot } from '../../helpers/campaignCapture';
import {
  interpretSource,
  contentIdentity,
} from '../../helpers/campaignSnapshots';
import type {
  Json,
  SourceKind,
  SnapshotInterpretation,
} from '../../helpers/campaignSnapshots';
import type { TrackerState } from '../../types/tracker';
import type { EncumbranceDmDocumentV9 } from '../../types/encumbrance';
import { encumbranceCatalogById } from '../../tables/encumbranceCatalog';
import {
  getInventoryItemInfo,
  getTotalEncumbranceGp,
  getTotalValueGp,
} from '../../helpers/encumbranceRules';
import styles from './desktopWorkspace.module.css';
const uid = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `capture-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}-${Math.random().toString(36).slice(2)}`;
export function Inspection({
  payload,
  type,
}: {
  payload: Json;
  type: 'combat' | 'inventory';
}) {
  if (type === 'combat')
    return <HistoricalCombat state={payload as unknown as TrackerState} />;
  const data = payload as unknown as EncumbranceDmDocumentV9;
  return (
    <section>
      <h4>DM inventory — {data.characters.length} characters</h4>
      {data.characters.map((c) => (
        <article key={c.id}>
          <h5>
            {c.name || 'Unnamed character'} — {c.inventory.length} inventory
            entries
          </h5>
          <p>
            DM notes: {c.dmNotes || '—'} · Load:{' '}
            {getTotalEncumbranceGp(c, encumbranceCatalogById)} gp · Value:{' '}
            {getTotalValueGp(c, encumbranceCatalogById)} gp
          </p>
          <ul>
            {c.inventory.map((item) => (
              <li key={item.id}>
                <strong>
                  {item.name ||
                    getInventoryItemInfo(item, encumbranceCatalogById)?.name ||
                    item.catalogId}
                </strong>{' '}
                × {item.quantity} · Container:{' '}
                {item.containerId
                  ? c.inventory.find((parent) => parent.id === item.containerId)
                      ?.name || item.containerId
                  : 'None'}
                <p>
                  Player notes: {item.playerNotes || '—'} · DM notes:{' '}
                  {item.dmNotes || '—'} · Identified:{' '}
                  {String(item.fullyIdentified ?? false)} · Value override:{' '}
                  {item.valueGpOverride ?? 'None'}
                </p>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
export default function CampaignSnapshots({
  document,
  token,
  busy,
  activeSessionId,
}: {
  document: CampaignDocument;
  token: number;
  busy: boolean;
  activeSessionId?: string;
}) {
  const [localSessionId, setSession] = useState(document.sessions[0]?.id || '');
  const sessionId = activeSessionId ?? localSessionId;
  const [label, setLabel] = useState('');
  const [message, setMessage] = useState('');
  const [sourceKind, setKind] = useState<SourceKind>('tracker-url');
  const [sourceText, setText] = useState('');
  const [sourceName, setName] = useState('');
  const [preview, setPreview] = useState<SnapshotInterpretation | null>(null);
  const [previewToken, setPreviewToken] = useState(token);
  const [recordTitle, setTitle] = useState('');
  const [target, setTarget] = useState('new');
  const [distinct, setDistinct] = useState(false);
  const [selected, setSelected] = useState('');
  const [rename, setRename] = useState('');
  const record = document.records.find((r) => r.id === selected);
  const revision = record?.revisions.find(
    (r) => r.id === record.currentRevisionId
  );
  useEffect(() => {
    setRename(record?.title || '');
  }, [record?.id, record?.title]);
  const type = sourceKind === 'inventory-json' ? 'inventory' : 'combat';
  const matches = preview
    ? document.records.filter((r) =>
        r.revisions.some(
          (v) =>
            contentIdentity(r.type, v.payload) ===
            contentIdentity(type, preview.payload)
        )
      )
    : [];
  async function apply(next: CampaignDocument, expected = token) {
    try {
      await window.campaignStorage?.replace(next, expected);
      setMessage('Campaign updated.');
      return true;
    } catch (error) {
      setMessage(String(error));
      return false;
    }
  }
  async function pick() {
    try {
      const input = await window.campaignStorage?.pickSource();
      if (input) {
        setText(input.text);
        setName(input.name);
        setPreview(null);
      }
    } catch (error) {
      setMessage(String(error));
    }
  }
  function prepare() {
    try {
      setPreview(interpretSource(sourceKind, sourceText));
      setPreviewToken(token);
      setDistinct(false);
      setMessage(
        'Preview ready. Import time records capture time, not play time.'
      );
    } catch (error) {
      setPreview(null);
      setMessage(String(error));
    }
  }
  async function attach() {
    if (!preview || !sessionId) return;
    try {
      const result = captureSnapshot(
        document,
        {
          sourceKind,
          sourceText,
          sourceName:
            sourceKind === 'tracker-url'
              ? sourceText
              : sourceName || 'Pasted JSON',
          sessionId,
          title: recordTitle || 'Untitled snapshot',
          targetId: target === 'new' ? undefined : target,
          allowDistinct: distinct,
        },
        {
          recordId: uid(),
          revisionId: uid(),
          importedAt: new Date().toISOString(),
        }
      );
      if (await apply(result.document, previewToken)) {
        setSelected(result.recordId);
        setMessage(
          result.duplicate
            ? 'Already imported — selected the existing revision.'
            : 'Snapshot captured.'
        );
        setPreview(null);
      }
    } catch (error) {
      setMessage(String(error));
    }
  }

  return (
    <section className={styles['snapshots']} aria-label="Campaign snapshots">
      <h3>Sessions and captured snapshots</h3>
      <p>
        Imported snapshot—import again to capture later changes. Edits in the
        separate Tracker and Encumbrance tools are not saved into these
        snapshots by Campaign Save.
      </p>
      {activeSessionId === undefined && (
        <fieldset disabled={busy}>
          <legend>Session</legend>
          <select
            aria-label="Selected session"
            value={sessionId}
            onChange={(e) => setSession(e.target.value)}
          >
            <option value="">Select a session</option>
            {document.sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            aria-label="Session label"
            placeholder="Session label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <button
            onClick={async () => {
              if (!label.trim()) return;
              const id = uid();
              if (
                await apply({
                  ...document,
                  sessions: [...document.sessions, { id, label: label.trim() }],
                })
              ) {
                setSession(id);
                setLabel('');
              }
            }}
          >
            Add session
          </button>
          <button
            disabled={!sessionId || !label.trim()}
            onClick={() =>
              void apply({
                ...document,
                sessions: document.sessions.map((s) =>
                  s.id === sessionId ? { ...s, label: label.trim() } : s
                ),
              })
            }
          >
            Rename selected session
          </button>
        </fieldset>
      )}
      <details>
        <summary>Import combat or inventory</summary>
        <fieldset disabled={busy}>
          <div role="group" aria-label="Snapshot source">
            {(
              [
                ['tracker-url', 'Import combat URL'],
                ['tracker-json', 'Import combat JSON'],
                ['inventory-json', 'Import inventory'],
              ] as const
            ).map(([kind, label]) => (
              <button
                key={kind}
                aria-pressed={sourceKind === kind}
                onClick={() => {
                  setKind(kind);
                  setPreview(null);
                  setTarget('new');
                  setName('');
                  setText('');
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {sourceKind !== 'tracker-url' && (
            <button onClick={() => void pick()}>Choose JSON file…</button>
          )}
          <label>
            Original source
            <textarea
              rows={4}
              maxLength={1_000_000}
              value={sourceText}
              onChange={(e) => {
                setText(e.target.value);
                setPreview(null);
              }}
            />
          </label>
          <button disabled={!sourceText} onClick={prepare}>
            Preview import
          </button>
          {preview && (
            <>
              <Inspection
                key={preview.contentHash}
                payload={preview.payload}
                type={type}
              />
              <label>
                Record title
                <input
                  value={recordTitle}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label>
                Import destination
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  <option value="new">New record in selected session</option>
                  {document.records
                    .filter((r) => r.type === type)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        Add revision: {r.title} (
                        {
                          document.sessions.find((s) => s.id === r.sessionId)
                            ?.label
                        }
                        )
                      </option>
                    ))}
                </select>
              </label>
              {matches.length > 0 && (
                <div>
                  <p>Matching snapshots already exist:</p>
                  {matches.map((r) => (
                    <p key={r.id}>
                      {r.title} —{' '}
                      {
                        document.sessions.find((s) => s.id === r.sessionId)
                          ?.label
                      }{' '}
                      <button
                        onClick={() => {
                          setTarget(r.id);
                        }}
                      >
                        Reuse this record
                      </button>
                    </p>
                  ))}
                  {target === 'new' && (
                    <label>
                      <input
                        type="checkbox"
                        checked={distinct}
                        onChange={(e) => setDistinct(e.target.checked)}
                      />
                      This is a distinct encounter/inventory record despite
                      matching content.
                    </label>
                  )}
                </div>
              )}
              <button
                disabled={
                  !sessionId ||
                  (target === 'new' && matches.length > 0 && !distinct)
                }
                onClick={() => void attach()}
              >
                Attach snapshot
              </button>
              <button onClick={() => setPreview(null)}>Cancel import</button>
            </>
          )}
        </fieldset>
      </details>
      <p role="status">{message}</p>
      {(['combat', 'inventory'] as const).map((kind) => (
        <section key={kind}>
          <h4>{kind === 'combat' ? 'Combats' : 'Inventories'}</h4>
          <ul>
            {document.records
              .filter(
                (r) =>
                  r.type === kind && (!sessionId || r.sessionId === sessionId)
              )
              .map((r) => (
                <li key={r.id}>
                  <button onClick={() => setSelected(r.id)}>{r.title}</button> —{' '}
                  {document.sessions.find((s) => s.id === r.sessionId)?.label};{' '}
                  {r.revisions.length} revisions; imported{' '}
                  {new Date(
                    r.revisions[r.revisions.length - 1]?.importedAt || 0
                  ).toLocaleString()}
                </li>
              ))}
          </ul>
        </section>
      ))}
      {record && revision && (
        <article>
          <h4>{record.title}</h4>
          <label>
            Rename record
            <input value={rename} onChange={(e) => setRename(e.target.value)} />
          </label>
          <button
            onClick={() =>
              void apply({
                ...document,
                records: document.records.map((r) =>
                  r.id === record.id ? { ...r, title: rename } : r
                ),
              })
            }
          >
            Apply title
          </button>
          <label>
            Associated session
            <select
              value={record.sessionId}
              onChange={(e) =>
                void apply({
                  ...document,
                  records: document.records.map((r) =>
                    r.id === record.id ? { ...r, sessionId: e.target.value } : r
                  ),
                })
              }
            >
              {document.sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Selected stored revision
            <select
              value={revision.id}
              onChange={(e) =>
                void apply({
                  ...document,
                  records: document.records.map((r) =>
                    r.id === record.id
                      ? { ...r, currentRevisionId: e.target.value }
                      : r
                  ),
                })
              }
            >
              {record.revisions.map((r, i) => (
                <option key={r.id} value={r.id}>
                  Revision {i + 1} — imported{' '}
                  {new Date(r.importedAt).toLocaleString()}
                </option>
              ))}
            </select>
          </label>
          <div role="group" aria-label="Revision navigation">
            {([-1, 1] as const).map((step) => {
              const index = record.revisions.findIndex(
                (r) => r.id === revision.id
              );
              const next = record.revisions[index + step];
              return (
                <button
                  key={step}
                  disabled={!next}
                  onClick={() =>
                    next &&
                    void apply({
                      ...document,
                      records: document.records.map((r) =>
                        r.id === record.id
                          ? { ...r, currentRevisionId: next.id }
                          : r
                      ),
                    })
                  }
                >
                  {step < 0 ? 'Earlier revision' : 'Later revision'}
                </button>
              );
            })}
          </div>
          <p>
            Source format {revision.sourceVersion}; interpretation version{' '}
            {revision.normalizerVersion}. Original source is immutable evidence.
          </p>
          <Inspection
            key={revision.id}
            payload={revision.payload}
            type={record.type}
          />
          <button
            onClick={() =>
              void window.campaignStorage
                ?.exportSource(document.id, record.id, revision.id)
                .then((saved) =>
                  setMessage(
                    saved
                      ? 'Original source exported locally.'
                      : 'Export cancelled.'
                  )
                )
                .catch((error) => setMessage(String(error)))
            }
          >
            Export original{' '}
            {record.type === 'inventory' ? 'DM inventory' : 'combat'} source…
          </button>
        </article>
      )}
    </section>
  );
}
