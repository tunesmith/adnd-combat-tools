import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEvent, OutcomeEventNode } from '../../domain/outcome';
import {
  exitLocation,
  ExitLocation,
  exitAlternative,
  ExitAlternative,
} from '../../../tables/dungeon/exitLocation';
import {
  exitDirection,
  ExitDirection,
} from '../../../tables/dungeon/exitDirection';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';

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
  result: ExitLocation
): string {
  const noun = exitType === 'door' ? 'Door' : 'Passage';
  const position = formatExitLocation(result);
  const suffix = total > 1 ? ` of ${total}` : '';
  return `${noun} ${index}${suffix} is on the ${position}.`;
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
  const summaryText = exitSummary(
    exitType,
    event.index,
    event.total,
    event.result
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
  let summary = exitSummary(exitType, event.index, event.total, event.result);
  const alternative = findChildEvent(outcome, 'exitAlternative');
  if (alternative && alternative.event.kind === 'exitAlternative') {
    summary += formatInlineAlternative(exitType, alternative.event.result);
  }
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
      text: `${formatExitDirection(outcome.event.result)} `,
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
  return [
    heading,
    {
      kind: 'paragraph',
      text: `${formatExitDirection(outcome.event.result)} `,
    },
  ];
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
    items: [`roll: ${outcome.roll} — ${ExitAlternative[outcome.event.result]}`],
  };
  const nodes: DungeonRenderNode[] = [
    heading,
    bullet,
    {
      kind: 'paragraph',
      text: `${
        outcome.event.exitType
          ? formatInlineAlternative(
              outcome.event.exitType,
              outcome.event.result
            ).trim()
          : formatExitAlternative(outcome.event.result)
      } `,
    },
  ];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderExitAlternativeCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'exitAlternative') return [];
  return [
    {
      kind: 'paragraph',
      text: `${formatExitAlternative(outcome.event.result)} `,
    },
  ];
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
      label: formatExitLocationTitle(entry.command),
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
      label: formatExitLocationTitle(entry.command),
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
      label: formatExitDirectionLabel(entry.command),
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
      label: formatExitAlternativeLabel(entry.command),
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
      return 'unknown wall';
  }
}

function formatExitLocationTitle(result: ExitLocation): string {
  const text = formatExitLocation(result);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatExitDirection(result: ExitDirection): string {
  switch (result) {
    case ExitDirection.StraightAhead:
      return 'The passage continues straight ahead.';
    case ExitDirection.LeftRight45:
      return 'The passage angles 45° to the left.';
    case ExitDirection.RightLeft45:
      return 'The passage angles 45° to the right.';
    default:
      return 'The passage takes an unusual course.';
  }
}

function formatExitDirectionLabel(result: ExitDirection): string {
  switch (result) {
    case ExitDirection.StraightAhead:
      return 'Straight ahead';
    case ExitDirection.LeftRight45:
      return 'Angles 45° to the left';
    case ExitDirection.RightLeft45:
      return 'Angles 45° to the right';
    default:
      return 'Unusual course';
  }
}

function formatExitAlternative(result: ExitAlternative): string {
  switch (result) {
    case ExitAlternative.SecretDoor:
      return 'Treat this exit as a secret door into the mapped space.';
    case ExitAlternative.OneWayDoor:
      return 'Treat this exit as a one-way door into the mapped space.';
    case ExitAlternative.OppositeDirection:
      return 'Place this exit on the opposite wall instead.';
    default:
      return 'Use a suitable alternative for the mapped space.';
  }
}

export function formatInlineAlternative(
  exitType: 'door' | 'passage',
  result: ExitAlternative
): string {
  const subject = exitType === 'door' ? 'door' : 'passage';
  const prefix = ` (If the ${subject} is indicated in a wall where the space immediately beyond the wall has already been mapped, then the exit is `;
  const suffix =
    result === ExitAlternative.SecretDoor
      ? 'a secret door.)'
      : result === ExitAlternative.OneWayDoor
      ? 'a one-way door.)'
      : 'in the opposite direction.)';
  return `${prefix}${suffix}`;
}

function formatExitAlternativeLabel(result: ExitAlternative): string {
  switch (result) {
    case ExitAlternative.SecretDoor:
      return 'Secret door';
    case ExitAlternative.OneWayDoor:
      return 'One-way door';
    case ExitAlternative.OppositeDirection:
      return 'Opposite direction';
    default:
      return 'Alternative';
  }
}
