import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureMiscMagicE4,
  TreasureMiscMagicE4,
} from '../../../tables/dungeon/treasureMiscMagicE4';
import { buildPreview, findChildEvent } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';
import { manualOfGolemsSentence } from './treasureManualOfGolems';
import { medallionRangeParenthetical } from './treasureMedallionRange';
import { necklaceOfMissilesParenthetical } from './treasureNecklaceOfMissiles';
import { pearlParenthetical } from './treasurePearlOfPower';
import { pearlOfWisdomParenthetical } from './treasurePearlOfWisdom';
import { periaptPoisonParenthetical } from './treasurePeriaptProofAgainstPoison';
import { phylacteryLongYearsParenthetical } from './treasurePhylacteryLongYears';
import { quaalFeatherTokenParenthetical } from './treasureQuaalFeatherToken';

const ITEM_LABELS: Record<TreasureMiscMagicE4, string> = {
  [TreasureMiscMagicE4.LibramOfGainfulConjuration]:
    'Libram of Gainful Conjuration (M)',
  [TreasureMiscMagicE4.LibramOfIneffableDamnation]:
    'Libram of Ineffable Damnation (M)',
  [TreasureMiscMagicE4.LibramOfSilverMagic]:
    'Libram of Silver Magic (M)',
  [TreasureMiscMagicE4.LyreOfBuilding]: 'Lyre of Building',
  [TreasureMiscMagicE4.ManualOfBodilyHealth]: 'Manual of Bodily Health',
  [TreasureMiscMagicE4.ManualOfGainfulExercise]:
    'Manual of Gainful Exercise',
  [TreasureMiscMagicE4.ManualOfGolems]: 'Manual of Golems (C, M)',
  [TreasureMiscMagicE4.ManualOfPuissantSkillAtArms]:
    'Manual of Puissant Skill at Arms (F)',
  [TreasureMiscMagicE4.ManualOfQuicknessOfAction]:
    'Manual of Quickness of Action',
  [TreasureMiscMagicE4.ManualOfStealthyPilfering]:
    'Manual of Stealthy Pilfering (T)',
  [TreasureMiscMagicE4.MattockOfTheTitans]: 'Mattock of the Titans (F)',
  [TreasureMiscMagicE4.MaulOfTheTitans]: 'Maul of the Titans (F)',
  [TreasureMiscMagicE4.MedallionOfESP]: 'Medallion of ESP',
  [TreasureMiscMagicE4.MedallionOfThoughtProjection]:
    'Medallion of Thought Projection',
  [TreasureMiscMagicE4.MirrorOfLifeTrapping]: 'Mirror of Life Trapping (M)',
  [TreasureMiscMagicE4.MirrorOfMentalProwess]: 'Mirror of Mental Prowess',
  [TreasureMiscMagicE4.MirrorOfOpposition]: 'Mirror of Opposition',
  [TreasureMiscMagicE4.NecklaceOfAdaptation]: 'Necklace of Adaptation',
  [TreasureMiscMagicE4.NecklaceOfMissiles]: 'Necklace of Missiles',
  [TreasureMiscMagicE4.NecklaceOfPrayerBeads]:
    'Necklace of Prayer Beads (C)',
  [TreasureMiscMagicE4.NecklaceOfStrangulation]:
    'Necklace of Strangulation',
  [TreasureMiscMagicE4.NetOfEntrapment]: 'Net of Entrapment (C, F, T)',
  [TreasureMiscMagicE4.NetOfSnaring]: 'Net of Snaring (C, F, T)',
  [TreasureMiscMagicE4.NolzursMarvelousPigments]:
    "Nolzur's Marvelous Pigments",
  [TreasureMiscMagicE4.PearlOfPower]: 'Pearl of Power (M)',
  [TreasureMiscMagicE4.PearlOfWisdom]: 'Pearl of Wisdom (C)',
  [TreasureMiscMagicE4.PeriaptOfFoulRotting]: 'Periapt of Foul Rotting',
  [TreasureMiscMagicE4.PeriaptOfHealth]: 'Periapt of Health',
  [TreasureMiscMagicE4.PeriaptOfProofAgainstPoison]:
    'Periapt of Proof Against Poison',
  [TreasureMiscMagicE4.PeriaptOfWoundClosure]: 'Periapt of Wound Closure',
  [TreasureMiscMagicE4.PhylacteryOfFaithfulness]:
    'Phylactery of Faithfulness (C)',
  [TreasureMiscMagicE4.PhylacteryOfLongYears]:
    'Phylactery of Long Years (C)',
  [TreasureMiscMagicE4.PhylacteryOfMonstrousAttention]:
    'Phylactery of Monstrous Attention (C)',
  [TreasureMiscMagicE4.PipesOfTheSewers]: 'Pipes of the Sewers',
  [TreasureMiscMagicE4.PortableHole]: 'Portable Hole',
  [TreasureMiscMagicE4.QuaalsFeatherToken]: "Quaal's Feather Token",
};

