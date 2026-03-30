import type {
  DungeonMessage,
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import { numberOfExits, NumberOfExits } from './numberOfExitsTable';
import {
  ExitDirection,
  ExitLocation,
  type ExitAlternative,
} from './exitLocationsTable';
import {
  findChildEvent,
  type AppendPreviewFn,
  joinSegments,
} from '../../../adapters/render/shared';
import { formatInlineAlternative } from './exitLocationRender';

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
  const nodes: DungeonRenderNode[] = [heading, bullet];
  const summary = describeNumberOfExitsCompactSummary(node);
  if (summary.text.length > 0) {
    nodes.push({ kind: 'paragraph', text: summary.text });
  }
  if (summary.nodes && summary.nodes.length > 0) {
    nodes.push(...summary.nodes);
  }
  return nodes;
}

export function describeNumberOfExitsCompactSummary(node: OutcomeEventNode): {
  text: string;
  nodes?: DungeonMessage[];
} {
  if (node.event.kind !== 'numberOfExits') return { text: '' };
  const summary = describeNumberOfExits(node, { includeInstructions: false });
  const exitMeta = collectExitSummariesWithMeta(node);
  if ((node.event.count ?? 0) > 0 && exitMeta.items.length > 0) {
    return {
      text: '',
      nodes: [
        {
          kind: 'exit-list',
          intro: `${summary.compactText.trim()}:`,
          items: exitMeta.items,
          footnote: exitMeta.hasAlternative ? EXIT_ALTERNATIVE_NOTE : undefined,
        },
      ],
    };
  }
  const combinedParts = [summary.compactText, ...exitMeta.sentences];
  if (exitMeta.hasAlternative) {
    combinedParts.push(EXIT_ALTERNATIVE_NOTE);
  }
  return { text: joinSegments(combinedParts) };
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

function describeNumberOfExits(
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
  const summary = formatNumberOfExits(node, {
    includeInstructions: options.includeInstructions,
  }).trim();
  const compactSummary = formatNumberOfExits(node, {
    includeInstructions: false,
  }).trim();
  return {
    detailParagraphs: summary.length
      ? [{ kind: 'paragraph', text: `${summary} ` }]
      : [],
    compactText: compactSummary.length ? `${compactSummary} ` : '',
    includeAlternativeNote:
      node.event.result === NumberOfExits.DoorChamberOrPassageRoom ||
      hasExitAlternative(node),
  };
}

function hasExitAlternative(node: OutcomeEventNode | undefined): boolean {
  if (!node || node.type !== 'event') return false;
  for (const child of node.children ?? []) {
    if (child.type !== 'event') continue;
    if (child.event.kind === 'exitAlternative') return true;
    if (hasExitAlternative(child)) return true;
  }
  return false;
}

function collectExitSummariesWithMeta(node: OutcomeEventNode): {
  sentences: string[];
  items: string[];
  hasAlternative: boolean;
} {
  if (node.event.kind !== 'numberOfExits')
    return { sentences: [], items: [], hasAlternative: false };
  const sentences: string[] = [];
  const items: string[] = [];
  let hasAlternative = false;
  for (const child of node.children ?? []) {
    if (child.type !== 'event') continue;
    const event = child.event;
    if (event.kind === 'passageExitLocation') {
      const alternative = findChildEvent(child, 'exitAlternative');
      const altResult =
        alternative && alternative.type === 'event'
          ? ((alternative.event as { result?: unknown })
              .result as ExitAlternative)
          : undefined;
      hasAlternative = hasAlternative || altResult !== undefined;
      const summary = formatExit(
        event.result,
        'passage',
        event.index,
        event.total
      );
      if (summary.length > 0) sentences.push(summary);
      const direction = findChildEvent(child, 'exitDirection');
      if (direction && direction.type === 'event') {
        const dirText = formatDirectionSentence(
          (direction.event as { result?: unknown }).result as ExitDirection,
          altResult
        );
        if (dirText.length > 0) sentences.push(dirText);
        const item = formatPassageExitListItem(
          event.result,
          (direction.event as { result?: unknown }).result as ExitDirection,
          altResult
        );
        if (item.length > 0) items.push(item);
      } else {
        const item = formatExitListLocation(event.result);
        if (item.length > 0) items.push(item);
      }
    } else if (event.kind === 'doorExitLocation') {
      const alternative = findChildEvent(child, 'exitAlternative');
      const altResult =
        alternative && alternative.type === 'event'
          ? ((alternative.event as { result?: unknown })
              .result as ExitAlternative)
          : undefined;
      hasAlternative = hasAlternative || altResult !== undefined;
      const summary = formatExit(
        event.result,
        'door',
        event.index,
        event.total
      );
      if (altResult !== undefined) {
        const inline = formatInlineAlternative('door', altResult);
        if (inline.length > 0) {
          const trimmedSummary = summary.endsWith('.')
            ? summary.slice(0, -1)
            : summary;
          const suffix = inline.startsWith('or ')
            ? ` (${inline})`
            : ` ${inline}`;
          sentences.push(`${trimmedSummary}${suffix}.`);
          const item = formatDoorExitListItem(event.result, altResult);
          if (item.length > 0) items.push(item);
          continue;
        }
      }
      if (summary.length > 0) sentences.push(summary);
      const item = formatDoorExitListItem(event.result, altResult);
      if (item.length > 0) items.push(item);
      const direction = findChildEvent(child, 'exitDirection');
      if (direction && direction.type === 'event') {
        const dirText = formatDirectionSentence(
          (direction.event as { result?: unknown }).result as ExitDirection,
          altResult
        );
        if (dirText.length > 0) sentences.push(dirText);
      }
    }
  }
  return { sentences, items, hasAlternative };
}

function formatNumberOfExits(
  node: OutcomeEventNode,
  options: { includeInstructions: boolean }
): string {
  if (node.event.kind !== 'numberOfExits') return '';
  const result = node.event.result;
  const count = node.event.count ?? 0;
  const isRoom = node.event.context?.isRoom ?? false;
  const baseExitType: 'door' | 'passage' = isRoom ? 'door' : 'passage';
  const flippedExitType = baseExitType === 'door' ? 'passage' : 'door';
  const noun =
    result === NumberOfExits.DoorChamberOrPassageRoom
      ? flippedExitType
      : baseExitType;
  const nounPlural = noun === 'door' ? 'doors' : 'passages';
  const nounSingular = noun === 'door' ? 'door' : 'passage';

  if (count === 0) {
    const checkText =
      noun === 'passage'
        ? " Check once per 10' for 25% chance of secret door (characters would still need to detect)."
        : '';
    return `There are no other ${nounPlural}.${checkText}`;
  }

  if (result === NumberOfExits.DoorChamberOrPassageRoom) {
    return `There is a ${nounSingular} leaving this ${
      isRoom ? 'room' : 'chamber'
    }.`;
  }

  if (result === NumberOfExits.OneToFour) {
    const prefix = count === 1 ? 'There is' : 'There are';
    const nounChoice = count === 1 ? nounSingular : nounPlural;
    return `${prefix} ${count || 1} additional ${nounChoice}`;
  }

  const prefix = count === 1 ? 'There is' : 'There are';
  const nounChoice = count === 1 ? nounSingular : nounPlural;
  let sentence = `${prefix} ${count} additional ${nounChoice}`;
  if (options.includeInstructions) {
    sentence = `${sentence} See the exit location rolls below.`;
  }
  return sentence;
}

function formatExit(
  result: ExitLocation,
  kind: 'door' | 'passage',
  index: number,
  total: number
): string {
  const noun = kind === 'door' ? 'Door' : 'Passage';
  const suffix = total > 1 ? ` of ${total}` : '';
  const position = formatExitLocation(result);
  return `${noun} ${index}${suffix}: ${position}.`;
}

function formatDirectionSentence(
  result: ExitDirection,
  alternative?: ExitAlternative,
  noteMarker = ''
): string {
  const altText =
    alternative !== undefined
      ? `${formatInlineAlternative('passage', alternative)}${noteMarker}`
      : '';
  const suffix = altText.length > 0 ? ` (${altText})` : '';
  switch (result) {
    case ExitDirection.LeftRight45:
      return `The passage angles 45° to the left${suffix}.`;
    case ExitDirection.RightLeft45:
      return `The passage angles 45° to the right${suffix}.`;
    default:
      return `The passage continues straight ahead${suffix}.`;
  }
}

function formatPassageExitListItem(
  result: ExitLocation,
  direction: ExitDirection,
  alternative?: ExitAlternative
): string {
  return joinSegments([
    formatExitListLocation(result),
    formatDirectionSentence(direction, alternative, '*'),
  ]);
}

function formatDoorExitListItem(
  result: ExitLocation,
  alternative?: ExitAlternative
): string {
  const position = capitalizePhrase(formatExitLocation(result));
  const altText =
    alternative !== undefined
      ? formatInlineAlternative('door', alternative)
      : '';
  const suffix = altText.length > 0 ? ` (${altText}*)` : '';
  return `${position}${suffix}.`;
}

function formatExitListLocation(result: ExitLocation): string {
  const position = capitalizePhrase(formatExitLocation(result));
  return position.length > 0 ? `${position}.` : '';
}

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

function capitalizePhrase(text: string): string {
  if (text.length === 0) return text;
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

function formatRange(range: number[]): string {
  return range.length === 1
    ? `${range[0]}`
    : `${range[0]}–${range[range.length - 1]}`;
}
