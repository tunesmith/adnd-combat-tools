import type { DungeonMessage } from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';

export interface MonsterDescription {
  heading: string;
  label: string;
  detailParagraphs: DungeonMessage[];
  compactText: string;
  appendPending: boolean;
}

export function monsterTextDescription(text?: string): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (!text || text.length === 0) {
    return { detailParagraphs: [], compactText: '' };
  }
  return {
    detailParagraphs: [{ kind: 'paragraph', text }],
    compactText: text.trimEnd(),
  };
}

export function hasPendingChildren(node: OutcomeEventNode): boolean {
  return Array.isArray(node.children)
    ? node.children.some((child) => child.type === 'pending-roll')
    : false;
}
