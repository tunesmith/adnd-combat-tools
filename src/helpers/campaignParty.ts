import type { CampaignDocument } from './campaignDocument';
import type { WorkingCombat } from './campaignWorkingCombat';
import type {
  TrackerRound,
  TrackerState,
  TrackerCombatant,
} from '../types/tracker';
import type {
  CampaignParty,
  PartyProfile,
  CombatLink,
  InventoryLink,
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
export const effectiveLevel = (profile: PartyProfile) =>
  profile.baseLevel + (profile.adjustment?.enabled ? 1 : 0);
export function calculatedSaves(profile: PartyProfile): SaveTargets | null {
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

export function projectedTrackerLevel(
  profile: PartyProfile,
  actor: TrackerCombatant
): number | null {
  const combatClass = combatClasses[profile.characterClass];
  // Keep the reviewed tracker class and its existing weapon and armor choices.
  if (profile.combatBasis === 'manual' || combatClass !== actor.class)
    return null;
  const level =
    combatClass === BARD ? profile.retainedFighter : effectiveLevel(profile);
  const options = getLevelOptionsByCombatClass(getGeneralClass(combatClass));
  const first = options[0],
    last = options[options.length - 1];
  if (level === null || !first || !last || level < first.value) return null;
  // Non-monster options encode actual levels, with the terminal band representing N+.
  if (combatClass === BARD && (level < 5 || level > 7)) return null;
  return Math.min(level, last.value);
}

const emptyParty = (): CampaignParty => ({
  roster: [],
  profiles: [],
  inventoryLinks: [],
  combatLinks: [],
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
export const profilesInSession = (doc: CampaignDocument, sessionId: string) =>
  doc.party?.profiles.filter((p) => p.sessionId === sessionId) || [];
export function updatePartyProfile(
  doc: CampaignDocument,
  profile: PartyProfile,
  character?: RosterCharacter
): CampaignDocument {
  const party = doc.party || emptyParty();
  const matches = (p: PartyProfile) =>
    p.sessionId === profile.sessionId && p.characterId === profile.characterId;
  const roster = !character
    ? party.roster
    : party.roster.some((c) => c.id === character.id)
    ? party.roster.map((c) => (c.id === character.id ? character : c))
    : [...party.roster, character];
  const profiles = party.profiles.some(matches)
    ? party.profiles.map((p) => (matches(p) ? profile : p))
    : [...party.profiles, profile];
  return { ...doc, party: { ...party, roster, profiles } };
}
export const sameInventorySlot = (a: InventoryLink, b: InventoryLink) =>
  a.inventoryId === b.inventoryId &&
  a.inventoryCharacterId === b.inventoryCharacterId;
export const sameCombatSlot = (a: CombatLink, b: CombatLink) =>
  a.combatId === b.combatId && a.side === b.side && a.key === b.key;
function combatLinksFor(doc: CampaignDocument, combat: WorkingCombat) {
  return (
    doc.party?.combatLinks.filter(
      (l) => l.combatId === combat.id && l.generation === combat.generation
    ) || []
  );
}
export function linkedCombatValues(
  doc: CampaignDocument,
  combat: WorkingCombat,
  round: TrackerRound | undefined
) {
  if (!round) return [];
  return combatLinksFor(doc, combat).flatMap((link) => {
    const actors = link.side === 'party' ? round.party : round.enemies;
    const actor = actors.find((c) => c.key === link.key);
    const profile = doc.party?.profiles.find(
      (p) =>
        p.sessionId === combat.sessionId && p.characterId === link.characterId
    );
    if (!actor || !profile) return [];
    return [
      {
        ...link,
        actor,
        level: projectedTrackerLevel(profile, actor),
        name:
          doc.party?.roster.find((c) => c.id === link.characterId)?.name ||
          actor.name ||
          'Character',
      },
    ];
  });
}
export function projectCombatRound(
  doc: CampaignDocument,
  combat: WorkingCombat,
  state: TrackerState,
  index: number
): TrackerState {
  const round = state.rounds[index];
  const changes = linkedCombatValues(doc, combat, round).filter(
    (c) => c.level !== null && c.level !== c.actor.level
  );
  if (!round || !changes.length) return state;
  const project = (actors: TrackerCombatant[], side: CombatLink['side']) =>
    actors.map((actor) => {
      const level = changes.find(
        (c) => c.side === side && c.key === actor.key
      )?.level;
      return level == null ? actor : { ...actor, level };
    });
  return {
    ...state,
    rounds: state.rounds.map((r, i) =>
      i === index
        ? {
            ...r,
            party: project(r.party, 'party'),
            enemies: project(r.enemies, 'enemy'),
          }
        : r
    ),
  };
}

export function partyInSession(doc: CampaignDocument, sessionId: string) {
  return {
    profiles: profilesInSession(doc, sessionId),
    inventoryLinks:
      doc.party?.inventoryLinks.filter((l) => l.sessionId === sessionId) || [],
    combatLinks:
      doc.party?.combatLinks.filter((l) => l.sessionId === sessionId) || [],
  };
}
export function carriedParty(
  old: CampaignDocument,
  next: CampaignDocument,
  sourceId: string,
  destinationId: string,
  ids: string[]
) {
  const source = partyInSession(old, sourceId);
  if (
    new Set(ids).size !== ids.length ||
    ids.some((id) => !source.profiles.some((p) => p.characterId === id))
  )
    throw new Error('Selected character profiles changed.');
  const profiles = source.profiles
    .filter((p) => ids.includes(p.characterId))
    .map(
      (p): PartyProfile => ({
        ...p,
        sessionId: destinationId,
        adjustment: p.adjustment ? { ...p.adjustment } : null,
        overrides: [...p.overrides],
        saveNotes: [...p.saveNotes],
      })
    );
  const inventory = next.workingInventories.find(
    (w) => w.sessionId === destinationId
  );
  const inventoryLinks = inventory?.continuedFrom
    ? source.inventoryLinks
        .filter(
          (l) =>
            l.inventoryId === inventory.continuedFrom?.instanceId &&
            ids.includes(l.characterId)
        )
        .map((l) => ({
          ...l,
          sessionId: destinationId,
          inventoryId: inventory.id,
        }))
    : [];
  const combatLinks = next.workingCombats
    .filter((c) => c.sessionId === destinationId)
    .flatMap((c) => {
      const prior = old.workingCombats.find(
        (w) => w.id === c.continuedFrom?.instanceId
      );
      if (!prior) return [];
      return combatLinksFor(old, prior)
        .filter((l) => ids.includes(l.characterId))
        .map((l) => ({
          ...l,
          sessionId: destinationId,
          combatId: c.id,
          generation: c.generation,
        }));
    });
  return { profiles, inventoryLinks, combatLinks };
}
export function validatePartyReferences(
  doc: CampaignDocument,
  unique: (id: string) => void
) {
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
  const { roster, profiles, inventoryLinks, combatLinks } = doc.party;
  roster.forEach((c) => unique(c.id));
  const profileKeys = new Set<string>();
  for (const p of profiles) {
    const key = canonical([p.sessionId, p.characterId]);
    if (
      profileKeys.has(key) ||
      !roster.some((c) => c.id === p.characterId) ||
      !doc.sessions.some((s) => s.id === p.sessionId)
    )
      throw new Error('Invalid party profile reference.');
    profileKeys.add(key);
  }
  if (
    carriedProfiles.some(
      (p) => !profileKeys.has(canonical([p.sessionId, p.characterId]))
    )
  )
    throw new Error('Missing carried party profile.');
  const slots = new Set<string>();
  for (const l of inventoryLinks) {
    const key = canonical([l.inventoryId, l.inventoryCharacterId]);
    const snapshots = [
      ...doc.workingInventories.filter(
        (w) => w.id === l.inventoryId && w.sessionId === l.sessionId
      ),
      ...doc.inventoryCheckpoints.filter(
        (w) => w.workingId === l.inventoryId && w.sessionId === l.sessionId
      ),
    ];
    if (
      slots.has(key) ||
      !profileKeys.has(canonical([l.sessionId, l.characterId])) ||
      !snapshots.some((w) =>
        w.document.characters.some((c) => c.id === l.inventoryCharacterId)
      )
    )
      throw new Error('Invalid inventory character link.');
    slots.add(key);
  }
  for (const l of combatLinks) {
    const key = canonical([l.combatId, l.side, l.key]);
    const combat = doc.workingCombats.find(
      (c) => c.id === l.combatId && c.sessionId === l.sessionId
    );
    if (
      slots.has(key) ||
      !combat ||
      l.generation > combat.generation ||
      !profileKeys.has(canonical([l.sessionId, l.characterId]))
    )
      throw new Error('Invalid combat character link.');
    slots.add(key);
  }
}

export function setInventoryCharacterLink(
  doc: CampaignDocument,
  link: InventoryLink,
  enabled: boolean
): CampaignDocument {
  const party = doc.party;
  if (!party) throw new Error('Add a party profile first.');
  const existing = party.inventoryLinks.find((l) => sameInventorySlot(l, link));
  if (!enabled && existing?.characterId !== link.characterId) return doc;
  const inventory = doc.workingInventories.find(
    (w) => w.id === link.inventoryId && w.sessionId === link.sessionId
  );
  if (
    enabled &&
    !inventory?.document.characters.some(
      (c) => c.id === link.inventoryCharacterId
    )
  )
    throw new Error('That inventory character changed.');
  return {
    ...doc,
    party: {
      ...party,
      inventoryLinks: [
        ...party.inventoryLinks.filter((l) => !sameInventorySlot(l, link)),
        ...(enabled ? [link] : []),
      ],
    },
  };
}
export function setCombatCharacterLink(
  doc: CampaignDocument,
  link: CombatLink,
  enabled: boolean
): CampaignDocument {
  const party = doc.party,
    combat = doc.workingCombats.find(
      (c) =>
        c.id === link.combatId && c.sessionId === link.sessionId && !c.removedAt
    );
  if (!party || !combat || combat.generation !== link.generation)
    throw new Error('That encounter changed.');
  const existing = party.combatLinks.find(
    (l) => l.generation === link.generation && sameCombatSlot(l, link)
  );
  if (!enabled && existing?.characterId !== link.characterId) return doc;
  const round = combat.state.rounds[combat.state.rounds.length - 1];
  const actors = link.side === 'party' ? round?.party : round?.enemies;
  if (enabled && !actors?.some((c) => c.key === link.key))
    throw new Error('That combatant changed.');
  return {
    ...doc,
    party: {
      ...party,
      combatLinks: [
        ...party.combatLinks.filter((l) => !sameCombatSlot(l, link)),
        ...(enabled ? [link] : []),
      ],
    },
  };
}
