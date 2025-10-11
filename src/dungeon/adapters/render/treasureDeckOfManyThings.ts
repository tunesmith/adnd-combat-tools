import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureDeckOfManyThings,
  TreasureDeckOfManyThings,
} from '../../../tables/dungeon/treasureDeckOfManyThings';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const LABELS: Record<TreasureDeckOfManyThings, string> = {
  [TreasureDeckOfManyThings.ThirteenPlaques]:
    'deck of many things with 13 plaques',
  [TreasureDeckOfManyThings.TwentyTwoPlaques]:
    'deck of many things with 22 plaques',
};

export function renderTreasureDeckOfManyThingsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureDeckOfManyThings') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Deck of Many Things Composition',
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

export function renderTreasureDeckOfManyThingsCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureDeckOfManyThings') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Deck of Many Things',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: sentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureDeckOfManyThingsPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Deck of Many Things Composition',
    sides: treasureDeckOfManyThings.sides,
    entries: treasureDeckOfManyThings.entries.map(({ range, command }) => ({
      range,
      label: LABELS[command],
    })),
  });

export function sentence(result: TreasureDeckOfManyThings): string {
  const plaques =
    result === TreasureDeckOfManyThings.ThirteenPlaques ? '13' : '22';
  return `There is a deck of many things containing ${plaques} plaques.`;
}
