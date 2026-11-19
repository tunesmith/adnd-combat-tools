import type { XpReward, XpTreasureRow } from './campaignXpModel';
import { xpAdd, xpExact, xpNumber, xpZero } from './xpArithmetic';

export function newTreasureRow(id: string): XpTreasureRow {
  return {
    id,
    label: '',
    evidence: null,
    disposition: 'defer',
    retainedXp: null,
    proceeds: null,
    marketGp: null,
  };
}

export function treasureAmount(row: XpTreasureRow) {
  return row.disposition === 'keep'
    ? row.retainedXp
    : row.disposition === 'sell'
    ? row.proceeds
    : null;
}

export function treasureSubtotal(rows: XpTreasureRow[]) {
  let subtotal = xpZero(),
    deferred = 0,
    missing = 0;
  for (const row of rows) {
    if (row.disposition === 'defer') {
      deferred++;
      continue;
    }
    const amount = treasureAmount(row);
    try {
      if (amount === null) missing++;
      else subtotal = xpAdd(subtotal, xpNumber(amount));
    } catch {
      // A field being typed may not yet contain a complete decimal or fraction.
      missing++;
    }
  }
  return { subtotal: xpExact(subtotal), deferred, missing };
}
export function treasurePending(input: XpReward['input']) {
  if (input.category !== 'treasure') return false;
  if (!input.rows) return input.disposition === 'defer';
  const { deferred, missing } = treasureSubtotal(input.rows);
  return deferred > 0 || missing > 0;
}
export function rewardEvidence(reward: XpReward) {
  if (reward.input.category === 'treasure' && reward.input.rows)
    return [
      ...(reward.evidence.kind === 'manual' ? [] : [reward.evidence]),
      ...reward.input.rows.flatMap((row) =>
        row.evidence ? [row.evidence] : []
      ),
    ];
  return [reward.evidence];
}
