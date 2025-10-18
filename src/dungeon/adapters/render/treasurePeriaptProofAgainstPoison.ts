import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasurePeriaptPoisonBonus,
  TreasurePeriaptPoisonBonus,
} from '../../../tables/dungeon/treasurePeriaptProofAgainstPoison';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

export function periaptPoisonParenthetical(
  bonus: TreasurePeriaptPoisonBonus
): string {
  return `+${bonus}`;
}

function describePeriapt(bonus: TreasurePeriaptPoisonBonus): string {
  return `It grants a +${bonus} bonus on saves vs. poison.`;
}

export function renderTreasurePeriaptProofAgainstPoisonDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePeriaptProofAgainstPoison') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Periapt of Proof Against Poison',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: describePeriapt(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasurePeriaptProofAgainstPoisonCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePeriaptProofAgainstPoison') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Periapt of Proof Against Poison',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: describePeriapt(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasurePeriaptProofAgainstPoisonPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Periapt of Proof Against Poison',
    sides: treasurePeriaptPoisonBonus.sides,
    entries: treasurePeriaptPoisonBonus.entries.map(({ range, command }) => ({
      range,
      label: `+${command}`,
    })),
  });
