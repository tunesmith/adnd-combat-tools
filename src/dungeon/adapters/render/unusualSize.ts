import type {
  DungeonMessage,
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  unusualSize as unusualSizeTable,
  UnusualSize,
} from '../../../tables/dungeon/unusualSize';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';

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

export function describeUnusualSizeChain(node: OutcomeEventNode): {
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

export const buildUnusualSizePreview: TablePreviewFactory = (
  tableId,
  context?: TableContext
): DungeonTablePreview =>
  buildPreview(tableId, {
    title: 'Unusual Size',
    sides: unusualSizeTable.sides,
    entries: unusualSizeTable.entries.map((entry) => ({
      range: entry.range,
      label: UnusualSize[entry.command] ?? String(entry.command),
    })),
    context,
  });

function describeUnusualSizeEntry(
  node: OutcomeEventNode
): { sentence: string; isPending: boolean } | undefined {
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
