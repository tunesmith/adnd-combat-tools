import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureRobeOfTheArchmagi,
  TreasureRobeOfTheArchmagi,
} from '../../../tables/dungeon/treasureRobeOfTheArchmagi';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const ALIGNMENT_LABELS: Record<TreasureRobeOfTheArchmagi, string> = {
  [TreasureRobeOfTheArchmagi.Good]: 'Good',
  [TreasureRobeOfTheArchmagi.Neutral]: 'Neutral',
  [TreasureRobeOfTheArchmagi.Evil]: 'Evil',
};

export function robeOfTheArchmagiAlignment(
  outcome: TreasureRobeOfTheArchmagi
): 'good' | 'neutral' | 'evil' {
  switch (outcome) {
    case TreasureRobeOfTheArchmagi.Good:
      return 'good';
    case TreasureRobeOfTheArchmagi.Neutral:
      return 'neutral';
    case TreasureRobeOfTheArchmagi.Evil:
      return 'evil';
    default:
      return 'neutral';
  }
}

export function robeOfTheArchmagiAlignmentDisplay(
  outcome: TreasureRobeOfTheArchmagi
): 'Good' | 'Neutral' | 'Evil' {
  const alignment = robeOfTheArchmagiAlignment(outcome);
  return (alignment.charAt(0).toUpperCase() +
    alignment.slice(1)) as 'Good' | 'Neutral' | 'Evil';
}

export function robeOfTheArchmagiSentence(
  outcome: TreasureRobeOfTheArchmagi
): string {
  return `The robe is aligned with ${robeOfTheArchmagiAlignment(
    outcome
  )}.`;
}

export function robeOfTheArchmagiParenthetical(
  outcome: TreasureRobeOfTheArchmagi
): string {
  return robeOfTheArchmagiAlignment(outcome);
}

export function renderTreasureRobeOfTheArchmagiDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRobeOfTheArchmagi') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Robe of the Archmagi Alignment',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: robeOfTheArchmagiSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureRobeOfTheArchmagiCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRobeOfTheArchmagi') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Robe of the Archmagi',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: robeOfTheArchmagiSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureRobeOfTheArchmagiPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Robe of the Archmagi Alignment',
    sides: treasureRobeOfTheArchmagi.sides,
    entries: treasureRobeOfTheArchmagi.entries.map(({ range, command }) => ({
      range,
      label: ALIGNMENT_LABELS[command],
    })),
  });
