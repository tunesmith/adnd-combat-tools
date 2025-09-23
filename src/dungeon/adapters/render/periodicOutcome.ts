import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import { PeriodicCheck } from '../../../tables/dungeon/periodicCheck';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';
import { buildPreview, findChildEvent } from './shared';
import { renderDoorChainCompact } from './doorLocation';
import { describeSidePassage } from './sidePassage';
import { renderPassageTurnCompact } from './passageTurns';
import { renderChamberDimensionsCompact } from './chamberDimensions';
import { renderStairsCompact } from './stairs';
import { renderWanderingMonsterCompact } from './monsters';

export const DEAD_END_FALLBACK_TEXT = 'The passage reaches a dead end. (TODO) ';
export const TRICK_TRAP_FALLBACK_TEXT =
  "There is a trick or trap. (TODO) -- check again in 30'. ";

export const buildPeriodicCheckPreview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Periodic Check',
    sides: 20,
    entries: Object.entries(PeriodicCheck)
      .filter((entry): entry is [string, number] =>
        Number.isNaN(Number(entry[0]))
      )
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
        compact: 'A closed door is indicated. ',
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

export function renderPeriodicCheckCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'periodicCheck') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 3,
    text: 'Passage',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${PeriodicCheck[outcome.event.result]}`],
  };
  const text = renderCompactPeriodicOutcome(outcome);
  return [heading, bullet, { kind: 'paragraph', text }];
}

export function renderCompactPeriodicOutcome(
  node: OutcomeEventNode
): string {
  if (node.event.kind !== 'periodicCheck') return '';
  const event = node.event;
  switch (event.result) {
    case PeriodicCheck.Door:
      return renderDoorChainCompact(findChildEvent(node, 'doorLocation'));
    case PeriodicCheck.SidePassage: {
      const side = findChildEvent(node, 'sidePassages');
      if (side && side.event.kind === 'sidePassages') {
        const summary = describeSidePassage(side);
        if (summary.compactText.length > 0) {
          return summary.compactText;
        }
      }
      return 'A side passage occurs. ';
    }
    case PeriodicCheck.PassageTurn: {
      const turn = findChildEvent(node, 'passageTurns');
      return turn
        ? renderPassageTurnCompact(turn)
        : periodicBaseTexts(PeriodicCheck.PassageTurn).detail;
    }
    case PeriodicCheck.Chamber: {
      const chamber = findChildEvent(node, 'chamberDimensions');
      const detail = chamber ? renderChamberDimensionsCompact(chamber) : '';
      return 'The passage opens into a chamber. ' + detail;
    }
    case PeriodicCheck.Stairs: {
      const stairs = findChildEvent(node, 'stairs');
      return stairs
        ? renderStairsCompact(stairs, {
            renderChamberSummary: renderChamberDimensionsCompact,
          })
        : periodicBaseTexts(PeriodicCheck.Stairs).detail;
    }
    case PeriodicCheck.TrickTrap:
      return TRICK_TRAP_FALLBACK_TEXT;
    case PeriodicCheck.WanderingMonster: {
      const whereFrom = findChildEvent(node, 'wanderingWhereFrom');
      const monsterLevelNode = findChildEvent(node, 'monsterLevel');
      const prefix =
        whereFrom && whereFrom.event.kind === 'wanderingWhereFrom'
          ? renderWanderingWhereFrom(whereFrom)
          : '';
      const monsterSummary = renderWanderingMonsterCompact(
        event.level,
        monsterLevelNode && monsterLevelNode.event.kind === 'monsterLevel'
          ? monsterLevelNode
          : undefined
      );
      return prefix + monsterSummary;
    }
    case PeriodicCheck.ContinueStraight:
      return periodicBaseTexts(PeriodicCheck.ContinueStraight).detail;
    case PeriodicCheck.DeadEnd:
      return periodicBaseTexts(PeriodicCheck.DeadEnd).detail;
    default:
      return periodicBaseTexts(event.result).detail;
  }
}

export function renderWanderingWhereFrom(node: OutcomeEventNode): string {
  if (node.event.kind !== 'wanderingWhereFrom') return '';
  switch (node.event.result) {
    case PeriodicCheck.Door: {
      const door = findChildEvent(node, 'doorLocation');
      return renderDoorChainCompact(door);
    }
    case PeriodicCheck.SidePassage: {
      const side = findChildEvent(node, 'sidePassages');
      if (side && side.event.kind === 'sidePassages') {
        const summary = describeSidePassage(side);
        if (summary.compactText.length > 0) {
          return summary.compactText;
        }
      }
      return 'A side passage occurs. ';
    }
    case PeriodicCheck.PassageTurn: {
      const turn = findChildEvent(node, 'passageTurns');
      return turn
        ? renderPassageTurnCompact(turn)
        : periodicBaseTexts(PeriodicCheck.PassageTurn).detail;
    }
    case PeriodicCheck.Chamber: {
      const chamber = findChildEvent(node, 'chamberDimensions');
      const detail = chamber ? renderChamberDimensionsCompact(chamber) : '';
      return 'The passage opens into a chamber. ' + detail;
    }
    case PeriodicCheck.Stairs: {
      const stairs = findChildEvent(node, 'stairs');
      return stairs
        ? renderStairsCompact(stairs, {
            renderChamberSummary: renderChamberDimensionsCompact,
          })
        : periodicBaseTexts(PeriodicCheck.Stairs).detail;
    }
    case PeriodicCheck.TrickTrap:
      return TRICK_TRAP_FALLBACK_TEXT;
    case PeriodicCheck.ContinueStraight:
      return periodicBaseTexts(PeriodicCheck.ContinueStraight).detail;
    case PeriodicCheck.DeadEnd:
      return periodicBaseTexts(PeriodicCheck.DeadEnd).detail;
    default:
      return periodicBaseTexts(node.event.result).detail;
  }
}

export function renderWanderingWhereFromDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'wanderingWhereFrom') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Where From',
  };
  const label =
    PeriodicCheck[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const detailText = renderWanderingWhereFrom(outcome);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (detailText.trim().length > 0) {
    nodes.push({ kind: 'paragraph', text: detailText });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderWanderingWhereFromCompactNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'wanderingWhereFrom') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Where From',
  };
  const label =
    PeriodicCheck[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const text = renderWanderingWhereFrom(outcome);
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (text.trim().length > 0) {
    nodes.push({ kind: 'paragraph', text });
  }
  return nodes;
}
