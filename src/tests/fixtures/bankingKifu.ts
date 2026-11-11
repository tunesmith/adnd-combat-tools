import type { CampaignDocument } from '../../helpers/campaignDocument';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../../helpers/campaignDocument';
import {
  startWorkingInventory,
  emptyWorkingInventory,
} from '../../helpers/campaignWorkingInventory';
import {
  bankHolders,
  bankLedger,
  newBankMoneyItem,
  previewBankTransaction,
  commitBankTransaction,
  holderMoney,
  saveBankOpenings,
} from '../../helpers/campaignBanking';
import type {
  BankChange,
  BankDenomination,
} from '../../helpers/campaignBankingModel';
import type { BankTransactionRequest } from '../../helpers/campaignBanking';
import {
  sessionFingerprint,
  startNextSession,
} from '../../helpers/campaignContinuity';
export const bankingAt = '2026-11-10T12:00:00.000Z';
export function bankFixture() {
  let doc = parseCampaign(
    JSON.stringify({
      kind: 'adnd-campaign',
      schemaVersion: 1,
      id: 'synthetic-banking',
      title: 'Synthetic Castle Kifu banking',
      notes: '',
    })
  );
  doc.sessions = [
    { id: 'day2', label: 'Day 2', notes: '' },
    { id: 'day3', label: 'Day 3', notes: '' },
  ];
  const empty = emptyWorkingInventory();
  if (empty.version !== 10) throw Error('Fixture requires current inventory.');
  const money = (
    code: BankDenomination,
    id: string,
    quantity: number,
    containerId: string | null = null
  ) => ({
    ...newBankMoneyItem(code, id, containerId),
    quantity,
  });
  const inventory = {
    ...empty,
    activeCharacterId: 'inventory-reatha',
    characters: [
      {
        id: 'inventory-reatha',
        name: 'Reatha',
        strength: { score: 18, exceptional: 'none' as const },
        dmNotes: 'Synthetic fixture',
        inventory: [],
      },
      {
        id: 'inventory-vitameno',
        name: 'Vitameno',
        strength: { score: 10, exceptional: 'none' as const },
        dmNotes: '',
        inventory: [money('ep', 'vitameno-ep', 50)],
      },
    ],
    storageLocations: [
      {
        id: 'castle-kifu-storage',
        name: 'Castle Kifu',
        notes: 'Synthetic storage',
        inventory: [
          {
            id: 'castle-chest',
            catalogId: 'chest-wooden-large',
            quantity: 1,
            containerId: null,
            day: 1,
            playerNotes: '',
            playerKnowsValue: true,
            playerMagicKnowledge: 'known-mundane' as const,
            name: 'Synthetic chest',
            customItem: {
              id: 'chest-wooden-large',
              name: 'Synthetic chest',
              category: 'containers' as const,
              encumbranceGp: 100,
              valueGp: 1,
              isContainer: true,
              capacityGp: 10000,
            },
          },
          money('ep', 'castle-ep', 700, 'castle-chest'),
          money('sp', 'castle-sp', 1000, 'castle-chest'),
          money('gp', 'castle-gp', 250, 'castle-chest'),
        ],
      },
    ],
  };
  doc = startWorkingInventory(
    doc,
    'day2',
    inventory,
    { kind: 'empty' },
    'day2-stock',
    'fixture-checkpoint',
    bankingAt
  );
  doc = saveBankOpenings(
    doc,
    bankHolders(inventory).map((h) => ({
      id: 'opening-' + h.id,
      holderId: h.id,
      sessionId: 'day2',
      phase: 'after',
      amounts: holderMoney(inventory, h.id),
      note: 'Reviewed Day 2 closing quantities',
    }))
  );
  const copied = startNextSession(
    { ...doc, sessions: doc.sessions.filter((s) => s.id !== 'day3') },
    {
      campaignId: doc.id,
      sourceSessionId: 'day2',
      sourceFingerprint: sessionFingerprint(
        { ...doc, sessions: doc.sessions.filter((s) => s.id !== 'day3') },
        'day2'
      ),
      destinationId: 'day3',
      label: 'Day 3',
      combats: [],
      inventory: {
        sourceId: 'day2-stock',
        instanceId: 'day3-stock',
        checkpointId: 'carry-checkpoint',
      },
      copyNotes: false,
      capturedAt: bankingAt,
    }
  );
  return copied;
}
export function bankLeg(
  doc: CampaignDocument,
  sessionId: string,
  holderId: string,
  code: BankDenomination,
  quantity: number,
  stackId: string,
  containerId: string | null = null
): BankChange {
  const inventory = doc.workingInventories.find(
    (w) => w.sessionId === sessionId
  )?.document;
  const existing =
    inventory &&
    bankHolders(inventory)
      .find((h) => h.id === holderId)
      ?.inventory.find((i) => i.id === stackId);
  return {
    holderId,
    denomination: code,
    quantity,
    item: existing ?? newBankMoneyItem(code, stackId, containerId),
  };
}
export function bankPost(
  doc: CampaignDocument,
  request: BankTransactionRequest
) {
  const preview = previewBankTransaction(doc, request);
  const next = commitBankTransaction(
    doc,
    request,
    preview.fingerprint,
    request.transactionId + '-posted-' + bankLedger(doc).entries.length,
    bankingAt
  );
  validateHistoryTransition(doc, next, '');
  return parseCampaign(serializeCampaign(next));
}
export function kifuStoreVisit() {
  let doc = bankFixture();
  const leg = (
    holderId: string,
    code: BankDenomination,
    quantity: number,
    id: string,
    container: string | null = null
  ) => bankLeg(doc, 'day3', holderId, code, quantity, id, container);
  doc = bankPost(doc, {
    transactionId: 'town-transfer',
    sessionId: 'day3',
    description: 'Take chest money to town; synthetic stack destinations',
    kind: 'transfer',
    changes: [
      leg('castle-kifu-storage', 'ep', -700, 'castle-ep'),
      leg('castle-kifu-storage', 'gp', -250, 'castle-gp'),
      leg('inventory-reatha', 'ep', 700, 'reatha-ep'),
      leg('inventory-reatha', 'gp', 250, 'reatha-gp'),
    ],
  });
  // Synthetic tender: exchange the electrum into gold before making payments.
  doc = bankPost(doc, {
    transactionId: 'electrum-exchange',
    sessionId: 'day3',
    description: 'Synthetic tender: exchange 700 ep for 350 gp',
    kind: 'exchange',
    changes: [
      leg('inventory-reatha', 'ep', -700, 'reatha-ep'),
      leg('inventory-reatha', 'gp', 350, 'reatha-gp'),
    ],
  });
  doc = bankPost(doc, {
    transactionId: 'ramnar-fee',
    sessionId: 'day3',
    description: 'Ramnar receives 150 gp equivalent; synthetic gold tender',
    kind: 'fee',
    changes: [leg('inventory-reatha', 'gp', -150, 'reatha-gp')],
  });
  for (const [id, description, gp] of [
    ['banded-mail', 'Banded mail', 90],
    ['longbow', 'Longbow', 60],
    ['arrows', 'Twelve arrows', 1],
    ['crossbow', 'Light crossbow', 12],
    ['bolts', 'Twenty bolts', 1],
    ['two-score', 'Two-score quiver', 1],
  ] as const)
    doc = bankPost(doc, {
      transactionId: id,
      sessionId: 'day3',
      description: description + ' · synthetic gold tender',
      kind: 'purchase',
      changes: [leg('inventory-reatha', 'gp', -gp, 'reatha-gp')],
    });
  doc = bankPost(doc, {
    transactionId: 'large-quiver',
    sessionId: 'day3',
    description: 'Large quiver 0.6 gp · synthetic 1 gp tender and 8 sp change',
    kind: 'purchase',
    changes: [
      leg('inventory-reatha', 'gp', -1, 'reatha-gp'),
      leg('inventory-reatha', 'sp', 8, 'reatha-sp'),
    ],
  });
  doc = bankPost(doc, {
    transactionId: 'scale-refund',
    sessionId: 'day3',
    description:
      '45 gp scale mail refund inferred from journal and closing balance',
    kind: 'refund',
    changes: [leg('inventory-reatha', 'gp', 45, 'reatha-gp')],
  });
  doc = bankPost(doc, {
    transactionId: 'diamond-exchange',
    sessionId: 'day3',
    description:
      'Synthetic final exchange: 300 gp into three currency diamonds',
    kind: 'exchange',
    changes: [
      leg('inventory-reatha', 'gp', -300, 'reatha-gp'),
      leg('inventory-reatha', 'diamond', 3, 'reatha-diamond'),
    ],
  });
  return doc;
}
