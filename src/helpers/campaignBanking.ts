import { validHistoricalSessionMove } from './campaignSessionOrder';
import type { CampaignDocument } from './campaignDocument';
import type {
  EncumbranceDmDocument,
  EncumbranceInventoryItem,
} from '../types/encumbrance';
import {
  bankDenominations,
  zeroBankAmounts,
  bankEntrySchema,
  bankOpeningSchema,
} from './campaignBankingModel';
import type {
  bankKinds,
  BankAmounts,
  BankChange,
  BankDenomination,
  BankEntry,
  BankOpening,
  BankExtension,
  CampaignBanking,
  BankPossessionsReconciliation,
} from './campaignBankingModel';
import { encumbranceCatalogById } from '../tables/encumbranceCatalog';
import { getInventoryItemInfo } from './encumbranceRules';
import {
  inventoryHolders,
  updateHolderInventory,
  transferInventorySubtree,
} from './encumbranceStorage';
import { parseEncumbranceDocument } from './encumbranceDocument';
import { canonical, fingerprint } from './campaignSnapshots';

const catalogIds: Record<BankDenomination, string> = {
  cp: 'coin-copper',
  sp: 'coin-silver',
  ep: 'coin-electrum',
  gp: 'coin-gold',
  pp: 'coin-platinum',
  diamond: 'diamond',
  emerald: 'emerald',
};
// All supported currencies are exact multiples of a copper piece.
const bankCopperValue = (code: BankDenomination) => {
  const value = encumbranceCatalogById.get(catalogIds[code])?.valueGp;
  if (value === undefined) throw Error('Missing currency catalog entry.');
  const copper = Math.round(value * 100);
  if (Math.abs(copper / 100 - value) > Number.EPSILON)
    throw Error('Currency needs exact copper conversion.');
  return copper;
};
export function bankGp(
  amounts: Record<BankDenomination, number | bigint | null>
): string {
  if (bankDenominations.some((code) => amounts[code] === null))
    return 'Unknown';
  const copper = bankDenominations.reduce(
    (sum, code) =>
      sum + BigInt(amounts[code] ?? 0) * BigInt(bankCopperValue(code)),
    BigInt(0)
  );
  const sign = copper < BigInt(0) ? '-' : '';
  const magnitude = copper < BigInt(0) ? -copper : copper;
  const remainder = String(magnitude % BigInt(100))
    .padStart(2, '0')
    .replace(/0+$/, '');
  return (
    sign + String(magnitude / BigInt(100)) + (remainder ? '.' + remainder : '')
  );
}
function safe(value: number) {
  if (!Number.isSafeInteger(value))
    throw Error('Money quantities exceed the supported whole-number range.');
  return value;
}
function addBankAmounts(
  a: BankAmounts,
  b: BankAmounts,
  direction = 1
): BankAmounts {
  const result = zeroBankAmounts();
  for (const code of bankDenominations)
    result[code] =
      a[code] === null || b[code] === null
        ? null
        : safe((a[code] ?? 0) + direction * (b[code] ?? 0));
  return result;
}
function moneyDenomination(
  item: EncumbranceInventoryItem
): BankDenomination | undefined {
  const info = getInventoryItemInfo(item, encumbranceCatalogById);
  const value = item.valueGpOverride ?? info?.valueGp;
  return bankDenominations.find(
    (code) =>
      value === bankCopperValue(code) / 100 &&
      (item.catalogId === catalogIds[code] ||
        (info?.category === 'coins' && !['diamond', 'emerald'].includes(code)))
  );
}
export function bankHolders(document: EncumbranceDmDocument) {
  return inventoryHolders(
    document.version === 10 ? document : normalizeInventory(document)
  );
}
export function bankHolderName(doc: CampaignDocument, holderId: string) {
  return (
    [...doc.workingInventories, ...doc.inventoryCheckpoints]
      .flatMap((w) => bankHolders(w.document))
      .find((h) => h.id === holderId)?.name ?? holderId
  );
}
export function moneyStacks(document: EncumbranceDmDocument) {
  return bankHolders(document).flatMap((holder) =>
    holder.inventory.flatMap((item) => {
      const denomination = moneyDenomination(item);
      if (!denomination) return [];
      if (!Number.isSafeInteger(item.quantity) || item.quantity < 0)
        throw Error(
          'Banking requires whole nonnegative physical currency quantities.'
        );
      return [{ holderId: holder.id, denomination, item }];
    })
  );
}
export function validatePhysicalMoney(document: EncumbranceDmDocument) {
  const totals = new Map<string, number>();
  for (const stack of moneyStacks(document)) {
    const key = canonical([stack.holderId, stack.denomination]);
    totals.set(key, safe((totals.get(key) ?? 0) + stack.item.quantity));
  }
}
export function holderMoney(document: EncumbranceDmDocument, holderId: string) {
  const amounts = zeroBankAmounts();
  for (const stack of moneyStacks(document).filter(
    (s) => s.holderId === holderId
  ))
    amounts[stack.denomination] = safe(
      (amounts[stack.denomination] ?? 0) + stack.item.quantity
    );
  return amounts;
}
export function newBankMoneyItem(
  code: BankDenomination,
  id: string,
  containerId: string | null = null
): EncumbranceInventoryItem {
  const catalog = encumbranceCatalogById.get(catalogIds[code]);
  if (!catalog) throw Error('Currency catalog entry missing.');
  return {
    id,
    catalogId: catalog.id,
    quantity: 1,
    containerId,
    day: 0,
    name: '$ - ' + catalog.name,
    playerNotes: '',
    playerKnowsValue: true,
    playerMagicKnowledge: 'known-mundane',
  };
}
export const bankLedger = (doc: CampaignDocument): CampaignBanking =>
  doc.banking ?? { version: 1, openings: [], entries: [], extensions: [] };
