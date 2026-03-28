import type {
  DungeonMessage,
  DungeonRenderNode,
} from '../../../../types/dungeon';
import type { InlineText } from '../../../helpers/inlineContent';
import type { OutcomeEventNode } from '../../../domain/outcome';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';
import { compactMessagesToText } from '../../../adapters/render/compactMessagesToText';
import { joinSentenceInlineTexts } from '../../../helpers/inlineContent';
import { renderNumberOfExitsCompact } from '../../navigation/exit/numberOfExitsRender';
import {
  collectCharacterPartyMessages,
  describeMonsterOutcome,
} from '../../monsters/render';
import { renderTrickTrapCompact } from '../../hazards/trickTrap/trickTrapRender';
import { collectTreasureCompactInlineTexts } from '../../treasure/treasure/treasureRender';
import { renderCompactUnusualDetails } from '../unusualSpace/unusualSpaceRender';
import {
  chamberDimensions,
  ChamberDimensions,
  chamberRoomContents,
  ChamberRoomContents,
  chamberRoomStairs,
  ChamberRoomStairs,
  roomDimensions,
  RoomDimensions,
} from './roomsChambersTable';

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

export function renderRoomDimensionsCompactInline(
  node: OutcomeEventNode
): InlineText {
  if (node.event.kind !== 'roomDimensions') return { text: '' };
  const segments: Array<string | InlineText> = [];
  const base = formatRoomDimensions(node.event.result).trim();
  if (base.length > 0) segments.push(base);
  if (node.event.result === RoomDimensions.Unusual) {
    const unusual = renderCompactUnusualDetails(node).trim();
    if (unusual.length > 0) segments.push(unusual);
  }
  const contents = findChildEvent(node, 'chamberRoomContents');
  if (contents && contents.event.kind === 'chamberRoomContents') {
    const summary = describeChamberRoomContentsInline(contents);
    if (summary.text.trim().length > 0) segments.push(summary);
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
  return joinSentenceInlineTexts(segments);
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
  const text = renderRoomDimensionsCompactInline(outcome);
  const nodes: DungeonRenderNode[] = [
    heading,
    bullet,
    { kind: 'paragraph', ...text },
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

export function renderChamberDimensionsCompact(
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
  const text = describeChamberDimensionsInline(outcome);
  const nodes: DungeonRenderNode[] = [
    heading,
    bullet,
    { kind: 'paragraph', ...text },
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

export function describeChamberDimensions(node: OutcomeEventNode): string {
  return describeChamberDimensionsInline(node).text;
}

export function describeChamberDimensionsInline(
  node: OutcomeEventNode
): InlineText {
  if (node.event.kind !== 'chamberDimensions') return { text: '' };
  const segments: Array<string | InlineText> = [];
  const base = formatChamberDimensions(node.event.result).trim();
  if (base.length > 0) segments.push(base);
  if (node.event.result === ChamberDimensions.Unusual) {
    const unusual = renderCompactUnusualDetails(node).trim();
    if (unusual.length > 0) segments.push(unusual);
  }
  const contents = findChildEvent(node, 'chamberRoomContents');
  if (contents && contents.event.kind === 'chamberRoomContents') {
    const summary = describeChamberRoomContentsInline(contents);
    if (summary.text.trim().length > 0) segments.push(summary);
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
  return joinSentenceInlineTexts(segments);
}

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
      ...describeChamberRoomContentsInline(outcome, 'detail'),
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
    { kind: 'paragraph', ...describeChamberRoomContentsInline(outcome) },
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
  return describeChamberRoomContentsInline(node, mode).text;
}

function describeChamberRoomContentsInline(
  node: OutcomeEventNode,
  mode: 'compact' | 'detail' = 'compact'
): InlineText {
  if (node.event.kind !== 'chamberRoomContents') return { text: '' };
  const segments: Array<string | InlineText> = [];
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
  return joinSentenceInlineTexts(segments);
}

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
  return [
    heading,
    { kind: 'paragraph', text: `${describeChamberRoomStairs(outcome)} ` },
  ];
}

function describeChamberRoomStairs(node: OutcomeEventNode): string {
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

export const buildChamberDimensionsPreview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Chamber Dimensions',
    sides: chamberDimensions.sides,
    entries: chamberDimensions.entries.map((entry) => ({
      range: entry.range,
      label: ChamberDimensions[entry.command] ?? String(entry.command),
    })),
    context,
  });

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

export const buildChamberRoomStairsPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Stairway Result',
    sides: chamberRoomStairs.sides,
    entries: chamberRoomStairs.entries.map((entry) => ({
      range: entry.range,
      label: ChamberRoomStairs[entry.command] ?? String(entry.command),
    })),
  });

function addResolvedMonsterSummary(
  node: OutcomeEventNode,
  segments: Array<string | InlineText>,
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
  segments: Array<string | InlineText>
): void {
  const summaries = collectTrickTrapSummaries(node);
  for (const summary of summaries) {
    if (summary.length > 0) segments.push(summary);
  }
}

function addResolvedTreasureSummary(
  node: OutcomeEventNode,
  segments: Array<string | InlineText>,
  mode: 'compact' | 'detail'
): void {
  if (mode === 'detail') {
    return;
  }
  const summaries = collectTreasureCompactInlineTexts(node);
  for (const summary of summaries) {
    if (summary.text.length > 0) segments.push(summary);
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
