import type {
  DungeonMessage,
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import type { AppendPreviewFn } from '../shared';
import type { MonsterDescription } from './shared';
import { describeMonsterLevel, buildMonsterLevelPreview } from './level';
import {
  describeStandardMonster,
  describeDragonMonster,
  buildStandardMonsterPreview,
  buildDragonPreview,
  isStandardTableId,
  isDragonTableId,
} from './standard';
import { describeHumanMonster, buildHumanPreview } from './human';

export { renderWanderingMonsterCompact } from './wandering';

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
  const compactText = description.compactText;
  const paragraphText = compactText.endsWith(' ')
    ? compactText
    : `${compactText} `;
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (compactText.length > 0) {
    nodes.push({ kind: 'paragraph', text: paragraphText });
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
