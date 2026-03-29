import type { PendingRoll } from './outcome';

export function getScopedTableBase(tableId: string): string {
  const [base] = tableId.split(':');
  return base ?? tableId;
}

export function getScopedTableSuffix(tableId: string): string | undefined {
  const parts = tableId.split(':');
  return parts.length >= 2 ? parts.slice(1).join(':') : undefined;
}

export function getPendingRollKind(pending: PendingRoll): string {
  if (typeof pending.kind === 'string' && pending.kind.length > 0) {
    return pending.kind;
  }
  const legacyTable = pending.table ?? '';
  const base = getScopedTableBase(legacyTable);
  return base ?? legacyTable;
}

export function getPendingRollTableId(pending: PendingRoll): string {
  if (typeof pending.table === 'string' && pending.table.length > 0) {
    return pending.table;
  }
  return getPendingRollKind(pending);
}

export function getPendingRollArgs(pending: PendingRoll) {
  return pending.args ?? pending.context;
}

export function getPendingRollTargetId(pending: PendingRoll): string {
  return pending.id ?? getPendingRollTableId(pending);
}

export function createPendingRoll(options: {
  kind: string;
  id?: string;
  args?: PendingRoll['args'];
  tableId?: string;
}): PendingRoll {
  const tableId = options.tableId ?? options.kind;
  return {
    type: 'pending-roll',
    kind: options.kind,
    table: tableId,
    id: options.id,
    args: options.args,
    // Preserve the legacy field while the rest of the codebase migrates.
    context: options.args,
  };
}

export function withPendingRollArgs(
  pending: PendingRoll,
  args: PendingRoll['args']
): PendingRoll {
  return {
    ...pending,
    args,
    context: args,
  };
}
