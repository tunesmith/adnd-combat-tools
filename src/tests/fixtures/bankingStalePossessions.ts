import { bankFixture, bankLeg, bankPost } from './bankingKifu';
import { bankLedger, newBankMoneyItem } from '../../helpers/campaignBanking';
import type { EncumbranceInventoryItem } from '../../types/encumbrance';
export const staleHolder = 'inventory-vitameno';
export function staleCarriedMoney(quantities = [50]) {
  let doc = bankFixture();
  const container = (
    id: string,
    parent: string | null
  ): EncumbranceInventoryItem => ({
    id,
    catalogId: 'synthetic-pouch',
    quantity: 1,
    containerId: parent,
    day: 1,
    name: id,
    playerNotes: 'Synthetic container',
    playerKnowsValue: false,
    playerMagicKnowledge: 'known-mundane',
    customItem: {
      id: 'synthetic-pouch',
      name: 'Synthetic pouch',
      category: 'containers',
      isContainer: true,
      capacityGp: 1000,
      encumbranceGp: 1,
      valueGp: 1,
    },
  });
  doc = {
    ...doc,
    title: 'Synthetic earlier loss and carried possessions',
    workingInventories: doc.workingInventories.map((w) => ({
      ...w,
      document: {
        ...w.document,
        characters: w.document.characters.map((c) =>
          c.id !== staleHolder
            ? c
            : {
                ...c,
                name: 'Sable',
                dmNotes: 'Synthetic private notes',
                inventory: [
                  container('outer-pouch', null),
                  container('inner-pocket', 'outer-pouch'),
                  ...quantities.map((quantity, i) => ({
                    ...newBankMoneyItem('ep', `stale-ep-${i}`, 'inner-pocket'),
                    quantity,
                    playerNotes: 'Synthetic player note',
                    dmNotes: 'Synthetic DM note',
                    playerKnowsValue: false,
                    playerMagicKnowledge: 'unknown' as const,
                  })),
                ],
              }
        ),
      },
    })),
    banking: {
      ...bankLedger(doc),
      openings: bankLedger(doc).openings.map((o) =>
        o.holderId === staleHolder
          ? {
              ...o,
              phase: 'before' as const,
              amounts: {
                ...o.amounts,
                ep: quantities.reduce((a, b) => a + b, 0),
              },
            }
          : o
      ),
    },
  };
  let remaining = 50;
  const changes = quantities.flatMap((quantity, i) => {
    const remove = Math.min(quantity, remaining);
    remaining -= remove;
    return remove
      ? [bankLeg(doc, 'day2', staleHolder, 'ep', -remove, `stale-ep-${i}`)]
      : [];
  });
  if (remaining) throw Error('Synthetic fixture needs at least 50 ep');
  return bankPost(doc, {
    transactionId: 'earlier-loss',
    sessionId: 'day2',
    kind: 'purchase',
    description: 'Earlier loss of 50 electrum',
    changes,
  });
}