export function renderTreasureMiscMagicE4Detail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMiscMagicE4') return [];
  const manualChild = findChildEvent(outcome, 'treasureManualOfGolems');
  const medallionChild = findChildEvent(outcome, 'treasureMedallionRange');
  const necklaceChild = findChildEvent(outcome, 'treasureNecklaceOfMissiles');
  const pearlEffectChild = findChildEvent(outcome, 'treasurePearlOfPowerEffect');
  const pearlWisdomChild = findChildEvent(outcome, 'treasurePearlOfWisdom');
  const periaptPoisonChild = findChildEvent(
    outcome,
    'treasurePeriaptProofAgainstPoison'
  );
  const phylacteryLongYearsChild = findChildEvent(
    outcome,
    'treasurePhylacteryLongYears'
  );
  const quaalTokenChild = findChildEvent(
    outcome,
    'treasureQuaalFeatherToken'
  );
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Miscellaneous Magic (Table E.4)',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${ITEM_LABELS[outcome.event.result]}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: resolvedSentence(
      outcome.event.result,
      manualChild,
      medallionChild,
      necklaceChild,
      pearlEffectChild,
      pearlWisdomChild,
      periaptPoisonChild,
      phylacteryLongYearsChild,
      quaalTokenChild
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureMiscMagicE4Compact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMiscMagicE4') return [];
  const manualChild = findChildEvent(outcome, 'treasureManualOfGolems');
  const medallionChild = findChildEvent(outcome, 'treasureMedallionRange');
  const necklaceChild = findChildEvent(outcome, 'treasureNecklaceOfMissiles');
  const pearlEffectChild = findChildEvent(outcome, 'treasurePearlOfPowerEffect');
  const pearlWisdomChild = findChildEvent(outcome, 'treasurePearlOfWisdom');
  const periaptPoisonChild = findChildEvent(
    outcome,
    'treasurePeriaptProofAgainstPoison'
  );
  const phylacteryLongYearsChild = findChildEvent(
    outcome,
    'treasurePhylacteryLongYears'
  );
  const quaalTokenChild = findChildEvent(
    outcome,
    'treasureQuaalFeatherToken'
  );
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Miscellaneous Magic',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: resolvedSentence(
      outcome.event.result,
      manualChild,
      medallionChild,
      necklaceChild,
      pearlEffectChild,
      pearlWisdomChild,
      periaptPoisonChild,
      phylacteryLongYearsChild,
      quaalTokenChild
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureMiscMagicE4Preview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Miscellaneous Magic (Table E.4)',
    sides: treasureMiscMagicE4.sides,
    entries: treasureMiscMagicE4.entries.map(({ range, command }) => ({
      range,
      label: ITEM_LABELS[command],
    })),
  });

export function miscMagicE4Sentence(result: TreasureMiscMagicE4): string {
  const label = ITEM_LABELS[result];
  return `There is ${articleFor(label)} ${stripUsageTag(label)}.`;
}

