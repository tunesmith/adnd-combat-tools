import type { Table } from './dungeonTypes';

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
    { range: [17, 18], command: NECKLACE_CONFIGS.oneNineTwoSevenTwoFiveTwoThree },
    { range: [19], command: NECKLACE_CONFIGS.oneTenTwoEightTwoSixFourFour },
    {
      range: [20],
      command: NECKLACE_CONFIGS.oneElevenTwoNineTwoSevenTwoFiveTwoThree,
    },
  ],
};
