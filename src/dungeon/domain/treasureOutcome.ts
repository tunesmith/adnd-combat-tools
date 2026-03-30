import type { TreasureContainer } from '../features/treasure/container/containerTable';
import type { TreasureMagicCategory } from '../features/treasure/magicCategory/magicCategoryTable';
import type { TreasureMiscMagicE1 } from '../features/treasure/miscMagicE1/miscMagicE1Table';
import type {
  TreasureArtifactOrRelic,
  TreasureBagOfHolding,
  TreasureBagOfTricks,
  TreasureBracersOfDefense,
  TreasureBucknardsEverfullPurse,
} from '../features/treasure/miscMagicE1/miscMagicE1Subtables';
import type { TreasureMiscMagicE2 } from '../features/treasure/miscMagicE2/miscMagicE2Table';
import type {
  TreasureCarpetOfFlying,
  TreasureCloakOfProtection,
  TreasureCrystalBall,
  TreasureDeckOfManyThings,
  TreasureEyesOfPetrification,
} from '../features/treasure/miscMagicE2/miscMagicE2Subtables';
import type { TreasureMiscMagicE3 } from '../features/treasure/miscMagicE3/miscMagicE3Table';
import type {
  TreasureFigurineOfWondrousPower,
  TreasureFigurineMarbleElephant,
  TreasureGirdleOfGiantStrength,
  TreasureHornOfValhallaType,
  TreasureHornOfValhallaAttunement,
  TreasureHornOfValhallaAlignment,
  TreasureInstrumentOfTheBards,
  TreasureIronFlaskContent,
} from '../features/treasure/miscMagicE3/miscMagicE3Subtables';
import type { TreasureMiscMagicE4 } from '../features/treasure/miscMagicE4/miscMagicE4Table';
import type {
  TreasureManualOfGolems,
  TreasureMedallionRange,
  TreasureNecklaceOfMissiles,
  TreasurePearlOfPowerEffect,
  TreasurePearlOfPowerRecallResult,
  TreasurePearlOfWisdomOutcome,
  TreasurePeriaptPoisonBonus,
  TreasurePhylacteryLongYearsOutcome,
  TreasureQuaalFeatherToken,
} from '../features/treasure/miscMagicE4/miscMagicE4Subtables';
import type { TreasureMiscMagicE5 } from '../features/treasure/miscMagicE5/miscMagicE5Table';
import type {
  TreasureRobeOfTheArchmagi,
  TreasureScarabOfProtectionCurse,
  TreasureScarabOfProtectionCurseResolution,
} from '../features/treasure/miscMagicE5/miscMagicE5Subtables';
import type { TreasureArmorShield } from '../features/treasure/armorShields/armorShieldsTable';
import type { TreasurePotion } from '../features/treasure/potion/potionTables';
import type {
  TreasurePotionAnimalControl,
  TreasurePotionDragonControl,
  TreasurePotionGiantControl,
  TreasurePotionGiantStrength,
  TreasurePotionHumanControl,
  TreasurePotionUndeadControl,
} from '../features/treasure/potion/potionTables';
import type {
  TreasureProtectionType,
  TreasureProtectionGuardedBy,
  TreasureProtectionHiddenBy,
} from '../features/treasure/protection/protectionTables';
import type {
  TreasureRing,
  TreasureRingContrariness,
  TreasureRingElementalCommand,
  TreasureRingProtection,
  TreasureRingRegeneration,
  TreasureRingTelekinesis,
  TreasureRingThreeWishes,
  TreasureRingWizardry,
} from '../features/treasure/ring/ringTables';
import type { TreasureRodStaffWand } from '../features/treasure/rodStaffWand/rodStaffWandTables';
import type { TreasureStaffSerpent } from '../features/treasure/rodStaffWand/rodStaffWandTables';
import type {
  TreasureScroll,
  TreasureScrollProtectionElementals,
  TreasureScrollProtectionLycanthropes,
} from '../features/treasure/scroll/scrollTables';
import type {
  TreasureSword,
  TreasureSwordKind,
  TreasureSwordUnusualResult,
  TreasureSwordPrimaryAbilityResult,
  TreasureSwordExtraordinaryPowerResult,
  TreasureSwordSpecialPurposeResult,
  TreasureSwordSpecialPurposePowerResult,
  TreasureSwordDragonSlayerColorResult,
} from '../features/treasure/swords/swordsTables';
import type { TreasureSwordAlignmentResult } from '../features/treasure/swords/swordsAlignmentTable';
import type {
  OptionalTreasureRollOutcomeEvent,
  ResultOutcomeEvent,
  TreasureRollOutcomeEvent,
} from './outcomeEventPrimitives';
import type {
  RobeOfUsefulItemsResult,
  TreasureBeakerOfPlentifulPotionsDetails,
  TreasureEntry,
  TreasureIounStonesResult,
  TreasureMiscWeaponResult,
  TreasureNecklaceOfPrayerBeadsResult,
  TreasurePotionWaterBreathingDoses,
} from './treasureValueTypes';

