import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureBracersOfDefense,
  TreasureBracersOfDefense,
} from '../../../tables/dungeon/treasureBracersOfDefense';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const AC_LABELS: Record<TreasureBracersOfDefense, string> = {
  [TreasureBracersOfDefense.AC8]: 'AC8',
  [TreasureBracersOfDefense.AC7]: 'AC7',
  [TreasureBracersOfDefense.AC6]: 'AC6',
  [TreasureBracersOfDefense.AC5]: 'AC5',
  [TreasureBracersOfDefense.AC4]: 'AC4',
  [TreasureBracersOfDefense.AC3]: 'AC3',
  [TreasureBracersOfDefense.AC2]: 'AC2',
};

export function renderTreasureBracersOfDefenseDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureBracersOfDefense') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Bracers of Defense',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${labelForResult(outcome.event.result)}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: bracersSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureBracersOfDefenseCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureBracersOfDefense') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Bracers of Defense',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: bracersSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureBracersOfDefensePreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Bracers of Defense Armor Class',
    sides: treasureBracersOfDefense.sides,
    entries: treasureBracersOfDefense.entries.map(({ range, command }) => ({
      range,
      label: labelForResult(command),
    })),
  });

export function labelForResult(result: TreasureBracersOfDefense): string {
  return `Bracers of Defense ${AC_LABELS[result]}`;
}

export function bracersSentence(result: TreasureBracersOfDefense): string {
  return `There is a pair of bracers of defense ${AC_LABELS[
    result
  ].toUpperCase()}.`;
}
