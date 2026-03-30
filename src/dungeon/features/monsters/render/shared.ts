import type {
  DungeonInlineContent,
  DungeonMessage,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import { emphasizeInlineText } from '../../../helpers/inlineContent';

export interface MonsterDescription {
  heading: string;
  label: string;
  detailParagraphs: DungeonMessage[];
  compactText: string;
  compactInline?: DungeonInlineContent;
  compactMessages?: DungeonMessage[];
  appendPending: boolean;
}

export function monsterTextDescription(text?: string): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
  compactInline?: DungeonInlineContent;
} {
  if (!text || text.length === 0) {
    return { detailParagraphs: [], compactText: '' };
  }
  const emphasizedDetail = emphasizeInlineText(
    text,
    extractLeadingMonsterPhrase(text)
  );
  const compactText = text.trimEnd();
  const emphasizedCompact = emphasizeInlineText(
    compactText,
    extractLeadingMonsterPhrase(compactText)
  );
  return {
    detailParagraphs: [{ kind: 'paragraph', ...emphasizedDetail }],
    compactText,
    compactInline: emphasizedCompact.inline,
  };
}

function extractLeadingMonsterPhrase(text: string): string | undefined {
  const trimmed = text.trim();
  const patterns = [
    /^There (?:is|are) (.+?)(?:[:.](?:\s|$))/,
    /^An? (.+?) is encountered\.(?:\s|$)/,
    /^An? (.+?) is indicated\.(?:\s|$)/,
    /^(.+?) arrives in all (?:his|her|its) fury\.(?:\s|$)/,
    /^(.+?) intervenes personally\.(?:\s|$)/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }
  return undefined;
}

export function hasPendingChildren(node: OutcomeEventNode): boolean {
  return Array.isArray(node.children)
    ? node.children.some((child) => child.type === 'pending-roll')
    : false;
}
