import type { Table } from './dungeonTypes';

export enum RobeOfUsefulItemsExtraPatch {
  BagOfGoldPieces,
  CofferSilver,
  DoorIron,
  Gems,
  LadderWooden,
  MuleWithSaddlebags,
  Pit,
  PotionExtraHealing,
  Rowboat,
  ScrollOfOneSpell,
  WarDogsPair,
  Window,
  RollTwiceMore,
}

export const treasureRobeOfUsefulItems: Table<RobeOfUsefulItemsExtraPatch> = {
  sides: 100,
  entries: [
    { range: [1, 8], command: RobeOfUsefulItemsExtraPatch.BagOfGoldPieces },
    { range: [9, 15], command: RobeOfUsefulItemsExtraPatch.CofferSilver },
    { range: [16, 22], command: RobeOfUsefulItemsExtraPatch.DoorIron },
    { range: [23, 30], command: RobeOfUsefulItemsExtraPatch.Gems },
    { range: [31, 44], command: RobeOfUsefulItemsExtraPatch.LadderWooden },
    {
      range: [45, 51],
      command: RobeOfUsefulItemsExtraPatch.MuleWithSaddlebags,
    },
    { range: [52, 59], command: RobeOfUsefulItemsExtraPatch.Pit },
    {
      range: [60, 68],
      command: RobeOfUsefulItemsExtraPatch.PotionExtraHealing,
    },
    { range: [69, 75], command: RobeOfUsefulItemsExtraPatch.Rowboat },
    {
      range: [76, 83],
      command: RobeOfUsefulItemsExtraPatch.ScrollOfOneSpell,
    },
    { range: [84, 90], command: RobeOfUsefulItemsExtraPatch.WarDogsPair },
    { range: [91, 96], command: RobeOfUsefulItemsExtraPatch.Window },
    { range: [97, 100], command: RobeOfUsefulItemsExtraPatch.RollTwiceMore },
  ],
};
