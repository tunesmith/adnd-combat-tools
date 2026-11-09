import { validHistoricalSessionMove } from './campaignSessionOrder';
import {
  awardCapBasis,
  cappedXp,
  rebaseXpRow,
  validateXpCap,
} from './campaignXpCap';
import {
  syncXpTimeline,
  compareXpTimeline,
  compareXpAwards,
  xpAwardRoot,
  validateXpTimeline,
  validateXpTimelineTransition,
} from './campaignXpTimeline';
import type { CampaignDocument } from './campaignDocument';
import { canonical, fingerprint } from './campaignSnapshots';
import {
  campaignXpSchema,
  emptyCampaignXp,
  xpRewardSchema,
  xpPointSchema,
} from './campaignXpModel';
import type {
  CampaignXp,
  XpAwardRow,
  XpCapBasis,
  XpBonusReview,
  XpEvent,
  XpExtension,
  XpOpening,
  XpPoint,
  XpPosition,
  XpReward,
} from './campaignXpModel';
import {
  calculateMonster,
  monsterDifficulty,
} from '../tables/monsterExperience';
import {
  xpAdd,
  xpAdjustment,
  xpCompare,
  xpDivide,
  xpExact,
  xpMultiply,
  xpNumber,
  xpRound,
  xpZero,
} from './xpArithmetic';
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
function fail(message: string): never {
  throw new Error(message);
}
export const xpLedger = (doc: CampaignDocument): CampaignXp =>
  doc.xp || emptyCampaignXp();
export const xpSessionOrder = (doc: CampaignDocument) =>
  doc.sessions.map((s) => s.id);
