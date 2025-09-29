import type { Table } from './dungeonTypes';

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
