import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureFigurineOfWondrousPower,
  TreasureFigurineOfWondrousPower,
} from '../../../tables/dungeon/treasureFigurineOfWondrousPower';
import { buildPreview, findChildEvent } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';
import { marbleElephantVariantName } from './treasureFigurineMarbleElephant';

const FIGURINE_LABELS: Record<TreasureFigurineOfWondrousPower, string> = {
  [TreasureFigurineOfWondrousPower.EbonyFly]: 'an ebony fly',
  [TreasureFigurineOfWondrousPower.GoldenLions]: 'a pair of golden lions',
  [TreasureFigurineOfWondrousPower.IvoryGoats]: 'a trio of ivory goats',
  [TreasureFigurineOfWondrousPower.MarbleElephant]: 'a marble elephant',
  [TreasureFigurineOfWondrousPower.ObsidianSteed]: 'an obsidian steed',
  [TreasureFigurineOfWondrousPower.OnyxDog]: 'an onyx dog',
  [TreasureFigurineOfWondrousPower.SerpentineOwl]: 'a serpentine owl',
};

export function renderTreasureFigurineOfWondrousPowerDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildFigurineNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureFigurineOfWondrousPowerCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildFigurineNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureFigurineOfWondrousPowerPreview: TablePreviewFactory =
  (tableId) =>
    buildPreview(tableId, {
      title: 'Figurine of Wondrous Power',
      sides: treasureFigurineOfWondrousPower.sides,
      entries: treasureFigurineOfWondrousPower.entries.map(
        ({ range, command }) => ({
          range,
          label: previewLabel(command),
        })
      ),
    });

export function figurineSentence(
  result: TreasureFigurineOfWondrousPower,
  marbleChild?: OutcomeEventNode
): string {
  if (
    result === TreasureFigurineOfWondrousPower.MarbleElephant &&
    marbleChild &&
    marbleChild.event.kind === 'treasureFigurineMarbleElephant'
  ) {
    const variant = marbleElephantVariantName(marbleChild.event.result);
    return `There is a Figurine of Wondrous Power. The Figurine is a marble elephant (${variant}).`;
  }
  const label = FIGURINE_LABELS[result];
  return `There is a Figurine of Wondrous Power. The Figurine is ${label}.`;
}

function buildFigurineNodes(outcome: OutcomeEventNode): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureFigurineOfWondrousPower') return [];
  const marbleChild = findChildEvent(outcome, 'treasureFigurineMarbleElephant');
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Figurine of Wondrous Power',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${previewLabel(outcome.event.result)}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: figurineSentence(outcome.event.result, marbleChild),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  return nodes;
}

function previewLabel(result: TreasureFigurineOfWondrousPower): string {
  if (result === TreasureFigurineOfWondrousPower.MarbleElephant) {
    return 'Marble Elephant';
  }
  const label = FIGURINE_LABELS[result];
  return label.charAt(0).toUpperCase() + label.slice(1);
}
