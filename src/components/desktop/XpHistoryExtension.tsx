import { useRef, useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import {
  confirmXpExtension,
  draftPointRewards,
  previewXpExtension,
  xpExtensionDrafts,
  xpLedger,
} from '../../helpers/campaignXp';
import type { XpExtensionRequest } from '../../helpers/campaignXp';
import { compareXpAwards } from '../../helpers/campaignXpTimeline';
import styles from './xpWorkspace.module.css';

const amount = (xp: number | null | undefined) =>
  xp?.toLocaleString() ?? 'Unknown';

export default function XpHistoryExtension({
  document,
  onConfirm,
  onClose,
}: {
  document: CampaignDocument;
  onConfirm: (
    change: (doc: CampaignDocument) => CampaignDocument
  ) => Promise<void>;
  onClose: () => void;
}) {
  const xp = xpLedger(document);
  const drafts = xpExtensionDrafts(document).sort((a, b) =>
    compareXpAwards(document, a, b)
  );
  const [pointIds, setPointIds] = useState<string[]>([]);
  const [inputs, setInputs] = useState<XpExtensionRequest['openings']>([]);
  const [preview, setPreview] =
    useState<ReturnType<typeof previewXpExtension>>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const operation = useRef<{ id: string; at: string; fingerprint: string }>();
  const submitting = useRef(false);
  const selected = drafts.filter((p) => pointIds.includes(p.id));
  const characters = new Set(
    selected.flatMap((p) =>
      draftPointRewards(document, p).flatMap((r) =>
        r.recipients.filter((c) => c.eligible).map((c) => c.characterId)
      )
    )
  );
  const sessionLabel = (id: string) =>
    document.sessions.find((s) => s.id === id)?.label;
  const name = (id: string) =>
    document.party?.roster.find((c) => c.id === id)?.name ?? id;
  const openings = Array.from(characters).map(
    (characterId) =>
      inputs.find((o) => o.characterId === characterId) ?? {
        characterId,
        sessionId: '',
        balance: null,
      }
  );
  const request = { pointIds: selected.map((p) => p.id), openings };
  const update = (opening: XpExtensionRequest['openings'][number]) => {
    setInputs((entries) => [
      ...entries.filter((o) => o.characterId !== opening.characterId),
      opening,
    ]);
    setPreview(undefined);
    setError('');
  };
  const review = () => {
    setError('');
    setPreview(undefined);
    try {
      setPreview(previewXpExtension(document, request));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  const confirm = async () => {
    if (!preview || submitting.current) return;
    const { fingerprint } = preview;
    if (operation.current?.fingerprint !== fingerprint)
      operation.current = {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        fingerprint,
      };
    const { id, at } = operation.current;
    submitting.current = true;
    setBusy(true);
    try {
      await onConfirm((doc) =>
        confirmXpExtension(doc, request, fingerprint, id, at)
      );
      onClose();
    } catch (e) {
      setPreview(undefined);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <div className={styles['backdrop']}>
      <section
        className={styles['modal']}
        role="dialog"
        aria-modal="true"
        aria-label="Extend XP history backward"
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !busy) onClose();
        }}
      >
        <h2>Extend history backward</h2>
        {drafts.length ? (
          <fieldset disabled={busy}>
            <legend>Historical award drafts</legend>
            {drafts.map((point) => (
              <label key={point.id} className={styles['check']}>
                <input
                  type="checkbox"
                  checked={pointIds.includes(point.id)}
                  onChange={(e) => {
                    setPointIds(
                      e.target.checked
                        ? [...pointIds, point.id]
                        : pointIds.filter((id) => id !== point.id)
                    );
                    setPreview(undefined);
                    setError('');
                  }}
                />
                {sessionLabel(point.position.sessionId)} · {point.label}
              </label>
            ))}
          </fieldset>
        ) : (
          <p>
            Create award drafts in sessions before the current opening to
            reconcile them here.
          </p>
        )}
        {openings.length > 0 && (
          <div className={styles['tableScroll']}>
            <table>
              <thead>
                <tr>
                  <th>Character</th>
                  <th>Earlier session</th>
                  <th>Earlier opening XP</th>
                  <th>XP added</th>
                  <th>Reconstructed</th>
                  <th>Existing cutoff</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                {openings.map((opening) => {
                  const id = opening.characterId;
                  const prior = xp.openings.find((o) => o.characterId === id);
                  const cutoff = document.sessions.findIndex(
                    (s) => s.id === prior?.sessionId
                  );
                  const row = preview?.rows.find(
                    (r) => r.replacement.characterId === id
                  );
                  const difference = row?.difference;
                  return (
                    <tr key={id}>
                      <th scope="row">{name(id)}</th>
                      <td>
                        <select
                          aria-label={`${name(id)} earlier session`}
                          value={opening.sessionId}
                          disabled={busy}
                          onChange={(e) =>
                            update({ ...opening, sessionId: e.target.value })
                          }
                        >
                          <option value="">Choose session</option>
                          {document.sessions
                            .slice(0, Math.max(0, cutoff))
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td>
                        <input
                          aria-label={`${name(id)} earlier opening XP`}
                          type="number"
                          min={0}
                          value={opening.balance ?? ''}
                          disabled={busy}
                          onChange={(e) =>
                            update({
                              ...opening,
                              balance:
                                e.target.value === ''
                                  ? null
                                  : e.target.valueAsNumber,
                            })
                          }
                        />
                      </td>
                      <td>{row ? amount(row.applied) : '—'}</td>
                      <td>{row ? amount(row.reconstructed) : '—'}</td>
                      <td>
                        {amount(prior?.balance)}
                        {prior && (
                          <small>{sessionLabel(prior.sessionId)}</small>
                        )}
                      </td>
                      <td>
                        {row
                          ? (difference && difference > 0 ? '+' : '') +
                            amount(difference)
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {preview?.rows.some((row) => row.difference !== 0) && (
          <p role="status">
            Every earlier opening must reconcile exactly with the existing
            cutoff.
          </p>
        )}
        {error && <p role="alert">{error}</p>}
        <div className={styles['footer']}>
          <button disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button disabled={busy || !selected.length} onClick={review}>
            Preview reconciliation
          </button>
          {preview && (
            <button
              className={styles['primary']}
              disabled={
                busy ||
                !preview.awards.length ||
                preview.rows.some((row) => row.difference !== 0)
              }
              onClick={() => void confirm()}
            >
              Confirm extension
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
