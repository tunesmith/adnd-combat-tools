import { redactEncumbranceDocument } from '../helpers/encumbranceDocument';
import {
  activeBankEntries,
  bankBalance,
  bankBoundaryDifference,
  bankChangesAmounts,
  bankGp,
  bankHolders,
  bankLedger,
  bankingReplacementReview,
  commitBankTransaction,
  confirmBankExtension,
  holderMoney,
  previewBankTransaction,
  previewBankProgress,
  previewBankExtension,
  saveBankOpenings,
  newBankMoneyItem,
  commitBankReconciliation,
  bankReconciliationFingerprint,
} from '../helpers/campaignBanking';
import { zeroBankAmounts } from '../helpers/campaignBankingModel';
import type { BankOpening } from '../helpers/campaignBankingModel';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import {
  changeWorkingInventory,
  startWorkingInventory,
} from '../helpers/campaignWorkingInventory';
import { transferInventorySubtree } from '../helpers/encumbranceStorage';
import { getTotalEncumbranceGp } from '../helpers/encumbranceRules';
import { encumbranceCatalogById } from '../tables/encumbranceCatalog';
import {
  sessionFingerprint,
  startNextSession,
} from '../helpers/campaignContinuity';
import {
  bankFixture,
  bankLeg,
  bankPost,
  kifuStoreVisit,
  bankingAt,
} from './fixtures/bankingKifu';
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const required = <T>(v: T | undefined): T => {
  if (v === undefined) throw Error('Fixture missing');
  return v;
};
const inventory = (doc: ReturnType<typeof bankFixture>, sessionId = 'day3') => {
  const money = required(
    doc.workingInventories.find((w) => w.sessionId === sessionId)
  ).document;
  if (money.version !== 10) throw Error('Fixture requires current inventory.');
  return money;
};
test('Castle Kifu Day3 reconstructs 329.4 gp with explicit synthetic tender and preserves the separate 50 ep', () => {
  const initial = bankFixture(),
    doc = kifuStoreVisit(),
    money = inventory(doc);
  expect(holderMoney(money, 'inventory-reatha')).toEqual({
    ...zeroBankAmounts(),
    diamond: 3,
    gp: 29,
    sp: 8,
  });
  expect(holderMoney(money, 'castle-kifu-storage')).toEqual({
    ...zeroBankAmounts(),
    sp: 1000,
  });
  expect(holderMoney(money, 'inventory-vitameno')).toEqual({
    ...zeroBankAmounts(),
    ep: 50,
  });
  expect(bankGp(holderMoney(money, 'inventory-reatha'))).toBe('329.4');
  expect(bankBoundaryDifference(doc, 'day3')).toEqual([]);
  const spending = activeBankEntries(bankLedger(doc).entries).filter((e) =>
    ['purchase', 'fee'].includes(e.kind)
  );
  expect(
    bankGp(
      spending.reduce(
        (a, e) => ({
          ...a,
          cp: (a.cp ?? 0) + (bankChangesAmounts(e.changes).cp ?? 0),
          sp: (a.sp ?? 0) + (bankChangesAmounts(e.changes).sp ?? 0),
          ep: (a.ep ?? 0) + (bankChangesAmounts(e.changes).ep ?? 0),
          gp: (a.gp ?? 0) + (bankChangesAmounts(e.changes).gp ?? 0),
          pp: (a.pp ?? 0) + (bankChangesAmounts(e.changes).pp ?? 0),
          diamond:
            (a.diamond ?? 0) + (bankChangesAmounts(e.changes).diamond ?? 0),
          emerald:
            (a.emerald ?? 0) + (bankChangesAmounts(e.changes).emerald ?? 0),
        }),
        zeroBankAmounts()
      )
    )
  ).toBe('-315.6');
  expect(
    bankLedger(doc).entries.find((e) => e.transactionId === 'scale-refund')
      ?.description
  ).toContain('inferred');
  expect(doc.workingInventories.find((w) => w.sessionId === 'day2')).toEqual(
    initial.workingInventories.find((w) => w.sessionId === 'day2')
  );
  const reatha = required(
    bankHolders(money).find((h) => h.id === 'inventory-reatha')
  );
  expect(getTotalEncumbranceGp(reatha, encumbranceCatalogById)).toBe(40);
  expect(parseCampaign(serializeCampaign(doc))).toEqual(doc);
});
test('explicit transactions, manual transfers, revision and deletion stay atomic and retry-safe', () => {
  let doc = kifuStoreVisit();
  const changed = bankPost(doc, {
    transactionId: 'manual-gp',
    sessionId: 'day3',
    description: 'Explicit income',
    kind: 'income',
    changes: [bankLeg(doc, 'day3', 'inventory-reatha', 'gp', 1, 'reatha-gp')],
  });
  expect(bankBalance(changed, 'inventory-reatha', 'day3').gp).toBe(30);
  const revision = previewBankTransaction(changed, {
    transactionId: 'manual-gp',
    sessionId: 'day3',
    description: 'Corrected quantity note',
    kind: 'income',
    changes: [
      bankLeg(changed, 'day3', 'inventory-reatha', 'gp', 2, 'reatha-gp'),
    ],
  });
  doc = commitBankTransaction(
    changed,
    {
      transactionId: 'manual-gp',
      sessionId: 'day3',
      description: 'Corrected quantity note',
      kind: 'income',
      changes: [
        bankLeg(changed, 'day3', 'inventory-reatha', 'gp', 2, 'reatha-gp'),
      ],
    },
    revision.fingerprint,
    'manual-gp-revised',
    bankingAt
  );
  validateHistoryTransition(changed, doc, '');
  expect(holderMoney(inventory(doc), 'inventory-reatha').gp).toBe(31);
  const removeRequest = {
    transactionId: 'manual-gp',
    sessionId: 'day3',
    description: 'Corrected quantity note',
    kind: 'income' as const,
    changes: revision.candidate.changes,
    remove: true,
  };
  const deletion = previewBankTransaction(doc, removeRequest);
  const removed = commitBankTransaction(
    doc,
    removeRequest,
    deletion.fingerprint,
    'manual-gp-deleted',
    bankingAt
  );
  validateHistoryTransition(doc, removed, '');
  expect(holderMoney(inventory(removed), 'inventory-reatha').gp).toBe(29);
  expect(
    commitBankTransaction(
      removed,
      removeRequest,
      deletion.fingerprint,
      'manual-gp-deleted',
      bankingAt
    )
  ).toBe(removed);
  doc = removed;
  let nextMoney = transferInventorySubtree(
    inventory(doc),
    'reatha-gp',
    'inventory-reatha',
    'inventory-vitameno'
  );
  let moved = changeWorkingInventory(doc, 'day3-stock', 'day3', nextMoney);
  validateHistoryTransition(doc, moved, '');
  expect(moved.banking).toBe(doc.banking);
  moved = bankPost(moved, {
    transactionId: 'named-transfer',
    sessionId: 'day3',
    description: 'Move recorded gold to another holder',
    kind: 'transfer',
    receiptMode: 'existing',
    changes: [
      bankLeg(moved, 'day3', 'inventory-reatha', 'gp', -29, 'reatha-gp'),
      bankLeg(moved, 'day3', 'inventory-vitameno', 'gp', 29, 'reatha-gp'),
    ],
  });
  const currentInventory = inventory(moved);
  if (currentInventory.version !== 10) throw Error('Fixture');
  nextMoney = transferInventorySubtree(
    currentInventory,
    'reatha-gp',
    'inventory-vitameno',
    'castle-kifu-storage',
    'castle-chest'
  );
  doc = moved;
  moved = changeWorkingInventory(doc, 'day3-stock', 'day3', nextMoney);
  validateHistoryTransition(doc, moved, '');
  expect(moved.banking).toBe(doc.banking);
  moved = bankPost(moved, {
    transactionId: 'named-storage-transfer',
    sessionId: 'day3',
    description: 'Store recorded gold',
    kind: 'transfer',
    receiptMode: 'existing',
    changes: [
      bankLeg(moved, 'day3', 'inventory-vitameno', 'gp', -29, 'reatha-gp'),
      bankLeg(
        moved,
        'day3',
        'castle-kifu-storage',
        'gp',
        29,
        'reatha-gp',
        'castle-chest'
      ),
    ],
  });
  expect(bankBalance(moved, 'castle-kifu-storage', 'day3').gp).toBe(29);
  expect(bankBoundaryDifference(moved, 'day3')).toEqual([]);
  const stale = previewBankTransaction(moved, {
    transactionId: 'new',
    sessionId: 'day3',
    description: 'Coin',
    kind: 'income',
    changes: [bankLeg(moved, 'day3', 'inventory-reatha', 'gp', 1, 'new-gold')],
  });
  expect(() =>
    commitBankTransaction(
      doc,
      {
        transactionId: 'new',
        sessionId: 'day3',
        description: 'Coin',
        kind: 'income',
        changes: [
          bankLeg(moved, 'day3', 'inventory-reatha', 'gp', 1, 'new-gold'),
        ],
      },
      stale.fingerprint,
      'stale',
      bankingAt
    )
  ).toThrow('changed');
  expect(() =>
    previewBankTransaction(moved, {
      transactionId: 'too-much',
      sessionId: 'day3',
      description: 'Too much',
      kind: 'purchase',
      changes: [
        bankLeg(moved, 'day3', 'castle-kifu-storage', 'gp', -30, 'reatha-gp'),
      ],
    })
  ).toThrow('Insufficient');
});
test('carry forward copies closing quantities once; earlier changes show a later discrepancy for deliberate reconciliation', () => {
  const doc = kifuStoreVisit();
  let carried = startNextSession(doc, {
    campaignId: doc.id,
    sourceSessionId: 'day3',
    sourceFingerprint: sessionFingerprint(doc, 'day3'),
    destinationId: 'day4',
    label: 'Day 4',
    combats: [],
    inventory: {
      sourceId: 'day3-stock',
      instanceId: 'day4-stock',
      checkpointId: 'day4-check',
    },
    copyNotes: false,
    capturedAt: bankingAt,
  });
  validateHistoryTransition(doc, carried, '');
  expect(
    holderMoney(inventory(carried, 'day4'), 'inventory-reatha').diamond
  ).toBe(3);
  expect(bankBoundaryDifference(carried, 'day4')).toEqual([]);
  const later = inventory(carried, 'day4');
  const edited = bankPost(carried, {
    transactionId: 'late-day3-correction',
    sessionId: 'day3',
    description: 'Earlier correction',
    kind: 'income',
    changes: [
      bankLeg(carried, 'day3', 'inventory-reatha', 'gp', 1, 'reatha-gp'),
    ],
  });
  expect(inventory(edited, 'day4')).toEqual(later);
  expect(bankBoundaryDifference(edited, 'day4')[0]?.difference.gp).toBe(-1);
  carried = commitBankReconciliation(
    edited,
    'day4',
    bankReconciliationFingerprint(edited, 'day4'),
    'reconcile-day4',
    bankingAt
  );
  validateHistoryTransition(edited, carried, '');
  expect(bankBoundaryDifference(carried, 'day4')).toEqual([]);
  const replacement = clone(inventory(carried, 'day4'));
  required(
    required(
      replacement.characters.find((h) => h.id === 'inventory-reatha')
    ).inventory.find((i) => i.id === 'reatha-gp')
  ).quantity = 28;
  expect(() =>
    startWorkingInventory(
      carried,
      'day4',
      replacement,
      { kind: 'empty' },
      'replacement',
      'replace-check',
      bankingAt
    )
  ).toThrow('comparison');
  const review = bankingReplacementReview(carried, 'day4', replacement);
  const replaced = startWorkingInventory(
    carried,
    'day4',
    replacement,
    { kind: 'empty' },
    'replacement',
    'replace-check',
    bankingAt,
    review.fingerprint
  );
  validateHistoryTransition(carried, replaced, 'restore');
  expect(replaced.banking).toBe(carried.banking);
  expect(bankBoundaryDifference(replaced, 'day4')[0]?.difference.gp).toBe(-1);
});
test('an earlier opening plus historical drafts matches a later baseline exactly, and mismatches never publish', () => {
  const original = kifuStoreVisit();
  // Start with the trustworthy Day3 closing balance and independently retained prior possessions.
  const amounts = bankHolders(inventory(original)).map((h) => ({
    id: 'later-' + h.id,
    holderId: h.id,
    sessionId: 'day3',
    phase: 'after' as const,
    amounts: holderMoney(inventory(original), h.id),
    note: 'Trusted Day 3 close',
  }));
  let doc: ReturnType<typeof bankFixture> = { ...original, banking: undefined };
  doc = saveBankOpenings(doc, amounts);
  const later = inventory(doc);
  const posted = activeBankEntries(bankLedger(original).entries);
  for (const e of posted)
    doc = bankPost(doc, {
      transactionId: 'draft-' + e.transactionId,
      sessionId: 'day3',
      description: e.description,
      kind: e.kind,
      changes: e.changes,
    });
  expect(
    activeBankEntries(bankLedger(doc).entries).every(
      (e) => e.status === 'draft'
    )
  ).toBe(true);
  expect(inventory(doc)).toEqual(later);
  const request = {
    transactionIds: posted.map((e) => 'draft-' + e.transactionId),
    openings: bankHolders(inventory(doc, 'day2')).map(
      (h): BankOpening => ({
        id: 'later-' + h.id,
        holderId: h.id,
        sessionId: 'day2',
        phase: 'after',
        amounts: holderMoney(inventory(doc, 'day2'), h.id),
        note: 'Reconstructed Day 2 closing',
      })
    ),
  };
  const preview = previewBankExtension(doc, request);
  expect(
    preview.rows.every(
      (r) => r.difference && Object.values(r.difference).every((v) => v === 0)
    )
  ).toBe(true);
  const mismatch = {
    ...request,
    openings: request.openings.map((o) =>
      o.holderId === 'castle-kifu-storage'
        ? { ...o, amounts: { ...o.amounts, sp: 999 } }
        : o
    ),
  };
  const wrong = previewBankExtension(doc, mismatch);
  expect(
    wrong.rows.find((r) => r.holderId === 'castle-kifu-storage')?.difference?.sp
  ).toBe(-1);
  expect(() =>
    confirmBankExtension(
      doc,
      mismatch,
      wrong.fingerprint,
      'wrong-extension',
      bankingAt
    )
  ).toThrow('exactly');
  const confirmed = confirmBankExtension(
    doc,
    request,
    preview.fingerprint,
    'first-extension',
    bankingAt
  );
  validateHistoryTransition(doc, confirmed, '');
  expect(inventory(confirmed)).toEqual(later);
  expect(bankBalance(confirmed, 'inventory-reatha', 'day3')).toEqual(
    amounts[0]?.amounts
  );
  expect(
    confirmBankExtension(
      confirmed,
      request,
      preview.fingerprint,
      'first-extension',
      bankingAt
    )
  ).toBe(confirmed);
  expect(parseCampaign(serializeCampaign(confirmed))).toEqual(confirmed);
});
test('only catalog-valued currency gems are money; other gem values and player privacy stay separate', () => {
  const doc = bankFixture(),
    money = inventory(doc);
  const diamond = {
    ...newBankMoneyItem('diamond', 'currency-diamond'),
    quantity: 2,
    dmNotes: 'Synthetic private treasury note',
  };
  const treasure = { ...diamond, id: 'valued-gem', valueGpOverride: 350 };
  const next = {
    ...money,
    characters: money.characters.map((h, i) =>
      i === 0 ? { ...h, inventory: [...h.inventory, diamond, treasure] } : h
    ),
  };
  expect(holderMoney(next, 'inventory-reatha').diamond).toBe(2);
  expect(holderMoney(next, 'inventory-reatha').gp).toBe(0);
  const player = redactEncumbranceDocument(next, 'inventory-reatha');
  expect(JSON.stringify(player)).not.toContain(
    'Synthetic private treasury note'
  );
  expect(JSON.stringify(player)).not.toContain('castle-kifu-storage');
  expect(
    player.character.inventory.find((i) => i.id === 'currency-diamond')
      ?.quantity
  ).toBe(2);
});

