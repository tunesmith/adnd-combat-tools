import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureBagOfHolding,
  BAG_OF_HOLDING_STATS,
  TreasureBagOfHolding,
} from '../../../tables/dungeon/treasureBagOfHolding';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';

const LABELS: Record<TreasureBagOfHolding, string> = {
  [TreasureBagOfHolding.TypeI]: 'Type I',
  [TreasureBagOfHolding.TypeII]: 'Type II',
  [TreasureBagOfHolding.TypeIII]: 'Type III',
  [TreasureBagOfHolding.TypeIV]: 'Type IV',
};

export function renderTreasureBagOfHoldingDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureBagOfHolding') return [];
  const stats = BAG_OF_HOLDING_STATS[outcome.event.result];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Bag of Holding',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${LABELS[outcome.event.result]}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: bagOfHoldingSentence(stats),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureBagOfHoldingCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureBagOfHolding') return [];
  const stats = BAG_OF_HOLDING_STATS[outcome.event.result];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Bag of Holding',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: bagOfHoldingSentence(stats),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureBagOfHoldingPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Bag of Holding Capacity',
    sides: treasureBagOfHolding.sides,
    entries: treasureBagOfHolding.entries.map(({ range, command }) => ({
      range,
      label: previewLabel(command),
    })),
  });

export function bagOfHoldingSentence({
  bagWeight,
  weightLimit,
  volumeLimit,
}: {
  bagWeight: number;
  weightLimit: number;
  volumeLimit: number;
}): string {
  return `There is a bag of holding (${volumeLimit} cu. ft., ${weightLimit.toLocaleString()} lb capacity; bag weight ${bagWeight} lb).`;
}

function previewLabel(command: TreasureBagOfHolding): string {
  const stats = BAG_OF_HOLDING_STATS[command];
  return `${LABELS[command]} (${stats.volumeLimit} cu. ft.)`;
}
