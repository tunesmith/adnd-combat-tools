import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
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
import { collectCircularChainSentences } from './magicPool';
import { describeUnusualSizeChain } from './unusualSize';

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
  const nodes: DungeonRenderNode[] = [heading, bullet, { kind: 'paragraph', text }];
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

export function describeUnusualShapeExtras(
  node: OutcomeEventNode
): string {
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
  if (shape || size) {
    text += 'Determine exits, contents, and treasure separately. ';
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
      return (
        'It is odd-shaped. (Draw what shape you desire or what will fit the map -- it is a special shape if desired.) '
      );
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
