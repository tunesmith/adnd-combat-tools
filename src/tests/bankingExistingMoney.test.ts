import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import type { CampaignDocument } from '../helpers/campaignDocument';
import {
  bankBalance,
  bankBoundaryDifference,
  bankGp,
  bankLedger,
  holderMoney,
  previewBankTransaction,
  commitBankTransaction,
  existingMoneyAvailability,
  saveBankOpenings,
  commitBankReconciliation,
  bankReconciliationFingerprint,
} from '../helpers/campaignBanking';
import type { BankTransactionRequest } from '../helpers/campaignBanking';
import { zeroBankAmounts } from '../helpers/campaignBankingModel';
import { changeWorkingInventory } from '../helpers/campaignWorkingInventory';
import {
  sessionFingerprint,
  startNextSession,
} from '../helpers/campaignContinuity';
import { transferInventorySubtree } from '../helpers/encumbranceStorage';
import { getTotalEncumbranceGp } from '../helpers/encumbranceRules';
import { encumbranceCatalogById } from '../tables/encumbranceCatalog';
import {
  existingBankFixture,
  existingLeg,
  bureauReceipt,
  receiptAt,
} from './fixtures/bankingExisting';

const required = <T>(v: T | undefined): T => {
  if (v === undefined) throw Error('Missing fixture');
  return v;
};
const inventory = (doc: CampaignDocument, sessionId = 'day1') => {
  const d = required(
    doc.workingInventories.find((w) => w.sessionId === sessionId)
  ).document;
  if (d.version !== 10) throw Error('Fixture');
  return d;
};
function accept(
  doc: CampaignDocument,
  request: BankTransactionRequest,
  id = 'operation-' + bankLedger(doc).entries.length
) {
  const preview = previewBankTransaction(doc, request);
  const result = commitBankTransaction(
    doc,
    request,
    preview.fingerprint,
    id,
    receiptAt
  );
  validateHistoryTransition(doc, result, '');
  return parseCampaign(serializeCampaign(result));
}
const available = (
  doc: CampaignDocument,
  itemId: string,
  transactionId?: string
) =>
  existingMoneyAvailability(doc, 'day1', transactionId).stacks.find(
    (s) => s.item.id === itemId
  )?.available;

