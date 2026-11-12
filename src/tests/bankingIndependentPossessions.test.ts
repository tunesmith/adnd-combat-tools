import {
  bankFixture,
  bankLeg,
  bankPost,
  bankingAt,
} from './fixtures/bankingKifu';
import {
  staleCarriedMoney,
  staleHolder,
} from './fixtures/bankingStalePossessions';
import legacyReconciliation from './fixtures/bankPossessionsReconciliationNative.json';
import legacyMoney from './fixtures/bankingExistingNative.json';
import {
  changeWorkingInventory,
  startWorkingInventory,
} from '../helpers/campaignWorkingInventory';
import {
  bankLedger,
  bankBalance,
  bankBoundaryDifference,
  holderMoney,
  newBankMoneyItem,
  previewBankTransaction,
  previewBankProgress,
  commitBankTransaction,
  bankingReplacementReview,
} from '../helpers/campaignBanking';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import { transferInventorySubtree } from '../helpers/encumbranceStorage';
import type { CampaignDocument } from '../helpers/campaignDocument';
const holder = 'inventory-vitameno';
const required = <T>(v: T | undefined): T => {
  if (v === undefined) throw Error('Fixture');
  return v;
};
const inventory = (doc: CampaignDocument) => {
  const result = required(
    doc.workingInventories.find((w) => w.sessionId === 'day3')
  ).document;
  if (result.version !== 10) throw Error('Fixture');
  return result;
};
const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v));
function physicalMoney(doc: CampaignDocument, ep: number, gp = 0) {
  const next = copy(inventory(doc));
  const character = required(next.characters.find((c) => c.id === holder));
  character.inventory = character.inventory.filter(
    (i) => i.id !== 'vitameno-ep' && i.id !== 'manual-gp'
  );
  if (ep)
    character.inventory.push({
      ...newBankMoneyItem('ep', 'vitameno-ep'),
      quantity: ep,
    });
  if (gp)
    character.inventory.push({
      ...newBankMoneyItem('gp', 'manual-gp'),
      quantity: gp,
    });
  return changeWorkingInventory(doc, 'day3-stock', 'day3', next);
}
const post = (
  doc: CampaignDocument,
  request: Parameters<typeof previewBankTransaction>[1],
  id = 'existing-operation'
) => {
  const p = previewBankTransaction(doc, request);
  const next = commitBankTransaction(
    doc,
    request,
    p.fingerprint,
    id,
    bankingAt
  );
  validateHistoryTransition(doc, next, '');
  return parseCampaign(serializeCampaign(next));
};

test('deleting the stale 50 ep squares Day3 without creating another transaction or altering earlier sessions', () => {
  const before = staleCarriedMoney(),
    work = required(
      before.workingInventories.find((w) => w.sessionId === 'day3')
    ),
    nextMoney = copy(work.document);
  const character = required(
    nextMoney.characters.find((c) => c.id === staleHolder)
  );
  character.inventory = character.inventory.filter(
    (i) => i.id !== 'stale-ep-0'
  );
  const next = changeWorkingInventory(before, work.id, 'day3', nextMoney);
  validateHistoryTransition(before, next, '');
  expect(next.banking).toBe(before.banking);
  expect(bankBalance(next, staleHolder, 'day3').ep).toBe(0);
  expect(holderMoney(nextMoney, staleHolder).ep).toBe(0);
  expect(bankBoundaryDifference(next, 'day3')).toEqual([]);
  expect(next.workingInventories.find((w) => w.sessionId === 'day2')).toEqual(
    before.workingInventories.find((w) => w.sessionId === 'day2')
  );
  expect(next.inventoryCheckpoints).toEqual(before.inventoryCheckpoints);
  expect(parseCampaign(serializeCampaign(next))).toEqual(next);
});

test('manual quantity and ownership edits leave a visible difference until a named transaction is recorded', () => {
  const before = bankFixture(),
    changed = physicalMoney(before, 30);
  validateHistoryTransition(before, changed, '');
  expect(changed.banking).toBe(before.banking);
  expect(bankBalance(changed, holder, 'day3').ep).toBe(50);
  expect(
    bankBoundaryDifference(changed, 'day3').find((d) => d.holderId === holder)
      ?.difference.ep
  ).toBe(-20);
  const moved = changeWorkingInventory(
    before,
    'day3-stock',
    'day3',
    transferInventorySubtree(
      inventory(before),
      'vitameno-ep',
      holder,
      'inventory-reatha'
    )
  );
  validateHistoryTransition(before, moved, '');
  expect(moved.banking).toBe(before.banking);
  expect(bankBalance(moved, holder, 'day3').ep).toBe(50);
  expect(bankBoundaryDifference(moved, 'day3')).toHaveLength(2);
  const offset = physicalMoney(changed, 50);
  expect(bankBoundaryDifference(offset, 'day3')).toEqual([]);
  expect(offset.banking).toBe(before.banking);
});

