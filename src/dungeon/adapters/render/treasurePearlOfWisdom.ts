import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasurePearlOfWisdom,
  TreasurePearlOfWisdomOutcome,
} from '../../../tables/dungeon/treasurePearlOfWisdom';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

export function pearlOfWisdomParenthetical(
  outcome: TreasurePearlOfWisdomOutcome
): string {
  return outcome === TreasurePearlOfWisdomOutcome.GainOne ? '+1' : '-1';
}

function wisdomSentence(outcome: TreasurePearlOfWisdomOutcome): string {
  return outcome === TreasurePearlOfWisdomOutcome.GainOne
    ? 'Wisdom increases by 1 point.'
    : 'Wisdom decreases by 1 point.';
}

export function renderTreasurePearlOfWisdomDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePearlOfWisdom') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Pearl of Wisdom Outcome',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: wisdomSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasurePearlOfWisdomCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePearlOfWisdom') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Pearl of Wisdom',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: wisdomSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasurePearlOfWisdomPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Pearl of Wisdom Outcome',
    sides: treasurePearlOfWisdom.sides,
    entries: treasurePearlOfWisdom.entries.map(({ range, command }) => ({
      range,
      label:
        command === TreasurePearlOfWisdomOutcome.GainOne
          ? 'Gain 1 Wisdom'
          : 'Lose 1 Wisdom',
    })),
  });
