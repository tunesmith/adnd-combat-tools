import { inSessionInventoryOrder } from '../../helpers/campaignInventoryOrder';
import { useRef, useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import {
  historicalBankTransaction,
  bankHolders,
  bankBalanceHolders,
  bankBalance,
  bankBoundaryDifference,
  existingMoneyAvailability,
  existingTransferSources,
  existingSettlementAvailability,
  bankBalanceSourceItem,
  bankHolderName,
  moneyStacks,
  newBankMoneyItem,
  holderMoney,
  bankGp,
  previewBankTransaction,
  previewBankProgress,
  bankChangesAmounts,
  commitBankTransaction,
} from '../../helpers/campaignBanking';
import type { BankTransactionRequest } from '../../helpers/campaignBanking';
import {
  bankDenominations,
  bankTransactionTypes,
  bankKindLabel,
  zeroBankAmounts,
} from '../../helpers/campaignBankingModel';
import type {
  BankChange,
  BankDenomination,
  BankEntry,
} from '../../helpers/campaignBankingModel';
import { getInventoryItemInfo } from '../../helpers/encumbranceRules';
import { encumbranceCatalogById } from '../../tables/encumbranceCatalog';
import BankBalances from './BankBalances';
import styles from './xpWorkspace.module.css';
const uid = () => crypto.randomUUID();
type BankStackOption = {
  holderId: string;
  denomination: BankDenomination;
  item: BankChange['item'];
  currentQuantity: number;
  available: number | null;
  physical?: boolean;
  direction?: 'incoming' | 'outgoing';
};
type StackIdentity = Pick<BankChange, 'holderId' | 'item'>;
const sameStack = (a: StackIdentity, b: StackIdentity) =>
  a.holderId === b.holderId && a.item.id === b.item.id;
const unselected = (stack: StackIdentity, otherRows: BankChange[]) =>
  !otherRows.some((row) => sameStack(stack, row));

// Exclude the row being edited. A blank row holds its choice until it has an amount.
function remainingQuantity(
  stack: BankStackOption,
  others: BankChange[],
  settlement?: ReturnType<typeof existingSettlementAvailability>
) {
  const matching = others.filter((c) => sameStack(c, stack));
  if (
    matching.some((c) => !Number.isSafeInteger(c.quantity) || c.quantity === 0)
  )
    return 0;
  if (stack.available === null) return null;
  if (stack.physical) {
    return Math.max(
      0,
      matching.reduce(
        (quantity, row) => quantity + row.quantity,
        stack.available
      )
    );
  }
  const allocated = matching.reduce(
    (sum, row) => sum + Math.max(0, row.quantity),
    0
  );
  if (!stack.direction || !settlement)
    return Math.max(0, stack.available - allocated);
  const limit = settlement.limits.find((l) => l.holderId === stack.holderId);
  const outgoing = stack.direction === 'outgoing';
  const bound = (outgoing ? limit?.outgoing : limit?.incoming)?.[
    stack.denomination
  ];
  if (bound == null) return null;
  const net = others.reduce(
    (sum, c) =>
      c.holderId === stack.holderId &&
      c.denomination === stack.denomination &&
      Number.isSafeInteger(c.quantity)
        ? sum + c.quantity
        : sum,
    0
  );
  return Math.max(
    0,
    Math.min(
      outgoing ? bound + net : bound - net,
      outgoing ? stack.available + net : stack.available - allocated
    )
  );
}
function chooseStack(
  options: BankStackOption[],
  others: BankChange[],
  settlement?: ReturnType<typeof existingSettlementAvailability>
) {
  const usable = options.filter(
    (s) => (remainingQuantity(s, others, settlement) ?? 0) > 0
  );
  return usable.find((s) => unselected(s, others)) ?? usable[0];
}
function sourceNote(item: BankChange['item']) {
  const note = item.playerNotes.trim().replace(/\s+/g, ' ');
  return note.length > 80 ? note.slice(0, 79).trimEnd() + '…' : note;
}
function paymentTotal(changes: BankChange[]): string {
  // Cleared quantity inputs are NaN. Every other entered amount must be a safe whole number.
  const entered = changes.filter((c) => !Number.isNaN(c.quantity));
  if (entered.some((c) => !Number.isSafeInteger(c.quantity))) return '—';
  try {
    const amount = bankGp(
      bankChangesAmounts(entered.map((c) => ({ ...c, quantity: -c.quantity })))
    );
    const [whole = '', fraction] = amount.split('.');
    return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${
      fraction ? '.' + fraction : ''
    } gp`;
  } catch {
    // Several individually valid rows can overflow the supported denomination total.
    return '—';
  }
}
export default function BankTransactionDialog({
  document,
  sessionId: workspaceSessionId,
  entry,
  onChange,
  onClose,
}: {
  document: CampaignDocument;
  sessionId: string;
  entry?: BankEntry;
  onChange: (change: (doc: CampaignDocument) => CampaignDocument) => boolean;
  onClose: () => void;
}) {
  const sessionId = entry?.sessionId ?? workspaceSessionId;
  const [incomeDay, setIncomeDay] = useState(() => {
    const label =
      document.sessions.find((s) => s.id === sessionId)?.label.trim() ?? '';
    const day = /^Day\s*(\d+)(?:\s*[—–-]\s*\d{4}-\d{2}-\d{2})?$/i.exec(
      label
    )?.[1];
    return day && Number.isSafeInteger(Number(day)) ? String(Number(day)) : '';
  });
  const working = document.workingInventories.find(
    (w) => w.sessionId === sessionId
  );
  const currentHolders = working
    ? inSessionInventoryOrder(
        document,
        sessionId,
        bankHolders(working.document),
        (h) => h.id
      )
    : [];
  const historicalIds = Array.from(
    new Set([
      ...bankBalanceHolders(document, sessionId).map((h) => h.id),
      ...(entry?.changes.map((c) => c.holderId) ?? []),
    ])
  );
  const holders = [
    ...currentHolders.map((h) => ({ ...h, removed: false })),
    ...historicalIds
      .filter((id) => !currentHolders.some((h) => h.id === id))
      .map((id) => ({
        id,
        name: bankHolderName(document, id),
        inventory: [] as BankChange['item'][],
        removed: true,
      })),
  ];
  const stacks = working ? moneyStacks(working.document) : [];
  const ordinaryOptions: BankStackOption[] = stacks.map((s) => ({
    ...s,
    currentQuantity: s.item.quantity,
    available: null,
  }));
  // A posted payment can consume its stack completely. Preserve the recorded ID when editing it.
  for (const change of entry?.changes ?? []) {
    if (!ordinaryOptions.some((s) => sameStack(s, change)))
      ordinaryOptions.push({
        ...change,
        currentQuantity: 0,
        available: null,
      });
  }
  for (const stack of ordinaryOptions) {
    const posted =
      entry?.effect === 'inventory' && entry.status === 'posted'
        ? entry.changes
        : [];
    stack.physical = true;
    stack.available =
      stack.currentQuantity -
      posted.reduce(
        (sum, c) => (sameStack(c, stack) ? sum + c.quantity : sum),
        0
      );
  }
  const makeChange = (
    holderId = holders[0]?.id ?? '',
    denomination: BankDenomination = 'gp',
    receiptMode?: 'existing',
    otherChanges: BankChange[] = [],
    allowOtherHolder = false
  ): BankChange => {
    const choices: BankStackOption[] =
      receiptMode === 'existing'
        ? existingMoneyAvailability(document, sessionId, entry?.transactionId)
            .stacks
        : ordinaryOptions;
    const currency = choices.filter((s) => s.denomination === denomination);
    const source =
      chooseStack(
        currency.filter((s) => s.holderId === holderId),
        otherChanges
      ) ?? (allowOtherHolder ? chooseStack(currency, otherChanges) : undefined);
    return {
      holderId: source?.holderId ?? holderId,
      denomination,
      quantity: 0,
      item: source?.item ?? newBankMoneyItem(denomination, uid()),
    };
  };
  const makeSettlementChange = (
    holderId?: string,
    code: BankDenomination = 'gp',
    otherChanges: BankChange[] = [],
    preferOutgoing = true
  ): BankChange => {
    const choices = existingSettlementAvailability(
      document,
      sessionId,
      entry?.transactionId
    );
    const directional: BankStackOption[] = preferOutgoing
      ? choices.outgoing
      : choices.incoming;
    const options = directional.filter(
      (s) => s.denomination === code && (!holderId || s.holderId === holderId)
    );
    const selected =
      chooseStack(options, otherChanges, choices) ??
      (preferOutgoing
        ? options.find((s) => unselected(s, otherChanges))
        : undefined);
    const id = selected?.holderId ?? holderId ?? holders[0]?.id ?? '';
    return {
      holderId: id,
      denomination: code,
      quantity: 0,
      item: selected?.item ?? newBankMoneyItem(code, uid()),
    };
  };
  const makeTransferPair = (
    otherChanges: BankChange[] = [],
    preferredSource?: string,
    preferredDestination?: string,
    preferredCode: BankDenomination = 'gp'
  ): BankChange[] => {
    const incoming = existingMoneyAvailability(
      document,
      sessionId,
      entry?.transactionId
    ).stacks;
    const sources = existingTransferSources(
      document,
      sessionId,
      entry?.transactionId
    );
    const codes = [
      preferredCode,
      ...bankDenominations.filter((c) => c !== preferredCode),
    ];
    const sourceOrder = [
      ...sources.filter((s) => s.holderId === preferredSource),
      ...sources.filter((s) => s.holderId !== preferredSource),
    ];
    const otherDestinations = otherChanges.filter((_, i) => i % 2 === 1);
    const destinationOrder = [
      ...incoming.filter((s) => s.holderId === preferredDestination),
      ...incoming.filter((s) => s.holderId !== preferredDestination),
    ];
    for (const code of codes)
      for (const source of sourceOrder) {
        const spent = otherChanges
          .filter(
            (c) =>
              c.holderId === source.holderId &&
              c.denomination === code &&
              c.quantity < 0
          )
          .reduce((sum, c) => sum - c.quantity, 0);
        if ((source.amounts[code] ?? 0) <= spent) continue;
        const destination = chooseStack(
          destinationOrder.filter(
            (s) => s.holderId !== source.holderId && s.denomination === code
          ),
          otherDestinations
        );
        if (destination)
          return [
            {
              holderId: source.holderId,
              denomination: code,
              quantity: 0,
              item: bankBalanceSourceItem(
                source.holderId,
                code,
                source.recorded[code] ?? 0
              ),
            },
            {
              holderId: destination.holderId,
              denomination: code,
              quantity: 0,
              item: destination.item,
            },
          ];
      }
    const holderId =
      preferredSource ?? sources[0]?.holderId ?? holders[0]?.id ?? '';
    return [
      {
        holderId,
        denomination: preferredCode,
        quantity: 0,
        item: bankBalanceSourceItem(holderId, preferredCode, 1),
      },
      makeChange(
        preferredDestination,
        preferredCode,
        'existing',
        otherDestinations,
        true
      ),
    ];
  };
  const [draft, setRequest] = useState<BankTransactionRequest>(() => ({
    transactionId: entry?.transactionId ?? uid(),
    sessionId,
    description: entry?.description ?? '',
    kind: entry?.kind ?? 'purchase',
    receiptMode: entry?.receiptMode,
    changes: entry?.changes ?? [
      makeChange(undefined, undefined, entry?.receiptMode),
    ],
  }));
  const newIncomeStack = (c: BankChange) =>
    !ordinaryOptions.some((s) => sameStack(c, s));
  const needsDay =
    (draft.kind === 'income' || draft.kind === 'refund') &&
    !draft.receiptMode &&
    entry?.effect !== 'ledger' &&
    !historicalBankTransaction(document, draft) &&
    draft.changes.some(newIncomeStack);
  const validDay =
    /^\d+$/.test(incomeDay) && Number.isSafeInteger(Number(incomeDay));
  // The reviewed item snapshot is the input to both preview and commit, including native replay.
  const request =
    needsDay && validDay
      ? {
          ...draft,
          changes: draft.changes.map((c) =>
            newIncomeStack(c)
              ? { ...c, item: { ...c.item, day: Number(incomeDay) } }
              : c
          ),
        }
      : draft;
  const existingMode = request.receiptMode === 'existing';
  const existingTransfer = existingMode && request.kind === 'transfer';
  const existingSettlement =
    existingMode && ['purchase', 'fee', 'exchange'].includes(request.kind);
  const settlement = existingSettlement
    ? existingSettlementAvailability(document, sessionId, entry?.transactionId)
    : undefined;
  const rows = existingTransfer
    ? request.changes.filter((_, index) => index % 2 === 1)
    : request.changes;
  const sourceBalances = existingTransfer
    ? existingTransferSources(document, sessionId, entry?.transactionId)
    : [];
  const availability =
    existingMode && !existingSettlement
      ? existingMoneyAvailability(document, sessionId, entry?.transactionId)
      : undefined;
  const [error, setError] = useState('');
  const operation = useRef<{ fingerprint: string; id: string; at: string }>();
  const completed = rows.flatMap((change, index) => {
    const ready =
      Number.isSafeInteger(change.quantity) &&
      change.quantity !== 0 &&
      (!existingMode ||
        (existingSettlement
          ? [...(settlement?.outgoing ?? []), ...(settlement?.incoming ?? [])]
          : availability?.stacks
        )?.some(
          (stack) =>
            stack.holderId === change.holderId &&
            stack.denomination === change.denomination &&
            stack.item.id === change.item.id
        ));
    if (!ready) return [];
    if (!existingTransfer) return [change];
    const source = request.changes[index * 2];
    return source && sourceBalances.some((s) => s.holderId === source.holderId)
      ? [source, change]
      : [];
  });
  const incomplete = completed.length !== request.changes.length;
  const ordinaryTransfer = request.kind === 'transfer' && !existingMode;
  const ordinaryExchange = request.kind === 'exchange' && !existingMode;
  const physicalProgress = ordinaryTransfer || ordinaryExchange;
  const balanceProgress = ordinaryTransfer || request.kind === 'exchange';
  const net = balanceProgress
    ? bankChangesAmounts(
        completed.filter((change) => request.kind !== 'exchange' || !change.fee)
      )
    : zeroBankAmounts();
  const exchangeValue = bankGp(net);
  const unallocated =
    request.kind === 'exchange'
      ? exchangeValue === '0'
        ? []
        : [
            `${
              exchangeValue.startsWith('-') ? '+' : '-'
            }${exchangeValue.replace(/^-/, '')} gp of value`,
          ]
      : bankDenominations.flatMap((code) => {
          const quantity = net[code] ?? 0;
          return quantity
            ? [
                `${
                  quantity < 0 ? '+' : ''
                }${(-quantity).toLocaleString()} ${code}`,
              ]
            : [];
        });
  let summaryPreview: ReturnType<typeof previewBankTransaction> | undefined;
  let preview: ReturnType<typeof previewBankTransaction> | undefined;
  let invalid = '';
  let saveError = '';
  if (needsDay && !validDay)
    invalid = 'Enter the acquisition day for new stacks.';
  else if (completed.length) {
    try {
      const candidate = {
        ...request,
        description: request.description.trim() || 'Transaction preview',
        changes: completed,
      };
      summaryPreview = balanceProgress
        ? previewBankProgress(document, candidate)
        : previewBankTransaction(document, candidate);
    } catch (e) {
      invalid = e instanceof Error ? e.message : String(e);
    }
  }
  if (
    summaryPreview &&
    !incomplete &&
    request.description.trim() &&
    !unallocated.length
  ) {
    try {
      preview = balanceProgress
        ? previewBankTransaction(document, request)
        : summaryPreview;
    } catch (e) {
      saveError = e instanceof Error ? e.message : String(e);
    }
  }
  const incoming = ordinaryTransfer
    ? summaryPreview?.candidate.changes.filter((c) => c.quantity > 0)
    : undefined;
  const requestedIncoming = completed.filter((c) => c.quantity > 0);
  const separated = incoming?.some(
    (change, i) =>
      change.item.id !== requestedIncoming[i]?.item.id ||
      change.quantity !== requestedIncoming[i]?.quantity
  );
  const proposedInventory = summaryPreview?.inventory ?? working?.document;
  const projectedLedger = summaryPreview?.projection ?? document;
  const unknown = {
    cp: null,
    sp: null,
    ep: null,
    gp: null,
    pp: null,
    diamond: null,
    emerald: null,
  };
  const remaining = bankBoundaryDifference(projectedLedger, sessionId);
  const update = (index: number, change: Partial<BankChange>) => {
    setError('');
    if (!existingTransfer) {
      if (existingSettlement) {
        const previous = request.changes[index];
        const current = previous ? { ...previous, ...change } : undefined;
        if (current) {
          if (
            current.quantity < 0 &&
            !settlement?.outgoing.some((s) => sameStack(s, current))
          )
            change = {
              ...change,
              item: makeSettlementChange(
                current.holderId,
                current.denomination,
                rows.filter((_, i) => i !== index)
              ).item,
            };
          else if (
            current.quantity > 0 &&
            !settlement?.incoming.some(
              (s) =>
                s.holderId === current.holderId &&
                s.denomination === current.denomination &&
                s.item.id === current.item.id
            )
          )
            change = {
              ...change,
              item: makeSettlementChange(
                current.holderId,
                current.denomination,
                request.changes.filter((_, i) => i !== index),
                false
              ).item,
            };
        }
      }
      setRequest({
        ...request,
        changes: request.changes.map((c, i) =>
          i === index ? { ...c, ...change } : c
        ),
      });
      return;
    }
    const source = request.changes[index * 2],
      destination = request.changes[index * 2 + 1];
    if (!source || !destination) return;
    const incoming = { ...destination, ...change };
    const recorded =
      sourceBalances.find((s) => s.holderId === source.holderId)?.recorded[
        incoming.denomination
      ] ?? 0;
    const outgoing = {
      ...source,
      denomination: incoming.denomination,
      quantity: -incoming.quantity,
      item: bankBalanceSourceItem(
        source.holderId,
        incoming.denomination,
        recorded
      ),
    };
    setRequest({
      ...request,
      changes: request.changes.flatMap((c, i) =>
        i === index * 2 ? [outgoing, incoming] : i === index * 2 + 1 ? [] : [c]
      ),
    });
  };
  const updateSource = (index: number, holderId: string) => {
    const destination = rows[index];
    if (!destination) return;
    const recorded =
      sourceBalances.find((s) => s.holderId === holderId)?.recorded[
        destination.denomination
      ] ?? 0;
    setError('');
    setRequest({
      ...request,
      changes: request.changes.map((c, i) =>
        i === index * 2
          ? {
              holderId,
              denomination: destination.denomination,
              quantity: -destination.quantity,
              item: bankBalanceSourceItem(
                holderId,
                destination.denomination,
                recorded
              ),
            }
          : c
      ),
    });
  };
  const submit = (remove = false) => {
    try {
      const input = { ...request, remove };
      const fresh = previewBankTransaction(document, input);
      if (operation.current?.fingerprint !== fresh.fingerprint)
        operation.current = {
          fingerprint: fresh.fingerprint,
          id: uid(),
          at: new Date().toISOString(),
        };
      const { id, at } = operation.current;
      if (
        onChange((doc) =>
          commitBankTransaction(doc, input, fresh.fingerprint, id, at)
        )
      )
        onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  return (
    <div className={styles['backdrop']}>
      <section
        className={styles['modal']}
        role="dialog"
        aria-modal="true"
        aria-label="Banking transaction"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      >
        <h2>{entry ? 'Edit transaction' : 'New transaction'}</h2>
        <div className={styles['fields']}>
          <label>
            Description
            <input
              autoFocus
              value={request.description}
              maxLength={100000}
              onChange={(e) =>
                setRequest({ ...request, description: e.target.value })
              }
            />
          </label>
          {request.kind === 'adjustment' ||
          request.kind === 'reconciliation' ? (
            <div>
              <small>Transaction type</small>
              <span>{bankKindLabel(request.kind)}</span>
            </div>
          ) : (
            <label>
              Transaction type
              <select
                value={
                  request.kind === 'refund'
                    ? 'income'
                    : request.kind === 'fee'
                    ? 'purchase'
                    : request.kind
                }
                disabled={entry?.receiptMode === 'existing'}
                onChange={(e) => {
                  const type = bankTransactionTypes.find(
                    (type) => type.value === e.target.value
                  );
                  if (type)
                    setRequest({
                      ...request,
                      kind: type.value,
                      receiptMode: request.receiptMode,
                      changes:
                        existingMode &&
                        ['purchase', 'exchange'].includes(type.value)
                          ? [makeSettlementChange()]
                          : type.value === 'transfer' && existingMode
                          ? makeTransferPair()
                          : type.value === 'exchange'
                          ? existingTransfer
                            ? rows
                            : request.changes
                          : (existingTransfer ? rows : request.changes).map(
                              (c) => ({ ...c, fee: false })
                            ),
                    });
                }}
              >
                {bankTransactionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {[
          'income',
          'refund',
          'transfer',
          'purchase',
          'fee',
          'exchange',
        ].includes(request.kind) && (
          <label>
            Money in possessions
            <select
              value={existingMode ? 'existing' : 'add'}
              disabled={!!entry}
              onChange={(e) => {
                const mode =
                  e.target.value === 'existing' ? 'existing' : undefined;
                setError('');
                setRequest({
                  ...request,
                  receiptMode: mode,
                  changes:
                    request.kind === 'transfer' && mode === 'existing'
                      ? makeTransferPair()
                      : (existingTransfer
                          ? [makeChange()]
                          : request.changes
                        ).reduce<BankChange[]>((changes, change) => {
                          const fresh =
                            mode === 'existing' &&
                            ['purchase', 'fee', 'exchange'].includes(
                              request.kind
                            )
                              ? makeSettlementChange(
                                  change.holderId,
                                  change.denomination,
                                  changes,
                                  change.quantity <= 0
                                )
                              : makeChange(
                                  change.holderId,
                                  change.denomination,
                                  mode,
                                  changes
                                );
                          changes.push({
                            ...change,
                            holderId: fresh.holderId,
                            item: fresh.item,
                          });
                          return changes;
                        }, []),
                });
              }}
            >
              <option value="add">
                {request.kind === 'transfer'
                  ? 'Move in possessions'
                  : ['purchase', 'fee', 'exchange'].includes(request.kind)
                  ? 'Update possessions'
                  : 'Add to possessions'}
              </option>
              <option value="existing">Already recorded in possessions</option>
            </select>
          </label>
        )}
        <div className={styles['tableScroll']}>
          <table aria-label="Money changes">
            <thead>
              <tr>
                {existingTransfer && <th>From</th>}
                <th>{existingTransfer ? 'To' : 'Holder'}</th>
                <th>Denomination</th>
                <th>
                  {existingTransfer
                    ? 'Destination stack'
                    : 'Stack / change destination'}
                </th>
                <th>
                  {existingMode && !existingSettlement
                    ? 'Allocated quantity'
                    : 'Quantity change'}
                </th>
                {request.kind === 'exchange' && <th>Fee</th>}
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((change, index) => {
                const holder = holders.find((h) => h.id === change.holderId);
                const otherRows = rows.filter((_, i) => i !== index);
                const candidates: BankStackOption[] = settlement
                  ? [...settlement.outgoing, ...settlement.incoming]
                  : availability?.stacks ?? ordinaryOptions;
                const options = candidates.filter(
                  (s) =>
                    s.holderId === change.holderId &&
                    s.denomination === change.denomination &&
                    (sameStack(s, change) ||
                      unselected(s, otherRows) ||
                      (remainingQuantity(s, otherRows, settlement) ?? 0) > 0)
                );
                const selected = options.find(
                  (s) => s.item.id === change.item.id
                );
                const resulting =
                  summaryPreview &&
                  (bankHolders(summaryPreview.inventory)
                    .find((h) => h.id === change.holderId)
                    ?.inventory.find((i) => i.id === change.item.id)
                    ?.quantity ??
                    0);
                return (
                  <tr key={index}>
                    {existingTransfer && (
                      <td>
                        <select
                          aria-label={`Change ${index + 1} from holder`}
                          value={request.changes[index * 2]?.holderId ?? ''}
                          onChange={(e) => updateSource(index, e.target.value)}
                        >
                          {sourceBalances.map((source) => {
                            const other = request.changes.reduce(
                              (sum, c, i) =>
                                i !== index * 2 &&
                                c.holderId === source.holderId &&
                                c.denomination === change.denomination &&
                                c.quantity < 0
                                  ? sum - c.quantity
                                  : sum,
                              0
                            );
                            const amount = source.amounts[change.denomination];
                            const available =
                              amount === null
                                ? null
                                : Math.max(0, (amount ?? 0) - other);
                            return (
                              <option
                                key={source.holderId}
                                value={source.holderId}
                                disabled={
                                  available === 0 &&
                                  source.holderId !==
                                    request.changes[index * 2]?.holderId
                                }
                              >
                                {bankHolderName(document, source.holderId)} ·{' '}
                                {available === null ? 'Unknown' : available}{' '}
                                {change.denomination}
                              </option>
                            );
                          })}
                        </select>
                        <small>Recorded balance</small>
                      </td>
                    )}
                    <td>
                      <select
                        aria-label={`Change ${index + 1} holder`}
                        value={change.holderId}
                        onChange={(e) => {
                          const fresh = existingSettlement
                            ? makeSettlementChange(
                                e.target.value,
                                change.denomination,
                                otherRows,
                                change.quantity <= 0
                              )
                            : makeChange(
                                e.target.value,
                                change.denomination,
                                request.receiptMode,
                                otherRows
                              );
                          update(index, {
                            ...fresh,
                            quantity: change.quantity,
                            fee: change.fee,
                          });
                        }}
                      >
                        {holders.map((h) => (
                          <option
                            key={h.id}
                            value={h.id}
                            disabled={h.removed && !existingMode}
                          >
                            {h.name}
                            {h.removed
                              ? ' · recorded holder'
                              : 'strength' in h
                              ? ''
                              : ' · storage'}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        aria-label={`Change ${index + 1} denomination`}
                        value={change.denomination}
                        onChange={(e) => {
                          const code = bankDenominations.find(
                            (c) => c === e.target.value
                          );
                          if (code)
                            update(index, {
                              ...(existingSettlement
                                ? makeSettlementChange(
                                    change.holderId,
                                    code,
                                    otherRows,
                                    change.quantity <= 0
                                  )
                                : makeChange(
                                    change.holderId,
                                    code,
                                    request.receiptMode,
                                    otherRows
                                  )),
                              quantity: change.quantity,
                              fee: change.fee,
                            });
                        }}
                      >
                        {bankDenominations.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        aria-label={`Change ${index + 1} stack`}
                        value={
                          selected?.item.id ??
                          (existingMode
                            ? ''
                            : 'new:' + (change.item.containerId ?? ''))
                        }
                        onChange={(e) => {
                          const found = options.find(
                            (s) => s.item.id === e.target.value
                          );
                          update(index, {
                            item:
                              found?.item ??
                              (existingMode
                                ? change.item
                                : newBankMoneyItem(
                                    change.denomination,
                                    uid(),
                                    e.target.value.slice(4) || null
                                  )),
                          });
                        }}
                      >
                        {existingMode && (
                          <option value="">
                            {existingSettlement
                              ? 'Choose recorded balance or incoming stack'
                              : 'Choose existing stack'}
                          </option>
                        )}
                        {options.map((s) => {
                          const item =
                            holder?.inventory.find((i) => i.id === s.item.id) ??
                            s.item;
                          const note = sourceNote(item);
                          return (
                            <option
                              key={s.item.id}
                              value={s.item.id}
                              disabled={
                                existingMode &&
                                s.item.id !== change.item.id &&
                                remainingQuantity(s, otherRows, settlement) ===
                                  0
                              }
                            >
                              {s.direction === 'outgoing' && 'Outgoing · '}
                              {s.direction === 'incoming' && 'Incoming · '}
                              {item.name ||
                                getInventoryItemInfo(
                                  item,
                                  encumbranceCatalogById
                                )?.name}{' '}
                              · {existingMode ? 'current ' : ''}
                              {s.currentQuantity}
                              {existingMode || !unselected(s, otherRows)
                                ? ' · available ' +
                                  (remainingQuantity(
                                    s,
                                    otherRows,
                                    settlement
                                  )?.toLocaleString() ?? 'Unknown')
                                : ''}
                              {item.containerId
                                ? ' · ' +
                                  (holder?.inventory.find(
                                    (i) => i.id === item.containerId
                                  )?.name || 'container')
                                : ''}
                              {note && ` · ${note}`}
                            </option>
                          );
                        })}
                        {!existingMode && (
                          <option value="new:">New stack · loose</option>
                        )}
                        {!existingMode &&
                          holder?.inventory
                            .filter(
                              (i) =>
                                getInventoryItemInfo(i, encumbranceCatalogById)
                                  ?.isContainer
                            )
                            .map((i) => (
                              <option key={i.id} value={'new:' + i.id}>
                                New stack ·{' '}
                                {i.name ||
                                  getInventoryItemInfo(
                                    i,
                                    encumbranceCatalogById
                                  )?.name}
                              </option>
                            ))}
                      </select>
                      {existingMode && !selected && (
                        <small>Choose an available stack</small>
                      )}
                    </td>
                    <td>
                      <input
                        aria-label={`Change ${index + 1} quantity`}
                        type="number"
                        step={1}
                        min={
                          existingMode && !existingSettlement ? 1 : undefined
                        }
                        value={
                          Number.isFinite(change.quantity)
                            ? change.quantity
                            : ''
                        }
                        onChange={(e) =>
                          update(index, {
                            // Browsers expose both blank and malformed number input as NaN.
                            quantity: e.target.validity.badInput
                              ? Infinity
                              : e.target.valueAsNumber,
                          })
                        }
                      />
                      {(!Number.isSafeInteger(change.quantity) ||
                        change.quantity === 0) && (
                        <small>
                          {Number.isNaN(change.quantity) ||
                          change.quantity === 0
                            ? 'Enter quantity'
                            : 'Enter a whole quantity'}
                        </small>
                      )}
                      {!existingMode &&
                        Number.isSafeInteger(change.quantity) &&
                        change.quantity !== 0 &&
                        summaryPreview?.candidate.status === 'posted' &&
                        !(separated && change.quantity > 0) &&
                        resulting != null && (
                          <small>
                            Resulting stack {resulting?.toLocaleString()}
                          </small>
                        )}
                    </td>
                    {request.kind === 'exchange' && (
                      <td>
                        <input
                          aria-label={`Change ${index + 1} is fee`}
                          type="checkbox"
                          checked={!!change.fee}
                          onChange={(e) =>
                            update(index, { fee: e.target.checked })
                          }
                        />
                      </td>
                    )}
                    <td>
                      <button
                        aria-label={`Remove change ${index + 1}`}
                        disabled={rows.length === 1}
                        onClick={() =>
                          setRequest({
                            ...request,
                            changes: request.changes.filter((_, i) =>
                              existingTransfer
                                ? i !== index * 2 && i !== index * 2 + 1
                                : i !== index
                            ),
                          })
                        }
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button
          className={styles['addBankRow']}
          onClick={() => {
            const last = request.changes[request.changes.length - 1];
            setError('');
            setRequest({
              ...request,
              changes: [
                ...request.changes,
                ...(existingSettlement
                  ? [
                      makeSettlementChange(
                        last?.holderId,
                        last?.denomination,
                        request.changes,
                        !request.changes.some((c) => c.quantity < 0)
                      ),
                    ]
                  : existingTransfer
                  ? makeTransferPair(
                      request.changes,
                      request.changes[request.changes.length - 2]?.holderId,
                      last?.holderId,
                      last?.denomination
                    )
                  : [
                      makeChange(
                        last?.holderId,
                        last?.denomination,
                        request.receiptMode,
                        rows,
                        existingMode
                      ),
                    ]),
              ],
            });
          }}
        >
          {existingMode && !existingSettlement ? '+ Stack' : '+ Money change'}
        </button>
        {separated && incoming && (
          <details>
            <summary>Incoming stacks by source</summary>
            <ul>
              {incoming.map((c, i) => (
                <li key={i}>
                  {bankHolderName(document, c.holderId)} · {c.quantity}{' '}
                  {c.denomination} · {c.item.name || c.item.catalogId} · Day{' '}
                  {c.item.day}
                  {sourceNote(c.item) && ' · ' + sourceNote(c.item)}
                </li>
              ))}
            </ul>
          </details>
        )}
        {(request.kind === 'purchase' || request.kind === 'fee') && (
          <output
            aria-label="Payment total"
            className={styles['bankSummaryTitle']}
          >
            Payment total: {paymentTotal(request.changes)}
          </output>
        )}
        {needsDay && (
          <label className={styles['incomeDay']}>
            Day for new stacks
            <input
              type="number"
              min={0}
              step={1}
              required
              value={incomeDay}
              onChange={(e) => setIncomeDay(e.target.value)}
            />
          </label>
        )}
        {existingMode ? (
          <>
            <BankBalances
              showTotals
              label="Proposed ledger balances"
              caption="Ledger balances after saving"
              rows={holders
                .filter((h) => request.changes.some((c) => c.holderId === h.id))
                .map((h) => ({
                  id: h.id,
                  label: h.name,
                  amounts: invalid
                    ? unknown
                    : bankBalance(projectedLedger, h.id, sessionId),
                }))}
            />
            {remaining.length || invalid ? (
              <BankBalances
                showTotals
                label="Remaining differences"
                caption={
                  existingTransfer || existingSettlement
                    ? 'Still to reconcile'
                    : 'Still to record'
                }
                signed
                rows={(invalid
                  ? holders.map((h) => ({
                      holderId: h.id,
                      difference: unknown,
                    }))
                  : remaining
                ).map((r) => ({
                  id: r.holderId,
                  label: bankHolderName(document, r.holderId),
                  amounts: r.difference,
                }))}
              />
            ) : (
              <section>
                <h3 className={styles['bankSummaryTitle']}>Still to record</h3>
                <p role="status">No remaining reconciliation difference.</p>
              </section>
            )}
          </>
        ) : summaryPreview?.candidate.status === 'draft' ? (
          <p>
            Historical draft. Choose its earlier opening through Extend history
            backward to reconcile this transaction.
          </p>
        ) : (
          proposedInventory && (
            <BankBalances
              showTotals
              label="Proposed possessions"
              caption={
                physicalProgress
                  ? 'Possessions after entered changes'
                  : 'Possessions after saving'
              }
              rows={holders
                .filter((h) => request.changes.some((c) => c.holderId === h.id))
                .map((h) => ({
                  id: h.id,
                  label: h.name,
                  amounts: invalid
                    ? unknown
                    : holderMoney(proposedInventory, h.id),
                }))}
            />
          )
        )}
        {entry?.receiptMode === 'existing' && (
          <details>
            <summary>
              {existingTransfer
                ? 'Recorded transfer allocations'
                : existingSettlement
                ? 'Recorded money changes'
                : 'Recorded receipt allocations'}
            </summary>
            <table
              aria-label={
                existingTransfer
                  ? 'Recorded transfer allocations'
                  : existingSettlement
                  ? 'Recorded money changes'
                  : 'Recorded receipt allocations'
              }
            >
              <thead>
                <tr>
                  <th>Holder / stack</th>
                  <th>Denomination</th>
                  <th>Allocated</th>
                  <th>
                    {existingTransfer
                      ? 'Recorded quantity'
                      : 'Recorded stack quantity'}
                  </th>
                  <th>GP per unit</th>
                </tr>
              </thead>
              <tbody>
                {entry.changes.map((c, index) => (
                  <tr key={index}>
                    <th>
                      {bankHolderName(document, c.holderId)} ·{' '}
                      {c.item.name || c.item.id}
                      <small>
                        {c.item.containerId
                          ? 'Container ' + c.item.containerId
                          : 'Loose'}
                      </small>
                    </th>
                    <td>{c.denomination}</td>
                    <td>{c.quantity.toLocaleString()}</td>
                    <td>{c.item.quantity.toLocaleString()}</td>
                    <td>
                      {bankGp({ ...zeroBankAmounts(), [c.denomination]: 1 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
        {balanceProgress && unallocated.length > 0 && !invalid && (
          <p role="status">Still to enter: {unallocated.join(', ')}.</p>
        )}
        {(error || invalid || saveError) && (
          <p role="alert">{error || invalid || saveError}</p>
        )}
        <div className={styles['footer']}>
          {entry && (
            <button onClick={() => submit(true)}>Delete transaction</button>
          )}
          <button onClick={onClose}>Cancel</button>
          <button
            className={styles['primary']}
            disabled={!preview}
            onClick={() => submit()}
          >
            {preview?.candidate.status === 'draft'
              ? 'Save historical draft'
              : 'Save transaction'}
          </button>
        </div>
      </section>
    </div>
  );
}