test('an already-recorded payment updates only the ledger, with safe edit/delete and idempotent retry', () => {
  const changed = physicalMoney(bankFixture(), 30);
  const request = {
    transactionId: 'named-payment',
    sessionId: 'day3',
    description: 'Repair the lantern',
    kind: 'purchase' as const,
    receiptMode: 'existing' as const,
    changes: [bankLeg(changed, 'day3', holder, 'ep', -20, 'vitameno-ep')],
  };
  const preview = previewBankTransaction(changed, request);
  expect(preview.inventory).toEqual(inventory(changed));
  expect(preview.candidate.effect).toBe('ledger');
  const paid = post(changed, request);
  expect(bankBalance(paid, holder, 'day3').ep).toBe(30);
  expect(inventory(paid)).toEqual(inventory(changed));
  expect(bankBoundaryDifference(paid, 'day3')).toEqual([]);
  expect(
    commitBankTransaction(
      paid,
      request,
      preview.fingerprint,
      'existing-operation',
      bankingAt
    )
  ).toBe(paid);
  const corrected = post(
    paid,
    {
      ...request,
      changes: [{ ...required(request.changes[0]), quantity: -15 }],
    },
    'correct-payment'
  );
  expect(bankBalance(corrected, holder, 'day3').ep).toBe(35);
  expect(inventory(corrected)).toEqual(inventory(changed));
  const deleted = post(
    corrected,
    { ...request, remove: true },
    'delete-payment'
  );
  expect(bankBalance(deleted, holder, 'day3').ep).toBe(50);
  expect(inventory(deleted)).toEqual(inventory(changed));
  expect(bankLedger(deleted).entries[0]).toEqual(bankLedger(paid).entries[0]);
});

test('an already-recorded exchange keeps the converted stacks and supports fees and partial progress', () => {
  const changed = physicalMoney(bankFixture(), 0, 24);
  const request = {
    transactionId: 'exchange-record',
    sessionId: 'day3',
    description: 'Exchange with a fee',
    kind: 'exchange' as const,
    receiptMode: 'existing' as const,
    changes: [
      bankLeg(changed, 'day3', holder, 'ep', -48, 'old-electrum'),
      bankLeg(changed, 'day3', holder, 'gp', 24, 'manual-gp'),
      {
        ...bankLeg(changed, 'day3', holder, 'ep', -2, 'old-electrum'),
        fee: true,
      },
    ],
  };
  expect(() =>
    previewBankTransaction(changed, {
      ...request,
      changes: [required(request.changes[0])],
    })
  ).toThrow('conserve');
  expect(
    previewBankProgress(changed, {
      ...request,
      changes: [required(request.changes[0])],
    }).inventory
  ).toEqual(inventory(changed));
  const exchanged = post(changed, request);
  expect(bankBalance(exchanged, holder, 'day3')).toMatchObject({
    ep: 0,
    gp: 24,
  });
  expect(inventory(exchanged)).toEqual(inventory(changed));
  expect(bankBoundaryDifference(exchanged, 'day3')).toEqual([]);
  const deleted = post(
    exchanged,
    { ...request, remove: true },
    'delete-exchange'
  );
  expect(bankBalance(deleted, holder, 'day3')).toMatchObject({ ep: 50, gp: 0 });
  expect(inventory(deleted)).toEqual(inventory(changed));
});

test('reject over-reconciliation, duplicate incoming allocation, unknown balances and stale proposals', () => {
  const changed = physicalMoney(bankFixture(), 30);
  const request = {
    transactionId: 'limits',
    sessionId: 'day3',
    description: 'Payment',
    kind: 'purchase' as const,
    receiptMode: 'existing' as const,
    changes: [bankLeg(changed, 'day3', holder, 'ep', -21, 'gone')],
  };
  expect(() => previewBankTransaction(changed, request)).toThrow('difference');
  const valid = {
    ...request,
    changes: [{ ...required(request.changes[0]), quantity: -20 }],
  };
  const preview = previewBankTransaction(changed, valid);
  const newer = physicalMoney(changed, 35);
  expect(() =>
    commitBankTransaction(newer, valid, preview.fingerprint, 'stale', bankingAt)
  ).toThrow();
  const unknown = {
    ...changed,
    banking: {
      ...bankLedger(changed),
      openings: bankLedger(changed).openings.map((o) =>
        o.holderId === holder
          ? { ...o, amounts: { ...o.amounts, ep: null } }
          : o
      ),
    },
  };
  expect(() => previewBankTransaction(unknown, valid)).toThrow();
  const exchange = physicalMoney(bankFixture(), 0, 25);
  expect(() =>
    previewBankTransaction(exchange, {
      ...valid,
      kind: 'exchange',
      changes: [
        bankLeg(exchange, 'day3', holder, 'ep', -50, 'old'),
        bankLeg(exchange, 'day3', holder, 'gp', 25, 'manual-gp'),
        bankLeg(exchange, 'day3', holder, 'gp', 25, 'manual-gp'),
      ],
    })
  ).toThrow();
});

