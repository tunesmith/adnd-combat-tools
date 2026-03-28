import type { DungeonRenderNode } from '../../../../types/dungeon';
import type {
  OutcomeEventNode,
  TreasureBeakerOfPlentifulPotionsDetails,
} from '../../../domain/outcome';
import { treasureMiscMagicE1, TreasureMiscMagicE1 } from './miscMagicE1Table';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';
import type {
  TreasureArtifactOrRelic,
  TreasureBagOfTricks,
  TreasureBracersOfDefense,
  TreasureBucknardsEverfullPurse,
} from './miscMagicE1Subtables';
import {
  renderTreasureParentCompact,
  renderTreasureParentDetail,
} from '../sharedRender';
import {
  artifactSentence,
  bagOfTricksSentence,
  bracersSentence,
  labelForArtifact,
  labelForBagOfTricks,
  labelForBracersOfDefense as bracersLabel,
  labelForBucknardsEverfullPurse as purseLabel,
  purseSentence,
} from './miscMagicE1SubtablesRender';
import { labelForResolvedPotion } from '../potion/potionRender';

const ITEM_NAMES: Record<TreasureMiscMagicE1, string> = {
  [TreasureMiscMagicE1.AlchemyJug]: 'alchemy jug',
  [TreasureMiscMagicE1.AmuletOfInescapableLocation]:
    'amulet of inescapable location',
  [TreasureMiscMagicE1.AmuletOfLifeProtection]: 'amulet of life protection',
  [TreasureMiscMagicE1.AmuletOfThePlanes]: 'amulet of the planes',
  [TreasureMiscMagicE1.AmuletOfProofAgainstDetectionAndLocation]:
    'amulet of proof against detection and location',
  [TreasureMiscMagicE1.ApparatusOfKwalish]: 'apparatus of kwalish',
  [TreasureMiscMagicE1.ArrowOfDirection]: 'arrow of direction',
  [TreasureMiscMagicE1.ArtifactOrRelic]: 'artifact or relic',
  [TreasureMiscMagicE1.BagOfBeans]: 'bag of beans',
  [TreasureMiscMagicE1.BagOfDevouring]: 'bag of devouring',
  [TreasureMiscMagicE1.BagOfHolding]: 'bag of holding',
  [TreasureMiscMagicE1.BagOfTransmuting]: 'bag of transmuting',
  [TreasureMiscMagicE1.BagOfTricks]: 'bag of tricks',
  [TreasureMiscMagicE1.BeakerOfPlentifulPotions]: 'beaker of plentiful potions',
  [TreasureMiscMagicE1.FoldingBoat]: 'folding boat',
  [TreasureMiscMagicE1.BookOfExaltedDeeds]: 'book of exalted deeds',
  [TreasureMiscMagicE1.BookOfInfiniteSpells]: 'book of infinite spells',
  [TreasureMiscMagicE1.BookOfVileDarkness]: 'book of vile darkness',
  [TreasureMiscMagicE1.BootsOfDancing]: 'pair of boots of dancing',
  [TreasureMiscMagicE1.BootsOfElvenkind]: 'pair of boots of elvenkind',
  [TreasureMiscMagicE1.BootsOfLevitation]: 'pair of boots of levitation',
  [TreasureMiscMagicE1.BootsOfSpeed]: 'pair of boots of speed',
  [TreasureMiscMagicE1.BootsOfStridingAndSpringing]:
    'pair of boots of striding and springing',
  [TreasureMiscMagicE1.BowlCommandingWaterElementals]:
    'bowl commanding water elementals',
  [TreasureMiscMagicE1.BowlOfWateryDeath]: 'bowl of watery death',
  [TreasureMiscMagicE1.BracersOfDefense]: 'pair of bracers of defense',
  [TreasureMiscMagicE1.BracersOfDefenselessness]:
    'pair of bracers of defenselessness',
  [TreasureMiscMagicE1.BrazierCommandingFireElementals]:
    'brazier commanding fire elementals',
  [TreasureMiscMagicE1.BrazierOfSleepSmoke]: 'brazier of sleep smoke',
  [TreasureMiscMagicE1.BroochOfShielding]: 'brooch of shielding',
  [TreasureMiscMagicE1.BroomOfAnimatedAttack]: 'broom of animated attack',
  [TreasureMiscMagicE1.BroomOfFlying]: 'broom of flying',
  [TreasureMiscMagicE1.BucknardsEverfullPurse]: "Bucknard's everfull purse",
};

