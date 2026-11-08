import { useState } from 'react';
import type { XpReward } from '../../helpers/campaignXpModel';
import { xpCompare, xpNumber } from '../../helpers/xpArithmetic';
import styles from './xpWorkspace.module.css';

function values(reward: XpReward, target: string) {
  if (target === 'raw')
    return {
      amount: reward.rawOverride?.amount ?? '',
      reason: reward.rawOverride?.reason ?? '',
      shares: '1',
    };
  const rows = reward.recipients.filter((r) =>
    target === 'all' ? r.eligible : r.characterId === target
  );
  const first = rows[0];
  return {
    amount: rows.every(
      (r) => r.allocationOverride === first?.allocationOverride
    )
      ? first?.allocationOverride ?? ''
      : '',
    reason: rows.every((r) => r.allocationReason === first?.allocationReason)
      ? first?.allocationReason ?? ''
      : '',
    shares: first?.shares ?? '1',
  };
}
export default function XpAdjustment({
  reward,
  onChange,
  onClose,
}: {
  reward: XpReward;
  onChange: (reward: XpReward) => void;
  onClose: () => void;
}) {
  const [target, setTarget] = useState('all');
  const [draft, setDraft] = useState(() => values(reward, 'all'));
  const [error, setError] = useState('');
  const apply = (reset: boolean) => {
    try {
      if (!reset && draft.amount.trim()) {
        xpNumber(draft.amount);
        if (!draft.reason.trim()) throw Error('Add a note for the adjustment.');
      }
      if (target === 'all' && !reward.recipients.some((r) => r.eligible))
        throw Error('Select recipients first.');
      if (
        !reset &&
        target !== 'all' &&
        target !== 'raw' &&
        xpCompare(xpNumber(draft.shares), xpNumber(0)) <= 0
      )
        throw Error('Shares must be greater than zero.');
      const amount = reset ? null : draft.amount.trim() || null;
      onChange(
        target === 'raw'
          ? {
              ...reward,
              rawOverride:
                amount === null ? null : { amount, reason: draft.reason },
            }
          : {
              ...reward,
              recipients: reward.recipients.map((r) =>
                (target === 'all' ? r.eligible : r.characterId === target)
                  ? {
                      ...r,
                      allocationOverride: amount,
                      allocationReason: amount === null ? '' : draft.reason,
                      ...(target !== 'all' && !reset
                        ? { shares: draft.shares }
                        : {}),
                    }
                  : r
              ),
            }
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  return (
    <div
      className={styles['backdrop']}
      onMouseDown={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={`${styles['modal']} ${styles['smallModal']}`}
        role="dialog"
        aria-modal="true"
        aria-label="Adjust XP"
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Escape') onClose();
        }}
      >
        <h2>Adjust XP</h2>
        <label>
          Apply to
          <select
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setDraft(values(reward, e.target.value));
              setError('');
            }}
          >
            <option value="all">All recipients</option>
            {reward.recipients.map((r) => (
              <option key={r.characterId} value={r.characterId}>
                {r.name}
              </option>
            ))}
            <option value="raw">Raw XP total</option>
          </select>
        </label>
        <label>
          {target === 'raw' ? 'Raw XP' : target === 'all' ? 'XP each' : 'XP'}
          <input
            autoFocus
            value={draft.amount}
            placeholder="Calculated"
            onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
          />
        </label>
        {target !== 'all' && target !== 'raw' && (
          <label>
            Shares
            <input
              value={draft.shares}
              onChange={(e) => setDraft({ ...draft, shares: e.target.value })}
            />
          </label>
        )}
        <label>
          Note
          <input
            value={draft.reason}
            onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <div className={styles['footer']}>
          <button onClick={() => apply(true)}>Use calculated XP</button>
          <button onClick={onClose}>Cancel</button>
          <button
            className={styles['primary']}
            onClick={() => apply(false)}
            disabled={
              !draft.amount.trim() && (target === 'all' || target === 'raw')
            }
          >
            Apply
          </button>
        </div>
      </section>
    </div>
  );
}