test('ordinary banking transactions still update physical coins and reviewed replacements leave the ledger unchanged', () => {
  const before = bankFixture();
  const ordinary = bankPost(before, {
    transactionId: 'normal-payment',
    sessionId: 'day3',
    description: 'Fresh payment',
    kind: 'purchase',
    changes: [bankLeg(before, 'day3', holder, 'ep', -10, 'vitameno-ep')],
  });
  expect(holderMoney(inventory(ordinary), holder).ep).toBe(40);
  expect(bankBalance(ordinary, holder, 'day3').ep).toBe(40);
  const replacement = copy(inventory(before));
  required(replacement.characters.find((c) => c.id === holder)).inventory = [];
  expect(() =>
    startWorkingInventory(
      before,
      'day3',
      replacement,
      { kind: 'empty' },
      'replacement',
      'preserved',
      bankingAt
    )
  ).toThrow('Review');
  const review = bankingReplacementReview(before, 'day3', replacement);
  const after = startWorkingInventory(
    before,
    'day3',
    replacement,
    { kind: 'empty' },
    'replacement',
    'preserved',
    bankingAt,
    review.fingerprint
  );
  validateHistoryTransition(before, after, '');
  expect(after.banking).toBe(before.banking);
  expect(bankBalance(after, holder, 'day3').ep).toBe(50);
  expect(holderMoney(inventory(after), holder).ep).toBe(0);
});

test('existing reconciled history, automatic adjustments and old physical-only audits survive upgrade without reinterpretation', () => {
  for (const fixture of [
    legacyReconciliation.before,
    legacyReconciliation.after,
    legacyMoney,
  ]) {
    const next = parseCampaign(JSON.stringify(fixture));
    expect(next.schemaVersion).toBe(21);
    expect(next.banking).toEqual(fixture.banking);
    expect(next.workingInventories).toEqual(fixture.workingInventories);
    expect(parseCampaign(serializeCampaign(next))).toEqual(next);
    const edited = changeWorkingInventory(
      next,
      required(next.workingInventories[0]).id,
      required(next.workingInventories[0]).sessionId,
      copy(required(next.workingInventories[0]).document)
    );
    validateHistoryTransition(next, edited, '');
    expect(edited.banking).toEqual(next.banking);
  }
});

test('already-recorded payments may include change in the same denomination without counting it twice', () => {
  const changed = physicalMoney(bankFixture(), 30);
  const request = {
    transactionId: 'payment-with-change',
    sessionId: 'day3',
    description: 'Tender and returned change',
    kind: 'purchase' as const,
    receiptMode: 'existing' as const,
    changes: [
      bankLeg(changed, 'day3', holder, 'ep', -25, 'gone'),
      bankLeg(changed, 'day3', holder, 'ep', 5, 'vitameno-ep'),
    ],
  };
  const paid = post(changed, request);
  expect(bankBalance(paid, holder, 'day3').ep).toBe(30);
  expect(inventory(paid)).toEqual(inventory(changed));
  expect(bankBoundaryDifference(paid, 'day3')).toEqual([]);
});

test('a previously posted automatic adjustment keeps its original effect while later direct edits stop posting', () => {
  const base = bankFixture(),
    changed = physicalMoney(base, 40);
  const entry = {
    id: 'old-auto-adjustment',
    transactionId: 'old-auto-adjustment',
    replaces: null,
    sessionId: 'day3',
    order: 0,
    description: 'Possessions adjustment',
    kind: 'adjustment' as const,
    status: 'posted' as const,
    effect: 'inventory' as const,
    changes: [bankLeg(base, 'day3', holder, 'ep', -10, 'vitameno-ep')],
    at: bankingAt,
  };
  const original = {
    ...changed,
    schemaVersion: 19,
    banking: { ...bankLedger(base), entries: [entry] },
  };
  const upgraded = parseCampaign(JSON.stringify(original));
  expect(bankBalance(upgraded, holder, 'day3').ep).toBe(40);
  expect(upgraded.banking?.entries).toEqual([entry]);
  const next = physicalMoney(upgraded, 39);
  validateHistoryTransition(upgraded, next, '');
  expect(next.banking).toEqual(upgraded.banking);
  expect(bankBalance(next, holder, 'day3').ep).toBe(40);
  expect(bankBoundaryDifference(next, 'day3')[0]?.difference.ep).toBe(-1);
});

test('independent physical edits still reject fractional coins and unsafe denomination totals', () => {
  const doc = bankFixture();
  const invalid = copy(inventory(doc));
  const character = required(invalid.characters.find((c) => c.id === holder));
  required(character.inventory[0]).quantity = 1.5;
  expect(() =>
    changeWorkingInventory(doc, 'day3-stock', 'day3', invalid)
  ).toThrow();
  required(character.inventory[0]).quantity = Number.MAX_SAFE_INTEGER;
  character.inventory.push({
    ...newBankMoneyItem('ep', 'overflow-coins'),
    quantity: 1,
  });
  expect(() =>
    changeWorkingInventory(doc, 'day3-stock', 'day3', invalid)
  ).toThrow();
  expect(bankBalance(doc, holder, 'day3').ep).toBe(50);
});
