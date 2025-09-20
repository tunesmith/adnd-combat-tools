import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEvent, OutcomeEventNode } from '../../domain/outcome';
import { PassageWidth } from '../../../tables/dungeon/passageWidth';
import { findChildEvent, type AppendPreviewFn } from './shared';
import { renderCompactSpecialPassage } from './specialPassage';

export function isPassageWidthEvent(
  event: OutcomeEvent | undefined
): event is Extract<OutcomeEvent, { kind: 'passageWidth' }> {
  if (!event) return false;
  return event.kind === 'passageWidth' && typeof event.result === 'number';
}

export function renderPassageWidthDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'passageWidth') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Passage Width',
  };
  const label = PassageWidth[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const nodes: DungeonRenderNode[] = [heading, bullet];
  const detail = passageWidthDetailText(outcome.event.result);
  if (detail.length > 0) {
    nodes.push({ kind: 'paragraph', text: detail });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderCompactPassageWidth(node: OutcomeEventNode): string {
  if (node.event.kind !== 'passageWidth') return '';
  switch (node.event.result) {
    case PassageWidth.FiveFeet:
      return "The passage is 5' wide. ";
    case PassageWidth.TenFeet:
      return "The passage is 10' wide. ";
    case PassageWidth.TwentyFeet:
      return "The passage is 20' wide. ";
    case PassageWidth.ThirtyFeet:
      return "The passage is 30' wide. ";
    case PassageWidth.SpecialPassage: {
      const special = findChildEvent(node, 'specialPassage');
      return special
        ? renderCompactSpecialPassage(special)
        : 'A special passage occurs. ';
    }
    default:
      return '';
  }
}

function passageWidthDetailText(result: number): string {
  switch (result) {
    case PassageWidth.FiveFeet:
      return "The passage is 5' wide. ";
    case PassageWidth.TenFeet:
      return "The passage is 10' wide. ";
    case PassageWidth.TwentyFeet:
      return "The passage is 20' wide. ";
    case PassageWidth.ThirtyFeet:
      return "The passage is 30' wide. ";
    case PassageWidth.SpecialPassage:
      return '';
    default:
      return '';
  }
}
