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
import {
  describeMonsterOutcome,
  collectCharacterPartyMessages,
} from './monsters';
import { renderTrickTrapCompact } from './trickTrap';
import { compactMessagesToText } from './monsters/partySummary';
import { collectTreasureCompactSummaries } from './treasure';

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
  const nodes: DungeonRenderNode[] = [heading, bullet];
  const partyMessages = collectCharacterPartyMessages(outcome, 'detail');
  if (partyMessages.length === 0) {
    nodes.push({
      kind: 'paragraph',
      text: `${describeChamberRoomContents(outcome, 'detail')} `,
    });
  }
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
  const partyMessages = collectCharacterPartyMessages(outcome, 'compact');
  if (partyMessages.length > 0) {
    nodes.push(...partyMessages);
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function describeChamberRoomContents(
  node: OutcomeEventNode,
  mode: 'compact' | 'detail' = 'compact'
): string {
  if (node.event.kind !== 'chamberRoomContents') return '';
  const segments: string[] = [];
  switch (node.event.result) {
    case ChamberRoomContents.Empty:
      segments.push('The area is empty.');
      break;
    case ChamberRoomContents.MonsterOnly:
      segments.push('A monster is present.');
      addResolvedMonsterSummary(node, segments, mode);
      break;
    case ChamberRoomContents.MonsterAndTreasure:
      segments.push('A monster and treasure are present.');
      addResolvedMonsterSummary(node, segments, mode);
      addResolvedTreasureSummary(node, segments, mode);
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
      addResolvedTrickTrapSummary(node, segments);
      break;
    case ChamberRoomContents.Treasure:
      segments.push('Treasure is present.');
      addResolvedTreasureSummary(node, segments, mode);
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
  segments: string[],
  mode: 'compact' | 'detail'
): void {
  if (mode === 'detail') {
    return;
  }
  const partyMessages = collectCharacterPartyMessages(node, 'compact');
  if (partyMessages.length > 0) {
    return;
  }
  const summaries = collectMonsterSummaries(node);
  for (const summary of summaries) {
    if (summary.length > 0) segments.push(summary);
  }
}

function collectMonsterSummaries(node: OutcomeEventNode): string[] {
  const summaries: string[] = [];

  const visit = (current: OutcomeEventNode): void => {
    const description = describeMonsterOutcome(current);
    if (description) {
      const hasPartyMessage = description.compactMessages?.some(
        (message) => message.kind === 'character-party'
      );
      if (!hasPartyMessage) {
        if (
          description.compactMessages &&
          description.compactMessages.length > 0
        ) {
          const text = compactMessagesToText(description.compactMessages);
          if (text.length > 0) summaries.push(text);
        }
        const text = description.compactText.trim();
        if (text) summaries.push(text);
      }
    }
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

function addResolvedTrickTrapSummary(
  node: OutcomeEventNode,
  segments: string[]
): void {
  const summaries = collectTrickTrapSummaries(node);
  for (const summary of summaries) {
    if (summary.length > 0) segments.push(summary);
  }
}

function addResolvedTreasureSummary(
  node: OutcomeEventNode,
  segments: string[],
  mode: 'compact' | 'detail'
): void {
  if (mode === 'detail') {
    return;
  }
  const summaries = collectTreasureCompactSummaries(node);
  for (const summary of summaries) {
    if (summary.length > 0) segments.push(summary);
  }
}

function collectTrickTrapSummaries(node: OutcomeEventNode): string[] {
  const summaries: string[] = [];

  const visit = (current: OutcomeEventNode): void => {
    if (current.event.kind === 'trickTrap') {
      const text = renderTrickTrapCompact(current).trim();
      if (text.length > 0) summaries.push(text);
    }
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

export const buildChamberRoomContentsPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Chamber or Room Contents',
    sides: chamberRoomContents.sides,
    entries: chamberRoomContents.entries.map((entry) => ({
      range: entry.range,
      label: ChamberRoomContents[entry.command] ?? String(entry.command),
    })),
    context,
  });
