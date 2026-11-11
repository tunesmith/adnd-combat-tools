import { useState } from 'react';
import { profileClassLabel } from '../../helpers/campaignParty';
import type {
  XpBonusReview,
  XpClassReview,
} from '../../helpers/campaignXpModel';
import { classReviewCap } from '../../helpers/campaignXpClasses';
import { xpNumber } from '../../helpers/xpArithmetic';
import styles from './xpWorkspace.module.css';
export default function XpClassAwardEdit({
  review,
  onSave,
  onClose,
  mappingBalance,
}: {
  mappingBalance?: number | null;
  review: XpBonusReview;
  onSave: (r: XpBonusReview) => boolean;
  onClose: () => void;
}) {
  const [classes, setClasses] = useState(review.classes ?? []),
    [error, setError] = useState('');
  const patch = (id: string, change: Partial<XpClassReview>) =>
    setClasses((values) =>
      values.map((c) => (c.classId === id ? { ...c, ...change } : c))
    );
  return (
    <div
      className={styles['backdrop']}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={styles['modal']}
        role="dialog"
        aria-modal="true"
        aria-label="Class XP review"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      >
        <h2>{review.name}</h2>
        <div className={styles['tableScroll']}>
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Bonus %</th>
                <th>XP cap</th>
                <th>Reason / note</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => {
                let cap: ReturnType<typeof classReviewCap> | undefined;
                try {
                  cap = classReviewCap(c);
                } catch {
                  /* Unknown classes need an explicit decision. */
                }
                return (
                  <tr key={c.classId}>
                    <th>
                      {profileClassLabel(c.characterClass)} {c.baseLevel}
                    </th>
                    <td>
                      <input
                        aria-label={`${profileClassLabel(
                          c.characterClass
                        )} award bonus %`}
                        value={c.percent ?? ''}
                        onChange={(e) =>
                          patch(c.classId, { percent: e.target.value || null })
                        }
                      />
                    </td>
                    <td>
                      <select
                        aria-label={`${profileClassLabel(
                          c.characterClass
                        )} cap mode`}
                        value={c.cap?.mode ?? 'standard'}
                        onChange={(e) => {
                          const mode = e.target.value;
                          if (mode === 'standard')
                            patch(c.classId, { cap: undefined });
                          else if (mode === 'override' || mode === 'uncapped')
                            patch(c.classId, {
                              cap: {
                                characterClass: c.characterClass,
                                baseLevel: c.baseLevel,
                                mode,
                                limit:
                                  mode === 'uncapped' ? null : cap?.limit ?? 0,
                                reason: c.reason,
                              },
                            });
                        }}
                      >
                        <option value="standard">Trained level</option>
                        <option value="override">Explicit cap</option>
                        <option value="uncapped">Uncapped</option>
                      </select>
                      {c.cap?.mode === 'override' ? (
                        <input
                          aria-label={`${profileClassLabel(
                            c.characterClass
                          )} cap limit`}
                          type="number"
                          min={0}
                          value={c.cap.limit ?? ''}
                          onChange={(e) => {
                            if (!c.cap) return;
                            patch(c.classId, {
                              cap: {
                                ...c.cap,
                                limit:
                                  e.target.value === ''
                                    ? null
                                    : e.target.valueAsNumber,
                              },
                            });
                          }}
                        />
                      ) : (
                        <small>
                          {cap?.limit?.toLocaleString() ??
                            (cap?.mode === 'uncapped' ? 'Uncapped' : 'Unknown')}
                        </small>
                      )}
                    </td>
                    <td>
                      <input
                        aria-label={`${profileClassLabel(
                          c.characterClass
                        )} award note`}
                        value={c.reason}
                        onChange={(e) =>
                          patch(c.classId, {
                            reason: e.target.value,
                            ...(c.cap
                              ? { cap: { ...c.cap, reason: e.target.value } }
                              : {}),
                          })
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {mappingBalance !== undefined && (
          <details>
            <summary>Map an existing character balance to classes…</summary>
            <p>
              Only needed when converting existing single-class XP. Enter each
              class’s balance immediately before this award. Their sum must
              equal the existing character balance (
              {mappingBalance?.toLocaleString() ?? 'unknown'}). This does not
              split or rewrite earlier awards.
            </p>
            {classes.map((c) => (
              <label className={styles['classMapping']} key={c.classId}>
                {profileClassLabel(c.characterClass)}
                <input
                  aria-label={`${profileClassLabel(
                    c.characterClass
                  )} mapped opening XP`}
                  type="number"
                  min={0}
                  value={c.opening ?? ''}
                  onChange={(e) =>
                    patch(c.classId, {
                      opening:
                        e.target.value === '' ? null : e.target.valueAsNumber,
                    })
                  }
                />
              </label>
            ))}
          </details>
        )}
        {error && <p role="alert">{error}</p>}
        <div className={styles['footer']}>
          <button onClick={onClose}>Cancel</button>
          <button
            className={styles['primary']}
            onClick={() => {
              try {
                for (const c of classes)
                  if (c.percent !== null) xpNumber(c.percent);
                if (onSave({ ...review, classes })) onClose();
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
