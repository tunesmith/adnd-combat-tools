import type { Table } from '../../../../tables/dungeon/dungeonTypes';

export enum TreasureManualOfGolems {
  Clay,
  Flesh,
  Iron,
  Stone,
}

export const treasureManualOfGolems: Table<TreasureManualOfGolems> = {
  sides: 20,
  entries: [
    { range: [1, 5], command: TreasureManualOfGolems.Clay },
    { range: [6, 17], command: TreasureManualOfGolems.Flesh },
    { range: [18], command: TreasureManualOfGolems.Iron },
    { range: [19, 20], command: TreasureManualOfGolems.Stone },
  ],
};

export enum TreasureMedallionRange {
  ThirtyFeet,
  ThirtyFeetWithEmpathy,
  SixtyFeet,
  NinetyFeet,
}

export const treasureMedallionRange: Table<TreasureMedallionRange> = {
  sides: 20,
  entries: [
    { range: [1, 15], command: TreasureMedallionRange.ThirtyFeet },
    {
      range: [16, 18],
      command: TreasureMedallionRange.ThirtyFeetWithEmpathy,
    },
    { range: [19], command: TreasureMedallionRange.SixtyFeet },
    { range: [20], command: TreasureMedallionRange.NinetyFeet },
  ],
};

export type TreasureNecklaceMissile = {
  dice: number;
  count: number;
};

export type TreasureNecklaceOfMissiles = {
  missiles: readonly TreasureNecklaceMissile[];
};

const NECKLACE_CONFIGS: Record<
  | 'oneFiveTwoThree'
  | 'oneSixTwoFourTwoTwo'
  | 'oneSevenTwoFiveFourThree'
  | 'oneEightTwoSixTwoFourFourTwo'
  | 'oneNineTwoSevenTwoFiveTwoThree'
  | 'oneTenTwoEightTwoSixFourFour'
  | 'oneElevenTwoNineTwoSevenTwoFiveTwoThree',
  TreasureNecklaceOfMissiles
> = {
  oneFiveTwoThree: {
    missiles: [
      { dice: 5, count: 1 },
      { dice: 3, count: 2 },
    ],
  },
  oneSixTwoFourTwoTwo: {
    missiles: [
      { dice: 6, count: 1 },
      { dice: 4, count: 2 },
      { dice: 2, count: 2 },
    ],
  },
  oneSevenTwoFiveFourThree: {
    missiles: [
      { dice: 7, count: 1 },
      { dice: 5, count: 2 },
      { dice: 3, count: 4 },
    ],
  },
  oneEightTwoSixTwoFourFourTwo: {
    missiles: [
      { dice: 8, count: 1 },
      { dice: 6, count: 2 },
      { dice: 4, count: 2 },
      { dice: 2, count: 4 },
    ],
  },
  oneNineTwoSevenTwoFiveTwoThree: {
    missiles: [
      { dice: 9, count: 1 },
      { dice: 7, count: 2 },
      { dice: 5, count: 2 },
      { dice: 3, count: 2 },
    ],
  },
  oneTenTwoEightTwoSixFourFour: {
    missiles: [
      { dice: 10, count: 1 },
      { dice: 8, count: 2 },
      { dice: 6, count: 2 },
      { dice: 4, count: 4 },
    ],
  },
  oneElevenTwoNineTwoSevenTwoFiveTwoThree: {
    missiles: [
      { dice: 11, count: 1 },
      { dice: 9, count: 2 },
      { dice: 7, count: 2 },
      { dice: 5, count: 2 },
      { dice: 3, count: 2 },
    ],
  },
};

export const treasureNecklaceOfMissiles: Table<TreasureNecklaceOfMissiles> = {
  sides: 20,
  entries: [
    { range: [1, 4], command: NECKLACE_CONFIGS.oneFiveTwoThree },
    { range: [5, 8], command: NECKLACE_CONFIGS.oneSixTwoFourTwoTwo },
    { range: [9, 12], command: NECKLACE_CONFIGS.oneSevenTwoFiveFourThree },
    { range: [13, 16], command: NECKLACE_CONFIGS.oneEightTwoSixTwoFourFourTwo },
    {
      range: [17, 18],
      command: NECKLACE_CONFIGS.oneNineTwoSevenTwoFiveTwoThree,
    },
    { range: [19], command: NECKLACE_CONFIGS.oneTenTwoEightTwoSixFourFour },
    {
      range: [20],
      command: NECKLACE_CONFIGS.oneElevenTwoNineTwoSevenTwoFiveTwoThree,
    },
  ],
};

export enum TreasureNecklacePrayerBead {
  Atonement,
  Blessing,
  Curing,
  Karma,
  Summons,
  WindWalking,
}

