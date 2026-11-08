import { emptyProfileReference } from '../../helpers/campaignPartyModel';
import { xpCampaign, xpAt, xpTestIds } from './xpCampaign';
import { updatePartyProfile } from '../../helpers/campaignParty';
import { newXpReward } from '../../helpers/campaignXpSources';
import {
  newXpPoint,
  saveXpOpening,
  saveXpPoint,
  saveXpReward,
  selectXpRewards,
} from '../../helpers/campaignXp';
import type { CampaignDocument } from '../../helpers/campaignDocument';
export const capCharacter = xpTestIds[0] || 'xp-mira';
export { xpAt };
export function capCampaign(
  balance: number | null = 34800,
  level = 5,
  bonus = 10
) {
  let doc = xpCampaign(false);
  doc.title = 'Synthetic XP cap expedition';
  for (const p of doc.party?.profiles.filter(
    (p) => p.characterId === capCharacter
  ) || [])
    doc = updatePartyProfile(doc, {
      ...p,
      characterClass: 'fighter',
      baseLevel: level,
      reference: {
        ...(p.reference ?? emptyProfileReference()),
        bonuses: {
          ...(p.reference ?? emptyProfileReference()).bonuses,
          xpPercent: bonus,
        },
      },
    });
  doc = saveXpOpening(doc, {
    id: 'cap-opening',
    characterId: capCharacter,
    sessionId: 'session-1',
    balance,
    reason: 'Synthetic starting XP',
  });
  return doc;
}
export function capMoneyAward(
  doc: CampaignDocument,
  id: string,
  gp: string,
  sessionId = 'session-1'
) {
  const reward = newXpReward(doc, sessionId, `${id}-money`, 'money');
  reward.title = `Synthetic ${id} coins`;
  reward.input = { category: 'money', gp };
  reward.recipients = reward.recipients
    .filter((r) => r.characterId === capCharacter)
    .map((r) => ({ ...r, participated: true, eligible: true }));
  let next = saveXpReward(doc, reward);
  const point = newXpPoint(next, sessionId, id);
  point.label = `Synthetic ${id} settlement`;
  next = saveXpPoint(next, point);
  return selectXpRewards(next, id, [reward.id]);
}
