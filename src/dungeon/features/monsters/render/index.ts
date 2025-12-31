import type {
  DungeonMessage,
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import type { AppendPreviewFn } from '../../../adapters/render/shared';
import type { MonsterDescription } from './shared';
import {
  describeMonsterLevel,
  buildMonsterLevelPreview,
} from '../monsterLevel/monsterLevelRender';
import {
  describeStandardMonster,
  describeDragonMonster,
  buildStandardMonsterPreview,
  buildDragonPreview,
  isStandardTableId,
  isDragonTableId,
} from './standard';
import {
  describeHumanMonster,
  buildHumanPreview,
} from '../human/humanRender';

export type { MonsterDescription } from './shared';

export function describeMonsterOutcome(
  node: OutcomeEventNode
): MonsterDescription | undefined {
  return (
    describeMonsterLevel(node) ??
    describeStandardMonster(node) ??
    describeDragonMonster(node) ??
    describeHumanMonster(node)
  );
}

export function collectCharacterPartyMessages(
  node: OutcomeEventNode,
  display: 'detail' | 'compact'
): DungeonMessage[] {
  const messages: DungeonMessage[] = [];
  const seen = new Set<string>();

  const visit = (current: OutcomeEventNode): void => {
    const description = describeMonsterOutcome(current);
    if (description) {
      const source =
        display === 'detail'
          ? description.detailParagraphs
          : description.compactMessages ?? [];
      for (const message of source) {
        if (message.kind !== 'character-party') continue;
        if (message.display !== display) continue;
        const key = `${message.display}-${JSON.stringify(message.summary)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        messages.push({
          kind: 'character-party',
          display: message.display,
          summary: message.summary,
        });
      }
    }
    current.children?.forEach((child) => {
      if (child.type === 'event') visit(child);
    });
  };

  visit(node);

  return messages;
}

export function renderMonsterDetailNodes(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const description = describeMonsterOutcome(outcome);
  if (!description) return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: description.heading,
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${description.label}`],
  };
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (description.detailParagraphs.length > 0) {
    nodes.push(...description.detailParagraphs);
  }
  if (description.appendPending) {
    appendPendingPreviews(outcome, nodes);
  }
  return nodes;
}

export function renderMonsterCompactNodes(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const description = describeMonsterOutcome(outcome);
  if (!description) return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: description.heading,
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${description.label}`],
  };
  const nodes: DungeonRenderNode[] = [heading, bullet];
  const compactText = description.compactText;
  if (description.compactMessages && description.compactMessages.length > 0) {
    nodes.push(...description.compactMessages);
  } else if (compactText.length > 0) {
    const segments = compactText
      .split('\n')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);
    if (segments.length === 0) {
      nodes.push({ kind: 'paragraph', text: `${compactText.trim()} ` });
    } else {
      segments.forEach((segment) => {
        nodes.push({ kind: 'paragraph', text: `${segment} ` });
      });
    }
  }
  if (description.appendPending) {
    appendPendingPreviews(outcome, nodes);
  }
  return nodes;
}

export function buildMonsterPreview(
  tableId: string,
  context?: TableContext
): DungeonTablePreview | undefined {
  const base = tableId.split(':')[0] || tableId;
  if (base === 'monsterLevel') {
    return buildMonsterLevelPreview(tableId, context);
  }
  if (isStandardTableId(base)) {
    return buildStandardMonsterPreview(base, context);
  }
  if (isDragonTableId(base)) {
    return buildDragonPreview(base, context);
  }
  if (base === 'human') {
    return buildHumanPreview(tableId, context);
  }
  return undefined;
}
