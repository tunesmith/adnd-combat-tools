import type {
  DungeonMessage,
  DungeonRenderNode,
} from '../../../../types/dungeon';
import type { OutcomeEvent, OutcomeEventNode } from '../../../domain/outcome';
import {
  exitLocation,
  ExitLocation,
  exitAlternative,
  ExitAlternative,
  exitDirection,
  ExitDirection,
} from './exitLocationsTable';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';

type ExitLocationEvent = Extract<
  OutcomeEvent,
  { kind: 'passageExitLocation' | 'doorExitLocation' }
>;

function exitHeading(exitType: 'door' | 'passage', index: number): string {
  const label = exitType === 'door' ? 'Door Exit' : 'Passage Exit';
  return `${label} ${index}`;
}

function exitSummary(
  exitType: 'door' | 'passage',
  index: number,
  total: number,
  result: ExitLocation,
  alternative?: ExitAlternative
): string {
  const noun = exitType === 'door' ? 'Door' : 'Passage';
  const suffix = total > 1 ? ` of ${total}` : '';
  const position = formatExitLocation(result);
  let summary = `${noun} ${index}${suffix}: ${position}`;
  if (alternative !== undefined) {
    const inline = formatInlineAlternative(exitType, alternative);
    summary += inline.startsWith('or ') ? ` (${inline})` : ` ${inline}`;
  }
  return `${summary}.`;
}

function buildDetailNodes(
  exitType: 'door' | 'passage',
  event: ExitLocationEvent,
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: exitHeading(exitType, event.index),
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `origin: ${event.origin}`,
      `roll: ${outcome.roll} — ${ExitLocation[event.result]}`,
    ],
  };
  const alternative = findChildEvent(outcome, 'exitAlternative');
  const summaryText = exitSummary(
    exitType,
    event.index,
    event.total,
    event.result,
    alternative && alternative.event.kind === 'exitAlternative'
      ? alternative.event.result
      : undefined
  );
  const nodes: DungeonRenderNode[] = [
    heading,
    bullet,
    {
      kind: 'paragraph',
      text: `${summaryText} `,
    },
  ];
  if (
    exitType === 'passage' &&
    outcome.children?.some(
      (child) =>
        child.type === 'pending-roll' && child.table === 'exitDirection'
    )
  ) {
    nodes.push({
      kind: 'paragraph',
      text: 'Resolve the exit direction below to learn how the passage proceeds. ',
    });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

function buildCompactNodes(
  exitType: 'door' | 'passage',
  event: ExitLocationEvent,
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: exitHeading(exitType, event.index),
  };
  const alternative = findChildEvent(outcome, 'exitAlternative');
  const summary = exitSummary(
    exitType,
    event.index,
    event.total,
    event.result,
    alternative && alternative.event.kind === 'exitAlternative'
      ? alternative.event.result
      : undefined
  );
  const nodes: DungeonRenderNode[] = [
    heading,
    {
      kind: 'paragraph',
      text: `${summary} `,
    },
  ];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderPassageExitLocationDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'passageExitLocation') return [];
  return buildDetailNodes(
    'passage',
    outcome.event,
    outcome,
    appendPendingPreviews
  );
}

export function renderPassageExitLocationCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'passageExitLocation') return [];
  return buildCompactNodes(
    'passage',
    outcome.event,
    outcome,
    appendPendingPreviews
  );
}

export function renderDoorExitLocationDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'doorExitLocation') return [];
  return buildDetailNodes(
    'door',
    outcome.event,
    outcome,
    appendPendingPreviews
  );
}

export function renderDoorExitLocationCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'doorExitLocation') return [];
  return buildCompactNodes(
    'door',
    outcome.event,
    outcome,
    appendPendingPreviews
  );
}

