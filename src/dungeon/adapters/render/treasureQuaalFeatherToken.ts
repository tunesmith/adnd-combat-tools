import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureQuaalFeatherToken,
  TreasureQuaalFeatherToken,
} from '../../../tables/dungeon/treasureQuaalFeatherToken';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

function label(token: TreasureQuaalFeatherToken): string {
  switch (token) {
    case TreasureQuaalFeatherToken.Anchor:
      return 'Anchor';
    case TreasureQuaalFeatherToken.Bird:
      return 'Bird';
    case TreasureQuaalFeatherToken.Fan:
      return 'Fan';
    case TreasureQuaalFeatherToken.SwanBoat:
      return 'Swan Boat';
    case TreasureQuaalFeatherToken.Tree:
      return 'Tree';
    case TreasureQuaalFeatherToken.Whip:
      return 'Whip';
  }
}

export function quaalFeatherTokenParenthetical(
  token: TreasureQuaalFeatherToken
): string {
  return label(token);
}

function description(token: TreasureQuaalFeatherToken): string {
  return `The token produces a ${label(token)} effect when activated.`;
}

export function renderTreasureQuaalFeatherTokenDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureQuaalFeatherToken') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: "Quaal's Feather Token",
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: description(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureQuaalFeatherTokenCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureQuaalFeatherToken') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: "Quaal's Feather Token",
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: description(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureQuaalFeatherTokenPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: "Quaal's Feather Token",
    sides: treasureQuaalFeatherToken.sides,
    entries: treasureQuaalFeatherToken.entries.map(({ range, command }) => ({
      range,
      label: label(command),
    })),
  });