test('editing an income already spent applies only the net difference, with no transient debit', () => {
  let doc = bankFixture();
  doc = bankPost(doc, {
    transactionId: 'income',
    sessionId: 'day3',
    description: 'One coin',
    kind: 'income',
    changes: [bankLeg(doc, 'day3', 'inventory-reatha', 'gp', 1, 'income-gp')],
  });
  doc = bankPost(doc, {
    transactionId: 'expense',
    sessionId: 'day3',
    description: 'Spend the coin',
    kind: 'purchase',
    changes: [bankLeg(doc, 'day3', 'inventory-reatha', 'gp', -1, 'income-gp')],
  });
  doc = bankPost(doc, {
    transactionId: 'income',
    sessionId: 'day3',
    description: 'Correct income to two',
    kind: 'income',
    changes: [bankLeg(doc, 'day3', 'inventory-reatha', 'gp', 2, 'income-gp')],
  });
  expect(holderMoney(inventory(doc), 'inventory-reatha').gp).toBe(1);
  expect(bankBalance(doc, 'inventory-reatha', 'day3').gp).toBe(1);
});

test('unknown opening denominations can be completed without inventing zero or rewriting transactions', () => {
  let doc = bankFixture();
  if (!doc.banking) throw Error('Fixture');
  doc = {
    ...doc,
    banking: {
      ...doc.banking,
      openings: doc.banking.openings.map((o) =>
        o.holderId === 'inventory-reatha'
          ? { ...o, amounts: { ...o.amounts, gp: null } }
          : o
      ),
    },
  };
  doc = bankPost(doc, {
    transactionId: 'unknown-income',
    sessionId: 'day3',
    description: 'Recorded coin',
    kind: 'income',
    changes: [
      bankLeg(doc, 'day3', 'inventory-reatha', 'gp', 1, 'unknown-coin'),
    ],
  });
  expect(bankBalance(doc, 'inventory-reatha', 'day3').gp).toBeNull();
  const opening = required(
    doc.banking?.openings.find((o) => o.holderId === 'inventory-reatha')
  );
  const known = saveBankOpenings(doc, [
    { ...opening, amounts: { ...opening.amounts, gp: 0 } },
  ]);
  validateHistoryTransition(doc, known, '');
  expect(bankBalance(known, 'inventory-reatha', 'day3').gp).toBe(1);
  expect(known.banking?.entries).toEqual(doc.banking?.entries);
});

