import { useRef, useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import { profilesInSession } from '../../helpers/campaignParty';
import {
  addCampaignInventoryCharacter,
  earlierInventoryCharacters,
  returningInventoryId,
} from '../../helpers/campaignInventoryMembership';
import styles from './campaignWorkspace.module.css';
export default function AddInventoryCharacterDialog({
  document,
  sessionId,
  workingId,
  onChange,
  onAdded,
  onClose,
}: {
  document: CampaignDocument;
  sessionId: string;
  workingId: string;
  onChange: (change: (d: CampaignDocument) => CampaignDocument) => boolean;
  onAdded: () => void;
  onClose: () => void;
}) {
  const [sources] = useState(() =>
    earlierInventoryCharacters(document, sessionId)
  );
  const [profiles] = useState(() =>
    profilesInSession(document, sessionId).flatMap((p) => {
      const c = document.party?.roster.find((c) => c.id === p.characterId);
      return c &&
        !document.workingInventories
          .find((w) => w.id === workingId)
          ?.document.characters.some(
            (h) =>
              h.name.trim().toLocaleLowerCase() ===
              c.name.trim().toLocaleLowerCase()
          )
        ? [c]
        : [];
    })
  );
  const [profileId, setProfileId] = useState(''),
    [name, setName] = useState(''),
    [strength, setStrength] = useState(8),
    [sourceKey, setSourceKey] = useState(''),
    [error, setError] = useState('');
  const operation = useRef<{ id: string; checkpointId: string; at: string }>();
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
            const id =
              selected?.character.id ??
              returningInventoryId(document, sessionId, name) ??
              op.id;
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
              onAdded();
              onClose();
            }
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
          }
        }}
      >
        <h2>Add inventory character</h2>
        {profiles.length > 0 && (
          <label>
            Party character
            <select
              value={profileId}
              onChange={(e) => {
                setProfileId(e.target.value);
                const c = profiles.find((c) => c.id === e.target.value);
                setName(c?.name ?? '');
                setSourceKey('');
                setError('');
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
        <div className={styles['profileFields']}>
          <label>
            Name
            <input
              required
              autoFocus
              value={selected?.character.name ?? name}
              disabled={!!selected}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
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
        <label>
          Starting inventory
          <select
            value={sourceKey}
            onChange={(e) => {
              setSourceKey(e.target.value);
              setError('');
            }}
          >
            <option value="">Empty</option>
            {sources
              .filter(
                (c) =>
                  !profileId ||
                  c.character.name.trim().toLocaleLowerCase() ===
                    profiles
                      .find((p) => p.id === profileId)
                      ?.name.trim()
                      .toLocaleLowerCase()
              )
              .map((c) => (
                <option key={c.key} value={c.key}>
                  {c.sessionLabel} · {c.character.name || 'Unnamed character'}
                </option>
              ))}
          </select>
        </label>
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
        <footer className={styles['sessionDialogFooter']}>
          <span></span>
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
