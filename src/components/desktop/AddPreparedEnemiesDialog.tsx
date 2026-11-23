import { useRef, useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import {
  placedPreparedEnemyIds,
  preparedEnemiesInSession,
} from '../../helpers/campaignPreparedEnemies';
import type { PreparedEnemy } from '../../helpers/campaignPreparedEnemies';
import { addPreparedEnemiesToWorkingCombat } from '../../helpers/campaignWorkingCombat';
import type { WorkingCombat } from '../../helpers/campaignWorkingCombat';
import PreparedEnemyEditor from './PreparedEnemyEditor';
import PreparedEnemyRows from './PreparedEnemyRows';
import styles from './campaignWorkspace.module.css';

export default function AddPreparedEnemiesDialog({
  document,
  combat,
  onChange,
  onClose,
}: {
  document: CampaignDocument;
  combat: WorkingCombat;
  onChange: (
    change: (doc: CampaignDocument) => CampaignDocument
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [roundIndex] = useState(combat.state.activeRound);
  const [change] = useState(() => onChange);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<PreparedEnemy>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const { sessionId } = combat;
  const entries = preparedEnemiesInSession(document, sessionId);
  const round = combat.state.rounds[roundIndex];
  const placed = placedPreparedEnemyIds(round);
  const choices = selectedIds.filter((id) => !placed.has(id));

  async function add() {
    if (!choices.length || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await change((doc) =>
        addPreparedEnemiesToWorkingCombat(doc, combat, roundIndex, choices)
      );
      onClose();
    } catch (e) {
      setError(String(e));
      submitting.current = false;
      setBusy(false);
    }
  }
  if (editing)
    return (
      <PreparedEnemyEditor
        entry={editing}
        sessionId={sessionId}
        onChange={change}
        onClose={() => setEditing(undefined)}
      />
    );
  return (
    <div className={styles['dialogShade']}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Add prepared enemies"
        className={styles['continuationDialog']}
        onSubmit={(event) => {
          event.preventDefault();
          void add();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            if (!busy) onClose();
          }
        }}
      >
        <h2>Add prepared enemies</h2>
        <fieldset className={styles['sessionTransfer']}>
          <legend>{round?.label || `Round ${roundIndex + 1}`}</legend>
          <PreparedEnemyRows
            entries={entries}
            selectedIds={choices}
            placedIds={placed}
            disabled={busy}
            onToggle={(id, checked) =>
              setSelectedIds((ids) =>
                checked ? [...ids, id] : ids.filter((item) => item !== id)
              )
            }
            onEdit={setEditing}
          />
          <small aria-live="polite">{choices.length} selected</small>
        </fieldset>
        {error && <p role="alert">{error}</p>}
        <footer className={styles['sessionDialogFooter']}>
          <button type="button" autoFocus disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={busy || !choices.length}>
            {busy ? 'Adding…' : 'Add selected enemies'}
          </button>
        </footer>
      </form>
    </div>
  );
}
