import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureScarabOfProtectionCurse,
  TreasureScarabOfProtectionCurse,
  treasureScarabOfProtectionCursedResolution,
  TreasureScarabOfProtectionCurseResolution,
} from '../../../tables/dungeon/treasureScarabOfProtection';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

const CURSE_LABELS: Record<TreasureScarabOfProtectionCurse, string> = {
  [TreasureScarabOfProtectionCurse.Normal]: '+1 (protective)',
  [TreasureScarabOfProtectionCurse.Cursed]: '-2 (cursed)',
};

const RESOLUTION_LABELS: Record<
  TreasureScarabOfProtectionCurseResolution,
  string
> = {
  [TreasureScarabOfProtectionCurseResolution.Removable]:
    'Removable by cleric (16+)',
  [TreasureScarabOfProtectionCurseResolution.Permanent]: 'Permanent curse',
};

export function scarabOfProtectionParenthetical(
  curse?: TreasureScarabOfProtectionCurse,
  resolution?: TreasureScarabOfProtectionCurseResolution
): string {
  if (curse === undefined) return '';
  if (curse !== TreasureScarabOfProtectionCurse.Cursed) {
    return '+1';
  }
  return resolution === TreasureScarabOfProtectionCurseResolution.Removable
    ? '-2, cursed, removable'
    : '-2, cursed';
}

export function scarabOfProtectionCurseSentence(
  result: TreasureScarabOfProtectionCurse
): string {
  return result === TreasureScarabOfProtectionCurse.Cursed
    ? 'The scarab is cursed, imposing a -2 penalty to all saving throws.'
    : 'The scarab is protective, granting a +1 bonus to saving throws versus magic and absorbing 12 drains/effects.';
}

export function scarabOfProtectionResolutionSentence(
  result: TreasureScarabOfProtectionCurseResolution
): string {
  return result === TreasureScarabOfProtectionCurseResolution.Removable
    ? 'If removed by a cleric of 16th level or higher, it becomes +2 and can absorb 24 drains/effects.'
    : 'The curse is permanent; once the scarab absorbs 12 drains/effects it crumbles to dust.';
}

export function renderTreasureScarabOfProtectionCurseDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureScarabOfProtectionCurse') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Scarab of Protection — Curse Check',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${CURSE_LABELS[outcome.event.result]}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: scarabOfProtectionCurseSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureScarabOfProtectionCurseCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureScarabOfProtectionCurse') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Scarab of Protection',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: scarabOfProtectionCurseSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureScarabOfProtectionCursePreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Scarab of Protection — Curse Check',
    sides: treasureScarabOfProtectionCurse.sides,
    entries: treasureScarabOfProtectionCurse.entries.map(({ range, command }) => ({
      range,
      label: CURSE_LABELS[command],
    })),
  });

export function renderTreasureScarabOfProtectionCurseResolutionDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureScarabOfProtectionCurseResolution')
    return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Scarab of Protection — Curse Resolution',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${RESOLUTION_LABELS[outcome.event.result]}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: scarabOfProtectionResolutionSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureScarabOfProtectionCurseResolutionCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureScarabOfProtectionCurseResolution')
    return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Scarab Curse Resolution',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: scarabOfProtectionResolutionSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureScarabOfProtectionCurseResolutionPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Scarab of Protection — Curse Resolution',
    sides: treasureScarabOfProtectionCursedResolution.sides,
    entries: treasureScarabOfProtectionCursedResolution.entries.map(
      ({ range, command }) => ({
        range,
        label: RESOLUTION_LABELS[command],
      })
    ),
  });
