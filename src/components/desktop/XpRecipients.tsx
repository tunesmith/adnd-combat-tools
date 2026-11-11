import { xpRecipientAvailable } from '../../helpers/campaignParty';
import { useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import type { XpReward, XpRecipient } from '../../helpers/campaignXpModel';
import {
  resolveXpReward,
  xpRewardBase,
  xpRewardChallenge,
} from '../../helpers/campaignXp';
import {
  xpDisplay,
  xpNumber,
  xpCompare,
  xpDivide,
} from '../../helpers/xpArithmetic';
import XpAdjustment from './XpAdjustment';
import styles from './xpWorkspace.module.css';

export default function XpRecipients({
  document,
  reward,
  onChange,
}: {
  document: CampaignDocument;
  reward: XpReward;
  onChange: (reward: XpReward) => void;
}) {
  const available = (id: string) =>
    xpRecipientAvailable(document, reward.origin.sessionId, id);
  const visibleRecipients = reward.recipients.filter((r) =>
    available(r.characterId)
  );
  const candidates =
    document.party?.roster.filter(
      (c) =>
        available(c.id) &&
        !reward.recipients.some((r) => r.characterId === c.id)
    ) ?? [];
  const [adjusting, setAdjusting] = useState(false);
  const [ratioEdit, setRatioEdit] = useState(false);
  const [ratio, setRatio] = useState('');
  const [reason, setReason] = useState('');
  const [ratioError, setRatioError] = useState('');
  const update = (id: string, change: Partial<XpRecipient>) =>
    onChange({
      ...reward,
      recipients: reward.recipients.map((r) =>
        r.characterId === id ? { ...r, ...change } : r
      ),
    });
  let base: ReturnType<typeof xpRewardBase> | undefined;
  let challenge: ReturnType<typeof xpRewardChallenge> | undefined;
  let result: ReturnType<typeof resolveXpReward> | undefined;
  let inputError = '',
    levelError = '';
  try {
    base = xpRewardBase(reward);
  } catch (e) {
    inputError = e instanceof Error ? e.message : String(e);
  }
  try {
    challenge = xpRewardChallenge(reward);
  } catch {
    levelError = 'Enter a valid level for each participant.';
  }
  try {
    result = resolveXpReward({
      ...reward,
      recipients: reward.recipients.map((r) => ({
        ...r,
        allocationReason: r.allocationReason || 'Adjustment',
      })),
      ratio: {
        ...reward.ratio,
        reason: reward.ratio.reason || 'Adjustment',
        recordedReason: reward.ratio.recordedReason || 'Recorded',
      },
      rawOverride: reward.rawOverride
        ? {
            ...reward.rawOverride,
            reason: reward.rawOverride.reason || 'Adjustment',
          }
        : null,
    });
  } catch {
    /* Incomplete drafts still show raw XP, recorded levels and challenge inputs. */
  }
  const adjusted = reward.recipients.filter(
    (r) => r.eligible && r.allocationOverride !== null
  );
  const notes = Array.from(
    new Set(adjusted.map((r) => r.allocationReason).filter(Boolean))
  );
  const acceptedRatio = reward.ratio.override ?? challenge?.proposed;
  const uncappedRatio =
    challenge?.difficulty != null &&
    challenge.levels !== null &&
    xpCompare(xpNumber(challenge.levels), xpNumber(0)) > 0
      ? xpDivide(xpNumber(challenge.difficulty), xpNumber(challenge.levels))
      : null;
  const allChecked = (key: 'participated' | 'eligible') =>
    visibleRecipients.length > 0 && visibleRecipients.every((r) => r[key]);
  const toggleAll = (key: 'participated' | 'eligible', checked: boolean) =>
    onChange({
      ...reward,
      recipients: reward.recipients.map((r) =>
        available(r.characterId) ? { ...r, [key]: checked } : r
      ),
    });
  return (
    <>
      <div className={styles['rawXpRow']}>
        <p className={styles['rawXp']}>
          <strong>Raw XP: {base ? xpDisplay(base.raw) : '—'}</strong>
          {reward.rawOverride && (
            <small>
              Adjusted from{' '}
              {base?.calculatedRaw === null || !base
                ? 'unknown'
                : xpDisplay(base.calculatedRaw)}{' '}
              · {reward.rawOverride.reason}
            </small>
          )}
        </p>
        <button
          className={styles['textButton']}
          onClick={() => setAdjusting(true)}
        >
          Adjust XP…
        </button>
      </div>
      {inputError && <p className={styles['muted']}>{inputError}</p>}
      <div className={styles['tableScroll']}>
        <table className={styles['recipients']}>
          <thead>
            <tr>
              <th>Character</th>
              <th>
                Participated
                <label className={styles['check']}>
                  <input
                    type="checkbox"
                    aria-label="All participated"
                    checked={allChecked('participated')}
                    onChange={(e) =>
                      toggleAll('participated', e.target.checked)
                    }
                  />
                  all
                </label>
              </th>
              <th>
                Receives XP
                <label className={styles['check']}>
                  <input
                    type="checkbox"
                    aria-label="All receive XP"
                    checked={allChecked('eligible')}
                    onChange={(e) => toggleAll('eligible', e.target.checked)}
                  />
                  all
                </label>
              </th>
              <th>Level</th>
              <th>XP</th>
            </tr>
          </thead>
          <tbody>
            {visibleRecipients.map((r) => {
              const a = result?.allocations.find(
                (a) => a.characterId === r.characterId
              );
              return (
                <tr key={r.characterId}>
                  <th>
                    {r.name}
                    {r.shares !== '1' && <small>{r.shares} shares</small>}
                  </th>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${r.name} participated`}
                      checked={r.participated}
                      onChange={(e) =>
                        update(r.characterId, {
                          participated: e.target.checked,
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${r.name} eligible`}
                      checked={r.eligible}
                      onChange={(e) =>
                        update(r.characterId, { eligible: e.target.checked })
                      }
                    />
                  </td>
                  <td>
                    <input
                      aria-label={`${r.name} level at event`}
                      value={r.level ?? ''}
                      placeholder="Unknown"
                      onChange={(e) =>
                        update(r.characterId, {
                          level: e.target.value.trim() || null,
                        })
                      }
                    />
                  </td>
                  <td>
                    {r.eligible ? (
                      r.allocationOverride !== null ? (
                        <>
                          {xpDisplay(r.allocationOverride)}
                          <small>
                            Adjusted
                            {a ? ` from ${xpDisplay(a.calculated)}` : ''}
                          </small>
                        </>
                      ) : a ? (
                        xpDisplay(a.calculated)
                      ) : (
                        '—'
                      )
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {notes.length > 0 && (
        <p className={styles['muted']}>{notes.join(' · ')}</p>
      )}
      {candidates.length > 0 && (
        <select
          aria-label="Add XP recipient"
          value=""
          onChange={(e) => {
            const c = candidates.find((c) => c.id === e.target.value);
            if (!c) return;
            const p = document.party?.profiles.find(
              (p) =>
                p.characterId === c.id &&
                p.sessionId === reward.origin.sessionId
            );
            onChange({
              ...reward,
              recipients: [
                ...reward.recipients,
                {
                  characterId: c.id,
                  name: c.name,
                  participated: false,
                  eligible: false,
                  level: p ? String(p.baseLevel) : null,
                  shares: '1',
                  allocationOverride: null,
                  allocationReason: '',
                },
              ],
            });
          }}
        >
          <option value="">+ Recipient…</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      <div className={styles['challenge']}>
        <div className={styles['ratioRow']}>
          <span>
            Ratio:{' '}
            {reward.input.category === 'monster' ? (
              <>
                {challenge?.difficulty == null
                  ? '—'
                  : xpDisplay(challenge.difficulty)}{' '}
                adjusted HD /{' '}
                {challenge?.levels == null ? '—' : xpDisplay(challenge.levels)}{' '}
                participating levels ={' '}
                {uncappedRatio === null ? '—' : xpDisplay(uncappedRatio)}
                {uncappedRatio !== null &&
                  xpCompare(uncappedRatio, xpNumber(1)) > 0 &&
                  ' (1)'}
                {reward.ratio.override !== null && (
                  <> → {xpDisplay(reward.ratio.override)} (adjusted)</>
                )}
              </>
            ) : (
              <>
                {acceptedRatio == null ? '—' : xpDisplay(acceptedRatio)}
                {reward.ratio.override !== null && ' (adjusted)'}
              </>
            )}
          </span>
          <button
            className={styles['textButton']}
            onClick={() => {
              setRatio(reward.ratio.override ?? challenge?.proposed ?? '');
              setReason(reward.ratio.reason);
              setRatioEdit(true);
              setRatioError('');
            }}
          >
            Override…
          </button>
        </div>
        {levelError && <p role="status">{levelError}</p>}
        {!levelError &&
          reward.input.category === 'monster' &&
          challenge?.levels === null && (
            <small>
              {reward.recipients.some((r) => r.participated)
                ? 'Enter the missing participant levels.'
                : 'Select participants to calculate the ratio.'}
            </small>
          )}
        {reward.ratio.override !== null && reward.ratio.reason && (
          <small>{reward.ratio.reason}</small>
        )}
        {ratioEdit && (
          <div className={styles['ratioEditor']}>
            <label>
              Ratio override
              <input value={ratio} onChange={(e) => setRatio(e.target.value)} />
            </label>
            <label>
              Reason
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            {ratioError && <p role="alert">{ratioError}</p>}
            <div className={styles['actions']}>
              <button
                onClick={() => {
                  onChange({
                    ...reward,
                    ratio: {
                      ...reward.ratio,
                      proposed:
                        reward.input.category === 'monster'
                          ? reward.ratio.proposed
                          : '1',
                      override: null,
                      reason: '',
                    },
                  });
                  setRatioEdit(false);
                }}
              >
                {reward.input.category === 'monster'
                  ? 'Use calculated ratio'
                  : 'Use default ratio'}
              </button>
              <button onClick={() => setRatioEdit(false)}>Cancel</button>
              <button
                onClick={() => {
                  try {
                    const value = xpNumber(ratio);
                    if (xpCompare(value, xpNumber(1)) > 0)
                      throw Error('Enter a ratio from 0 to 1.');
                    if (reward.input.category === 'monster' && !reason.trim())
                      throw Error(
                        'Add a reason for changing the calculated ratio.'
                      );
                    onChange({
                      ...reward,
                      ratio:
                        reward.input.category === 'monster'
                          ? { ...reward.ratio, override: ratio, reason }
                          : {
                              ...reward.ratio,
                              proposed: ratio,
                              override: null,
                              reason,
                            },
                    });
                    setRatioEdit(false);
                  } catch (e) {
                    setRatioError(e instanceof Error ? e.message : String(e));
                  }
                }}
              >
                Apply override
              </button>
            </div>
          </div>
        )}
      </div>
      {adjusting && (
        <XpAdjustment
          reward={{ ...reward, recipients: visibleRecipients }}
          onChange={(adjustedReward) =>
            onChange({
              ...adjustedReward,
              recipients: reward.recipients.map(
                (r) =>
                  adjustedReward.recipients.find(
                    (updated) => updated.characterId === r.characterId
                  ) ?? r
              ),
            })
          }
          onClose={() => setAdjusting(false)}
        />
      )}
    </>
  );
}
