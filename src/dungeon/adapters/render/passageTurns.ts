import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  passageTurns,
  PassageTurns,
} from '../../../tables/dungeon/passageTurns';
import { findChildEvent, type AppendPreviewFn } from './shared';
import { buildPreview, type TablePreviewFactory } from './shared';
import { renderPassageWidthCompact } from './passageWidth';

export function renderPassageTurnsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'passageTurns') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Passage Turns',
  };
  const label =
    PassageTurns[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const nodes: DungeonRenderNode[] = [heading, bullet];
  const summary = describePassageTurn(outcome);
  if (summary.detailParagraphs.length > 0) {
    nodes.push(...summary.detailParagraphs);
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function describePassageTurn(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'passageTurns') {
    return { detailParagraphs: [], compactText: '' };
  }
  const detailText = formatPassageTurn(node.event.result);
  let compactText = detailText;
  const widthNode = findChildEvent(node, 'passageWidth');
  if (widthNode && widthNode.event.kind === 'passageWidth') {
    compactText += renderPassageWidthCompact(widthNode);
  }
  const detailParagraphs: DungeonMessage[] = [];
  if (detailText.length > 0) {
    detailParagraphs.push({ kind: 'paragraph', text: detailText });
  }
  return { detailParagraphs, compactText };
}

export function renderPassageTurnCompact(node: OutcomeEventNode): string {
  if (node.event.kind !== 'passageTurns') return '';
  const summary = describePassageTurn(node);
  return summary.compactText;
}

export function renderPassageTurnsCompactNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'passageTurns') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Passage Turns',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${PassageTurns[outcome.event.result]}`],
  };
  const text = renderPassageTurnCompact(outcome);
  return [heading, bullet, { kind: 'paragraph', text }];
}

export const buildPassageTurnPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Passage Turns',
    sides: passageTurns.sides,
    entries: passageTurns.entries.map((entry) => ({
      range: entry.range,
      label: PassageTurns[entry.command] ?? String(entry.command),
    })),
  });

function formatPassageTurn(result: PassageTurns): string {
  switch (result) {
    case PassageTurns.Left90:
      return "The passage turns left 90 degrees - check again in 30'. ";
    case PassageTurns.Left45:
      return "The passage turns left 45 degrees ahead - check again in 30'. ";
    case PassageTurns.Left135:
      return "The passage turns left 45 degrees behind (135 degrees) - check again in 30'. ";
    case PassageTurns.Right90:
      return "The passage turns right 90 degrees - check again in 30'. ";
    case PassageTurns.Right45:
      return "The passage turns right 45 degrees ahead - check again in 30'. ";
    case PassageTurns.Right135:
      return "The passage turns right 45 degrees behind (135 degrees) - check again in 30'. ";
    default:
      return '';
  }
}
