import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import { chute as chuteTable, Chute } from '../../../tables/dungeon/stairs';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';

export function renderChuteDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildChuteNodes(outcome);
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildChutePreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Chute',
    sides: chuteTable.sides,
    entries: chuteTable.entries.map((entry) => ({
      range: entry.range,
      label: Chute[entry.command] ?? String(entry.command),
    })),
  });

export function renderChuteCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildChuteNodes(outcome);
}

function buildChuteNodes(outcome: OutcomeEventNode): DungeonRenderNode[] {
  if (outcome.event.kind !== 'chute') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Chute',
  };
  const label =
    Chute[outcome.event.result as 0 | 1] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const text = formatChute(outcome.event.result);
  return [heading, bullet, { kind: 'paragraph', text }];
}

function formatChute(result: Chute): string {
  return result === Chute.Exists
    ? 'The stairs will turn into a chute, descending two levels from the top. '
    : '';
}
