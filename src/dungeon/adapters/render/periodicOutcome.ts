import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import { PeriodicCheck } from '../../../tables/dungeon/periodicCheck';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';
import { buildPreview } from './shared';

export const DEAD_END_FALLBACK_TEXT = 'The passage reaches a dead end. (TODO) ';
export const TRICK_TRAP_FALLBACK_TEXT =
  "There is a trick or trap. (TODO) -- check again in 30'. ";

export const buildPeriodicCheckPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Periodic Check',
    sides: 20,
    entries: Object.entries(PeriodicCheck)
      .filter((entry): entry is [string, number] => Number.isNaN(Number(entry[0])))
      .map(([label, command]) => ({ range: [command], label })),
  });

export function periodicBaseTexts(
  result: PeriodicCheck,
  options?: { avoidMonster?: boolean }
): { detail: string; compact: string } {
  const avoidMonster = options?.avoidMonster ?? false;
  switch (result) {
    case PeriodicCheck.ContinueStraight:
      return {
        detail: "Continue straight -- check again in 60'. ",
        compact: "Continue straight -- check again in 60'. ",
      };
    case PeriodicCheck.Door:
      return {
        detail: 'A closed door is indicated.',
        compact: 'A door is indicated. ',
      };
    case PeriodicCheck.SidePassage:
      return {
        detail: 'A side passage occurs.',
        compact:
          "A side passage branches. Passages extend -- check again in 30'. ",
      };
    case PeriodicCheck.PassageTurn:
      return {
        detail: 'The passage turns.',
        compact: 'The passage turns. ',
      };
    case PeriodicCheck.Chamber:
      return {
        detail: 'The passage opens into a chamber. ',
        compact: 'The passage opens into a chamber. ',
      };
    case PeriodicCheck.Stairs:
      return {
        detail: 'Stairs are indicated here.',
        compact: 'Stairs are indicated here. ',
      };
    case PeriodicCheck.WanderingMonster:
      return {
        detail: 'A wandering monster is indicated.',
        compact: avoidMonster
          ? 'Wandering Monster (ignored this turn). '
          : 'Wandering Monster: unknown result. ',
      };
    case PeriodicCheck.DeadEnd:
      return {
        detail: DEAD_END_FALLBACK_TEXT,
        compact: DEAD_END_FALLBACK_TEXT,
      };
    case PeriodicCheck.TrickTrap:
      return {
        detail: 'There is a trick or trap here.',
        compact: TRICK_TRAP_FALLBACK_TEXT,
      };
    default:
      return {
        detail: '',
        compact: `Appears from: ${PeriodicCheck[result]}. `,
      };
  }
}

export function renderPeriodicCheckDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes: DungeonRenderNode[] = [];
  const { event, roll } = outcome;
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 3,
    text: 'Passage',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${roll} — ${PeriodicCheck[event.result]}`],
  };
  nodes.push(heading, bullet);
  const baseTexts = periodicBaseTexts(event.result);
  if (baseTexts.detail.length > 0) {
    nodes.push({ kind: 'paragraph', text: baseTexts.detail });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}
