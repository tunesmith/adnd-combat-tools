import type React from 'react';
import type {
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../types/dungeon';
import type {
  DoorChainLaterality,
  DungeonOutcomeNode,
} from '../domain/outcome';
import type { ChamberRoomContents } from '../../tables/dungeon/chamberRoomContents';
import type { TreasureSword } from '../../tables/dungeon/treasureSwords';
import type { TreasureSwordAlignment } from '../../tables/dungeon/treasureSwordAlignment';
import {
  resolveChamberDimensions,
  resolveChamberRoomContents,
  resolveChamberRoomStairs,
  resolveChasmConstruction,
  resolveChasmDepth,
  resolveChute,
  resolveDoorBeyond,
  resolveDoorLocation,
  resolveDragonFiveOlder,
  resolveDragonFiveYounger,
  resolveDragonFourOlder,
  resolveDragonFourYounger,
  resolveDragonSix,
  resolveDragonThree,
  resolveEgress,
  resolveGalleryStairLocation,
  resolveGalleryStairOccurrence,
  resolveHuman,
  resolveJumpingPlaceWidth,
  resolveMonsterFive,
  resolveMonsterFour,
  resolveMonsterLevel,
  resolveMonsterOne,
  resolveMonsterSix,
  resolveMonsterThree,
  resolveMonsterTwo,
  resolveNumberOfExits,
  resolvePassageTurns,
  resolvePassageWidth,
  resolvePeriodicCheck,
  resolvePeriodicDoorOnly,
  resolveRiverBoatBank,
  resolveRiverConstruction,
  resolveRoomDimensions,
  resolveSidePassages,
  resolveSpecialPassage,
  resolveStairs,
  resolveStreamConstruction,
  resolveCircularContents,
  resolveCircularPool,
  resolveCircularMagicPool,
  resolveTransmuteType,
  resolvePoolAlignment,
  resolveTransporterLocation,
  resolveTrickTrap,
  resolveIllusionaryWallNature,
  resolvePassageExitLocation,
  resolveDoorExitLocation,
  resolveExitDirection,
  resolveExitAlternative,
  resolveGasTrapEffect,
  resolveUnusualShape,
  resolveUnusualSize,
  resolveWanderingWhereFrom,
  resolveTreasure,
  resolveTreasureContainer,
  resolveTreasureProtectionType,
  resolveTreasureProtectionGuardedBy,
  resolveTreasureProtectionHiddenBy,
  resolveTreasureMagicCategory,
  resolveTreasurePotion,
  resolveTreasurePotionAnimalControl,
  resolveTreasurePotionDragonControl,
  resolveTreasurePotionGiantControl,
  resolveTreasurePotionGiantStrength,
  resolveTreasurePotionHumanControl,
  resolveTreasurePotionUndeadControl,
  resolveTreasureScroll,
  resolveTreasureScrollProtectionElementals,
  resolveTreasureScrollProtectionLycanthropes,
  resolveTreasureRing,
  resolveTreasureRingContrariness,
  resolveTreasureRingElementalCommand,
  resolveTreasureRingProtection,
  resolveTreasureRingRegeneration,
  resolveTreasureRingTelekinesis,
  resolveTreasureRingThreeWishes,
  resolveTreasureRingWizardry,
  resolveTreasureRodStaffWand,
  resolveTreasureBagOfHolding,
  resolveTreasureBagOfTricks,
  resolveTreasureBracersOfDefense,
  resolveTreasureBucknardsEverfullPurse,
  resolveTreasureArtifactOrRelic,
  resolveTreasureCarpetOfFlying,
  resolveTreasureCloakOfProtection,
  resolveTreasureCrystalBall,
  resolveTreasureDeckOfManyThings,
  resolveTreasureFigurineOfWondrousPower,
  resolveTreasureFigurineMarbleElephant,
  resolveTreasureGirdleOfGiantStrength,
  resolveTreasureInstrumentOfTheBards,
  resolveTreasureIronFlask,
  resolveTreasureIounStones,
  resolveTreasureHornOfValhallaType,
  resolveTreasureHornOfValhallaAttunement,
  resolveTreasureHornOfValhallaAlignment,
  resolveTreasureEyesOfPetrification,
  resolveTreasureMiscMagicE5,
  resolveTreasureRobeOfUsefulItems,
  resolveTreasureRobeOfTheArchmagi,
  resolveTreasureMiscMagicE4,
  resolveTreasureMiscMagicE3,
  resolveTreasureMiscMagicE2,
  resolveTreasureMiscMagicE1,
  resolveTreasureManualOfGolems,
  resolveTreasureMedallionRange,
  resolveTreasureNecklaceOfMissiles,
  resolveTreasurePearlOfPowerEffect,
  resolveTreasurePearlOfPowerRecall,
  resolveTreasurePearlOfWisdom,
  resolveTreasurePeriaptProofAgainstPoison,
  resolveTreasurePhylacteryLongYears,
  resolveTreasureQuaalFeatherToken,
  resolveTreasureStaffSerpent,
  resolveTreasureScarabOfProtectionCurse,
  resolveTreasureScarabOfProtectionCurseResolution,
  resolveTreasureArmorShields,
  resolveTreasureSwords,
  resolveTreasureSwordAlignment,
  resolveTreasureSwordKind,
  resolveTreasureSwordUnusual,
  resolveTreasureSwordPrimaryAbility,
  resolveTreasureSwordExtraordinaryPower,
  resolveTreasureSwordSpecialPurpose,
  resolveTreasureSwordSpecialPurposePower,
  resolveTreasureSwordDragonSlayerColor,
  resolveTreasureMiscWeapons,
} from '../domain/resolvers';
import { renderDetailTree } from '../adapters/render';
import {
  applyResolvedOutcome,
  deriveDoorChainContext,
  findPendingWithAncestors,
  isTableContext,
  normalizeOutcomeTree,
  parseDoorChainSequence,
  propagateSwordAlignmentInfo,
  readExitsContext,
} from '../helpers/outcomeTree';
import {
  createOutcomeRenderSnapshot,
  type OutcomeRenderSnapshot,
} from './outcomePipeline';

// Registry resolver type
type RegistryResolution = {
  messages: DungeonRenderNode[];
  outcome?: DungeonOutcomeNode;
};

export type RegistryResolver = (opts: {
  roll?: number;
  id: string;
  context?: TableContext;
  doorChain?: {
    existing: DoorChainLaterality[];
    sequence: number;
  };
}) => RegistryResolution;

const TABLE_ID_LIST = [
  'sidePassages',
  'passageTurns',
  'stairs',
  'doorLocation',
  'doorBeyond',
  'periodicCheck',
  'periodicCheckDoorOnly',
  'wanderingWhereFrom',
  'monsterLevel',
  'monsterOne',
  'monsterTwo',
  'monsterThree',
  'monsterFour',
  'monsterFive',
  'monsterSix',
  'dragonThree',
  'dragonFourYounger',
  'dragonFourOlder',
  'dragonFiveYounger',
  'dragonFiveOlder',
  'dragonSix',
  'human',
  'galleryStairLocation',
  'galleryStairOccurrence',
  'passageWidth',
  'specialPassage',
  'roomDimensions',
  'chamberDimensions',
  'chamberRoomContents',
  'chamberRoomStairs',
  'streamConstruction',
  'riverConstruction',
  'riverBoatBank',
  'chasmDepth',
  'chasmConstruction',
  'jumpingPlaceWidth',
  'unusualShape',
  'unusualSize',
  'trickTrap',
  'illusionaryWallNature',
  'passageExitLocation',
  'doorExitLocation',
  'exitDirection',
  'exitAlternative',
  'gasTrapEffect',
  'treasure',
  'treasureContainer',
  'treasureProtectionType',
  'treasureProtectionGuardedBy',
  'treasureProtectionHiddenBy',
  'treasureMagicCategory',
  'treasurePotion',
  'treasurePotionAnimalControl',
  'treasurePotionDragonControl',
  'treasurePotionGiantControl',
  'treasurePotionGiantStrength',
  'treasurePotionHumanControl',
  'treasurePotionUndeadControl',
  'treasureScroll',
  'treasureScrollProtectionElementals',
  'treasureScrollProtectionLycanthropes',
  'treasureRing',
  'treasureRingContrariness',
  'treasureRingElementalCommand',
  'treasureRingProtection',
  'treasureRingRegeneration',
  'treasureRingTelekinesis',
  'treasureRingThreeWishes',
  'treasureRingWizardry',
  'treasureRodStaffWand',
  'treasureBagOfHolding',
  'treasureBagOfTricks',
  'treasureBracersOfDefense',
  'treasureBucknardsEverfullPurse',
  'treasureArtifactOrRelic',
  'treasureMiscMagicE2',
  'treasureMiscMagicE3',
  'treasureMiscMagicE4',
  'treasureMiscMagicE5',
  'treasureArmorShields',
  'treasureSwords',
  'treasureSwordKind',
  'treasureSwordUnusual',
  'treasureSwordPrimaryAbility',
  'treasureSwordPrimaryAbilityRestricted',
  'treasureSwordExtraordinaryPower',
  'treasureSwordExtraordinaryPowerRestricted',
  'treasureSwordDragonSlayerColor',
  'treasureSwordSpecialPurpose',
  'treasureSwordSpecialPurposePower',
  'treasureSwordAlignment',
  'treasureSwordAlignmentChaotic',
  'treasureSwordAlignmentLawful',
  'treasureMiscWeapons',
  'treasureRobeOfUsefulItems',
  'treasureRobeOfTheArchmagi',
  'treasureScarabOfProtectionCurse',
  'treasureScarabOfProtectionCurseResolution',
  'treasureManualOfGolems',
  'treasureMedallionRange',
  'treasureNecklaceOfMissiles',
  'treasurePearlOfPowerEffect',
  'treasurePearlOfPowerRecall',
  'treasurePearlOfWisdom',
  'treasurePeriaptProofAgainstPoison',
  'treasurePhylacteryLongYears',
  'treasureQuaalFeatherToken',
  'treasureFigurineOfWondrousPower',
  'treasureFigurineMarbleElephant',
  'treasureGirdleOfGiantStrength',
  'treasureInstrumentOfTheBards',
  'treasureIronFlask',
  'treasureHornOfValhallaType',
  'treasureHornOfValhallaAttunement',
  'treasureHornOfValhallaAlignment',
  'treasureIounStones',
  'treasureCarpetOfFlying',
  'treasureCloakOfProtection',
  'treasureCrystalBall',
  'treasureDeckOfManyThings',
  'treasureEyesOfPetrification',
  'treasureMiscMagicE1',
  'treasureStaffSerpent',
  'circularContents',
  'circularPool',
  'circularMagicPool',
  'transmuteType',
  'poolAlignment',
  'transporterLocation',
  'chute',
  'egress',
  'numberOfExits',
] as const;

function isTableId(x: string): x is TableId {
  return (TABLE_ID_LIST as readonly string[]).includes(x);
}

export type TableId = typeof TABLE_ID_LIST[number];

export const TABLE_HEADINGS: Record<TableId, string> = {
  sidePassages: 'Side Passages',
  passageTurns: 'Passage Turns',
  stairs: 'Stairs',
  doorLocation: 'Door Location',
  doorBeyond: 'Door',
  periodicCheck: 'Passage',
  periodicCheckDoorOnly: 'Periodic Check (doors only)',
  wanderingWhereFrom: 'Where From',
  monsterLevel: 'Monster Level',
  monsterOne: 'Monster (Level 1)',
  monsterTwo: 'Monster (Level 2)',
  monsterThree: 'Monster (Level 3)',
  monsterFour: 'Monster (Level 4)',
  monsterFive: 'Monster (Level 5)',
  monsterSix: 'Monster (Level 6)',
  dragonThree: 'Dragon (Level 3)',
  dragonFourYounger: 'Dragon (Younger)',
  dragonFourOlder: 'Dragon (Older)',
  dragonFiveYounger: 'Dragon (Younger)',
  dragonFiveOlder: 'Dragon (Older)',
  dragonSix: 'Dragon',
  human: 'Human Subtable',
  galleryStairLocation: 'Gallery Stair Location',
  galleryStairOccurrence: 'Gallery Stair Occurrence',
  passageWidth: 'Passage Width',
  specialPassage: 'Special Passage',
  roomDimensions: 'Room Dimensions',
  chamberDimensions: 'Chamber Dimensions',
  chamberRoomContents: 'Contents',
  chamberRoomStairs: 'Stairway',
  streamConstruction: 'Stream Construction',
  riverConstruction: 'River Construction',
  riverBoatBank: 'Boat Bank',
  chasmDepth: 'Chasm Depth',
  chasmConstruction: 'Chasm Construction',
  jumpingPlaceWidth: 'Jumping Place Width',
  unusualShape: 'Unusual Shape',
  unusualSize: 'Unusual Size',
  trickTrap: 'Trick / Trap',
  illusionaryWallNature: 'What Lies Beyond',
  passageExitLocation: 'Passage Exit Location',
  doorExitLocation: 'Door Exit Location',
  exitDirection: 'Exit Direction',
  exitAlternative: 'Exit Alternative',
  gasTrapEffect: 'Gas Effect',
  treasure: 'Treasure',
  treasureContainer: 'Treasure Container',
  treasureProtectionType: 'Treasure Protection',
  treasureProtectionGuardedBy: 'Treasure Guarded By',
  treasureProtectionHiddenBy: 'Treasure Hidden By',
  treasureMagicCategory: 'Magical Treasure',
  treasurePotion: 'Potion',
  treasurePotionAnimalControl: 'Animal Control Target',
  treasurePotionDragonControl: 'Dragon Control Target',
  treasurePotionGiantControl: 'Giant Control Target',
  treasurePotionGiantStrength: 'Giant Strength Target',
  treasurePotionHumanControl: 'Human Control Target',
  treasurePotionUndeadControl: 'Undead Control Target',
  treasureScroll: 'Scroll',
  treasureScrollProtectionElementals: 'Protection from Elementals',
  treasureScrollProtectionLycanthropes: 'Protection from Lycanthropes',
  treasureRing: 'Ring',
  treasureRingContrariness: 'Contrariness Effect',
  treasureRingElementalCommand: 'Elemental Focus',
  treasureRingProtection: 'Protection Bonus',
  treasureRingRegeneration: 'Regeneration Type',
  treasureRingTelekinesis: 'Telekinetic Capacity',
  treasureRingThreeWishes: 'Wish Capacity',
  treasureRingWizardry: 'Spell Doubling',
  treasureRodStaffWand: 'Rod/Staff/Wand',
  treasureBagOfHolding: 'Bag of Holding Capacity',
  treasureBagOfTricks: 'Bag of Tricks Type',
  treasureBracersOfDefense: 'Bracers of Defense Armor Class',
  treasureBucknardsEverfullPurse: "Bucknard's Everfull Purse Contents",
  treasureArtifactOrRelic: 'Artifact or Relic',
  treasureMiscMagicE2: 'Miscellaneous Magic (Table E.2)',
  treasureMiscMagicE3: 'Miscellaneous Magic (Table E.3)',
  treasureMiscMagicE4: 'Miscellaneous Magic (Table E.4)',
  treasureMiscMagicE5: 'Miscellaneous Magic (Table E.5)',
  treasureArmorShields: 'Armor & Shields (Table F)',
  treasureSwords: 'Swords (Table G)',
  treasureSwordKind: 'Sword Type',
  treasureSwordUnusual: 'Sword Unusual Traits',
  treasureSwordPrimaryAbility: 'Primary Ability',
  treasureSwordPrimaryAbilityRestricted: 'Primary Ability (01-92)',
  treasureSwordExtraordinaryPower: 'Extraordinary Power',
  treasureSwordExtraordinaryPowerRestricted: 'Extraordinary Power (01-97)',
  treasureSwordDragonSlayerColor: 'Dragon Slayer Target',
  treasureSwordSpecialPurpose: 'Sword Special Purpose',
  treasureSwordSpecialPurposePower: 'Sword Special Purpose Power',
  treasureSwordAlignment: 'Sword Alignment',
  treasureSwordAlignmentChaotic: 'Sword Alignment (Chaotic)',
  treasureSwordAlignmentLawful: 'Sword Alignment (Lawful)',
  treasureMiscWeapons: 'Miscellaneous Weapons (Table H)',
  treasureRobeOfUsefulItems: 'Robe of Useful Items',
  treasureRobeOfTheArchmagi: 'Robe of the Archmagi Alignment',
  treasureScarabOfProtectionCurse: 'Scarab of Protection (curse check)',
  treasureScarabOfProtectionCurseResolution:
    'Scarab of Protection (curse resolution)',
  treasureManualOfGolems: 'Manual of Golems',
  treasureMedallionRange: 'Medallion Details',
  treasureNecklaceOfMissiles: 'Necklace of Missiles',
  treasurePearlOfPowerEffect: 'Pearl of Power Effect',
  treasurePearlOfPowerRecall: 'Pearl of Power Recall',
  treasurePearlOfWisdom: 'Pearl of Wisdom Outcome',
  treasurePeriaptProofAgainstPoison: 'Periapt of Proof Against Poison',
  treasurePhylacteryLongYears: 'Phylactery of Long Years',
  treasureQuaalFeatherToken: "Quaal's Feather Token",
  treasureFigurineOfWondrousPower: 'Figurine of Wondrous Power',
  treasureFigurineMarbleElephant: 'Marble Elephant Form',
  treasureGirdleOfGiantStrength: 'Giant Strength Type',
  treasureInstrumentOfTheBards: 'Instrument of the Bards',
  treasureIronFlask: 'Iron Flask Contents',
  treasureHornOfValhallaType: 'Horn Type',
  treasureHornOfValhallaAttunement: 'Attunement',
  treasureHornOfValhallaAlignment: 'Alignment',
  treasureIounStones: 'Ioun Stones',
  treasureCarpetOfFlying: 'Carpet of Flying Size',
  treasureCloakOfProtection: 'Cloak of Protection Bonus',
  treasureCrystalBall: 'Crystal Ball Variant',
  treasureDeckOfManyThings: 'Deck Composition',
  treasureEyesOfPetrification: 'Eyes of Petrification Type',
  treasureMiscMagicE1: 'Miscellaneous Magic (Table E.1)',
  treasureStaffSerpent: 'Serpent Form',
  circularContents: 'Circular Contents',
  circularPool: 'Pool',
  circularMagicPool: 'Magic Pool Effect',
  transmuteType: 'Transmutation Type',
  poolAlignment: 'Pool Alignment',
  transporterLocation: 'Transporter Location',
  chute: 'Chute',
  egress: 'Egress',
  numberOfExits: 'Exits',
};

function fromOutcome(outcome: DungeonOutcomeNode): RegistryResolution {
  const normalized = normalizeOutcomeTree(outcome);
  const propagated = propagateSwordAlignmentInfo(normalized);
  return { outcome: propagated, messages: renderDetailTree(propagated) };
}

export const TABLE_RESOLVERS: Record<TableId, RegistryResolver> = {
  sidePassages: ({ roll }) => fromOutcome(resolveSidePassages({ roll })),
  passageTurns: ({ roll }) => fromOutcome(resolvePassageTurns({ roll })),
  stairs: ({ roll }) => fromOutcome(resolveStairs({ roll })),
  doorLocation: ({ roll, doorChain, id }) => {
    const existing = doorChain?.existing ?? [];
    const sequence =
      doorChain?.sequence ?? parseDoorChainSequence(id, existing.length);
    return fromOutcome(resolveDoorLocation({ roll, existing, sequence }));
  },
  doorBeyond: ({ roll }) => fromOutcome(resolveDoorBeyond({ roll })),
  periodicCheck: ({ roll, context }) => {
    const c = (context || {}) as { kind?: string; level?: number };
    const level =
      c.kind === 'wandering' && typeof c.level === 'number' ? c.level : 1;
    return fromOutcome(resolvePeriodicCheck({ roll, level }));
  },
  periodicCheckDoorOnly: ({ roll, doorChain, id }) => {
    const existing = doorChain?.existing ?? [];
    const sequence =
      doorChain?.sequence ?? parseDoorChainSequence(id, existing.length);
    return fromOutcome(resolvePeriodicDoorOnly({ roll, existing, sequence }));
  },
  wanderingWhereFrom: ({ roll }) =>
    fromOutcome(resolveWanderingWhereFrom({ roll })),
  monsterLevel: ({ roll, id, context }) => {
    const dungeonLevel = readDungeonLevel(context, id, 1);
    return fromOutcome(resolveMonsterLevel({ roll, dungeonLevel }));
  },
  monsterOne: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'monsterOne', 1);
    return fromOutcome(resolveMonsterOne({ roll, dungeonLevel }));
  },
  monsterTwo: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'monsterTwo', 1);
    return fromOutcome(resolveMonsterTwo({ roll, dungeonLevel }));
  },
  monsterThree: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'monsterThree', 1);
    return fromOutcome(resolveMonsterThree({ roll, dungeonLevel }));
  },
  monsterFour: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'monsterFour', 1);
    return fromOutcome(resolveMonsterFour({ roll, dungeonLevel }));
  },
  monsterFive: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'monsterFive', 1);
    return fromOutcome(resolveMonsterFive({ roll, dungeonLevel }));
  },
  monsterSix: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'monsterSix', 1);
    return fromOutcome(resolveMonsterSix({ roll, dungeonLevel }));
  },
  dragonThree: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'dragonThree', 3);
    return fromOutcome(resolveDragonThree({ roll, dungeonLevel }));
  },
  dragonFourYounger: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'dragonFourYounger', 4);
    return fromOutcome(resolveDragonFourYounger({ roll, dungeonLevel }));
  },
  dragonFourOlder: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'dragonFourOlder', 4);
    return fromOutcome(resolveDragonFourOlder({ roll, dungeonLevel }));
  },
  dragonFiveYounger: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'dragonFiveYounger', 5);
    return fromOutcome(resolveDragonFiveYounger({ roll, dungeonLevel }));
  },
  dragonFiveOlder: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'dragonFiveOlder', 5);
    return fromOutcome(resolveDragonFiveOlder({ roll, dungeonLevel }));
  },
  dragonSix: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'dragonSix', 6);
    return fromOutcome(resolveDragonSix({ roll, dungeonLevel }));
  },
  human: ({ roll, context }) => {
    const dungeonLevel = readDungeonLevel(context, 'human', 1);
    return fromOutcome(resolveHuman({ roll, dungeonLevel }));
  },
  galleryStairLocation: ({ roll }) =>
    fromOutcome(resolveGalleryStairLocation({ roll })),
  galleryStairOccurrence: ({ roll }) =>
    fromOutcome(resolveGalleryStairOccurrence({ roll })),
  passageWidth: ({ roll }) => fromOutcome(resolvePassageWidth({ roll })),
  specialPassage: ({ roll }) => fromOutcome(resolveSpecialPassage({ roll })),
  roomDimensions: ({ roll }) => fromOutcome(resolveRoomDimensions({ roll })),
  chamberDimensions: ({ roll, context }) => {
    let forcedContents: ChamberRoomContents | undefined;
    let forcedLevel: number | undefined;
    if (context && context.kind === 'chamberDimensions') {
      if (typeof context.forcedContents === 'number') {
        forcedContents = context.forcedContents;
      }
      if (typeof context.level === 'number') {
        forcedLevel = context.level;
      }
    }
    return fromOutcome(
      resolveChamberDimensions({
        roll,
        context:
          forcedContents !== undefined || forcedLevel !== undefined
            ? { forcedContents, level: forcedLevel }
            : undefined,
      })
    );
  },
  chamberRoomContents: ({ roll, context, id }) => {
    let level = 1;
    if (context && context.kind === 'chamberContents') {
      level = context.level;
    } else {
      level = readDungeonLevel(context, id, 1);
    }
    return fromOutcome(resolveChamberRoomContents({ roll, level }));
  },
  chamberRoomStairs: ({ roll }) =>
    fromOutcome(resolveChamberRoomStairs({ roll })),
  streamConstruction: ({ roll }) =>
    fromOutcome(resolveStreamConstruction({ roll })),
  riverConstruction: ({ roll }) =>
    fromOutcome(resolveRiverConstruction({ roll })),
  riverBoatBank: ({ roll }) => fromOutcome(resolveRiverBoatBank({ roll })),
  chasmDepth: ({ roll }) => fromOutcome(resolveChasmDepth({ roll })),
  chasmConstruction: ({ roll }) =>
    fromOutcome(resolveChasmConstruction({ roll })),
  jumpingPlaceWidth: ({ roll }) =>
    fromOutcome(resolveJumpingPlaceWidth({ roll })),
  unusualShape: ({ roll }) => fromOutcome(resolveUnusualShape({ roll })),
  unusualSize: ({ roll, context }) => {
    const extra = context && context.kind === 'unusualSize' ? context.extra : 0;
    const isRoom =
      context && context.kind === 'unusualSize' ? context.isRoom : undefined;
    return fromOutcome(resolveUnusualSize({ roll, extra, isRoom }));
  },
  circularContents: ({ roll }) =>
    fromOutcome(resolveCircularContents({ roll })),
  circularPool: ({ roll }) => fromOutcome(resolveCircularPool({ roll })),
  circularMagicPool: ({ roll }) =>
    fromOutcome(resolveCircularMagicPool({ roll })),
  transmuteType: ({ roll }) => fromOutcome(resolveTransmuteType({ roll })),
  poolAlignment: ({ roll }) => fromOutcome(resolvePoolAlignment({ roll })),
  transporterLocation: ({ roll }) =>
    fromOutcome(resolveTransporterLocation({ roll })),
  trickTrap: ({ roll }) => fromOutcome(resolveTrickTrap({ roll })),
  illusionaryWallNature: ({ roll }) =>
    fromOutcome(resolveIllusionaryWallNature({ roll })),
  passageExitLocation: ({ roll, context }) =>
    fromOutcome(
      resolvePassageExitLocation({
        roll,
        context:
          context && context.kind === 'exit'
            ? {
                index: context.index,
                total: context.total,
                origin: context.origin,
              }
            : undefined,
      })
    ),
  doorExitLocation: ({ roll, context }) =>
    fromOutcome(
      resolveDoorExitLocation({
        roll,
        context:
          context && context.kind === 'exit'
            ? {
                index: context.index,
                total: context.total,
                origin: context.origin,
              }
            : undefined,
      })
    ),
  exitDirection: ({ roll, context }) =>
    fromOutcome(
      resolveExitDirection({
        roll,
        context:
          context && context.kind === 'exitDirection'
            ? {
                index: context.index,
                total: context.total,
                origin: context.origin,
              }
            : undefined,
      })
    ),
  exitAlternative: ({ roll, context }) =>
    fromOutcome(
      resolveExitAlternative({
        roll,
        context:
          context && context.kind === 'exitAlternative'
            ? { exitType: context.exitType }
            : undefined,
      })
    ),
  gasTrapEffect: ({ roll }) => fromOutcome(resolveGasTrapEffect({ roll })),
  treasure: ({ roll, context }) => {
    const treasureContext =
      context && context.kind === 'treasure'
        ? {
            level: context.level,
            withMonster: context.withMonster,
            rollIndex: context.rollIndex,
            totalRolls: context.totalRolls,
          }
        : {
            level: 1,
            withMonster: false,
            rollIndex: undefined,
            totalRolls: undefined,
          };
    return fromOutcome(
      resolveTreasure({
        roll,
        level: treasureContext.level,
        withMonster: treasureContext.withMonster,
        rollIndex: treasureContext.rollIndex,
        totalRolls: treasureContext.totalRolls,
      })
    );
  },
  treasureContainer: ({ roll }) =>
    fromOutcome(resolveTreasureContainer({ roll })),
  treasureProtectionType: ({ roll }) =>
    fromOutcome(resolveTreasureProtectionType({ roll })),
  treasureProtectionGuardedBy: ({ roll }) =>
    fromOutcome(resolveTreasureProtectionGuardedBy({ roll })),
  treasureProtectionHiddenBy: ({ roll }) =>
    fromOutcome(resolveTreasureProtectionHiddenBy({ roll })),
  treasureMagicCategory: ({ roll, context }) => {
    const level =
      context && context.kind === 'treasureMagic' ? context.level : 1;
    const treasureRoll =
      context && context.kind === 'treasureMagic'
        ? context.treasureRoll
        : undefined;
    const rollIndex =
      context && context.kind === 'treasureMagic'
        ? context.rollIndex
        : undefined;
    return fromOutcome(
      resolveTreasureMagicCategory({
        roll,
        level,
        treasureRoll,
        rollIndex,
      })
    );
  },
  treasurePotion: ({ roll, context }) => {
    const level =
      context && context.kind === 'treasureMagic' ? context.level : 1;
    const treasureRoll =
      context && context.kind === 'treasureMagic'
        ? context.treasureRoll
        : undefined;
    const rollIndex =
      context && context.kind === 'treasureMagic'
        ? context.rollIndex
        : undefined;
    return fromOutcome(
      resolveTreasurePotion({
        roll,
        level,
        treasureRoll,
        rollIndex,
      })
    );
  },
  treasurePotionAnimalControl: ({ roll, context }) => {
    const level =
      context && context.kind === 'treasureMagic' ? context.level : 1;
    const treasureRoll =
      context && context.kind === 'treasureMagic'
        ? context.treasureRoll
        : undefined;
    const rollIndex =
      context && context.kind === 'treasureMagic'
        ? context.rollIndex
        : undefined;
    return fromOutcome(
      resolveTreasurePotionAnimalControl({
        roll,
        level,
        treasureRoll,
        rollIndex,
      })
    );
  },
  treasurePotionDragonControl: ({ roll, context }) => {
    const level =
      context && context.kind === 'treasureMagic' ? context.level : 1;
    const treasureRoll =
      context && context.kind === 'treasureMagic'
        ? context.treasureRoll
        : undefined;
    const rollIndex =
      context && context.kind === 'treasureMagic'
        ? context.rollIndex
        : undefined;
    return fromOutcome(
      resolveTreasurePotionDragonControl({
        roll,
        level,
        treasureRoll,
        rollIndex,
      })
    );
  },
  treasurePotionGiantControl: ({ roll, context }) => {
    const level =
      context && context.kind === 'treasureMagic' ? context.level : 1;
    const treasureRoll =
      context && context.kind === 'treasureMagic'
        ? context.treasureRoll
        : undefined;
    const rollIndex =
      context && context.kind === 'treasureMagic'
        ? context.rollIndex
        : undefined;
    return fromOutcome(
      resolveTreasurePotionGiantControl({
        roll,
        level,
        treasureRoll,
        rollIndex,
      })
    );
  },
  treasurePotionGiantStrength: ({ roll, context }) => {
    const level =
      context && context.kind === 'treasureMagic' ? context.level : 1;
    const treasureRoll =
      context && context.kind === 'treasureMagic'
        ? context.treasureRoll
        : undefined;
    const rollIndex =
      context && context.kind === 'treasureMagic'
        ? context.rollIndex
        : undefined;
    return fromOutcome(
      resolveTreasurePotionGiantStrength({
        roll,
        level,
        treasureRoll,
        rollIndex,
      })
    );
  },
  treasurePotionHumanControl: ({ roll, context }) => {
    const level =
      context && context.kind === 'treasureMagic' ? context.level : 1;
    const treasureRoll =
      context && context.kind === 'treasureMagic'
        ? context.treasureRoll
        : undefined;
    const rollIndex =
      context && context.kind === 'treasureMagic'
        ? context.rollIndex
        : undefined;
    return fromOutcome(
      resolveTreasurePotionHumanControl({
        roll,
        level,
        treasureRoll,
        rollIndex,
      })
    );
  },
  treasurePotionUndeadControl: ({ roll, context }) => {
    const level =
      context && context.kind === 'treasureMagic' ? context.level : 1;
    const treasureRoll =
      context && context.kind === 'treasureMagic'
        ? context.treasureRoll
        : undefined;
    const rollIndex =
      context && context.kind === 'treasureMagic'
        ? context.rollIndex
        : undefined;
    return fromOutcome(
      resolveTreasurePotionUndeadControl({
        roll,
        level,
        treasureRoll,
        rollIndex,
      })
    );
  },
  treasureScroll: ({ roll, context }) => {
    const level =
      context && context.kind === 'treasureMagic' ? context.level : 1;
    const treasureRoll =
      context && context.kind === 'treasureMagic'
        ? context.treasureRoll
        : undefined;
    const rollIndex =
      context && context.kind === 'treasureMagic'
        ? context.rollIndex
        : undefined;
    return fromOutcome(
      resolveTreasureScroll({
        roll,
        level,
        treasureRoll,
        rollIndex,
      })
    );
  },
  treasureScrollProtectionElementals: ({ roll }) =>
    fromOutcome(resolveTreasureScrollProtectionElementals({ roll })),
  treasureScrollProtectionLycanthropes: ({ roll }) =>
    fromOutcome(resolveTreasureScrollProtectionLycanthropes({ roll })),
  treasureRing: ({ roll, context }) => {
    const level =
      context && context.kind === 'treasureMagic' ? context.level : 1;
    const treasureRoll =
      context && context.kind === 'treasureMagic'
        ? context.treasureRoll
        : undefined;
    const rollIndex =
      context && context.kind === 'treasureMagic'
        ? context.rollIndex
        : undefined;
    return fromOutcome(
      resolveTreasureRing({
        roll,
        level,
        treasureRoll,
        rollIndex,
      })
    );
  },
  treasureRingContrariness: ({ roll }) =>
    fromOutcome(resolveTreasureRingContrariness({ roll })),
  treasureRingElementalCommand: ({ roll }) =>
    fromOutcome(resolveTreasureRingElementalCommand({ roll })),
  treasureRingProtection: ({ roll }) =>
    fromOutcome(resolveTreasureRingProtection({ roll })),
  treasureRingRegeneration: ({ roll }) =>
    fromOutcome(resolveTreasureRingRegeneration({ roll })),
  treasureRingTelekinesis: ({ roll }) =>
    fromOutcome(resolveTreasureRingTelekinesis({ roll })),
  treasureRingThreeWishes: ({ roll }) =>
    fromOutcome(resolveTreasureRingThreeWishes({ roll })),
  treasureRingWizardry: ({ roll }) =>
    fromOutcome(resolveTreasureRingWizardry({ roll })),
  treasureRodStaffWand: ({ roll }) =>
    fromOutcome(resolveTreasureRodStaffWand({ roll })),
  treasureBagOfHolding: ({ roll }) =>
    fromOutcome(resolveTreasureBagOfHolding({ roll })),
  treasureBagOfTricks: ({ roll }) =>
    fromOutcome(resolveTreasureBagOfTricks({ roll })),
  treasureBracersOfDefense: ({ roll }) =>
    fromOutcome(resolveTreasureBracersOfDefense({ roll })),
  treasureBucknardsEverfullPurse: ({ roll }) =>
    fromOutcome(resolveTreasureBucknardsEverfullPurse({ roll })),
  treasureMiscMagicE2: ({ roll }) =>
    fromOutcome(resolveTreasureMiscMagicE2({ roll })),
  treasureMiscMagicE3: ({ roll }) =>
    fromOutcome(resolveTreasureMiscMagicE3({ roll })),
  treasureMiscMagicE4: ({ roll }) =>
    fromOutcome(resolveTreasureMiscMagicE4({ roll })),
  treasureMiscMagicE5: ({ roll }) =>
    fromOutcome(resolveTreasureMiscMagicE5({ roll })),
  treasureArmorShields: ({ roll, context }) => {
    const level =
      context && context.kind === 'treasureMagic' ? context.level : 1;
    const treasureRoll =
      context && context.kind === 'treasureMagic'
        ? context.treasureRoll
        : undefined;
    const rollIndex =
      context && context.kind === 'treasureMagic'
        ? context.rollIndex
        : undefined;
    return fromOutcome(
      resolveTreasureArmorShields({
        roll,
        level,
        treasureRoll,
        rollIndex,
      })
    );
  },
  treasureSwords: ({ roll, context }) => {
    const level =
      context && context.kind === 'treasureMagic' ? context.level : 1;
    const treasureRoll =
      context && context.kind === 'treasureMagic'
        ? context.treasureRoll
        : undefined;
    const rollIndex =
      context && context.kind === 'treasureMagic'
        ? context.rollIndex
        : undefined;
    return fromOutcome(
      resolveTreasureSwords({
        roll,
        level,
        treasureRoll,
        rollIndex,
      })
    );
  },
  treasureSwordKind: ({ roll }) =>
    fromOutcome(resolveTreasureSwordKind({ roll })),
  treasureSwordUnusual: ({ roll, context }) => {
    let sword: TreasureSword | undefined;
    let rollIndex: number | undefined;
    let languageRolls: number[] | undefined;
    let primaryAbilityRolls: number[] | undefined;
    let extraordinaryPowerRolls: number[] | undefined;
    let dragonSlayerColorRoll: number | undefined;
    if (context && typeof context === 'object') {
      const candidate = context as {
        sword?: unknown;
        rollIndex?: unknown;
        languageRolls?: unknown;
        primaryAbilityRolls?: unknown;
        extraordinaryPowerRolls?: unknown;
        dragonSlayerColorRoll?: unknown;
      };
      if (typeof candidate.sword === 'number') {
        sword = candidate.sword as TreasureSword;
      }
      if (typeof candidate.rollIndex === 'number') {
        rollIndex = candidate.rollIndex;
      }
      if (Array.isArray(candidate.languageRolls)) {
        languageRolls = [...candidate.languageRolls];
      }
      if (Array.isArray(candidate.primaryAbilityRolls)) {
        primaryAbilityRolls = [...candidate.primaryAbilityRolls];
      }
      if (Array.isArray(candidate.extraordinaryPowerRolls)) {
        extraordinaryPowerRolls = [...candidate.extraordinaryPowerRolls];
      }
      if (typeof candidate.dragonSlayerColorRoll === 'number') {
        dragonSlayerColorRoll = candidate.dragonSlayerColorRoll;
      }
    }
    return fromOutcome(
      resolveTreasureSwordUnusual({
        roll,
        sword,
        rollIndex,
        languageRolls,
        primaryAbilityRolls,
        extraordinaryPowerRolls,
        dragonSlayerColorRoll,
      })
    );
  },
  treasureSwordPrimaryAbility: ({ roll, context }) => {
    const parsed =
      context && typeof context === 'object'
        ? (context as {
            slotKey?: unknown;
            tableVariant?: unknown;
            ignoreHigh?: unknown;
            rollIndex?: unknown;
          })
        : {};
    const slotKey =
      typeof parsed.slotKey === 'string' ? parsed.slotKey : undefined;
    const rollIndex =
      typeof parsed.rollIndex === 'number' ? parsed.rollIndex : undefined;
    let tableVariant: 'standard' | 'restricted' = 'standard';
    if (parsed.tableVariant === 'restricted') {
      tableVariant = 'restricted';
    } else if (parsed.ignoreHigh === true) {
      tableVariant = 'restricted';
    }
    return fromOutcome(
      resolveTreasureSwordPrimaryAbility({
        roll,
        slotKey,
        rollIndex,
        tableVariant,
      })
    );
  },
  treasureSwordPrimaryAbilityRestricted: ({ roll, context }) => {
    const parsed =
      context && typeof context === 'object'
        ? (context as {
            slotKey?: unknown;
            rollIndex?: unknown;
          })
        : {};
    const slotKey =
      typeof parsed.slotKey === 'string' ? parsed.slotKey : undefined;
    const rollIndex =
      typeof parsed.rollIndex === 'number' ? parsed.rollIndex : undefined;
    return fromOutcome(
      resolveTreasureSwordPrimaryAbility({
        roll,
        slotKey,
        rollIndex,
        tableVariant: 'restricted',
      })
    );
  },
  treasureSwordExtraordinaryPower: ({ roll, context }) => {
    const parsed =
      context && typeof context === 'object'
        ? (context as {
            slotKey?: unknown;
            tableVariant?: unknown;
            ignoreHigh?: unknown;
            rollIndex?: unknown;
            alignment?: unknown;
          })
        : {};
    const slotKey =
      typeof parsed.slotKey === 'string' ? parsed.slotKey : undefined;
    const rollIndex =
      typeof parsed.rollIndex === 'number' ? parsed.rollIndex : undefined;
    let tableVariant: 'standard' | 'restricted' = 'standard';
    if (parsed.tableVariant === 'restricted') {
      tableVariant = 'restricted';
    } else if (parsed.ignoreHigh === true) {
      tableVariant = 'restricted';
    }
    const alignment =
      typeof parsed.alignment === 'number'
        ? (parsed.alignment as TreasureSwordAlignment)
        : undefined;
    return fromOutcome(
      resolveTreasureSwordExtraordinaryPower({
        roll,
        slotKey,
        rollIndex,
        tableVariant,
        alignment,
      })
    );
  },
  treasureSwordExtraordinaryPowerRestricted: ({ roll, context }) => {
    const parsed =
      context && typeof context === 'object'
        ? (context as {
            slotKey?: unknown;
            rollIndex?: unknown;
            alignment?: unknown;
          })
        : {};
    const slotKey =
      typeof parsed.slotKey === 'string' ? parsed.slotKey : undefined;
    const rollIndex =
      typeof parsed.rollIndex === 'number' ? parsed.rollIndex : undefined;
    const alignment =
      typeof parsed.alignment === 'number'
        ? (parsed.alignment as TreasureSwordAlignment)
        : undefined;
    return fromOutcome(
      resolveTreasureSwordExtraordinaryPower({
        roll,
        slotKey,
        rollIndex,
        tableVariant: 'restricted',
        alignment,
      })
    );
  },
  treasureSwordDragonSlayerColor: ({ roll, context }) => {
    const parsed =
      context && typeof context === 'object'
        ? (context as {
            slotKey?: unknown;
            rollIndex?: unknown;
            alignment?: unknown;
          })
        : {};
    const slotKey =
      typeof parsed.slotKey === 'string' ? parsed.slotKey : undefined;
    const rollIndex =
      typeof parsed.rollIndex === 'number' ? parsed.rollIndex : undefined;
    const alignment =
      typeof parsed.alignment === 'number'
        ? (parsed.alignment as TreasureSwordAlignment)
        : undefined;
    return fromOutcome(
      resolveTreasureSwordDragonSlayerColor({
        roll,
        slotKey,
        rollIndex,
        alignment,
      })
    );
  },
  treasureSwordSpecialPurpose: ({ roll, context }) => {
    const parsed =
      context && typeof context === 'object'
        ? (context as {
            slotKey?: unknown;
            rollIndex?: unknown;
            parentSlotKey?: unknown;
            alignment?: unknown;
          })
        : {};
    const slotKey =
      typeof parsed.slotKey === 'string' ? parsed.slotKey : undefined;
    const rollIndex =
      typeof parsed.rollIndex === 'number' ? parsed.rollIndex : undefined;
    const parentSlotKey =
      typeof parsed.parentSlotKey === 'string'
        ? (parsed.parentSlotKey as string)
        : undefined;
    const alignment =
      typeof parsed.alignment === 'number'
        ? (parsed.alignment as TreasureSwordAlignment)
        : undefined;
    return fromOutcome(
      resolveTreasureSwordSpecialPurpose({
        roll,
        slotKey,
        rollIndex,
        parentSlotKey,
        alignment,
      })
    );
  },
  treasureSwordSpecialPurposePower: ({ roll, context }) => {
    const parsed =
      context && typeof context === 'object'
        ? (context as {
            slotKey?: unknown;
            rollIndex?: unknown;
            parentSlotKey?: unknown;
            alignment?: unknown;
          })
        : {};
    const slotKey =
      typeof parsed.slotKey === 'string' ? parsed.slotKey : undefined;
    const rollIndex =
      typeof parsed.rollIndex === 'number' ? parsed.rollIndex : undefined;
    const parentSlotKey =
      typeof parsed.parentSlotKey === 'string'
        ? (parsed.parentSlotKey as string)
        : undefined;
    const alignment =
      typeof parsed.alignment === 'number'
        ? (parsed.alignment as TreasureSwordAlignment)
        : undefined;
    return fromOutcome(
      resolveTreasureSwordSpecialPurposePower({
        roll,
        slotKey,
        rollIndex,
        parentSlotKey,
        alignment,
      })
    );
  },
  treasureSwordAlignment: ({ roll }) =>
    fromOutcome(resolveTreasureSwordAlignment({ roll, variant: 'standard' })),
  treasureSwordAlignmentChaotic: ({ roll }) =>
    fromOutcome(resolveTreasureSwordAlignment({ roll, variant: 'chaotic' })),
  treasureSwordAlignmentLawful: ({ roll }) =>
    fromOutcome(resolveTreasureSwordAlignment({ roll, variant: 'lawful' })),
  treasureMiscWeapons: ({ roll, context }) => {
    const level =
      context && context.kind === 'treasureMagic' ? context.level : 1;
    const treasureRoll =
      context && context.kind === 'treasureMagic'
        ? context.treasureRoll
        : undefined;
    const rollIndex =
      context && context.kind === 'treasureMagic'
        ? context.rollIndex
        : undefined;
    return fromOutcome(
      resolveTreasureMiscWeapons({
        roll,
        level,
        treasureRoll,
        rollIndex,
      })
    );
  },
  treasureRobeOfUsefulItems: () =>
    fromOutcome(resolveTreasureRobeOfUsefulItems()),
  treasureRobeOfTheArchmagi: ({ roll }) =>
    fromOutcome(resolveTreasureRobeOfTheArchmagi({ roll })),
  treasureScarabOfProtectionCurse: ({ roll }) =>
    fromOutcome(resolveTreasureScarabOfProtectionCurse({ roll })),
  treasureScarabOfProtectionCurseResolution: ({ roll }) =>
    fromOutcome(resolveTreasureScarabOfProtectionCurseResolution({ roll })),
  treasureManualOfGolems: ({ roll }) =>
    fromOutcome(resolveTreasureManualOfGolems({ roll })),
  treasureMedallionRange: ({ roll }) =>
    fromOutcome(resolveTreasureMedallionRange({ roll })),
  treasureNecklaceOfMissiles: ({ roll }) =>
    fromOutcome(resolveTreasureNecklaceOfMissiles({ roll })),
  treasurePearlOfPowerEffect: ({ roll }) =>
    fromOutcome(resolveTreasurePearlOfPowerEffect({ roll })),
  treasurePearlOfPowerRecall: ({ roll }) =>
    fromOutcome(resolveTreasurePearlOfPowerRecall({ roll })),
  treasurePearlOfWisdom: ({ roll }) =>
    fromOutcome(resolveTreasurePearlOfWisdom({ roll })),
  treasurePeriaptProofAgainstPoison: ({ roll }) =>
    fromOutcome(resolveTreasurePeriaptProofAgainstPoison({ roll })),
  treasurePhylacteryLongYears: ({ roll }) =>
    fromOutcome(resolveTreasurePhylacteryLongYears({ roll })),
  treasureQuaalFeatherToken: ({ roll }) =>
    fromOutcome(resolveTreasureQuaalFeatherToken({ roll })),
  treasureFigurineOfWondrousPower: ({ roll }) =>
    fromOutcome(resolveTreasureFigurineOfWondrousPower({ roll })),
  treasureFigurineMarbleElephant: ({ roll }) =>
    fromOutcome(resolveTreasureFigurineMarbleElephant({ roll })),
  treasureGirdleOfGiantStrength: ({ roll }) =>
    fromOutcome(resolveTreasureGirdleOfGiantStrength({ roll })),
  treasureInstrumentOfTheBards: ({ roll }) =>
    fromOutcome(resolveTreasureInstrumentOfTheBards({ roll })),
  treasureIronFlask: ({ roll }) =>
    fromOutcome(resolveTreasureIronFlask({ roll })),
  treasureIounStones: ({ roll }) =>
    fromOutcome(resolveTreasureIounStones({ countRoll: roll })),
  treasureHornOfValhallaType: ({ roll }) =>
    fromOutcome(resolveTreasureHornOfValhallaType({ roll })),
  treasureHornOfValhallaAttunement: ({ roll }) =>
    fromOutcome(resolveTreasureHornOfValhallaAttunement({ roll })),
  treasureHornOfValhallaAlignment: ({ roll }) =>
    fromOutcome(resolveTreasureHornOfValhallaAlignment({ roll })),
  treasureCarpetOfFlying: ({ roll }) =>
    fromOutcome(resolveTreasureCarpetOfFlying({ roll })),
  treasureCloakOfProtection: ({ roll }) =>
    fromOutcome(resolveTreasureCloakOfProtection({ roll })),
  treasureCrystalBall: ({ roll }) =>
    fromOutcome(resolveTreasureCrystalBall({ roll })),
  treasureDeckOfManyThings: ({ roll }) =>
    fromOutcome(resolveTreasureDeckOfManyThings({ roll })),
  treasureEyesOfPetrification: ({ roll }) =>
    fromOutcome(resolveTreasureEyesOfPetrification({ roll })),
  treasureArtifactOrRelic: ({ roll }) =>
    fromOutcome(resolveTreasureArtifactOrRelic({ roll })),
  treasureMiscMagicE1: ({ roll, context }) => {
    const level =
      context && context.kind === 'treasureMagic' ? context.level : undefined;
    const treasureRoll =
      context && context.kind === 'treasureMagic'
        ? context.treasureRoll
        : undefined;
    const rollIndex =
      context && context.kind === 'treasureMagic'
        ? context.rollIndex
        : undefined;
    return fromOutcome(
      resolveTreasureMiscMagicE1({
        roll,
        level,
        treasureRoll,
        rollIndex,
      })
    );
  },
  treasureStaffSerpent: ({ roll }) =>
    fromOutcome(resolveTreasureStaffSerpent({ roll })),
  chute: ({ roll }) => fromOutcome(resolveChute({ roll })),
  egress: ({ roll, id }) => {
    const key = (id.split(':')[1] as 'one' | 'two' | 'three') || 'one';
    return fromOutcome(resolveEgress({ which: key, roll }));
  },
  numberOfExits: ({ roll, context }) => {
    const ctx = readExitsContext(context);
    if (!ctx) {
      return fromOutcome(
        resolveNumberOfExits({ roll, length: 10, width: 10, isRoom: false })
      );
    }
    return fromOutcome(
      resolveNumberOfExits({
        roll,
        length: ctx.length,
        width: ctx.width,
        isRoom: ctx.isRoom,
      })
    );
  },
};

