import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureEyesOfPetrification,
  TreasureEyesOfPetrification,
} from '../../../tables/dungeon/treasureEyesOfPetrification';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const LABELS: Record<TreasureEyesOfPetrification, string> = {
  [TreasureEyesOfPetrification.Basilisk]: 'eyes of petrification (basilisk)',
  [TreasureEyesOfPetrification.Normal]: 'eyes of petrification (normal)',
};

export function renderTreasureEyesOfPetrificationDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureEyesOfPetrification') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Eyes of Petrification Variant',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${LABELS[outcome.event.result]}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: sentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureEyesOfPetrificationCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureEyesOfPetrification') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Eyes of Petrification',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: sentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureEyesOfPetrificationPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Eyes of Petrification Variant',
    sides: treasureEyesOfPetrification.sides,
    entries: treasureEyesOfPetrification.entries.map(({ range, command }) => ({
      range,
      label: LABELS[command],
    })),
  });

export function sentence(result: TreasureEyesOfPetrification): string {
  return `There are ${LABELS[result]}.`;
}
