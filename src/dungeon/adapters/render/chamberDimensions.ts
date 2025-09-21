import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  chamberDimensions,
  ChamberDimensions,
} from '../../../tables/dungeon/chambersRooms';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';
import { renderNumberOfExitsCompact } from './numberOfExits';

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
  const paragraph = describeChamberDimensionsBase(outcome.event.result).trim();
  if (paragraph.length > 0) {
    nodes.push({ kind: 'paragraph', text: `${paragraph} ` });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export type ChamberDimensionsCompactDeps = {
  renderUnusualDetails: (node: OutcomeEventNode) => string;
};

const DEFAULT_COMPACT_DEPS: ChamberDimensionsCompactDeps = {
  renderUnusualDetails: () => '',
};

export function renderChamberDimensionsCompact(
  node: OutcomeEventNode,
  deps?: Partial<ChamberDimensionsCompactDeps>
): string {
  if (node.event.kind !== 'chamberDimensions') return '';
  const resolved = withChamberDefaults(deps);
  const segments: string[] = [];
  switch (node.event.result) {
    case ChamberDimensions.Square20x20:
      segments.push("The chamber is square and 20' x 20'.");
      break;
    case ChamberDimensions.Square30x30:
      segments.push("The chamber is square and 30' x 30'.");
      break;
    case ChamberDimensions.Square40x40:
      segments.push("The chamber is square and 40' x 40'.");
      break;
    case ChamberDimensions.Rectangular20x30:
      segments.push("The chamber is rectangular and 20' x 30'.");
      break;
    case ChamberDimensions.Rectangular30x50:
      segments.push("The chamber is rectangular and 30' x 50'.");
      break;
    case ChamberDimensions.Rectangular40x60:
      segments.push("The chamber is rectangular and 40' x 60'.");
      break;
    case ChamberDimensions.Unusual:
      segments.push('The chamber has an unusual shape and size.');
      break;
  }
  if (node.event.result === ChamberDimensions.Unusual) {
    const unusual = resolved.renderUnusualDetails(node).trim();
    if (unusual.length > 0) {
      segments.push(unusual);
    }
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

export const buildChamberDimensionsPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Chamber Dimensions',
    sides: chamberDimensions.sides,
    entries: chamberDimensions.entries.map((entry) => ({
      range: entry.range,
      label: ChamberDimensions[entry.command] ?? String(entry.command),
    })),
  });

function describeChamberDimensionsBase(result: ChamberDimensions): string {
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

function withChamberDefaults(
  deps?: Partial<ChamberDimensionsCompactDeps>
): ChamberDimensionsCompactDeps {
  if (!deps) return DEFAULT_COMPACT_DEPS;
  return {
    renderUnusualDetails:
      deps.renderUnusualDetails ?? DEFAULT_COMPACT_DEPS.renderUnusualDetails,
  };
}

function joinSegments(segments: string[]): string {
  const normalized = segments
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => (/[.!?]$/.test(segment) ? segment : `${segment}.`));
  if (normalized.length === 0) return '';
  return `${normalized.join(' ')} `;
}
