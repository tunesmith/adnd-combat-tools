import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureMiscMagicE2,
  TreasureMiscMagicE2,
} from '../../../tables/dungeon/treasureMiscMagicE2';
import { buildPreview, findChildEvent } from './shared';
import type { AppendPreviewFn, TablePreviewFactory } from './shared';
import { cloakSentence } from './treasureCloakOfProtection';

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
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Miscellaneous Magic (Table E.2)',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${ITEM_LABELS[outcome.event.result]}`],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: resolvedSentence(outcome.event.result, carpetChild, cloakChild),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureMiscMagicE2Compact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMiscMagicE2') return [];
  const carpetChild = findChildEvent(outcome, 'treasureCarpetOfFlying');
  const cloakChild = findChildEvent(outcome, 'treasureCloakOfProtection');
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Miscellaneous Magic',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: resolvedSentence(outcome.event.result, carpetChild, cloakChild),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureMiscMagicE2Preview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Miscellaneous Magic (Table E.2)',
    sides: treasureMiscMagicE2.sides,
    entries: treasureMiscMagicE2.entries.map(({ range, command }) => ({
      range,
      label: ITEM_LABELS[command],
    })),
  });

export function miscMagicE2Sentence(result: TreasureMiscMagicE2): string {
  const label = ITEM_LABELS[result];
  return `There is ${articleFor(label)} ${label.replace(/ \(M\)| \(C\)/, '')}.`;
}

function articleFor(label: string): 'a' | 'an' {
  const first = label.trim().charAt(0).toLowerCase();
  return 'aeiou'.includes(first) ? 'an' : 'a';
}

function resolvedSentence(
  result: TreasureMiscMagicE2,
  carpetChild?: OutcomeEventNode,
  cloakChild?: OutcomeEventNode
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
  return miscMagicE2Sentence(result);
}