export const activeBankEntries = (entries: BankEntry[]) => {
  const replaced = new Set(entries.map((e) => e.replaces));
  return entries.filter((e) => !replaced.has(e.id));
};
function sessionIndex(doc: CampaignDocument, id: string) {
  const index = doc.sessions.findIndex((s) => s.id === id);
  if (index < 0) throw Error('Banking session is missing.');
  return index;
}
function atOrAfterOpening(
  doc: CampaignDocument,
  sessionId: string,
  opening: BankOpening
) {
  const difference =
    sessionIndex(doc, sessionId) - sessionIndex(doc, opening.sessionId);
  return difference > 0 || (difference === 0 && opening.phase === 'before');
}
export function bankChangesAmounts(changes: BankChange[], holderId?: string) {
  const amounts = zeroBankAmounts();
  for (const change of changes.filter(
    (c) => holderId === undefined || c.holderId === holderId
  ))
    amounts[change.denomination] = safe(
      (amounts[change.denomination] ?? 0) + change.quantity
    );
  return amounts;
}
export function bankBalance(
  doc: CampaignDocument,
  holderId: string,
  sessionId: string,
  phase: 'before' | 'after' = 'after'
): BankAmounts {
  const ledger = bankLedger(doc),
    opening = ledger.openings.find((o) => o.holderId === holderId);
  const unknown: BankAmounts = {
    cp: null,
    sp: null,
    ep: null,
    gp: null,
    pp: null,
    diamond: null,
    emerald: null,
  };
  if (
    !opening ||
    sessionIndex(doc, sessionId) < sessionIndex(doc, opening.sessionId) ||
    (sessionId === opening.sessionId &&
      phase === 'before' &&
      opening.phase === 'after')
  )
    return unknown;
  return activeBankEntries(ledger.entries)
    .filter(
      (e) =>
        e.status === 'posted' &&
        atOrAfterOpening(doc, e.sessionId, opening) &&
        (sessionIndex(doc, e.sessionId) < sessionIndex(doc, sessionId) ||
          (e.sessionId === sessionId && phase === 'after'))
    )
    .reduce(
      (sum, e) => addBankAmounts(sum, bankChangesAmounts(e.changes, holderId)),
      opening.amounts
    );
}
export function bankBoundaryDifference(
  doc: CampaignDocument,
  sessionId: string,
  document?: EncumbranceDmDocument
) {
  const inventory =
    document ??
    doc.workingInventories.find((w) => w.sessionId === sessionId)?.document;
  if (!inventory) return [];
  const holders = new Set([
    ...bankHolders(inventory).map((h) => h.id),
    ...bankLedger(doc).openings.map((o) => o.holderId),
  ]);
  return Array.from(holders).flatMap((holderId) => {
    const expected = bankBalance(doc, holderId, sessionId),
      actual = holderMoney(inventory, holderId);
    const difference = addBankAmounts(actual, expected, -1);
    return bankDenominations.some(
      (c) => difference[c] !== null && difference[c] !== 0
    )
      ? [{ holderId, expected, actual, difference }]
      : [];
  });
}
function moneySignature(document: EncumbranceDmDocument) {
  return moneyStacks(document)
    .map((s) => ({ ...s, item: { ...s.item } }))
    .sort(
      (a, b) =>
        a.holderId.localeCompare(b.holderId) ||
        a.item.id.localeCompare(b.item.id)
    );
}
function inventoryMoneyChanges(
  before: EncumbranceDmDocument,
  after: EncumbranceDmDocument
): BankChange[] {
  const old = moneyStacks(before),
    next = moneyStacks(after);
  const key = (s: typeof old[number]) =>
    canonical([s.holderId, s.denomination, s.item.id, s.item.containerId]);
  const keys = Array.from(new Set([...old, ...next].map(key)));
  return keys.flatMap((k) => {
    const a = old.find((s) => key(s) === k),
      b = next.find((s) => key(s) === k);
    const quantity = safe((b?.item.quantity ?? 0) - (a?.item.quantity ?? 0));
    const source = quantity < 0 ? a : b;
    return quantity && source
      ? [
          {
            holderId: source.holderId,
            denomination: source.denomination,
            item: { ...source.item },
            quantity,
          },
        ]
      : [];
  });
}
function normalizeInventory(inventory: EncumbranceDmDocument) {
  const parsed = parseEncumbranceDocument(JSON.stringify(inventory));
  if (parsed.kind !== 'adnd-encumbrance-dm' || parsed.version !== 10)
    throw Error('Banking requires campaign DM possessions.');
  return parsed;
}
function applyBankChanges(
  inventory: EncumbranceDmDocument,
  changes: BankChange[]
): EncumbranceDmDocument {
  let next = normalizeInventory(inventory);
  const handled = new Set<BankChange>();
  for (const negative of changes.filter((c) => c.quantity < 0)) {
    const positive = changes.find(
      (c) =>
        c.quantity === -negative.quantity &&
        c.item.id === negative.item.id &&
        c.holderId !== negative.holderId &&
        c.denomination === negative.denomination
    );
    const source = inventoryHolders(next)
      .find((h) => h.id === negative.holderId)
      ?.inventory.find((i) => i.id === negative.item.id);
    if (positive && source && source.quantity === -negative.quantity) {
      next = transferInventorySubtree(
        next,
        source.id,
        negative.holderId,
        positive.holderId,
        positive.item.containerId
      );
      handled.add(negative);
      handled.add(positive);
    }
  }
  // Debit before credit so a payment never spends change that has not arrived.
  for (const change of [
    ...changes.filter((c) => c.quantity < 0),
    ...changes.filter((c) => c.quantity > 0),
  ]) {
    if (handled.has(change)) continue;
    if (moneyDenomination(change.item) !== change.denomination)
      throw Error('Currency entry and denomination disagree.');
    next = updateHolderInventory(next, change.holderId, (items) => {
      const current = items.find((i) => i.id === change.item.id);
      if (
        current &&
        (moneyDenomination(current) !== change.denomination ||
          current.containerId !== change.item.containerId)
      )
        throw Error(
          'Money stack moved or changed. Choose its current location.'
        );
      if (!current && change.quantity < 0)
        throw Error('Selected money stack no longer exists.');
      const quantity = safe((current?.quantity ?? 0) + change.quantity);
      if (quantity < 0)
        throw Error('Insufficient money in the selected stack.');
      if (current && quantity === 0)
        return items.filter((i) => i.id !== current.id);
      return current
        ? items.map((i) => (i.id === current.id ? { ...i, quantity } : i))
        : [...items, { ...change.item, quantity }];
    });
  }
  return normalizeInventory(next);
}
function validateChanges(entry: BankEntry, progressOnly = false) {
  if (!entry.description.trim())
    throw Error('Enter a transaction description.');
  const total = bankChangesAmounts(entry.changes);
  if (entry.receiptMode === 'existing') {
    const transfer = entry.kind === 'transfer';
    const settlement = ['purchase', 'fee', 'exchange'].includes(entry.kind);
    if (
      entry.effect !== 'ledger' ||
      (!transfer &&
        !settlement &&
        !['income', 'refund'].includes(entry.kind)) ||
      entry.changes.some(
        (c) =>
          !Number.isSafeInteger(c.quantity) ||
          c.quantity === 0 ||
          (c.fee && entry.kind !== 'exchange') ||
          (!transfer && !settlement && c.quantity < 0)
      )
    )
      throw Error(
        'Already recorded in possessions supports income, payments, transfers and exchanges.'
      );
    if (transfer) validateExistingTransferPairs(entry.changes);
    const keys = Array.from(new Set(entry.changes.map(receiptStackKey)));
    for (const key of keys) {
      const parts = entry.changes.filter((c) => receiptStackKey(c) === key),
        snapshot = parts[0]?.item;
      if (
        !snapshot ||
        parts.some((c) => canonical(c.item) !== canonical(snapshot)) ||
        parts.reduce((sum, c) => safe(sum + Math.abs(c.quantity)), 0) >
          snapshot.quantity
      )
        throw Error('Allocations exceed their recorded quantity evidence.');
    }
  }
  if (
    entry.changes.some(
      (c) =>
        (c.quantity === 0 && entry.kind !== 'reconciliation') ||
        moneyDenomination(c.item) !== c.denomination
    )
  )
    throw Error(
      'Use whole signed quantities against compatible currency entries.'
    );
  if (
    entry.kind === 'transfer' &&
    !progressOnly &&
    bankDenominations.some((c) => total[c] !== 0)
  )
    throw Error('A transfer must conserve each denomination.');
  if (entry.kind === 'exchange') {
    const fee = entry.changes.filter((c) => c.fee);
    if (
      fee.some((c) => c.quantity >= 0) ||
      (!progressOnly &&
        bankGp(bankChangesAmounts(entry.changes.filter((c) => !c.fee))) !== '0')
    )
      throw Error(
        'An exchange must conserve GP value. Mark any fee as a separate outgoing change.'
      );
  } else if (entry.changes.some((c) => c.fee))
    throw Error('Separate fee changes belong to exchanges.');
}
export interface BankTransactionRequest {
  transactionId: string;
  sessionId: string;
  description: string;
  kind: typeof bankKinds[number];
  changes: BankChange[];
  remove?: boolean;
  receiptMode?: 'existing';
}
function currentTransaction(doc: CampaignDocument, id: string) {
  return activeBankEntries(bankLedger(doc).entries).find(
    (e) => e.transactionId === id
  );
}
function historicalBankTransaction(
  doc: CampaignDocument,
  entry: Pick<BankEntry, 'sessionId' | 'changes'>
) {
  return bankLedger(doc).openings.some(
    (o) =>
      entry.changes.some((c) => c.holderId === o.holderId) &&
      !atOrAfterOpening(doc, entry.sessionId, o)
  );
}
const receiptStackKey = (
  change: Pick<BankChange, 'holderId' | 'denomination'> & {
    item: { id: string };
  }
) => canonical([change.holderId, change.denomination, change.item.id]);

/**
 * Reserve known money once across a holder's stacks. Stack-specific ledger
 * changes anchor coverage first. An aggregate opening or reconciliation then
 * covers the remaining stacks in inventory order.
 */
