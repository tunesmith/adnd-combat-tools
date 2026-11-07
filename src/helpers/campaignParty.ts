import type { CampaignDocument } from './campaignDocument';
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

export function combatValuesForProfile(
  profile: PartyProfile
): Pick<TrackerCombatant, 'class' | 'level'> | undefined {
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
export function carriedPartyProfiles(
  doc: CampaignDocument,
  sourceId: string,
  destinationId: string,
  ids: string[]
): PartyProfile[] {
  const source = profilesInSession(doc, sourceId);
  if (
    new Set(ids).size !== ids.length ||
    ids.some((id) => !source.some((p) => p.characterId === id))
  )
    throw new Error('Selected character profiles changed.');
  return source
    .filter((p) => ids.includes(p.characterId))
    .map((p) => ({
      ...p,
      sessionId: destinationId,
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
    }));
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
  const { roster, profiles } = doc.party;
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
}
