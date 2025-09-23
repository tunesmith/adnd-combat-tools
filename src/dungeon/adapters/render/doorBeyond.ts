import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import { DoorBeyond } from '../../../tables/dungeon/doorBeyond';
import { findChildEvent, type AppendPreviewFn } from './shared';
import { renderPassageWidthCompact } from './passageWidth';
import { renderRoomDimensionsCompact } from './roomDimensions';
import { renderChamberDimensionsCompact } from './chamberDimensions';

export function renderDoorBeyondDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'doorBeyond') return [];
  const heading: DungeonMessage = { kind: 'heading', level: 3, text: 'Door' };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${DoorBeyond[outcome.event.result]}`],
  };
  const summary = describeDoorBeyond(outcome);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  nodes.push(...summary.detailParagraphs);
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderDoorBeyondCompact(outcome: OutcomeEventNode): string {
  if (outcome.event.kind !== 'doorBeyond') return '';
  const summary = describeDoorBeyond(outcome);
  let text = summary.compactText;
  if (
    outcome.event.result === DoorBeyond.ParallelPassageOrCloset &&
    !outcome.event.doorAhead
  ) {
    text += renderChildPassageWidth(outcome);
  }
  if (
    outcome.event.result === DoorBeyond.PassageStraightAhead ||
    outcome.event.result === DoorBeyond.Passage45AheadBehind ||
    outcome.event.result === DoorBeyond.Passage45BehindAhead
  ) {
    text += renderChildPassageWidth(outcome);
  }
  if (outcome.event.result === DoorBeyond.Room) {
    const room = findChildEvent(outcome, 'roomDimensions');
    const detail = room ? renderRoomDimensionsCompact(room) : '';
    text += detail;
  }
  if (outcome.event.result === DoorBeyond.Chamber) {
    const chamber = findChildEvent(outcome, 'chamberDimensions');
    const detail = chamber ? renderChamberDimensionsCompact(chamber) : '';
    text += detail;
  }
  return text;
}

export function describeDoorBeyond(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'doorBeyond') {
    return { detailParagraphs: [], compactText: '' };
  }
  const detailParagraphs: DungeonMessage[] = [];
  const segments: string[] = [];
  const appendParagraph = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const normalized = trimmed.endsWith(' ')
      ? trimmed
      : trimmed.endsWith('.')
      ? `${trimmed} `
      : `${trimmed}. `;
    detailParagraphs.push({ kind: 'paragraph', text: normalized });
    segments.push(normalized);
  };

  switch (node.event.result) {
    case DoorBeyond.ParallelPassageOrCloset:
      if (node.event.doorAhead) {
        appendParagraph(
          "Beyond the door is a 10' x 10' room (check contents, treasure). "
        );
      } else {
        appendParagraph(
          "Beyond the door is a parallel passage, extending 30' in both directions. "
        );
      }
      break;
    case DoorBeyond.PassageStraightAhead:
      appendParagraph('Beyond the door is a passage straight ahead. ');
      break;
    case DoorBeyond.Passage45AheadBehind:
      appendParagraph(
        'Beyond the door is a passage 45 degrees ahead/behind (ahead in preference to behind). '
      );
      break;
    case DoorBeyond.Passage45BehindAhead:
      appendParagraph(
        'Beyond the door is a passage 45 degrees behind/ahead (behind in preference to ahead). '
      );
      break;
    case DoorBeyond.Room:
      appendParagraph('Beyond the door is a room. ');
      break;
    case DoorBeyond.Chamber:
      appendParagraph('Beyond the door is a chamber. ');
      break;
    default:
      break;
  }

  const compactText = segments.join('');
  return { detailParagraphs, compactText };
}

function renderChildPassageWidth(node: OutcomeEventNode): string {
  const width = findChildEvent(node, 'passageWidth');
  return width ? renderPassageWidthCompact(width) : '';
}

export function renderDoorBeyondCompactNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'doorBeyond') return [];
  const heading: DungeonMessage = { kind: 'heading', level: 3, text: 'Door' };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${DoorBeyond[outcome.event.result]}`],
  };
  const text = renderDoorBeyondCompact(outcome);
  return [heading, bullet, { kind: 'paragraph', text }];
}
