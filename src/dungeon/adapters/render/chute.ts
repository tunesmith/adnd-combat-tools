import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import { Chute } from '../../../tables/dungeon/stairs';

export function renderChuteDetail(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildChuteNodes(outcome);
}

export function renderChuteCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildChuteNodes(outcome);
}

function buildChuteNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'chute') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Chute',
  };
  const label = Chute[outcome.event.result as 0 | 1] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const text =
    outcome.event.result === Chute.Exists
      ? 'The stairs will turn into a chute, descending two levels from the top. '
      : '';
  return [heading, bullet, { kind: 'paragraph', text }];
}
