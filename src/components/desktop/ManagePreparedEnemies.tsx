import { useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import {
  changePreparedEnemy,
  preparedEnemiesInSession,
} from '../../helpers/campaignPreparedEnemies';
import type { PreparedEnemy } from '../../helpers/campaignPreparedEnemies';
import PreparedEnemyEditor from './PreparedEnemyEditor';
import PreparedEnemyRows from './PreparedEnemyRows';
import styles from './campaignWorkspace.module.css';

export default function ManagePreparedEnemies({
  document,
  sessionId,
  onChange,
  onClose,
}: {
  document: CampaignDocument;
  sessionId: string;
  onChange: (
    change: (doc: CampaignDocument) => CampaignDocument
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState<PreparedEnemy | null>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [change] = useState(() => onChange);
  const entries = preparedEnemiesInSession(document, sessionId);
  async function remove(entry: PreparedEnemy) {
    setBusy(true);
    setError('');
    try {
      await change((doc) =>
        changePreparedEnemy(doc, sessionId, entry, undefined)
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  if (editing !== undefined)
    return (
      <PreparedEnemyEditor
        entry={editing ?? undefined}
        sessionId={sessionId}
        onChange={change}
        onClose={() => setEditing(undefined)}
      />
    );
  return (
    <div className={styles['dialogShade']}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Manage prepared enemies"
        className={styles['continuationDialog']}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            if (!busy) onClose();
          }
        }}
      >
        <h2>Manage prepared enemies</h2>
        <PreparedEnemyRows
          entries={entries}
          disabled={busy}
          onEdit={setEditing}
          onRemove={(entry) => void remove(entry)}
        />
        {error && <p role="alert">{error}</p>}
        <footer className={styles['sessionDialogFooter']}>
          <button
            type="button"
            disabled={busy}
            onClick={() => setEditing(null)}
          >
            Add prepared enemy
          </button>
          <button type="button" autoFocus disabled={busy} onClick={onClose}>
            Done
          </button>
        </footer>
      </section>
    </div>
  );
}