export function resolveRegistryTable(opts: {
  tableId: string;
  roll?: number;
  context?: TableContext;
  outcome?: DungeonOutcomeNode;
  targetId?: string;
}): RegistryResolution | undefined {
  const base = String(opts.tableId.split(':')[0] ?? '');
  if (!isTableId(base)) return undefined;
  const doorChain =
    (base === 'doorLocation' || base === 'periodicCheckDoorOnly') &&
    opts.outcome &&
    opts.targetId
      ? deriveDoorChainContext(opts.outcome, opts.targetId)
      : undefined;
  const resolver = TABLE_RESOLVERS[base];
  return resolver({
    roll: opts.roll,
    id: opts.tableId,
    context: opts.context,
    doorChain,
  });
}

export type OutcomeRollApplication = {
  outcome: DungeonOutcomeNode;
  snapshot: OutcomeRenderSnapshot;
};

export function applyOutcomeRoll(opts: {
  outcome: DungeonOutcomeNode;
  tableId: string;
  targetId?: string;
  roll?: number;
  context?: TableContext;
}): OutcomeRollApplication | undefined {
  const normalizedExisting = normalizeOutcomeTree(opts.outcome);
  const targetId = resolvePendingTargetId(
    normalizedExisting,
    opts.tableId,
    opts.targetId ?? opts.tableId,
    opts.context
  );
  const resolution = resolveRegistryTable({
    tableId: opts.tableId,
    roll: opts.roll,
    context: opts.context,
    outcome: normalizedExisting,
    targetId,
  });
  if (!resolution || !resolution.outcome) return undefined;
  const normalizedResolution = normalizeOutcomeTree(
    resolution.outcome,
    targetId
  );
  const applied = applyResolvedOutcome(
    normalizedExisting,
    targetId,
    normalizedResolution
  );
  const normalizedApplied = normalizeOutcomeTree(applied);
  const detailSnapshot = createOutcomeRenderSnapshot(normalizedApplied, {
    autoResolve: false,
  });
  const compactSnapshot = createOutcomeRenderSnapshot(normalizedApplied, {
    autoResolve: false,
  });
  if (!detailSnapshot || !compactSnapshot) return undefined;
  const snapshot: OutcomeRenderSnapshot = {
    normalized: detailSnapshot.normalized,
    compactOutcome: compactSnapshot.compactOutcome,
    detail: detailSnapshot.detail,
    detailResolved: compactSnapshot.detailResolved,
    compact: compactSnapshot.compact,
    pendingCount: detailSnapshot.pendingCount,
    resolvedPendingCount: compactSnapshot.resolvedPendingCount,
  };
  return { outcome: normalizedApplied, snapshot };
}

