import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  roomDimensions,
  RoomDimensions,
} from '../../../tables/dungeon/chambersRooms';
import {
  buildPreview,
  findChildEvent,
  joinSegments,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';
import { renderNumberOfExitsCompact } from '../../features/navigation/exit/numberOfExitsRender';
import { renderCompactUnusualDetails } from './unusualShape';
import { describeChamberRoomContents } from './chamberRoomContents';
import { collectCharacterPartyMessages } from './monsters';

export function renderRoomDimensionsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'roomDimensions') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Room Dimensions',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${
        RoomDimensions[outcome.event.result] ?? String(outcome.event.result)
      }`,
    ],
  };
  const nodes: DungeonRenderNode[] = [heading, bullet];
  const paragraph = formatRoomDimensions(outcome.event.result).trim();
  if (paragraph.length > 0) {
    nodes.push({ kind: 'paragraph', text: `${paragraph} ` });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderRoomDimensionsCompact(node: OutcomeEventNode): string {
  if (node.event.kind !== 'roomDimensions') return '';
  const segments: string[] = [];
  const base = formatRoomDimensions(node.event.result).trim();
  if (base.length > 0) segments.push(base);
  if (node.event.result === RoomDimensions.Unusual) {
    const unusual = renderCompactUnusualDetails(node).trim();
    if (unusual.length > 0) segments.push(unusual);
  }
  const contents = findChildEvent(node, 'chamberRoomContents');
  if (contents && contents.event.kind === 'chamberRoomContents') {
    const summary = describeChamberRoomContents(contents).trim();
    if (summary.length > 0) segments.push(summary);
  }
  let exits = findChildEvent(node, 'numberOfExits');
  if (!exits) {
    const unusualSize = findChildEvent(node, 'unusualSize');
    if (unusualSize && unusualSize.event.kind === 'unusualSize') {
      exits = findChildEvent(unusualSize, 'numberOfExits');
    }
  }
  if (exits && exits.event.kind === 'numberOfExits') {
    const exitNodes = renderNumberOfExitsCompact(exits);
    const paragraph = exitNodes.find((n) => n.kind === 'paragraph');
    if (paragraph && paragraph.kind === 'paragraph') {
      segments.push(paragraph.text.trim());
    }
  }
  return joinSegments(segments);
}

export function renderRoomDimensionsCompactNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'roomDimensions') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Room Dimensions',
  };
  const label =
    RoomDimensions[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const text = renderRoomDimensionsCompact(outcome);
  const nodes: DungeonRenderNode[] = [
    heading,
    bullet,
    { kind: 'paragraph', text },
  ];
  const seen = new Set<string>();
  const appendParties = (messages: DungeonMessage[]) => {
    for (const message of messages) {
      if (message.kind !== 'character-party') continue;
      const key = JSON.stringify(message.summary);
      if (seen.has(key)) continue;
      seen.add(key);
      nodes.push(message);
    }
  };
  appendParties(collectCharacterPartyMessages(outcome, 'compact'));
  const contents = findChildEvent(outcome, 'chamberRoomContents');
  if (contents && contents.type === 'event') {
    appendParties(collectCharacterPartyMessages(contents, 'compact'));
  }
  return nodes;
}

export const buildRoomDimensionsPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Room Dimensions',
    sides: roomDimensions.sides,
    entries: roomDimensions.entries.map((entry) => ({
      range: entry.range,
      label: RoomDimensions[entry.command] ?? String(entry.command),
    })),
    context,
  });

function formatRoomDimensions(result: RoomDimensions): string {
  switch (result) {
    case RoomDimensions.Square10x10:
      return "The room is square and 10' x 10'.";
    case RoomDimensions.Square20x20:
      return "The room is square and 20' x 20'.";
    case RoomDimensions.Square30x30:
      return "The room is square and 30' x 30'.";
    case RoomDimensions.Square40x40:
      return "The room is square and 40' x 40'.";
    case RoomDimensions.Rectangular10x20:
      return "The room is rectangular and 10' x 20'.";
    case RoomDimensions.Rectangular20x30:
      return "The room is rectangular and 20' x 30'.";
    case RoomDimensions.Rectangular20x40:
      return "The room is rectangular and 20' x 40'.";
    case RoomDimensions.Rectangular30x40:
      return "The room is rectangular and 30' x 40'.";
    case RoomDimensions.Unusual:
      return 'The room has an unusual shape and size.';
    default:
      return '';
  }
}
