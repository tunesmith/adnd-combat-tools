import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureCrystalBall,
  TreasureCrystalBall,
} from '../../../tables/dungeon/treasureCrystalBall';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const LABELS: Record<TreasureCrystalBall, string> = {
  [TreasureCrystalBall.Standard]: 'crystal ball',
  [TreasureCrystalBall.Clairaudience]: 'crystal ball with clairaudience',
  [TreasureCrystalBall.Esp]: 'crystal ball with ESP',
  [TreasureCrystalBall.Telepathy]: 'crystal ball with telepathy',
};

export function renderTreasureCrystalBallDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureCrystalBall') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Crystal Ball',
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

export function renderTreasureCrystalBallCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureCrystalBall') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Crystal Ball',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: sentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureCrystalBallPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Crystal Ball Variant',
    sides: treasureCrystalBall.sides,
    entries: treasureCrystalBall.entries.map(({ range, command }) => ({
      range,
      label: LABELS[command],
    })),
  });

export function sentence(result: TreasureCrystalBall): string {
  return `There is a ${LABELS[result]}.`;
}
