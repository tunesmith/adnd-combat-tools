import type { Table } from './dungeonTypes';

export enum TreasurePotionAnimalControl {
  MammalMarsupial,
  Avian,
  ReptileAmphibian,
  Fish,
  MammalMarsupialAvian,
  ReptileAmphibianFish,
  AnyAnimal,
}

export const treasurePotionAnimalControl: Table<TreasurePotionAnimalControl> = {
  sides: 20,
  entries: [
    { range: [1, 4], command: TreasurePotionAnimalControl.MammalMarsupial },
    { range: [5, 8], command: TreasurePotionAnimalControl.Avian },
    { range: [9, 12], command: TreasurePotionAnimalControl.ReptileAmphibian },
    { range: [13, 15], command: TreasurePotionAnimalControl.Fish },
    {
      range: [16, 17],
      command: TreasurePotionAnimalControl.MammalMarsupialAvian,
    },
    {
      range: [18, 19],
      command: TreasurePotionAnimalControl.ReptileAmphibianFish,
    },
    { range: [20], command: TreasurePotionAnimalControl.AnyAnimal },
  ],
};