type TreasureScrollDetails =
  | {
      type: 'spells';
      caster: 'magic-user' | 'illusionist' | 'cleric' | 'druid';
      spellLevels: number[];
    }
  | {
      type: 'protection';
      protection: TreasureScroll;
      elementals?: TreasureScrollProtectionElementals;
      lycanthropes?: TreasureScrollProtectionLycanthropes;
    }
  | {
      type: 'curse';
    };

type SpellStoringDetails = {
  caster: 'magic-user' | 'illusionist' | 'cleric' | 'druid';
  spellLevels: number[];
};

export type TreasureOutcomeEvent =
  | {
      kind: 'treasure';
      level: number;
      withMonster: boolean;
      entries: TreasureEntry[];
      rollIndex?: number;
      totalRolls?: number;
    }
  | ResultOutcomeEvent<'treasureContainer', TreasureContainer>
  | ResultOutcomeEvent<'treasureProtectionType', TreasureProtectionType>
  | ResultOutcomeEvent<
      'treasureProtectionGuardedBy',
      TreasureProtectionGuardedBy
    >
  | ResultOutcomeEvent<'treasureProtectionHiddenBy', TreasureProtectionHiddenBy>
  | TreasureRollOutcomeEvent<'treasureMagicCategory', TreasureMagicCategory>
  | (TreasureRollOutcomeEvent<'treasurePotion', TreasurePotion> & {
      waterBreathingDoses?: TreasurePotionWaterBreathingDoses;
    })
  | TreasureRollOutcomeEvent<
      'treasurePotionAnimalControl',
      TreasurePotionAnimalControl
    >
  | TreasureRollOutcomeEvent<
      'treasurePotionDragonControl',
      TreasurePotionDragonControl
    >
  | TreasureRollOutcomeEvent<
      'treasurePotionGiantControl',
      TreasurePotionGiantControl
    >
  | TreasureRollOutcomeEvent<
      'treasurePotionGiantStrength',
      TreasurePotionGiantStrength
    >
  | TreasureRollOutcomeEvent<
      'treasurePotionHumanControl',
      TreasurePotionHumanControl
    >
  | TreasureRollOutcomeEvent<
      'treasurePotionUndeadControl',
      TreasurePotionUndeadControl
    >
  | (TreasureRollOutcomeEvent<'treasureScroll', TreasureScroll> & {
      scroll: TreasureScrollDetails;
    })
  | ResultOutcomeEvent<
      'treasureScrollProtectionElementals',
      TreasureScrollProtectionElementals
    >
  | ResultOutcomeEvent<
      'treasureScrollProtectionLycanthropes',
      TreasureScrollProtectionLycanthropes
    >
  | (TreasureRollOutcomeEvent<'treasureRing', TreasureRing> & {
      spellStoring?: SpellStoringDetails;
      multipleWishesCount?: number;
    })
  | ResultOutcomeEvent<'treasureRingContrariness', TreasureRingContrariness>
  | ResultOutcomeEvent<
      'treasureRingElementalCommand',
      TreasureRingElementalCommand
    >
  | ResultOutcomeEvent<'treasureRingProtection', TreasureRingProtection>
  | ResultOutcomeEvent<'treasureRingRegeneration', TreasureRingRegeneration>
  | ResultOutcomeEvent<'treasureRingTelekinesis', TreasureRingTelekinesis>
  | ResultOutcomeEvent<'treasureRingThreeWishes', TreasureRingThreeWishes>
  | ResultOutcomeEvent<'treasureRingWizardry', TreasureRingWizardry>
  | ResultOutcomeEvent<'treasureRodStaffWand', TreasureRodStaffWand>
  | ResultOutcomeEvent<'treasureBagOfHolding', TreasureBagOfHolding>
  | ResultOutcomeEvent<'treasureBagOfTricks', TreasureBagOfTricks>
  | ResultOutcomeEvent<'treasureBracersOfDefense', TreasureBracersOfDefense>
  | ResultOutcomeEvent<
      'treasureBucknardsEverfullPurse',
      TreasureBucknardsEverfullPurse
    >
  | ResultOutcomeEvent<'treasureArtifactOrRelic', TreasureArtifactOrRelic>
  | ResultOutcomeEvent<'treasureDeckOfManyThings', TreasureDeckOfManyThings>
  | ResultOutcomeEvent<
      'treasureFigurineOfWondrousPower',
      TreasureFigurineOfWondrousPower
    >
  | ResultOutcomeEvent<
      'treasureFigurineMarbleElephant',
      TreasureFigurineMarbleElephant
    >
  | ResultOutcomeEvent<
      'treasureGirdleOfGiantStrength',
      TreasureGirdleOfGiantStrength
    >
  | ResultOutcomeEvent<'treasureHornOfValhallaType', TreasureHornOfValhallaType>
  | ResultOutcomeEvent<
      'treasureHornOfValhallaAttunement',
      TreasureHornOfValhallaAttunement
    >
  | ResultOutcomeEvent<
      'treasureHornOfValhallaAlignment',
      TreasureHornOfValhallaAlignment
    >
  | ResultOutcomeEvent<'treasureIounStones', TreasureIounStonesResult>
  | ResultOutcomeEvent<
      'treasureEyesOfPetrification',
      TreasureEyesOfPetrification
    >
  | (OptionalTreasureRollOutcomeEvent<
      'treasureMiscMagicE1',
      TreasureMiscMagicE1
    > & {
      beaker?: TreasureBeakerOfPlentifulPotionsDetails;
    })
  | OptionalTreasureRollOutcomeEvent<'treasureMiscMagicE2', TreasureMiscMagicE2>
  | (ResultOutcomeEvent<'treasureMiscMagicE3', TreasureMiscMagicE3> & {
      ointmentJars?: number;
    })
  | ResultOutcomeEvent<'treasureMiscMagicE4', TreasureMiscMagicE4>
  | ResultOutcomeEvent<'treasureMiscMagicE5', TreasureMiscMagicE5>
  | ResultOutcomeEvent<
      'treasureScarabOfProtectionCurse',
      TreasureScarabOfProtectionCurse
    >
  | ResultOutcomeEvent<
      'treasureScarabOfProtectionCurseResolution',
      TreasureScarabOfProtectionCurseResolution
    >
  | TreasureRollOutcomeEvent<'treasureArmorShields', TreasureArmorShield>
  | (TreasureRollOutcomeEvent<'treasureSwords', TreasureSword> & {
      luckBladeWishes?: number;
    })
  | ResultOutcomeEvent<'treasureSwordKind', TreasureSwordKind>
  | ResultOutcomeEvent<'treasureSwordUnusual', TreasureSwordUnusualResult>
  | ResultOutcomeEvent<
      'treasureSwordPrimaryAbility',
      TreasureSwordPrimaryAbilityResult
    >
  | ResultOutcomeEvent<
      'treasureSwordExtraordinaryPower',
      TreasureSwordExtraordinaryPowerResult
    >
  | ResultOutcomeEvent<
      'treasureSwordSpecialPurpose',
      TreasureSwordSpecialPurposeResult
    >
  | ResultOutcomeEvent<
      'treasureSwordSpecialPurposePower',
      TreasureSwordSpecialPurposePowerResult
    >
  | ResultOutcomeEvent<
      'treasureSwordDragonSlayerColor',
      TreasureSwordDragonSlayerColorResult
    >
  | ResultOutcomeEvent<'treasureSwordAlignment', TreasureSwordAlignmentResult>
  | TreasureRollOutcomeEvent<'treasureMiscWeapons', TreasureMiscWeaponResult>
  | ResultOutcomeEvent<'treasureRobeOfTheArchmagi', TreasureRobeOfTheArchmagi>
  | ResultOutcomeEvent<'treasureRobeOfUsefulItems', RobeOfUsefulItemsResult>
  | ResultOutcomeEvent<'treasureManualOfGolems', TreasureManualOfGolems>
  | ResultOutcomeEvent<'treasureMedallionRange', TreasureMedallionRange>
  | ResultOutcomeEvent<'treasureNecklaceOfMissiles', TreasureNecklaceOfMissiles>
  | ResultOutcomeEvent<
      'treasureNecklaceOfPrayerBeads',
      TreasureNecklaceOfPrayerBeadsResult
    >
  | ResultOutcomeEvent<'treasurePearlOfPowerEffect', TreasurePearlOfPowerEffect>
  | ResultOutcomeEvent<
      'treasurePearlOfPowerRecall',
      TreasurePearlOfPowerRecallResult
    >
  | ResultOutcomeEvent<'treasurePearlOfWisdom', TreasurePearlOfWisdomOutcome>
  | ResultOutcomeEvent<
      'treasurePeriaptProofAgainstPoison',
      TreasurePeriaptPoisonBonus
    >
  | ResultOutcomeEvent<
      'treasurePhylacteryLongYears',
      TreasurePhylacteryLongYearsOutcome
    >
  | ResultOutcomeEvent<'treasureQuaalFeatherToken', TreasureQuaalFeatherToken>
  | ResultOutcomeEvent<'treasureCarpetOfFlying', TreasureCarpetOfFlying>
  | ResultOutcomeEvent<'treasureCloakOfProtection', TreasureCloakOfProtection>
  | ResultOutcomeEvent<
      'treasureInstrumentOfTheBards',
      TreasureInstrumentOfTheBards
    >
  | ResultOutcomeEvent<'treasureIronFlask', TreasureIronFlaskContent>
  | ResultOutcomeEvent<'treasureCrystalBall', TreasureCrystalBall>
  | ResultOutcomeEvent<'treasureStaffSerpent', TreasureStaffSerpent>;
