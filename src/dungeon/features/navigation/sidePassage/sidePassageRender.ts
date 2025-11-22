import type {
  DungeonRenderNode,
  DungeonMessage,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import { sidePassages, SidePassages } from './sidePassageTable';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';

export function renderSidePassagesDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = renderSidePassagesCompactNodes(outcome);
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderSidePassagesCompactNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'sidePassages') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Side Passages',
  };
  const label =
    SidePassages[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const summary = describeSidePassage(outcome);
  return [heading, bullet, ...summary.detailParagraphs];
}

export function describeSidePassage(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'sidePassages') {
    return { detailParagraphs: [], compactText: '' };
  }
  const text = formatSidePassage(node.event.result);
  const detailParagraphs: DungeonMessage[] = text.length
    ? [{ kind: 'paragraph', text }]
    : [];
  return { detailParagraphs, compactText: text };
}

function formatSidePassage(result: SidePassages): string {
  switch (result) {
    case SidePassages.Left90:
      return "A side passage branches left 90 degrees. Passages extend -- check again in 30'. ";
    case SidePassages.Right90:
      return "A side passage branches right 90 degrees. Passages extend -- check again in 30'. ";
    case SidePassages.Left45:
      return "A side passage branches left 45 degrees ahead. Passages extend -- check again in 30'. ";
    case SidePassages.Right45:
      return "A side passage branches right 45 degrees ahead. Passages extend -- check again in 30'. ";
    case SidePassages.Left135:
      return "A side passage branches left 45 degrees behind (left 135 degrees). Passages extend -- check again in 30'. ";
    case SidePassages.Right135:
      return "A side passage branches right 45 degrees behind (right 135 degrees). Passages extend -- check again in 30'. ";
    case SidePassages.LeftCurve45:
      return "A side passage branches at a curve, 45 degrees left ahead. Passages extend -- check again in 30'. ";
    case SidePassages.RightCurve45:
      return "A side passage branches at a curve, 45 degrees right ahead. Passages extend -- check again in 30'. ";
    case SidePassages.PassageT:
      return "The passage reaches a 'T' intersection to either side. Passages extend -- check again in 30'. ";
    case SidePassages.PassageY:
      return "The passage reaches a 'Y' intersection, ahead 45 degrees to the left and right. Passages extend -- check again in 30'. ";
    case SidePassages.FourWay:
      return "The passage reaches a four-way intersection. Passages extend -- check again in 30'. ";
    case SidePassages.PassageX:
      return "The passage reaches an 'X' intersection. (If the present passage is horizontal or vertical, it forms a fifth passage into the 'X'.) Passages extend -- check again in 30'. ";
    default:
      return "A side passage branches. Passages extend -- check again in 30'. ";
  }
}

export const buildSidePassagePreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Side Passages',
    sides: sidePassages.sides,
    entries: sidePassages.entries.map((entry) => ({
      range: entry.range,
      label: SidePassages[entry.command] ?? String(entry.command),
    })),
  });
