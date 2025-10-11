import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureCarpetOfFlying,
  TreasureCarpetOfFlying,
} from '../../../tables/dungeon/treasureCarpetOfFlying';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const SIZE_LABELS: Record<TreasureCarpetOfFlying, string> = {
  [TreasureCarpetOfFlying.ThreeByFive]: "3' × 5'",
  [TreasureCarpetOfFlying.FourBySix]: "4' × 6'",
  [TreasureCarpetOfFlying.FiveBySeven]: "5' × 7'",
  [TreasureCarpetOfFlying.SixByNine]: "6' × 9'",
};

export function renderTreasureCarpetOfFlyingDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureCarpetOfFlying') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Carpet of Flying Size',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${SIZE_LABELS[outcome.event.result]}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: carpetSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureCarpetOfFlyingCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureCarpetOfFlying') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Carpet of Flying Size',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: carpetSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureCarpetOfFlyingPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Carpet of Flying Size',
    sides: treasureCarpetOfFlying.sides,
    entries: treasureCarpetOfFlying.entries.map(({ range, command }) => ({
      range,
      label: SIZE_LABELS[command],
    })),
  });

export function carpetSentence(result: TreasureCarpetOfFlying): string {
  return `The carpet is ${SIZE_LABELS[result]}.`;
}
