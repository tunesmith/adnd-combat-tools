import type { DungeonRenderNode, DungeonMessage } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  poolAlignment,
  PoolAlignment,
} from '../../../tables/dungeon/magicPool';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';

export function renderPoolAlignmentDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildPoolAlignmentNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildPoolAlignmentPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Pool Alignment',
    sides: poolAlignment.sides,
    entries: poolAlignment.entries.map((entry) => ({
      range: entry.range,
      label: PoolAlignment[entry.command] ?? String(entry.command),
    })),
  });

export function renderPoolAlignmentCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildPoolAlignmentNodes(outcome);
}

function buildPoolAlignmentNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'poolAlignment') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Pool Alignment',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${PoolAlignment[outcome.event.result]}`],
  };
  const text = formatPoolAlignment(outcome.event.result);
  return [heading, bullet, { kind: 'paragraph', text }];
}

export function formatPoolAlignment(result: PoolAlignment): string {
  switch (result) {
    case PoolAlignment.LawfulGood:
      return 'It is Lawful Good. ';
    case PoolAlignment.LawfulEvil:
      return 'It is Lawful Evil. ';
    case PoolAlignment.ChaoticGood:
      return 'It is Chaotic Good. ';
    case PoolAlignment.ChaoticEvil:
      return 'It is Chaotic Evil. ';
    case PoolAlignment.Neutral:
      return 'It is Neutral. ';
    default:
      return '';
  }
}
