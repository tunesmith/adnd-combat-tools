import type { OutcomeEventNode } from '../../domain/outcome';
import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import {
  illusoryWallNature,
  IllusoryWallNature,
} from '../../../tables/dungeon/illusoryWallNature';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';

export function renderIllusoryWallNatureDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'illusoryWallNature') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'What Lies Beyond',
  };
  const label = ILLUSORY_LABELS[outcome.event.result];
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const detail = describeIllusoryWallNature(outcome);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (detail.length > 0) {
    nodes.push({ kind: 'paragraph', text: detail });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderIllusoryWallNatureCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'illusoryWallNature') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'What Lies Beyond',
  };
  const label = ILLUSORY_LABELS[outcome.event.result];
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const detail = describeIllusoryWallNature(outcome);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (detail.length > 0) {
    nodes.push({ kind: 'paragraph', text: detail });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function describeIllusoryWallNature(node: OutcomeEventNode): string {
  if (node.event.kind !== 'illusoryWallNature') return '';
  return ILLUSORY_DETAILS[node.event.result];
}

export const buildIllusoryWallNaturePreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Illusory Wall Nature',
    sides: illusoryWallNature.sides,
    entries: illusoryWallNature.entries.map((entry) => ({
      range: entry.range,
      label: ILLUSORY_DETAILS[entry.command].trim(),
    })),
  });

const ILLUSORY_LABELS: Record<IllusoryWallNature, string> = {
  [IllusoryWallNature.Pit]: 'Conceals a pit',
  [IllusoryWallNature.Chute]: 'Conceals a chute',
  [IllusoryWallNature.Chamber]: 'Conceals a chamber',
};

const ILLUSORY_DETAILS: Record<IllusoryWallNature, string> = {
  [IllusoryWallNature.Pit]: "It conceals a pit, 10' deep, 3 in 6 to fall in. ",
  [IllusoryWallNature.Chute]:
    'It conceals a chute down 1 level (cannot be ascended in any manner). ',
  [IllusoryWallNature.Chamber]:
    'It conceals a chamber with a monster and treasure. ',
};
