import type { CampaignDocument } from './campaignDocument';
import type { XpReward } from './campaignXpModel';
import type { TrackerCombatant } from '../types/tracker';
import type {
  CampaignParty,
  PartyProfile,
  RosterCharacter,
} from './campaignPartyModel';
import { baseSavingThrows } from '../tables/savingThrows';
import type { SaveBasis, SaveTargets } from '../tables/savingThrows';
import {
  getGeneralClass,
  CLERIC,
  DRUID,
  FIGHTER,
  RANGER,
  PALADIN,
  MAGIC_USER,
  ILLUSIONIST,
  THIEF,
  ASSASSIN,
  BARD,
} from '../tables/attackerClass';
import { getLevelOptionsByCombatClass } from '../tables/combatLevel';
import { canonical } from './campaignSnapshots';

const printedBasis: Partial<Record<PartyProfile['characterClass'], SaveBasis>> =
  {
    cleric: 'cleric',
    druid: 'cleric',
    fighter: 'fighter',
    ranger: 'fighter',
    paladin: 'fighter',
    'magic-user': 'magic-user',
    illusionist: 'magic-user',
    thief: 'thief',
    assassin: 'thief',
    monk: 'thief',
  };
const combatClasses: Partial<Record<PartyProfile['characterClass'], number>> = {
  cleric: CLERIC,
  druid: DRUID,
  fighter: FIGHTER,
  ranger: RANGER,
  paladin: PALADIN,
  'magic-user': MAGIC_USER,
  illusionist: ILLUSIONIST,
  thief: THIEF,
  assassin: ASSASSIN,
  bard: BARD,
};
export const profileClassLabel = (value: string) =>
  value === 'manual'
    ? 'Manual / creature'
    : value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ');
export const profileLabel = (p: PartyProfile) =>
  p.classes
    ?.map(
      (c) =>
        `${profileClassLabel(c.characterClass)} ${c.baseLevel}${
          p.adjustment?.enabled && p.adjustment.classId === c.id
            ? ' → ' + (c.baseLevel + 1)
            : ''
        }`
    )
    .join(' / ') ??
  `${profileClassLabel(p.characterClass)} ${p.baseLevel}${
    effectiveLevel(p) !== p.baseLevel ? ' → ' + effectiveLevel(p) : ''
  }`;
export function classProfile(
  p: PartyProfile,
  c: NonNullable<PartyProfile['classes']>[number]
): PartyProfile {
  return {
    ...p,
    classes: undefined,
    characterClass: c.characterClass,
    baseLevel: c.baseLevel,
    adjustment: p.adjustment?.classId === c.id ? p.adjustment : null,
  };
}
export function encounterLevel(p: PartyProfile): string | null {
  return !p.classes ||
    p.classes.every((c) => c.baseLevel === p.classes?.[0]?.baseLevel)
    ? String(p.classes?.[0]?.baseLevel ?? p.baseLevel)
    : null;
}
export const effectiveLevel = (profile: PartyProfile) =>
  profile.baseLevel + (profile.adjustment?.enabled ? 1 : 0);
export function calculatedSaves(profile: PartyProfile): SaveTargets | null {
  if (profile.classes && profile.saveBasis !== 'manual') {
    const targets = profile.classes.map((c) =>
      calculatedSaves({ ...classProfile(profile, c), saveBasis: 'printed' })
    );
    if (targets.some((t) => !t)) return null;
    const best = (i: 0 | 1 | 2 | 3 | 4) =>
      Math.min(...targets.map((t) => t?.[i] ?? 99));
    return [best(0), best(1), best(2), best(3), best(4)];
  }
  const level = effectiveLevel(profile);
  if (profile.saveBasis === 'manual') return null;
  if (profile.saveBasis !== 'printed')
    return baseSavingThrows(profile.saveBasis, level);
  if (profile.characterClass === 'bard') {
    const druid = baseSavingThrows('cleric', level);
    const fighter =
      profile.retainedFighter &&
      baseSavingThrows('fighter', profile.retainedFighter);
    const thief =
      profile.retainedThief && baseSavingThrows('thief', profile.retainedThief);
    if (!druid || !fighter || !thief) return null;
    const best = (index: 0 | 1 | 2 | 3 | 4) =>
      Math.min(druid[index], fighter[index], thief[index]);
    return [best(0), best(1), best(2), best(3), best(4)];
  }
  const basis = printedBasis[profile.characterClass];
  return basis ? baseSavingThrows(basis, level) : null;
}