test('reviewed imports may relocate equal money without inventing income or losing the ledger', () => {
  const doc = kifuStoreVisit();
  const incoming = clone(inventory(doc));
  for (const holder of bankHolders(incoming))
    for (const item of holder.inventory)
      if (item.id === 'reatha-gp') item.id = 'imported-gold-stack';
  const replaced = startWorkingInventory(
    doc,
    'day3',
    incoming,
    { kind: 'empty' },
    'relocated',
    'relocation-check',
    bankingAt
  );
  validateHistoryTransition(doc, replaced, 'import');
  expect(replaced.banking).toBe(doc.banking);
  expect(bankBoundaryDifference(replaced, 'day3')).toEqual([]);
  expect(holderMoney(inventory(replaced), 'inventory-reatha')).toEqual(
    holderMoney(inventory(doc), 'inventory-reatha')
  );
});

test('ordinary transfer progress projects entered debits without allowing an unbalanced transaction to be saved', () => {
  const doc = bankFixture();
  const request = {
    transactionId: 'progress-transfer',
    sessionId: 'day3',
    description: 'Take electrum to town',
    kind: 'transfer' as const,
    changes: [
      bankLeg(doc, 'day3', 'castle-kifu-storage', 'ep', -300, 'castle-ep'),
    ],
  };
  const progress = previewBankProgress(doc, request);
  expect(holderMoney(progress.inventory, 'castle-kifu-storage')).toMatchObject({
    ep: 400,
    sp: 1000,
    gp: 250,
  });
  expect(
    inventory(doc).storageLocations[0]?.inventory.find(
      (i) => i.id === 'castle-ep'
    )?.quantity
  ).toBe(700);
  expect(() => previewBankTransaction(doc, request)).toThrow('conserve');
  expect(() =>
    commitBankTransaction(
      doc,
      request,
      progress.fingerprint,
      'cannot-post-progress',
      bankingAt
    )
  ).toThrow('conserve');
  const forged = {
    ...doc,
    banking: {
      ...bankLedger(doc),
      entries: [{ ...progress.candidate, id: 'forged', at: bankingAt }],
    },
    workingInventories: doc.workingInventories.map((w) =>
      w.sessionId === 'day3' ? { ...w, document: progress.inventory } : w
    ),
  };
  expect(() => serializeCampaign(forged)).toThrow('conserve');
});

