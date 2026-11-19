import { treasurePending } from '../../helpers/campaignXpTreasure';
import { TreasureSubtotal } from './XpTreasureRows';
import {
  inPartyOrder,
  profileClassLabel,
  xpRecipientRetired,
} from '../../helpers/campaignParty';
import {
  classReviewCap,
  profileClassReviews,
} from '../../helpers/campaignXpClasses';
import { awardCapBasis, latestXpProfile } from '../../helpers/campaignXpCap';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import type {
  XpAwardRow,
  XpCapBasis,
  XpBonusReview,
  XpPoint,
  XpReward,
} from '../../helpers/campaignXpModel';
import type { XpTreasureDisposition } from '../../helpers/campaignXp';
import {
  resolveXpReward,
  activeXpEvents,
  recipientSettlement,
  xpSettlementDecision,
  xpBalance,
  xpClassBalances,
} from '../../helpers/campaignXp';
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
  rewards: availableRewards,
  rows,
  readOnly = false,
  confirmedEventId,
  onSelect,
  onSettlement,
  onDisposition,
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
  confirmedEventId?: string;
  onSelect?: (id: string, selected: boolean) => void;
  onSettlement?: (
    rewardId: string,
    characterId: string,
    decision: 'award' | 'later' | 'forfeit',
    reason: string
  ) => void;
  onDisposition?: (id: string, disposition: XpTreasureDisposition) => void;
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
  // Non-awarded characters have no posting row. Reconstruct their unchanged
  // balances at this award from the history available when it was confirmed.
  const historyIndex = readOnly
    ? document.xp?.events.findIndex((e) =>
        confirmedEventId
          ? e.id === confirmedEventId
          : e.point.id === point.id && e.rows === rows
      ) ?? -1
    : -1;
  const balanceEvents =
    historyIndex >= 0 ? document.xp?.events.slice(0, historyIndex) : undefined;
  let balanceDocument = document;
  if (historyIndex >= 0 && document.xp) {
    let openings = document.xp.openings;
    // A later backward-history extension changed opening balances as well as
    // appending awards. Restore both sides of that reconciliation for this view.
    for (const extension of [...(document.xp.extensions ?? [])].reverse()) {
      if (
        document.xp.events.findIndex((e) => e.id === extension.eventIds[0]) >
        historyIndex
      )
        openings = openings.map(
          (opening) =>
            extension.openings.find(
              (change) => change.previous.id === opening.id
            )?.previous ?? opening
        );
    }
    balanceDocument = { ...document, xp: { ...document.xp, openings } };
  }
  const rewards = availableRewards.filter(
    (reward) =>
      readOnly ||
      compareXpTimeline(
        document,
        reward.origin,
        point.position,
        reward.id,
        xpAwardRoot(document, point)
      ) <= 0
  );
  const characters = inPartyOrder(
    document,
    Array.from(
      new Map(
        rewards.flatMap((r) =>
          r.recipients
            .filter(
              (c) =>
                (!readOnly && !!point.correctionOf) ||
                (readOnly &&
                  rows?.some((row) => row.characterId === c.characterId)) ||
                !xpRecipientRetired(
                  document,
                  c.characterId,
                  point.position.sessionId
                )
            )
            .map(
              (c) =>
                [
                  c.characterId,
                  {
                    id: c.characterId,
                    name:
                      point.bonuses.find((b) => b.characterId === c.characterId)
                        ?.name || c.name,
                  },
                ] as const
            )
        )
      ).values()
    ),
    (c) => c.id,
    point.position.sessionId
  );
  const orderedRewards = [...rewards].sort((a, b) =>
    compareXpTimeline(document, a.origin, b.origin, a.id, b.id)
  );
  const resolved = orderedRewards.map((reward) => {
    const deferred = treasurePending(reward.input);
    const future =
      !readOnly &&
      compareXpTimeline(
        document,
        reward.origin,
        point.position,
        reward.id,
        xpAwardRoot(document, point)
      ) > 0;
    const settled =
      !readOnly &&
      reward.recipients
        .filter((c) => c.eligible)
        .every((c) =>
          recipientSettlement(
            document,
            reward.id,
            c.characterId,
            point.correctionOf ?? undefined
          )
        );
    const frozen =
      !point.correctionOf &&
      activeXpEvents(document.xp?.events ?? []).some((e) =>
        e.rewards.some((r) => r.id === reward.id)
      );
    const blocked = future
      ? 'After this award point'
      : settled
      ? 'Already awarded'
      : deferred
      ? 'Deferred'
      : '';
    let calculation: ReturnType<typeof resolveXpReward> | undefined,
      error = '';
    if (readOnly || !blocked) {
      try {
        calculation = resolveXpReward(reward);
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
    }
    return { reward, blocked, calculation, error, frozen };
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
              xpSettlementDecision(document, point, r.reward.id, id) === 'award'
                ? r.calculation?.allocations.find((a) => a.characterId === id)
                    ?.accepted || '0'
                : '0'
            )
          ),
        xpZero()
      )
    );
  };
  const totals = new Map(
    characters.map(({ id }) => {
      const row = rows?.find((r) => r.characterId === id);
      const affected =
        !readOnly &&
        resolved.some(
          ({ reward, blocked }) =>
            blocked !== 'Deferred' &&
            point.rewardIds.includes(reward.id) &&
            reward.recipients.some(
              (r) =>
                r.eligible &&
                r.characterId === id &&
                xpSettlementDecision(document, point, reward.id, id) === 'award'
            )
        );
      const before =
        row?.before ??
        xpBalance(
          balanceDocument,
          id,
          point.position,
          false,
          balanceEvents,
          xpAwardRoot(document, point)
        );
      const after = row?.after ?? (affected ? null : before);
      let cap = row?.cap;
      let capError = '';
      if (!cap && (!readOnly || !row)) {
        try {
          cap = awardCapBasis(
            document,
            readOnly ? { ...point, correctionOf: null } : point,
            id
          );
        } catch (e) {
          capError = e instanceof Error ? e.message : String(e);
        }
      }
      return [
        id,
        {
          before,
          after,
          affected,
          cap,
          capError,
          full: row ? row.fullAward ?? row.award : affected ? null : 0,
          added: row?.award ?? (affected ? null : 0),
          discarded: row?.discarded ?? (affected ? null : 0),
        },
      ] as const;
    })
  );
  const classCell = (id: string, field: string) => {
    const review = point.bonuses.find((b) => b.characterId === id),
      row = rows?.find((r) => r.characterId === id);
    const classReviews =
      review?.classes ??
      (readOnly && !row
        ? profileClassReviews(
            latestXpProfile(document, id, point.position.sessionId)
          )
        : undefined);
    const classes = row?.classes ?? classReviews;
    const unchangedBalances =
      readOnly && !row
        ? xpClassBalances(
            balanceDocument,
            id,
            point.position,
            false,
            balanceEvents,
            xpAwardRoot(document, point)
          )
        : {};
    if (!classes) return null;
    return (
      <div className={styles['classValues']}>
        {classes.map((c) => {
          const snapshot = row?.classes?.find((v) => v.classId === c.classId);
          const draft = classReviews?.find((v) => v.classId === c.classId);
          const unchanged = readOnly && !row;
          const before = snapshot?.before ?? unchangedBalances[c.classId];
          const after = snapshot?.after ?? unchangedBalances[c.classId];
          let cap = snapshot?.cap;
          try {
            cap = cap ?? (draft ? classReviewCap(draft) : undefined);
          } catch {
            /* Display an incomplete review. */
          }
          const numeric =
            field === 'added'
              ? snapshot?.award ?? (unchanged ? 0 : undefined)
              : field === 'discarded'
              ? snapshot?.discarded ?? (unchanged ? 0 : undefined)
              : field === 'before'
              ? before
              : field === 'after'
              ? after
              : field === 'full'
              ? snapshot?.fullAward ?? (unchanged ? 0 : undefined)
              : undefined;
          const text =
            field === 'base' && (snapshot || unchanged)
              ? snapshot
                ? xpDisplay(snapshot.base)
                : '0'
              : field === 'level'
              ? String(c.baseLevel)
              : field === 'bonus'
              ? snapshot
                ? `+${xpDisplay(snapshot.bonus)} (${xpDisplay(
                    snapshot.bonusPercent
                  )}%)`
                : draft?.percent == null
                ? 'Unknown'
                : unchanged
                ? `+0 (${draft.percent}%)`
                : `${draft.percent}%`
              : field === 'cap'
              ? cap?.mode === 'uncapped'
                ? 'Uncapped'
                : cap?.limit?.toLocaleString() ?? 'Review…'
              : numeric?.toLocaleString() ?? '—';
          return (
            <div key={c.classId}>
              <small>{profileClassLabel(c.characterClass)}</small>
              {!readOnly &&
              review &&
              (field === 'bonus' ||
                field === 'cap' ||
                (field === 'before' && !snapshot)) ? (
                <button
                  className={styles['textButton']}
                  aria-label={`Review ${review.name} ${profileClassLabel(
                    c.characterClass
                  )} ${field}`}
                  onClick={() => onBonus?.(review)}
                >
                  {text}
                </button>
              ) : (
                <span>{text}</span>
              )}
            </div>
          );
        })}
      </div>
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
          {resolved.map(({ reward, blocked, calculation, error, frozen }) => {
            const included =
              readOnly ||
              (blocked !== 'Deferred' && point.rewardIds.includes(reward.id));
            const treasure =
              reward.input.category === 'treasure' ? reward.input : null;
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
                      {treasure?.rows && (
                        <TreasureSubtotal rows={treasure.rows} />
                      )}
                      {treasure &&
                        !treasure.rows &&
                        !readOnly &&
                        onDisposition && (
                          <select
                            aria-label={`Disposition for ${reward.title}`}
                            value={treasure.disposition}
                            disabled={
                              (!!blocked && blocked !== 'Deferred') || frozen
                            }
                            onChange={(e) => {
                              const choice = e.target.value;
                              if (
                                choice === 'keep' ||
                                choice === 'sell' ||
                                choice === 'defer'
                              )
                                onDisposition(reward.id, choice);
                            }}
                          >
                            <option value="keep">Keep</option>
                            <option value="sell">Sell</option>
                            <option value="defer">Defer</option>
                          </select>
                        )}
                      {blocked &&
                        !(treasure?.rows && blocked === 'Deferred') && (
                          <small>{blocked}</small>
                        )}
                      {!blocked && frozen && (
                        <small>
                          Some shares settled; remaining shares pending
                        </small>
                      )}
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
                      {allocation &&
                        (readOnly ? (
                          <small>
                            {point.settlements?.find(
                              (s) =>
                                s.rewardId === reward.id &&
                                s.characterId === c.id
                            )?.decision === 'forfeit'
                              ? 'Forfeit'
                              : point.settlements?.find(
                                  (s) =>
                                    s.rewardId === reward.id &&
                                    s.characterId === c.id
                                )?.decision === 'later'
                              ? 'Later'
                              : 'Awarded'}{' '}
                            {
                              point.settlements?.find(
                                (s) =>
                                  s.rewardId === reward.id &&
                                  s.characterId === c.id
                              )?.reason
                            }
                          </small>
                        ) : recipientSettlement(
                            document,
                            reward.id,
                            c.id,
                            point.correctionOf ?? undefined
                          ) ? (
                          <small>Settled</small>
                        ) : included && !blocked ? (
                          <div>
                            <select
                              aria-label={`${reward.title}: settlement for ${c.name}`}
                              value={xpSettlementDecision(
                                document,
                                point,
                                reward.id,
                                c.id
                              )}
                              onChange={(e) => {
                                const decision = e.target.value;
                                if (
                                  decision === 'award' ||
                                  decision === 'later' ||
                                  decision === 'forfeit'
                                )
                                  onSettlement?.(reward.id, c.id, decision, '');
                              }}
                            >
                              <option value="award">Award now</option>
                              <option value="later">Later</option>
                              <option value="forfeit">Forfeit</option>
                            </select>
                            {xpSettlementDecision(
                              document,
                              point,
                              reward.id,
                              c.id
                            ) === 'forfeit' && (
                              <input
                                aria-label={`Forfeit reason for ${c.name}`}
                                placeholder="Reason (optional)"
                                value={
                                  point.settlements?.find(
                                    (s) =>
                                      s.rewardId === reward.id &&
                                      s.characterId === c.id
                                  )?.reason ?? ''
                                }
                                onChange={(e) =>
                                  onSettlement?.(
                                    reward.id,
                                    c.id,
                                    'forfeit',
                                    e.target.value
                                  )
                                }
                              />
                            )}
                          </div>
                        ) : null)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          {point.bonuses.some((b) => b.classes) && (
            <tr>
              <th scope="row">Trained level</th>
              {characters.map((c) => (
                <td key={c.id}>
                  {classCell(c.id, 'level') ??
                    totals.get(c.id)?.cap?.baseLevel ??
                    '—'}
                </td>
              ))}
            </tr>
          )}
          <tr>
            <th scope="row">Next level</th>
            {characters.map((c) => {
              const cap = totals.get(c.id)?.cap;
              const capError = totals.get(c.id)?.capError;
              return (
                <td key={c.id}>
                  {classCell(c.id, 'cap') ??
                    (!readOnly && !cap && !totals.get(c.id)?.affected ? (
                      <span title="A cap is only needed when awarding XP now.">
                        Not needed
                      </span>
                    ) : readOnly && !cap ? (
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
                          : 'Review trained level…'}
                      </button>
                    ))}
                </td>
              );
            })}
          </tr>
          <tr>
            <th scope="row">Previous balance</th>
            {characters.map((c) => (
              <td key={c.id}>
                {classCell(c.id, 'before') ??
                  totals.get(c.id)?.before?.toLocaleString() ??
                  '—'}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">XP</th>
            {characters.map((c) => {
              const value =
                rows?.find((r) => r.characterId === c.id)?.base ??
                (!readOnly ? base(c.id) : '0');
              return (
                <td key={c.id}>
                  {classCell(c.id, 'base') ??
                    (value === null ? '—' : xpDisplay(value))}
                </td>
              );
            })}
          </tr>
          <tr>
            <th scope="row">Bonus</th>
            {characters.map((c) => {
              const row = rows?.find((r) => r.characterId === c.id),
                review = point.bonuses.find((b) => b.characterId === c.id);
              const percent =
                review?.percent ??
                (readOnly
                  ? latestXpProfile(document, c.id, point.position.sessionId)
                      ?.reference?.bonuses.xpPercent
                  : null);
              const value = row
                ? `+${xpDisplay(row.bonus)} (${xpDisplay(row.bonusPercent)}%)`
                : percent == null
                ? 'Unknown'
                : readOnly
                ? `+0 (${percent}%)`
                : `${percent}%`;
              return (
                <td key={c.id}>
                  {classCell(c.id, 'bonus') ??
                    (!readOnly && review ? (
                      <button
                        className={styles['textButton']}
                        aria-label={`Edit ${c.name} XP bonus`}
                        title={review.reason || undefined}
                        onClick={() => onBonus?.(review)}
                      >
                        {value}
                      </button>
                    ) : row || readOnly ? (
                      value
                    ) : (
                      '—'
                    ))}
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
                  {classCell(c.id, 'full') ??
                    (row ? (
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
                    ) : !readOnly && review?.finalOverride != null ? (
                      <button
                        className={styles['textButton']}
                        aria-label={`Adjust ${c.name} full award`}
                        onClick={() => onFinal?.(review)}
                      >
                        {review.finalOverride} *
                      </button>
                    ) : (
                      totals.get(c.id)?.full?.toLocaleString() ?? '—'
                    ))}
                </td>
              );
            })}
          </tr>
          {(
            [
              ['Discarded', 'discarded'],
              ['Awarded', 'added'],
              ['New balance', 'after'],
            ] as const
          ).map(([label, field]) => (
            <tr
              key={field}
              className={
                field === 'added' || field === 'after'
                  ? styles['awardTotal']
                  : undefined
              }
            >
              <th scope="row">{label}</th>
              {characters.map((c) => (
                <td key={c.id}>
                  {classCell(c.id, field) ??
                    totals.get(c.id)?.[field]?.toLocaleString() ??
                    '—'}
                </td>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
    </div>
  );
}
