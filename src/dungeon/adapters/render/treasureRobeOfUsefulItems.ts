import type {
  DungeonMessage,
  DungeonRenderNode,
  RobeOfUsefulItemsSummary,
  RobeOfUsefulItemsSummaryEntry,
} from '../../../types/dungeon';
import type {
  OutcomeEventNode,
  RobeOfUsefulItemsResult,
} from '../../domain/outcome';
import {
  ROBE_OF_USEFUL_ITEMS_BASE_PATCHES,
  robeOfUsefulItemsExtraLabel,
} from '../../helpers/robeOfUsefulItems';

type ExtendedEntry = RobeOfUsefulItemsSummaryEntry & { order: number };

export function renderTreasureRobeOfUsefulItemsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: (node: OutcomeEventNode, messages: DungeonRenderNode[]) => void
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
  appendPendingPreviews: (node: OutcomeEventNode, messages: DungeonRenderNode[]) => void
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