export function combatValuesForProfile(
  profile: PartyProfile
): Pick<TrackerCombatant, 'class' | 'level'> | undefined {
  if (profile.classes) {
    const chosen =
      profile.classes.find((c) => c.id === profile.combatClassId) ??
      profile.classes[0];
    return chosen
      ? combatValuesForProfile(classProfile(profile, chosen))
      : undefined;
  }
  const combatClass = combatClasses[profile.characterClass];
  if (profile.combatBasis === 'manual' || combatClass === undefined) return;
  const level =
    combatClass === BARD ? profile.retainedFighter : effectiveLevel(profile);
  const options = getLevelOptionsByCombatClass(getGeneralClass(combatClass));
  const first = options[0],
    last = options[options.length - 1];
  if (level === null || !first || !last || level < first.value) return;
  // Non-monster options encode actual levels, with the terminal band representing N+.
  if (combatClass === BARD && (level < 5 || level > 7)) return;
  return { class: combatClass, level: Math.min(level, last.value) };
}

const emptyParty = (): CampaignParty => ({
  roster: [],
  profiles: [],
});
export const emptyProfile = (
  sessionId: string,
  characterId: string
): PartyProfile => ({
  sessionId,
  characterId,
  characterClass: 'manual',
  baseLevel: 1,
  saveBasis: 'printed',
  combatBasis: 'class',
  retainedFighter: null,
  retainedThief: null,
  adjustment: null,
  participating: true,
  overrides: [null, null, null, null, null],
  saveNotes: ['', '', ''],
});
/** Freeze each legacy session's roster-based display before any ordering edit. */
export function stabilizePartyOrders(doc: CampaignDocument): CampaignDocument {
  if (!doc.party) return doc;
  return {
    ...doc,
    sessions: doc.sessions.map((s) =>
      s.partyOrder
        ? s
        : {
            ...s,
            partyOrder: doc.party?.roster.map((c) => c.id) ?? [],
          }
    ),
  };
}
export function inPartyOrder<T>(
  doc: Pick<CampaignDocument, 'party'> &
    Partial<Pick<CampaignDocument, 'sessions' | 'workspace'>>,
  items: readonly T[],
  characterId: (item: T) => string,
  sessionId = doc.workspace?.sessionId
): T[] {
  const order = doc.sessions?.find((s) => s.id === sessionId)?.partyOrder;
  const ranks = new Map(
    (order ?? doc.party?.roster.map((c) => c.id) ?? []).map((id, i) => [id, i])
  );
  return [...items].sort(
    (a, b) =>
      (ranks.get(characterId(a)) ?? ranks.size) -
      (ranks.get(characterId(b)) ?? ranks.size)
  );
}
export const profilesInSession = (doc: CampaignDocument, sessionId: string) =>
  inPartyOrder(
    doc,
    doc.party?.profiles.filter(
      (p) => p.sessionId === sessionId && p.participating
    ) ?? [],
    (p) => p.characterId,
    sessionId
  );