function resolvePendingTargetId(
  existing: DungeonOutcomeNode,
  tableId: string,
  requestedId: string,
  context?: TableContext
): string {
  const base = String(tableId.split(':')[0] ?? '');
  const exactMatch = findPendingWithAncestors(
    existing,
    (pending) =>
      (pending.id !== undefined && pending.id === requestedId) ||
      (pending.id === undefined && pending.table === requestedId)
  );
  if (exactMatch) return requestedId;
  if (
    base !== 'treasureSwordSpecialPurpose' &&
    base !== 'treasureSwordSpecialPurposePower' &&
    base !== 'treasureSwordDragonSlayerColor'
  ) {
    return requestedId;
  }
  const slotKey = extractSlotKey(base, context, requestedId);
  if (!slotKey) return requestedId;
  const slotMatch = findPendingWithAncestors(existing, (pending) => {
    const pendingBase = String(pending.table.split(':')[0] ?? '');
    if (pendingBase !== base) return false;
    const candidateSlot = readSlotKeyFromContext(base, pending.context);
    return candidateSlot === slotKey;
  });
  if (!slotMatch) return requestedId;
  return slotMatch.pending.id ?? slotMatch.pending.table;
}

function extractSlotKey(
  base: string,
  context: TableContext | undefined,
  requestedId: string
): string | undefined {
  const fromContext = readSlotKeyFromContext(base, context);
  if (fromContext) return fromContext;
  const idx = requestedId.indexOf(':');
  if (idx === -1) return undefined;
  const slot = requestedId.slice(idx + 1);
  return slot.length > 0 ? slot : undefined;
}

