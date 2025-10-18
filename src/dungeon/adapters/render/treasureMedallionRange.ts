import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureMedallionRange,
  TreasureMedallionRange,
} from '../../../tables/dungeon/treasureMedallionEspRange';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const RANGE_LABELS: Record<TreasureMedallionRange, string> = {
  [TreasureMedallionRange.ThirtyFeet]: "30' range",
  [TreasureMedallionRange.ThirtyFeetWithEmpathy]: "30' range with empathy",
  [TreasureMedallionRange.SixtyFeet]: "60' range",
  [TreasureMedallionRange.NinetyFeet]: "90' range",
};

const PARENTHETICALS: Record<TreasureMedallionRange, string> = {
  [TreasureMedallionRange.ThirtyFeet]: "30'",
  [TreasureMedallionRange.ThirtyFeetWithEmpathy]: "30', empathy",
  [TreasureMedallionRange.SixtyFeet]: "60'",
  [TreasureMedallionRange.NinetyFeet]: "90'",
};

export function renderTreasureMedallionRangeDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMedallionRange') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Medallion Details',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${RANGE_LABELS[outcome.event.result]}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: medallionRangeSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureMedallionRangeCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMedallionRange') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Medallion Details',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: medallionRangeSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureMedallionRangePreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Medallion Details',
    sides: treasureMedallionRange.sides,
    entries: treasureMedallionRange.entries.map(({ range, command }) => ({
      range,
      label: RANGE_LABELS[command],
    })),
  });

export function medallionRangeParenthetical(
  result: TreasureMedallionRange
): string {
  return PARENTHETICALS[result];
}

function medallionRangeSentence(result: TreasureMedallionRange): string {
  return `The medallion has ${RANGE_LABELS[result]}.`;
}
