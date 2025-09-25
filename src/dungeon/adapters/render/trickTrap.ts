import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import { trickTrap, TrickTrap } from '../../../tables/dungeon/trickTrap';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';

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
  const summary = describeTrickTrap(node);
  return summary.compactText;
}

export const buildTrickTrapPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Trick / Trap',
    sides: trickTrap.sides,
    entries: trickTrap.entries.map((entry) => ({
      range: entry.range,
      label: TRICK_TRAP_DETAILS[entry.command].trim(),
    })),
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
    'Secret door unless unlocated: Non-elf locates 3 in 20, elf locates 5 in 20; magical device locates 18 in 20 (then see TABLE II.). Unlocated secret doors go to die 6, 7 below. ',
  [TrickTrap.Pit]: "Pit, 10' deep, 3 in 6 to fall in. ",
  [TrickTrap.SpikedPit]: "Pit, 10' deep with spikes, 3 in 6 to fall in. ",
  [TrickTrap.ElevatorRoomOne]:
    "20' × 20' elevator room (party has entered door directly ahead and is in room), descends 1 level and will not ascend for 30 turns. ",
  [TrickTrap.ElevatorRoomTwo]: 'As entry 9 above, but room descends 2 levels. ',
  [TrickTrap.ElevatorRoomMulti]:
    'As entry 9 above, but room descends 2–5 levels — 1 upon entering and 1 additional level each time an unsuccessful attempt at door opening is made, or until it descends as far as it can. This will not ascend for 60 turns. ',
  [TrickTrap.SlidingWall]:
    "Wall 10' behind slides across passage blocking it for 40–60 turns. ",
  [TrickTrap.OilAndFlame]:
    'Oil (equal to one flask) pours on random person from hole in ceiling, followed by flaming cinder (2–12 h.p. damage unless successful save vs. magic is made, which indicates only 1–3 h.p. damage). ',
  [TrickTrap.CrushingPit]:
    "Pit, 10' deep, 3 in 6 to fall in, pit walls move together to crush victim(s) in 2–5 rounds. ",
  [TrickTrap.ArrowTrap]: 'Arrow trap, 1–3 arrows, 1 in 20 is poisoned. ',
  [TrickTrap.SpearTrap]: 'Spear trap, 1–3 spears, 1 in 20 is poisoned. ',
  [TrickTrap.GasCorridor]:
    "Gas; party has detected it, but must breathe it to continue along corridor, as it covers 60' ahead. Mark map accordingly regardless of turning back or not. (See TABLE VII. A.) ",
  [TrickTrap.FallingDoorOrStone]:
    'Door falls outward causing 1–10 hit points, or stone falls from ceiling causing 2–20 hit points of damage to each person failing his saving throw versus petrification. ',
  [TrickTrap.IllusionaryWall]:
    'Illusionary wall concealing 8 (pit) above (1–6), 20 (chute) below (7–10), or chamber with monster and treasure (11–20) (see TABLE V.). ',
  [TrickTrap.ChuteDown]:
    'Chute down 1 level (cannot be ascended in any manner). ',
};
