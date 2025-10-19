import type { Table } from './dungeonTypes';

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