export function renderExitDirectionDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'exitDirection') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: `Exit Direction ${outcome.event.index}`,
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `origin: ${outcome.event.origin}`,
      `roll: ${outcome.roll} — ${ExitDirection[outcome.event.result]}`,
    ],
  };
  const nodes: DungeonRenderNode[] = [
    heading,
    bullet,
    {
      kind: 'paragraph',
      text: formatExitDirection(outcome.event.result),
    },
  ];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderExitDirectionCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'exitDirection') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: `Exit Direction ${outcome.event.index}`,
  };
  const nodes: DungeonRenderNode[] = [
    heading,
    {
      kind: 'paragraph',
      text: formatExitDirection(outcome.event.result),
    },
  ];
  return nodes;
}

export function renderExitAlternativeDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'exitAlternative') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Exit Alternative',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `exit type: ${outcome.event.exitType ?? 'door/passage'}`,
      `roll: ${outcome.roll} — ${ExitAlternative[outcome.event.result]}`,
    ],
  };
  const nodes: DungeonRenderNode[] = [
    heading,
    bullet,
    {
      kind: 'paragraph',
      text: formatExitAlternative(outcome.event.result, outcome.event.exitType),
    },
  ];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderExitAlternativeCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'exitAlternative') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Exit Alternative',
  };
  const nodes: DungeonRenderNode[] = [
    heading,
    {
      kind: 'paragraph',
      text: formatExitAlternative(outcome.event.result, outcome.event.exitType),
    },
  ];
  return nodes;
}

export const buildPassageExitLocationPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Passage Exit Location',
    sides: exitLocation.sides,
    entries: exitLocation.entries.map((entry) => ({
      range: entry.range,
      label: ExitLocation[entry.command] ?? String(entry.command),
    })),
    context,
  });

export const buildDoorExitLocationPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Door Exit Location',
    sides: exitLocation.sides,
    entries: exitLocation.entries.map((entry) => ({
      range: entry.range,
      label: ExitLocation[entry.command] ?? String(entry.command),
    })),
    context,
  });

export const buildExitDirectionPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Exit Direction',
    sides: exitDirection.sides,
    entries: exitDirection.entries.map((entry) => ({
      range: entry.range,
      label: ExitDirection[entry.command] ?? String(entry.command),
    })),
    context,
  });

export const buildExitAlternativePreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Exit Alternative',
    sides: exitAlternative.sides,
    entries: exitAlternative.entries.map((entry) => ({
      range: entry.range,
      label: ExitAlternative[entry.command] ?? String(entry.command),
    })),
    context,
  });

function formatExitLocation(result: ExitLocation): string {
  switch (result) {
    case ExitLocation.OppositeWall:
      return 'opposite wall';
    case ExitLocation.LeftWall:
      return 'left wall';
    case ExitLocation.RightWall:
      return 'right wall';
    case ExitLocation.SameWall:
      return 'same wall';
    default:
      return '';
  }
}

function formatExitDirection(result: ExitDirection): string {
  switch (result) {
    case ExitDirection.LeftRight45:
      return 'The passage angles 45° to the left.';
    case ExitDirection.RightLeft45:
      return 'The passage angles 45° to the right.';
    default:
      return 'The passage continues straight ahead.';
  }
}

function formatExitAlternative(
  result: ExitAlternative,
  exitType?: 'door' | 'passage'
): string {
  const label =
    exitType === 'door' ? 'door' : exitType === 'passage' ? 'passage' : 'exit';
  switch (result) {
    case ExitAlternative.SecretDoor:
      return `If this ${label} abuts mapped space, treat it as a secret door.`;
    case ExitAlternative.OneWayDoor:
      return `If this ${label} abuts mapped space, treat it as a one-way door.`;
    case ExitAlternative.OppositeDirection:
      return `If this ${label} abuts mapped space, route it in the opposite direction.`;
    default:
      return '';
  }
}

export function formatInlineAlternative(
  exitType: 'door' | 'passage',
  alternative: ExitAlternative
): string {
  switch (alternative) {
    case ExitAlternative.SecretDoor:
      return exitType === 'door' ? 'or secret passage' : 'or secret door';
    case ExitAlternative.OneWayDoor:
      return 'or one-way door';
    case ExitAlternative.OppositeDirection:
      return 'or opposite direction';
    default:
      return '';
  }
}
