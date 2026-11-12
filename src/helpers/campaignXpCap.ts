import type { CampaignDocument } from './campaignDocument';
import type { XpAwardRow, XpCapBasis, XpPoint } from './campaignXpModel';
import type { PartyProfile } from './campaignPartyModel';
import { nextLevelXp } from '../tables/classExperience';
import { canonical } from './campaignSnapshots';

export function latestXpProfile(
  doc: CampaignDocument,
  characterId: string,
  sessionId: string
): PartyProfile | undefined {
  const position = doc.sessions.findIndex((s) => s.id === sessionId);
  for (const session of doc.sessions.slice(0, position + 1).reverse()) {
    const profile = doc.party?.profiles.find(
      (p) => p.characterId === characterId && p.sessionId === session.id
    );
    if (profile) return profile;
  }
  return undefined;
}

export function profileXpCap(
  profile: Pick<PartyProfile, 'characterClass' | 'baseLevel'> | undefined
): XpCapBasis | null {
  if (!profile) return null;
  const limit = nextLevelXp(profile.characterClass, profile.baseLevel);
  return limit === null
    ? null
    : {
        characterClass: profile.characterClass,
        baseLevel: profile.baseLevel,
        mode: 'standard',
        limit,
        reason: '',
      };
}
export function validateXpCap(basis: XpCapBasis) {
  if (basis.mode === 'standard') {
    if (
      basis.characterClass === null ||
      basis.baseLevel === null ||
      basis.limit === null ||
      nextLevelXp(basis.characterClass, basis.baseLevel) !== basis.limit
    )
      throw Error('Invalid PHB XP cap basis.');
  } else if (
    !basis.reason.trim() ||
    (basis.mode === 'override' ? basis.limit === null : basis.limit !== null)
  )
    throw Error(
      'An explicit cap decision needs a value (or uncapped) and a reason.'
    );
}
export function awardCapBasis(
  doc: CampaignDocument,
  point: XpPoint,
  characterId: string
): XpCapBasis {
  const explicit = point.caps?.find(
    (c) => c.characterId === characterId
  )?.basis;
  const target = point.correctionOf
    ? doc.xp?.events.find((e) => e.id === point.correctionOf)
    : undefined;
  const recorded = target?.rows.find((r) => r.characterId === characterId)?.cap;
  const profile = latestXpProfile(doc, characterId, point.position.sessionId);
  const proposed = profileXpCap(profile);
  if (explicit) {
    validateXpCap(explicit);
    if (
      target &&
      canonical(explicit) !== canonical(recorded) &&
      !explicit.reason.trim()
    )
      throw Error(
        'Add a reason for the historical trained-level/cap decision.'
      );
    if (
      !target &&
      profile &&
      explicit.mode === 'standard' &&
      canonical({ ...explicit, reason: '' }) !== canonical(proposed)
    )
      throw Error(
        'Use the current trained profile or an explicit cap exception.'
      );
    if (!profile && !target && !explicit.reason.trim())
      throw Error(
        'Explain the reviewed trained-level/cap basis for this absent recipient.'
      );
    // A pending exception controls the limit, not the character's trained identity.
    // Historical corrections instead retain their deliberately reviewed basis.
    return target || !profile || explicit.mode === 'standard'
      ? explicit
      : {
          ...explicit,
          characterClass: profile?.characterClass ?? null,
          baseLevel: profile?.baseLevel ?? null,
        };
  }
  if (recorded) {
    validateXpCap(recorded);
    return recorded;
  }
  if (target)
    throw Error(
      'Review the historical trained level and XP cap before confirming these changes.'
    );
  if (proposed) return proposed;
  throw Error(
    'XP cap is unknown: review an explicit cap or uncapped exception.'
  );
}
export function cappedXp(fullAward: number, before: number, cap: XpCapBasis) {
  validateXpCap(cap);
  const award =
    cap.mode === 'uncapped'
      ? fullAward
      : Math.min(fullAward, Math.max(0, (cap.limit ?? 0) - before));
  if (!Number.isSafeInteger(before + award))
    throw Error('XP balance exceeds the supported integer range.');
  return { award, discarded: fullAward - award, after: before + award };
}
export function rebaseXpRow(row: XpAwardRow, before: number): XpAwardRow {
  if (row.cap && row.fullAward !== undefined)
    return { ...row, ...cappedXp(row.fullAward, before, row.cap), before };
  if (!Number.isSafeInteger(before + row.award))
    throw Error('A later balance cannot be rebased.');
  return { ...row, before, after: before + row.award };
}