test('SOCK Day1 records three-stack electrum, silver and gold without adding a physical coin or XP event', () => {
  const original = existingBankFixture(),
    physical = inventory(original);
  const loads = physical.characters.map((c) =>
    getTotalEncumbranceGp(c, encumbranceCatalogById)
  );
  const request = bureauReceipt(original);
  const preview = previewBankTransaction(original, request);
  expect(preview.candidate.effect).toBe('ledger');
  expect(preview.inventory).toBe(physical);
  expect(bankBalance(preview.projection, 'reatha-inventory', 'day1')).toEqual({
    ...zeroBankAmounts(),
    ep: 700,
  });
  expect(bankBalance(preview.projection, 'vitameno-inventory', 'day1')).toEqual(
    { ...zeroBankAmounts(), ep: 50 }
  );
  expect(
    bankBoundaryDifference(preview.projection, 'day1').map((d) => d.difference)
  ).toEqual([{ ...zeroBankAmounts(), sp: 1000, gp: 250 }]);
  let doc = accept(original, request, 'bureau-operation');
  expect(
    commitBankTransaction(
      doc,
      request,
      preview.fingerprint,
      'bureau-operation',
      receiptAt
    )
  ).toBe(doc);
  expect(available(doc, 'electrum-300')).toBe(0);
  expect(available(doc, 'electrum-400')).toBe(0);
  expect(available(doc, 'electrum-50')).toBe(0);
  expect(() =>
    previewBankTransaction(doc, { ...request, transactionId: 'duplicate' })
  ).toThrow('available');
  for (const [id, title, item, quantity] of [
    ['silver', 'Invisible chest — 1,000 silver', 'silver-1000', 1000],
    ['gold', 'Invisible chest — 250 gold', 'gold-250', 250],
  ] as const)
    doc = accept(doc, {
      transactionId: id,
      sessionId: 'day1',
      description: title,
      kind: 'income',
      receiptMode: 'existing',
      changes: [existingLeg(doc, 'reatha-inventory', item, quantity)],
    });
  expect(bankGp(bankBalance(doc, 'reatha-inventory', 'day1'))).toBe('650');
  expect(bankGp(bankBalance(doc, 'vitameno-inventory', 'day1'))).toBe('25');
  expect(bankBoundaryDifference(doc, 'day1')).toEqual([]);
  expect(inventory(doc)).toEqual(physical);
  expect(
    inventory(doc).characters.map((c) =>
      getTotalEncumbranceGp(c, encumbranceCatalogById)
    )
  ).toEqual(loads);
  expect(doc.xp).toEqual(original.xp);
  expect(bankLedger(doc).entries.map((e) => e.receiptMode)).toEqual([
    'existing',
    'existing',
    'existing',
  ]);
});
test('partial allocations share available coverage, and editing/deleting releases it exactly once', () => {
  let doc = existingBankFixture();
  const partial: BankTransactionRequest = {
    ...bureauReceipt(doc),
    changes: [existingLeg(doc, 'reatha-inventory', 'electrum-300', 100)],
  };
  doc = accept(doc, partial);
  expect(available(doc, 'electrum-300')).toBe(200);
  expect(available(doc, 'electrum-400')).toBe(400);
  const other = {
    ...partial,
    transactionId: 'another',
    changes: [existingLeg(doc, 'reatha-inventory', 'electrum-300', 100)],
  };
  doc = accept(doc, other);
  expect(available(doc, 'electrum-300')).toBe(100);
  expect(() =>
    previewBankTransaction(doc, {
      ...other,
      transactionId: 'over-two-rows',
      changes: [
        existingLeg(doc, 'reatha-inventory', 'electrum-300', 60),
        existingLeg(doc, 'reatha-inventory', 'electrum-300', 60),
      ],
    })
  ).toThrow('available');
  doc = accept(doc, {
    ...partial,
    description: 'Reallocate to the second pouch',
    changes: [existingLeg(doc, 'reatha-inventory', 'electrum-400', 150)],
  });
  expect(available(doc, 'electrum-300')).toBe(200);
  expect(available(doc, 'electrum-400')).toBe(250);
  const remove = { ...other, remove: true };
  doc = accept(doc, remove, 'delete-other');
  expect(available(doc, 'electrum-300')).toBe(300);
  const saved = serializeCampaign(doc);
  const reopened = parseCampaign(saved);
  expect(available(reopened, 'electrum-400')).toBe(250);
  expect(inventory(reopened)).toEqual(inventory(existingBankFixture()));
});
test('aggregate openings and ordinary receipts reserve coverage once across the actual stacks', () => {
  let doc = existingBankFixture();
  const opening = required(
    doc.banking?.openings.find((o) => o.holderId === 'reatha-inventory')
  );
  doc = saveBankOpenings(doc, [
    { ...opening, amounts: { ...opening.amounts, ep: 200 } },
  ]);
  expect(available(doc, 'electrum-300')).toBe(100);
  expect(available(doc, 'electrum-400')).toBe(400);
  expect(() =>
    previewBankTransaction(doc, {
      ...bureauReceipt(doc),
      changes: [existingLeg(doc, 'reatha-inventory', 'electrum-300', 150)],
    })
  ).toThrow('100 remains');
  const ordinary: BankTransactionRequest = {
    transactionId: 'ordinary',
    sessionId: 'day1',
    description: 'Ordinary coin receipt',
    kind: 'income',
    changes: [existingLeg(doc, 'reatha-inventory', 'electrum-400', 50)],
  };
  const p = previewBankTransaction(doc, ordinary);
  const prior = doc;
  doc = accept(doc, ordinary, 'ordinary-operation');
  expect(
    commitBankTransaction(
      doc,
      ordinary,
      p.fingerprint,
      'ordinary-operation',
      receiptAt
    )
  ).toBe(doc);
  expect(holderMoney(inventory(doc), 'reatha-inventory').ep).toBe(750);
  expect(bankBalance(doc, 'reatha-inventory', 'day1').ep).toBe(250);
  expect(available(doc, 'electrum-300')).toBe(100);
  expect(available(doc, 'electrum-400')).toBe(400);
  expect(
    inventory(prior).characters[0]?.inventory.find(
      (i) => i.id === 'electrum-400'
    )?.quantity
  ).toBe(400);
});
test('general reconciliation only adds the remaining difference; Day2 relocation creates a transfer', () => {
  const original = existingBankFixture();
  let doc = accept(original, bureauReceipt(original));
  doc = commitBankReconciliation(
    doc,
    'day1',
    bankReconciliationFingerprint(doc, 'day1'),
    'remaining',
    receiptAt
  );
  expect(
    bankLedger(doc)
      .entries.at(-1)
      ?.changes.map((c) => [c.denomination, c.quantity])
  ).toEqual([
    ['sp', 1000],
    ['gp', 250],
  ]);
  expect(bankBoundaryDifference(doc, 'day1')).toEqual([]);
  const before = doc;
  doc = startNextSession(doc, {
    campaignId: doc.id,
    sourceSessionId: 'day1',
    sourceFingerprint: sessionFingerprint(doc, 'day1'),
    destinationId: 'day2',
    label: 'Day 2',
    combats: [],
    inventory: {
      sourceId: 'day1-possessions',
      instanceId: 'day2-possessions',
      checkpointId: 'carry-existing',
    },
    copyNotes: false,
    capturedAt: receiptAt,
  });
  validateHistoryTransition(before, doc, '');
  expect(doc.banking).toEqual(before.banking);
  const moved = transferInventorySubtree(
    inventory(doc, 'day2'),
    'chest',
    'reatha-inventory',
    'castle-storage'
  );
  const changed = changeWorkingInventory(
    doc,
    'day2-possessions',
    'day2',
    moved,
    { id: 'relocate-chest', at: receiptAt }
  );
  validateHistoryTransition(doc, changed, '');
  expect(bankLedger(changed).entries.at(-1)?.kind).toBe('transfer');
  expect(bankGp(bankBalance(changed, 'castle-storage', 'day2'))).toBe('300');
  expect(bankGp(bankBalance(changed, 'reatha-inventory', 'day2'))).toBe('350');
  expect(bankBoundaryDifference(changed, 'day2')).toEqual([]);
  expect(inventory(changed)).toEqual(inventory(original));
  expect(changed.xp).toEqual(original.xp);
  expect(
    existingMoneyAvailability(changed, 'day2').stacks.every(
      (s) => s.available === 0
    )
  ).toBe(true);
});
test('receipts retain inspectable evidence after spending or moving stacks; forged mode and stale allocations are rejected', () => {
  let doc = existingBankFixture();
  const request = bureauReceipt(doc);
  doc = accept(doc, request);
  const receipt = required(doc.banking?.entries[0]);
  const moved = transferInventorySubtree(
    inventory(doc),
    'electrum-300',
    'reatha-inventory',
    'castle-storage'
  );
  const before = doc;
  doc = changeWorkingInventory(doc, 'day1-possessions', 'day1', moved, {
    id: 'move-explained-coins',
    at: receiptAt,
  });
  validateHistoryTransition(before, doc, '');
  const current = doc;
  doc = accept(doc, { ...request, description: 'Clarify bureau receipt' });
  expect(doc.banking?.entries.at(-1)?.changes).toEqual(receipt.changes);
  expect(inventory(doc)).toEqual(inventory(current));
  expect(() =>
    previewBankTransaction(doc, { ...request, receiptMode: undefined })
  ).toThrow('keeps its possessions mode');
  expect(() =>
    previewBankTransaction(doc, { ...request, kind: 'transfer' })
  ).toThrow('receipt or transfer type');
  const source = existingBankFixture(),
    fresh = previewBankTransaction(source, bureauReceipt(source));
  const increased = accept(source, {
    ...bureauReceipt(source),
    transactionId: 'consume-first',
    changes: [existingLeg(source, 'reatha-inventory', 'electrum-300', 100)],
  });
  expect(() =>
    commitBankTransaction(
      increased,
      bureauReceipt(source),
      fresh.fingerprint,
      'stale',
      receiptAt
    )
  ).toThrow();
  const tampered = {
    ...doc,
    banking: {
      ...bankLedger(doc),
      entries: bankLedger(doc).entries.map((e, i) =>
        i === 0 ? { ...e, receiptMode: undefined } : e
      ),
    },
  };
  expect(() => validateHistoryTransition(doc, tampered, '')).toThrow(
    'immutable'
  );
});