export function existingMoneyAvailability(
  doc: CampaignDocument,
  sessionId: string,
  transactionId?: string
) {
  const ledger = bankLedger(doc);
  const previous = transactionId
    ? currentTransaction(doc, transactionId)
    : undefined;
  const reference = doc.workingInventories.find(
    (w) => w.sessionId === sessionId
  )?.document;
  if (!reference)
    throw Error('Create or import this session’s possessions first.');
  const basis: CampaignDocument = previous
    ? {
        ...doc,
        banking: {
          ...ledger,
          entries: ledger.entries.filter(
            (e) => e.transactionId !== transactionId
          ),
        },
      }
    : doc;
  const actual = moneyStacks(reference);
  const prior =
    previous?.receiptMode === 'existing' && previous.status !== 'void'
      ? previous.changes.filter((change) => change.quantity > 0)
      : [];
  const holders = Array.from(
    new Set([...actual.map((s) => s.holderId), ...prior.map((c) => c.holderId)])
  );
  const result: {
    holderId: string;
    denomination: BankDenomination;
    item: EncumbranceInventoryItem;
    currentQuantity: number;
    previousAllocation: number;
    available: number | null;
  }[] = [];
  const limits: { holderId: string; amounts: BankAmounts }[] = [];
  for (const holderId of holders) {
    const opening = ledger.openings.find((o) => o.holderId === holderId);
    const expected = bankBalance(doc, holderId, sessionId);
    const withoutPrevious = bankBalance(basis, holderId, sessionId);
    const physical = holderMoney(reference, holderId);
    const previousTotal = bankChangesAmounts(prior, holderId);
    const amounts = zeroBankAmounts();
    const explained = new Map<string, number>();
    for (const entry of activeBankEntries(bankLedger(basis).entries).filter(
      (e) =>
        e.status === 'posted' &&
        opening &&
        atOrAfterOpening(doc, e.sessionId, opening) &&
        sessionIndex(doc, e.sessionId) <= sessionIndex(doc, sessionId) &&
        (e.effect === 'inventory' || e.receiptMode === 'existing')
    ))
      for (const change of entry.changes.filter(
        (c) => c.holderId === holderId
      )) {
        const key = receiptStackKey(change);
        explained.set(key, safe((explained.get(key) ?? 0) + change.quantity));
      }
    for (const code of bankDenominations) {
      const current = actual.filter(
        (s) => s.holderId === holderId && s.denomination === code
      );
      let budget =
        withoutPrevious[code] === null
          ? null
          : Math.max(0, withoutPrevious[code] ?? 0);
      const coverage = new Map<string, number>();
      // Evidence explains a specific stack before aggregate balances use it.
      if (budget !== null) {
        for (const stack of current) {
          const key = receiptStackKey(stack);
          const covered = Math.min(
            stack.item.quantity,
            Math.max(0, explained.get(key) ?? 0),
            budget
          );
          coverage.set(key, covered);
          budget -= covered;
        }
        for (const stack of current) {
          const key = receiptStackKey(stack),
            covered = coverage.get(key) ?? 0;
          const more = Math.min(stack.item.quantity - covered, budget);
          coverage.set(key, covered + more);
          budget -= more;
        }
      }
      amounts[code] =
        expected[code] === null
          ? null
          : safe(
              Math.max(0, (physical[code] ?? 0) - (expected[code] ?? 0)) +
                (previousTotal[code] ?? 0)
            );
      for (const stack of current) {
        const key = receiptStackKey(stack);
        const previousAllocation = prior
          .filter((c) => receiptStackKey(c) === key)
          .reduce((sum, c) => safe(sum + c.quantity), 0);
        result.push({
          ...stack,
          currentQuantity: stack.item.quantity,
          previousAllocation,
          available:
            budget === null
              ? null
              : Math.max(
                  previousAllocation,
                  stack.item.quantity - (coverage.get(key) ?? 0)
                ),
        });
      }
      for (const change of prior.filter(
        (c) =>
          c.holderId === holderId &&
          c.denomination === code &&
          !current.some((s) => receiptStackKey(s) === receiptStackKey(c))
      )) {
        const key = receiptStackKey(change);
        if (result.some((r) => receiptStackKey(r) === key)) continue;
        const previousAllocation = prior
          .filter((c) => receiptStackKey(c) === key)
          .reduce((sum, c) => safe(sum + c.quantity), 0);
        result.push({
          ...change,
          currentQuantity: 0,
          previousAllocation,
          available: previousAllocation,
        });
      }
    }
    limits.push({ holderId, amounts });
  }
  return { stacks: result, limits };
}

function validateExistingTransferPairs(changes: BankChange[]) {
  if (
    changes.length % 2 !== 0 ||
    changes.some((change, index) => {
      if (index % 2 !== 0) return false;
      const incoming = changes[index + 1];
      return (
        !incoming ||
        change.quantity >= 0 ||
        incoming.quantity <= 0 ||
        change.quantity !== -incoming.quantity ||
        change.denomination !== incoming.denomination ||
        change.holderId === incoming.holderId
      );
    })
  )
    throw Error(
      'Pair each outgoing holder with an equal incoming quantity of the same denomination.'
    );
}

export function bankBalanceSourceItem(
  holderId: string,
  code: BankDenomination,
  quantity: number
) {
  return {
    ...newBankMoneyItem(code, 'ledger-balance:' + holderId + ':' + code),
    name: 'Recorded ledger balance',
    quantity: Math.max(1, quantity),
  };
}

export function existingTransferSources(
  doc: CampaignDocument,
  sessionId: string,
  transactionId?: string
) {
  const ledger = bankLedger(doc),
    previous = transactionId
      ? currentTransaction(doc, transactionId)
      : undefined;
  const working = doc.workingInventories.find((w) => w.sessionId === sessionId);
  if (!working)
    throw Error('Create or import this session’s possessions first.');
  const prior =
    previous?.receiptMode === 'existing' &&
    previous.kind === 'transfer' &&
    previous.status !== 'void'
      ? previous.changes.filter((c) => c.quantity < 0)
      : [];
  const holders = Array.from(
    new Set([
      ...ledger.openings.map((o) => o.holderId),
      ...bankHolders(working.document).map((h) => h.id),
      ...prior.map((c) => c.holderId),
    ])
  );
  const basis = previous
    ? {
        ...doc,
        banking: {
          ...ledger,
          entries: ledger.entries.filter(
            (e) => e.transactionId !== previous.transactionId
          ),
        },
      }
    : doc;
  return holders.map((holderId) => {
    const recorded = bankBalance(doc, holderId, sessionId),
      physical = holderMoney(working.document, holderId);
    const old = bankChangesAmounts(prior, holderId),
      before = bankBalance(basis, holderId, sessionId);
    const amounts = zeroBankAmounts();
    for (const code of bankDenominations)
      amounts[code] =
        recorded[code] === null
          ? null
          : safe(
              Math.max(0, (recorded[code] ?? 0) - (physical[code] ?? 0)) -
                (old[code] ?? 0)
            );
    return { holderId, amounts, recorded: before };
  });
}

