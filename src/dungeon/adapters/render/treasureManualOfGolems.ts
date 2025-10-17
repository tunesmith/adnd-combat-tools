import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureManualOfGolems,
  TreasureManualOfGolems,
} from '../../../tables/dungeon/treasureManualOfGolems';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const MANUAL_LABELS: Record<TreasureManualOfGolems, string> = {
  [TreasureManualOfGolems.Clay]: 'Clay',
  [TreasureManualOfGolems.Flesh]: 'Flesh',
  [TreasureManualOfGolems.Iron]: 'Iron',
  [TreasureManualOfGolems.Stone]: 'Stone',
};

export function renderTreasureManualOfGolemsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureManualOfGolems') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Manual of Golems',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${MANUAL_LABELS[outcome.event.result]}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: manualOfGolemsSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureManualOfGolemsCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureManualOfGolems') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Manual of Golems',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: manualOfGolemsSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureManualOfGolemsPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Manual of Golems',
    sides: treasureManualOfGolems.sides,
    entries: treasureManualOfGolems.entries.map(({ range, command }) => ({
      range,
      label: MANUAL_LABELS[command],
    })),
  });

export function manualOfGolemsSentence(
  result: TreasureManualOfGolems
): string {
  return `There is a Manual of ${MANUAL_LABELS[result]} Golems.`;
}