test('exchange progress uses entered quantities before GP values balance, and fees never bypass validation', () => {
  const doc = bankFixture();
  const request = {
    transactionId: 'exchange-progress',
    sessionId: 'day3',
    description: 'Exchange electrum for diamonds',
    kind: 'exchange' as const,
    changes: [
      bankLeg(doc, 'day3', 'castle-kifu-storage', 'ep', -280, 'castle-ep'),
    ],
  };
  const progress = previewBankProgress(doc, request);
  expect(holderMoney(progress.inventory, 'castle-kifu-storage').ep).toBe(420);
  expect(bankGp(holderMoney(progress.inventory, 'castle-kifu-storage'))).toBe(
    '510'
  );
  expect(() => previewBankTransaction(doc, request)).toThrow('conserve GP');
  expect(() =>
    commitBankTransaction(
      doc,
      request,
      progress.fingerprint,
      'unbalanced-exchange',
      bankingAt
    )
  ).toThrow('conserve GP');
  const fractional = {
    ...request,
    changes: [
      bankLeg(doc, 'day3', 'castle-kifu-storage', 'ep', -1, 'castle-ep'),
      bankLeg(doc, 'day3', 'castle-kifu-storage', 'sp', 1, 'castle-sp'),
    ],
  };
  expect(
    bankGp(
      bankChangesAmounts(previewBankProgress(doc, fractional).candidate.changes)
    )
  ).toBe('-0.45');
  const fee = {
    ...request,
    changes: [
      bankLeg(doc, 'day3', 'castle-kifu-storage', 'gp', -100, 'castle-gp'),
      bankLeg(doc, 'day3', 'castle-kifu-storage', 'diamond', 1, 'new-diamond'),
      {
        ...bankLeg(doc, 'day3', 'castle-kifu-storage', 'gp', -1, 'castle-gp'),
        fee: true,
      },
    ],
  };
  const balanced = previewBankTransaction(doc, fee);
  expect(bankGp(holderMoney(balanced.inventory, 'castle-kifu-storage'))).toBe(
    '649'
  );
  expect(() =>
    previewBankProgress(doc, {
      ...fee,
      changes: fee.changes.map((c) => (c.fee ? { ...c, quantity: 1 } : c)),
    })
  ).toThrow('fee');
});
