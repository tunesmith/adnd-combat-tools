import type {
  DungeonMessage,
  DungeonRenderNode,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import { SpecialPassage } from './specialPassageTable';
import { type AppendPreviewFn } from '../../../adapters/render/shared';
import {
  renderSpecialPassageCompact,
  describeSpecialPassage,
} from './specialPassageSummary';
export { renderSpecialPassageCompact } from './specialPassageSummary';
export { buildSpecialPassagePreview } from './specialPassagePreview';

export function renderSpecialPassageDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'specialPassage') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Special Passage',
  };
  const label =
    SpecialPassage[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const summary = describeSpecialPassage(outcome);
  const nodes: DungeonRenderNode[] = [
    heading,
    bullet,
    ...summary.detailParagraphs,
  ];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderSpecialPassageCompactNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'specialPassage') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Special Passage',
  };
  const label =
    SpecialPassage[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const text = renderSpecialPassageCompact(outcome);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (text.trim().length > 0) {
    nodes.push({ kind: 'paragraph', text: `${text.trim()} ` });
  }
  return nodes;
}
