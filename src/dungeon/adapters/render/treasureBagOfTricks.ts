import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureBagOfTricks,
  TreasureBagOfTricks,
} from '../../../tables/dungeon/treasureBagOfTricks';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const TRICKS_LABELS: Record<TreasureBagOfTricks, string> = {
  [TreasureBagOfTricks.Weasel]: 'Weasel',
  [TreasureBagOfTricks.Rat]: 'Rat',
  [TreasureBagOfTricks.Jackal]: 'Jackal',
};

export function renderTreasureBagOfTricksDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureBagOfTricks') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Bag of Tricks',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${TRICKS_LABELS[outcome.event.result]}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: bagOfTricksSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureBagOfTricksCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureBagOfTricks') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Bag of Tricks',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: bagOfTricksSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureBagOfTricksPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Bag of Tricks Contents',
    sides: treasureBagOfTricks.sides,
    entries: treasureBagOfTricks.entries.map(({ range, command }) => ({
      range,
      label: TRICKS_LABELS[command],
    })),
  });

export function bagOfTricksSentence(result: TreasureBagOfTricks): string {
  return `There is a bag of tricks, "${TRICKS_LABELS[result]}".`;
}