function reviewedExistingTransferChanges(
  doc: CampaignDocument,
  request: BankTransactionRequest,
  previous: BankEntry | undefined
) {
  validateExistingTransferPairs(request.changes);
  const sources = existingTransferSources(
    doc,
    request.sessionId,
    previous?.transactionId
  );
  const outgoing = request.changes.filter((c) => c.quantity < 0);
  for (const source of sources) {
    const proposed = bankChangesAmounts(outgoing, source.holderId);
    for (const code of bankDenominations)
      if (
        (proposed[code] ?? 0) < 0 &&
        (source.amounts[code] === null ||
          -(proposed[code] ?? 0) > (source.amounts[code] ?? 0))
      )
        throw Error(
          `The ${code} transfer exceeds this holder’s remaining outgoing difference.`
        );
  }
  if (
    outgoing.some(
      (c) => !sources.some((source) => source.holderId === c.holderId)
    )
  )
    throw Error('Choose a holder with recorded money to transfer.');
  const incoming = reviewedReceiptChanges(
    doc,
    { ...request, changes: request.changes.filter((c) => c.quantity > 0) },
    previous
  );
  let incomingIndex = 0;
  return request.changes.map((change) => {
    if (change.quantity > 0) {
      const reviewed = incoming[incomingIndex++];
      if (!reviewed) throw Error('Incoming allocation changed.');
      return reviewed;
    }
    const source = sources.find((s) => s.holderId === change.holderId);
    const quantity = source?.recorded[change.denomination];
    if (quantity === undefined || quantity === null || quantity < 0)
      throw Error('Establish known balances before recording this transfer.');
    const oldParts =
      previous?.changes.filter(
        (c) =>
          c.quantity < 0 &&
          c.holderId === change.holderId &&
          c.denomination === change.denomination
      ) ?? [];
    const oldQuantity = oldParts.reduce((sum, c) => safe(sum - c.quantity), 0);
    const requested = outgoing
      .filter(
        (c) =>
          c.holderId === change.holderId &&
          c.denomination === change.denomination
      )
      .reduce((sum, c) => safe(sum - c.quantity), 0);
    const evidence = oldParts[0]?.item;
    return {
      ...change,
      item:
        evidence && requested <= oldQuantity
          ? { ...evidence }
          : bankBalanceSourceItem(
              change.holderId,
              change.denomination,
              quantity
            ),
    };
  });
}

export function existingSettlementAvailability(
  doc: CampaignDocument,
  sessionId: string,
  transactionId?: string
) {
  const ledger = bankLedger(doc),
    previous = transactionId
      ? currentTransaction(doc, transactionId)
      : undefined;
  const working = doc.workingInventories.find((w) => w.sessionId === sessionId);
  if (!working)
    throw Error('Create or import this session’s possessions first.');
  const basis = previous
    ? {
        ...doc,
        banking: {
          ...ledger,
          entries: ledger.entries.filter(
            (e) => e.transactionId !== transactionId
          ),
        },
      }
    : doc;
  const prior =
    previous?.receiptMode === 'existing' && previous.status !== 'void'
      ? previous.changes
      : [];
  const actual = moneyStacks(working.document);
  const holders = Array.from(
    new Set([
      ...bankHolders(working.document).map((h) => h.id),
      ...ledger.openings.map((o) => o.holderId),
      ...prior.map((c) => c.holderId),
    ])
  );
  const limits = holders.map((holderId) => {
    const recorded = bankBalance(basis, holderId, sessionId),
      physical = holderMoney(working.document, holderId),
      old = bankChangesAmounts(prior, holderId);
    const incoming = zeroBankAmounts(),
      outgoing = zeroBankAmounts();
    for (const code of bankDenominations) {
      const before = recorded[code];
      incoming[code] =
        before === null
          ? null
          : Math.max(0, (physical[code] ?? 0) - before, old[code] ?? 0);
      outgoing[code] =
        before === null
          ? null
          : Math.max(0, before - (physical[code] ?? 0), -(old[code] ?? 0));
    }
    return { holderId, recorded, physical, incoming, outgoing };
  });
  const outgoing = limits.flatMap((limit) =>
    bankDenominations.map((denomination) => ({
      holderId: limit.holderId,
      denomination,
      item: bankBalanceSourceItem(
        limit.holderId,
        denomination,
        limit.recorded[denomination] ?? 0
      ),
      currentQuantity: 0,
      previousAllocation: 0,
      available: limit.outgoing[denomination],
      direction: 'outgoing' as const,
    }))
  );
  const incoming = [
    ...actual,
    ...prior.filter(
      (c) =>
        c.quantity > 0 &&
        !actual.some((a) => receiptStackKey(a) === receiptStackKey(c))
    ),
  ].map((stack) => {
    const old = prior.filter(
        (c) => c.quantity > 0 && receiptStackKey(c) === receiptStackKey(stack)
      ),
      previousAllocation = old.reduce((n, c) => safe(n + c.quantity), 0);
    const current = actual.find(
      (a) => receiptStackKey(a) === receiptStackKey(stack)
    );
    return {
      ...stack,
      item: current?.item ?? stack.item,
      currentQuantity: current?.item.quantity ?? 0,
      previousAllocation,
      available: Math.max(current?.item.quantity ?? 0, previousAllocation),
      direction: 'incoming' as const,
    };
  });
  return { limits, outgoing, incoming };
}
function reviewedExistingSettlementChanges(
  doc: CampaignDocument,
  request: BankTransactionRequest,
  previous: BankEntry | undefined
) {
  const availability = existingSettlementAvailability(
    doc,
    request.sessionId,
    previous?.transactionId
  );
  for (const holderId of Array.from(
    new Set(request.changes.map((c) => c.holderId))
  )) {
    const limit = availability.limits.find((s) => s.holderId === holderId);
    if (!limit) throw Error('Choose a holder with recorded or existing money.');
    const proposed = bankChangesAmounts(request.changes, holderId);
    for (const code of bankDenominations) {
      const value = proposed[code] ?? 0;
      if (!value) continue;
      const allowed = value < 0 ? limit.outgoing[code] : limit.incoming[code];
      if (allowed === null || Math.abs(value) > (allowed ?? 0))
        throw Error(
          `The ${code} transaction exceeds this holder’s remaining ${
            value < 0 ? 'outgoing' : 'incoming'
          } reconciliation difference.`
        );
    }
  }
  const positive = request.changes.filter((c) => c.quantity > 0),
    negative = request.changes.filter((c) => c.quantity < 0);
  return request.changes.map((change) => {
    if (!Number.isSafeInteger(change.quantity) || !change.quantity)
      throw Error('Use nonzero whole signed quantities.');
    if (change.quantity < 0) {
      const source = availability.outgoing.find(
        (c) =>
          c.holderId === change.holderId &&
          c.denomination === change.denomination
      );
      const old =
        previous?.changes.filter(
          (c) =>
            c.quantity < 0 &&
            c.holderId === change.holderId &&
            c.denomination === change.denomination
        ) ?? [];
      const amount = negative
        .filter(
          (c) =>
            c.holderId === change.holderId &&
            c.denomination === change.denomination
        )
        .reduce((sum, c) => safe(sum - c.quantity), 0);
      const priorAmount = old.reduce((sum, c) => safe(sum - c.quantity), 0),
        evidence = old[0]?.item;
      if (!source || source.available === null)
        throw Error(
          'Establish known balances before recording an outgoing transaction.'
        );
      const item = evidence && amount <= priorAmount ? evidence : source.item;
      if (amount > item.quantity)
        throw Error(
          'Outgoing quantities exceed the recorded balance evidence. Record the net currency change.'
        );
      return { ...change, item: { ...item } };
    }
    const source = availability.incoming.find(
      (c) => receiptStackKey(c) === receiptStackKey(change)
    );
    const amount = positive
      .filter((c) => receiptStackKey(c) === receiptStackKey(change))
      .reduce((sum, c) => safe(sum + c.quantity), 0);
    if (!source || amount > source.available)
      throw Error('Incoming allocations exceed the existing stack evidence.');
    const old = previous?.changes.find(
      (c) => c.quantity > 0 && receiptStackKey(c) === receiptStackKey(change)
    );
    return {
      ...change,
      item: {
        ...(old && amount <= source.previousAllocation
          ? old.item
          : source.item),
      },
    };
  });
}

