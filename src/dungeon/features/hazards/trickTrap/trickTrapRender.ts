import type {
  DungeonMessage,
  DungeonRenderNode,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import { trickTrap, TrickTrap } from './trickTrapTable';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';
import { describeIllusionaryWallNature } from '../../../adapters/render/illusionaryWallNature';
import { describeGasTrapEffect } from '../gasTrap/gasTrapRender';

export function renderTrickTrapDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'trickTrap') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Trick / Trap',
  };
  const label = TRICK_TRAP_LABELS[outcome.event.result];
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const summary = describeTrickTrap(outcome);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  nodes.push(...summary.detailParagraphs);
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function describeTrickTrap(node: OutcomeEventNode): {
  detailParagraphs: DungeonMessage[];
  compactText: string;
} {
  if (node.event.kind !== 'trickTrap') {
    return { detailParagraphs: [], compactText: '' };
  }
  const text = formatTrickTrap(node.event.result);
  const detailParagraphs: DungeonMessage[] = text.length
    ? [{ kind: 'paragraph', text }]
    : [];
  return { detailParagraphs, compactText: text };
}

export function renderTrickTrapCompact(node: OutcomeEventNode): string {
  if (node.event.kind !== 'trickTrap') return '';
  const base = describeTrickTrap(node).compactText;
  if (!node.children) return base;
  const extras: string[] = [];
  for (const child of node.children) {
    if (child.type !== 'event') continue;
    if (child.event.kind === 'illusionaryWallNature') {
      extras.push(describeIllusionaryWallNature(child));
    } else if (child.event.kind === 'gasTrapEffect') {
      extras.push(describeGasTrapEffect(child));
    }
  }
  return extras.length > 0 ? `${base}${extras.join(' ')}` : base;
}

export function renderTrickTrapCompactNodes(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'trickTrap') return [];
  const text = renderTrickTrapCompact(outcome);
  const nodes: DungeonRenderNode[] = text ? [{ kind: 'paragraph', text }] : [];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTrickTrapPreview: TablePreviewFactory = (tableId, context) =>
  buildPreview(tableId, {
    title: 'Trick / Trap',
    sides: trickTrap.sides,
    entries: trickTrap.entries.map((entry) => ({
      range: entry.range,
      label: TRICK_TRAP_DETAILS[entry.command].trim(),
    })),
    context,
  });

function formatTrickTrap(result: TrickTrap): string {
  return TRICK_TRAP_DETAILS[result];
}

const TRICK_TRAP_LABELS: Record<TrickTrap, string> = {
  [TrickTrap.SecretDoor]: 'Secret door unless unlocated',
  [TrickTrap.Pit]: "Pit, 10' deep",
  [TrickTrap.SpikedPit]: 'Pit with spikes',
  [TrickTrap.ElevatorRoomOne]: 'Elevator room descends 1 level',
  [TrickTrap.ElevatorRoomTwo]: 'Elevator room descends 2 levels',
  [TrickTrap.ElevatorRoomMulti]: 'Elevator descends 2–5 levels',
  [TrickTrap.SlidingWall]: 'Sliding wall blocks passage',
  [TrickTrap.OilAndFlame]: 'Oil and flaming cinder trap',
  [TrickTrap.CrushingPit]: 'Crushing pit',
  [TrickTrap.ArrowTrap]: 'Arrow trap (1–3 arrows)',
  [TrickTrap.SpearTrap]: 'Spear trap (1–3 spears)',
  [TrickTrap.GasCorridor]: 'Gas fills corridor ahead',
  [TrickTrap.FallingDoorOrStone]: 'Falling door or stone',
  [TrickTrap.IllusionaryWall]: 'Illusionary wall',
  [TrickTrap.ChuteDown]: 'Chute down one level',
};

const TRICK_TRAP_DETAILS: Record<TrickTrap, string> = {
  [TrickTrap.SecretDoor]:
    "There is a secret door if it is located: Non-elf locates 3 in 20, elf locates 5 in 20; magical device locates 18 in 20. If the secret door is not located, there is a pit, 10' deep (3 in 6 to fall in). ",
  [TrickTrap.Pit]: "There is a pit, 10' deep (3 in 6 to fall in). ",
  [TrickTrap.SpikedPit]:
    "There is a pit, 10' deep with spikes (3 in 6 to fall in). ",
  [TrickTrap.ElevatorRoomOne]:
    "There is a 20' × 20' elevator room (the party has entered the door directly ahead and is in the room). It descends 1 level and will not ascend for 30 turns. ",
  [TrickTrap.ElevatorRoomTwo]:
    "There is a 20' × 20' elevator room (the party has entered the door directly ahead and is in the room). It descends 2 levels and will not ascend for 30 turns. ",
  [TrickTrap.ElevatorRoomMulti]:
    "There is a 20' × 20' elevator room (the party has entered the door directly ahead and is in the room). It descends 2-5 levels - 1 upon entering and 1 additional level each time an unsuccessful attempt at a door opening is made, or until it descends as far as it can. This will not ascend for 60 turns. ",
  [TrickTrap.SlidingWall]:
    "A wall 10' behind slides across the passage, blocking it for 40–60 turns. ",
  [TrickTrap.OilAndFlame]:
    'Oil (equal to one flask) pours on a random person from a hole in the ceiling, followed by flaming cinder (2–12 h.p. damage unless successful save vs. magic is made, which indicates only 1–3 h.p. damage). ',
  [TrickTrap.CrushingPit]:
    "There is a pit, 10' deep (3 in 6 to fall in). Pit walls move together to crush victim(s) in 2–5 rounds. ",
  [TrickTrap.ArrowTrap]:
    'There is an arrow trap of 1–3 arrows. 1 in 20 is poisoned. ',
  [TrickTrap.SpearTrap]:
    'There is a pear trap of 1–3 spears. 1 in 20 is poisoned. ',
  [TrickTrap.GasCorridor]:
    "Gas is here. The party has detected it, but must breathe it to continue along corridor, as it covers 60' ahead. Mark map accordingly regardless of turning back or not. ",
  [TrickTrap.FallingDoorOrStone]:
    'A door falls outward causing 1–10 hit points, or stone falls from ceiling causing 2–20 hit points of damage to each person failing his saving throw versus petrification. ',
  [TrickTrap.IllusionaryWall]: 'There is an illusionary wall. ',
  [TrickTrap.ChuteDown]:
    'There is a chute down 1 level. It cannot be ascended in any manner. ',
};
