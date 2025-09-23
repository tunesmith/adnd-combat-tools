import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  chamberDimensions,
  ChamberDimensions,
} from '../../../tables/dungeon/chambersRooms';
import {
  buildPreview,
  findChildEvent,
  joinSegments,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';
import { renderNumberOfExitsCompact } from './numberOfExits';
import { renderCompactUnusualDetails } from './unusualShape';

export function renderChamberDimensionsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'chamberDimensions') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Chamber Dimensions',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        ChamberDimensions[outcome.event.result] ?? String(outcome.event.result)
      }`,
    ],
  };
  const nodes: DungeonRenderNode[] = [heading, bullet];
  const paragraph = formatChamberDimensions(outcome.event.result).trim();
  if (paragraph.length > 0) {
    nodes.push({ kind: 'paragraph', text: `${paragraph} ` });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderChamberDimensionsCompact(node: OutcomeEventNode): string {
  if (node.event.kind !== 'chamberDimensions') return '';
  const segments: string[] = [];
  const base = formatChamberDimensions(node.event.result).trim();
  if (base.length > 0) segments.push(base);
  if (node.event.result === ChamberDimensions.Unusual) {
    const unusual = renderCompactUnusualDetails(node).trim();
    if (unusual.length > 0) segments.push(unusual);
  }
  const exits = findChildEvent(node, 'numberOfExits');
  if (exits && exits.event.kind === 'numberOfExits') {
    const exitNodes = renderNumberOfExitsCompact(exits);
    const paragraph = exitNodes.find((n) => n.kind === 'paragraph');
    if (paragraph && paragraph.kind === 'paragraph') {
      segments.push(paragraph.text.trim());
    }
  }
  return joinSegments(segments);
}

export function renderChamberDimensionsCompactNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'chamberDimensions') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Chamber Dimensions',
  };
  const label =
    ChamberDimensions[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const text = renderChamberDimensionsCompact(outcome);
  return [heading, bullet, { kind: 'paragraph', text }];
}

export const buildChamberDimensionsPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Chamber Dimensions',
    sides: chamberDimensions.sides,
    entries: chamberDimensions.entries.map((entry) => ({
      range: entry.range,
      label: ChamberDimensions[entry.command] ?? String(entry.command),
    })),
  });

function formatChamberDimensions(result: ChamberDimensions): string {
  switch (result) {
    case ChamberDimensions.Square20x20:
      return "The chamber is square and 20' x 20'.";
    case ChamberDimensions.Square30x30:
      return "The chamber is square and 30' x 30'.";
    case ChamberDimensions.Square40x40:
      return "The chamber is square and 40' x 40'.";
    case ChamberDimensions.Rectangular20x30:
      return "The chamber is rectangular and 20' x 30'.";
    case ChamberDimensions.Rectangular30x50:
      return "The chamber is rectangular and 30' x 50'.";
    case ChamberDimensions.Rectangular40x60:
      return "The chamber is rectangular and 40' x 60'.";
    case ChamberDimensions.Unusual:
      return 'The chamber has an unusual shape and size.';
    default:
      return '';
  }
}