function reviewedReceiptChanges(
  doc: CampaignDocument,
  request: BankTransactionRequest,
  previous: BankEntry | undefined
): BankChange[] {
  const availability = existingMoneyAvailability(
    doc,
    request.sessionId,
    previous?.transactionId
  );
  const byStack = new Map<string, number>();
  for (const change of request.changes) {
    if (
      !Number.isSafeInteger(change.quantity) ||
      change.quantity <= 0 ||
      change.fee
    )
      throw Error(
        'Already recorded receipts require positive whole quantities.'
      );
    const key = receiptStackKey(change);
    byStack.set(key, safe((byStack.get(key) ?? 0) + change.quantity));
  }
  for (const [key, quantity] of Array.from(byStack.entries())) {
    const source = availability.stacks.find((s) => receiptStackKey(s) === key);
    if (!source) throw Error('Choose an existing compatible money stack.');
    if (source.available === null)
      throw Error(
        'Establish a known opening before allocating existing money.'
      );
    if (quantity > source.available)
      throw Error(
        `Only ${source.available.toLocaleString()} remains available for this stack at this boundary.`
      );
    if (
      quantity > source.previousAllocation &&
      quantity > source.currentQuantity
    )
      throw Error(
        'Additional allocations require current coins in the selected stack.'
      );
  }
  for (const limit of availability.limits) {
    const proposed = bankChangesAmounts(request.changes, limit.holderId);
    for (const code of bankDenominations)
      if (
        (proposed[code] ?? 0) > 0 &&
        (limit.amounts[code] === null ||
          (proposed[code] ?? 0) > (limit.amounts[code] ?? 0))
      )
        throw Error(
          `The ${code} receipt exceeds this holder’s remaining reconciliation difference.`
        );
  }
  return request.changes.map((change) => {
    const key = receiptStackKey(change);
    const source = availability.stacks.find((s) => receiptStackKey(s) === key);
    if (!source) throw Error('Existing money stack changed.');
    const quantity = byStack.get(key) ?? 0;
    const old = previous?.changes.find((c) => receiptStackKey(c) === key);
    // Keep the recorded location/value evidence when merely correcting an
    // allocation after its physical stack has been spent, moved, or merged.
    const item =
      old && quantity <= source.previousAllocation ? old.item : source.item;
    return { ...change, item: { ...item } };
  });
}
export function previewBankTransaction(
  doc: CampaignDocument,
  request: BankTransactionRequest
) {
  return projectBankTransaction(doc, request);
}

/** Read-only physical progress for transfers and exchanges, including unbalanced drafts. */
export function previewBankProgress(
  doc: CampaignDocument,
  request: BankTransactionRequest
) {
  return projectBankTransaction(doc, request, true);
}

function projectBankTransaction(
  doc: CampaignDocument,
  request: BankTransactionRequest,
  progress = false
) {
  const ledger = bankLedger(doc),
    previous = currentTransaction(doc, request.transactionId);
  sessionIndex(doc, request.sessionId);
  if (
    previous &&
    (previous.sessionId !== request.sessionId || previous.status === 'void')
  )
    throw Error('Select a current transaction in its original session.');
  const working = doc.workingInventories.find(
    (w) => w.sessionId === request.sessionId
  );
  if (!working)
    throw Error('Create or import this session’s possessions first.');
  if (previous?.receiptMode !== request.receiptMode && previous)
    throw Error(
      'A saved transaction keeps its possessions mode. Delete it before recording it in a different mode.'
    );
  if (
    previous?.receiptMode === 'existing' &&
    (previous.kind === 'transfer') !== (request.kind === 'transfer')
  )
    throw Error(
      'A saved existing-money transaction keeps its receipt or transfer type.'
    );
  const status = request.remove
    ? 'void'
    : historicalBankTransaction(doc, request)
    ? 'draft'
    : 'posted';
  if (previous?.status === 'posted' && status === 'draft')
    throw Error('A recorded transaction cannot move before its opening.');
  const changes =
    request.remove && previous
      ? previous.changes
      : request.receiptMode === 'existing'
      ? request.kind === 'transfer'
        ? reviewedExistingTransferChanges(doc, request, previous)
        : ['purchase', 'fee', 'exchange'].includes(request.kind)
        ? reviewedExistingSettlementChanges(doc, request, previous)
        : reviewedReceiptChanges(doc, request, previous)
      : request.changes;
  const candidate: BankEntry = {
    id: 'preview',
    transactionId: request.transactionId,
    replaces: previous?.id ?? null,
    sessionId: request.sessionId,
    order:
      previous?.order ??
      Math.max(
        -1,
        ...activeBankEntries(ledger.entries)
          .filter((e) => e.sessionId === request.sessionId)
          .map((e) => e.order)
      ) + 1,
    description: request.description,
    kind: request.kind,
    status,
    effect:
      request.receiptMode === 'existing'
        ? 'ledger'
        : previous?.effect ?? (status === 'draft' ? 'ledger' : 'inventory'),
    ...(request.receiptMode ? { receiptMode: request.receiptMode } : {}),
    changes,
    at: '2000-01-01T00:00:00.000Z',
  };
  const physicalProgress =
    progress &&
    (candidate.kind === 'transfer' || candidate.kind === 'exchange') &&
    !request.remove;
  validateChanges(candidate, physicalProgress);
  let inventory = working.document;
  if (candidate.effect === 'inventory') {
    const deltas = [
      ...(previous?.effect === 'inventory'
        ? previous.changes.map((c) => ({ ...c, quantity: -c.quantity }))
        : []),
      ...(status !== 'void' ? changes : []),
    ];
    const keys = Array.from(
      new Set(
        deltas.map((c) =>
          canonical([c.holderId, c.denomination, c.item.id, c.item.containerId])
        )
      )
    );
    const net = keys.flatMap((key) => {
      const matching = deltas.filter(
        (c) =>
          canonical([
            c.holderId,
            c.denomination,
            c.item.id,
            c.item.containerId,
          ]) === key
      );
      const source = matching[matching.length - 1];
      const quantity = matching.reduce((sum, c) => safe(sum + c.quantity), 0);
      return source && quantity ? [{ ...source, quantity }] : [];
    });
    inventory = applyBankChanges(inventory, previous ? net : changes);
  }
  const projection = {
    ...doc,
    banking: { ...ledger, entries: [...ledger.entries, candidate] },
  };
  if (!physicalProgress) {
    assertBankCutoffs(projection);
    validateBankBalances(projection);
  }
  return {
    candidate,
    inventory,
    projection,
    fingerprint: fingerprint({
      request,
      banking: ledger,
      money: moneySignature(working.document),
      sessions: doc.sessions.map((s) => s.id),
    }),
  };
}
export function commitBankTransaction(
  doc: CampaignDocument,
  request: BankTransactionRequest,
  expected: string,
  operationId: string,
  at: string
): CampaignDocument {
  const ledger = bankLedger(doc);
  if (ledger.entries.some((e) => e.id === operationId)) return doc;
  const preview = previewBankTransaction(doc, request);
  if (preview.fingerprint !== expected)
    throw Error('Money or ledger changed. Review the transaction again.');
  const entry = bankEntrySchema.parse({
    ...preview.candidate,
    id: operationId,
    at,
  });
  const next: CampaignDocument = {
    ...doc,
    banking: { ...ledger, entries: [...ledger.entries, entry] },
    workingInventories: doc.workingInventories.map((w) =>
      w.sessionId === entry.sessionId
        ? { ...w, document: preview.inventory }
        : w
    ),
  };
  assertBankCutoffs(next);
  return next;
}

function completesUnknownOpening(previous: BankOpening, next: BankOpening) {
  return (
    previous.id === next.id &&
    previous.holderId === next.holderId &&
    previous.sessionId === next.sessionId &&
    previous.phase === next.phase &&
    bankDenominations.every(
      (code) =>
        previous.amounts[code] === null ||
        previous.amounts[code] === next.amounts[code]
    )
  );
}
export function saveBankOpenings(
  doc: CampaignDocument,
  openings: BankOpening[]
): CampaignDocument {
  const ledger = bankLedger(doc);
  if (new Set(openings.map((o) => o.holderId)).size !== openings.length)
    throw Error('One opening is allowed per holder.');
  for (const proposed of openings) {
    bankOpeningSchema.parse(proposed);
    sessionIndex(doc, proposed.sessionId);
    const previous = ledger.openings.find(
      (o) => o.holderId === proposed.holderId
    );
    if (
      previous &&
      canonical(proposed) !== canonical(previous) &&
      !completesUnknownOpening(previous, proposed) &&
      (ledger.entries.some(
        (e) =>
          e.status === 'posted' &&
          e.changes.some((c) => c.holderId === previous.holderId)
      ) ||
        ledger.extensions.some((e) =>
          e.openings.some((o) => o.previous.holderId === previous.holderId)
        ))
    )
      throw Error(
        'Reviewed opening balances are fixed. Use Extend history backward.'
      );
    if (
      !doc.workingInventories.some((w) =>
        bankHolders(w.document).some((h) => h.id === proposed.holderId)
      )
    )
      throw Error('Choose an inventory holder or storage location.');
  }
  const next = {
    ...doc,
    banking: {
      ...ledger,
      openings: [
        ...ledger.openings.filter(
          (o) => !openings.some((n) => n.holderId === o.holderId)
        ),
        ...openings,
      ],
    },
  };
  validateBankBalances(next);
  return next;
}

