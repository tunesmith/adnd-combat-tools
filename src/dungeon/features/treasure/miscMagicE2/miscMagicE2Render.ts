import type { DungeonRenderNode } from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import { treasureMiscMagicE2, TreasureMiscMagicE2 } from './miscMagicE2Table';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';
import {
  cloakSentence,
  crystalBallSentence,
  deckSentence,
  eyesSentence,
} from './miscMagicE2SubtablesRender';
import {
  renderTreasureParentCompact,
  renderTreasureParentDetail,
} from '../sharedRender';

const ITEM_LABELS: Record<TreasureMiscMagicE2, string> = {
  [TreasureMiscMagicE2.CandleOfInvocation]: 'Candle of Invocation (C)',
  [TreasureMiscMagicE2.CarpetOfFlying]: 'Carpet of Flying',
  [TreasureMiscMagicE2.CenserControllingAirElementals]:
    'Censer Controlling Air Elementals (M)',
  [TreasureMiscMagicE2.CenserOfSummoningHostileAirElementals]:
    'Censer of Summoning Hostile Air Elementals (M)',
  [TreasureMiscMagicE2.ChimeOfOpening]: 'Chime of Opening',
  [TreasureMiscMagicE2.ChimeOfHunger]: 'Chime of Hunger',
  [TreasureMiscMagicE2.CloakOfDisplacement]: 'Cloak of Displacement',
  [TreasureMiscMagicE2.CloakOfElvenkind]: 'Cloak of Elvenkind',
  [TreasureMiscMagicE2.CloakOfMantaRay]: 'Cloak of Manta Ray',
  [TreasureMiscMagicE2.CloakOfPoisonousness]: 'Cloak of Poisonousness',
  [TreasureMiscMagicE2.CloakOfProtection]: 'Cloak of Protection',
  [TreasureMiscMagicE2.CrystalBall]: 'Crystal Ball (M)',
  [TreasureMiscMagicE2.CrystalHypnosisBall]: 'Crystal Hypnosis Ball (M)',
  [TreasureMiscMagicE2.CubeOfForce]: 'Cube of Force',
  [TreasureMiscMagicE2.CubeOfFrostResistance]: 'Cube of Frost Resistance',
  [TreasureMiscMagicE2.CubicGate]: 'Cubic Gate',
  [TreasureMiscMagicE2.DaernsInstantFortress]: "Daern's Instant Fortress",
  [TreasureMiscMagicE2.DecanterOfEndlessWater]: 'Decanter of Endless Water',
  [TreasureMiscMagicE2.DeckOfManyThings]: 'Deck of Many Things',
  [TreasureMiscMagicE2.DrumsOfDeafening]: 'Drums of Deafening',
  [TreasureMiscMagicE2.DrumsOfPanic]: 'Drums of Panic',
  [TreasureMiscMagicE2.DustOfAppearance]: 'Dust of Appearance',
  [TreasureMiscMagicE2.DustOfDisappearance]: 'Dust of Disappearance',
  [TreasureMiscMagicE2.DustOfSneezingAndChoking]:
    'Dust of Sneezing and Choking',
  [TreasureMiscMagicE2.EfreetiBottle]: 'Efreeti Bottle',
  [TreasureMiscMagicE2.EversmokingBottle]: 'Eversmoking Bottle',
  [TreasureMiscMagicE2.EyesOfCharming]: 'Eyes of Charming (M)',
  [TreasureMiscMagicE2.EyesOfTheEagle]: 'Eyes of the Eagle',
  [TreasureMiscMagicE2.EyesOfMinuteSeeing]: 'Eyes of Minute Seeing',
  [TreasureMiscMagicE2.EyesOfPetrification]: 'Eyes of Petrification',
};