function readSlotKeyFromContext(
  base: string,
  context: unknown
): string | undefined {
  if (!isTableContext(context)) return undefined;
  if (
    base === 'treasureSwordSpecialPurpose' &&
    context.kind === 'treasureSwordSpecialPurpose'
  ) {
    if (typeof context.slotKey === 'string') return context.slotKey;
    if (typeof context.parentSlotKey === 'string') return context.parentSlotKey;
    return undefined;
  }
  if (
    base === 'treasureSwordSpecialPurposePower' &&
    context.kind === 'treasureSwordSpecialPurposePower'
  ) {
    if (typeof context.slotKey === 'string') return context.slotKey;
    if (typeof context.parentSlotKey === 'string') return context.parentSlotKey;
    return undefined;
  }
  if (
    base === 'treasureSwordDragonSlayerColor' &&
    context.kind === 'treasureSwordDragonSlayerColor'
  ) {
    if (typeof context.slotKey === 'string') return context.slotKey;
    return undefined;
  }
  return undefined;
}

function readDungeonLevel(
  context: TableContext | undefined,
  id: string,
  fallback: number
): number {
  if (context && context.kind === 'wandering') {
    return context.level;
  }
  const parts = id.split(':');
  if (parts.length >= 2) {
    const parsed = Number(parts[1]);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return fallback;
}

export type FeedLike = {
  id: string;
  messages: DungeonRenderNode[];
  outcome?: DungeonOutcomeNode;
  renderCache?: {
    detail?: DungeonRenderNode[];
    compact?: DungeonRenderNode[];
  };
  pendingCount?: number;
};

export function updateResolvedBlock<T extends FeedLike>(
  fi: T,
  feedItemId: string,
  targetId: string,
  messages: DungeonRenderNode[],
  headingText: string
): T {
  if (fi.id !== feedItemId) return fi;
  const newMessages: DungeonRenderNode[] = [];
  let skippingOld = false;
  for (const node of fi.messages) {
    const nodeTargetId =
      node.kind === 'table-preview' ? node.targetId ?? node.id : undefined;
    if (node.kind === 'table-preview' && nodeTargetId === targetId) {
      newMessages.push(node);
      skippingOld = true;
      for (const m of messages) newMessages.push(m);
    } else {
      if (skippingOld) {
        if (node.kind === 'table-preview') {
          const compareId = node.targetId ?? node.id;
          if (compareId !== targetId) {
            skippingOld = false;
          }
        } else if (node.kind === 'heading' && node.text !== headingText) {
          skippingOld = false;
        } else if (node.kind === 'heading' && node.text === headingText) {
          // keep skipping
        } else if (node.kind === 'bullet-list' || node.kind === 'paragraph') {
          // skip
        } else {
          skippingOld = false;
        }
        if (!skippingOld) newMessages.push(node);
      } else {
        newMessages.push(node);
      }
    }
  }
  return { ...fi, messages: newMessages };
}

export function resolveViaRegistry<T extends FeedLike>(
  tp: DungeonTablePreview,
  feedItemId: string,
  usedRoll: number | undefined,
  setFeed?: React.Dispatch<React.SetStateAction<T[]>>,
  setCollapsed?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  setResolved?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
): boolean {
  const base = String(tp.id.split(':')[0] ?? '');
  if (!isTableId(base)) return false;

  const heading = TABLE_HEADINGS[base];
  const targetKey = tp.targetId ?? tp.id;
  const keyVariants = collectKeyVariants(targetKey, tp.id);
  let resolved = false;
  const extraKeyVariants = new Set<string>();

  if (setFeed) {
    setFeed((prev) =>
      prev.map((fi) =>
        fi.id !== feedItemId
          ? fi
          : (() => {
              const existingOutcome = fi.outcome;
              if (existingOutcome) {
                const applied = applyOutcomeRoll({
                  outcome: existingOutcome,
                  tableId: tp.id,
                  targetId: targetKey,
                  roll: usedRoll,
                  context: tp.context,
                });
                if (applied) {
                  resolved = true;
                  const { outcome, snapshot } = applied;
                  const previewTargets = collectPreviewTargetsForTable(
                    snapshot.detail,
                    tp.id
                  ).filter((key) => key === targetKey);
                  for (const key of previewTargets) extraKeyVariants.add(key);
                  if (setCollapsed) {
                    setCollapsed((prev) => {
                      const next = { ...prev };
                      for (const k of keyVariants)
                        next[`${feedItemId}:${k}`] = true;
                      for (const k of previewTargets)
                        next[`${feedItemId}:${k}`] = true;
                      return next;
                    });
                  }
                  if (setResolved) {
                    setResolved((prev) => {
                      const next = { ...prev };
                      for (const k of keyVariants)
                        next[`${feedItemId}:${k}`] = true;
                      for (const k of previewTargets)
                        next[`${feedItemId}:${k}`] = true;
                      return next;
                    });
                  }
                  return {
                    ...fi,
                    outcome,
                    pendingCount: snapshot.pendingCount,
                    messages: snapshot.detail,
                    renderCache: {
                      ...fi.renderCache,
                      detail: snapshot.detail,
                      compact: snapshot.compact,
                    },
                  } as T;
                }
              }
              const tableResult = resolveRegistryTable({
                tableId: tp.id,
                roll: usedRoll,
                context: tp.context,
                outcome: fi.outcome,
                targetId: targetKey,
              });
              if (!tableResult) return fi;
              resolved = true;
              const previewTargets = collectPreviewTargetsForTable(
                tableResult.messages,
                tp.id
              ).filter((key) => key === targetKey);
              for (const key of previewTargets) extraKeyVariants.add(key);
              if (setCollapsed) {
                setCollapsed((prev) => {
                  const next = { ...prev };
                  for (const k of keyVariants)
                    next[`${feedItemId}:${k}`] = true;
                  for (const k of previewTargets)
                    next[`${feedItemId}:${k}`] = true;
                  return next;
                });
              }
              if (setResolved) {
                setResolved((prev) => {
                  const next = { ...prev };
                  for (const k of keyVariants)
                    next[`${feedItemId}:${k}`] = true;
                  for (const k of previewTargets)
                    next[`${feedItemId}:${k}`] = true;
                  return next;
                });
              }
              return updateResolvedBlock(
                fi,
                feedItemId,
                targetKey,
                tableResult.messages,
                heading
              );
            })()
      )
    );
  }
  if (!resolved) return false;
  const combinedKeyVariantSet = new Set<string>(keyVariants);
  extraKeyVariants.forEach((key) => {
    combinedKeyVariantSet.add(key);
  });
  const combinedKeyVariants = Array.from(combinedKeyVariantSet);
  if (setCollapsed) {
    setCollapsed((prev) => {
      const next = { ...prev };
      for (const k of combinedKeyVariants) next[`${feedItemId}:${k}`] = true;
      return next;
    });
  }
  if (setResolved) {
    setResolved((prev) => {
      const next = { ...prev };
      for (const k of combinedKeyVariants) next[`${feedItemId}:${k}`] = true;
      return next;
    });
  }
  return true;
}

function collectPreviewTargetsForTable(
  nodes: DungeonRenderNode[] | undefined,
  tableId: string
): string[] {
  if (!nodes) return [];
  const targets = new Set<string>();
  for (const node of nodes) {
    if (node.kind !== 'table-preview') continue;
    if (node.id !== tableId) continue;
    const target =
      node.targetId && node.targetId.length > 0 ? node.targetId : node.id;
    targets.add(target);
  }
  return Array.from(targets);
}

function collectKeyVariants(primary: string, fallbackId?: string): string[] {
  const variants = new Set<string>();
  const add = (k?: string) => {
    if (!k || k.length === 0) return;
    variants.add(k);
    const norm = normalizeKey(k);
    if (norm) variants.add(norm);
  };
  add(primary);
  add(fallbackId);

  return Array.from(variants);
}

function normalizeKey(key: string): string | undefined {
  const idx = key.lastIndexOf(':');
  if (idx === -1) return undefined;
  const tail = key.slice(idx + 1);
  if (/^\d+$/.test(tail)) return key.slice(0, idx);
  return undefined;
}