function bankReconciliationChanges(
  doc: CampaignDocument,
  sessionId: string,
  inventory: EncumbranceDmDocument
): BankChange[] {
  return bankBoundaryDifference(doc, sessionId, inventory).flatMap(
    ({ holderId, difference }) =>
      bankDenominations.flatMap((denomination) => {
        const quantity = difference[denomination];
        return quantity
          ? [
              {
                holderId,
                denomination,
                quantity,
                item: newBankMoneyItem(
                  denomination,
                  'reconcile-' + holderId + '-' + denomination
                ),
              },
            ]
          : [];
      })
  );
}
export function commitBankReconciliation(
  doc: CampaignDocument,
  sessionId: string,
  expected: string,
  id: string,
  at: string
): CampaignDocument {
  if (bankLedger(doc).entries.some((e) => e.id === id)) return doc;
  const working = doc.workingInventories.find((w) => w.sessionId === sessionId);
  if (!working) throw Error('Session possessions missing.');
  if (
    expected !==
    fingerprint({
      banking: bankLedger(doc),
      money: moneySignature(working.document),
      sessionId,
    })
  )
    throw Error('Balances changed. Review the reconciliation again.');
  const changes = bankReconciliationChanges(doc, sessionId, working.document);
  if (!changes.length) return doc;
  const ledger = bankLedger(doc);
  const entry: BankEntry = {
    id,
    transactionId: id,
    replaces: null,
    sessionId,
    order:
      Math.max(
        -1,
        ...activeBankEntries(ledger.entries)
          .filter((e) => e.sessionId === sessionId)
          .map((e) => e.order)
      ) + 1,
    description: 'Remaining balance adjustment',
    kind: 'reconciliation',
    status: 'posted',
    effect: 'ledger',
    changes,
    at,
  };
  if (historicalBankTransaction(doc, entry))
    throw Error(
      'Use history extension before reconciling these earlier possessions.'
    );
  const next = {
    ...doc,
    banking: { ...ledger, entries: [...ledger.entries, entry] },
  };
  assertBankCutoffs(next);
  validateBankBalances(next);
  return next;
}
export const bankReconciliationFingerprint = (
  doc: CampaignDocument,
  sessionId: string
) =>
  fingerprint({
    banking: bankLedger(doc),
    money: moneySignature(
      doc.workingInventories.find((w) => w.sessionId === sessionId)?.document ??
        (() => {
          throw Error('Missing possessions.');
        })()
    ),
    sessionId,
  });

function reconciliationAllowance(
  doc: CampaignDocument,
  sessionId: string,
  source: BankEntry,
  holderId: string,
  denomination: BankDenomination,
  records = bankLedger(doc).possessionsReconciliations ?? []
) {
  const outgoing = source.changes
    .filter(
      (c) =>
        c.holderId === holderId &&
        c.denomination === denomination &&
        c.quantity < 0
    )
    .reduce((sum, c) => safe(sum - c.quantity), 0);
  const used = records
    .filter((r) => r.sessionId === sessionId && r.sourceEntryId === source.id)
    .flatMap((r) => r.changes)
    .filter((c) => c.holderId === holderId && c.denomination === denomination)
    .reduce((sum, c) => safe(sum - c.quantity), 0);
  return outgoing - used;
}
function validatePossessionsReconciliations(
  doc: CampaignDocument,
  unique: (id: string) => void
) {
  const ledger = bankLedger(doc),
    prefix: BankPossessionsReconciliation[] = [];
  let entryCount = 0;
  for (const record of ledger.possessionsReconciliations ?? []) {
    unique(record.id);
    sessionIndex(doc, record.sessionId);
    if (
      !doc.workingInventories.some(
        (w) => w.id === record.workingId && w.sessionId === record.sessionId
      ) &&
      !doc.inventoryCheckpoints.some(
        (c) =>
          c.workingId === record.workingId && c.sessionId === record.sessionId
      )
    )
      throw Error('Missing reconciled possessions history.');
    if (
      record.entryCount < entryCount ||
      record.entryCount > ledger.entries.length
    )
      throw Error('Invalid possessions reconciliation ledger position.');
    entryCount = record.entryCount;
    const source = activeBankEntries(
      ledger.entries.slice(0, record.entryCount)
    ).find(
      (e) =>
        e.id === record.sourceEntryId &&
        e.status === 'posted' &&
        sessionIndex(doc, e.sessionId) < sessionIndex(doc, record.sessionId)
    );
    if (!source)
      throw Error(
        'Possessions reconciliation needs its earlier recorded outgoing transaction.'
      );
    const keys = new Set<string>();
    for (const change of record.changes) {
      const key = canonical([change.holderId, change.item.id]);
      if (
        keys.has(key) ||
        change.quantity >= 0 ||
        change.fee ||
        moneyDenomination(change.item) !== change.denomination ||
        -change.quantity > change.item.quantity
      )
        throw Error('Invalid reconciled money stack evidence.');
      keys.add(key);
    }
    const holders = Array.from(new Set(record.changes.map((c) => c.holderId)));
    if (
      new Set(record.balances.map((b) => b.holderId)).size !== holders.length ||
      record.balances.length !== holders.length ||
      record.balances.some((b) => !holders.includes(b.holderId))
    )
      throw Error('Reconciliation balances must match their holders.');
    for (const balance of record.balances) {
      const delta = bankChangesAmounts(record.changes, balance.holderId);
      if (
        canonical(addBankAmounts(balance.before, delta)) !==
        canonical(balance.after)
      )
        throw Error('Reconciled possessions quantities disagree.');
      for (const code of bankDenominations) {
        const removed = -(delta[code] ?? 0);
        if (!removed) continue;
        if (
          balance.ledger[code] === null ||
          balance.before[code] === null ||
          balance.after[code] === null ||
          (balance.after[code] ?? -1) < (balance.ledger[code] ?? 0) ||
          removed >
            reconciliationAllowance(
              doc,
              record.sessionId,
              source,
              balance.holderId,
              code,
              prefix
            )
        )
          throw Error(
            'Reconciliation exceeds the earlier loss or the recorded possessions difference.'
          );
      }
    }
    prefix.push(record);
  }
}

export function bankingReplacementReview(
  doc: CampaignDocument,
  sessionId: string,
  incoming: EncumbranceDmDocument
) {
  const previous = doc.workingInventories.find(
    (w) => w.sessionId === sessionId
  );
  const holders = Array.from(
    new Set([
      ...bankHolders(incoming).map((h) => h.id),
      ...(previous ? bankHolders(previous.document).map((h) => h.id) : []),
    ])
  );
  const comparison = holders.flatMap((holderId) => {
    const before = previous
      ? holderMoney(previous.document, holderId)
      : zeroBankAmounts();
    const after = holderMoney(incoming, holderId);
    return canonical(before) !== canonical(after)
      ? [{ holderId, before, after }]
      : [];
  });
  const covered =
    !!doc.banking &&
    (doc.banking.openings.length > 0 ||
      doc.banking.entries.some((e) => e.status === 'posted'));
  return {
    comparison,
    required: covered && comparison.length > 0,
    fingerprint: fingerprint({
      banking: doc.banking,
      sessionId,
      previous: previous?.id,
      money: previous ? moneySignature(previous.document) : null,
      incoming: moneySignature(incoming),
    }),
  };
}
export function assertBankingReplacementReviewed(
  doc: CampaignDocument,
  sessionId: string,
  incoming: EncumbranceDmDocument,
  reviewed?: string
) {
  const review = bankingReplacementReview(doc, sessionId, incoming);
  if (review.required && reviewed !== review.fingerprint)
    throw Error(
      'Review the Banking balance comparison before replacing this inventory. The ledger will stay unchanged.'
    );
}

