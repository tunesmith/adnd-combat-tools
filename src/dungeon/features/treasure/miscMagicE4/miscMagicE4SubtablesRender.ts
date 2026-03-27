import type {
  DungeonMessage,
  DungeonRenderNode,
  PrayerBeadsBreakdownEntry,
  PrayerBeadsSummary,
} from '../../../../types/dungeon';
import {
  emphasizeInlineText,
  extractLeadingItemPhrase,
} from '../../../helpers/inlineContent';
import type {
  OutcomeEventNode,
  TreasureNecklaceOfPrayerBeadsResult,
} from '../../../domain/outcome';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';
import {
  treasureManualOfGolems,
  TreasureManualOfGolems,
  treasureMedallionRange,
  TreasureMedallionRange,
  treasureNecklaceOfMissiles,
  type TreasureNecklaceOfMissiles,
  treasureNecklacePrayerBeads,
  TreasureNecklacePrayerBead,
  treasurePearlOfPowerEffect,
  TreasurePearlOfPowerEffect,
  treasurePearlOfPowerRecall,
  TreasurePearlOfPowerRecall,
  type TreasurePearlOfPowerRecallResult,
  treasurePearlOfWisdom,
  TreasurePearlOfWisdomOutcome,
  treasurePeriaptPoisonBonus,
  type TreasurePeriaptPoisonBonus,
  treasurePhylacteryLongYears,
  TreasurePhylacteryLongYearsOutcome,
  treasureQuaalFeatherToken,
  TreasureQuaalFeatherToken,
} from './miscMagicE4Subtables';

function emphasizedSentence(text: string) {
  return emphasizeInlineText(text, extractLeadingItemPhrase(text));
}

const MANUAL_LABELS: Record<TreasureManualOfGolems, string> = {
  [TreasureManualOfGolems.Clay]: 'Clay',
  [TreasureManualOfGolems.Flesh]: 'Flesh',
  [TreasureManualOfGolems.Iron]: 'Iron',
  [TreasureManualOfGolems.Stone]: 'Stone',
};

export function renderTreasureManualOfGolemsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureManualOfGolems') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Manual of Golems',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${MANUAL_LABELS[outcome.event.result]}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(manualOfGolemsSentence(outcome.event.result)),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureManualOfGolemsCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureManualOfGolems') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Manual of Golems',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(manualOfGolemsSentence(outcome.event.result)),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureManualOfGolemsPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Manual of Golems',
    sides: treasureManualOfGolems.sides,
    entries: treasureManualOfGolems.entries.map(({ range, command }) => ({
      range,
      label: MANUAL_LABELS[command],
    })),
  });

export function manualOfGolemsSentence(result: TreasureManualOfGolems): string {
  return `There is a Manual of ${MANUAL_LABELS[result]} Golems.`;
}

const RANGE_LABELS: Record<TreasureMedallionRange, string> = {
  [TreasureMedallionRange.ThirtyFeet]: "30' range",
  [TreasureMedallionRange.ThirtyFeetWithEmpathy]: "30' range with empathy",
  [TreasureMedallionRange.SixtyFeet]: "60' range",
  [TreasureMedallionRange.NinetyFeet]: "90' range",
};

const PARENTHETICALS: Record<TreasureMedallionRange, string> = {
  [TreasureMedallionRange.ThirtyFeet]: "30'",
  [TreasureMedallionRange.ThirtyFeetWithEmpathy]: "30', empathy",
  [TreasureMedallionRange.SixtyFeet]: "60'",
  [TreasureMedallionRange.NinetyFeet]: "90'",
};

export function renderTreasureMedallionRangeDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMedallionRange') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Medallion Details',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${RANGE_LABELS[outcome.event.result]}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(medallionRangeSentence(outcome.event.result)),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureMedallionRangeCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMedallionRange') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Medallion Details',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(medallionRangeSentence(outcome.event.result)),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureMedallionRangePreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Medallion Details',
    sides: treasureMedallionRange.sides,
    entries: treasureMedallionRange.entries.map(({ range, command }) => ({
      range,
      label: RANGE_LABELS[command],
    })),
  });

export function medallionRangeParenthetical(
  result: TreasureMedallionRange
): string {
  return PARENTHETICALS[result];
}

function medallionRangeSentence(result: TreasureMedallionRange): string {
  return `The medallion has ${RANGE_LABELS[result]}.`;
}

function necklaceParenthetical(result: TreasureNecklaceOfMissiles): string {
  return result.missiles
    .map(({ count, dice }) => `${count}x${dice}`)
    .join(', ');
}

function necklaceTotalMissiles(result: TreasureNecklaceOfMissiles): number {
  return result.missiles.reduce((sum, { count }) => sum + count, 0);
}

function necklaceDetailSentence(result: TreasureNecklaceOfMissiles): string {
  const total = necklaceTotalMissiles(result);
  const missiles = necklaceParenthetical(result);
  return `The necklace holds ${total} missiles (${missiles}).`;
}

export function necklaceOfMissilesParenthetical(
  result: TreasureNecklaceOfMissiles
): string {
  return necklaceParenthetical(result);
}

export function renderTreasureNecklaceOfMissilesDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureNecklaceOfMissiles') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Necklace of Missiles',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${necklaceTotalMissiles(
        outcome.event.result
      )} missiles`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(necklaceDetailSentence(outcome.event.result)),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureNecklaceOfMissilesCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureNecklaceOfMissiles') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Necklace of Missiles',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(necklaceDetailSentence(outcome.event.result)),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureNecklaceOfMissilesPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Necklace of Missiles',
    sides: treasureNecklaceOfMissiles.sides,
    entries: treasureNecklaceOfMissiles.entries.map(({ range, command }) => ({
      range,
      label: necklaceDetailSentence(command),
    })),
  });

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

function describePearlEffect(
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
    text: `The pearl ${describePearlEffect(
      outcome.event.result,
      recallResult
    )}.`,
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
    ...emphasizedSentence(recallSentence(outcome.event.result)),
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
    ...emphasizedSentence(recallSentence(outcome.event.result)),
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

export function pearlOfWisdomParenthetical(
  outcome: TreasurePearlOfWisdomOutcome
): string {
  return outcome === TreasurePearlOfWisdomOutcome.GainOne ? '+1' : '-1';
}

function wisdomSentence(outcome: TreasurePearlOfWisdomOutcome): string {
  return outcome === TreasurePearlOfWisdomOutcome.GainOne
    ? 'Wisdom increases by 1 point.'
    : 'Wisdom decreases by 1 point.';
}

export function renderTreasurePearlOfWisdomDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePearlOfWisdom') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Pearl of Wisdom Outcome',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(wisdomSentence(outcome.event.result)),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasurePearlOfWisdomCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePearlOfWisdom') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Pearl of Wisdom',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(wisdomSentence(outcome.event.result)),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasurePearlOfWisdomPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Pearl of Wisdom Outcome',
    sides: treasurePearlOfWisdom.sides,
    entries: treasurePearlOfWisdom.entries.map(({ range, command }) => ({
      range,
      label:
        command === TreasurePearlOfWisdomOutcome.GainOne
          ? 'Gain 1 Wisdom'
          : 'Lose 1 Wisdom',
    })),
  });

export function periaptPoisonParenthetical(
  bonus: TreasurePeriaptPoisonBonus
): string {
  return `+${bonus}`;
}

function describePeriapt(bonus: TreasurePeriaptPoisonBonus): string {
  return `It grants a +${bonus} bonus on saves vs. poison.`;
}

export function renderTreasurePeriaptProofAgainstPoisonDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePeriaptProofAgainstPoison') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Periapt of Proof Against Poison',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: describePeriapt(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasurePeriaptProofAgainstPoisonCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePeriaptProofAgainstPoison') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Periapt of Proof Against Poison',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: describePeriapt(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasurePeriaptProofAgainstPoisonPreview: TablePreviewFactory =
  (tableId) =>
    buildPreview(tableId, {
      title: 'Periapt of Proof Against Poison',
      sides: treasurePeriaptPoisonBonus.sides,
      entries: treasurePeriaptPoisonBonus.entries.map(({ range, command }) => ({
        range,
        label: `+${command}`,
      })),
    });

export function phylacteryLongYearsParenthetical(
  outcome: TreasurePhylacteryLongYearsOutcome
): string {
  return outcome === TreasurePhylacteryLongYearsOutcome.SlowAging
    ? 'slow aging'
    : 'fast aging';
}

function phylacterySentence(
  outcome: TreasurePhylacteryLongYearsOutcome
): string {
  if (outcome === TreasurePhylacteryLongYearsOutcome.SlowAging) {
    return 'The wearer ages at three-quarters the normal rate (one quarter slower).';
  }
  return 'The wearer ages at five-quarters the normal rate (one quarter faster).';
}

export function renderTreasurePhylacteryLongYearsDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePhylacteryLongYears') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Phylactery of Long Years',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(phylacterySentence(outcome.event.result)),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasurePhylacteryLongYearsCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasurePhylacteryLongYears') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Phylactery of Long Years',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    ...emphasizedSentence(phylacterySentence(outcome.event.result)),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasurePhylacteryLongYearsPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: 'Phylactery of Long Years',
    sides: treasurePhylacteryLongYears.sides,
    entries: treasurePhylacteryLongYears.entries.map(({ range, command }) => ({
      range,
      label:
        command === TreasurePhylacteryLongYearsOutcome.SlowAging
          ? 'Slow aging'
          : 'Fast aging',
    })),
  });

function quaalTokenLabel(token: TreasureQuaalFeatherToken): string {
  switch (token) {
    case TreasureQuaalFeatherToken.Anchor:
      return 'Anchor';
    case TreasureQuaalFeatherToken.Bird:
      return 'Bird';
    case TreasureQuaalFeatherToken.Fan:
      return 'Fan';
    case TreasureQuaalFeatherToken.SwanBoat:
      return 'Swan Boat';
    case TreasureQuaalFeatherToken.Tree:
      return 'Tree';
    case TreasureQuaalFeatherToken.Whip:
      return 'Whip';
  }
}

export function quaalFeatherTokenParenthetical(
  token: TreasureQuaalFeatherToken
): string {
  return quaalTokenLabel(token);
}

function quaalTokenDescription(token: TreasureQuaalFeatherToken): string {
  return `The token produces a ${quaalTokenLabel(
    token
  )} effect when activated.`;
}

export function renderTreasureQuaalFeatherTokenDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureQuaalFeatherToken') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: "Quaal's Feather Token",
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: quaalTokenDescription(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureQuaalFeatherTokenCompact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureQuaalFeatherToken') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: "Quaal's Feather Token",
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: quaalTokenDescription(outcome.event.result),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureQuaalFeatherTokenPreview: TablePreviewFactory = (
  tableId
) =>
  buildPreview(tableId, {
    title: "Quaal's Feather Token",
    sides: treasureQuaalFeatherToken.sides,
    entries: treasureQuaalFeatherToken.entries.map(({ range, command }) => ({
      range,
      label: quaalTokenLabel(command),
    })),
  });