export function renderTreasureMiscMagicE1Detail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMiscMagicE1') return [];
  const bagOfTricksChild = findChildEvent(outcome, 'treasureBagOfTricks');
  const bracersChild = findChildEvent(outcome, 'treasureBracersOfDefense');
  const purseChild = findChildEvent(outcome, 'treasureBucknardsEverfullPurse');
  const artifactChild = findChildEvent(outcome, 'treasureArtifactOrRelic');
  return renderTreasureParentDetail({
    outcome,
    appendPendingPreviews,
    detailHeading: 'Miscellaneous Magic (Table E.1)',
    compactHeading: 'Miscellaneous Magic',
    resultLabel: formatItemName(
      outcome.event.result,
      bagOfTricksChild && bagOfTricksChild.event.kind === 'treasureBagOfTricks'
        ? bagOfTricksChild.event.result
        : undefined,
      bracersChild && bracersChild.event.kind === 'treasureBracersOfDefense'
        ? bracersChild.event.result
        : undefined,
      purseChild && purseChild.event.kind === 'treasureBucknardsEverfullPurse'
        ? purseChild.event.result
        : undefined,
      artifactChild && artifactChild.event.kind === 'treasureArtifactOrRelic'
        ? artifactChild.event.result
        : undefined
    ),
    text: resolvedSentence(
      outcome.event.result,
      outcome.event.beaker,
      bagOfTricksChild,
      bracersChild,
      purseChild,
      artifactChild
    ),
  });
}

export function renderTreasureMiscMagicE1Compact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMiscMagicE1') return [];
  const bagOfTricksChild = findChildEvent(outcome, 'treasureBagOfTricks');
  const bracersChild = findChildEvent(outcome, 'treasureBracersOfDefense');
  const purseChild = findChildEvent(outcome, 'treasureBucknardsEverfullPurse');
  const artifactChild = findChildEvent(outcome, 'treasureArtifactOrRelic');
  return renderTreasureParentCompact({
    outcome,
    appendPendingPreviews,
    detailHeading: 'Miscellaneous Magic (Table E.1)',
    compactHeading: 'Miscellaneous Magic',
    resultLabel: '',
    text: resolvedSentence(
      outcome.event.result,
      outcome.event.beaker,
      bagOfTricksChild,
      bracersChild,
      purseChild,
      artifactChild
    ),
  });
}

export const buildTreasureMiscMagicE1Preview: TablePreviewFactory = (
  tableId,
  context
) =>
  buildPreview(tableId, {
    title: 'Miscellaneous Magic (Table E.1)',
    sides: treasureMiscMagicE1.sides,
    entries: treasureMiscMagicE1.entries.map(({ range, command }) => ({
      range,
      label: formatItemName(command),
    })),
    context,
  });

function formatItemName(
  command: TreasureMiscMagicE1,
  bagOfTricks?: TreasureBagOfTricks,
  bracers?: TreasureBracersOfDefense,
  purse?: TreasureBucknardsEverfullPurse,
  artifact?: TreasureArtifactOrRelic
): string {
  if (command === TreasureMiscMagicE1.BagOfTricks && bagOfTricks) {
    return `Bag of Tricks ("${labelForBagOfTricks(bagOfTricks)}")`;
  }
  if (command === TreasureMiscMagicE1.BracersOfDefense && bracers) {
    return bracersLabel(bracers);
  }
  if (command === TreasureMiscMagicE1.BucknardsEverfullPurse && purse) {
    return purseLabel(purse);
  }
  if (command === TreasureMiscMagicE1.ArtifactOrRelic && artifact) {
    return labelForArtifact(artifact);
  }
  switch (command) {
    case TreasureMiscMagicE1.ArtifactOrRelic:
      return 'Artifact or Relic';
    case TreasureMiscMagicE1.BootsOfStridingAndSpringing:
      return 'Boots of Striding and Springing';
    case TreasureMiscMagicE1.BowlCommandingWaterElementals:
      return 'Bowl Commanding Water Elementals';
    case TreasureMiscMagicE1.BowlOfWateryDeath:
      return 'Bowl of Watery Death';
    case TreasureMiscMagicE1.BrazierCommandingFireElementals:
      return 'Brazier Commanding Fire Elementals';
    case TreasureMiscMagicE1.BrazierOfSleepSmoke:
      return 'Brazier of Sleep Smoke';
    case TreasureMiscMagicE1.BucknardsEverfullPurse:
      return "Bucknard's Everfull Purse";
    default:
      return startCase(ITEM_NAMES[command]);
  }
}