const phaseOrder = { opening: 0, during: 1, end: 2 };
export function compareXpPosition(
  doc: CampaignDocument,
  a: XpPosition,
  b: XpPosition
): number {
  const sessions = xpSessionOrder(doc);
  return (
    sessions.indexOf(a.sessionId) - sessions.indexOf(b.sessionId) ||
    phaseOrder[a.phase] - phaseOrder[b.phase] ||
    a.order - b.order
  );
}
export function activeXpEvents(events: XpEvent[]): XpEvent[] {
  const replaced = new Set(
    events.flatMap((event) => (event.replaces ? [event.replaces] : []))
  );
  return events.filter((event) => !replaced.has(event.id));
}
export function xpBalance(
  doc: CampaignDocument,
  characterId: string,
  position: XpPosition,
  inclusive = true,
  events = xpLedger(doc).events,
  pointId?: string
): number | null {
  const opening = xpLedger(doc).openings.find(
    (o) => o.characterId === characterId
  );
  if (
    !opening ||
    opening.balance === null ||
    compareXpPosition(
      doc,
      { sessionId: opening.sessionId, phase: 'opening', order: 0 },
      position
    ) > 0
  )
    return null;
  return activeXpEvents(events).reduce((sum, event) => {
    const comparison = compareXpTimeline(
      doc,
      event.point.position,
      position,
      xpAwardRoot(doc, event.point),
      pointId
    );
    return comparison < 0 || (inclusive && comparison === 0)
      ? sum +
          (event.rows.find((r) => r.characterId === characterId)?.award || 0)
      : sum;
  }, opening.balance);
}
export function sessionXpBalances(
  doc: CampaignDocument,
  characterId: string,
  sessionId: string
) {
  return {
    opening: xpBalance(
      doc,
      characterId,
      { sessionId, phase: 'opening', order: 0 },
      false
    ),
    closing: xpBalance(doc, characterId, {
      sessionId,
      phase: 'end',
      order: 9999,
    }),
  };
}
export function rewardSettlement(
  doc: CampaignDocument,
  rewardId: string
): XpEvent | undefined {
  return activeXpEvents(xpLedger(doc).events).find((event) =>
    event.rewards.some((r) => r.id === rewardId)
  );
}
export function xpRewardBase(reward: XpReward) {
  let raw = xpZero(),
    difficulty = xpZero();
  const monsters: ReturnType<typeof calculateMonster>[] = [];
  let calculationError: string | null = null;
  let difficultyKnown = true;
  if (reward.input.category === 'monster') {
    for (const monster of reward.input.monsters) {
      try {
        difficulty = xpAdd(difficulty, monsterDifficulty(monster));
      } catch {
        difficultyKnown = false;
      }
      try {
        const result = calculateMonster(monster);
        monsters.push(result);
        raw = xpAdd(raw, xpNumber(result.raw));
      } catch (error) {
        calculationError = String(error);
        if (!reward.rawOverride) throw error;
      }
    }
  } else if (reward.input.category === 'money') {
    if (reward.input.gp === null && !reward.rawOverride)
      fail('Enter GP-equivalent value.');
    raw = xpNumber(reward.input.gp || '0');
  } else {
    if (reward.input.disposition === 'defer')
      fail('Deferred treasure remains pending.');
    const amount =
      reward.input.disposition === 'keep'
        ? reward.input.retainedXp
        : reward.input.proceeds ?? reward.input.marketGp;
    if (amount === null && !reward.rawOverride)
      fail(
        reward.input.disposition === 'keep'
          ? 'Enter retained-item XP; sale value is separate.'
          : 'Enter sale value in GP.'
      );
    raw = xpNumber(amount || '0');
  }
  const calculatedRaw = calculationError ? null : xpExact(raw);
  if (reward.rawOverride) {
    raw = xpNumber(reward.rawOverride.amount);
  }
  return {
    raw: xpExact(raw),
    calculatedRaw,
    monsters,
    calculationError,
    difficulty:
      reward.input.category === 'monster' && difficultyKnown
        ? xpExact(difficulty)
        : null,
  };
}
export function xpRewardChallenge(reward: XpReward) {
  const participants = reward.recipients.filter((r) => r.participated);
  const levelsKnown =
    participants.length > 0 && participants.every((r) => r.level !== null);
  const levels = levelsKnown
    ? xpExact(
        participants.reduce(
          (sum, r) => xpAdd(sum, xpNumber(r.level || '0')),
          xpZero()
        )
      )
    : null;
  let difficulty: string | null = null;
  if (reward.input.category === 'monster') {
    try {
      difficulty = xpExact(
        reward.input.monsters.reduce(
          (sum, m) => xpAdd(sum, monsterDifficulty(m)),
          xpZero()
        )
      );
    } catch {
      /* Incomplete inputs remain unknown while editing. */
    }
  }
  const proposed =
    reward.input.category !== 'monster'
      ? reward.ratio.proposed ??
        (reward.input.category === 'money' ? '1' : null)
      : difficulty === null ||
        levels === null ||
        xpCompare(xpNumber(levels), xpZero()) === 0
      ? null
      : xpExact(
          xpCompare(xpNumber(difficulty), xpNumber(levels)) >= 0
            ? xpNumber(1)
            : xpDivide(xpNumber(difficulty), xpNumber(levels))
        );
  return { levels, difficulty, proposed };
}
export function resolveXpReward(reward: XpReward) {
  const base = xpRewardBase(reward),
    { calculatedRaw, monsters, calculationError } = base;
  const raw = xpNumber(base.raw),
    difficulty = xpNumber(base.difficulty || '0'),
    difficultyKnown = base.difficulty !== null;
  if (reward.rawOverride && !reward.rawOverride.reason.trim())
    fail('Explain the raw XP override.');
  const proposed = xpRewardChallenge(reward).proposed;
  if (
    reward.ratio.recordedProposal !== null &&
    !reward.ratio.recordedReason.trim()
  )
    fail('Explain the recorded historical ratio proposal.');
  const ratio = reward.ratio.override ?? proposed;
  if (ratio === null)
    fail(
      'Review the challenge ratio; missing levels/HD require an explicit ratio override.'
    );
  if (xpCompare(xpNumber(ratio), xpNumber(1)) > 0)
    fail(
      'Challenge ratio must be between 0 and 1. Use an explained raw override for other DM adjustments.'
    );
  if (reward.ratio.override !== null && !reward.ratio.reason.trim())
    fail('Explain the challenge-ratio override.');
  const recipients = reward.recipients.filter((r) => r.eligible);
  const shares = recipients.reduce(
    (sum, r) => xpAdd(sum, xpNumber(r.shares)),
    xpZero()
  );
  if (!recipients.length || xpCompare(shares, xpZero()) <= 0)
    fail('Select eligible recipients with positive shares.');
  const adjusted = xpMultiply(raw, xpNumber(ratio));
  const allocations = recipients.map((recipient) => {
    const calculated = xpExact(
      xpDivide(xpMultiply(adjusted, xpNumber(recipient.shares)), shares)
    );
    if (
      recipient.allocationOverride !== null &&
      !recipient.allocationReason.trim()
    )
      fail('Explain the historical allocation override.');
    return {
      characterId: recipient.characterId,
      calculated,
      accepted: recipient.allocationOverride ?? calculated,
      reason:
        recipient.allocationOverride === null ? '' : recipient.allocationReason,
    };
  });
  const calculatedAllocation = allocations.reduce(
    (sum, a) => xpAdd(sum, xpNumber(a.calculated)),
    xpZero()
  );
  const acceptedAllocation = allocations.reduce(
    (sum, a) => xpAdd(sum, xpNumber(a.accepted)),
    xpZero()
  );
  return {
    calculatedAllocation: xpExact(calculatedAllocation),
    acceptedAllocation: xpExact(acceptedAllocation),
    allocationAdjustment: xpAdjustment(
      acceptedAllocation,
      calculatedAllocation
    ),
    rewardId: reward.id,
    calculatedRaw,
    raw: xpExact(raw),
    difficulty:
      reward.input.category === 'monster' && difficultyKnown
        ? xpExact(difficulty)
        : null,
    proposedRatio: proposed,
    ratio: xpExact(xpNumber(ratio)),
    recordedProposal: reward.ratio.recordedProposal,
    calculationError,
    monsters,
    allocations,
  };
}
function calculateXpRows(
  rewards: XpReward[],
  bonuses: XpBonusReview[],
  before: Record<string, number>,
  caps?: Map<string, XpCapBasis>
): XpAwardRow[] {
  const resolutions = rewards.map(resolveXpReward);
  const ids = Array.from(
    new Set(resolutions.flatMap((r) => r.allocations.map((a) => a.characterId)))
  );
  return ids.map((characterId) => {
    const review =
      bonuses.find((r) => r.characterId === characterId) ||
      fail('Review every recipient’s XP bonus.');
    if (review.percent === null)
      fail(
        `${review.name}: confirm an XP bonus, including an explicit 0 if none.`
      );
    const allocations = resolutions.flatMap((r) =>
      r.allocations
        .filter((a) => a.characterId === characterId)
        .map((a) => ({
          rewardId: r.rewardId,
          calculated: a.calculated,
          accepted: a.accepted,
          reason: a.reason,
        }))
    );
    const base = allocations.reduce(
      (sum, r) => xpAdd(sum, xpNumber(r.accepted)),
      xpZero()
    );
    const bonus = xpMultiply(
      base,
      xpDivide(xpNumber(review.percent), xpNumber(100))
    );
    const unrounded = xpAdd(base, bonus),
      rounded = xpRound(unrounded);
    if (review.finalOverride !== null && !review.finalReason.trim())
      fail('Explain the full award override.');
    const award = review.finalOverride ?? rounded,
      previous = before[characterId];
    if (previous === undefined)
      fail(
        `${review.name}: establish a known opening XP balance before awarding.`
      );
    if (!caps && !Number.isSafeInteger(previous + award))
      fail('XP balance exceeds the supported integer range.');
    const cap = caps?.get(characterId);
    if (caps && !cap) fail(`${review.name}: XP cap is unknown.`);
    const addition = cap ? cappedXp(award, previous, cap) : null;
    return {
      characterId,
      name: review.name,
      allocations,
      base: xpExact(base),
      bonusPercent: xpExact(xpNumber(review.percent)),
      bonus: xpExact(bonus),
      unrounded: xpExact(unrounded),
      rounded,
      award,
      overrideReason: review.finalOverride === null ? '' : review.finalReason,
      before: previous,
      after: previous + award,
      ...(addition && cap
        ? { ...addition, fullAward: award, cap: clone(cap) }
        : {}),
    };
  });
}
function withLedger(doc: CampaignDocument, xp: CampaignXp): CampaignDocument {
  return {
    ...doc,
    xp: syncXpTimeline({ ...xp, sessionOrder: xpSessionOrder({ ...doc, xp }) }),
  };
}
function openingUsedByExtension(xp: CampaignXp, id: string) {
  return (
    xp.extensions?.some((e) =>
      e.openings.some((o) => o.previous.characterId === id)
    ) ?? false
  );
}
export function xpOpeningLocked(doc: CampaignDocument, id: string) {
  const xp = xpLedger(doc);
  return (
    openingUsedByExtension(xp, id) ||
    xp.events.some((e) => e.rows.some((r) => r.characterId === id))
  );
}
export function saveXpOpening(
  doc: CampaignDocument,
  entry: CampaignXp['openings'][number]
): CampaignDocument {
  const xp = xpLedger(doc),
    old = xp.openings.find((o) => o.characterId === entry.characterId);
  if (xpOpeningLocked(doc, entry.characterId))
    fail(
      'Opening balances used by confirmed history are fixed. Correct an award explicitly.'
    );
  if (
    !doc.party?.roster.some((c) => c.id === entry.characterId) ||
    !doc.sessions.some((s) => s.id === entry.sessionId)
  )
    fail('Select a campaign character and starting session.');
  return withLedger(doc, {
    ...xp,
    openings: [
      ...xp.openings.filter((o) => o.characterId !== entry.characterId),
      { ...entry, id: old?.id || entry.id },
    ],
  });
}
export function saveXpReward(
  doc: CampaignDocument,
  reward: XpReward,
  correctionPointId?: string
): CampaignDocument {
  const accepted = xpRewardSchema.parse(reward),
    xp = xpLedger(doc);
  if (correctionPointId) {
    const point = xp.points.find((p) => p.id === correctionPointId);
    if (!point?.correctionOf || point.confirmedEventId)
      fail('Choose Edit award before changing confirmed event inputs.');
    const prior =
      point.rewardOverrides.find((r) => r.id === accepted.id) ||
      xp.rewards.find((r) => r.id === accepted.id);
    if (prior && canonical(prior.origin) !== canonical(accepted.origin))
      fail('Confirmed XP event timing is fixed.');
    return withLedger(doc, {
      ...xp,
      points: xp.points.map((p) =>
        p.id === point.id
          ? {
              ...p,
              rewardOverrides: [
                ...p.rewardOverrides.filter((r) => r.id !== accepted.id),
                accepted,
              ],
            }
          : p
      ),
    });
  }
  if (xp.events.some((e) => e.rewards.some((r) => r.id === accepted.id)))
    fail('Confirmed reward inputs are frozen. Use Edit award.');
  const previous = xp.rewards.find((r) => r.id === accepted.id);
  if (previous && accepted.version !== previous.version + 1)
    fail('Reward changed; reopen its editor.');
  return withLedger(doc, {
    ...xp,
    rewards: previous
      ? xp.rewards.map((r) => (r.id === accepted.id ? accepted : r))
      : [...xp.rewards, accepted],
  });
}
export function deleteXpReward(
  doc: CampaignDocument,
  id: string,
  version: number
): CampaignDocument {
  const xp = xpLedger(doc);
  if (xp.events.some((e) => e.rewards.some((r) => r.id === id)))
    fail('Awarded XP events cannot be deleted. Use Edit award.');
  const reward = xp.rewards.find((r) => r.id === id);
  if (!reward || reward.version !== version)
    fail('XP event changed; reopen its editor.');
  let next = withLedger(doc, {
    ...xp,
    rewards: xp.rewards.filter((r) => r.id !== id),
    points: xp.points.map((p) =>
      p.confirmedEventId
        ? p
        : {
            ...p,
            rewardIds: p.rewardIds.filter((rewardId) => rewardId !== id),
            rewardOverrides: p.rewardOverrides.filter((r) => r.id !== id),
          }
    ),
  });
  for (const point of xp.points.filter(
    (p) => !p.confirmedEventId && p.rewardIds.includes(id)
  )) {
    next = selectXpRewards(
      next,
      point.id,
      point.rewardIds.filter((rewardId) => rewardId !== id)
    );
  }
  return next;
}
export function saveXpPoint(
  doc: CampaignDocument,
  point: XpPoint
): CampaignDocument {
  const accepted = xpPointSchema.parse(point),
    xp = xpLedger(doc),
    old = xp.points.find((p) => p.id === point.id);
  if (old?.confirmedEventId) fail('Confirmed award points are immutable.');
  return withLedger(doc, {
    ...xp,
    points: old
      ? xp.points.map((p) => (p.id === point.id ? accepted : p))
      : [...xp.points, accepted],
  });
}
export function pointRewards(
  doc: CampaignDocument,
  point: XpPoint
): XpReward[] {
  return point.rewardIds.map(
    (id) =>
      point.rewardOverrides.find((r) => r.id === id) ||
      xpLedger(doc).rewards.find((r) => r.id === id) ||
      fail('Selected reward is missing.')
  );
}
export function selectXpRewards(
  doc: CampaignDocument,
  pointId: string,
  rewardIds: string[]
): CampaignDocument {
  const point =
    xpLedger(doc).points.find((p) => p.id === pointId) ||
    fail('Select an award point.');
  const ids = Array.from(
    new Set(
      rewardIds.flatMap(
        (id) =>
          (
            point.rewardOverrides.find((r) => r.id === id) ||
            xpLedger(doc).rewards.find((r) => r.id === id)
          )?.recipients
            .filter((r) => r.eligible)
            .map((r) => r.characterId) || []
      )
    )
  );
  const bonuses = ids.map(
    (characterId) =>
      point.bonuses.find((b) => b.characterId === characterId) || {
        characterId,
        name:
          doc.party?.roster.find((c) => c.id === characterId)?.name ||
          characterId,
        percent:
          doc.party?.profiles
            .find(
              (p) =>
                p.characterId === characterId &&
                p.sessionId === point.position.sessionId
            )
            ?.reference?.bonuses.xpPercent?.toString() ?? null,
        reason: '',
        finalOverride: null,
        finalReason: '',
      }
  );
  return saveXpPoint(doc, { ...point, rewardIds, bonuses });
}
export function newXpPoint(
  doc: CampaignDocument,
  sessionId: string,
  id: string
): XpPoint {
  return {
    id,
    label: 'New award',
    position: {
      sessionId,
      phase: 'end',
      order:
        Math.max(
          -1,
          ...xpLedger(doc)
            .points.filter(
              (p) =>
                p.position.sessionId === sessionId && p.position.phase === 'end'
            )
            .map((p) => p.position.order)
        ) + 1,
    },
    rewardIds: [],
    bonuses: [],
    correctionOf: null,
    correctionReason: '',
    rewardOverrides: [],
    confirmedEventId: null,
  };
}
export function beginXpCorrection(
  doc: CampaignDocument,
  eventId: string,
  pointId: string
): CampaignDocument {
  const event =
    activeXpEvents(xpLedger(doc).events).find((e) => e.id === eventId) ||
    fail('Choose the current accepted award version.');
  const point: XpPoint = {
    ...clone(event.point),
    id: pointId,
    label: `Correction — ${event.point.label}`,
    correctionOf: event.id,
    correctionReason: '',
    rewardOverrides: clone(event.rewards),
    confirmedEventId: null,
    caps: event.rows.flatMap((r) =>
      r.cap ? [{ characterId: r.characterId, basis: clone(r.cap) }] : []
    ),
  };
  return saveXpPoint(doc, point);
}
export function xpEvidenceDuplicates(
  doc: CampaignDocument,
  reward: XpReward
): XpReward[] {
  if (reward.evidence.kind === 'manual') return [];
  const entries = [
    ...xpLedger(doc).rewards,
    ...xpLedger(doc).events.flatMap((e) => e.rewards),
  ];
  const found = entries.filter((other) => {
    if (other.id === reward.id || other.evidence.kind !== reward.evidence.kind)
      return false;
    if (other.evidence.keys.some((key) => reward.evidence.keys.includes(key)))
      return true;
    if (reward.evidence.kind === 'item')
      return other.evidence.keys.some((a) =>
        reward.evidence.keys.some(
          (b) =>
            a.slice(a.lastIndexOf(':item:')) ===
            b.slice(b.lastIndexOf(':item:'))
        )
      );
    if (
      other.evidence.sourceId !== reward.evidence.sourceId ||
      other.evidence.instanceId === reward.evidence.instanceId ||
      other.input.category !== 'monster' ||
      reward.input.category !== 'monster'
    )
      return false;
    const names = reward.input.monsters.map((m) => m.name.trim().toLowerCase());
    return other.input.monsters.some((m) =>
      names.includes(m.name.trim().toLowerCase())
    );
  });
  return found.filter(
    (r, i) => found.findIndex((other) => other.id === r.id) === i
  );
}
export interface XpAwardPreview {
  fingerprint: string;
  point: XpPoint;
  rewards: XpReward[];
  rows: XpAwardRow[];
  resolutions: ReturnType<typeof resolveXpReward>[];
  later: { event: XpEvent; rows: XpAwardRow[] }[];
}
export function xpCapProfileSignature(doc: CampaignDocument, point: XpPoint) {
  const ids = pointRewards(doc, point).flatMap((r) =>
    r.recipients.filter((c) => c.eligible).map((c) => c.characterId)
  );
  return canonical(
    doc.party?.profiles
      .filter(
        (p) =>
          p.sessionId === point.position.sessionId &&
          ids.includes(p.characterId)
      )
      .map((p) => ({
        id: p.characterId,
        characterClass: p.characterClass,
        baseLevel: p.baseLevel,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)) || []
  );
}
function beforeOpening(
  doc: CampaignDocument,
  sessionId: string,
  opening: XpOpening
) {
  const order = xpSessionOrder(doc);
  return order.indexOf(sessionId) < order.indexOf(opening.sessionId);
}
function historicalPosition(
  doc: CampaignDocument,
  sessionId: string,
  characterIds: string[]
): boolean {
  const xp = xpLedger(doc);
  const cutoffs = xp.openings.map(
    (opening) =>
      xp.extensions
        ?.flatMap((e) => e.openings)
        .find((entry) => entry.previous.characterId === opening.characterId)
        ?.previous ?? opening
  );
  return (characterIds.length ? characterIds : ['']).some((id) => {
    const opening = cutoffs.find((o) => o.characterId === id);
    return opening
      ? beforeOpening(doc, sessionId, opening)
      : cutoffs.some((o) => beforeOpening(doc, sessionId, o));
  });
}
function eligibleCharacters(rewards: XpReward[]) {
  return Array.from(
    new Set(
      rewards.flatMap((r) =>
        r.recipients.filter((c) => c.eligible).map((c) => c.characterId)
      )
    )
  );
}
export function historicalXpReward(doc: CampaignDocument, reward: XpReward) {
  return historicalPosition(
    doc,
    reward.origin.sessionId,
    eligibleCharacters([reward])
  );
}
export function historicalXpPoint(doc: CampaignDocument, point: XpPoint) {
  return (
    !point.correctionOf &&
    historicalPosition(
      doc,
      point.position.sessionId,
      eligibleCharacters(pointRewards(doc, point))
    )
  );
}
export function xpRewardFitsAward(
  doc: CampaignDocument,
  point: XpPoint,
  reward: XpReward
) {
  if (point.correctionOf) return !reservedHistoricalReward(doc, point, reward);
  const reserved = historicalXpReward(doc, reward);
  if (point.rewardIds.length && reserved !== historicalXpPoint(doc, point))
    return false;
  return (
    reserved ===
    historicalPosition(
      doc,
      point.position.sessionId,
      eligibleCharacters([reward])
    )
  );
}
function reservedHistoricalReward(
  doc: CampaignDocument,
  point: XpPoint,
  reward: XpReward
) {
  if (!historicalXpReward(doc, reward)) return false;
  const target = xpLedger(doc).events.find((e) => e.id === point.correctionOf);
  return !target?.rewards.some((r) => r.id === reward.id);
}
export function previewXpAward(
  doc: CampaignDocument,
  pointId: string
): XpAwardPreview {
  return reviewXpAward(doc, pointId);
}
function reviewXpAward(
  doc: CampaignDocument,
  pointId: string,
  reconstructing = false
): XpAwardPreview {
  const xp = xpLedger(doc),
    point =
      xp.points.find((p) => p.id === pointId) || fail('Select an award point.');
  if (!point.label.trim()) fail('Give the award point a label.');
  if (point.confirmedEventId) fail('This award was already confirmed.');
  if (
    point.correctionOf &&
    !activeXpEvents(xp.events).some((e) => e.id === point.correctionOf)
  )
    fail(
      'These changes target an older award version. Open the current award and choose Edit award.'
    );
  if (point.correctionOf) {
    const target = xp.events.find((e) => e.id === point.correctionOf);
    if (
      target &&
      compareXpPosition(doc, target.point.position, point.position) !== 0
    )
      fail('A correction retains its original award position.');
  }
  if (point.correctionOf && !point.correctionReason.trim())
    fail('Add a reason for the changes.');
  if (
    !point.rewardIds.length ||
    new Set(point.rewardIds).size !== point.rewardIds.length
  )
    fail('Select rewards once each.');
  const rewards = pointRewards(doc, point);
  if (
    !reconstructing &&
    (historicalXpPoint(doc, point) ||
      rewards.some((r) => reservedHistoricalReward(doc, point, r)))
  )
    fail(
      'Historical drafts are confirmed together through Extend history backward.'
    );
  for (const reward of rewards) {
    if (
      compareXpTimeline(
        doc,
        reward.origin,
        point.position,
        reward.id,
        xpAwardRoot(doc, point)
      ) > 0
    )
      fail(`${reward.title} was earned after this award point.`);
    const settled = rewardSettlement(doc, reward.id);
    if (settled && settled.id !== point.correctionOf)
      fail(`${reward.title} is already awarded.`);
    if (
      xpEvidenceDuplicates(doc, reward).some(
        (other) => !other.distinctReason.trim()
      ) &&
      !reward.distinctReason.trim()
    )
      fail(
        `${reward.title}: review possible repeated evidence and explain why this is a distinct reward.`
      );
  }
  const active = activeXpEvents(xp.events)
    .filter((e) => e.id !== point.correctionOf)
    .sort((a, b) => compareXpAwards(doc, a.point, b.point));
  if (active.some((e) => compareXpAwards(doc, e.point, point) === 0))
    fail(
      'This position already has an award. Choose a different order or correct that award.'
    );
  const before: Record<string, number> = {};
  for (const r of rewards.flatMap((r) =>
    r.recipients.filter((r) => r.eligible)
  )) {
    const balance = xpBalance(
      doc,
      r.characterId,
      point.position,
      false,
      xp.events,
      xpAwardRoot(doc, point)
    );
    if (balance !== null) before[r.characterId] = balance;
  }
  const caps = new Map(
    Object.keys(before).map((id) => [id, awardCapBasis(doc, point, id)])
  );
  const rows = calculateXpRows(rewards, point.bonuses, before, caps);
  const revised: XpEvent = {
    id: 'preview',
    point: clone(point),
    confirmedAt: '2000-01-01T00:00:00.000Z',
    replaces: point.correctionOf,
    correctionRoot: null,
    reason: point.correctionReason,
    calculatorVersion: 2,
    rounding: 'nearest-whole-half-up-after-bonus',
    rewards,
    rows,
    resolutions: rewards.map(resolveXpReward),
  };
  const simulated = [...xp.events, revised];
  const later: XpAwardPreview['later'] = [];
  for (const event of active.filter(
    (e) => !reconstructing && compareXpAwards(doc, e.point, point) > 0
  )) {
    const rebased = event.rows.map((r) => {
      const balance = xpBalance(
        doc,
        r.characterId,
        event.point.position,
        false,
        simulated,
        xpAwardRoot(doc, event.point)
      );
      if (balance === null) fail('A later balance cannot be rebased.');
      return rebaseXpRow(r, balance);
    });
    later.push({ event, rows: rebased });
    simulated.push({
      ...event,
      id: `preview-${event.id}`,
      replaces: event.id,
      rows: rebased,
    });
  }
  const result = {
    point: clone(point),
    rewards: clone(rewards),
    rows,
    resolutions: rewards.map(resolveXpReward),
    later,
  };
  return {
    ...result,
    fingerprint: reconstructing
      ? ''
      : fingerprint({
          ...result,
          timeline: xp.timeline,
          sessionOrder: xpSessionOrder(doc),
          openings: xp.openings,
          events: xp.events,
          capProfiles: xpCapProfileSignature(doc, point),
        }),
  };
}
export function confirmXpAward(
  doc: CampaignDocument,
  pointId: string,
  expected: string,
  eventId: string,
  at: string,
  reviewedLater = false
): CampaignDocument {
  const xp = xpLedger(doc),
    point =
      xp.points.find((p) => p.id === pointId) || fail('Award point missing.');
  if (point.confirmedEventId) {
    if (point.confirmedEventId === eventId) return doc;
    fail('This award has already been confirmed.');
  }
  const preview = previewXpAward(doc, pointId);
  if (preview.fingerprint !== expected)
    fail('Award inputs or balances changed. Review a fresh preview.');
  if (preview.later.length && !reviewedLater)
    fail('Explicitly review the later balances before confirming.');
  if (xp.events.some((e) => e.id === eventId))
    fail('Duplicate award operation.');
  const event = awardEvent(preview, eventId, at);
  const rebased = preview.later.map(
    ({ event: previous, rows }, index): XpEvent => ({
      ...clone(previous),
      id: `${eventId}-balance-${index}`,
      confirmedAt: at,
      replaces: previous.id,
      correctionRoot: eventId,
      reason: `Balance review after ${point.label}`,
      rows,
    })
  );
  const next = withLedger(doc, {
    ...xp,
    points: xp.points.map((p) =>
      p.id === pointId ? { ...p, confirmedEventId: eventId } : p
    ),
    events: [...xp.events, event, ...rebased],
  });
  verifyExtensionCutoffs(next);
  return next;
}
function awardEvent(
  preview: XpAwardPreview,
  eventId: string,
  at: string
): XpEvent {
  return {
    id: eventId,
    point: preview.point,
    confirmedAt: at,
    replaces: preview.point.correctionOf,
    correctionRoot: null,
    reason: preview.point.correctionReason,
    calculatorVersion: 2,
    rounding: 'nearest-whole-half-up-after-bonus',
    rewards: preview.rewards,
    rows: preview.rows,
    resolutions: preview.resolutions,
  };
}
type EarlierOpening = Pick<XpOpening, 'characterId' | 'sessionId' | 'balance'>;
export interface XpExtensionRequest {
  pointIds: string[];
  openings: EarlierOpening[];
}
interface XpReconciliationRow {
  previous: XpOpening | undefined;
  replacement: EarlierOpening;
  applied: number | null;
  reconstructed: number | null;
  difference: number | null;
}
export function xpExtensionDrafts(doc: CampaignDocument) {
  const xp = xpLedger(doc);
  return xp.points.filter(
    (point) =>
      !point.confirmedEventId &&
      historicalXpPoint(doc, point) &&
      xp.openings.some((opening) =>
        beforeOpening(doc, point.position.sessionId, opening)
      )
  );
}
function replaceOpenings(openings: XpOpening[], replacements: XpOpening[]) {
  return openings.map((o) => replacements.find((r) => r.id === o.id) ?? o);
}
export function previewXpExtension(
  doc: CampaignDocument,
  request: XpExtensionRequest
) {
  const xp = xpLedger(doc);
  const drafts = xpExtensionDrafts(doc);
  if (
    !request.pointIds.length ||
    new Set(request.pointIds).size !== request.pointIds.length
  )
    fail('Select historical award drafts once each.');
  const points = request.pointIds
    .map(
      (id) =>
        drafts.find((point) => point.id === id) ||
        fail('Select unconfirmed historical awards.')
    )
    .sort((a, b) => compareXpAwards(doc, a, b));
  const affected = Array.from(
    new Set([
      ...eligibleCharacters(points.flatMap((p) => pointRewards(doc, p))),
      ...request.openings.map((o) => o.characterId),
    ])
  );
  if (
    new Set(request.openings.map((o) => o.characterId)).size !==
    request.openings.length
  )
    fail('Enter one earlier opening per character.');
  const rows: XpReconciliationRow[] = affected.map((characterId) => ({
    previous: xp.openings.find((o) => o.characterId === characterId),
    replacement: request.openings.find(
      (o) => o.characterId === characterId
    ) ?? {
      characterId,
      sessionId: '',
      balance: null,
    },
    applied: null,
    reconstructed: null,
    difference: null,
  }));
  for (const { previous, replacement } of rows) {
    if (
      replacement.balance !== null &&
      (!Number.isSafeInteger(replacement.balance) || replacement.balance < 0)
    )
      fail('Earlier opening XP must be a nonnegative whole number.');
    if (
      previous &&
      replacement.sessionId &&
      (!doc.sessions.some((s) => s.id === replacement.sessionId) ||
        !beforeOpening(doc, replacement.sessionId, previous))
    )
      fail('Choose an earlier opening session for each character.');
  }
  const changes = rows.flatMap(({ previous, replacement }) =>
    previous &&
    previous.balance !== null &&
    replacement.sessionId &&
    replacement.balance !== null
      ? [
          {
            previous,
            replacement: {
              ...previous,
              ...replacement,
              reason: 'Reconciled historical opening',
            },
            applied: 0,
          },
        ]
      : []
  );
  const awards: XpAwardPreview[] = [];
  const result = {
    rows,
    changes,
    awards,
    fingerprint: fingerprint({
      campaignId: doc.id,
      request,
      xp,
      sessions: xpSessionOrder(doc),
      profiles: points.map((point) => xpCapProfileSignature(doc, point)),
    }),
  };
  if (changes.length !== rows.length) return result;
  let simulated: CampaignDocument = {
    ...doc,
    xp: {
      ...xp,
      openings: replaceOpenings(
        xp.openings,
        changes.map((c) => c.replacement)
      ),
    },
  };
  for (const point of points) {
    for (const id of eligibleCharacters(pointRewards(doc, point))) {
      const change = changes.find((c) => c.previous.characterId === id);
      if (
        !change ||
        !beforeOpening(doc, point.position.sessionId, change.previous) ||
        beforeOpening(doc, point.position.sessionId, change.replacement)
      )
        fail(
          `${point.label}: the award must fall between each recipient’s earlier opening and existing cutoff.`
        );
    }
    const award = reviewXpAward(simulated, point.id, true);
    result.awards.push(award);
    const ledger = xpLedger(simulated);
    simulated = {
      ...simulated,
      xp: {
        ...ledger,
        events: [
          ...ledger.events,
          awardEvent(
            award,
            `preview-extension-${point.id}`,
            '2000-01-01T00:00:00.000Z'
          ),
        ],
      },
    };
    for (const row of award.rows) {
      const change = changes.find(
        (c) => c.previous.characterId === row.characterId
      );
      if (!change) fail('Reconcile every recipient of a historical award.');
      change.applied += row.award;
    }
  }
  for (const row of rows) {
    const change = changes.find(
      (c) => c.previous.characterId === row.replacement.characterId
    );
    if (
      !change ||
      change.replacement.balance === null ||
      change.previous.balance === null
    )
      fail('Missing reconciliation balance.');
    row.applied = change.applied;
    row.reconstructed = change.replacement.balance + row.applied;
    row.difference = row.reconstructed - change.previous.balance;
  }
  return result;
}

export function confirmXpExtension(
  doc: CampaignDocument,
  request: XpExtensionRequest,
  expected: string,
  operationId: string,
  at: string
): CampaignDocument {
  const xp = xpLedger(doc);
  if (xp.extensions?.some((e) => e.id === operationId)) return doc;
  const preview = previewXpExtension(doc, request);
  if (preview.fingerprint !== expected)
    fail('XP history changed. Review a fresh reconciliation.');
  if (!preview.awards.length || preview.rows.some((r) => r.difference !== 0))
    fail('Every earlier opening must match the existing cutoff exactly.');
  const events = preview.awards.map((award, index) =>
    awardEvent(award, `${operationId}-award-${index}`, at)
  );
  const extension: XpExtension = {
    id: operationId,
    confirmedAt: at,
    openings: preview.changes,
    eventIds: events.map((e) => e.id),
  };
  const next = withLedger(doc, {
    ...xp,
    extensions: [...(xp.extensions ?? []), extension],
    openings: replaceOpenings(
      xp.openings,
      extension.openings.map((o) => o.replacement)
    ),
    events: [...xp.events, ...events],
    points: xp.points.map((point) => {
      const event = events.find((e) => e.point.id === point.id);
      return event ? { ...point, confirmedEventId: event.id } : point;
    }),
  });
  verifyExtensionCutoffs(next);
  verifyXpBalances(next, activeXpEvents(xp.events));
  return next;
}

function verifyExtensionCutoffs(doc: CampaignDocument) {
  for (const extension of xpLedger(doc).extensions ?? [])
    for (const { previous } of extension.openings)
      if (
        xpBalance(
          doc,
          previous.characterId,
          {
            sessionId: previous.sessionId,
            phase: 'opening',
            order: 0,
          },
          false
        ) !== previous.balance
      )
        fail(
          'The reconciled XP balance at an original cutoff must stay unchanged.'
        );
}

function verifyXpBalances(doc: CampaignDocument, events: XpEvent[]) {
  for (const event of events)
    for (const row of event.rows) {
      const before = xpBalance(
        doc,
        row.characterId,
        event.point.position,
        false,
        xpLedger(doc).events,
        xpAwardRoot(doc, event.point)
      );
      if (before !== row.before)
        fail(
          'Later award balances need an explicit atomic review after an earlier correction.'
        );
    }
}

// Replay each award against the opening in force when it was recorded. Backfill
// appends to storage order, even though its awards occur earlier in play order.
function extensionReplay(
  doc: CampaignDocument,
  xp: CampaignXp,
  unique: (id: string) => void
) {
  let initial = xp.openings;
  const batches = new Map<string, XpOpening[]>();
  let nextBatch = xp.events.length;
  for (const extension of [...(xp.extensions ?? [])].reverse()) {
    unique(extension.id);
    const firstId =
      extension.eventIds[0] || fail('Missing historical award batch.');
    const start = xp.events.findIndex((e) => e.id === firstId);
    const events = xp.events.slice(start, start + extension.eventIds.length);
    if (
      start < 0 ||
      start + events.length > nextBatch ||
      canonical(events.map((e) => e.id)) !== canonical(extension.eventIds) ||
      events.some(
        (e) =>
          e.replaces ||
          e.correctionRoot ||
          e.calculatorVersion !== 2 ||
          e.confirmedAt !== extension.confirmedAt
      ) ||
      events.some((e, i) => {
        const previous = events[i - 1];
        return previous && compareXpAwards(doc, previous.point, e.point) >= 0;
      })
    )
      fail('Invalid historical XP award batch.');
    nextBatch = start;
    const rows = events.flatMap((e) =>
      e.rows.map((r) => ({ row: r, sessionId: e.point.position.sessionId }))
    );
    const ids = new Set(extension.openings.map((o) => o.previous.characterId));
    if (
      ids.size !== extension.openings.length ||
      rows.some(({ row }) => !ids.has(row.characterId))
    )
      fail('Invalid historical XP reconciliation recipients.');
    for (const { previous, replacement, applied } of extension.openings) {
      const awards = rows.filter(
        ({ row }) => row.characterId === previous.characterId
      );
      if (
        previous.id !== replacement.id ||
        previous.characterId !== replacement.characterId ||
        !doc.sessions.some((s) => s.id === previous.sessionId) ||
        !doc.sessions.some((s) => s.id === replacement.sessionId) ||
        canonical(initial.find((o) => o.id === replacement.id)) !==
          canonical(replacement) ||
        !beforeOpening(doc, replacement.sessionId, previous) ||
        previous.balance === null ||
        replacement.balance === null ||
        replacement.balance + applied !== previous.balance ||
        awards.reduce((sum, { row }) => sum + row.award, 0) !== applied ||
        awards.some(
          ({ sessionId }) =>
            !beforeOpening(doc, sessionId, previous) ||
            beforeOpening(doc, sessionId, replacement)
        )
      )
        fail('Invalid historical XP opening reconciliation.');
    }
    batches.set(
      firstId,
      extension.openings.map((o) => o.replacement)
    );
    initial = replaceOpenings(
      initial,
      extension.openings.map((o) => o.previous)
    );
  }
  return { initial, batches };
}
export function validateCampaignXp(
  doc: CampaignDocument,
  unique: (id: string) => void
) {
  if (!doc.xp) return;
  validateXpTimeline(doc);
  const xp = campaignXpSchema.parse(doc.xp),
    sessions = new Set(doc.sessions.map((s) => s.id)),
    characters = new Set(doc.party?.roster.map((c) => c.id) || []);
  if (
    new Set(xp.sessionOrder).size !== xp.sessionOrder.length ||
    xp.sessionOrder.some((id) => !sessions.has(id))
  )
    fail('Invalid XP session order.');
  const position = (p: XpPosition) => {
    if (!sessions.has(p.sessionId)) fail('Invalid XP session.');
  };
  const recipient = (id: string) => {
    if (!characters.has(id))
      fail('XP requires a stable campaign character identity.');
  };
  const openingCharacters = new Set<string>();
  for (const o of xp.openings) {
    unique(o.id);
    recipient(o.characterId);
    if (!sessions.has(o.sessionId) || openingCharacters.has(o.characterId))
      fail('Invalid or duplicate opening XP.');
    openingCharacters.add(o.characterId);
  }
  const validateReward = (r: XpReward) => {
    position(r.origin);
    const ids = new Set<string>();
    for (const p of r.recipients) {
      recipient(p.characterId);
      if (ids.has(p.characterId)) fail('Duplicate reward recipient.');
      ids.add(p.characterId);
    }
    if (new Set(r.evidence.keys).size !== r.evidence.keys.length)
      fail('Duplicate evidence keys.');
  };
  for (const reward of xp.rewards) {
    unique(reward.id);
    validateReward(reward);
  }
  for (const p of xp.points) {
    unique(p.id);
    position(p.position);
    if (p.correctionOf) {
      if (!xp.events.some((e) => e.id === p.correctionOf))
        fail('Missing XP correction target.');
      xpAwardRoot(doc, p);
    }
    if (
      new Set(p.rewardIds).size !== p.rewardIds.length ||
      new Set(p.bonuses.map((b) => b.characterId)).size !== p.bonuses.length
    )
      fail('Duplicate award selection.');
    p.bonuses.forEach((b) => recipient(b.characterId));
    if (
      new Set(p.caps?.map((c) => c.characterId)).size !== (p.caps?.length ?? 0)
    )
      fail('Duplicate XP cap review.');
    p.caps?.forEach((c) => {
      recipient(c.characterId);
      validateXpCap(c.basis);
    });
    p.rewardOverrides.forEach(validateReward);
    if (
      p.confirmedEventId &&
      !xp.events.some((e) => e.id === p.confirmedEventId && e.point.id === p.id)
    )
      fail('Missing confirmed award.');
  }
  const replay = extensionReplay(doc, xp, unique);
  let openings = replay.initial;
  const prefix: XpEvent[] = [];
  for (const event of xp.events) {
    const replacements = replay.batches.get(event.id);
    if (replacements) openings = replaceOpenings(openings, replacements);
    const asRecorded = { ...doc, xp: { ...xp, openings } };
    unique(event.id);
    position(event.point.position);
    event.rewards.forEach(validateReward);
    if (!xp.points.some((p) => p.id === event.point.id && p.confirmedEventId))
      fail('Award event has no confirmed point.');
    if (
      event.replaces &&
      !activeXpEvents(prefix).some((e) => e.id === event.replaces)
    )
      fail('An XP correction must replace one current award version.');
    if (event.replaces) {
      const previous = prefix.find((e) => e.id === event.replaces);
      if (
        !previous ||
        compareXpPosition(
          doc,
          previous.point.position,
          event.point.position
        ) !== 0 ||
        !event.reason.trim()
      )
        fail('Corrections retain their award position and require a reason.');
    }
    if (
      event.correctionRoot &&
      !prefix.some(
        (e) =>
          e.id === event.correctionRoot && e.confirmedAt === event.confirmedAt
      )
    )
      fail('Invalid balance review linkage.');
    const livePoint = xp.points.find((p) => p.id === event.point.id);
    if (
      canonical(event.point.rewardIds) !==
      canonical(event.rewards.map((r) => r.id))
    )
      fail('Award rewards must match their reviewed selection.');
    if (event.correctionRoot) {
      const previous = prefix.find((e) => e.id === event.replaces);
      if (
        !previous ||
        canonical(previous.rewards) !== canonical(event.rewards) ||
        canonical(previous.point) !== canonical(event.point)
      )
        fail('A balance rebase retains accepted inputs and bonuses.');
      if (
        previous.calculatorVersion !== event.calculatorVersion ||
        previous.rows.some((r) => {
          const changed = event.rows.find(
            (n) => n.characterId === r.characterId
          );
          return (
            !changed ||
            changed.fullAward !== r.fullAward ||
            canonical(changed.cap) !== canonical(r.cap)
          );
        })
      )
        fail('A balance review retains frozen full awards and cap bases.');
    } else {
      if (
        !livePoint ||
        livePoint.confirmedEventId !== event.id ||
        canonical({ ...livePoint, confirmedEventId: null }) !==
          canonical(event.point)
      )
        fail('Confirmed point and calculation snapshot disagree.');
      if (event.replaces !== event.point.correctionOf)
        fail('Correction must identify the replaced award.');
      for (const reward of event.rewards) {
        const source =
          event.point.rewardOverrides.find((r) => r.id === reward.id) ||
          xp.rewards.find((r) => r.id === reward.id);
        if (canonical(source) !== canonical(reward))
          fail('Accepted reward snapshot does not match its reviewed source.');
      }
    }

    const before: Record<string, number> = {};
    event.rows.forEach((r) => {
      const balance = xpBalance(
        asRecorded,
        r.characterId,
        event.point.position,
        false,
        prefix,
        xpAwardRoot(doc, event.point)
      );
      if (balance === null) fail('Unknown opening balance in confirmed award.');
      before[r.characterId] = balance;
    });
    const caps =
      event.calculatorVersion === 2
        ? new Map(
            event.rows.map((r) => {
              if (
                !r.cap ||
                r.fullAward === undefined ||
                r.discarded === undefined
              )
                fail('Missing capped award snapshot.');
              validateXpCap(r.cap);
              return [r.characterId, r.cap];
            })
          )
        : undefined;
    if (
      event.calculatorVersion === 1 &&
      event.rows.some(
        (r) =>
          r.cap !== undefined ||
          r.fullAward !== undefined ||
          r.discarded !== undefined
      )
    )
      fail('Legacy awards cannot claim cap history.');
    const expected = calculateXpRows(
      event.rewards,
      event.point.bonuses,
      before,
      caps
    );
    if (
      canonical(expected) !== canonical(event.rows) ||
      canonical(event.resolutions) !==
        canonical(event.rewards.map(resolveXpReward))
    )
      fail('Confirmed XP calculation or balance is inconsistent.');
    if (
      event.rewards.some(
        (r) =>
          compareXpTimeline(
            doc,
            r.origin,
            event.point.position,
            r.id,
            xpAwardRoot(doc, event.point)
          ) > 0
      )
    )
      fail('Invalid confirmed reward timing.');
    if (!event.correctionRoot)
      for (const reward of event.rewards) {
        const duplicates = xpEvidenceDuplicates(
          { ...doc, xp: { ...xp, rewards: [], events: prefix } },
          reward
        );
        if (
          !reward.distinctReason.trim() &&
          duplicates.some((other) => !other.distinctReason.trim())
        )
          fail(
            'Repeated reward evidence requires explicit distinct-reward review.'
          );
      }
    prefix.push(event);
    const rewardIds = activeXpEvents(prefix).flatMap((e) =>
      e.rewards.map((r) => r.id)
    );
    if (new Set(rewardIds).size !== rewardIds.length)
      fail('A reward cannot be awarded twice.');
  }
  const active = activeXpEvents(prefix);
  const positions = active.map((e) => xpAwardRoot(doc, e.point));
  if (new Set(positions).size !== positions.length)
    fail('Duplicate active award position.');
  verifyExtensionCutoffs(doc);
  verifyXpBalances(doc, active);
}
export function validateXpTransition(
  old: CampaignDocument,
  next: CampaignDocument
) {
  validateXpTimelineTransition(old, next);
  const previous = xpLedger(old),
    current = xpLedger(next);
  if (
    canonical(current.events.slice(0, previous.events.length)) !==
    canonical(previous.events)
  )
    fail('Confirmed XP history is immutable. Use a linked correction.');
  if (
    previous.events.length &&
    canonical(xpSessionOrder(old)) !==
      canonical(
        xpSessionOrder(next).filter((id) =>
          old.sessions.some((s) => s.id === id)
        )
      ) &&
    !validHistoricalSessionMove(old, next)
  )
    fail('XP session chronology is fixed after confirmation.');
  const extensions = previous.extensions ?? [];
  const updated = current.extensions ?? [];
  if (
    canonical(updated.slice(0, extensions.length)) !== canonical(extensions) ||
    updated.length > extensions.length + 1
  )
    fail('Accepted XP extension history is immutable.');
  const extension = updated[extensions.length];
  if (extension) {
    const awards = current.events.slice(previous.events.length);
    const request = {
      pointIds: awards.map((e) => e.point.id),
      openings: extension.openings.map(
        ({ replacement: { characterId, sessionId, balance } }) => ({
          characterId,
          sessionId,
          balance,
        })
      ),
    };
    const preview = previewXpExtension(old, request);
    const reconciled = confirmXpExtension(
      old,
      request,
      preview.fingerprint,
      extension.id,
      extension.confirmedAt
    );
    if (canonical(reconciled.xp) !== canonical(current))
      fail(
        'An XP extension must atomically accept exactly the reconciled drafts and openings.'
      );
    return;
  }
  for (const event of current.events.slice(previous.events.length)) {
    if (
      !event.correctionRoot &&
      (historicalXpPoint(next, event.point) ||
        event.rewards.some((reward) =>
          reservedHistoricalReward(next, event.point, reward)
        ))
    )
      fail('Historical drafts require a reconciled XP history extension.');
  }
  for (const event of current.events
    .slice(previous.events.length)
    .filter((e) => e.calculatorVersion === 2 && !e.correctionRoot)) {
    for (const row of event.rows)
      if (
        canonical(awardCapBasis(next, event.point, row.characterId)) !==
        canonical(row.cap)
      )
        fail('Award cap basis changed before confirmation.');
  }
  for (const p of previous.points.filter((p) => p.confirmedEventId))
    if (canonical(current.points.find((n) => n.id === p.id)) !== canonical(p))
      fail('Confirmed award points are immutable.');
  for (const o of previous.openings.filter(
    (o) =>
      openingUsedByExtension(previous, o.characterId) ||
      previous.events.some((e) =>
        e.rows.some((r) => r.characterId === o.characterId)
      )
  ))
    if (canonical(current.openings.find((n) => n.id === o.id)) !== canonical(o))
      fail('Opening balances used by XP history are immutable.');
  for (const r of previous.rewards.filter((r) =>
    previous.events.some((e) => e.rewards.some((n) => n.id === r.id))
  ))
    if (canonical(current.rewards.find((n) => n.id === r.id)) !== canonical(r))
      fail('Accepted reward sources are immutable. Correct the award instead.');
}

export function discardXpPoint(
  doc: CampaignDocument,
  id: string
): CampaignDocument {
  const xp = xpLedger(doc);
  if (xp.points.find((p) => p.id === id)?.confirmedEventId)
    throw new Error('Confirmed award points are immutable.');
  return withLedger(doc, {
    ...xp,
    points: xp.points.filter((p) => p.id !== id),
  });
}
