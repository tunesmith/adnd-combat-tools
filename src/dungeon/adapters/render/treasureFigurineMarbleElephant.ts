import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureFigurineMarbleElephant,
  TreasureFigurineMarbleElephant,
} from '../../../tables/dungeon/treasureFigurineMarbleElephant';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const LABELS: Record<TreasureFigurineMarbleElephant, string> = {
  [TreasureFigurineMarbleElephant.Asiatic]: 'Asiatic elephant',
  [TreasureFigurineMarbleElephant.African]: 'African loxodont elephant',
  [TreasureFigurineMarbleElephant.PrehistoricMammoth]: 'prehistoric mammoth',
  [TreasureFigurineMarbleElephant.PrehistoricMastodon]: 'prehistoric mastodon',
};

const VARIANT_NAMES: Record<TreasureFigurineMarbleElephant, string> = {
  [TreasureFigurineMarbleElephant.Asiatic]: 'Asiatic Elephant',
  [TreasureFigurineMarbleElephant.African]: 'African Loxodont',
  [TreasureFigurineMarbleElephant.PrehistoricMammoth]: 'Prehistoric (Mammoth)',
  [TreasureFigurineMarbleElephant.PrehistoricMastodon]:
    'Prehistoric (Mastodon)',
};

export function renderTreasureFigurineMarbleElephantDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureFigurineMarbleElephant') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Marble Elephant Form',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${labelFor(outcome.event.result)}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: marbleElephantSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureFigurineMarbleElephantCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureFigurineMarbleElephant') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Marble Elephant Form',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: marbleElephantSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureFigurineMarbleElephantPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Marble Elephant Form',
    sides: treasureFigurineMarbleElephant.sides,
    entries: treasureFigurineMarbleElephant.entries.map(
      ({ range, command }) => ({
        range,
        label: labelFor(command),
      })
    ),
  });

export function marbleElephantSentence(
  result: TreasureFigurineMarbleElephant
): string {
  const label = labelFor(result);
  return `The marble elephant takes the form of ${withArticle(label)}.`;
}

export function marbleElephantVariantName(
  result: TreasureFigurineMarbleElephant
): string {
  return VARIANT_NAMES[result];
}

function labelFor(result: TreasureFigurineMarbleElephant): string {
  return LABELS[result];
}

function withArticle(label: string): string {
  const trimmed = label.trim();
  const first = trimmed.charAt(0).toLowerCase();
  const article = 'aeiou'.includes(first) ? 'an' : 'a';
  return `${article} ${trimmed}`;
}