test('spending remains ordinary and an earlier receipt can be corrected using its retained evidence', () => {
  let doc = existingBankFixture();
  const receipt = bureauReceipt(doc);
  doc = accept(doc, receipt);
  const evidence = required(doc.banking?.entries[0]).changes;
  doc = accept(doc, {
    transactionId: 'pay-ep',
    sessionId: 'day1',
    description: 'Spend explained electrum',
    kind: 'purchase',
    changes: [existingLeg(doc, 'reatha-inventory', 'electrum-300', -50)],
  });
  expect(holderMoney(inventory(doc), 'reatha-inventory').ep).toBe(650);
  const physical = inventory(doc);
  doc = accept(doc, { ...receipt, description: 'Receipt note after spending' });
  expect(inventory(doc)).toEqual(physical);
  expect(doc.banking?.entries.at(-1)?.changes).toEqual(evidence);
  expect(() =>
    previewBankTransaction(doc, { ...receipt, remove: true })
  ).toThrow('insufficient');
  doc = accept(doc, {
    ...receipt,
    changes: receipt.changes.map((c) =>
      c.item.id === 'electrum-300' ? { ...c, quantity: 250 } : c
    ),
  });
  expect(
    bankBoundaryDifference(doc, 'day1').find(
      (r) => r.holderId === 'reatha-inventory'
    )?.difference.ep
  ).toBe(50);
  expect(available(doc, 'electrum-300')).toBe(50);
});

