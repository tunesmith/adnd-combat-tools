import type { OutcomeEventNode } from '../../domain/outcome';
import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';
import { buildPreview } from './shared';
import {
  CircularContents,
  circularContents,
} from '../../../tables/dungeon/unusualShape';

export function renderCircularContentsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildCircularContentsNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderCircularContentsCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildCircularContentsNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildCircularContentsPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Circular Contents',
    sides: circularContents.sides,
    entries: circularContents.entries.map((entry) => ({
      range: entry.range,
      label: CircularContents[entry.command] ?? String(entry.command),
    })),
  });

function buildCircularContentsNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'circularContents') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Circular Contents',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        CircularContents[outcome.event.result] ?? String(outcome.event.result)
      }`,
    ],
  };
  const extra = formatCircularContents(outcome.event.result);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (extra.length > 0) {
    nodes.push({ kind: 'paragraph', text: `${extra} ` });
  }
  return nodes;
}

export function formatCircularContents(result: CircularContents): string {
  switch (result) {
    case CircularContents.Pool:
      return '';
    case CircularContents.Well:
      return 'There is a well. ';
    case CircularContents.Shaft:
      return 'There is a shaft. ';
    default:
      return '';
  }
}
