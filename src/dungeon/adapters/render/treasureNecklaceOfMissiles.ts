import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureNecklaceOfMissiles,
  type TreasureNecklaceOfMissiles,
} from '../../../tables/dungeon/treasureNecklaceOfMissiles';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

function parenthetical(result: TreasureNecklaceOfMissiles): string {
  return result.missiles
    .map(({ count, dice }) => `${count}x${dice}`)
    .join(', ');
}

function totalMissiles(result: TreasureNecklaceOfMissiles): number {
  return result.missiles.reduce((sum, { count }) => sum + count, 0);
}

function detailSentence(result: TreasureNecklaceOfMissiles): string {
  const total = totalMissiles(result);
  const missiles = parenthetical(result);
  return `The necklace holds ${total} missiles (${missiles}).`;
}

export function necklaceOfMissilesParenthetical(
  result: TreasureNecklaceOfMissiles
): string {
  return parenthetical(result);
}

export function renderTreasureNecklaceOfMissilesDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureNecklaceOfMissiles') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Necklace of Missiles',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${totalMissiles(outcome.event.result)} missiles`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: detailSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureNecklaceOfMissilesCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureNecklaceOfMissiles') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Necklace of Missiles',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: detailSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureNecklaceOfMissilesPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Necklace of Missiles',
    sides: treasureNecklaceOfMissiles.sides,
    entries: treasureNecklaceOfMissiles.entries.map(({ range, command }) => ({
      range,
      label: detailSentence(command),
    })),
  });
