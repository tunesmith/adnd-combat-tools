import { inSessionInventoryOrder } from '../../helpers/campaignInventoryOrder';
import { useRef, useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import {
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
  previousAllocation: number;
  available: number | null;
  direction?: 'incoming' | 'outgoing';
};
export default function BankTransactionDialog({
  document,
  sessionId,
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
  const makeChange = (
    holderId = holders[0]?.id ?? '',
    denomination: BankDenomination = 'gp',
    receiptMode?: 'existing',
    otherChanges: BankChange[] = [],
    allowOtherHolder = false
  ): BankChange => {
    const choices: (typeof stacks[number] & { available: number | null })[] =
      receiptMode === 'existing'
        ? existingMoneyAvailability(document, sessionId, entry?.transactionId)
            .stacks
        : stacks.map((stack) => ({ ...stack, available: null }));
    const hasRoom = (stack: typeof choices[number]) => {
      if (receiptMode !== 'existing') return true;
      const capacity = stack.available;
      if (typeof capacity !== 'number') return false;
      const used = otherChanges
        .filter(
          (c) =>
            c.holderId === stack.holderId &&
            c.denomination === stack.denomination &&
            c.item.id === stack.item.id &&
            Number.isSafeInteger(c.quantity) &&
            c.quantity > 0
        )
        .reduce((sum, c) => sum + c.quantity, 0);
      return capacity > used;
    };
    const source =
      choices.find(
        (s) =>
          s.holderId === holderId &&
          s.denomination === denomination &&
          hasRoom(s)
      ) ??
      (allowOtherHolder
        ? choices.find((s) => s.denomination === denomination && hasRoom(s))
        : undefined);
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
    const options: BankStackOption[] = preferOutgoing
      ? choices.outgoing
      : choices.incoming;
    const selected =
      options.find(
        (c) =>
          c.holderId === holderId &&
          c.denomination === code &&
          (c.available ?? 0) > 0
      ) ??
      (!holderId
        ? options.find((c) => c.denomination === code && (c.available ?? 0) > 0)
        : undefined) ??
      options.find((c) => c.holderId === holderId && c.denomination === code);
    const id = selected?.holderId ?? holderId ?? holders[0]?.id ?? '';
    return {
      holderId: id,
      denomination: code,
      quantity: 0,
      item:
        selected?.item ??
        (preferOutgoing
          ? bankBalanceSourceItem(id, code, 0)
          : makeChange(id, code, 'existing', otherChanges).item),
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
        const destination = destinationOrder.find((stack) => {
          if (stack.holderId === source.holderId || stack.denomination !== code)
            return false;
          const used = otherChanges
            .filter(
              (c) =>
                c.quantity > 0 &&
                c.holderId === stack.holderId &&
                c.item.id === stack.item.id &&
                c.denomination === code
            )
            .reduce((sum, c) => sum + c.quantity, 0);
          return (stack.available ?? 0) > used;
        });
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
        otherChanges,
        true
      ),
    ];
  };
  const [request, setRequest] = useState<BankTransactionRequest>(() => ({
    transactionId: entry?.transactionId ?? uid(),
    sessionId,
    description: entry?.description ?? '',
    kind: entry?.kind ?? 'purchase',
    receiptMode: entry?.receiptMode,
    changes: entry?.changes ?? [
      makeChange(undefined, undefined, entry?.receiptMode),
    ],
  }));
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
  const availableForRow = (
    stack: {
      holderId: string;
      denomination: BankDenomination;
      item: { id: string };
      available: number | null;
      direction?: 'incoming' | 'outgoing';
    },
    index: number
  ) => {
    if (stack.available === null) return null;
    if (existingSettlement && stack.direction && settlement) {
      const other = request.changes.filter(
        (c, i) =>
          i !== index &&
          c.holderId === stack.holderId &&
          c.denomination === stack.denomination &&
          Number.isSafeInteger(c.quantity)
      );
      const incoming = other
          .filter((c) => c.quantity > 0)
          .reduce((n, c) => n + c.quantity, 0),
        outgoing = other
          .filter((c) => c.quantity < 0)
          .reduce((n, c) => n - c.quantity, 0);
      const limit = settlement.limits.find(
        (c) => c.holderId === stack.holderId
      );
      const net =
        stack.direction === 'outgoing'
          ? limit?.outgoing[stack.denomination]
          : limit?.incoming[stack.denomination];
      if (net == null) return null;
      const max =
        stack.direction === 'outgoing'
          ? net + incoming - outgoing
          : net + outgoing - incoming;
      const sameStack = other
        .filter((c) => c.quantity > 0 && c.item.id === stack.item.id)
        .reduce((n, c) => n + c.quantity, 0);
      return Math.max(
        0,
        Math.min(
          max,
          stack.direction === 'incoming'
            ? stack.available - sameStack
            : stack.available + incoming - outgoing
        )
      );
    }

    const others = request.changes.reduce(
      (sum, c, i) =>
        i !== (existingTransfer ? index * 2 + 1 : index) &&
        c.holderId === stack.holderId &&
        c.denomination === stack.denomination &&
        c.item.id === stack.item.id &&
        Number.isSafeInteger(c.quantity) &&
        c.quantity > 0
          ? sum + c.quantity
          : sum,
      0
    );
    return Math.max(0, stack.available - others);
  };
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
  if (completed.length) {
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
          if (current.quantity < 0)
            change = {
              ...change,
              item: bankBalanceSourceItem(
                current.holderId,
                current.denomination,
                settlement?.limits.find((s) => s.holderId === current.holderId)
                  ?.recorded[current.denomination] ?? 0
              ),
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
                    mode === 'existing' &&
                    ['purchase', 'fee', 'exchange'].includes(request.kind)
                      ? request.changes.map((c) => ({
                          ...makeSettlementChange(
                            c.holderId,
                            c.denomination,
                            [],
                            c.quantity <= 0
                          ),
                          quantity: c.quantity,
                          fee: c.fee,
                        }))
                      : request.kind === 'transfer' && mode === 'existing'
                      ? makeTransferPair()
                      : (existingTransfer
                          ? [makeChange()]
                          : request.changes
                        ).reduce<BankChange[]>((changes, change) => {
                          const fresh = makeChange(
                            change.holderId,
                            change.denomination,
                            mode,
                            changes
                          );
                          return [
                            ...changes,
                            {
                              ...change,
                              holderId: fresh.holderId,
                              item: fresh.item,
                            },
                          ];
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
                const options: BankStackOption[] = (
                  (settlement
                    ? [...settlement.outgoing, ...settlement.incoming]
                    : availability?.stacks) ??
                  stacks.map((stack) => ({
                    ...stack,
                    currentQuantity: stack.item.quantity,
                    previousAllocation: 0,
                    available: null,
                  }))
                ).filter(
                  (s) =>
                    s.holderId === change.holderId &&
                    s.denomination === change.denomination
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
                                request.changes.filter((_, i) => i !== index),
                                change.quantity <= 0
                              )
                            : makeChange(
                                e.target.value,
                                change.denomination,
                                request.receiptMode,
                                request.changes.filter((_, i) =>
                                  existingTransfer
                                    ? i !== index * 2 && i !== index * 2 + 1
                                    : i !== index
                                )
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
                                    request.changes.filter(
                                      (_, i) => i !== index
                                    ),
                                    change.quantity <= 0
                                  )
                                : makeChange(
                                    change.holderId,
                                    code,
                                    request.receiptMode,
                                    request.changes.filter((_, i) =>
                                      existingTransfer
                                        ? i !== index * 2 && i !== index * 2 + 1
                                        : i !== index
                                    )
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
                        {options.map((s) => (
                          <option
                            key={s.item.id}
                            value={s.item.id}
                            disabled={
                              existingMode &&
                              s.item.id !== change.item.id &&
                              availableForRow(s, index) === 0
                            }
                          >
                            {settlement && 'direction' in s
                              ? `${
                                  s.direction === 'outgoing'
                                    ? 'Outgoing · '
                                    : 'Incoming · '
                                }`
                              : ''}
                            {s.item.name ||
                              getInventoryItemInfo(
                                s.item,
                                encumbranceCatalogById
                              )?.name}{' '}
                            · {existingMode ? 'current ' : ''}
                            {s.currentQuantity}
                            {availability || settlement
                              ? ' · available ' +
                                (availableForRow(s, index)?.toLocaleString() ??
                                  'Unknown')
                              : ''}
                            {s.item.containerId
                              ? ' · ' +
                                (holder?.inventory.find(
                                  (i) => i.id === s.item.containerId
                                )?.name || 'container')
                              : ''}
                          </option>
                        ))}
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
                          Number.isNaN(change.quantity) ? '' : change.quantity
                        }
                        onChange={(e) =>
                          update(index, { quantity: e.target.valueAsNumber })
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
                        request.changes,
                        true
                      ),
                    ]),
              ],
            });
          }}
        >
          {existingMode && !existingSettlement ? '+ Stack' : '+ Money change'}
        </button>
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
