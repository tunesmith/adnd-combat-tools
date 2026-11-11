import {
  capCampaign,
  capCharacter,
  capMoneyAward,
  xpAt,
} from './xpCapCampaign';
import { emptyProfileReference } from '../../helpers/campaignPartyModel';
import {
  updatePartyProfile,
  copyPartyProfile,
} from '../../helpers/campaignParty';
import {
  saveXpOpening,
  previewXpAward,
  confirmXpAward,
} from '../../helpers/campaignXp';
import type { CampaignDocument } from '../../helpers/campaignDocument';
export {
  capCharacter as multiCharacter,
  capMoneyAward as multiMoneyAward,
  xpAt,
};
export function multiclassCampaign(
  fighter: number | null = 0,
  thief: number | null = 0
): CampaignDocument {
  let doc = capCampaign(0, 1, 10);
  doc.title = 'Synthetic multiclass expedition';
  const p = doc.party?.profiles.find(
    (p) => p.characterId === capCharacter && p.sessionId === 'session-1'
  );
  if (!p) throw Error('Fixture profile');
  const reference = emptyProfileReference();
  reference.race = 'Dwarf';
  reference.gender = 'Male';
  reference.alignment = 'True Neutral';
  reference.maxHp = 6;
  reference.attributes = {
    strength: { score: 16, exceptional: null },
    intelligence: 9,
    wisdom: 11,
    dexterity: 16,
    constitution: 13,
    charisma: 6,
  };
  reference.bonuses = {
    meleeHit: 0,
    meleeDamage: 1,
    missileHit: 1,
    reactionPercent: -10,
    xpPercent: null,
  };
  const profile = {
    ...p,
    reference,
    classes: [
      {
        id: 'multi-fighter',
        characterClass: 'fighter' as const,
        baseLevel: 1,
        xpPercent: 10,
      },
      {
        id: 'multi-thief',
        characterClass: 'thief' as const,
        baseLevel: 1,
        xpPercent: 10,
      },
    ],
    combatClassId: 'multi-fighter',
  };
  doc = updatePartyProfile(doc, profile, {
    id: capCharacter,
    name: 'Kramrak Smugward',
    player: 'Kira',
    notes: 'Synthetic validation of user-specified profile',
  });
  doc = updatePartyProfile(doc, copyPartyProfile(profile, 'session-2'));
  return saveXpOpening(doc, {
    id: 'cap-opening',
    characterId: capCharacter,
    sessionId: 'session-1',
    balance: fighter === null || thief === null ? null : fighter + thief,
    classes: [
      { classId: 'multi-fighter', characterClass: 'fighter', balance: fighter },
      { classId: 'multi-thief', characterClass: 'thief', balance: thief },
    ],
    reason: 'Explicit synthetic class openings',
  });
}
export const acceptMulti = (
  doc: CampaignDocument,
  id: string,
  event = `event-${id}`,
  review = false
) =>
  confirmXpAward(
    doc,
    id,
    previewXpAward(doc, id).fingerprint,
    event,
    xpAt,
    review
  );
