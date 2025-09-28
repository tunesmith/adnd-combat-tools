import type {
  DungeonMessage,
  DungeonRenderNode,
  DungeonTablePreview,
} from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import { PeriodicCheck } from '../../../tables/dungeon/periodicCheck';
import { periodicCheck } from '../../../tables/dungeon/periodicCheck';
import { TrickTrap } from '../../../tables/dungeon/trickTrap';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';
import { buildPreview, findChildEvent } from './shared';
import { renderDoorChainCompact } from './doorLocation';
import { describeSidePassage } from './sidePassage';
import { renderPassageTurnCompact } from './passageTurns';
import { describeChamberDimensions } from './chamberDimensions';
import { renderStairsCompact } from './stairs';
import {
  renderWanderingMonsterCompact,
  collectCharacterPartyMessages,
} from './monsters';
import { renderTrickTrapCompact } from './trickTrap';
import { renderChamberDimensionsCompact } from './chamberDimensions';

export const DEAD_END_FALLBACK_TEXT =
  'The passage reaches a dead end. Walls left, right, and ahead can each be checked for 25% chance of secret door. Characters would still need to detect. ';
export const TRICK_TRAP_FALLBACK_TEXT =
  "There is a trick or trap -- check again in 30'. ";

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
  if (event.kind !== 'periodicCheck') return nodes;
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
  const summary = summarizePeriodicResult(outcome.event.result, outcome, {
    avoidMonster: outcome.event.avoidMonster,
    mode: 'compact',
  });
  const nodes: DungeonRenderNode[] = [
    heading,
    bullet,
    { kind: 'paragraph', text: summary.text },
  ];
  if (summary.nodes) {
    nodes.push(...summary.nodes);
  }
  return nodes;
}

export function renderWanderingWhereFrom(node: OutcomeEventNode): string {
  if (node.event.kind !== 'wanderingWhereFrom') return '';
  return summarizePeriodicResult(node.event.result, node, {
    mode: 'compact',
  }).text;
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
  const detailSummary = summarizePeriodicResult(outcome.event.result, outcome, {
    mode: 'detail',
  });
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (detailSummary.text.trim().length > 0) {
    nodes.push({ kind: 'paragraph', text: detailSummary.text });
  }
  if (detailSummary.nodes) {
    nodes.push(...detailSummary.nodes);
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
  const summary = summarizePeriodicResult(outcome.event.result, outcome, {
    mode: 'compact',
  });
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (summary.text.trim().length > 0) {
    nodes.push({ kind: 'paragraph', text: summary.text });
  }
  if (summary.nodes) {
    nodes.push(...summary.nodes);
  }
  return nodes;
}

export function buildWanderingWhereFromPreview(
  tableId: string
): DungeonTablePreview {
  return buildPreview(tableId, {
    title: 'Where From',
    sides: periodicCheck.sides,
    entries: periodicCheck.entries
      .filter((entry) => entry.command !== PeriodicCheck.WanderingMonster)
      .map((entry) => ({
        range: entry.range,
        label: PeriodicCheck[entry.command] ?? String(entry.command),
      })),
  });
}

type PeriodicSummary = {
  text: string;
  nodes?: DungeonRenderNode[];
};

function summarizePeriodicResult(
  result: PeriodicCheck,
  node: OutcomeEventNode,
  options?: { avoidMonster?: boolean; mode?: 'detail' | 'compact' }
): PeriodicSummary {
  const base = periodicBaseTexts(result, options);
  const mode: 'detail' | 'compact' = options?.mode ?? 'compact';
  switch (result) {
    case PeriodicCheck.Door:
      return {
        text: renderDoorChainCompact(findChildEvent(node, 'doorLocation')),
      };
    case PeriodicCheck.SidePassage: {
      const side = findChildEvent(node, 'sidePassages');
      if (side && side.event.kind === 'sidePassages') {
        const summary = describeSidePassage(side);
        if (summary.compactText.length > 0) {
          return { text: summary.compactText };
        }
      }
      return { text: base.compact };
    }
    case PeriodicCheck.PassageTurn: {
      const turn = findChildEvent(node, 'passageTurns');
      return {
        text: turn ? renderPassageTurnCompact(turn) : base.compact,
      };
    }
    case PeriodicCheck.Chamber: {
      const chamber = findChildEvent(node, 'chamberDimensions');
      const detail = chamber ? describeChamberDimensions(chamber) : '';
      const partyMessages = chamber
        ? collectCharacterPartyMessages(chamber, 'compact')
        : [];
      return {
        text: `${base.compact}${detail}`.trimEnd() + ' ',
        nodes: partyMessages.length > 0 ? partyMessages : undefined,
      };
    }
    case PeriodicCheck.Stairs: {
      const stairs = findChildEvent(node, 'stairs');
      return {
        text: stairs
          ? renderStairsCompact(stairs, {
              renderChamberSummary: describeChamberDimensions,
            })
          : base.compact,
      };
    }
    case PeriodicCheck.TrickTrap: {
      const trap = findChildEvent(node, 'trickTrap');
      if (!trap) {
        return { text: TRICK_TRAP_FALLBACK_TEXT };
      }
      const trickText = renderTrickTrapCompact(trap);
      if (mode === 'detail') {
        const trapResult =
          trap.event.kind === 'trickTrap' ? trap.event.result : undefined;
        if (trapResult === TrickTrap.IllusionaryWall) {
          return { text: TRICK_TRAP_FALLBACK_TEXT };
        }
        return { text: trickText };
      }
      const chamberNodes: DungeonRenderNode[] = [];
      trap.children?.forEach((child) => {
        if (child.type !== 'event') return;
        if (child.event.kind === 'illusionaryWallNature') {
          const chamber = findChildEvent(child, 'chamberDimensions');
          if (chamber && chamber.type === 'event') {
            chamberNodes.push(...renderChamberDimensionsCompact(chamber));
          }
        }
      });
      let combinedNodes: DungeonRenderNode[] = [];
      if (chamberNodes.length > 0) {
        combinedNodes = chamberNodes;
      } else {
        const partyMessages = collectCharacterPartyMessages(trap, 'compact');
        combinedNodes = partyMessages;
      }
      return {
        text: trickText,
        nodes: combinedNodes.length > 0 ? combinedNodes : undefined,
      };
    }
    case PeriodicCheck.WanderingMonster: {
      if (node.event.kind !== 'periodicCheck') {
        return { text: base.compact };
      }
      const whereFrom = findChildEvent(node, 'wanderingWhereFrom');
      const prefixSummary =
        whereFrom && whereFrom.event.kind === 'wanderingWhereFrom'
          ? summarizePeriodicResult(whereFrom.event.result, whereFrom, {
              mode: 'compact',
            })
          : { text: '' };
      const monsterLevelNode = findChildEvent(node, 'monsterLevel');
      const monsterSummary = renderWanderingMonsterCompact(
        node.event.level,
        monsterLevelNode && monsterLevelNode.event.kind === 'monsterLevel'
          ? monsterLevelNode
          : undefined
      );
      const combinedNodes = [
        ...(prefixSummary.nodes ?? []),
        ...(monsterSummary.nodes ?? []),
      ];
      return {
        text: `${prefixSummary.text}${monsterSummary.text}`,
        nodes: combinedNodes.length > 0 ? combinedNodes : undefined,
      };
    }
    case PeriodicCheck.ContinueStraight:
    case PeriodicCheck.DeadEnd:
      return { text: base.compact };
    default:
      return { text: base.compact };
  }
}
