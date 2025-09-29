import type { Table } from './dungeonTypes';

export enum TreasurePotionHumanControl {
  Dwarves,
  ElvesHalfElves,
  Gnomes,
  Halflings,
  HalfOrcs,
  Humans,
  Humanoids,
  AlliedElvesHumans,
}

export const treasurePotionHumanControl: Table<TreasurePotionHumanControl> = {
  sides: 20,
  entries: [
    { range: [1, 2], command: TreasurePotionHumanControl.Dwarves },
    { range: [3, 4], command: TreasurePotionHumanControl.ElvesHalfElves },
    { range: [5, 6], command: TreasurePotionHumanControl.Gnomes },
    { range: [7, 8], command: TreasurePotionHumanControl.Halflings },
    { range: [9, 10], command: TreasurePotionHumanControl.HalfOrcs },
    { range: [11, 16], command: TreasurePotionHumanControl.Humans },
    { range: [17, 19], command: TreasurePotionHumanControl.Humanoids },
    { range: [20], command: TreasurePotionHumanControl.AlliedElvesHumans },
  ],
};
