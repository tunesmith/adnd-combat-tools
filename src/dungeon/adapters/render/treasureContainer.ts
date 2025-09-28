import type { DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureContainer,
  TreasureContainer,
} from '../../../tables/dungeon/treasureContainer';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';

const TREASURE_CONTAINER_TEXT: Record<TreasureContainer, string | null> = {
  [TreasureContainer.Bags]: 'The treasure is contained in bags.',
  [TreasureContainer.Sacks]: 'The treasure is contained in sacks.',
  [TreasureContainer.SmallCoffers]: 'The treasure is contained in small coffers.',
  [TreasureContainer.Chests]: 'The treasure is contained in chests.',
  [TreasureContainer.HugeChests]: 'The treasure is contained in huge chests.',
  [TreasureContainer.PotteryJars]: 'The treasure is contained in pottery jars.',
  [TreasureContainer.MetalUrns]: 'The treasure is contained in metal urns.',
  [TreasureContainer.StoneContainers]: 'The treasure is contained in stone containers.',
  [TreasureContainer.IronTrunks]: 'The treasure is contained in iron trunks.',
  [TreasureContainer.Loose]: null,
};

export function describeTreasureContainerResult(
  result: TreasureContainer
): string | null {
  return TREASURE_CONTAINER_TEXT[result] ?? null;
}

export function renderTreasureContainerDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureContainer') return [];
  const nodes: DungeonRenderNode[] = [
    {
      kind: 'heading',
      level: 4,
      text: 'Treasure Container',
    },
  ];
  const label = TreasureContainer[outcome.event.result];
  nodes.push({
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  });
  const text = describeTreasureContainerResult(outcome.event.result);
  if (text) {
    nodes.push({ kind: 'paragraph', text });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureContainerCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureContainer') return [];
  const text = describeTreasureContainerResult(outcome.event.result);
  if (!text) return [];
  return [
    {
      kind: 'heading',
      level: 4,
      text: 'Treasure Container',
    },
    { kind: 'paragraph', text },
  ];
}

export const buildTreasureContainerPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Treasure Container',
    sides: treasureContainer.sides,
    entries: treasureContainer.entries.map((entry) => ({
      range: entry.range,
      label: TreasureContainer[entry.command] ?? String(entry.command),
    })),
  });
