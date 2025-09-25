import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import { pool, Pool } from '../../../tables/dungeon/pool';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';

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
  const text = formatCircularPool(outcome.event.result);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (text.length > 0) nodes.push({ kind: 'paragraph', text });
  return nodes;
}

export function formatCircularPool(result: Pool): string {
  switch (result) {
    case Pool.PoolNoMonster:
      return 'There is a pool. ';
    case Pool.PoolMonster:
      return 'There is a pool. There is a monster in the pool. (TODO Monster) ';
    case Pool.PoolMonsterTreasure:
      return 'There is a pool. There is a monster and treasure in the pool. (TODO Monster Treasure) ';
    case Pool.MagicPool:
      return 'There is a pool. It is a magical pool. (In order to find out what it is, characters must enter the magic pool.) ';
    default:
      return '';
  }
}
