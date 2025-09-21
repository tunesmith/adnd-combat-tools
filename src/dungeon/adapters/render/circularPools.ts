import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  circularContents,
  CircularContents,
} from '../../../tables/dungeon/unusualShape';
import { pool, Pool } from '../../../tables/dungeon/pool';
import { buildPreview, type TablePreviewFactory } from './shared';

export function renderCircularContentsDetail(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'circularContents') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Circular Contents',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        CircularContents[outcome.event.result] ??
        String(outcome.event.result)
      }`,
    ],
  };
  const extra = formatCircularContents(outcome.event.result);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (extra.length > 0) {
    nodes.push({ kind: 'paragraph', text: `${extra} ` });
  }
  return nodes;
}

export function renderCircularContentsCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return renderCircularContentsDetail(outcome);
}

export function renderCircularPoolDetail(
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

export function renderCircularPoolCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return renderCircularPoolDetail(outcome);
}

export const buildCircularContentsPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Circular Contents',
    sides: circularContents.sides,
    entries: circularContents.entries.map((entry) => ({
      range: entry.range,
      label: CircularContents[entry.command] ??
        String(entry.command),
    })),
  });

export const buildCircularPoolPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Pool',
    sides: pool.sides,
    entries: pool.entries.map((entry) => ({
      range: entry.range,
      label: Pool[entry.command] ?? String(entry.command),
    })),
  });

export function formatCircularContents(result: CircularContents): string {
  switch (result) {
    case CircularContents.Pool:
      return 'There is a pool.';
    case CircularContents.Well:
      return 'There is a well. ';
    case CircularContents.Shaft:
      return 'There is a shaft. ';
    default:
      return '';
  }
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
