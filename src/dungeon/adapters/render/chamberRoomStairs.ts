import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  chamberRoomStairs,
  ChamberRoomStairs,
} from '../../../tables/dungeon/chamberRoomStairs';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';

export function renderChamberRoomStairsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'chamberRoomStairs') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Stairway',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${ChamberRoomStairs[outcome.event.result]}`,
    ],
  };
  const nodes: DungeonRenderNode[] = [
    heading,
    bullet,
    { kind: 'paragraph', text: `${describeChamberRoomStairs(outcome)} ` },
  ];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderChamberRoomStairsCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'chamberRoomStairs') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Stairway',
  };
  const nodes: DungeonRenderNode[] = [
    heading,
    { kind: 'paragraph', text: `${describeChamberRoomStairs(outcome)} ` },
  ];
  return nodes;
}

export function describeChamberRoomStairs(node: OutcomeEventNode): string {
  if (node.event.kind !== 'chamberRoomStairs') return '';
  switch (node.event.result) {
    case ChamberRoomStairs.UpOneLevel:
      return 'Stairway leading up one level.';
    case ChamberRoomStairs.UpTwoLevels:
      return 'Stairway leading up two levels.';
    case ChamberRoomStairs.DownOneLevel:
      return 'Stairway leading down one level.';
    case ChamberRoomStairs.DownTwoLevels:
      return 'Stairway leading down two levels.';
    case ChamberRoomStairs.DownThreeLevels:
      return 'Stairway leading down three levels — two flights of stairs and a slanting passageway.';
    default:
      return '';
  }
}

export const buildChamberRoomStairsPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Stairway Result',
    sides: chamberRoomStairs.sides,
    entries: chamberRoomStairs.entries.map((entry) => ({
      range: entry.range,
      label: ChamberRoomStairs[entry.command] ?? String(entry.command),
    })),
  });
