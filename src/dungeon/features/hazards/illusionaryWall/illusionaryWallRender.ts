import type { OutcomeEventNode } from '../../../domain/outcome';
import type {
  DungeonMessage,
  DungeonRenderNode,
} from '../../../../types/dungeon';
import {
  illusionaryWallNature,
  IllusionaryWallNature,
} from './illusionaryWallTable';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';

export function renderIllusionaryWallNatureDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'illusionaryWallNature') return [];
  const label = ILLUSIONARY_LABELS[outcome.event.result];
  const detail = describeIllusionaryWallNature(outcome);
  const nodes: DungeonRenderNode[] = [];
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  nodes.push(bullet);
  if (detail.length > 0) {
    nodes.push({ kind: 'paragraph', text: detail });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderIllusionaryWallNatureCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'illusionaryWallNature') return [];
  const label = ILLUSIONARY_LABELS[outcome.event.result];
  const detail = describeIllusionaryWallNature(outcome);
  const nodes: DungeonRenderNode[] = [];
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  nodes.push(bullet);
  if (detail.length > 0) {
    nodes.push({ kind: 'paragraph', text: detail });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function describeIllusionaryWallNature(node: OutcomeEventNode): string {
  if (node.event.kind !== 'illusionaryWallNature') return '';
  return ILLUSIONARY_DETAILS[node.event.result];
}

export const buildIllusionaryWallNaturePreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Illusionary Wall Nature',
    sides: illusionaryWallNature.sides,
    entries: illusionaryWallNature.entries.map((entry) => ({
      range: entry.range,
      label: ILLUSIONARY_DETAILS[entry.command].trim(),
    })),
    context,
  });

const ILLUSIONARY_DETAILS: Record<IllusionaryWallNature, string> = {
  [IllusionaryWallNature.Pit]:
    "It conceals a pit, 10' deep, 3 in 6 to fall in. ",
  [IllusionaryWallNature.Chute]:
    'It conceals a chute down 1 level (cannot be ascended in any manner). ',
  [IllusionaryWallNature.Chamber]: 'It conceals a chamber. ',
};

const ILLUSIONARY_LABELS: Record<IllusionaryWallNature, string> = {
  [IllusionaryWallNature.Pit]: 'Concealed pit',
  [IllusionaryWallNature.Chute]: 'Concealed chute',
  [IllusionaryWallNature.Chamber]: 'Concealed chamber',
};