export function reorderPartyCharacter(
  doc: CampaignDocument,
  sessionId: string,
  fromId: string,
  targetId: string
): CampaignDocument {
  if (fromId === targetId) return doc;
  const stable = stabilizePartyOrders(doc);
  const session = stable.sessions.find((s) => s.id === sessionId);
  const order = [...(session?.partyOrder ?? [])];
  // Inventory-only roster matches may not have a participating profile.
  for (const id of [fromId, targetId]) {
    if (!doc.party?.roster.some((c) => c.id === id))
      throw Error('Session characters changed; try dragging again.');
    if (!order.includes(id)) order.push(id);
  }
  if (!session) throw Error('Session changed; try dragging again.');
  const target = order.indexOf(targetId);
  order.splice(order.indexOf(fromId), 1);
  order.splice(target, 0, fromId);
  return {
    ...stable,
    sessions: stable.sessions.map((s) =>
      s.id === sessionId ? { ...s, partyOrder: order } : s
    ),
  };
}

export function rosterEligibleForSession(
  doc: CampaignDocument,
  character: RosterCharacter,
  sessionId: string | null
) {
  if (!character.lastEligibleSessionId) return true;
  const cutoff = doc.sessions.findIndex(
    (s) => s.id === character.lastEligibleSessionId
  );
  return (
    sessionId !== null &&
    cutoff >= 0 &&
    doc.sessions.some((s, index) => s.id === sessionId && index <= cutoff)
  );
}

// Retirement closes outstanding shares after the last eligible session. Absence
// alone does not: a temporarily missing character can still receive earned XP.
export function xpRecipientRetired(
  doc: CampaignDocument,
  characterId: string,
  sessionId: string
) {
  const character = doc.party?.roster.find((c) => c.id === characterId);
  return !!character && !rosterEligibleForSession(doc, character, sessionId);
}

export function priorProfileChoices(
  doc: CampaignDocument,
  sessionId: string,
  characterId: string
) {
  const profiles =
    doc.party?.profiles.filter((p) => p.characterId === characterId) ?? [];
  const position = doc.sessions.findIndex((s) => s.id === sessionId);
  const retained = profiles.find(
    (p) => p.sessionId === sessionId && !p.participating
  );
  const earlier = doc.sessions
    .slice(0, Math.max(0, position))
    .reverse()
    .map((s) => profiles.find((p) => p.sessionId === s.id))
    .find((p) => p !== undefined);
  return [retained, earlier].filter((p): p is PartyProfile => p !== undefined);
}

export function xpRecipientAvailable(
  doc: CampaignDocument,
  sessionId: string,
  characterId: string
) {
  const character = doc.party?.roster.find((c) => c.id === characterId);
  return (
    !!character &&
    character.earnsXp !== false &&
    !doc.party?.profiles.some(
      (p) =>
        p.characterId === characterId &&
        p.sessionId === sessionId &&
        !p.participating
    )
  );
}

function recipientResets(xp: CampaignDocument['xp'], rewardId: string) {
  const resets = xp?.pendingRecipientResets;
  return resets && Object.prototype.hasOwnProperty.call(resets, rewardId)
    ? resets[rewardId]
    : undefined;
}

function pendingXpRewards(
  doc: CampaignDocument,
  characterId: string,
  sessionId?: string
) {
  const xp = doc.xp;
  if (!xp) return [];
  const replaced = new Set(xp.events.map((e) => e.replaces));
  return xp.rewards.filter(
    (r) =>
      !xp.events.some(
        (e) =>
          !replaced.has(e.id) &&
          e.rewards.some((reward) => reward.id === r.id) &&
          (!e.point.settlements ||
            e.point.settlements.some(
              (s) =>
                s.rewardId === r.id &&
                s.characterId === characterId &&
                s.decision !== 'later'
            ))
      ) &&
      (sessionId === undefined || r.origin.sessionId === sessionId) &&
      !recipientResets(xp, r.id)?.includes(characterId) &&
      !xpRecipientRetired(
        doc,
        characterId,
        sessionId ?? doc.workspace.sessionId ?? r.origin.sessionId
      ) &&
      r.recipients.some(
        (c) => c.characterId === characterId && (c.eligible || c.participated)
      )
  );
}