function articleFor(name: string): 'a' | 'an' {
  const first = name.trim().charAt(0).toLowerCase();
  return 'aeiou'.includes(first) ? 'an' : 'a';
}

function startCase(input: string): string {
  return input
    .split(' ')
    .map((word) =>
      word.length === 0 ? word : word[0]?.toUpperCase() + word.slice(1)
    )
    .join(' ');
}

export function treasureMiscMagicE1Sentence(
  result: TreasureMiscMagicE1,
  beaker?: TreasureBeakerOfPlentifulPotionsDetails
): string {
  if (
    result === TreasureMiscMagicE1.BeakerOfPlentifulPotions &&
    beaker !== undefined
  ) {
    return beakerSentence(beaker);
  }
  const itemName = ITEM_NAMES[result];
  return `There is ${articleFor(itemName)} ${itemName}.`;
}

function resolvedSentence(
  result: TreasureMiscMagicE1,
  beaker?: TreasureBeakerOfPlentifulPotionsDetails,
  bagOfTricksChild?: OutcomeEventNode,
  bracersChild?: OutcomeEventNode,
  purseChild?: OutcomeEventNode,
  artifactChild?: OutcomeEventNode
): string {
  if (
    result === TreasureMiscMagicE1.BagOfTricks &&
    bagOfTricksChild &&
    bagOfTricksChild.event.kind === 'treasureBagOfTricks'
  ) {
    return bagOfTricksSentence(bagOfTricksChild.event.result);
  }
  if (
    result === TreasureMiscMagicE1.BracersOfDefense &&
    bracersChild &&
    bracersChild.event.kind === 'treasureBracersOfDefense'
  ) {
    return bracersSentence(bracersChild.event.result);
  }
  if (
    result === TreasureMiscMagicE1.BucknardsEverfullPurse &&
    purseChild &&
    purseChild.event.kind === 'treasureBucknardsEverfullPurse'
  ) {
    return purseSentence(purseChild.event.result);
  }
  if (
    result === TreasureMiscMagicE1.ArtifactOrRelic &&
    artifactChild &&
    artifactChild.event.kind === 'treasureArtifactOrRelic'
  ) {
    return artifactSentence(artifactChild.event.result);
  }
  return treasureMiscMagicE1Sentence(result, beaker);
}

function beakerSentence(
  beaker: TreasureBeakerOfPlentifulPotionsDetails
): string {
  const potionCount = beaker.potions.length;
  const contents = formatPotionList(
    beaker.potions.map((potion) => labelForResolvedPotion(potion))
  );
  return `There is a beaker of plentiful potions containing ${potionCount} ${
    potionCount === 1 ? 'dose' : 'doses'
  }, in order: ${contents}. ${beakerCadenceSentence(
    beaker.cadence
  )} Once opened, it loses one potion type per month.`;
}

function beakerCadenceSentence(
  cadence: TreasureBeakerOfPlentifulPotionsDetails['cadence']
): string {
  switch (cadence) {
    case 'threeTimesPerWeek':
      return 'Each potion type can be poured forth once per day, but no more than three times per week.';
    case 'twicePerWeek':
      return 'Each potion type can be poured forth once per day, but no more than twice per week.';
    default:
      return 'Each potion type can be poured forth only once per week.';
  }
}

function formatPotionList(potions: string[]): string {
  if (potions.length === 0) return 'no potions';
  if (potions.length === 1) return potions[0] ?? '';
  if (potions.length === 2) {
    return `${potions[0]} and ${potions[1]}`;
  }
  return `${potions.slice(0, -1).join(', ')}, and ${
    potions[potions.length - 1]
  }`;
}