export function renderTreasureMiscMagicE2Detail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMiscMagicE2') return [];
  const carpetChild = findChildEvent(outcome, 'treasureCarpetOfFlying');
  const cloakChild = findChildEvent(outcome, 'treasureCloakOfProtection');
  const crystalChild = findChildEvent(outcome, 'treasureCrystalBall');
  const deckChild = findChildEvent(outcome, 'treasureDeckOfManyThings');
  const eyesChild = findChildEvent(outcome, 'treasureEyesOfPetrification');
  return renderTreasureParentDetail({
    outcome,
    appendPendingPreviews,
    detailHeading: 'Miscellaneous Magic (Table E.2)',
    compactHeading: 'Miscellaneous Magic',
    resultLabel: ITEM_LABELS[outcome.event.result],
    text: resolvedSentence(
      outcome.event.result,
      carpetChild,
      cloakChild,
      crystalChild,
      deckChild,
      eyesChild
    ),
  });
}

export function renderTreasureMiscMagicE2Compact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMiscMagicE2') return [];
  const carpetChild = findChildEvent(outcome, 'treasureCarpetOfFlying');
  const cloakChild = findChildEvent(outcome, 'treasureCloakOfProtection');
  const crystalChild = findChildEvent(outcome, 'treasureCrystalBall');
  const deckChild = findChildEvent(outcome, 'treasureDeckOfManyThings');
  const eyesChild = findChildEvent(outcome, 'treasureEyesOfPetrification');
  return renderTreasureParentCompact({
    outcome,
    appendPendingPreviews,
    detailHeading: 'Miscellaneous Magic (Table E.2)',
    compactHeading: 'Miscellaneous Magic',
    resultLabel: '',
    text: resolvedSentence(
      outcome.event.result,
      carpetChild,
      cloakChild,
      crystalChild,
      deckChild,
      eyesChild
    ),
  });
}

export const buildTreasureMiscMagicE2Preview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Miscellaneous Magic (Table E.2)',
    sides: treasureMiscMagicE2.sides,
    entries: treasureMiscMagicE2.entries.map(({ range, command }) => ({
      range,
      label: ITEM_LABELS[command],
    })),
    context,
  });

export function miscMagicE2Sentence(result: TreasureMiscMagicE2): string {
  const label = ITEM_LABELS[result];
  return `There is ${articleFor(label)} ${stripUsageTag(label)}.`;
}

function articleFor(label: string): 'a' | 'an' {
  const first = label.trim().charAt(0).toLowerCase();
  return 'aeiou'.includes(first) ? 'an' : 'a';
}

function stripUsageTag(label: string): string {
  return label.replace(/\s+\(([A-Z],?\s?)+\)/, '').trim();
}

function resolvedSentence(
  result: TreasureMiscMagicE2,
  carpetChild?: OutcomeEventNode,
  cloakChild?: OutcomeEventNode,
  crystalChild?: OutcomeEventNode,
  deckChild?: OutcomeEventNode,
  eyesChild?: OutcomeEventNode
): string {
  if (
    result === TreasureMiscMagicE2.CarpetOfFlying &&
    carpetChild &&
    carpetChild.event.kind === 'treasureCarpetOfFlying'
  ) {
    return `There is a carpet of flying (${carpetChild.event.result}).`;
  }
  if (
    result === TreasureMiscMagicE2.CloakOfProtection &&
    cloakChild &&
    cloakChild.event.kind === 'treasureCloakOfProtection'
  ) {
    return cloakSentence(cloakChild.event.result);
  }
  if (
    result === TreasureMiscMagicE2.CrystalBall &&
    crystalChild &&
    crystalChild.event.kind === 'treasureCrystalBall'
  ) {
    return crystalBallSentence(crystalChild.event.result);
  }
  if (
    result === TreasureMiscMagicE2.DeckOfManyThings &&
    deckChild &&
    deckChild.event.kind === 'treasureDeckOfManyThings'
  ) {
    return deckSentence(deckChild.event.result);
  }
  if (
    result === TreasureMiscMagicE2.EyesOfPetrification &&
    eyesChild &&
    eyesChild.event.kind === 'treasureEyesOfPetrification'
  ) {
    return eyesSentence(eyesChild.event.result);
  }
  return miscMagicE2Sentence(result);
}
