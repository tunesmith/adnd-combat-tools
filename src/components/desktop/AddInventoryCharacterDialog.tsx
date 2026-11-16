import { useRef, useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import { eligibleSessionProfiles } from '../../helpers/campaignParty';
import {
  addCampaignInventoryCharacter,
  earlierInventoryCharacters,
  returningInventoryId,
  inventoryMembership,
  inventoryNameKey,
} from '../../helpers/campaignInventoryMembership';
import styles from './campaignWorkspace.module.css';
export default function AddInventoryCharacterDialog({
  document,
  sessionId,
  workingId,
  onChange,
  onClose,
}: {
  document: CampaignDocument;
  sessionId: string;
  workingId: string;
  onChange: (change: (d: CampaignDocument) => CampaignDocument) => boolean;
  onClose: () => void;
}) {
  const [sources] = useState(() =>
    earlierInventoryCharacters(document, sessionId)
  );
  const [profiles] = useState(() => {
    const { matched } = inventoryMembership(document, sessionId);
    return eligibleSessionProfiles(document, sessionId).flatMap((p) => {
      const c = document.party?.roster.find((c) => c.id === p.characterId);
      return c && !matched.some((m) => m.characterId === c.id) ? [c] : [];
    });
  });
  const [profileId, setProfileId] = useState(''),
    [name, setName] = useState(''),
    [strength, setStrength] = useState(8),
    [sourceKey, setSourceKey] = useState(''),
    [browse, setBrowse] = useState(false),
    [error, setError] = useState('');
  const operation = useRef<{ id: string; checkpointId: string; at: string }>();
  const returning = returningInventoryId(document, sessionId, name, sources);
  const recentFirst = [...sources].reverse();
  const relevant = returning
    ? recentFirst.filter((s) => s.character.id === returning)
    : recentFirst.filter(
        (s) => inventoryNameKey(s.character.name) === inventoryNameKey(name)
      );
  const latest = returning ? relevant.slice(0, 1) : [];
  const browseAll = !profileId && !relevant.length;
  const archive = browseAll ? recentFirst : relevant;
  const choices = browse ? archive : latest;
  function resetSource() {
    setSourceKey('');
    setBrowse(false);
    setError('');
  }
  const selected = sources.find((c) => c.key === sourceKey);
  return (
    <div className={styles['dialogShade']}>
      <form
        className={styles['continuationDialog']}
        role="dialog"
        aria-modal="true"
        aria-label="Add inventory character"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
          }
        }}
        onSubmit={(e) => {
          e.preventDefault();
          try {
            if (!operation.current)
              operation.current = {
                id: crypto.randomUUID(),
                checkpointId: crypto.randomUUID(),
                at: new Date().toISOString(),
              };
            const op = operation.current;
            const id = selected?.character.id ?? returning ?? op.id;
            const request = {
              workingId,
              sessionId,
              characterId: id,
              name,
              strength,
              ...(selected
                ? {
                    source: {
                      workingId: selected.workingId,
                      characterId: selected.character.id,
                      fingerprint: selected.fingerprint,
                      checkpointId: op.checkpointId,
                      at: op.at,
                    },
                  }
                : {}),
            };
            if (
              onChange((doc) => addCampaignInventoryCharacter(doc, request))
            ) {
              onClose();
            }
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
          }
        }}
      >
        <h2>Add inventory character</h2>
        {profiles.length > 0 && (
          <label className={styles['sessionNameField']}>
            Party character
            <select
              value={profileId}
              onChange={(e) => {
                setProfileId(e.target.value);
                const c = profiles.find((c) => c.id === e.target.value);
                setName(c?.name ?? '');
                resetSource();
              }}
            >
              <option value="">Other inventory character</option>
              {profiles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className={styles['inventoryCharacterFields']}>
          <label className={styles['sessionNameField']}>
            Name
            <input
              required
              autoFocus
              value={selected?.character.name ?? name}
              disabled={!!selected}
              onChange={(e) => {
                setName(e.target.value);
                setProfileId('');
                resetSource();
              }}
            />
          </label>
          <label className={styles['sessionNameField']}>
            Strength
            <input
              type="number"
              min={1}
              max={25}
              value={selected?.character.strength.score ?? strength}
              disabled={!!selected}
              onChange={(e) => setStrength(e.target.valueAsNumber)}
            />
          </label>
        </div>
        <label className={styles['sessionNameField']}>
          Starting inventory
          <select
            value={sourceKey}
            onChange={(e) => {
              setSourceKey(e.target.value);
              setError('');
            }}
          >
            <option value="">Empty</option>
            {choices.map((c) => (
              <option key={c.key} value={c.key}>
                {c.sessionLabel} · {c.character.name || 'Unnamed character'}
                {choices.some(
                  (other) =>
                    other.key !== c.key &&
                    other.sessionLabel === c.sessionLabel &&
                    inventoryNameKey(other.character.name) ===
                      inventoryNameKey(c.character.name)
                )
                  ? ' · ' + c.character.id
                  : ''}
              </option>
            ))}
          </select>
        </label>
        {archive.length > latest.length && (
          <label className={styles['continuationChoice']}>
            <input
              type="checkbox"
              checked={browse}
              onChange={(e) => {
                setBrowse(e.target.checked);
                setSourceKey('');
              }}
            />
            {browseAll
              ? 'Browse earlier inventory holders'
              : 'Show earlier inventories for this character'}
          </label>
        )}
        {selected && (
          <p>
            {selected.character.inventory.length} entries copied from{' '}
            {selected.sessionLabel}. Edit the copy afterward to reflect what
            they return with.
          </p>
        )}
        {error && (
          <p role="alert" className={styles['sessionError']}>
            {error}
          </p>
        )}
        <footer
          className={`${styles['sessionDialogFooter']} ${styles['inventoryCharacterFooter']}`}
        >
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={!selected && !name.trim()}>
            Add character
          </button>
        </footer>
      </form>
    </div>
  );
}
