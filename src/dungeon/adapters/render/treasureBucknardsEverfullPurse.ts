import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureBucknardsEverfullPurse,
  TreasureBucknardsEverfullPurse,
} from '../../../tables/dungeon/treasureBucknardsEverfullPurse';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const PURSE_LABELS: Record<TreasureBucknardsEverfullPurse, string> = {
  [TreasureBucknardsEverfullPurse.Gold]: "Bucknard's Everfull Purse of Gold",
  [TreasureBucknardsEverfullPurse.Platinum]:
    "Bucknard's Everfull Purse of Platinum",
  [TreasureBucknardsEverfullPurse.Gems]: "Bucknard's Everfull Purse of Gems",
};

export function renderTreasureBucknardsEverfullPurseDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureBucknardsEverfullPurse') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: "Bucknard's Everfull Purse",
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${labelForResult(outcome.event.result)}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: purseSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureBucknardsEverfullPurseCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureBucknardsEverfullPurse') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: "Bucknard's Everfull Purse",
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: purseSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureBucknardsEverfullPursePreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: "Bucknard's Everfull Purse Contents",
    sides: treasureBucknardsEverfullPurse.sides,
    entries: treasureBucknardsEverfullPurse.entries.map(
      ({ range, command }) => ({
        range,
        label: labelForResult(command),
      })
    ),
  });

export function labelForResult(result: TreasureBucknardsEverfullPurse): string {
  return PURSE_LABELS[result];
}

export function purseSentence(result: TreasureBucknardsEverfullPurse): string {
  return `${PURSE_LABELS[result]} is here.`;
}
