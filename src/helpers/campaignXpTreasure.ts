import type { XpReward, XpTreasureRow } from './campaignXpModel';
import { xpAdd, xpExact, xpNumber, xpZero } from './xpArithmetic';

export function newTreasureRow(id: string): XpTreasureRow {
  return {
    id,
    label: '',
    evidence: null,
    disposition: 'defer',
    retainedXp: null,
    gp: null,
  };
}

export function treasureAmount(row: XpTreasureRow) {
  return row.disposition === 'keep'
    ? row.retainedXp
    : row.disposition === 'sell'
    ? row.gp
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
export function treasurePending({ input, rawOverride }: XpReward) {
  if (input.category !== 'treasure') return false;
  const { deferred, missing } = treasureSubtotal(input.rows);
  return (
    deferred > 0 || (missing > 0 && !(rawOverride && input.rows.length === 1))
  );
}
export function rewardEvidence(reward: XpReward) {
  if (reward.input.category === 'treasure')
    return [
      ...(reward.evidence.kind === 'manual' ? [] : [reward.evidence]),
      ...reward.input.rows.flatMap((row) =>
        row.evidence ? [row.evidence] : []
      ),
    ];
  return [reward.evidence];
}
