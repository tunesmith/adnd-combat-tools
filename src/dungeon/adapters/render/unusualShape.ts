import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEvent, OutcomeEventNode } from '../../domain/outcome';
import {
  unusualShape as unusualShapeTable,
  UnusualShape,
} from '../../../tables/dungeon/unusualShape';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';
import { describeCircularPool } from './circularPools';
import { formatCircularMagicPool } from './magicPool';
import { formatTransmuteType } from './transmuteType';
import { formatPoolAlignment } from './poolAlignment';
import { describeTransporterLocation } from './transporterLocation';
import { describeUnusualSizeChain } from './unusualSize';
import { formatCircularContents } from './circularContents';

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

export function describeUnusualShapeExtras(node: OutcomeEventNode): string {
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
    case 'transporterLocation': {
      const summary = describeTransporterLocation(eventNode);
      return summary.compactText.trim();
    }
    default:
      return undefined;
  }
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

export const buildUnusualShapePreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Unusual Shape',
    sides: unusualShapeTable.sides,
    entries: unusualShapeTable.entries.map((entry) => ({
      range: entry.range,
      label: UnusualShape[entry.command] ?? String(entry.command),
    })),
  });

export function formatUnusualShape(result: UnusualShape): string {
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
