import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';

export function renderTrickTrapDetail(
  outcome: OutcomeEventNode
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

function formatTrickTrap(result: number): string {
  return `There is a trick or trap. (roll ${result}) -- check again in 30'. `;
}