export const pendingXpRecipientCount = (
  doc: CampaignDocument,
  characterId: string,
  sessionId?: string
) => pendingXpRewards(doc, characterId, sessionId).length;

function clearRecipientFlags(
  reward: XpReward,
  shouldClear: (id: string) => boolean
) {
  let changed = false;
  const recipients = reward.recipients.map((r) => {
    if ((!r.eligible && !r.participated) || !shouldClear(r.characterId))
      return r;
    changed = true;
    return { ...r, eligible: false, participated: false };
  });
  return changed ? { ...reward, recipients } : reward;
}

export function pendingXpReward(
  doc: CampaignDocument,
  reward: XpReward,
  explicitOverride = false
) {
  const resets = explicitOverride
    ? undefined
    : recipientResets(doc.xp, reward.id);
  return clearRecipientFlags(reward, (id) => !!resets?.includes(id));
}

export function removePartyProfile(
  doc: CampaignDocument,
  sessionId: string,
  characterId: string
) {
  const profile = profilesInSession(doc, sessionId).find(
    (p) => p.characterId === characterId
  );
  if (!profile) throw new Error('This character is no longer in the session.');
  return updatePartyProfile(doc, { ...profile, participating: false });
}

export function updatePartyProfile(
  doc: CampaignDocument,
  profile: PartyProfile,
  character?: RosterCharacter
): CampaignDocument {
  doc = stabilizePartyOrders(doc);
  const party = doc.party || emptyParty();
  const matches = (p: PartyProfile) =>
    p.sessionId === profile.sessionId && p.characterId === profile.characterId;
  const previous = party.profiles.find(matches);
  const known = party.roster.find((c) => c.id === profile.characterId);
  if (
    previous?.classes &&
    doc.xp?.events.some((e) =>
      e.rows.some((r) => r.characterId === profile.characterId && r.classes)
    ) &&
    previous.classes.some(
      (c) =>
        !profile.classes?.some(
          (v) => v.id === c.id && v.characterClass === c.characterClass
        )
    )
  )
    throw Error(
      'Retain class identities used by confirmed XP. Change trained levels independently.'
    );
  if (
    profile.participating &&
    !previous?.participating &&
    known &&
    !rosterEligibleForSession(doc, known, profile.sessionId)
  )
    throw new Error('This character is retired for the selected session.');
  const roster = !character
    ? party.roster
    : party.roster.some((c) => c.id === character.id)
    ? party.roster.map((c) => (c.id === character.id ? character : c))
    : [...party.roster, character];
  const profiles = party.profiles.some(matches)
    ? party.profiles.map((p) => (matches(p) ? profile : p))
    : [...party.profiles, profile];
  const next = {
    ...doc,
    party: { ...party, roster, profiles },
    sessions: doc.sessions.map((s) =>
      s.id !== profile.sessionId
        ? s
        : {
            ...s,
            partyOrder: profile.participating
              ? previous?.participating
                ? s.partyOrder
                : [
                    ...(s.partyOrder ?? []).filter(
                      (id) => id !== profile.characterId
                    ),
                    profile.characterId,
                  ]
              : (s.partyOrder ?? []).filter((id) => id !== profile.characterId),
          }
    ),
  };
  // Roster/profile changes preserve earned XP participation and shares.
  return next;
}
export function carriedPartyProfiles(
  doc: CampaignDocument,
  sourceId: string,
  destinationId: string,
  ids: string[]
): PartyProfile[] {
  const source = carryablePartyProfiles(doc, sourceId, destinationId);
  if (
    new Set(ids).size !== ids.length ||
    ids.some((id) => !source.some((p) => p.characterId === id))
  )
    throw new Error('Selected character profiles changed.');
  return source
    .filter((p) => ids.includes(p.characterId))
    .map((p) => copyPartyProfile(p, destinationId));
}

