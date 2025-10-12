import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureGirdleOfGiantStrength,
  TreasureGirdleOfGiantStrength,
} from '../../../tables/dungeon/treasureGirdleOfGiantStrength';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const VARIANT_LABELS: Record<TreasureGirdleOfGiantStrength, string> = {
  [TreasureGirdleOfGiantStrength.Hill]: 'Hill Giant Strength',
  [TreasureGirdleOfGiantStrength.Stone]: 'Stone Giant Strength',
  [TreasureGirdleOfGiantStrength.Frost]: 'Frost Giant Strength',
  [TreasureGirdleOfGiantStrength.Fire]: 'Fire Giant Strength',
  [TreasureGirdleOfGiantStrength.Cloud]: 'Cloud Giant Strength',
  [TreasureGirdleOfGiantStrength.Storm]: 'Storm Giant Strength',
};

export function renderTreasureGirdleOfGiantStrengthDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureGirdleOfGiantStrength') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Girdle of Giant Strength',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${labelFor(outcome.event.result)}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: girdleSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureGirdleOfGiantStrengthCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureGirdleOfGiantStrength') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Girdle of Giant Strength',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: girdleSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureGirdleOfGiantStrengthPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Girdle of Giant Strength',
    sides: treasureGirdleOfGiantStrength.sides,
    entries: treasureGirdleOfGiantStrength.entries.map(
      ({ range, command }) => ({
        range,
        label: labelFor(command),
      })
    ),
  });

export function girdleSentence(result: TreasureGirdleOfGiantStrength): string {
  return `There is a Girdle of ${VARIANT_LABELS[result]} (C, F, T).`;
}

function labelFor(result: TreasureGirdleOfGiantStrength): string {
  return VARIANT_LABELS[result];
}
