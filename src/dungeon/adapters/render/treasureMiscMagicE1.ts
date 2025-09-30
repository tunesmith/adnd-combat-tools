import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import {
  treasureMiscMagicE1,
  TreasureMiscMagicE1,
} from '../../../tables/dungeon/treasureMiscMagicE1';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';
import type { TreasureBagOfTricks } from '../../../tables/dungeon/treasureBagOfTricks';
import type { TreasureBracersOfDefense } from '../../../tables/dungeon/treasureBracersOfDefense';
import { bagOfTricksSentence } from './treasureBagOfTricks';
import {
  labelForResult as bracersLabel,
  bracersSentence,
} from './treasureBracersOfDefense';

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

const BAG_OF_TRICKS_LABELS: Record<TreasureBagOfTricks, string> = {
  1: 'Weasel',
  2: 'Rat',
  3: 'Jackal',
};

export function renderTreasureMiscMagicE1Detail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMiscMagicE1') return [];
  const bagOfTricksChild = findChildEvent(outcome, 'treasureBagOfTricks');
  const bracersChild = findChildEvent(outcome, 'treasureBracersOfDefense');
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Miscellaneous Magic (Table E.1)',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [
      `roll: ${outcome.roll} — ${formatItemName(
        outcome.event.result,
        bagOfTricksChild &&
          bagOfTricksChild.event.kind === 'treasureBagOfTricks'
          ? bagOfTricksChild.event.result
          : undefined,
        bracersChild && bracersChild.event.kind === 'treasureBracersOfDefense'
          ? bracersChild.event.result
          : undefined
      )}`,
    ],
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: resolvedSentence(
      outcome.event.result,
      bagOfTricksChild,
      bracersChild
    ),
  };
  const nodes: DungeonRenderNode[] = [heading, bullet, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureMiscMagicE1Compact(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasureMiscMagicE1') return [];
  const bagOfTricksChild = findChildEvent(outcome, 'treasureBagOfTricks');
  const bracersChild = findChildEvent(outcome, 'treasureBracersOfDefense');
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Miscellaneous Magic',
  };
  const paragraph: DungeonMessage = {
    kind: 'paragraph',
    text: resolvedSentence(outcome.event.result, bagOfTricksChild, bracersChild),
  };
  const nodes: DungeonRenderNode[] = [heading, paragraph];
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export const buildTreasureMiscMagicE1Preview: TablePreviewFactory = (tableId) =>
  buildPreview(tableId, {
    title: 'Miscellaneous Magic (Table E.1)',
    sides: treasureMiscMagicE1.sides,
    entries: treasureMiscMagicE1.entries.map(({ range, command }) => ({
      range,
      label: formatItemName(command),
    })),
  });

function formatItemName(
  command: TreasureMiscMagicE1,
  bagOfTricks?: TreasureBagOfTricks,
  bracers?: TreasureBracersOfDefense
): string {
  if (command === TreasureMiscMagicE1.BagOfTricks && bagOfTricks) {
    return `Bag of Tricks ("${BAG_OF_TRICKS_LABELS[bagOfTricks]}")`;
  }
  if (command === TreasureMiscMagicE1.BracersOfDefense && bracers) {
    return bracersLabel(bracers);
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
  result: TreasureMiscMagicE1
): string {
  const itemName = ITEM_NAMES[result];
  return `There is ${articleFor(itemName)} ${itemName}.`;
}

function resolvedSentence(
  result: TreasureMiscMagicE1,
  bagOfTricksChild?: OutcomeEventNode,
  bracersChild?: OutcomeEventNode
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
  return treasureMiscMagicE1Sentence(result);
}
