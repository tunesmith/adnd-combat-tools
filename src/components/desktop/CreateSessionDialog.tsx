import {
  historicalSessionTargets,
  placeHistoricalSession,
} from '../../helpers/campaignSessionOrder';
import { profilesInSession } from '../../helpers/campaignParty';
import { useEffect, useRef, useState } from 'react';
import {
  sessionFingerprint,
  startNextSession,
} from '../../helpers/campaignContinuity';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import styles from './campaignWorkspace.module.css';

export default function CreateSessionDialog({
  document,
  sessionId,
  onCreate,
  onClose,
}: {
  document: CampaignDocument;
  sessionId: string;
  onCreate: (
    change: (doc: CampaignDocument) => CampaignDocument
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [source] = useState(() =>
    document.sessions.find((s) => s.id === sessionId)
  );
  const [fingerprint] = useState(() =>
    source ? sessionFingerprint(document, sessionId) : ''
  );
  const [combats] = useState(() =>
    document.workingCombats.filter(
      (c) => c.sessionId === sessionId && !c.removedAt
    )
  );
  const [inventory] = useState(() =>
    document.workingInventories.find((w) => w.sessionId === sessionId)
  );
  const [label, setLabel] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [carryInventory, setCarryInventory] = useState(false);
  const [copyNotes, setCopyNotes] = useState(false);
  const [profiles] = useState(() => profilesInSession(document, sessionId));
  const [partyIds, setPartyIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const destinationId = useRef<string>();
  const submitting = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const [placement, setPlacement] = useState('');
  const move = placement.startsWith('move:');
  const tail = document.sessions[document.sessions.length - 1];
  const earlier = historicalSessionTargets(document);
  const moveTargets =
    tail?.id === sessionId ? historicalSessionTargets(document, tail.id) : [];

  const transfers = [
    ...(carryInventory ? ['inventory'] : []),
    ...(selected.length
      ? [`${selected.length} encounter${selected.length === 1 ? '' : 's'}`]
      : []),
    ...(copyNotes ? ['session notes'] : []),
    ...(partyIds.length
      ? [`${partyIds.length} party profile${partyIds.length === 1 ? '' : 's'}`]
      : []),
  ];

  async function create() {
    const name = label.trim();
    if ((!name && !move) || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      const id = destinationId.current ?? crypto.randomUUID();
      destinationId.current = id;
      if (placement) {
        const before = placement.slice(placement.indexOf(':') + 1);
        await onCreate((doc) => {
          if (move && !doc.sessions.some((s) => s.id === tail?.id))
            throw new Error('The session to move is missing.');
          return placeHistoricalSession(
            doc,
            before,
            move && tail ? tail : { id, label: name, notes: '' }
          );
        });
      } else if (source && transfers.length) {
        const request = {
          campaignId: document.id,
          sourceSessionId: source.id,
          sourceFingerprint: fingerprint,
          destinationId: id,
          label: name,
          combats: selected.map((sourceId) => ({
            sourceId,
            instanceId: crypto.randomUUID(),
            checkpointId: crypto.randomUUID(),
          })),
          inventory:
            carryInventory && inventory
              ? {
                  sourceId: inventory.id,
                  instanceId: crypto.randomUUID(),
                  checkpointId: crypto.randomUUID(),
                }
              : null,
          copyNotes,
          partyCharacterIds: partyIds,
          capturedAt: new Date().toISOString(),
        };
        await onCreate((doc) => startNextSession(doc, request));
      } else {
        await onCreate((doc) => {
          const existing = doc.sessions.find((session) => session.id === id);
          if (existing) {
            if (existing.label === name && !existing.continuation) return doc;
            throw new Error(
              'This session already exists. Close the dialog and try again.'
            );
          }
          return {
            ...doc,
            sessions: [...doc.sessions, { id, label: name, notes: '' }],
            workspace: { ...doc.workspace, sessionId: id, view: 'session' },
          };
        });
      }
      if (alive.current) onClose();
    } catch (e) {
      if (alive.current) setError(String(e));
    } finally {
      submitting.current = false;
      if (alive.current) setBusy(false);
    }
  }

  return (
    <div className={styles['dialogShade']}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-session-title"
        className={styles['continuationDialog']}
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !busy) {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }
        }}
      >
        <h2 id="create-session-title">New session</h2>
        <fieldset disabled={busy} className={styles['sessionFields']}>
          {!!earlier.length && (
            <label className={styles['sessionNameField']}>
              Placement
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value)}
              >
                <option value="">Append new session</option>
                <optgroup label="Insert empty session">
                  {earlier.map((s) => (
                    <option key={s.id} value={`insert:${s.id}`}>
                      Insert before {s.label}
                    </option>
                  ))}
                </optgroup>
                {!!moveTargets.length && tail && (
                  <optgroup label={`Move ${tail.label}`}>
                    {moveTargets.map((s) => (
                      <option key={s.id} value={`move:${s.id}`}>
                        Move {tail.label} before {s.label}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
          )}
          {!move && (
            <label className={styles['sessionNameField']}>
              Session name
              <input
                autoFocus
                maxLength={1000}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>
          )}
          {!placement &&
            source &&
            (inventory ||
              combats.length > 0 ||
              source.notes ||
              profiles.length > 0) && (
              <fieldset className={styles['sessionTransfer']}>
                <legend>Carry from {source.label}</legend>
                {inventory && (
                  <label className={styles['continuationChoice']}>
                    <input
                      type="checkbox"
                      checked={carryInventory}
                      onChange={(e) => setCarryInventory(e.target.checked)}
                    />
                    Current inventory
                  </label>
                )}
                {combats.map((c) => (
                  <label className={styles['continuationChoice']} key={c.id}>
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelected((ids) =>
                          checked
                            ? [...ids, c.id]
                            : ids.filter((id) => id !== c.id)
                        );
                      }}
                    />
                    {c.title}
                  </label>
                ))}
                {profiles.length > 0 && (
                  <details>
                    <summary>
                      Party profiles
                      {partyIds.length ? ` (${partyIds.length} selected)` : ''}
                    </summary>
                    {profiles.map((profile, index) => (
                      <label
                        key={profile.characterId}
                        className={styles['continuationChoice']}
                      >
                        <input
                          type="checkbox"
                          checked={partyIds.includes(profile.characterId)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setPartyIds((ids) =>
                              checked
                                ? [...ids, profile.characterId]
                                : ids.filter((id) => id !== profile.characterId)
                            );
                          }}
                        />
                        <span>
                          {index + 1}.{' '}
                          {
                            document.party?.roster.find(
                              (c) => c.id === profile.characterId
                            )?.name
                          }
                        </span>
                      </label>
                    ))}
                  </details>
                )}
                {source.notes && (
                  <label className={styles['continuationChoice']}>
                    <input
                      type="checkbox"
                      checked={copyNotes}
                      onChange={(e) => setCopyNotes(e.target.checked)}
                    />
                    Copy session notes
                  </label>
                )}
              </fieldset>
            )}
        </fieldset>
        {error && (
          <p role="alert" className={styles['sessionError']}>
            {error}
          </p>
        )}
        <footer className={styles['sessionDialogFooter']}>
          <span aria-live="polite">
            {move
              ? 'Keep session contents'
              : !placement && transfers.length
              ? `Carry ${transfers.join(' · ')}`
              : 'Empty session'}
          </span>
          <button type="button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={busy || (!move && !label.trim())}>
            {busy ? 'Saving…' : move ? 'Move session' : 'Create session'}
          </button>
        </footer>
      </form>
    </div>
  );
}
