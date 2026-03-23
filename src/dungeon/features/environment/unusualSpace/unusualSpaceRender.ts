import type {
  DungeonMessage,
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../../../types/dungeon';
import type { OutcomeEvent, OutcomeEventNode } from '../../../domain/outcome';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';
import {
  describeCircularPool,
  describeTransporterLocation,
  formatCircularContents,
  formatCircularMagicPool,
  formatPoolAlignment,
  formatTransmuteType,
} from '../circularPools/circularPoolsRender';
import {
  unusualShape,
  UnusualShape,
  unusualSize,
  UnusualSize,
} from './unusualSpaceTable';

export function renderUnusualShapeDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'unusualShape') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Unusual Shape',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        UnusualShape[outcome.event.result] ?? String(outcome.event.result)
      }`,
    ],
  };
  const text = formatUnusualShape(outcome.event.result);
  const nodes: DungeonRenderNode[] = [
    heading,
    bullet,
    { kind: 'paragraph', text },
  ];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderUnusualShapeCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'unusualShape') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Unusual Shape',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${UnusualShape[outcome.event.result]}`],
  };
  const nodes: DungeonRenderNode[] = [heading, bullet];
  const text = formatUnusualShape(outcome.event.result);
  if (text.length > 0) {
    nodes.push({ kind: 'paragraph', text });
  }
  return nodes;
}

export function renderCompactUnusualDetails(node: OutcomeEventNode): string {
  let text = '';
  const shape = findChildEvent(node, 'unusualShape');
  if (shape && shape.event.kind === 'unusualShape') {
    text += formatUnusualShape(shape.event.result);
    const extras = describeUnusualShapeExtras(shape);
    if (extras.length > 0) {
      text += extras;
    }
  }
  const size = findChildEvent(node, 'unusualSize');
  if (size && size.event.kind === 'unusualSize') {
    const summary = describeUnusualSizeChain(size);
    if (summary.compactText.length > 0) {
      text += `${summary.compactText} `;
    }
  }
  return text;
}

export function renderUnusualSizeDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'unusualSize') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Unusual Size',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        UnusualSize[outcome.event.result] ?? String(outcome.event.result)
      }`,
    ],
  };
  const summary = describeUnusualSizeChain(outcome);
  const nodes: DungeonRenderNode[] = [
    heading,
    bullet,
    ...summary.detailParagraphs,
  ];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderUnusualSizeCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'unusualSize') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Unusual Size',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        UnusualSize[outcome.event.result] ?? String(outcome.event.result)
      }`,
    ],
  };
  const summary = describeUnusualSizeChain(outcome);
  const textWithFallback =
    summary.compactText.length > 0
      ? `${summary.compactText} `
      : `It is about ${(
          unusualSizeBase(outcome.event.result) ?? 3400
        ).toLocaleString()} sq. ft. `;
  return [heading, bullet, { kind: 'paragraph', text: textWithFallback }];
}

function describeUnusualSizeChain(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'unusualSize') {
    return { detailParagraphs: [], compactText: '' };
  }
  const detailParagraphs: DungeonMessage[] = [];
  const current = describeUnusualSizeEntry(node);
  if (current) {
    detailParagraphs.push({ kind: 'paragraph', text: current.sentence });
  }

  const deepest = findDeepestUnusualSize(node);
  const compactEntry = deepest ? describeUnusualSizeEntry(deepest) : undefined;

  return {
    detailParagraphs,
    compactText: compactEntry ? compactEntry.sentence : '',
  };
}

export const buildUnusualShapePreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Unusual Shape',
    sides: unusualShape.sides,
    entries: unusualShape.entries.map((entry) => ({
      range: entry.range,
      label: UnusualShape[entry.command] ?? String(entry.command),
    })),
    context,
  });

export const buildUnusualSizePreview: TablePreviewFactory = (
  tableId,
  context?: TableContext
): DungeonTablePreview =>
  buildPreview(tableId, {
    title: 'Unusual Size',
    sides: unusualSize.sides,
    entries: unusualSize.entries.map((entry) => ({
      range: entry.range,
      label: UnusualSize[entry.command] ?? String(entry.command),
    })),
    context,
  });

function describeUnusualShapeExtras(node: OutcomeEventNode): string {
  if (node.event.kind !== 'unusualShape') return '';
  const sentences = collectCircularChainSentences(node);
  if (sentences.length === 0) return '';
  return sentences
    .map((sentence) =>
      sentence.endsWith('.') || sentence.endsWith('!') || sentence.endsWith('?')
        ? `${sentence} `
        : `${sentence}. `
    )
    .join('');
}

