import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import type {
  IounStonesSummary,
  IounStoneListEntry,
} from '../../../types/dungeon';
import type { TreasureIounStonesResult } from '../../domain/outcome';
import type { AppendPreviewFn } from './shared';

export function renderTreasureIounStonesDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureIounStones') return [];
  const summary = toIounStonesSummary(outcome.event.result);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Ioun Stones',
  };
  const rollInfo: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${summary.count} stone${
        summary.count === 1 ? '' : 's'
      }`,
    ],
  };
  const detailMessage: DungeonMessage = {
    kind: 'ioun-stones',
    summary,
    display: 'detail',
  };
  const nodes: DungeonRenderNode[] = [heading, rollInfo, detailMessage];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureIounStonesCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureIounStones') return [];
  const summary = toIounStonesSummary(outcome.event.result);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Ioun Stones',
  };
  const rollInfo: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${summary.count} stone${
        summary.count === 1 ? '' : 's'
      }`,
    ],
  };
  const compactMessage: DungeonMessage = {
    kind: 'ioun-stones',
    summary,
    display: 'compact',
  };
  const nodes: DungeonRenderNode[] = [heading, rollInfo, compactMessage];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function toIounStonesSummary(
  result: TreasureIounStonesResult
): IounStonesSummary {
  return {
    count: result.stones.length,
    countRoll: result.countRoll,
    stones: result.stones.map((stone) => ({
      index: stone.index,
      color: stone.color,
      shape: stone.shape,
      effect: stone.effect,
      status: stone.status,
      duplicateOf: stone.duplicateOf,
    })) as IounStoneListEntry[],
  };
}

function stoneBaseText(stone: IounStoneListEntry): string {
  const color = stone.color.trim();
  const shape = stone.shape.trim();
  if (shape.length > 0 && shape.toLowerCase() === 'any') {
    return color;
  }
  if (color.length === 0) return shape;
  if (shape.length === 0) return color;
  return `${color} ${shape}`.replace(/\s+/g, ' ').trim();
}

function stoneStatusText(stone: IounStoneListEntry): string {
  if (stone.status === 'duplicate') {
    if (stone.duplicateOf !== undefined) {
      return `duplicate of stone ${stone.duplicateOf}, burned out`;
    }
    return 'duplicate, burned out';
  }
  if (stone.status === 'dead') {
    return 'burned out ("dead" stone)';
  }
  return stone.effect.trim();
}

export function iounStoneCompactLine(stone: IounStoneListEntry): string {
  const base = stoneBaseText(stone);
  const descriptor = stoneStatusText(stone);
  const prefix =
    base.length > 0 ? `Stone ${stone.index}: ${base}` : `Stone ${stone.index}`;
  return `${prefix} — ${descriptor}`.trim();
}

export function iounStonesCompactSentence(summary: IounStonesSummary): string {
  if (summary.count === 0) {
    return 'There are no ioun stones.';
  }
  const parts = summary.stones.map(iounStoneCompactLine);
  const detail = parts.join('; ');
  if (summary.count === 1) {
    return `There is 1 ioun stone: ${detail}.`;
  }
  return `There are ioun stones (${summary.count}): ${detail}.`;
}
