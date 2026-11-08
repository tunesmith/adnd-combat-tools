import { useState } from 'react';
import type { XpBonusReview } from '../../helpers/campaignXpModel';
import { xpNumber } from '../../helpers/xpArithmetic';
import styles from './xpWorkspace.module.css';
export default function XpAwardEdit({
  review,
  mode,
  onSave,
  onClose,
}: {
  review: XpBonusReview;
  mode: 'bonus' | 'final';
  onSave: (review: XpBonusReview) => boolean;
  onClose: () => void;
}) {
  const [value, setValue] = useState(
    mode === 'bonus'
      ? review.percent ?? ''
      : review.finalOverride?.toString() ?? ''
  );
  const [note, setNote] = useState(
    mode === 'bonus' ? review.reason : review.finalReason
  );
  const [error, setError] = useState('');
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
        aria-label={mode === 'bonus' ? 'XP bonus' : 'Full award adjustment'}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      >
        <h2>{review.name}</h2>
        <label>
          {mode === 'bonus' ? 'XP bonus %' : 'Full award XP'}
          <input
            autoFocus
            value={value}
            placeholder={mode === 'bonus' ? 'Unknown' : 'Calculated'}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        <label>
          {mode === 'bonus' ? 'Note' : 'Reason'}
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && <p role="alert">{error}</p>}
        <div className={styles['footer']}>
          <button onClick={onClose}>Cancel</button>
          <button
            className={styles['primary']}
            onClick={() => {
              try {
                let saved = false;
                if (mode === 'bonus') {
                  if (value.trim()) xpNumber(value);
                  saved = onSave({
                    ...review,
                    percent: value.trim() || null,
                    reason: note,
                  });
                } else {
                  const amount = value.trim() ? Number(value) : null;
                  if (
                    amount !== null &&
                    (!Number.isSafeInteger(amount) || amount < 0)
                  )
                    throw Error('Enter a nonnegative whole XP amount.');
                  if (amount !== null && !note.trim())
                    throw Error('Add a reason for the full award adjustment.');
                  saved = onSave({
                    ...review,
                    finalOverride: amount,
                    finalReason: amount === null ? '' : note,
                  });
                }
                if (saved) onClose();
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
              }
            }}
          >
            Apply
          </button>
        </div>
      </section>
    </div>
  );
}
