import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureStaffSerpent,
  TreasureStaffSerpent,
} from '../../../tables/dungeon/treasureStaffSerpent';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';

const SERPENT_LABELS: Record<TreasureStaffSerpent, string> = {
  [TreasureStaffSerpent.Python]: 'Python',
  [TreasureStaffSerpent.Adder]: 'Adder',
};

export function renderTreasureStaffSerpentDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureStaffSerpent') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Serpent Form',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${SERPENT_LABELS[outcome.event.result]}`],
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: `The staff transforms into the ${
      SERPENT_LABELS[outcome.event.result]
    } form.`,
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureStaffSerpentCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureStaffSerpent') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Serpent Form',
  };
  const text: DungeonMessage = {
    kind: 'paragraph',
    text: `The staff transforms into the ${
      SERPENT_LABELS[outcome.event.result]
    } form.`,
  };
  const nodes: DungeonRenderNode[] = [heading, text];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureStaffSerpentPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Serpent Form',
    sides: treasureStaffSerpent.sides,
    entries: treasureStaffSerpent.entries.map((entry) => ({
      range: entry.range,
      label: SERPENT_LABELS[entry.command],
    })),
  });
