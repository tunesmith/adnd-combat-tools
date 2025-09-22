import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEvent, OutcomeEventNode } from '../../domain/outcome';
import {
  DoorLocation,
  doorLocation,
} from '../../../tables/dungeon/doorLocation';
import {
  PeriodicCheckDoorOnly,
  periodicCheckDoorOnly,
} from '../../../tables/dungeon/periodicCheckDoorOnly';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';
import { buildPreview } from './shared';

export const DOOR_CHAIN_FALLBACK_TEXT =
  "There are no other doors. The main passage extends -- check again in 30'. ";

export function renderDoorLocationDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'doorLocation') return [];
  const event = outcome.event;
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Door Location',
  };
  const label = DoorLocation[event.result] ?? String(event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const nodes: DungeonRenderNode[] = [heading, bullet];
  const description = formatDoorLocationEvent(event).trim();
  if (description) {
    nodes.push({ kind: 'paragraph', text: description });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderPeriodicDoorOnlyDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'periodicCheckDoorOnly') return [];
  const event = outcome.event;
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Door Continuation',
  };
  const label = PeriodicCheckDoorOnly[event.result] ?? String(event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const nodes: DungeonRenderNode[] = [heading, bullet];
  const summary = formatPeriodicDoorOnlyEvent(event);
  if (summary) {
    nodes.push({ kind: 'paragraph', text: summary });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderDoorChainCompact(
  resolvedNode?: OutcomeEventNode
): string {
  if (!resolvedNode) return 'A closed door is indicated. ';
  const events = flattenOutcomeTree(resolvedNode);
  return formatDoorChain(events);
}

export const buildDoorLocationPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Door Location',
    sides: doorLocation.sides,
    entries: doorLocation.entries.map((entry) => ({
      range: entry.range,
      label: DoorLocation[entry.command] ?? String(entry.command),
    })),
  });

export const buildPeriodicDoorOnlyPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Door Continuation',
    sides: periodicCheckDoorOnly.sides,
    entries: periodicCheckDoorOnly.entries.map((entry) => ({
      range: entry.range,
      label: PeriodicCheckDoorOnly[entry.command] ?? String(entry.command),
    })),
  });

export function formatDoorLocationEvent(
  event: Extract<OutcomeEvent, { kind: 'doorLocation' }>
): string {
  if (event.result === DoorLocation.Ahead) return 'A door is Ahead. ';
  const lateral =
    event.result === DoorLocation.Left
      ? 'Left'
      : event.result === DoorLocation.Right
      ? 'Right'
      : undefined;
  if (!lateral) return '';
  if (event.doorChain?.repeated ?? false) {
    return DOOR_CHAIN_FALLBACK_TEXT;
  }
  return `A door is to the ${lateral}. `;
}

export function formatPeriodicDoorOnlyEvent(
  event: Extract<OutcomeEvent, { kind: 'periodicCheckDoorOnly' }>
): string {
  if (event.result === PeriodicCheckDoorOnly.Ignore) {
    return DOOR_CHAIN_FALLBACK_TEXT;
  }
  return '';
}

function flattenOutcomeTree(node: OutcomeEventNode): OutcomeEventNode[] {
  const items: OutcomeEventNode[] = [node];
  const childEvents = (node.children || []).filter(
    (child): child is OutcomeEventNode => child.type === 'event'
  );
  for (const child of childEvents) {
    items.push(...flattenOutcomeTree(child));
  }
  return items;
}

function formatDoorChain(events: OutcomeEventNode[]): string {
  let text = '';
  for (const ev of events) {
    if (ev.event.kind === 'doorLocation') {
      text += formatDoorLocationEvent(ev.event);
    } else if (ev.event.kind === 'periodicCheckDoorOnly') {
      text += formatPeriodicDoorOnlyEvent(ev.event);
    }
  }
  return text;
}
