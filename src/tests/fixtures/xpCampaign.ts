import baseline from './campaignSnapshots.json';
import { parseCampaign } from '../../helpers/campaignDocument';
import { emptyProfile, updatePartyProfile } from '../../helpers/campaignParty';
import { emptyProfileReference } from '../../helpers/campaignPartyModel';
import { newXpReward } from '../../helpers/campaignXpSources';
import {
  newXpPoint,
  saveXpOpening,
  saveXpPoint,
  saveXpReward,
  selectXpRewards,
} from '../../helpers/campaignXp';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import type { XpReward } from '../../helpers/campaignXpModel';
const xpTestNames = ['Mira', 'Tal', 'Oren', 'Nera', 'Bram'];
export const xpTestIds = xpTestNames.map((name) => `xp-${name.toLowerCase()}`);
export const xpAt = '2026-11-07T12:00:00.000Z';
export function xpCampaign(openings = true): CampaignDocument {
  let doc = parseCampaign(JSON.stringify(baseline));
  doc.title = 'Synthetic XP expedition';
  doc.sessions = [
    { id: 'session-1', label: 'First expedition', notes: '' },
    { id: 'session-2', label: 'Return and descent', notes: '' },
  ];
  doc.workspace = { sessionId: 'session-2', view: 'xp', combatSelections: {} };
  for (const sessionId of ['session-1', 'session-2'])
    xpTestNames.forEach((name, i) => {
      const id = xpTestIds[i];
      if (!id) throw new Error('Missing synthetic identity');
      doc = updatePartyProfile(
        doc,
        {
          ...emptyProfile(sessionId, id),
          characterClass: 'fighter',
          reference: {
            ...emptyProfileReference(),
            bonuses: {
              ...emptyProfileReference().bonuses,
              xpPercent: i === 3 ? 0 : 10,
            },
          },
        },
        { id, name, player: '', notes: 'Invented fixture' }
      );
    });
  if (openings)
    for (const id of xpTestIds)
      doc = saveXpOpening(doc, {
        id: `opening-${id}`,
        characterId: id,
        sessionId: 'session-1',
        balance: 0,
        reason: 'Explicitly confirmed synthetic starting balance',
      });
  return doc;
}
export function xpTestReward(
  doc: CampaignDocument,
  id: string,
  category: XpReward['input']['category'],
  recorded = true
): XpReward {
  const reward = newXpReward(doc, 'session-1', id, category);
  reward.title =
    id === 'raiders'
      ? 'Seventeen tunnel raiders'
      : id === 'money'
      ? 'Recovered coin lots'
      : id === 'scroll'
      ? 'Kept warding scroll'
      : id;
  reward.origin.phase = 'end';
  reward.reviewed = true;
  reward.eligibility = 'secured';
  reward.recipients = reward.recipients.map((r) => ({
    ...r,
    participated: true,
    eligible: true,
    allocationOverride: category === 'monster' && recorded ? '26' : null,
    allocationReason:
      category === 'monster' && recorded
        ? 'Recorded historical award-row rounding'
        : '',
  }));
  if (reward.input.category === 'monster')
    reward.input.monsters = reward.input.monsters.map((m) => ({
      ...m,
      name: 'Tunnel raiders',
      count: 17,
      hitDice: '1/2',
      startingHp: '44',
    }));
  if (reward.input.category === 'money') {
    reward.input.gp = '675';
    reward.notes = 'Invented coin lots: 375 + 50 + 250 GP-equivalent';
    reward.ratio.proposed = '1';
  }
  if (reward.input.category === 'treasure') {
    reward.input = {
      category: 'treasure',
      disposition: 'keep',
      retainedXp: '1500',
      proceeds: null,
      marketGp: '7500',
    };
    reward.ratio.proposed = '1';
  }
  return reward;
}
export function xpCastleDraft(recorded = true) {
  let doc = xpCampaign();
  for (const [id, category] of [
    ['raiders', 'monster'],
    ['money', 'money'],
    ['scroll', 'treasure'],
  ] as const)
    doc = saveXpReward(doc, xpTestReward(doc, id, category, recorded));
  const point = {
    ...newXpPoint(doc, 'session-2', 'refuge-point'),
    label: 'At the synthetic refuge',
    position: { sessionId: 'session-2', phase: 'opening' as const, order: 0 },
  };
  doc = saveXpPoint(doc, point);
  return selectXpRewards(doc, point.id, ['raiders', 'money', 'scroll']);
}
export function pendingFungus(doc: CampaignDocument): XpReward {
  const reward = xpTestReward(doc, 'later-fungus', 'monster', false);
  reward.title = 'Later alarm fungus';
  reward.origin = { sessionId: 'session-2', phase: 'during', order: 1 };
  reward.recipients = reward.recipients.slice(0, 4);
  if (reward.input.category === 'monster')
    reward.input.monsters = reward.input.monsters.map((m) => ({
      ...m,
      name: 'Alarm fungus',
      count: 1,
      hitDice: '3',
      startingHp: '14',
      special: 0,
    }));
  reward.rawOverride = {
    amount: '92',
    reason: 'Historical extra 15 XP retained after DM review',
  };
  reward.ratio = {
    proposed: null,
    override: '1',
    reason:
      'Recorded historical DM ratio decision; original explanation not recorded',
    recordedProposal: '1/2',
    recordedReason:
      'Historical sheet proposed 0.5 before its recorded override',
  };
  return reward;
}
