import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  chamberRoomContents,
  ChamberRoomContents,
} from '../../../tables/dungeon/chamberRoomContents';
import {
  buildPreview,
  findChildEvent,
  joinSegments,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';
import { describeChamberRoomStairs } from './chamberRoomStairs';
import { describeMonsterOutcome } from './monsters';

export function renderChamberRoomContentsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'chamberRoomContents') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Contents',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${ChamberRoomContents[outcome.event.result]}`,
    ],
  };
  const nodes: DungeonRenderNode[] = [
    heading,
    bullet,
    { kind: 'paragraph', text: `${describeChamberRoomContents(outcome)} ` },
  ];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderChamberRoomContentsCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'chamberRoomContents') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Contents',
  };
  const nodes: DungeonRenderNode[] = [
    heading,
    { kind: 'paragraph', text: `${describeChamberRoomContents(outcome)} ` },
  ];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function describeChamberRoomContents(node: OutcomeEventNode): string {
  if (node.event.kind !== 'chamberRoomContents') return '';
  const segments: string[] = [];
  switch (node.event.result) {
    case ChamberRoomContents.Empty:
      segments.push('The area is empty.');
      break;
    case ChamberRoomContents.MonsterOnly:
      segments.push('A monster is present.');
      addResolvedMonsterSummary(node, segments);
      break;
    case ChamberRoomContents.MonsterAndTreasure:
      segments.push('A monster and treasure are present. TODO treasure.');
      addResolvedMonsterSummary(node, segments);
      break;
    case ChamberRoomContents.Special: {
      const stairs = findChildEvent(node, 'chamberRoomStairs');
      const stairsText = stairs
        ? describeChamberRoomStairs(stairs)
        : 'Determine the stairway.';
      segments.push(`Special, or ${stairsText}`);
      break;
    }
    case ChamberRoomContents.TrickTrap:
      segments.push('A trick or trap is present.');
      break;
    case ChamberRoomContents.Treasure:
      segments.push('Treasure is present. TODO treasure.');
      break;
    default:
      break;
  }
  const stairsEvent = findChildEvent(node, 'chamberRoomStairs');
  if (
    node.event.result === ChamberRoomContents.Special &&
    stairsEvent &&
    stairsEvent.event.kind === 'chamberRoomStairs'
  ) {
    // Already included above
  }
  return joinSegments(segments).trim();
}

function addResolvedMonsterSummary(
  node: OutcomeEventNode,
  segments: string[]
): void {
  const summaries = collectMonsterSummaries(node);
  for (const summary of summaries) {
    if (summary.length > 0) segments.push(summary);
  }
}

function collectMonsterSummaries(node: OutcomeEventNode): string[] {
  const summaries: string[] = [];

  const visit = (current: OutcomeEventNode): void => {
    const description = describeMonsterOutcome(current);
    const text = description?.compactText.trim();
    if (text) summaries.push(text);
    current.children?.forEach((child) => {
      if (child.type === 'event') visit(child);
    });
  };

  node.children?.forEach((child) => {
    if (child.type === 'event') visit(child);
  });

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const summary of summaries) {
    if (!seen.has(summary)) {
      unique.push(summary);
      seen.add(summary);
    }
  }
  return unique;
}

export const buildChamberRoomContentsPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Chamber or Room Contents',
    sides: chamberRoomContents.sides,
    entries: chamberRoomContents.entries.map((entry) => ({
      range: entry.range,
      label: ChamberRoomContents[entry.command] ?? String(entry.command),
    })),
  });