interface BankExtensionRequest {
  openings: BankOpening[];
  transactionIds: string[];
}
function compareBankEntries(doc: CampaignDocument, a: BankEntry, b: BankEntry) {
  return (
    sessionIndex(doc, a.sessionId) - sessionIndex(doc, b.sessionId) ||
    a.order - b.order
  );
}
function applyAmounts(
  amounts: BankAmounts,
  changes: BankChange[],
  holderId: string
) {
  const next = addBankAmounts(amounts, bankChangesAmounts(changes, holderId));
  if (bankDenominations.some((c) => (next[c] ?? 0) < 0))
    throw Error(
      'Transaction has insufficient funds at this point in the ledger.'
    );
  return next;
}
export function previewBankExtension(
  doc: CampaignDocument,
  request: BankExtensionRequest
) {
  const ledger = bankLedger(doc),
    active = activeBankEntries(ledger.entries);
  if (
    !request.transactionIds.length ||
    new Set(request.transactionIds).size !== request.transactionIds.length
  )
    throw Error('Select historical drafts once each.');
  const entries = request.transactionIds
    .map(
      (id) =>
        active.find((e) => e.transactionId === id && e.status === 'draft') ??
        (() => {
          throw Error('Select current historical transaction drafts.');
        })()
    )
    .sort((a, b) => compareBankEntries(doc, a, b));
  const holders = Array.from(
    new Set([
      ...entries.flatMap((e) => e.changes.map((c) => c.holderId)),
      ...request.openings.map((o) => o.holderId),
    ])
  );
  if (
    new Set(request.openings.map((o) => o.holderId)).size !==
    request.openings.length
  )
    throw Error('Choose one opening per holder.');
  const rows = holders.map((holderId) => {
    const previous = ledger.openings.find((o) => o.holderId === holderId);
    const proposed = request.openings.find((o) => o.holderId === holderId);
    if (!previous || !proposed)
      return {
        holderId,
        previous,
        proposed,
        applied: zeroBankAmounts(),
        reconstructed: null,
        difference: null,
      };
    bankOpeningSchema.parse(proposed);
    if (
      sessionIndex(doc, proposed.sessionId) >
        sessionIndex(doc, previous.sessionId) ||
      (proposed.sessionId === previous.sessionId &&
        !(proposed.phase === 'before' && previous.phase === 'after'))
    )
      throw Error('Choose an opening before the existing cutoff.');
    let amounts = proposed.amounts;
    const applied = zeroBankAmounts();
    for (const entry of entries.filter((e) =>
      e.changes.some((c) => c.holderId === holderId)
    )) {
      validateChanges(entry);
      if (
        !atOrAfterOpening(doc, entry.sessionId, proposed) ||
        atOrAfterOpening(doc, entry.sessionId, previous)
      )
        throw Error(
          'Historical transactions must fall between both openings for every affected holder.'
        );
      amounts = applyAmounts(amounts, entry.changes, holderId);
      const delta = bankChangesAmounts(entry.changes, holderId);
      for (const code of bankDenominations)
        applied[code] = safe((applied[code] ?? 0) + (delta[code] ?? 0));
    }
    return {
      holderId,
      previous,
      proposed,
      applied,
      reconstructed: amounts,
      difference: addBankAmounts(amounts, previous.amounts, -1),
    };
  });
  return {
    rows,
    entries,
    fingerprint: fingerprint({
      request,
      banking: ledger,
      sessions: doc.sessions.map((s) => s.id),
    }),
  };
}
export function confirmBankExtension(
  doc: CampaignDocument,
  request: BankExtensionRequest,
  expected: string,
  id: string,
  at: string
): CampaignDocument {
  const ledger = bankLedger(doc);
  if (ledger.extensions.some((e) => e.id === id)) return doc;
  const preview = previewBankExtension(doc, request);
  if (preview.fingerprint !== expected)
    throw Error('Banking history changed. Review a new preview.');
  const openings: BankExtension['openings'] = [];
  for (const row of preview.rows) {
    if (
      !row.previous ||
      !row.proposed ||
      !row.difference ||
      bankDenominations.some((c) => row.difference?.[c] !== 0)
    )
      throw Error('Every denomination must match the existing cutoff exactly.');
    openings.push({
      previous: row.previous,
      replacement: { ...row.proposed, id: row.previous.id },
      applied: row.applied,
    });
  }
  const posted = preview.entries.map(
    (e, i): BankEntry => ({
      ...e,
      id: id + '-transaction-' + i,
      replaces: e.id,
      status: 'posted',
      at,
    })
  );
  const extension: BankExtension = {
    id,
    at,
    entryIds: posted.map((e) => e.id),
    openings,
  };
  const next = {
    ...doc,
    banking: {
      ...ledger,
      entries: [...ledger.entries, ...posted],
      openings: ledger.openings.map(
        (o) => openings.find((p) => p.previous.id === o.id)?.replacement ?? o
      ),
      extensions: [...ledger.extensions, extension],
    },
  };
  assertBankCutoffs(next);
  validateBankBalances(next);
  return next;
}

