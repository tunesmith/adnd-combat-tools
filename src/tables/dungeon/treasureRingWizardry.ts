import type { Table } from './dungeonTypes';

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
