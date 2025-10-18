import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasurePearlOfPowerEffect,
  TreasurePearlOfPowerEffect,
  treasurePearlOfPowerRecall,
  TreasurePearlOfPowerRecall,
  type TreasurePearlOfPowerRecallResult,
} from '../../../tables/dungeon/treasurePearlOfPower';
import { buildPreview, findChildEvent } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

export function describePearlEffect(
  effect: TreasurePearlOfPowerEffect,
  recall?: TreasurePearlOfPowerRecallResult
): string {
  if (effect === TreasurePearlOfPowerEffect.Forgetting) {
    return 'causes a memorized spell to be forgotten';
  }
  if (!recall) return 'recalls a prepared spell';
  if (recall.type === 'single') {
    return `recalls one spell of ${ordinal(recall.level)} level`;
  }
  return `recalls two spells of ${ordinal(recall.level)} level`;
}

export function pearlParenthetical(
  effect: TreasurePearlOfPowerEffect,
  recall?: TreasurePearlOfPowerRecallResult
): string {
  if (effect === TreasurePearlOfPowerEffect.Forgetting) return 'forgetting';
  if (!recall) return 'recalls a spell';
  if (recall.type === 'single') {
    return `recalls ${ordinal(recall.level)} level`;
  }
  return `recalls 2 spells of ${ordinal(recall.level)} level`;
}

export function renderTreasurePearlOfPowerEffectDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePearlOfPowerEffect') return [];
  const recallEvent = findChildEvent(outcome, 'treasurePearlOfPowerRecall');
  const recallResult =
    recallEvent && recallEvent.event.kind === 'treasurePearlOfPowerRecall'
      ? recallEvent.event.result
      : undefined;
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Pearl of Power Effect',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: `The pearl ${describePearlEffect(outcome.event.result, recallResult)}.`,
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasurePearlOfPowerEffectCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePearlOfPowerEffect') return [];
  const recallEvent = findChildEvent(outcome, 'treasurePearlOfPowerRecall');
  const recallResult =
    recallEvent && recallEvent.event.kind === 'treasurePearlOfPowerRecall'
      ? recallEvent.event.result
      : undefined;
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Pearl of Power',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: `Pearl ${describePearlEffect(outcome.event.result, recallResult)}.`,
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasurePearlOfPowerRecallDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePearlOfPowerRecall') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Pearl of Power Recall',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: recallSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasurePearlOfPowerRecallCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePearlOfPowerRecall') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Recall Result',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: recallSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasurePearlOfPowerEffectPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Pearl of Power Effect',
    sides: treasurePearlOfPowerEffect.sides,
    entries: treasurePearlOfPowerEffect.entries.map(({ range, command }) => ({
      range,
      label:
        command === TreasurePearlOfPowerEffect.Forgetting
          ? 'Forgetting'
          : 'Recall',
    })),
  });

export const buildTreasurePearlOfPowerRecallPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Pearl of Power Recall',
    sides: treasurePearlOfPowerRecall.sides,
    entries: treasurePearlOfPowerRecall.entries.map(({ range, command }) => ({
      range,
      label: recallPreviewLabel(command),
    })),
  });

function recallPreviewLabel(command: TreasurePearlOfPowerRecall): string {
  if (command === TreasurePearlOfPowerRecall.RecallTwoByDie) {
    return 'Recalls 2 spells (d6 level)';
  }
  const result = getPreviewResult(command);
  if (result.type === 'single') {
    return `Recalls ${ordinal(result.level)} level`;
  }
  return `Recalls 2 spells (${ordinal(result.level)} level)`;
}

function recallSentence(result: TreasurePearlOfPowerRecallResult): string {
  if (result.type === 'single') {
    return `Recalls one spell of ${ordinal(result.level)} level.`;
  }
  return `Recalls two spells of ${ordinal(result.level)} level.`;
}

function ordinal(level: number): string {
  const suffix =
    level % 10 === 1 && level % 100 !== 11
      ? 'st'
      : level % 10 === 2 && level % 100 !== 12
      ? 'nd'
      : level % 10 === 3 && level % 100 !== 13
      ? 'rd'
      : 'th';
  return `${level}${suffix}`;
}

function getPreviewResult(
  command: TreasurePearlOfPowerRecall
): TreasurePearlOfPowerRecallResult {
  switch (command) {
    case TreasurePearlOfPowerRecall.Recall1stLevel:
      return { type: 'single', level: 1 };
    case TreasurePearlOfPowerRecall.Recall2ndLevel:
      return { type: 'single', level: 2 };
    case TreasurePearlOfPowerRecall.Recall3rdLevel:
      return { type: 'single', level: 3 };
    case TreasurePearlOfPowerRecall.Recall4thLevel:
      return { type: 'single', level: 4 };
    case TreasurePearlOfPowerRecall.Recall5thLevel:
      return { type: 'single', level: 5 };
    case TreasurePearlOfPowerRecall.Recall6thLevel:
      return { type: 'single', level: 6 };
    case TreasurePearlOfPowerRecall.Recall7thLevel:
      return { type: 'single', level: 7 };
    case TreasurePearlOfPowerRecall.Recall8thLevel:
      return { type: 'single', level: 8 };
    case TreasurePearlOfPowerRecall.Recall9thLevel:
      return { type: 'single', level: 9 };
    case TreasurePearlOfPowerRecall.RecallTwoByDie:
    default:
      return { type: 'double', level: 1 };
  }
}