function assertBankCutoffs(doc: CampaignDocument) {
  for (const extension of bankLedger(doc).extensions)
    for (const { previous } of extension.openings)
      if (
        canonical(
          bankBalance(
            doc,
            previous.holderId,
            previous.sessionId,
            previous.phase
          )
        ) !== canonical(previous.amounts)
      )
        throw Error('A reconciled banking cutoff must stay unchanged.');
}
function validateBankBalances(doc: CampaignDocument) {
  const ledger = bankLedger(doc);
  for (const opening of ledger.openings) {
    let amounts = opening.amounts;
    for (const entry of activeBankEntries(ledger.entries)
      .filter(
        (e) =>
          e.status === 'posted' && atOrAfterOpening(doc, e.sessionId, opening)
      )
      .sort((a, b) => compareBankEntries(doc, a, b)))
      amounts = applyAmounts(amounts, entry.changes, opening.holderId);
  }
}
export function validateCampaignBanking(
  doc: CampaignDocument,
  unique: (id: string) => void
) {
  doc.workingInventories.forEach((w) => validatePhysicalMoney(w.document));
  if (!doc.banking) return;
  const ledger = doc.banking;
  validatePossessionsReconciliations(doc, unique);
  const holderIds = new Set([
    ...[...doc.workingInventories, ...doc.inventoryCheckpoints].flatMap((w) =>
      bankHolders(w.document).map((h) => h.id)
    ),
    ...ledger.entries.flatMap((e) => e.changes.map((c) => c.holderId)),
  ]);
  const seenHolders = new Set<string>();
  for (const opening of ledger.openings) {
    unique(opening.id);
    sessionIndex(doc, opening.sessionId);
    if (seenHolders.has(opening.holderId) || !holderIds.has(opening.holderId))
      throw Error('Invalid banking holder opening.');
    seenHolders.add(opening.holderId);
  }
  const prefix: BankEntry[] = [];
  for (const entry of ledger.entries) {
    unique(entry.id);
    sessionIndex(doc, entry.sessionId);
    validateChanges(entry);
    const previous = activeBankEntries(prefix).find(
      (e) => e.transactionId === entry.transactionId
    );
    if (
      entry.replaces !== (previous?.id ?? null) ||
      (previous &&
        (entry.sessionId !== previous.sessionId ||
          entry.receiptMode !== previous.receiptMode ||
          entry.effect !== previous.effect ||
          entry.order !== previous.order ||
          previous.status === 'void'))
    )
      throw Error('Invalid banking revision history.');
    prefix.push(entry);
  }
  let current = ledger.openings;
  const claimed = new Set<string>();
  let lastBatch = ledger.entries.length;
  for (const extension of [...ledger.extensions].reverse()) {
    unique(extension.id);
    const entries = extension.entryIds.map((id) =>
      ledger.entries.find((e) => e.id === id)
    );
    if (
      new Set(extension.entryIds).size !== entries.length ||
      entries.some(
        (e) =>
          !e ||
          e.status !== 'posted' ||
          e.at !== extension.at ||
          !ledger.entries.some(
            (p) =>
              p.id === e.replaces &&
              p.status === 'draft' &&
              p.transactionId === e.transactionId
          )
      )
    )
      throw Error('Invalid banking extension transactions.');
    const firstIndex = ledger.entries.findIndex(
      (e) => e.id === extension.entryIds[0]
    );
    if (
      firstIndex < 0 ||
      firstIndex + extension.entryIds.length > lastBatch ||
      canonical(
        ledger.entries
          .slice(firstIndex, firstIndex + extension.entryIds.length)
          .map((e) => e.id)
      ) !== canonical(extension.entryIds) ||
      extension.entryIds.some((id) => claimed.has(id))
    )
      throw Error(
        'Banking extension batches must be distinct and appended in acceptance order.'
      );
    extension.entryIds.forEach((id) => claimed.add(id));
    lastBatch = firstIndex;
    const affected = new Set(
      extension.openings.map((o) => o.previous.holderId)
    );
    if (
      affected.size !== extension.openings.length ||
      entries.some((e) => e?.changes.some((c) => !affected.has(c.holderId)))
    )
      throw Error('Incomplete banking extension recipients.');
    for (const opening of extension.openings) {
      const { previous, replacement, applied } = opening;
      if (
        previous.id !== replacement.id ||
        previous.holderId !== replacement.holderId ||
        canonical(current.find((o) => o.id === replacement.id)) !==
          canonical(replacement) ||
        canonical(addBankAmounts(replacement.amounts, applied)) !==
          canonical(previous.amounts)
      )
        throw Error('Invalid banking opening reconciliation.');
      const relevant = entries.flatMap((e) => (e ? e.changes : []));
      if (
        canonical(bankChangesAmounts(relevant, previous.holderId)) !==
          canonical(applied) ||
        entries.some(
          (e) =>
            e &&
            e.changes.some((c) => c.holderId === previous.holderId) &&
            (!atOrAfterOpening(doc, e.sessionId, replacement) ||
              atOrAfterOpening(doc, e.sessionId, previous))
        )
      )
        throw Error('Invalid banking extension interval.');
    }
    current = current.map(
      (o) =>
        extension.openings.find((p) => p.replacement.id === o.id)?.previous ?? o
    );
  }
  assertBankCutoffs(doc);
  validateBankBalances(doc);
}
export function validateBankingTransition(
  old: CampaignDocument,
  next: CampaignDocument
) {
  const previous = bankLedger(old),
    current = bankLedger(next);
  if (
    canonical(current.entries.slice(0, previous.entries.length)) !==
      canonical(previous.entries) ||
    canonical(current.extensions.slice(0, previous.extensions.length)) !==
      canonical(previous.extensions)
  )
    throw Error(
      'Recorded banking history is immutable. Edit through a new transaction revision.'
    );
  const oldReconciliations = previous.possessionsReconciliations ?? [],
    newReconciliations = current.possessionsReconciliations ?? [];
  if (
    canonical(newReconciliations.slice(0, oldReconciliations.length)) !==
      canonical(oldReconciliations) ||
    newReconciliations.length !== oldReconciliations.length
  )
    throw Error('Recorded possessions reconciliations are immutable.');
  const additions = current.entries.slice(previous.entries.length);
  const extensions = current.extensions.slice(previous.extensions.length);
  if (extensions.length) {
    if (extensions.length !== 1)
      throw Error('Accept one history stretch at a time.');
    const extension = extensions[0];
    if (!extension) throw Error('Missing banking extension.');
    const request = {
      openings: extension.openings.map((o) => o.replacement),
      transactionIds: additions.map((e) => e.transactionId),
    };
    const preview = previewBankExtension(old, request);
    const expected = confirmBankExtension(
      old,
      request,
      preview.fingerprint,
      extension.id,
      extension.at
    );
    if (
      canonical(expected.banking) !== canonical(next.banking) ||
      canonical(old.workingInventories) !== canonical(next.workingInventories)
    )
      throw Error(
        'A history extension must atomically preserve possessions and accept exactly the reconciled drafts.'
      );
    return;
  }
  for (const opening of previous.openings) {
    const changed = current.openings.find((o) => o.id === opening.id);
    const frozen =
      previous.entries.some(
        (e) =>
          e.status === 'posted' &&
          e.changes.some((c) => c.holderId === opening.holderId)
      ) ||
      previous.extensions.some((e) =>
        e.openings.some((o) => o.previous.holderId === opening.holderId)
      );
    if (
      !changed ||
      (frozen &&
        canonical(opening) !== canonical(changed) &&
        !completesUnknownOpening(opening, changed))
    )
      throw Error('Reviewed banking openings require a history extension.');
  }
  if (additions.length > 1)
    throw Error('Banking changes must be one atomic transaction.');
  const entry = additions[0];
  if (entry) {
    const oldWork = old.workingInventories.find(
      (w) => w.sessionId === entry.sessionId
    );
    const newWork = next.workingInventories.find(
      (w) => w.sessionId === entry.sessionId
    );
    if (!oldWork || !newWork)
      throw Error('Banking requires session possessions.');
    const isDirectEdit =
      entry.replaces === null &&
      entry.id === entry.transactionId &&
      entry.effect === 'inventory' &&
      ['adjustment', 'transfer'].includes(entry.kind);
    if (isDirectEdit) {
      const changes = inventoryMoneyChanges(oldWork.document, newWork.document);
      if (
        canonical(changes) !== canonical(entry.changes) ||
        entry.status !==
          (historicalBankTransaction(old, entry) ? 'draft' : 'posted')
      )
        throw Error('Possessions money edits require matching ledger changes.');
    } else if (
      entry.kind === 'reconciliation' &&
      entry.effect === 'ledger' &&
      !entry.replaces
    ) {
      const expected = commitBankReconciliation(
        old,
        entry.sessionId,
        bankReconciliationFingerprint(old, entry.sessionId),
        entry.id,
        entry.at
      );
      if (
        canonical(expected.banking) !== canonical(next.banking) ||
        canonical(oldWork.document) !== canonical(newWork.document)
      )
        throw Error('Invalid banking boundary reconciliation.');
    } else {
      const request: BankTransactionRequest = {
        transactionId: entry.transactionId,
        sessionId: entry.sessionId,
        description: entry.description,
        kind: entry.kind,
        changes: entry.changes,
        remove: entry.status === 'void',
        receiptMode: entry.receiptMode,
      };
      const preview = previewBankTransaction(old, request);
      const expected = commitBankTransaction(
        old,
        request,
        preview.fingerprint,
        entry.id,
        entry.at
      );
      if (
        canonical(expected.banking) !== canonical(current) ||
        canonical(
          moneySignature(
            expected.workingInventories.find(
              (w) => w.sessionId === entry.sessionId
            )?.document ?? oldWork.document
          )
        ) !== canonical(moneySignature(newWork.document))
      )
        throw Error(
          'Banking transaction and possessions must commit together.'
        );
    }
  }
  for (const working of old.banking || next.banking
    ? old.workingInventories
    : []) {
    const changed = next.workingInventories.find(
      (w) => w.sessionId === working.sessionId
    );
    if (
      changed &&
      inventoryMoneyChanges(working.document, changed.document).length &&
      entry &&
      entry.sessionId !== working.sessionId
    )
      throw Error(
        'A banking transaction may only change its own session’s possessions.'
      );
  }
  // Banking history uses the same explicit session ordering as XP.
  const priorOrder = old.sessions.map((s) => s.id);
  const nextOrder = next.sessions
    .filter((s) => priorOrder.includes(s.id))
    .map((s) => s.id);
  if (
    (previous.entries.length || previous.openings.length) &&
    canonical(priorOrder) !== canonical(nextOrder) &&
    !validHistoricalSessionMove(old, next)
  )
    throw Error(
      'Banking session chronology is fixed. Insert earlier sessions without reordering existing history.'
    );
}
