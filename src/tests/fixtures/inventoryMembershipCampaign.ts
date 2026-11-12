import { bankFixture, bankLeg, bankPost, bankingAt } from './bankingKifu';
import { saveBankOpenings, bankLedger } from '../../helpers/campaignBanking';
import { zeroBankAmounts } from '../../helpers/campaignBankingModel';
import { emptyProfile, updatePartyProfile } from '../../helpers/campaignParty';
import {
  parseCampaign,
  serializeCampaign,
} from '../../helpers/campaignDocument';
import { changeWorkingInventory } from '../../helpers/campaignWorkingInventory';
import type { EncumbranceInventoryItem } from '../../types/encumbrance';
export { bankingAt as membershipAt };
export const memberIds = {
  mira: 'roster-mira',
  retired: 'roster-oren',
  absent: 'roster-tal',
  nera: 'roster-nera',
  bram: 'roster-bram',
  eli: 'roster-eli',
  ash: 'roster-ash',
};
export const holderIds = {
  mira: 'inventory-reatha',
  retired: 'inventory-oren',
  absent: 'inventory-vitameno',
  nera: 'inventory-nera',
  bram: 'inventory-bram',
};
const gear = (prefix: string): EncumbranceInventoryItem[] => [
  {
    id: prefix + '-pack',
    catalogId: 'membership-pack',
    name: 'Pack',
    quantity: 1,
    containerId: null,
    day: 2,
    playerNotes: 'Player-safe pack',
    playerKnowsValue: false,
    playerMagicKnowledge: 'unknown',
    dmNotes: 'Synthetic private pack note',
    customItem: {
      id: 'membership-pack',
      name: 'Pack',
      category: 'containers',
      isContainer: true,
      capacityGp: 1000,
      encumbranceGp: 10,
      valueGp: 1,
    },
  },
  {
    id: prefix + '-case',
    catalogId: 'membership-case',
    name: 'Inner case',
    quantity: 1,
    containerId: prefix + '-pack',
    day: 2,
    playerNotes: 'Nested',
    playerKnowsValue: false,
    playerMagicKnowledge: 'unknown',
    customItem: {
      id: 'membership-case',
      name: 'Case',
      category: 'containers',
      isContainer: true,
      capacityGp: 100,
      encumbranceGp: 1,
      valueGp: 1,
    },
  },
  {
    id: prefix + '-stones',
    catalogId: 'membership-stones',
    name: 'Synthetic stones',
    quantity: 3,
    containerId: prefix + '-case',
    day: 2,
    playerNotes: 'Unknown value',
    playerKnowsValue: false,
    playerMagicKnowledge: 'unknown',
    dmNotes: 'DM-only synthetic value',
    customItem: {
      id: 'membership-stones',
      name: 'Stones',
      category: 'treasure',
      encumbranceGp: 1,
      valueGp: 10,
    },
  },
];
export function membershipCampaign(recordLoss = true) {
  let doc = bankFixture();
  doc = {
    ...doc,
    title: 'Synthetic session inventory membership',
    workingInventories: doc.workingInventories.map((w) => ({
      ...w,
      document: {
        ...w.document,
        characters: [
          ...w.document.characters.map((c) => ({
            ...c,
            name: c.id === holderIds.mira ? 'Mira' : 'Tal',
            inventory: [
              ...c.inventory,
              ...(c.id === holderIds.absent ? gear('tal') : []),
            ],
          })),
          {
            id: holderIds.retired,
            name: 'Oren',
            strength: { score: 12, exceptional: 'none' as const },
            dmNotes: 'Retired synthetic character',
            inventory: gear('oren'),
          },
          {
            id: holderIds.nera,
            name: 'Nera',
            strength: { score: 10, exceptional: 'none' as const },
            dmNotes: '',
            inventory: [],
          },
          {
            id: holderIds.bram,
            name: 'Bram',
            strength: { score: 10, exceptional: 'none' as const },
            dmNotes: '',
            inventory: [],
          },
        ],
      },
    })),
    banking: {
      ...bankLedger(doc),
      openings: bankLedger(doc).openings.map((o) =>
        o.holderId === holderIds.absent ? { ...o, phase: 'before' as const } : o
      ),
    },
  };
  doc = saveBankOpenings(doc, [
    {
      id: 'oren-opening',
      holderId: holderIds.retired,
      sessionId: 'day2',
      phase: 'before',
      amounts: zeroBankAmounts(),
      note: 'Known synthetic zero',
    },
  ]);
  for (const [key, id] of Object.entries(memberIds)) {
    const name =
      key === 'retired'
        ? 'Oren'
        : key === 'absent'
        ? 'Tal'
        : key.charAt(0).toUpperCase() + key.slice(1);
    if (!['eli', 'ash'].includes(key))
      doc = updatePartyProfile(
        doc,
        { ...emptyProfile('day2', id), characterClass: 'fighter' },
        {
          id,
          name,
          player: 'Synthetic player',
          notes: '',
          ...(key === 'retired' ? { lastEligibleSessionId: 'day2' } : {}),
        }
      );
    if (key !== 'retired')
      doc = updatePartyProfile(
        doc,
        {
          ...emptyProfile('day3', id),
          characterClass: 'fighter',
          participating: key !== 'absent',
        },
        { id, name, player: 'Synthetic player', notes: '' }
      );
  }
  // Explicitly retain retirement when another session profile was initialized.
  if (recordLoss) {
    doc = bankPost(doc, {
      transactionId: 'earlier-ep-loss',
      sessionId: 'day2',
      description: 'Earlier 50 ep loss',
      kind: 'purchase',
      changes: [
        bankLeg(doc, 'day2', holderIds.absent, 'ep', -50, 'vitameno-ep'),
      ],
    });
    const work = doc.workingInventories.find((w) => w.sessionId === 'day3');
    if (!work) throw Error('Fixture');
    const inventory = {
      ...work.document,
      characters: work.document.characters.map((c) =>
        c.id === holderIds.absent
          ? {
              ...c,
              inventory: c.inventory.filter((i) => i.id !== 'vitameno-ep'),
            }
          : c
      ),
    };
    doc = changeWorkingInventory(doc, work.id, 'day3', inventory);
  }
  return parseCampaign(serializeCampaign(doc));
}