const CIRCULAR_CHAIN_KINDS = new Set<OutcomeEvent['kind']>([
  'circularContents',
  'circularPool',
  'circularMagicPool',
  'transmuteType',
  'poolAlignment',
  'transporterLocation',
]);

function collectCircularChainSentences(node: OutcomeEventNode): string[] {
  const sentences: string[] = [];
  const visited = new Set<string>();
  const queue: OutcomeEventNode[] = (node.children || []).filter(
    (child): child is OutcomeEventNode =>
      child.type === 'event' && CIRCULAR_CHAIN_KINDS.has(child.event.kind)
  );
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const key = current.id ?? `${current.event.kind}-${sentences.length}`;
    if (visited.has(key)) continue;
    visited.add(key);
    const sentence = circularSentenceForEvent(current);
    if (sentence && sentence.length > 0) {
      sentences.push(sentence);
    }
    for (const child of current.children || []) {
      if (child.type !== 'event') continue;
      if (CIRCULAR_CHAIN_KINDS.has(child.event.kind)) {
        queue.push(child);
      }
    }
  }
  return sentences;
}

function circularSentenceForEvent(
  eventNode: OutcomeEventNode
): string | undefined {
  switch (eventNode.event.kind) {
    case 'circularContents':
      return formatCircularContents(eventNode.event.result).trim();
    case 'circularPool':
      return describeCircularPool(eventNode).trim();
    case 'circularMagicPool':
      return formatCircularMagicPool(eventNode.event.result).trim();
    case 'transmuteType':
      return formatTransmuteType(eventNode.event.result).trim();
    case 'poolAlignment':
      return formatPoolAlignment(eventNode.event.result).trim();
    case 'transporterLocation':
      return describeTransporterLocation(eventNode).compactText.trim();
    default:
      return undefined;
  }
}

function describeUnusualSizeEntry(
  node: OutcomeEventNode
): { sentence: string; isPending: boolean } | undefined {
  if (node.event.kind !== 'unusualSize') return undefined;
  const extra = (node.event as { extra?: number }).extra ?? 0;
  if (node.event.result === UnusualSize.RollAgain) {
    const nextExtra = extra + 2000;
    return {
      sentence: `Add 2000 sq. ft. (current total ${nextExtra.toLocaleString()} sq. ft.) and roll again.`,
      isPending: true,
    };
  }
  const baseArea = unusualSizeBase(node.event.result);
  if (baseArea !== undefined) {
    const total = baseArea + extra;
    return {
      sentence: `It is about ${total.toLocaleString()} sq. ft.`,
      isPending: false,
    };
  }
  return undefined;
}

function findDeepestUnusualSize(
  node: OutcomeEventNode
): OutcomeEventNode | undefined {
  let current: OutcomeEventNode | undefined = node;
  const visited = new Set<string>();
  while (current) {
    const next: OutcomeEventNode | undefined = (current.children || []).find(
      (child): child is OutcomeEventNode =>
        child.type === 'event' && child.event.kind === 'unusualSize'
    );
    if (!next) break;
    const key = next.id ?? `${current.id}.unusualSize`;
    if (visited.has(key)) break;
    visited.add(key);
    current = next;
  }
  return current;
}

function unusualSizeBase(result: UnusualSize): number | undefined {
  switch (result) {
    case UnusualSize.SqFt500:
      return 500;
    case UnusualSize.SqFt900:
      return 900;
    case UnusualSize.SqFt1300:
      return 1300;
    case UnusualSize.SqFt2000:
      return 2000;
    case UnusualSize.SqFt2700:
      return 2700;
    case UnusualSize.SqFt3400:
      return 3400;
    default:
      return undefined;
  }
}

function formatUnusualShape(result: UnusualShape): string {
  switch (result) {
    case UnusualShape.Circular:
      return 'It is circular. ';
    case UnusualShape.Triangular:
      return 'It is triangular. ';
    case UnusualShape.Trapezoidal:
      return 'It is trapezoidal. ';
    case UnusualShape.OddShaped:
      return 'It is odd-shaped. (Draw what shape you desire or what will fit the map -- it is a special shape if desired.) ';
    case UnusualShape.Oval:
      return 'It is oval-shaped. ';
    case UnusualShape.Hexagonal:
      return 'It is hexagonal. ';
    case UnusualShape.Octagonal:
      return 'It is octagonal. ';
    case UnusualShape.Cave:
      return 'It is actually a cave. ';
    default:
      return '';
  }
}
