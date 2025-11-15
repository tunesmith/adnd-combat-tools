import type {
  DungeonMessage,
  DungeonRenderNode,
  PrayerBeadsBreakdownEntry,
  PrayerBeadsSummary,
} from '../../../types/dungeon';
import type {
  OutcomeEventNode,
  TreasureNecklaceOfPrayerBeadsResult,
} from '../../domain/outcome';
import {
  treasureNecklacePrayerBeads,
  TreasureNecklacePrayerBead,
} from '../../../tables/dungeon/treasureNecklacePrayerBeads';
import { buildPreview } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';

function beadLabel(bead: TreasureNecklacePrayerBead): string {
  switch (bead) {
    case TreasureNecklacePrayerBead.Atonement:
      return 'Bead of Atonement';
    case TreasureNecklacePrayerBead.Blessing:
      return 'Bead of Blessing';
    case TreasureNecklacePrayerBead.Curing:
      return 'Bead of Curing';
    case TreasureNecklacePrayerBead.Karma:
      return 'Bead of Karma';
    case TreasureNecklacePrayerBead.Summons:
      return 'Bead of Summons';
    case TreasureNecklacePrayerBead.WindWalking:
      return 'Bead of Wind Walking';
  }
}

export function renderTreasureNecklaceOfPrayerBeadsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureNecklaceOfPrayerBeads') return [];
  const summary = toPrayerBeadsSummary(outcome.event.result);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Necklace of Prayer Beads',
  };
  const rollInfo: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${summary.specialCount} special bead${
        summary.specialCount === 1 ? '' : 's'
      }`,
    ],
  };
  const detailMessage: DungeonMessage = {
    kind: 'prayer-beads',
    summary,
    display: 'detail',
  };
  const nodes: DungeonRenderNode[] = [heading, rollInfo, detailMessage];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureNecklaceOfPrayerBeadsCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureNecklaceOfPrayerBeads') return [];
  const summary = toPrayerBeadsSummary(outcome.event.result);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Necklace of Prayer Beads',
  };
  const rollInfo: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${summary.specialCount} special bead${
        summary.specialCount === 1 ? '' : 's'
      }`,
    ],
  };
  const compactMessage: DungeonMessage = {
    kind: 'prayer-beads',
    summary,
    display: 'compact',
  };
  const nodes: DungeonRenderNode[] = [heading, rollInfo, compactMessage];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureNecklaceOfPrayerBeadsPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Necklace of Prayer Beads',
    sides: treasureNecklacePrayerBeads.sides,
    entries: treasureNecklacePrayerBeads.entries.map(({ range, command }) => ({
      range,
      label: beadLabel(command),
    })),
  });

export function necklaceOfPrayerBeadsParenthetical(
  specialBeads: TreasureNecklacePrayerBead[]
): string {
  if (specialBeads.length === 0) return 'no special beads';
  const breakdown = aggregateSpecialBeads(specialBeads);
  return formatBreakdown(breakdown).join(', ');
}

export function toPrayerBeadsSummary(
  result: TreasureNecklaceOfPrayerBeadsResult
): PrayerBeadsSummary {
  const breakdown = aggregateSpecialBeads(
    result.specialBeads.map((bead) => bead.type)
  );
  return {
    totalBeads: result.totalBeads,
    semiPrecious: result.semiPrecious,
    fancy: result.fancy,
    specialCount: result.specialBeads.length,
    breakdown,
  };
}

function aggregateSpecialBeads(
  beads: TreasureNecklacePrayerBead[]
): PrayerBeadsBreakdownEntry[] {
  const map = new Map<string, number>();
  beads.forEach((bead) => {
    const name = beadLabel(bead);
    map.set(name, (map.get(name) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([label, count]) => ({ label, count }));
}

function formatBreakdown(breakdown: PrayerBeadsBreakdownEntry[]): string[] {
  return breakdown.map(({ label, count }) =>
    count === 1 ? label : `${count}×${label}`
  );
}
