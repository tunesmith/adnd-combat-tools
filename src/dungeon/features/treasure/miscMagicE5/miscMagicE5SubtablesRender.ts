import type {
  DungeonMessage,
  DungeonRenderNode,
  RobeOfUsefulItemsSummary,
  RobeOfUsefulItemsSummaryEntry,
} from '../../../../types/dungeon';
import type {
  OutcomeEventNode,
  RobeOfUsefulItemsResult,
} from '../../../domain/outcome';
import {
  TreasureRobeOfTheArchmagi,
  TreasureScarabOfProtectionCurse,
  TreasureScarabOfProtectionCurseResolution,
  ROBE_OF_USEFUL_ITEMS_BASE_PATCHES,
  robeOfUsefulItemsExtraLabel,
  treasureRobeOfTheArchmagi,
  treasureScarabOfProtectionCurse,
  treasureScarabOfProtectionCursedResolution,
} from './miscMagicE5Subtables';
import {
  buildPreview,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';

type ExtendedEntry = RobeOfUsefulItemsSummaryEntry & { order: number };

const ALIGNMENT_LABELS: Record<TreasureRobeOfTheArchmagi, string> = {
  [TreasureRobeOfTheArchmagi.Good]: 'Good',
  [TreasureRobeOfTheArchmagi.Neutral]: 'Neutral',
  [TreasureRobeOfTheArchmagi.Evil]: 'Evil',
};

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

export function robeOfTheArchmagiAlignment(
  outcome: TreasureRobeOfTheArchmagi
): 'good' | 'neutral' | 'evil' {
  switch (outcome) {
    case TreasureRobeOfTheArchmagi.Good:
      return 'good';
    case TreasureRobeOfTheArchmagi.Neutral:
      return 'neutral';
    case TreasureRobeOfTheArchmagi.Evil:
      return 'evil';
    default:
      return 'neutral';
  }
}

export function robeOfTheArchmagiAlignmentDisplay(
  outcome: TreasureRobeOfTheArchmagi
): 'Good' | 'Neutral' | 'Evil' {
  const alignment = robeOfTheArchmagiAlignment(outcome);
  return (alignment.charAt(0).toUpperCase() + alignment.slice(1)) as
    | 'Good'
    | 'Neutral'
    | 'Evil';
}

export function robeOfTheArchmagiSentence(
  outcome: TreasureRobeOfTheArchmagi
): string {
  return `The robe is aligned with ${robeOfTheArchmagiAlignment(outcome)}.`;
}

export function robeOfTheArchmagiParenthetical(
  outcome: TreasureRobeOfTheArchmagi
): string {
  return robeOfTheArchmagiAlignment(outcome);
}

export function renderTreasureRobeOfTheArchmagiDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRobeOfTheArchmagi') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Robe of the Archmagi Alignment',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: robeOfTheArchmagiSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureRobeOfTheArchmagiCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRobeOfTheArchmagi') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Robe of the Archmagi',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: robeOfTheArchmagiSentence(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureRobeOfTheArchmagiPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Robe of the Archmagi Alignment',
    sides: treasureRobeOfTheArchmagi.sides,
    entries: treasureRobeOfTheArchmagi.entries.map(({ range, command }) => ({
      range,
      label: ALIGNMENT_LABELS[command],
    })),
  });

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

export const buildTreasureScarabOfProtectionCursePreview: TablePreviewFactory =
  (tableId) =>
    buildPreview(tableId, {
      title: 'Scarab of Protection — Curse Check',
      sides: treasureScarabOfProtectionCurse.sides,
      entries: treasureScarabOfProtectionCurse.entries.map(
        ({ range, command }) => ({
          range,
          label: CURSE_LABELS[command],
        })
      ),
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
    items: [
      `roll: ${outcome.roll} — ${RESOLUTION_LABELS[outcome.event.result]}`,
    ],
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

export const buildTreasureScarabOfProtectionCurseResolutionPreview: TablePreviewFactory =
  (tableId) =>
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

export function renderTreasureRobeOfUsefulItemsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRobeOfUsefulItems') return [];
  const summary = toRobeOfUsefulItemsSummary(outcome.event.result);
  const extraLabel =
    summary.extraPatchCount === summary.requestedExtraPatchCount
      ? `${summary.extraPatchCount} additional patches`
      : `${summary.extraPatchCount} additional patches (rolled ${summary.requestedExtraPatchCount})`;
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Robe of Useful Items',
  };
  const rollInfo: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${extraLabel}`,
      `${summary.totalPatches} total patches`,
    ],
  };
  const detailMessage: DungeonMessage = {
    kind: 'robe-of-useful-items',
    summary,
    display: 'detail',
  };
  const nodes: DungeonRenderNode[] = [heading, rollInfo, detailMessage];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureRobeOfUsefulItemsCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureRobeOfUsefulItems') return [];
  const summary = toRobeOfUsefulItemsSummary(outcome.event.result);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Robe of Useful Items',
  };
  const compactMessage: DungeonMessage = {
    kind: 'robe-of-useful-items',
    summary,
    display: 'compact',
  };
  const nodes: DungeonRenderNode[] = [heading, compactMessage];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function toRobeOfUsefulItemsSummary(
  result: RobeOfUsefulItemsResult
): RobeOfUsefulItemsSummary {
  const baseEntries: ExtendedEntry[] = ROBE_OF_USEFUL_ITEMS_BASE_PATCHES.map(
    (definition, index) => ({
      label: definition.label,
      count: definition.count,
      category: 'base',
      order: index,
    })
  );

  const extraMap = new Map<
    RobeOfUsefulItemsSummaryEntry['label'],
    ExtendedEntry
  >();
  result.extraPatches.forEach(({ item }) => {
    const label = robeOfUsefulItemsExtraLabel(item);
    const existing = extraMap.get(label);
    if (existing) {
      existing.count += 1;
    } else {
      extraMap.set(label, {
        label,
        count: 1,
        category: 'extra',
        order: extraMap.size,
      });
    }
  });

  const entries: RobeOfUsefulItemsSummaryEntry[] = [
    ...baseEntries,
    ...Array.from(extraMap.values()),
  ]
    .map(({ order, ...rest }) => rest)
    .sort((a, b) => {
      if (a.category === b.category) return 0;
      return a.category === 'base' ? -1 : 1;
    });

  const basePatchCount = baseEntries.reduce(
    (total, entry) => total + entry.count,
    0
  );

  return {
    totalPatches: basePatchCount + result.extraPatches.length,
    basePatchCount,
    extraPatchCount: result.extraPatches.length,
    requestedExtraPatchCount: result.requestedExtraPatchCount,
    entries,
  };
}
