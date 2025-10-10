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

const EXIT_ALTERNATIVE_NOTE =
  'If an exit abuts mapped space, use the option shown in parentheses.';

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
  if (summary.includeAlternativeNote) {
    nodes.push({ kind: 'paragraph', text: `${EXIT_ALTERNATIVE_NOTE} ` });
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
  const exitMeta = collectExitSummariesWithMeta(node);
  const combinedParts = [summary.compactText, ...exitMeta.sentences];
  if (exitMeta.hasAlternative) {
    combinedParts.push(EXIT_ALTERNATIVE_NOTE);
  }
  const combined = combinedParts
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
  includeAlternativeNote: boolean;
} {
  if (node.event.kind !== 'numberOfExits') {
    return {
      detailParagraphs: [],
      compactText: '',
      includeAlternativeNote: false,
    };
  }
  const detailText = formatNumberOfExits(node, {
    includeInstructions: options.includeInstructions,
  }).trim();
  const compactText = formatNumberOfExits(node, {
    includeInstructions: false,
  }).trim();
  if (detailText.length === 0 && compactText.length === 0) {
    return {
      detailParagraphs: [],
      compactText: '',
      includeAlternativeNote: false,
    };
  }
  const detailParagraphs: DungeonMessage[] =
    detailText.length > 0
      ? [{ kind: 'paragraph', text: `${detailText} ` }]
      : [];
  return {
    detailParagraphs,
    compactText,
    includeAlternativeNote: collectExitSummariesWithMeta(node).hasAlternative,
  };
}

function formatNumberOfExits(
  node: OutcomeEventNode,
  options: { includeInstructions: boolean }
): string {
  if (node.event.kind !== 'numberOfExits') return '';
  const event = node.event;
  const hasResolvedExitPlacement =
    collectExitSummariesWithMeta(node).sentences.length > 0;
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

function collectExitSummariesWithMeta(node: OutcomeEventNode): {
  sentences: string[];
  hasAlternative: boolean;
} {
  if (!node.children) return { sentences: [], hasAlternative: false };
  const sentences: string[] = [];
  let hasAlternative = false;
  for (const child of node.children) {
    if (child.type !== 'event') continue;
    if (
      child.event.kind === 'doorExitLocation' ||
      child.event.kind === 'passageExitLocation'
    ) {
      const summary = formatExitLocationSummary(
        child.event.kind === 'doorExitLocation' ? 'door' : 'passage',
        child
      );
      if (summary.text.length > 0) {
        sentences.push(summary.text);
      }
      hasAlternative = hasAlternative || summary.hasAlternative;
    }
  }
  return { sentences, hasAlternative };
}

function formatExitLocationSummary(
  exitType: 'door' | 'passage',
  node: OutcomeEventNode
): { text: string; hasAlternative: boolean } {
  if (
    node.event.kind !== 'doorExitLocation' &&
    node.event.kind !== 'passageExitLocation'
  )
    return { text: '', hasAlternative: false };
  const { index, total, result } = node.event;
  const noun = exitType === 'door' ? 'Door' : 'Passage';
  const suffix = total > 1 ? ` of ${total}` : '';
  const location = formatExitLocationResult(result);
  let sentence = `${noun} ${index}${suffix}: ${location}`;
  if (exitType === 'passage') {
    const direction = findChildEvent(node, 'exitDirection');
    if (direction && direction.event.kind === 'exitDirection') {
      sentence += `.`;
      sentence += ` ${formatExitDirectionResult(direction.event.result)}`;
    }
  } else {
    sentence += `.`;
  }
  let hasAlternative = false;
  const alternative = findChildEvent(node, 'exitAlternative');
  if (alternative && alternative.event.kind === 'exitAlternative') {
    // remove trailing period before appending
    if (sentence.endsWith('.')) {
      sentence = sentence.slice(0, -1);
    }
    sentence += ` ${formatInlineAlternative(
      exitType,
      alternative.event.result
    )}.`;
    hasAlternative = true;
  }
  if (!sentence.endsWith('.')) {
    sentence += '.';
  }
  return { text: sentence, hasAlternative };
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
      return 'entry wall';
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
