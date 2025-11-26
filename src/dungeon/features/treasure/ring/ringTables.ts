import type { Table } from '../../../../tables/dungeon/dungeonTypes';

export enum TreasureRing {
  Contrariness,
  Delusion,
  DjinniSummoning,
  ElementalCommand,
  FeatherFalling,
  FireResistance,
  FreeAction,
  HumanInfluence,
  Invisibility,
  MammalControl,
  MultipleWishes,
  Protection,
  Regeneration,
  ShootingStars,
  SpellStoring,
  SpellTurning,
  Swimming,
  Telekinesis,
  ThreeWishes,
  Warmth,
  WaterWalking,
  Weakness,
  Wizardry,
  XRayVision,
}

export const treasureRings: Table<TreasureRing> = {
  sides: 100,
  entries: [
    { range: [1, 6], command: TreasureRing.Contrariness },
    { range: [7, 12], command: TreasureRing.Delusion },
    { range: [13, 14], command: TreasureRing.DjinniSummoning },
    { range: [15], command: TreasureRing.ElementalCommand },
    { range: [16, 21], command: TreasureRing.FeatherFalling },
    { range: [22, 27], command: TreasureRing.FireResistance },
    { range: [28, 30], command: TreasureRing.FreeAction },
    { range: [31, 33], command: TreasureRing.HumanInfluence },
    { range: [34, 40], command: TreasureRing.Invisibility },
    { range: [41, 43], command: TreasureRing.MammalControl },
    { range: [44], command: TreasureRing.MultipleWishes },
    { range: [45, 60], command: TreasureRing.Protection },
    { range: [61], command: TreasureRing.Regeneration },
    { range: [62, 63], command: TreasureRing.ShootingStars },
    { range: [64, 65], command: TreasureRing.SpellStoring },
    { range: [66, 69], command: TreasureRing.SpellTurning },
    { range: [70, 75], command: TreasureRing.Swimming },
    { range: [76, 77], command: TreasureRing.Telekinesis },
    { range: [78, 79], command: TreasureRing.ThreeWishes },
    { range: [80, 85], command: TreasureRing.Warmth },
    { range: [86, 90], command: TreasureRing.WaterWalking },
    { range: [91, 98], command: TreasureRing.Weakness },
    { range: [99], command: TreasureRing.Wizardry },
    { range: [100], command: TreasureRing.XRayVision },
  ],
};

export enum TreasureRingContrariness {
  Flying,
  Invisibility,
  Levitation,
  ShockingGrasp,
  SpellTurning,
  Strength,
}

export const treasureRingContrariness: Table<TreasureRingContrariness> = {
  sides: 100,
  entries: [
    { range: [1, 20], command: TreasureRingContrariness.Flying },
    { range: [21, 40], command: TreasureRingContrariness.Invisibility },
    { range: [41, 60], command: TreasureRingContrariness.Levitation },
    { range: [61, 70], command: TreasureRingContrariness.ShockingGrasp },
    { range: [71, 80], command: TreasureRingContrariness.SpellTurning },
    { range: [81, 100], command: TreasureRingContrariness.Strength },
  ],
};

export enum TreasureRingElementalCommand {
  Air,
  Earth,
  Fire,
  Water,
}

export const treasureRingElementalCommand: Table<TreasureRingElementalCommand> =
  {
    sides: 4,
    entries: [
      { range: [1], command: TreasureRingElementalCommand.Air },
      { range: [2], command: TreasureRingElementalCommand.Earth },
      { range: [3], command: TreasureRingElementalCommand.Fire },
      { range: [4], command: TreasureRingElementalCommand.Water },
    ],
  };

export enum TreasureRingProtection {
  PlusOne,
  PlusTwo,
  PlusTwoRadius,
  PlusThree,
  PlusThreeRadius,
  PlusFourTwo,
  PlusSixOne,
}

export const treasureRingProtection: Table<TreasureRingProtection> = {
  sides: 100,
  entries: [
    { range: [1, 70], command: TreasureRingProtection.PlusOne },
    { range: [71, 82], command: TreasureRingProtection.PlusTwo },
    { range: [83], command: TreasureRingProtection.PlusTwoRadius },
    { range: [84, 90], command: TreasureRingProtection.PlusThree },
    { range: [91], command: TreasureRingProtection.PlusThreeRadius },
    { range: [92, 97], command: TreasureRingProtection.PlusFourTwo },
    { range: [98, 100], command: TreasureRingProtection.PlusSixOne },
  ],
};

export enum TreasureRingRegeneration {
  Standard,
  Vampiric,
}

export const treasureRingRegeneration: Table<TreasureRingRegeneration> = {
  sides: 100,
  entries: [
    { range: [1, 90], command: TreasureRingRegeneration.Standard },
    { range: [91, 100], command: TreasureRingRegeneration.Vampiric },
  ],
};

export enum TreasureRingTelekinesis {
  TwoHundredFifty,
  FiveHundred,
  OneThousand,
  TwoThousand,
  FourThousand,
}

export const treasureRingTelekinesis: Table<TreasureRingTelekinesis> = {
  sides: 100,
  entries: [
    { range: [1, 25], command: TreasureRingTelekinesis.TwoHundredFifty },
    { range: [26, 50], command: TreasureRingTelekinesis.FiveHundred },
    { range: [51, 89], command: TreasureRingTelekinesis.OneThousand },
    { range: [90, 99], command: TreasureRingTelekinesis.TwoThousand },
    { range: [100], command: TreasureRingTelekinesis.FourThousand },
  ],
};

export enum TreasureRingThreeWishes {
  Limited,
  Standard,
}

export const treasureRingThreeWishes: Table<TreasureRingThreeWishes> = {
  sides: 100,
  entries: [
    { range: [1, 25], command: TreasureRingThreeWishes.Limited },
    { range: [26, 100], command: TreasureRingThreeWishes.Standard },
  ],
};

export enum TreasureRingWizardry {
  DoubleFirst,
  DoubleSecond,
  DoubleThird,
  DoubleFirstSecond,
  DoubleFourth,
  DoubleFifth,
  DoubleFirstThroughThird,
  DoubleFourthFifth,
}

export const treasureRingWizardry: Table<TreasureRingWizardry> = {
  sides: 100,
  entries: [
    { range: [1, 50], command: TreasureRingWizardry.DoubleFirst },
    { range: [51, 75], command: TreasureRingWizardry.DoubleSecond },
    { range: [76, 82], command: TreasureRingWizardry.DoubleThird },
    { range: [83, 88], command: TreasureRingWizardry.DoubleFirstSecond },
    { range: [89, 92], command: TreasureRingWizardry.DoubleFourth },
    { range: [93, 95], command: TreasureRingWizardry.DoubleFifth },
    { range: [96, 99], command: TreasureRingWizardry.DoubleFirstThroughThird },
    { range: [100], command: TreasureRingWizardry.DoubleFourthFifth },
  ],
};
