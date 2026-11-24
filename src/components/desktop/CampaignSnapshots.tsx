import {
  bankingReplacementReview,
  bankHolderName,
} from '../../helpers/campaignBanking';
import BankBalances from './BankBalances';
import { useEffect, useRef, useState } from 'react';
import HistoricalCombat from './HistoricalCombat';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import { nextSessionNumber } from '../../helpers/campaignSessionMetadata';
import { ownedHistory } from '../../helpers/campaignHistory';
import {
  importCampaignSource,
  activateSource,
} from '../../helpers/campaignImport';
import StoredCheckpoints from './StoredCheckpoints';
import HistoricalInventory from './HistoricalInventory';
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
import type { EncumbranceDmDocument } from '../../types/encumbrance';
import styles from './desktopWorkspace.module.css';
const uid = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `capture-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}-${Math.random().toString(36).slice(2)}`;
function Inspection({
  payload,
  type,
}: {
  payload: Json;
  type: 'combat' | 'inventory';
}) {
  return type === 'combat' ? (
    <HistoricalCombat state={payload as unknown as TrackerState} />
  ) : (
    <HistoricalInventory
      document={payload as unknown as EncumbranceDmDocument}
    />
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [useImport, setUseImport] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const [confirmInventory, setConfirmInventory] = useState(false);
  const [activation, setActivation] = useState(false);
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
    ? document.records.filter(
        (r) =>
          r.type === type &&
          r.revisions.some(
            (v) =>
              contentIdentity(r.type, v.payload) ===
              contentIdentity(type, preview.payload)
          )
      )
    : [];
  async function apply(
    next: CampaignDocument,
    expected = token,
    purpose?: 'import' | 'activate-source'
  ) {
    try {
      if (!window.campaignStorage)
        throw new Error('Campaign storage is unavailable.');
      await window.campaignStorage.replace(next, expected, purpose);
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
      const interpreted = interpretSource(sourceKind, sourceText);
      setPreview(interpreted);
      if (!recordTitle.trim())
        setTitle(
          typeof interpreted.payload === 'object' &&
            interpreted.payload &&
            !Array.isArray(interpreted.payload) &&
            typeof interpreted.payload['title'] === 'string'
            ? interpreted.payload['title']
            : sourceName.replace(/\.json$/i, '') ||
                (sourceKind === 'inventory-json'
                  ? 'Party inventory'
                  : 'Imported combat')
        );
      setPreviewToken(token);
      setDistinct(false);
      setMessage('Preview ready.');
    } catch (error) {
      setPreview(null);
      setMessage(String(error));
    }
  }
  function clearDraft() {
    setText('');
    setName('');
    setPreview(null);
    setTitle('');
    setTarget('new');
    setDistinct(false);
    setUseImport(true);
    setConfirmInventory(false);
    setPreviewOpen(false);
  }
  const currentInventory = document.workingInventories.find(
    (w) => w.sessionId === sessionId
  );
  async function attach(confirmed = false) {
    if (!preview || !sessionId || inFlight.current) return;
    if (
      useImport &&
      type === 'inventory' &&
      (currentInventory ||
        bankingReplacementReview(
          document,
          sessionId,
          preview.payload as unknown as EncumbranceDmDocument
        ).required) &&
      !confirmed &&
      !(
        target !== 'new' &&
        matches.some((r) => r.id === target) &&
        currentInventory &&
        ownedHistory(document, 'inventory', currentInventory).records.has(
          target
        )
      )
    ) {
      setConfirmInventory(true);
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    try {
      const result = importCampaignSource(
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
          workingId: uid(),
          checkpointId: uid(),
          bankingReview:
            confirmed && type === 'inventory'
              ? bankingReplacementReview(
                  document,
                  sessionId,
                  preview.payload as unknown as EncumbranceDmDocument
                ).fingerprint
              : undefined,
        },
        useImport
      );
      if (await apply(result.document, previewToken, 'import')) {
        setSelected(result.recordId);
        setMessage(
          !useImport
            ? result.duplicate
              ? 'Already stored — existing source selected.'
              : 'Snapshot stored.'
            : result.keptWorking
            ? 'Source stored. Existing working edits retained.'
            : 'Imported and ready to edit.'
        );
        clearDraft();
      }
    } catch (error) {
      setMessage(String(error));
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  async function openStored(reuse = true) {
    if (!record || !revision || inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    try {
      const next = activateSource(
        document,
        record.id,
        revision.id,
        sessionId,
        {
          workingId: uid(),
          checkpointId: uid(),
          at: new Date().toISOString(),
          bankingReview:
            activation && record.type === 'inventory'
              ? bankingReplacementReview(
                  document,
                  sessionId,
                  revision.payload as unknown as EncumbranceDmDocument
                ).fingerprint
              : undefined,
        },
        reuse
      );
      if (await apply(next, token, 'activate-source')) setActivation(false);
    } catch (error) {
      setMessage(String(error));
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <section className={styles['snapshots']} aria-label="Campaign snapshots">
      {activeSessionId === undefined && <h3>Session imports</h3>}
      {activeSessionId === undefined && (
        <fieldset disabled={busy || submitting}>
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
                  sessions: [
                    ...document.sessions,
                    {
                      id,
                      label: label.trim(),
                      sessionNumber: nextSessionNumber(document.sessions),
                    },
                  ],
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
      <div>
        <fieldset disabled={busy || submitting}>
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
                  clearDraft();
                  setMessage('');
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
              <p>
                {type === 'combat'
                  ? `${
                      (preview.payload as unknown as TrackerState).rounds.length
                    } rounds`
                  : `${
                      (preview.payload as unknown as EncumbranceDmDocument)
                        .characters.length
                    } characters · ${
                      (preview.payload as unknown as EncumbranceDmDocument)
                        .version === 10
                        ? (
                            preview.payload as unknown as {
                              storageLocations: unknown[];
                            }
                          ).storageLocations.length
                        : 0
                    } storage locations`}{' '}
                · Original source retained
              </p>
              <label>
                Record title
                <input
                  value={recordTitle}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label>
                Import outcome
                <select
                  value={useImport ? 'use' : 'store'}
                  onChange={(e) => setUseImport(e.target.value === 'use')}
                >
                  <option value="use">Import and use</option>
                  <option value="store">Store snapshot only</option>
                </select>
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
                onClick={() => void attach(false)}
              >
                {useImport ? 'Import and use' : 'Store snapshot only'}
              </button>
              <button
                onClick={() => {
                  clearDraft();
                  setMessage('Import cancelled.');
                }}
              >
                Cancel import
              </button>
            </>
          )}
        </fieldset>
      </div>
      {preview && (
        <details
          className={styles['readablePreview']}
          onToggle={(e) => setPreviewOpen(e.currentTarget.open)}
        >
          <summary>Readable preview</summary>
          {previewOpen && (
            <Inspection
              key={preview.contentHash}
              payload={preview.payload}
              type={type}
            />
          )}
        </details>
      )}
      {confirmInventory && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Replace inventory"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setConfirmInventory(false);
          }}
        >
          <p>
            Replace “{currentInventory?.title}” in{' '}
            {document.sessions.find((s) => s.id === sessionId)?.label}? Current
            possessions will be preserved in a checkpoint.
          </p>
          {preview && type === 'inventory' && (
            <BankBalances
              label="Import money comparison"
              caption="Possessions comparison · Banking ledger stays unchanged"
              rows={bankingReplacementReview(
                document,
                sessionId,
                preview.payload as unknown as EncumbranceDmDocument
              ).comparison.flatMap((r) => [
                {
                  id: r.holderId + '-before',
                  label: bankHolderName(document, r.holderId) + ' · current',
                  amounts: r.before,
                },
                {
                  id: r.holderId + '-after',
                  label: bankHolderName(document, r.holderId) + ' · imported',
                  amounts: r.after,
                },
              ])}
            />
          )}
          <button autoFocus onClick={() => setConfirmInventory(false)}>
            Cancel
          </button>
          <button disabled={submitting} onClick={() => void attach(true)}>
            Replace inventory
          </button>
        </div>
      )}
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
      <StoredCheckpoints
        document={document}
        sessionId={sessionId}
        busy={busy || submitting}
        apply={apply}
      />
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
          <button
            disabled={busy || submitting}
            onClick={() => {
              if (
                record.type === 'inventory' &&
                (currentInventory ||
                  bankingReplacementReview(
                    document,
                    sessionId,
                    revision.payload as unknown as EncumbranceDmDocument
                  ).required)
              )
                setActivation(true);
              else void openStored();
            }}
          >
            {record.type === 'combat'
              ? 'Open or create encounter'
              : currentInventory
              ? 'Replace current inventory…'
              : 'Use as current inventory'}
          </button>
          {activation && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Replace inventory"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setActivation(false);
              }}
            >
              <p>
                Replace {currentInventory?.title} in{' '}
                {document.sessions.find((s) => s.id === sessionId)?.label}?
                Current possessions will be checkpointed.
              </p>
              {record.type === 'inventory' && (
                <BankBalances
                  label="Stored inventory money comparison"
                  caption="Possessions comparison · Banking ledger stays unchanged"
                  rows={bankingReplacementReview(
                    document,
                    sessionId,
                    revision.payload as unknown as EncumbranceDmDocument
                  ).comparison.flatMap((r) => [
                    {
                      id: r.holderId + '-before',
                      label:
                        bankHolderName(document, r.holderId) + ' · current',
                      amounts: r.before,
                    },
                    {
                      id: r.holderId + '-after',
                      label: bankHolderName(document, r.holderId) + ' · stored',
                      amounts: r.after,
                    },
                  ])}
                />
              )}
              <button autoFocus onClick={() => setActivation(false)}>
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={() => void openStored(false)}
              >
                Replace inventory
              </button>
            </div>
          )}
          <details className={styles['readablePreview']}>
            <summary>Readable preview</summary>
            <Inspection
              key={revision.id}
              payload={revision.payload}
              type={record.type}
            />
          </details>
          <details>
            <summary>Source &amp; provenance</summary>
            <pre className={styles['source']}>{revision.sourceText}</pre>
          </details>
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
