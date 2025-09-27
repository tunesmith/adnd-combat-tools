import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import { pool, Pool } from '../../../tables/dungeon/pool';
import {
  buildPreview,
  joinSegments,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';
import { describeMonsterOutcome } from './monsters';

export function renderCircularPoolDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildCircularPoolNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderCircularPoolCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildCircularPoolNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildCircularPoolPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Pool',
    sides: pool.sides,
    entries: pool.entries.map((entry) => ({
      range: entry.range,
      label: Pool[entry.command] ?? String(entry.command),
    })),
  });

function buildCircularPoolNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'circularPool') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Pool',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${Pool[outcome.event.result]}`],
  };
  const text = describeCircularPool(outcome);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (text.length > 0) nodes.push({ kind: 'paragraph', text });
  return nodes;
}

export function describeCircularPool(node: OutcomeEventNode): string {
  if (node.event.kind !== 'circularPool') return '';
  const { result } = node.event;
  if (result === Pool.NoPool) return '';

  const segments: string[] = ['There is a pool.'];

  if (result === Pool.PoolNoMonster) {
    return joinSegments(segments);
  }

  if (result === Pool.PoolMonster || result === Pool.PoolMonsterTreasure) {
    const monsterSummaries = collectMonsterSummaries(node);
    if (monsterSummaries.length > 0) {
      segments.push(...monsterSummaries);
    } else {
      segments.push('There is a monster in the pool.');
    }
    if (result === Pool.PoolMonsterTreasure) {
      segments.push('Treasure is present. TODO treasure.');
    }
    return joinSegments(segments);
  }

  // Pool.MagicPool
  segments.push(
    'It is a magical pool. (In order to find out what it is, characters must enter the magic pool.)'
  );
  return joinSegments(segments);
}

function collectMonsterSummaries(node: OutcomeEventNode): string[] {
  const summaries: string[] = [];

  const visit = (current: OutcomeEventNode): void => {
    const description = describeMonsterOutcome(current);
    const text = description?.compactText.trim();
    if (text) summaries.push(text);
    current.children?.forEach((child) => {
      if (child.type === 'event') visit(child);
    });
  };

  node.children?.forEach((child) => {
    if (child.type === 'event') visit(child);
  });

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const summary of summaries) {
    if (!seen.has(summary)) {
      unique.push(summary);
      seen.add(summary);
    }
  }
  return unique;
}
