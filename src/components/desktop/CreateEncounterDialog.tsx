import { useRef, useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import { createEncounterFromParty } from '../../helpers/campaignWorkingCombat';
import styles from './campaignWorkspace.module.css';

export default function CreateEncounterDialog({
  document,
  sessionId,
  selectedId,
  onCreate,
  onClose,
}: {
  document: CampaignDocument;
  sessionId: string;
  selectedId?: string;
  onCreate: (
    change: (doc: CampaignDocument) => CampaignDocument
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [sources] = useState(() =>
    document.workingCombats.filter(
      (c) =>
        c.sessionId === sessionId &&
        !c.removedAt &&
        c.state.rounds[c.state.rounds.length - 1]?.party.length
    )
  );
  const [sourceId, setSourceId] = useState(
    () => sources.find((c) => c.id === selectedId)?.id || ''
  );
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const identity = useRef<{
    encounterId: string;
    checkpointId: string;
    at: string;
  }>();
  // Preserve the document owner captured when the dialog opened.
  const [create] = useState(() => onCreate);
  async function submit() {
    if (!name.trim() || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    const ids = identity.current ?? {
      encounterId: crypto.randomUUID(),
      checkpointId: crypto.randomUUID(),
      at: new Date().toISOString(),
    };
    identity.current = ids;
    const source = sources.find((c) => c.id === sourceId);
    try {
      await create((d) =>
        createEncounterFromParty(
          d,
          sessionId,
          name,
          source,
          ids.encounterId,
          ids.checkpointId,
          ids.at
        )
      );
      onClose();
    } catch (e) {
      setError(String(e));
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <div className={styles['dialogShade']}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Create encounter"
        className={styles['continuationDialog']}
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            if (!busy) onClose();
          }
        }}
      >
        <h2>Create encounter</h2>
        <label className={styles['sessionNameField']}>
          Name
          <input
            autoFocus
            required
            maxLength={1000}
            value={name}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className={styles['sessionNameField']}>
          Start with
          <select
            value={sourceId}
            disabled={busy}
            onChange={(e) => setSourceId(e.target.value)}
          >
            <option value="">Empty</option>
            {sources.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} · {c.state.rounds[c.state.rounds.length - 1]?.label} ·{' '}
                {c.state.rounds[c.state.rounds.length - 1]?.party.length} party
                members
              </option>
            ))}
          </select>
        </label>
        {error && <p role="alert">{error}</p>}
        <footer className={styles['sessionDialogFooter']}>
          <button type="button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={busy || !name.trim()}>
            {busy ? 'Creating…' : 'Create encounter'}
          </button>
        </footer>
      </form>
    </div>
  );
}
