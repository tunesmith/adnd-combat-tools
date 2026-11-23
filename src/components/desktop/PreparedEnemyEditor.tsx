import { useRef, useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import { changePreparedEnemy } from '../../helpers/campaignPreparedEnemies';
import type { PreparedEnemy } from '../../helpers/campaignPreparedEnemies';
import { createBaseCombatant } from '../../helpers/trackerState';
import type { TrackerCombatant } from '../../types/tracker';
import TrackerCombatantInput from '../tracker/TrackerCombatantInput';
import styles from './campaignWorkspace.module.css';

export default function PreparedEnemyEditor({
  entry,
  sessionId,
  onChange,
  onClose,
}: {
  entry?: PreparedEnemy;
  sessionId: string;
  onChange: (
    change: (doc: CampaignDocument) => CampaignDocument
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [modalRoot, setModalRoot] = useState<HTMLDivElement | null>(null);
  const [initial] = useState<TrackerCombatant>(() =>
    entry ? { ...entry.combatant, key: 0 } : createBaseCombatant(0, 'enemy', '')
  );
  const [id] = useState(() => entry?.id ?? crypto.randomUUID());
  const [change] = useState(() => onChange);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);

  async function save(
    { key: _key, name, ...combatant }: TrackerCombatant,
    notes: string
  ) {
    if (!name?.trim() || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await change((doc) =>
        changePreparedEnemy(doc, sessionId, entry, {
          id,
          combatant: { ...combatant, name: name.trim() },
          notes,
        })
      );
      onClose();
    } catch (e) {
      setError(String(e));
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <div
      id="prepared-enemy-modal"
      ref={setModalRoot}
      className={styles['preparedEditorLayer']}
    >
      {modalRoot && (
        <TrackerCombatantInput
          combatant={initial}
          side="enemy"
          modalRootId={modalRoot.id}
          preparedEnemy={{
            title: entry ? 'Edit prepared enemy' : 'Add prepared enemy',
            notes: entry?.notes ?? '',
            busy,
            error,
            onSave: (combatant, notes) => void save(combatant, notes),
            onCancel: onClose,
          }}
        />
      )}
    </div>
  );
}
