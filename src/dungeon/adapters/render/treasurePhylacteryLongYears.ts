import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasurePhylacteryLongYears,
  TreasurePhylacteryLongYearsOutcome,
} from '../../../tables/dungeon/treasurePhylacteryLongYears';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

export function phylacteryLongYearsParenthetical(
  outcome: TreasurePhylacteryLongYearsOutcome
): string {
  return outcome === TreasurePhylacteryLongYearsOutcome.SlowAging
    ? 'slow aging'
    : 'fast aging';
}

function sentence(outcome: TreasurePhylacteryLongYearsOutcome): string {
  if (outcome === TreasurePhylacteryLongYearsOutcome.SlowAging) {
    return 'The wearer ages at three-quarters the normal rate (one quarter slower).';
  }
  return 'The wearer ages at five-quarters the normal rate (one quarter faster).';
}

export function renderTreasurePhylacteryLongYearsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePhylacteryLongYears') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Phylactery of Long Years',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: sentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasurePhylacteryLongYearsCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePhylacteryLongYears') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Phylactery of Long Years',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: sentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasurePhylacteryLongYearsPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Phylactery of Long Years',
    sides: treasurePhylacteryLongYears.sides,
    entries: treasurePhylacteryLongYears.entries.map(({ range, command }) => ({
      range,
      label:
        command === TreasurePhylacteryLongYearsOutcome.SlowAging
          ? 'Slow aging'
          : 'Fast aging',
    })),
  });
