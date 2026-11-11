import {
  bankBalance,
  bankBoundaryDifference,
  bankLedger,
  bankGp,
  bankChangesAmounts,
  bankBalanceSourceItem,
  newBankMoneyItem,
  previewBankTransaction,
  commitBankTransaction,
  existingTransferSources,
  existingMoneyAvailability,
} from '../helpers/campaignBanking';
import type { BankTransactionRequest } from '../helpers/campaignBanking';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import type { CampaignDocument } from '../helpers/campaignDocument';
import {
  sessionFingerprint,
  startNextSession,
} from '../helpers/campaignContinuity';
import {
  reviewedDay2Fixture,
  chestTransfer,
  inventoryAt,
} from './fixtures/bankingExistingTransfer';
import { receiptAt } from './fixtures/bankingExisting';
const required = <T>(v: T | undefined): T => {
  if (v === undefined) throw Error('Fixture');
  return v;
};
function accept(
  doc: CampaignDocument,
  request: BankTransactionRequest,
  id = 'transfer-op-' + bankLedger(doc).entries.length
) {
  const preview = previewBankTransaction(doc, request);
  const next = commitBankTransaction(
    doc,
    request,
    preview.fingerprint,
    id,
    receiptAt
  );
  validateHistoryTransition(doc, next, '');
  return parseCampaign(serializeCampaign(next));
}
test('Day2 records the reviewed chest relocation as one zero-GP transfer, preserving possessions and Day1 income', () => {
  const doc = reviewedDay2Fixture(),
    request = chestTransfer(doc);
  const preview = previewBankTransaction(doc, request);
  expect(preview.candidate.kind).toBe('transfer');
  expect(preview.candidate.effect).toBe('ledger');
  expect(preview.inventory).toBe(inventoryAt(doc));
  expect(bankGp(bankChangesAmounts(preview.candidate.changes))).toBe('0');
  expect(bankBoundaryDifference(preview.projection, 'day2')).toEqual([]);
  const confirmed = accept(doc, request, 'chest-op');
  expect(bankGp(bankBalance(confirmed, 'castle-storage', 'day2'))).toBe('650');
  expect(bankGp(bankBalance(confirmed, 'reatha-inventory', 'day2'))).toBe('0');
  expect(bankGp(bankBalance(confirmed, 'vitameno-inventory', 'day2'))).toBe(
    '25'
  );
  expect(confirmed.workingInventories).toEqual(doc.workingInventories);
  expect(confirmed.xp).toEqual(doc.xp);
  expect(confirmed.banking?.entries.slice(0, -1)).toEqual(doc.banking?.entries);
  expect(
    commitBankTransaction(
      confirmed,
      request,
      preview.fingerprint,
      'chest-op',
      receiptAt
    )
  ).toBe(confirmed);
  expect(() =>
    previewBankTransaction(confirmed, {
      ...request,
      transactionId: 'duplicate',
    })
  ).toThrow();
  expect(
    existingTransferSources(confirmed, 'day2').every((s) =>
      Object.values(s.amounts).every((v) => v === 0)
    )
  ).toBe(true);
});
test('partial allocations, corrections and deletion release both source and destination differences without moving money', () => {
  let doc = reviewedDay2Fixture();
  const all = chestTransfer(doc);
  const epIndex = all.changes.findIndex(
    (c) => c.quantity < 0 && c.denomination === 'ep'
  );
  const partial = { ...all, changes: all.changes.slice(epIndex, epIndex + 2) };
  doc = accept(doc, partial);
  expect(bankBalance(doc, 'castle-storage', 'day2').ep).toBe(300);
  expect(bankBalance(doc, 'reatha-inventory', 'day2').ep).toBe(400);
  const other = all.changes.find(
    (c) =>
      c.holderId === 'castle-storage' &&
      c.denomination === 'ep' &&
      c.quantity === 400
  );
  if (!other) throw Error('Fixture');
  doc = accept(doc, {
    ...partial,
    changes: [
      {
        holderId: 'reatha-inventory',
        denomination: 'ep',
        quantity: -400,
        item: bankBalanceSourceItem('reatha-inventory', 'ep', 700),
      },
      other,
    ],
  });
  expect(bankBalance(doc, 'castle-storage', 'day2').ep).toBe(400);
  expect(
    existingMoneyAvailability(doc, 'day2').stacks.find(
      (s) => s.item.id === partial.changes[1]?.item.id
    )?.available
  ).toBe(300);
  const beforeDelete = doc;
  doc = accept(doc, { ...partial, remove: true }, 'delete-transfer');
  expect(bankBalance(doc, 'castle-storage', 'day2').ep).toBe(0);
  expect(bankBalance(doc, 'reatha-inventory', 'day2').ep).toBe(700);
  expect(doc.workingInventories).toEqual(beforeDelete.workingInventories);
});
test('source funds, destination coverage and each denomination are checked independently', () => {
  const doc = reviewedDay2Fixture(),
    request = chestTransfer(doc);
  const pair = request.changes.slice(0, 2);
  expect(() =>
    previewBankTransaction(doc, {
      ...request,
      changes: pair.map((c) => ({ ...c, quantity: c.quantity * 2 })),
    })
  ).toThrow();
  expect(() =>
    previewBankTransaction(doc, {
      ...request,
      changes: pair.map((c, i) =>
        i === 0 ? { ...c, holderId: 'vitameno-inventory' } : c
      ),
    })
  ).toThrow('outgoing');
  expect(() =>
    previewBankTransaction(doc, {
      ...request,
      changes: pair.map((c, i) => (i === 0 ? { ...c, denomination: 'gp' } : c)),
    })
  ).toThrow('same denomination');
  expect(() =>
    previewBankTransaction(doc, {
      ...request,
      changes: pair.map((c, i) =>
        i === 0 ? { ...c, holderId: 'castle-storage' } : c
      ),
    })
  ).toThrow('Pair');
  const unknown = {
    ...doc,
    banking: {
      ...bankLedger(doc),
      openings: bankLedger(doc).openings.map((o) =>
        o.holderId === 'reatha-inventory'
          ? {
              ...o,
              amounts: { ...o.amounts, sp: null },
            }
          : o
      ),
    },
  };
  expect(() =>
    previewBankTransaction(unknown, { ...request, changes: pair })
  ).toThrow();
  const consumed = accept(doc, { ...request, changes: pair });
  expect(() =>
    commitBankTransaction(
      consumed,
      request,
      previewBankTransaction(doc, request).fingerprint,
      'stale',
      receiptAt
    )
  ).toThrow();
});
test('ordinary transfers still move physical coins; subsequent spending and carry-forward retain the recorded relocation', () => {
  const baseline = reviewedDay2Fixture();
  let doc = accept(baseline, chestTransfer(baseline));
  const evidence = required(doc.banking?.entries.at(-1));
  const coin = required(
    inventoryAt(doc).storageLocations[0]?.inventory.find(
      (i) => i.id === 'electrum-300'
    )
  );
  doc = accept(doc, {
    transactionId: 'physical-return',
    sessionId: 'day2',
    description: 'Carry some coins out of the castle',
    kind: 'transfer',
    changes: [
      {
        holderId: 'castle-storage',
        denomination: 'ep',
        quantity: -300,
        item: coin,
      },
      {
        holderId: 'reatha-inventory',
        denomination: 'ep',
        quantity: 300,
        item: newBankMoneyItem('ep', 'returned-ep'),
      },
    ],
  });
  expect(
    inventoryAt(doc).characters[0]?.inventory.find(
      (i) => i.id === 'returned-ep'
    )?.quantity
  ).toBe(300);
  const physical = doc.workingInventories;
  doc = accept(doc, {
    ...chestTransfer(baseline),
    description: 'Clarified original chest relocation',
  });
  expect(doc.workingInventories).toEqual(physical);
  expect(doc.banking?.entries.at(-1)?.changes).toEqual(evidence.changes);
  const carried = startNextSession(doc, {
    campaignId: doc.id,
    sourceSessionId: 'day2',
    sourceFingerprint: sessionFingerprint(doc, 'day2'),
    destinationId: 'day3',
    label: 'Day 3',
    combats: [],
    inventory: {
      sourceId: 'day2-possessions',
      instanceId: 'day3-possessions',
      checkpointId: 'day3-check',
    },
    copyNotes: false,
    capturedAt: receiptAt,
  });
  validateHistoryTransition(doc, carried, '');
  expect(carried.banking).toEqual(doc.banking);
  expect(bankBoundaryDifference(carried, 'day3')).toEqual([]);
});