export const treasureNecklacePrayerBeads: Table<TreasureNecklacePrayerBead> = {
  sides: 20,
  entries: [
    { range: [1, 5], command: TreasureNecklacePrayerBead.Atonement },
    { range: [6, 10], command: TreasureNecklacePrayerBead.Blessing },
    { range: [11, 15], command: TreasureNecklacePrayerBead.Curing },
    { range: [16, 17], command: TreasureNecklacePrayerBead.Karma },
    { range: [18], command: TreasureNecklacePrayerBead.Summons },
    { range: [19, 20], command: TreasureNecklacePrayerBead.WindWalking },
  ],
};

export enum TreasurePearlOfPowerEffect {
  Forgetting,
  Recall,
}

export enum TreasurePearlOfPowerRecall {
  Recall1stLevel,
  Recall2ndLevel,
  Recall3rdLevel,
  Recall4thLevel,
  Recall5thLevel,
  Recall6thLevel,
  Recall7thLevel,
  Recall8thLevel,
  Recall9thLevel,
  RecallTwoByDie,
}

export type TreasurePearlOfPowerRecallResult =
  | { type: 'single'; level: number }
  | { type: 'double'; level: number };

export const treasurePearlOfPowerEffect: Table<TreasurePearlOfPowerEffect> = {
  sides: 20,
  entries: [
    { range: [1], command: TreasurePearlOfPowerEffect.Forgetting },
    { range: [2, 20], command: TreasurePearlOfPowerEffect.Recall },
  ],
};

export const treasurePearlOfPowerRecall: Table<TreasurePearlOfPowerRecall> = {
  sides: 100,
  entries: [
    { range: [1, 25], command: TreasurePearlOfPowerRecall.Recall1stLevel },
    { range: [26, 45], command: TreasurePearlOfPowerRecall.Recall2ndLevel },
    { range: [46, 60], command: TreasurePearlOfPowerRecall.Recall3rdLevel },
    { range: [61, 75], command: TreasurePearlOfPowerRecall.Recall4thLevel },
    { range: [76, 85], command: TreasurePearlOfPowerRecall.Recall5thLevel },
    { range: [86, 92], command: TreasurePearlOfPowerRecall.Recall6thLevel },
    { range: [93, 96], command: TreasurePearlOfPowerRecall.Recall7thLevel },
    { range: [97, 98], command: TreasurePearlOfPowerRecall.Recall8thLevel },
    { range: [99], command: TreasurePearlOfPowerRecall.Recall9thLevel },
    { range: [100], command: TreasurePearlOfPowerRecall.RecallTwoByDie },
  ],
};

export function resolvePearlRecallResult(
  command: TreasurePearlOfPowerRecall,
  rollD6: () => number
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
    case TreasurePearlOfPowerRecall.RecallTwoByDie: {
      const level = Math.max(1, Math.min(6, rollD6()));
      return { type: 'double', level };
    }
    default:
      return { type: 'single', level: 1 };
  }
}

export enum TreasurePearlOfWisdomOutcome {
  LoseOne,
  GainOne,
}

export const treasurePearlOfWisdom: Table<TreasurePearlOfWisdomOutcome> = {
  sides: 20,
  entries: [
    { range: [1], command: TreasurePearlOfWisdomOutcome.LoseOne },
    { range: [2, 20], command: TreasurePearlOfWisdomOutcome.GainOne },
  ],
};

export enum TreasurePeriaptPoisonBonus {
  PlusOne = 1,
  PlusTwo,
  PlusThree,
  PlusFour,
}

export const treasurePeriaptPoisonBonus: Table<TreasurePeriaptPoisonBonus> = {
  sides: 20,
  entries: [
    { range: [1, 8], command: TreasurePeriaptPoisonBonus.PlusOne },
    { range: [9, 14], command: TreasurePeriaptPoisonBonus.PlusTwo },
    { range: [15, 18], command: TreasurePeriaptPoisonBonus.PlusThree },
    { range: [19, 20], command: TreasurePeriaptPoisonBonus.PlusFour },
  ],
};

export enum TreasurePhylacteryLongYearsOutcome {
  FastAging,
  SlowAging,
}

export const treasurePhylacteryLongYears: Table<TreasurePhylacteryLongYearsOutcome> =
  {
    sides: 20,
    entries: [
      { range: [1], command: TreasurePhylacteryLongYearsOutcome.FastAging },
      { range: [2, 20], command: TreasurePhylacteryLongYearsOutcome.SlowAging },
    ],
  };

export enum TreasureQuaalFeatherToken {
  Anchor,
  Bird,
  Fan,
  SwanBoat,
  Tree,
  Whip,
}

export const treasureQuaalFeatherToken: Table<TreasureQuaalFeatherToken> = {
  sides: 20,
  entries: [
    { range: [1, 4], command: TreasureQuaalFeatherToken.Anchor },
    { range: [5, 7], command: TreasureQuaalFeatherToken.Bird },
    { range: [8, 10], command: TreasureQuaalFeatherToken.Fan },
    { range: [11, 13], command: TreasureQuaalFeatherToken.SwanBoat },
    { range: [14, 18], command: TreasureQuaalFeatherToken.Tree },
    { range: [19, 20], command: TreasureQuaalFeatherToken.Whip },
  ],
};
