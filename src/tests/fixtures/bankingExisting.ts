import { parseCampaign } from '../../helpers/campaignDocument';
import {
  emptyWorkingInventory,
  startWorkingInventory,
} from '../../helpers/campaignWorkingInventory';
import {
  newBankMoneyItem,
  saveBankOpenings,
  bankHolders,
} from '../../helpers/campaignBanking';
import { zeroBankAmounts } from '../../helpers/campaignBankingModel';
import type {
  BankChange,
  BankDenomination,
} from '../../helpers/campaignBankingModel';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import { emptyCampaignXp } from '../../helpers/campaignXpModel';
export const receiptAt = '2026-11-10T12:00:00.000Z';
export function existingBankFixture() {
  let doc = parseCampaign(
    JSON.stringify({
      kind: 'adnd-campaign',
      schemaVersion: 1,
      id: 'synthetic-existing-money',
      title: 'Synthetic SOCK Day1 existing money',
      notes: '',
    })
  );
  doc.sessions = [{ id: 'day1', label: 'Day 1' }];
  doc.xp = emptyCampaignXp();
  const empty = emptyWorkingInventory();
  if (empty.version !== 10) throw Error('Fixture');
  const money = (
    code: BankDenomination,
    id: string,
    quantity: number,
    containerId: string | null = null
  ) => ({
    ...newBankMoneyItem(code, id, containerId),
    quantity,
  });
  const container = (id: string, name: string) => ({
    id,
    catalogId: 'synthetic-large-container',
    quantity: 1,
    containerId: null,
    day: 0,
    name,
    playerKnowsValue: true,
    playerNotes: '',
    playerMagicKnowledge: 'known-mundane' as const,
    customItem: {
      id: 'synthetic-large-container',
      name: 'Synthetic container',
      category: 'containers' as const,
      isContainer: true,
      capacityGp: 2000,
      encumbranceGp: 10,
      valueGp: 1,
    },
  });
  const inventory = {
    ...empty,
    activeCharacterId: 'reatha-inventory',
    characters: [
      {
        id: 'reatha-inventory',
        name: 'Reatha',
        strength: { score: 18, exceptional: 'none' as const },
        dmNotes: '',
        inventory: [
          container('pouch-a', 'Pouch A'),
          container('pouch-b', 'Pouch B'),
          container('chest', 'Invisible chest'),
          money('ep', 'electrum-300', 300, 'pouch-a'),
          money('ep', 'electrum-400', 400, 'pouch-b'),
          money('sp', 'silver-1000', 1000, 'chest'),
          money('gp', 'gold-250', 250, 'chest'),
        ],
      },
      {
        id: 'vitameno-inventory',
        name: 'Vitameno',
        strength: { score: 10, exceptional: 'none' as const },
        dmNotes: '',
        inventory: [money('ep', 'electrum-50', 50)],
      },
    ],
    storageLocations: [
      { id: 'castle-storage', name: 'Castle Kifu', notes: '', inventory: [] },
    ],
  };
  doc = startWorkingInventory(
    doc,
    'day1',
    inventory,
    { kind: 'empty' },
    'day1-possessions',
    'initial-checkpoint',
    receiptAt
  );
  return saveBankOpenings(
    doc,
    bankHolders(inventory).map((h) => ({
      id: 'opening-' + h.id,
      holderId: h.id,
      sessionId: 'day1',
      phase: 'before',
      amounts: zeroBankAmounts(),
      note: 'Known zero before Day1',
    }))
  );
}
export function existingLeg(
  doc: CampaignDocument,
  holderId: string,
  itemId: string,
  quantity: number
): BankChange {
  const inventory = doc.workingInventories.find(
    (w) => w.sessionId === 'day1'
  )?.document;
  const item =
    inventory &&
    bankHolders(inventory)
      .find((h) => h.id === holderId)
      ?.inventory.find((i) => i.id === itemId);
  if (!item) throw Error('Missing receipt stack');
  const code =
    item.catalogId === 'coin-electrum'
      ? 'ep'
      : item.catalogId === 'coin-silver'
      ? 'sp'
      : 'gp';
  return { holderId, denomination: code, item, quantity };
}
export function bureauReceipt(doc: CampaignDocument) {
  return {
    transactionId: 'bureau-receipt',
    sessionId: 'day1',
    description: 'Bureau treasure — 750 electrum',
    kind: 'income' as const,
    receiptMode: 'existing' as const,
    changes: [
      existingLeg(doc, 'reatha-inventory', 'electrum-300', 300),
      existingLeg(doc, 'reatha-inventory', 'electrum-400', 400),
      existingLeg(doc, 'vitameno-inventory', 'electrum-50', 50),
    ],
  };
}
