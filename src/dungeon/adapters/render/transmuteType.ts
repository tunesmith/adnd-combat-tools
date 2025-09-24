import type { DungeonRenderNode, DungeonMessage } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  transmuteType,
  TransmuteType,
} from '../../../tables/dungeon/magicPool';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';

export function renderTransmuteTypeDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildTransmuteTypeNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTransmuteTypePreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Transmutation Type',
    sides: transmuteType.sides,
    entries: transmuteType.entries.map((entry) => ({
      range: entry.range,
      label: TransmuteType[entry.command] ?? String(entry.command),
    })),
  });

export function renderTransmuteTypeCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildTransmuteTypeNodes(outcome);
}

function buildTransmuteTypeNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'transmuteType') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Transmutation Type',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${TransmuteType[outcome.event.result]}`],
  };
  const text = formatTransmuteType(outcome.event.result);
  return [heading, bullet, { kind: 'paragraph', text }];
}

export function formatTransmuteType(result: TransmuteType): string {
  return result === TransmuteType.GoldToPlatinum
    ? 'It will turn gold to platinum, one time only. '
    : 'It will turn gold to lead, one time only. ';
}