test('V15 ordinary and reconciliation records migrate without being reinterpreted as existing-money receipts', () => {
  const original = existingBankFixture();
  const balanced = commitBankReconciliation(
    original,
    'day1',
    bankReconciliationFingerprint(original, 'day1'),
    'legacy-reconciliation',
    receiptAt
  );
  const legacy = { ...balanced, schemaVersion: 15 };
  const loaded = parseCampaign(JSON.stringify(legacy));
  expect(loaded.schemaVersion).toBe(17);
  expect(loaded.banking).toEqual(balanced.banking);
  expect(loaded.banking?.entries[0]?.receiptMode).toBeUndefined();
  expect(bankBoundaryDifference(loaded, 'day1')).toEqual([]);
});

test('merging explained stacks remains a location transfer and the original allocation can still be inspected and edited', () => {
  let doc = existingBankFixture();
  const request = bureauReceipt(doc);
  doc = accept(doc, request);
  const originalEvidence = required(doc.banking?.entries[0]).changes;
  const current = inventory(doc);
  const merged = {
    ...current,
    characters: current.characters.map((holder) =>
      holder.id === 'reatha-inventory'
        ? {
            ...holder,
            inventory: holder.inventory
              .filter((item) => item.id !== 'electrum-400')
              .map((item) =>
                item.id === 'electrum-300' ? { ...item, quantity: 700 } : item
              ),
          }
        : holder
    ),
  };
  const before = doc;
  doc = changeWorkingInventory(doc, 'day1-possessions', 'day1', merged, {
    id: 'merge-ep',
    at: receiptAt,
  });
  validateHistoryTransition(before, doc, '');
  expect(doc.banking?.entries.at(-1)?.kind).toBe('transfer');
  expect(available(doc, 'electrum-300')).toBe(0);
  const physical = inventory(doc);
  doc = accept(doc, {
    ...request,
    description: 'Clarify the original receipt after merging',
  });
  expect(inventory(doc)).toEqual(physical);
  expect(doc.banking?.entries.at(-1)?.changes).toEqual(originalEvidence);
  expect(bankBalance(doc, 'reatha-inventory', 'day1').ep).toBe(700);
});
