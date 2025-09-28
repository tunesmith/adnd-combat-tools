import type {
  DungeonMessage,
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  numberOfExits,
  NumberOfExits,
} from '../../../tables/dungeon/numberOfExits';
import { ExitLocation } from '../../../tables/dungeon/exitLocation';
import { ExitDirection } from '../../../tables/dungeon/exitDirection';
import { findChildEvent, type AppendPreviewFn } from './shared';
import { formatInlineAlternative } from './exitLocation';

export function renderNumberOfExitsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'numberOfExits') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Exits',
  };
  const label =
    NumberOfExits[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const summary = describeNumberOfExits(outcome, { includeInstructions: true });
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (summary.detailParagraphs.length > 0) {
    nodes.push(...summary.detailParagraphs);
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderNumberOfExitsCompact(
  node: OutcomeEventNode
): DungeonRenderNode[] {
  if (node.event.kind !== 'numberOfExits') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Exits',
  };
  const label = NumberOfExits[node.event.result] ?? String(node.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${node.roll} — ${label}`],
  };
  const summary = describeNumberOfExits(node, { includeInstructions: false });
  const exitSummaries = collectExitSummaries(node);
  const combined = [summary.compactText, ...exitSummaries]
    .map((text) => text.trim())
    .filter((text) => text.length > 0)
    .join(' ');
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (combined.length > 0) {
    nodes.push({ kind: 'paragraph', text: `${combined} ` });
  }
  return nodes;
}

export function buildNumberOfExitsPreview(
  tableId: string,
  context?: TableContext
): DungeonTablePreview {
  return {
    kind: 'table-preview',
    id: tableId,
    title: 'Number of Exits',
    sides: numberOfExits.sides,
    entries: numberOfExits.entries.map((entry) => ({
      range: formatRange(entry.range),
      label: NumberOfExits[entry.command] ?? String(entry.command),
    })),
    context,
  };
}

export function describeNumberOfExits(
  node: OutcomeEventNode,
  options: { includeInstructions: boolean }
): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'numberOfExits') {
    return { detailParagraphs: [], compactText: '' };
  }
  const detailText = formatNumberOfExits(node, {
    includeInstructions: options.includeInstructions,
  }).trim();
  const compactText = formatNumberOfExits(node, {
    includeInstructions: false,
  }).trim();
  if (detailText.length === 0 && compactText.length === 0) {
    return { detailParagraphs: [], compactText: '' };
  }
  const detailParagraphs: DungeonMessage[] =
    detailText.length > 0
      ? [{ kind: 'paragraph', text: `${detailText} ` }]
      : [];
  return {
    detailParagraphs,
    compactText,
  };
}

function formatNumberOfExits(
  node: OutcomeEventNode,
  options: { includeInstructions: boolean }
): string {
  if (node.event.kind !== 'numberOfExits') return '';
  const event = node.event;
  const hasResolvedExitPlacement = collectExitSummaries(node).length > 0;
  const shouldAppendInstructions =
    options.includeInstructions && !hasResolvedExitPlacement;
  if (event.result === NumberOfExits.DoorChamberOrPassageRoom) {
    const detail = event.context.isRoom ? 'passage' : 'door';
    const followup = event.context.isRoom
      ? 'See the exit location and direction rolls below.'
      : 'See the exit location roll below.';
    const instructions = shouldAppendInstructions ? ` ${followup}` : '';
    return `There is a ${detail} leaving this ${
      event.context.isRoom ? 'room' : 'chamber'
    }.${instructions}`.trim();
  }

  const nounBase = event.context.isRoom ? 'door' : 'passage';
  if (event.count <= 0) {
    const plural = `${nounBase}s`;
    return `There are no other ${plural}. Check once per 10' for 25% chance of secret door (characters would still need to detect).`;
  }
  const plural = event.count === 1 ? nounBase : `${nounBase}s`;
  const verb = event.count === 1 ? 'is' : 'are';
  const rollInfo =
    event.result === NumberOfExits.OneToFour
      ? ` (1d4 result: ${event.count})`
      : '';
  const baseType = event.context.isRoom ? 'door' : 'passage';
  const followup =
    baseType === 'passage'
      ? 'See the exit location and direction rolls below to place them.'
      : 'See the exit location rolls below to place them.';
  const instructions = shouldAppendInstructions ? ` ${followup}` : '';
  return `There ${verb} ${event.count} additional ${plural}${rollInfo}.${instructions}`.trim();
}

function collectExitSummaries(node: OutcomeEventNode): string[] {
  if (!node.children) return [];
  const summaries: string[] = [];
  for (const child of node.children) {
    if (child.type !== 'event') continue;
    if (child.event.kind === 'doorExitLocation') {
      summaries.push(formatExitLocationSummary('door', child));
    } else if (child.event.kind === 'passageExitLocation') {
      summaries.push(formatExitLocationSummary('passage', child));
    }
  }
  return summaries;
}

function formatExitLocationSummary(
  exitType: 'door' | 'passage',
  node: OutcomeEventNode
): string {
  if (
    node.event.kind !== 'doorExitLocation' &&
    node.event.kind !== 'passageExitLocation'
  )
    return '';
  const { index, total, result } = node.event;
  const noun = exitType === 'door' ? 'Door' : 'Passage';
  const suffix = total > 1 ? ` of ${total}` : '';
  const location = formatExitLocationResult(result);
  let sentence = `${noun} ${index}${suffix} is on the ${location}.`;
  if (exitType === 'passage') {
    const direction = findChildEvent(node, 'exitDirection');
    if (direction && direction.event.kind === 'exitDirection') {
      sentence += ` ${formatExitDirectionResult(direction.event.result)}`;
    }
  }
  const alternative = findChildEvent(node, 'exitAlternative');
  if (alternative && alternative.event.kind === 'exitAlternative') {
    sentence += formatInlineAlternative(exitType, alternative.event.result);
  }
  return sentence;
}

function formatExitLocationResult(result: ExitLocation): string {
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

function formatExitDirectionResult(result: ExitDirection): string {
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

function formatRange(range: number[]): string {
  return range.length === 1
    ? `${range[0]}`
    : `${range[0]}–${range[range.length - 1]}`;
}
