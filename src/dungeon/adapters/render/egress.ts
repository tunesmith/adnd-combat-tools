import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import { Egress } from '../../../tables/dungeon/stairs';

export function renderEgressDetail(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildEgressNodes(outcome);
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
