import type { Table } from './dungeonTypes';

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
