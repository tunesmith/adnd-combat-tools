import { useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import type { XpCapBasis, XpPoint } from '../../helpers/campaignXpModel';
import { partyClasses } from '../../helpers/campaignPartyModel';
import { profileClassLabel } from '../../helpers/campaignParty';
import {
  profileXpCap,
  validateXpCap,
  latestXpProfile,
} from '../../helpers/campaignXpCap';
import { nextLevelXp } from '../../tables/classExperience';
import { canonical } from '../../helpers/campaignSnapshots';
import styles from './xpWorkspace.module.css';

export default function XpCapDialog({
  document,
  point,
  characterId,
  basis,
  readOnly = false,
  onSave,
  onClose,
}: {
  document: CampaignDocument;
  point: XpPoint;
  characterId: string;
  basis?: XpCapBasis;
  readOnly?: boolean;
  onSave: (basis: XpCapBasis | null) => boolean;
  onClose: () => void;
}) {
  const profile = latestXpProfile(
    document,
    characterId,
    point.position.sessionId
  );
  const recorded = point.correctionOf
    ? document.xp?.events
        .find((e) => e.id === point.correctionOf)
        ?.rows.find((r) => r.characterId === characterId)?.cap
    : undefined;
  const initial = basis ||
    point.caps?.find((c) => c.characterId === characterId)?.basis ||
    recorded ||
    profileXpCap(profile) || {
      characterClass: profile?.characterClass ?? null,
      baseLevel: profile?.baseLevel ?? null,
      mode: 'override' as const,
      limit: null,
      reason: '',
    };
  const [draft, setDraft] = useState<XpCapBasis>(initial);
  const [amount, setAmount] = useState(initial.limit?.toString() ?? '');
  const [error, setError] = useState('');
  const name =
    document.party?.roster.find((c) => c.id === characterId)?.name ||
    characterId;
  const standard =
    point.correctionOf || !profile
      ? nextLevelXp(draft.characterClass || 'manual', draft.baseLevel ?? 0)
      : profileXpCap(profile)?.limit ?? null;
  return (
    <div
      className={styles['backdrop']}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={`${styles['modal']} ${styles['smallModal']}`}
        role="dialog"
        aria-modal="true"
        aria-label="XP cap"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      >
        <h2>{name} · XP cap</h2>
        {readOnly ? (
          <>
            <p>
              {initial.characterClass
                ? profileClassLabel(initial.characterClass)
                : 'Unknown class'}{' '}
              · trained level {initial.baseLevel ?? 'unknown'}
            </p>
            <p>
              {initial.mode === 'uncapped'
                ? 'Uncapped exception'
                : initial.limit?.toLocaleString()}
            </p>
            <p>{initial.reason}</p>
          </>
        ) : (
          <>
            <label>
              Cap basis
              <select
                value={draft.mode}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    mode: e.target.value as XpCapBasis['mode'],
                  })
                }
              >
                <option value="standard">PHB trained-level threshold</option>
                <option value="override">Explicit cap</option>
                <option value="uncapped">Uncapped exception</option>
              </select>
            </label>
            {point.correctionOf || !profile ? (
              <div className={styles['fields']}>
                <label>
                  Historical trained class
                  <select
                    value={draft.characterClass || 'manual'}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        characterClass: e.target
                          .value as XpCapBasis['characterClass'],
                      })
                    }
                  >
                    {partyClasses.map((c) => (
                      <option value={c} key={c}>
                        {profileClassLabel(c)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Historical base level
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={draft.baseLevel ?? ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        baseLevel:
                          e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                </label>
              </div>
            ) : (
              <p>
                {profile
                  ? `${profileClassLabel(
                      profile.characterClass
                    )} · trained level ${profile.baseLevel}`
                  : 'No trained profile recorded'}
              </p>
            )}
            {draft.mode === 'standard' ? (
              <p>XP cap: {standard?.toLocaleString() ?? 'Unknown'}</p>
            ) : draft.mode === 'override' ? (
              <label>
                Absolute XP cap
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
            ) : null}
            {(draft.mode !== 'standard' || point.correctionOf) && (
              <label>
                Reason
                <input
                  value={draft.reason}
                  onChange={(e) =>
                    setDraft({ ...draft, reason: e.target.value })
                  }
                />
              </label>
            )}
          </>
        )}
        {error && <p role="alert">{error}</p>}
        <div className={styles['footer']}>
          <button autoFocus onClick={onClose}>
            {readOnly ? 'Close' : 'Cancel'}
          </button>
          {!readOnly && (
            <button
              className={styles['primary']}
              onClick={() => {
                try {
                  if (
                    draft.mode === 'standard' &&
                    !point.correctionOf &&
                    profile
                  ) {
                    if (standard === null)
                      throw Error(
                        'The trained profile has no known PHB threshold. Choose an explicit cap or uncapped exception.'
                      );
                    if (onSave(null)) onClose();
                    return;
                  }
                  const limit =
                    draft.mode === 'standard'
                      ? standard
                      : draft.mode === 'uncapped'
                      ? null
                      : amount.trim()
                      ? Number(amount)
                      : null;
                  if (
                    limit !== null &&
                    (!Number.isSafeInteger(limit) || limit < 0)
                  )
                    throw Error('Enter a nonnegative whole XP cap.');
                  const accepted = { ...draft, limit };
                  validateXpCap(accepted);
                  if (
                    (point.correctionOf || !profile) &&
                    canonical(accepted) !== canonical(recorded) &&
                    !accepted.reason.trim()
                  )
                    throw Error(
                      'Add a reason for the historical trained-level/cap decision.'
                    );
                  if (onSave(accepted)) onClose();
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                }
              }}
            >
              Apply cap
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