function resolvedSentence(
  result: TreasureMiscMagicE4,
  manualChild?: OutcomeEventNode,
  medallionChild?: OutcomeEventNode,
  necklaceChild?: OutcomeEventNode,
  pearlEffectChild?: OutcomeEventNode,
  pearlWisdomChild?: OutcomeEventNode,
  periaptPoisonChild?: OutcomeEventNode,
  phylacteryLongYearsChild?: OutcomeEventNode,
  quaalTokenChild?: OutcomeEventNode
): string {
  if (
    result === TreasureMiscMagicE4.ManualOfGolems &&
    manualChild &&
    manualChild.event.kind === 'treasureManualOfGolems'
  ) {
    return manualOfGolemsSentence(manualChild.event.result);
  }
  if (
    (result === TreasureMiscMagicE4.MedallionOfESP ||
      result === TreasureMiscMagicE4.MedallionOfThoughtProjection) &&
    medallionChild &&
    medallionChild.event.kind === 'treasureMedallionRange'
  ) {
    const base = miscMagicE4Sentence(result);
    const suffix = medallionRangeParenthetical(medallionChild.event.result);
    return `${base.slice(0, -1)} (${suffix}).`;
  }
  if (
    result === TreasureMiscMagicE4.NecklaceOfMissiles &&
    necklaceChild &&
    necklaceChild.event.kind === 'treasureNecklaceOfMissiles'
  ) {
    const base = miscMagicE4Sentence(result);
    const suffix = necklaceOfMissilesParenthetical(necklaceChild.event.result);
    return `${base.slice(0, -1)} (${suffix}).`;
  }
  if (
    result === TreasureMiscMagicE4.PearlOfPower &&
    pearlEffectChild &&
    pearlEffectChild.event.kind === 'treasurePearlOfPowerEffect'
  ) {
    const effect = pearlEffectChild.event.result;
    const recallChild = findChildEvent(
      pearlEffectChild,
      'treasurePearlOfPowerRecall'
    );
    const recallResult =
      recallChild && recallChild.event.kind === 'treasurePearlOfPowerRecall'
        ? recallChild.event.result
        : undefined;
    const base = miscMagicE4Sentence(result);
    const suffix = pearlParenthetical(effect, recallResult);
    return `${base.slice(0, -1)} (${suffix}).`;
  }
  if (
    result === TreasureMiscMagicE4.PearlOfWisdom &&
    pearlWisdomChild &&
    pearlWisdomChild.event.kind === 'treasurePearlOfWisdom'
  ) {
    const base = miscMagicE4Sentence(result);
    const suffix = pearlOfWisdomParenthetical(pearlWisdomChild.event.result);
    return `${base.slice(0, -1)} (${suffix}).`;
  }
  if (
    result === TreasureMiscMagicE4.PeriaptOfProofAgainstPoison &&
    periaptPoisonChild &&
    periaptPoisonChild.event.kind === 'treasurePeriaptProofAgainstPoison'
  ) {
    const base = miscMagicE4Sentence(result);
    const suffix = periaptPoisonParenthetical(periaptPoisonChild.event.result);
    return `${base.slice(0, -1)} (${suffix}).`;
  }
  if (
    result === TreasureMiscMagicE4.PhylacteryOfLongYears &&
    phylacteryLongYearsChild &&
    phylacteryLongYearsChild.event.kind === 'treasurePhylacteryLongYears'
  ) {
    const base = miscMagicE4Sentence(result);
    const suffix = phylacteryLongYearsParenthetical(
      phylacteryLongYearsChild.event.result
    );
    return `${base.slice(0, -1)} (${suffix}).`;
  }
  if (
    result === TreasureMiscMagicE4.QuaalsFeatherToken &&
    quaalTokenChild &&
    quaalTokenChild.event.kind === 'treasureQuaalFeatherToken'
  ) {
    const base = miscMagicE4Sentence(result);
    const suffix = quaalFeatherTokenParenthetical(quaalTokenChild.event.result);
    return `${base.slice(0, -1)} (${suffix}).`;
  }
  return miscMagicE4Sentence(result);
}

function articleFor(label: string): 'a' | 'an' {
  const first = label.trim().charAt(0).toLowerCase();
  return 'aeiou'.includes(first) ? 'an' : 'a';
}

function stripUsageTag(label: string): string {
  return label.replace(/\s+\(([A-Z],?\s?)+\)/, '').trim();
}
