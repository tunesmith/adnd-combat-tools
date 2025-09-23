import type {
  DungeonMessage,
  DungeonRenderNode,
  DungeonTablePreview,
} from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import type { AppendPreviewFn } from './shared';

export function renderTrickTrapDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'trickTrap') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Trick / Trap',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — TBD`],
  };
  const summary = describeTrickTrap(outcome);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  nodes.push(...summary.detailParagraphs);
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function describeTrickTrap(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'trickTrap') {
    return { detailParagraphs: [], compactText: '' };
  }
  const text = formatTrickTrap(node.event.result);
  const detailParagraphs: DungeonMessage[] = text.length
    ? [{ kind: 'paragraph', text }]
    : [];
  return { detailParagraphs, compactText: text };
}

export function renderTrickTrapCompact(node: OutcomeEventNode): string {
  const summary = describeTrickTrap(node);
  return summary.compactText;
}

export function buildTrickTrapPreview(tableId: string): DungeonTablePreview {
  return {
    kind: 'table-preview',
    id: tableId,
    title: 'Trick / Trap',
    sides: 20,
    entries: [
      { range: '1–20', label: 'Not yet implemented — use GM judgment' },
    ],
  };
}

function formatTrickTrap(result: number): string {
  return `There is a trick or trap. (roll ${result}) -- check again in 30'. `;
}
