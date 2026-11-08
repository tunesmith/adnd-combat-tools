import { awardCapBasis } from '../../helpers/campaignXpCap';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import type {
  XpAwardRow,
  XpCapBasis,
  XpBonusReview,
  XpPoint,
  XpReward,
} from '../../helpers/campaignXpModel';
import { resolveXpReward, rewardSettlement } from '../../helpers/campaignXp';
import {
  compareXpTimeline,
  xpAwardRoot,
} from '../../helpers/campaignXpTimeline';
import {
  xpAdd,
  xpDisplay,
  xpExact,
  xpNumber,
  xpZero,
} from '../../helpers/xpArithmetic';
import styles from './xpWorkspace.module.css';

export default function XpAwardTable({
  document,
  point,
  rewards,
  rows,
  readOnly = false,
  onSelect,
  onOpen,
  onBonus,
  onFinal,
  onCap,
  onInspectAllocation,
}: {
  document: CampaignDocument;
  point: XpPoint;
  rewards: XpReward[];
  rows?: XpAwardRow[];
  readOnly?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onOpen: (reward: XpReward) => void;
  onBonus?: (review: XpBonusReview) => void;
  onFinal?: (review: XpBonusReview) => void;
  onCap?: (id: string, basis?: XpCapBasis) => void;
  onInspectAllocation: (
    name: string,
    calculated: string,
    accepted: string,
    reason: string
  ) => void;
}) {
  const characters =
    readOnly && rows
      ? rows.map((r) => ({ id: r.characterId, name: r.name }))
      : Array.from(
          new Map(
            rewards.flatMap((r) =>
              r.recipients.map(
                (c) =>
                  [
                    c.characterId,
                    {
                      id: c.characterId,
                      name:
                        point.bonuses.find(
                          (b) => b.characterId === c.characterId
                        )?.name || c.name,
                    },
                  ] as const
              )
            )
          ).values()
        );
  const orderedRewards = [...rewards].sort((a, b) =>
    compareXpTimeline(document, a.origin, b.origin, a.id, b.id)
  );
  const resolved = orderedRewards.map((reward) => {
    const deferred =
      reward.input.category === 'treasure' &&
      reward.input.disposition === 'defer';
    const future =
      !readOnly &&
      compareXpTimeline(
        document,
        reward.origin,
        point.position,
        reward.id,
        xpAwardRoot(document, point)
      ) > 0;
    const settled = !readOnly && rewardSettlement(document, reward.id);
    const blocked = deferred
      ? 'Deferred'
      : future
      ? 'After this award point'
      : settled && settled.id !== point.correctionOf
      ? 'Already awarded'
      : '';
    let calculation: ReturnType<typeof resolveXpReward> | undefined,
      error = '';
    if (!readOnly && !blocked) {
      try {
        calculation = resolveXpReward(reward);
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
    }
    return { reward, blocked, calculation, error };
  });
  const base = (id: string) => {
    const selected = resolved.filter((r) =>
      point.rewardIds.includes(r.reward.id)
    );
    if (!selected.length || selected.some((r) => !r.calculation)) return null;
    return xpExact(
      selected.reduce(
        (sum, r) =>
          xpAdd(
            sum,
            xpNumber(
              r.calculation?.allocations.find((a) => a.characterId === id)
                ?.accepted || '0'
            )
          ),
        xpZero()
      )
    );
  };
  return (
    <div className={styles['tableScroll']}>
      <table className={styles['awardMatrix']} aria-label="XP award">
        <thead>
          <tr>
            <th>XP event</th>
            {characters.map((c) => (
              <th key={c.id} scope="col">
                {c.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resolved.map(({ reward, blocked, calculation, error }) => {
            const included = readOnly || point.rewardIds.includes(reward.id);
            return (
              <tr
                key={reward.id}
                className={!included ? styles['unselectedEvent'] : undefined}
              >
                <th scope="row">
                  <div className={styles['eventChoice']}>
                    {!readOnly && (
                      <input
                        type="checkbox"
                        aria-label={`Include ${reward.title}`}
                        checked={included}
                        disabled={!!blocked && !included}
                        onChange={(e) =>
                          onSelect?.(reward.id, e.target.checked)
                        }
                      />
                    )}
                    <div>
                      <button
                        className={styles['textButton']}
                        onClick={() => onOpen(reward)}
                      >
                        {reward.title}
                      </button>
                      {reward.origin.sessionId !== point.position.sessionId && (
                        <small>
                          {
                            document.sessions.find(
                              (s) => s.id === reward.origin.sessionId
                            )?.label
                          }
                        </small>
                      )}
                      {blocked && <small>{blocked}</small>}
                      {error && (
                        <small className={styles['cellError']}>{error}</small>
                      )}
                    </div>
                  </div>
                </th>
                {characters.map((c) => {
                  const stored = readOnly
                    ? rows
                        ?.find((r) => r.characterId === c.id)
                        ?.allocations.find((a) => a.rewardId === reward.id)
                    : undefined;
                  const allocation =
                    stored ||
                    calculation?.allocations.find(
                      (a) => a.characterId === c.id
                    );
                  const changed =
                    allocation &&
                    xpExact(xpNumber(allocation.accepted)) !==
                      xpExact(xpNumber(allocation.calculated));
                  return (
                    <td key={c.id}>
                      {allocation ? (
                        changed ? (
                          <button
                            className={styles['textButton']}
                            aria-label={`${reward.title}: adjusted XP for ${c.name}`}
                            title={`Calculated ${xpDisplay(
                              allocation.calculated
                            )}; ${allocation.reason}`}
                            onClick={() =>
                              onInspectAllocation(
                                c.name,
                                allocation.calculated,
                                allocation.accepted,
                                allocation.reason
                              )
                            }
                          >
                            {xpDisplay(allocation.accepted)} *
                          </button>
                        ) : (
                          <span title={allocation.accepted}>
                            {xpDisplay(allocation.accepted)}
                          </span>
                        )
                      ) : (
                        '—'
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Base XP</th>
            {characters.map((c) => {
              const value =
                rows?.find((r) => r.characterId === c.id)?.base ??
                (!readOnly ? base(c.id) : null);
              return (
                <td key={c.id}>{value === null ? '—' : xpDisplay(value)}</td>
              );
            })}
          </tr>
          <tr>
            <th scope="row">Bonus</th>
            {characters.map((c) => {
              const row = rows?.find((r) => r.characterId === c.id),
                review = point.bonuses.find((b) => b.characterId === c.id);
              const value = row
                ? `+${xpDisplay(row.bonus)} (${xpDisplay(row.bonusPercent)}%)`
                : review?.percent == null
                ? 'Unknown'
                : `${review.percent}%`;
              return (
                <td key={c.id}>
                  {!readOnly && review ? (
                    <button
                      className={styles['textButton']}
                      aria-label={`Edit ${c.name} XP bonus`}
                      title={review.reason || undefined}
                      onClick={() => onBonus?.(review)}
                    >
                      {value}
                    </button>
                  ) : row ? (
                    value
                  ) : (
                    '—'
                  )}
                </td>
              );
            })}
          </tr>
          <tr>
            <th scope="row">XP cap</th>
            {characters.map((c) => {
              const row = rows?.find((r) => r.characterId === c.id);
              let cap = row?.cap;
              let capError = '';
              if (!readOnly && !cap)
                try {
                  cap = awardCapBasis(document, point, c.id);
                } catch (e) {
                  capError = e instanceof Error ? e.message : String(e);
                }
              return (
                <td key={c.id}>
                  {readOnly && !cap ? (
                    <span title="Legacy award: no cap was recorded">
                      Not recorded
                    </span>
                  ) : (
                    <button
                      className={styles['textButton']}
                      aria-label={`${readOnly ? 'Inspect' : 'Review'} ${
                        c.name
                      } XP cap`}
                      title={
                        cap
                          ? `${
                              cap.characterClass || 'Unknown class'
                            } · trained level ${cap.baseLevel ?? 'unknown'}${
                              cap.reason ? ` · ${cap.reason}` : ''
                            }`
                          : capError
                      }
                      onClick={() => onCap?.(c.id, cap)}
                    >
                      {cap
                        ? cap.mode === 'uncapped'
                          ? 'Uncapped'
                          : cap.limit?.toLocaleString()
                        : 'Review…'}
                    </button>
                  )}
                </td>
              );
            })}
          </tr>
          <tr className={styles['awardTotal']}>
            <th scope="row">Full award</th>
            {characters.map((c) => {
              const row = rows?.find((r) => r.characterId === c.id),
                review = point.bonuses.find((b) => b.characterId === c.id);
              return (
                <td key={c.id}>
                  {row ? (
                    !readOnly && review ? (
                      <button
                        className={styles['textButton']}
                        aria-label={`Adjust ${c.name} full award`}
                        title={`Before rounding: ${xpDisplay(row.unrounded)}${
                          row.overrideReason
                            ? `; calculated ${row.rounded}; ${row.overrideReason}`
                            : ''
                        }`}
                        onClick={() => onFinal?.(review)}
                      >
                        {(row.fullAward ?? row.award).toLocaleString()}
                        {row.overrideReason ? ' *' : ''}
                      </button>
                    ) : (
                      <span
                        title={`Before rounding: ${xpDisplay(row.unrounded)}${
                          row.overrideReason
                            ? `; calculated ${row.rounded}; ${row.overrideReason}`
                            : ''
                        }`}
                      >
                        {(row.fullAward ?? row.award).toLocaleString()}
                        {row.overrideReason ? ' *' : ''}
                      </span>
                    )
                  ) : review?.finalOverride != null ? (
                    <button
                      className={styles['textButton']}
                      aria-label={`Adjust ${c.name} full award`}
                      onClick={() => onFinal?.(review)}
                    >
                      {review.finalOverride} *
                    </button>
                  ) : (
                    '—'
                  )}
                </td>
              );
            })}
          </tr>
          <tr className={styles['awardTotal']}>
            <th scope="row">XP added</th>
            {characters.map((c) => (
              <td key={c.id}>
                {rows
                  ?.find((r) => r.characterId === c.id)
                  ?.award?.toLocaleString() ?? '—'}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">Discarded</th>
            {characters.map((c) => (
              <td key={c.id}>
                {rows
                  ?.find((r) => r.characterId === c.id)
                  ?.discarded?.toLocaleString() ?? (
                  <span title="Legacy award: discarded XP was not recorded">
                    —
                  </span>
                )}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">Previous balance</th>
            {characters.map((c) => (
              <td key={c.id}>
                {rows
                  ?.find((r) => r.characterId === c.id)
                  ?.before?.toLocaleString() ?? '—'}
              </td>
            ))}
          </tr>
          <tr className={styles['awardTotal']}>
            <th scope="row">New balance</th>
            {characters.map((c) => (
              <td key={c.id}>
                {rows
                  ?.find((r) => r.characterId === c.id)
                  ?.after?.toLocaleString() ?? '—'}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
