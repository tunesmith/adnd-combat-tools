import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import { DoorBeyond } from '../../../tables/dungeon/doorBeyond';
import { findChildEvent, type AppendPreviewFn } from './shared';
import { renderPassageWidthCompact } from './passageWidth';
import { renderRoomDimensionsCompact } from './roomDimensions';
import { describeChamberDimensions } from './chamberDimensions';

export function renderDoorBeyondDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildDoorBeyondNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderDoorBeyondCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildDoorBeyondNodes(outcome);
}

function buildDoorBeyondNodes(outcome: OutcomeEventNode): DungeonRenderNode[] {
  if (outcome.event.kind !== 'doorBeyond') return [];
  const heading: DungeonMessage = { kind: 'heading', level: 3, text: 'Door' };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${DoorBeyond[outcome.event.result]}`],
  };
  const description = formatDoorBeyond(outcome.event.result, {
    doorAhead: outcome.event.doorAhead ?? false,
  });
  const paragraphs: DungeonMessage[] = [];
  if (description.trim().length > 0) {
    paragraphs.push({ kind: 'paragraph', text: description });
  }
  if (
    outcome.event.result === DoorBeyond.ParallelPassageOrCloset &&
    !outcome.event.doorAhead
  ) {
    const width = findChildEvent(outcome, 'passageWidth');
    const widthText = width ? renderPassageWidthCompact(width) : '';
    if (widthText.length > 0) {
      paragraphs.push({ kind: 'paragraph', text: widthText });
    }
  }
  if (
    outcome.event.result === DoorBeyond.PassageStraightAhead ||
    outcome.event.result === DoorBeyond.Passage45AheadBehind ||
    outcome.event.result === DoorBeyond.Passage45BehindAhead
  ) {
    const width = findChildEvent(outcome, 'passageWidth');
    const widthText = width ? renderPassageWidthCompact(width) : '';
    if (widthText.length > 0) {
      paragraphs.push({ kind: 'paragraph', text: widthText });
    }
  }
  if (outcome.event.result === DoorBeyond.Room) {
    const room = findChildEvent(outcome, 'roomDimensions');
    const detail = room ? renderRoomDimensionsCompact(room) : '';
    if (detail.length > 0) {
      paragraphs.push({ kind: 'paragraph', text: detail });
    }
  }
  if (outcome.event.result === DoorBeyond.Chamber) {
    const chamber = findChildEvent(outcome, 'chamberDimensions');
    const detail = chamber ? describeChamberDimensions(chamber) : '';
    if (detail.length > 0) {
      paragraphs.push({ kind: 'paragraph', text: detail });
    }
  }
  return [heading, bullet, ...paragraphs];
}

function formatDoorBeyond(
  result: DoorBeyond,
  options?: { doorAhead?: boolean }
): string {
  switch (result) {
    case DoorBeyond.ParallelPassageOrCloset:
      return options?.doorAhead
        ? "Beyond the door is a 10' x 10' room (check contents, treasure). "
        : "Beyond the door is a parallel passage, extending 30' in both directions. ";
    case DoorBeyond.PassageStraightAhead:
      return 'Beyond the door is a passage straight ahead. ';
    case DoorBeyond.Passage45AheadBehind:
      return 'Beyond the door is a passage 45 degrees ahead/behind (ahead in preference to behind). ';
    case DoorBeyond.Passage45BehindAhead:
      return 'Beyond the door is a passage 45 degrees behind/ahead (behind in preference to ahead). ';
    case DoorBeyond.Room:
      return 'Beyond the door is a room. ';
    case DoorBeyond.Chamber:
      return 'Beyond the door is a chamber. ';
    default:
      return '';
  }
}
