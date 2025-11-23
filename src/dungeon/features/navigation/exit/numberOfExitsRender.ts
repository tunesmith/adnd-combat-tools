import type {
  DungeonMessage,
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import {
  numberOfExits,
  NumberOfExits,
} from './numberOfExitsTable';
import { ExitLocation, type ExitAlternative } from './exitLocationsTable';
import { findChildEvent, type AppendPreviewFn } from '../../../adapters/render/shared';
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
  return {
    detailParagraphs: detailText.length
      ? [{ kind: 'paragraph', text: `${detailText} ` }]
      : [],
    compactText: compactText.length ? `${compactText} ` : '',
    includeAlternativeNote:
      node.event.result === NumberOfExits.DoorChamberOrPassageRoom,
  };
}

export function collectExitSummariesWithMeta(node: OutcomeEventNode): {
  sentences: string[];
  hasAlternative: boolean;
} {
  if (node.event.kind !== 'numberOfExits')
    return { sentences: [], hasAlternative: false };
  const sentences: string[] = [];
  let hasAlternative = false;
  for (const child of node.children ?? []) {
    if (child.type !== 'event') continue;
    const event = child.event;
    if (event.kind === 'passageExitLocation') {
      const summary = formatExit(event.result, 'passage', event.index, event.total);
      if (summary.length > 0) sentences.push(summary);
      const alt = findChildEvent(child, 'exitAlternative');
      if (alt && alt.type === 'event') {
        hasAlternative = true;
        const text = formatInlineAlternative('passage', (alt.event as { result?: unknown }).result as ExitAlternative);
        if (text.length > 0) {
          sentences.push(`(${text.trim()})`);
        }
      }
    } else if (event.kind === 'doorExitLocation') {
      const summary = formatExit(event.result, 'door', event.index, event.total);
      if (summary.length > 0) sentences.push(summary);
      const alt = findChildEvent(child, 'exitAlternative');
      if (alt && alt.type === 'event') {
        hasAlternative = true;
        const text = formatInlineAlternative('door', (alt.event as { result?: unknown }).result as ExitAlternative);
        if (text.length > 0) {
          sentences.push(`(${text.trim()})`);
        }
      }
    }
  }
  return { sentences, hasAlternative };
}

function formatNumberOfExits(
  node: OutcomeEventNode,
  options: { includeInstructions: boolean }
): string {
  if (node.event.kind !== 'numberOfExits') return '';
  const result = node.event.result;
  let base = '';
  switch (result) {
    case NumberOfExits.OneTwo600:
      base = '1 exit if ≤ 600 square feet, otherwise 2 exits.';
      break;
    case NumberOfExits.TwoThree600:
      base = '2 exits if ≤ 600 square feet, otherwise 3 exits.';
      break;
    case NumberOfExits.ThreeFour600:
      base = '3 exits if ≤ 600 square feet, otherwise 4 exits.';
      break;
    case NumberOfExits.ZeroOne1200:
      base = '0 exits if ≤ 1200 square feet, otherwise 1 exit.';
      break;
    case NumberOfExits.ZeroOne1600:
      base = '0 exits if ≤ 1600 square feet, otherwise 1 exit.';
      break;
    case NumberOfExits.OneToFour:
      base = 'Roll 1d4 exits.';
      break;
    case NumberOfExits.DoorChamberOrPassageRoom:
      base = 'Exit type flips (door↔passage) for this location.';
      break;
    default:
      base = '';
  }
  if (!options.includeInstructions) return base;
  if (
    result === NumberOfExits.DoorChamberOrPassageRoom ||
    result === NumberOfExits.OneToFour
  ) {
    return `${base} Resolve each exit below.`;
  }
  return `${base} Resolve each exit below.`;
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
  return `${noun} ${index}${suffix}: ${position}`;
}

function formatExitLocation(result: ExitLocation): string {
  switch (result) {
    case ExitLocation.OppositeWall:
      return 'Opposite wall.';
    case ExitLocation.LeftWall:
      return 'Left wall.';
    case ExitLocation.RightWall:
      return 'Right wall.';
    case ExitLocation.SameWall:
      return 'Same wall.';
    default:
      return '';
  }
}

function formatRange(range: number[]): string {
  return range.length === 1
    ? `${range[0]}`
    : `${range[0]}–${range[range.length - 1]}`;
}
