import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  egressOne,
  egressTwo,
  egressThree,
  Egress,
} from '../../../tables/dungeon/stairs';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';

export function renderEgressDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildEgressNodes(outcome);
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderEgressCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildEgressNodes(outcome);
}

function buildEgressNodes(outcome: OutcomeEventNode): DungeonRenderNode[] {
  if (outcome.event.kind !== 'egress') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Egress',
  };
  const label = Egress[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const suffix =
    outcome.event.result === Egress.Closed
      ? 'After descending, an unnoticed door will close egress for the day. '
      : '';
  return [heading, bullet, { kind: 'paragraph', text: suffix }];
}

export const buildEgressPreview: TablePreviewFactory = (tableId) => {
  const which = tableId.split(':')[1] as 'one' | 'two' | 'three' | undefined;
  const table =
    which === 'one' ? egressOne : which === 'two' ? egressTwo : egressThree;
  const title =
    which === 'one'
      ? 'Egress (1 level)'
      : which === 'two'
      ? 'Egress (2 levels)'
      : 'Egress (3 levels)';
  return buildPreview(tableId, {
    title,
    sides: table.sides,
    entries: table.entries.map((entry) => ({
      range: entry.range,
      label: Egress[entry.command] ?? String(entry.command),
    })),
  });
};
