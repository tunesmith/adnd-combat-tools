import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureCloakOfProtection,
  TreasureCloakOfProtection,
} from '../../../tables/dungeon/treasureCloakOfProtection';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const BONUS_LABELS: Record<TreasureCloakOfProtection, string> = {
  [TreasureCloakOfProtection.PlusOne]: 'Cloak of Protection +1',
  [TreasureCloakOfProtection.PlusTwo]: 'Cloak of Protection +2',
  [TreasureCloakOfProtection.PlusThree]: 'Cloak of Protection +3',
  [TreasureCloakOfProtection.PlusFour]: 'Cloak of Protection +4',
  [TreasureCloakOfProtection.PlusFive]: 'Cloak of Protection +5',
};

export function renderTreasureCloakOfProtectionDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureCloakOfProtection') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Cloak of Protection Bonus',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${BONUS_LABELS[outcome.event.result]}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: cloakSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureCloakOfProtectionCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureCloakOfProtection') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Cloak of Protection Bonus',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: cloakSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureCloakOfProtectionPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Cloak of Protection Bonus',
    sides: treasureCloakOfProtection.sides,
    entries: treasureCloakOfProtection.entries.map(({ range, command }) => ({
      range,
      label: BONUS_LABELS[command],
    })),
  });

export function cloakSentence(result: TreasureCloakOfProtection): string {
  return `There is a ${BONUS_LABELS[result]}.`;
}
