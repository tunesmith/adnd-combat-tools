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
  const nodes: DungeonRenderNode[] = [heading, bullet, ...summary.detailParagraphs];
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
  const textWithFallback = summary.compactText.length > 0
    ? `${summary.compactText} `
    : `It is about ${
        (unusualSizeBase(outcome.event.result) ?? 3400).toLocaleString()
      } sq. ft. `;
  return [heading, bullet, { kind: 'paragraph', text: textWithFallback }];
}

export function describeUnusualSizeChain(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'unusualSize') {
    return { detailParagraphs: [], compactText: '' };
  }
  const chain = gatherUnusualSizeChain(node);
  const detailParagraphs: DungeonMessage[] = [];
  const compactSegments: string[] = [];
  let accumulatedExtra = (node.event as { extra?: number }).extra ?? 0;
  for (const entry of chain) {
    if (entry.event.kind !== 'unusualSize') continue;
    const eventExtra =
      (entry.event as { extra?: number }).extra ?? accumulatedExtra;
    accumulatedExtra = Math.max(accumulatedExtra, eventExtra);
    if (entry.event.result === UnusualSize.RollAgain) {
      accumulatedExtra += 2000;
      const sentence = `Add 2000 sq. ft. (current total ${accumulatedExtra.toLocaleString()} sq. ft.) and roll again.`;
      detailParagraphs.push({ kind: 'paragraph', text: sentence });
      compactSegments.push(sentence);
      continue;
    }
    const baseArea = unusualSizeBase(entry.event.result);
    if (baseArea !== undefined) {
      const total = baseArea + accumulatedExtra;
      const sentence = `It is about ${total.toLocaleString()} sq. ft.`;
      detailParagraphs.push({ kind: 'paragraph', text: sentence });
      compactSegments.push(sentence);
    }
  }
  return {
    detailParagraphs,
    compactText: compactSegments.join(' '),
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

function gatherUnusualSizeChain(node: OutcomeEventNode): OutcomeEventNode[] {
  const result: OutcomeEventNode[] = [node];
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
    result.push(next);
    current = next;
  }
  return result;
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