export function carryablePartyProfiles(
  doc: CampaignDocument,
  sourceId: string,
  destinationId: string | null = null
) {
  const destination = doc.sessions.some((s) => s.id === destinationId)
    ? destinationId
    : null;
  return profilesInSession(doc, sourceId).filter((p) => {
    const character = doc.party?.roster.find((c) => c.id === p.characterId);
    return !!character && rosterEligibleForSession(doc, character, destination);
  });
}

export const eligibleSessionProfiles = (
  doc: CampaignDocument,
  sessionId: string
) => carryablePartyProfiles(doc, sessionId, sessionId);

export function copyPartyProfile(
  p: PartyProfile,
  sessionId: string
): PartyProfile {
  return {
    ...p,
    sessionId,
    participating: true,
    ...(p.classes ? { classes: p.classes.map((c) => ({ ...c })) } : {}),
    adjustment: p.adjustment ? { ...p.adjustment } : null,
    overrides: [...p.overrides],
    saveNotes: [...p.saveNotes],
    ...(p.reference
      ? {
          reference: {
            ...p.reference,
            attributes: {
              ...p.reference.attributes,
              strength: { ...p.reference.attributes.strength },
            },
            bonuses: { ...p.reference.bonuses },
          },
        }
      : {}),
  };
}

export function validatePartyReferences(
  doc: CampaignDocument,
  unique: (id: string) => void
) {
  for (const session of doc.sessions) {
    const order = session.partyOrder ?? [];
    if (
      new Set(order).size !== order.length ||
      order.some((id) => !doc.party?.roster.some((c) => c.id === id))
    )
      throw Error('Invalid session party order.');
  }
  const carriedProfiles = doc.sessions.flatMap((s) =>
    (s.continuation?.partyCharacterIds || []).map((characterId) => ({
      sessionId: s.id,
      characterId,
    }))
  );
  if (!doc.party) {
    if (carriedProfiles.length)
      throw new Error('Missing carried party profiles.');
    return;
  }
  const { roster, profiles } = doc.party;
  roster.forEach((c) => {
    unique(c.id);
    if (
      c.lastEligibleSessionId &&
      !doc.sessions.some((s) => s.id === c.lastEligibleSessionId)
    )
      throw new Error('Invalid last eligible session for roster character.');
  });
  const profileKeys = new Set<string>();
  for (const p of profiles) {
    const key = canonical([p.sessionId, p.characterId]);
    if (
      profileKeys.has(key) ||
      !roster.some((c) => c.id === p.characterId) ||
      !doc.sessions.some((s) => s.id === p.sessionId)
    )
      throw new Error('Invalid party profile reference.');
    if (p.classes) {
      if (
        p.characterClass !== p.classes[0]?.characterClass ||
        p.baseLevel !== p.classes[0]?.baseLevel
      )
        throw Error(
          'The primary profile class must match its first class entry.'
        );
      if (
        new Set(p.classes.map((c) => c.id)).size !== p.classes.length ||
        new Set(p.classes.map((c) => c.characterClass)).size !==
          p.classes.length ||
        p.classes.some(
          (c) => c.characterClass === 'manual' || c.characterClass === 'bard'
        )
      )
        throw Error(
          'Choose distinct calculated classes for a multiclass profile.'
        );
      if (!p.classes.some((c) => c.id === p.combatClassId))
        throw Error('Choose a combat basis from this profile’s classes.');
      if (
        p.adjustment &&
        !p.classes.some((c) => c.id === p.adjustment?.classId)
      )
        throw Error('Choose the class affected by the temporary level effect.');
      for (const c of p.classes)
        if (
          profiles.some(
            (other) =>
              other.characterId === p.characterId &&
              other.classes?.some(
                (v) => v.id === c.id && v.characterClass !== c.characterClass
              )
          )
        )
          throw Error(
            'A class identity cannot change its class across sessions.'
          );
    }
    profileKeys.add(key);
  }
  if (
    carriedProfiles.some(
      (p) => !profileKeys.has(canonical([p.sessionId, p.characterId]))
    )
  )
    throw new Error('Missing carried party profile.');
}
