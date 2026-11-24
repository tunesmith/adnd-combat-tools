import { useRef, useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import { sessionDetails } from '../../helpers/campaignSessionMetadata';
import type { CampaignSession } from '../../helpers/campaignSnapshots';
import SessionDetailsFields from './SessionDetailsFields';
import styles from './campaignWorkspace.module.css';

export default function EditSessionDetailsDialog({
  session,
  sessions,
  onSave,
  onClose,
}: {
  session: CampaignSession;
  sessions: CampaignSession[];
  onSave: (
    change: (doc: CampaignDocument) => CampaignDocument
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(() => ({
    label: session.label,
    date: session.date ?? '',
    number: session.sessionNumber?.toString() ?? '',
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);

  async function save() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      sessionDetails(sessions, draft, session);
      await onSave((doc) => {
        const current = doc.sessions.find((s) => s.id === session.id);
        if (!current) throw new Error('The session is missing.');
        const details = sessionDetails(doc.sessions, draft, current);
        return {
          ...doc,
          sessions: doc.sessions.map((s) =>
            s.id === session.id ? { ...s, ...details } : s
          ),
        };
      });
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <div className={styles['dialogShade']}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-session-details-title"
        className={styles['continuationDialog']}
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !busy) {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }
          if (e.key === 'Tab' && !busy) {
            const first = e.currentTarget.querySelector('input');
            const last =
              e.currentTarget.querySelector<HTMLButtonElement>(
                'button[type="submit"]:not(:disabled)'
              ) ??
              e.currentTarget.querySelector<HTMLButtonElement>(
                'button[type="button"]'
              );
            if (e.shiftKey && e.target === first && last) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && e.target === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <h2 id="edit-session-details-title">Edit session details</h2>
        <fieldset disabled={busy} className={styles['sessionFields']}>
          <SessionDetailsFields
            draft={draft}
            onChange={setDraft}
            numberRequired={session.sessionNumber !== undefined}
          />
        </fieldset>
        {error && (
          <p role="alert" className={styles['sessionError']}>
            {error}
          </p>
        )}
        <footer className={styles['sessionDialogFooter']}>
          <button type="button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={busy || !draft.label.trim()}>
            {busy ? 'Saving…' : 'Save details'}
          </button>
        </footer>
      </form>
    </div>
  );
}
