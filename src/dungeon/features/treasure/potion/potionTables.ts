import type { Table } from '../../../../tables/dungeon/dungeonTypes';

export enum TreasurePotion {
  AnimalControl,
  Clairaudience,
  Clairvoyance,
  Climbing,
  Delusion,
  Diminution,
  DragonControl,
  ESP,
  ExtraHealing,
  FireResistance,
  Flying,
  GaseousForm,
  GiantControl,
  GiantStrength,
  Growth,
  Healing,
  Heroism,
  HumanControl,
  Invisibility,
  Invulnerability,
  Levitation,
  Longevity,
  OilOfEtherealness,
  OilOfSlipperiness,
  PhiltreOfLove,
  PhiltreOfPersuasiveness,
  PlantControl,
  PolymorphSelf,
  Poison,
  Speed,
  SuperHeroism,
  SweetWater,
  TreasureFinding,
  UndeadControl,
  WaterBreathing,
}

export const treasurePotion: Table<TreasurePotion> = {
  sides: 100,
  entries: [
    { range: [1, 3], command: TreasurePotion.AnimalControl },
    { range: [4, 6], command: TreasurePotion.Clairaudience },
    { range: [7, 9], command: TreasurePotion.Clairvoyance },
    { range: [10, 12], command: TreasurePotion.Climbing },
    { range: [13, 15], command: TreasurePotion.Delusion },
    { range: [16, 18], command: TreasurePotion.Diminution },
    { range: [19, 20], command: TreasurePotion.DragonControl },
    { range: [21, 23], command: TreasurePotion.ESP },
    { range: [24, 26], command: TreasurePotion.ExtraHealing },
    { range: [27, 29], command: TreasurePotion.FireResistance },
    { range: [30, 32], command: TreasurePotion.Flying },
    { range: [33, 34], command: TreasurePotion.GaseousForm },
    { range: [35, 36], command: TreasurePotion.GiantControl },
    { range: [37, 39], command: TreasurePotion.GiantStrength },
    { range: [40, 41], command: TreasurePotion.Growth },
    { range: [42, 47], command: TreasurePotion.Healing },
    { range: [48, 49], command: TreasurePotion.Heroism },
    { range: [50, 51], command: TreasurePotion.HumanControl },
    { range: [52, 54], command: TreasurePotion.Invisibility },
    { range: [55, 57], command: TreasurePotion.Invulnerability },
    { range: [58, 60], command: TreasurePotion.Levitation },
    { range: [61, 63], command: TreasurePotion.Longevity },
    { range: [64, 66], command: TreasurePotion.OilOfEtherealness },
    { range: [67, 69], command: TreasurePotion.OilOfSlipperiness },
    { range: [70, 72], command: TreasurePotion.PhiltreOfLove },
    { range: [73, 75], command: TreasurePotion.PhiltreOfPersuasiveness },
    { range: [76, 78], command: TreasurePotion.PlantControl },
    { range: [79, 81], command: TreasurePotion.PolymorphSelf },
    { range: [82, 84], command: TreasurePotion.Poison },
    { range: [85, 87], command: TreasurePotion.Speed },
    { range: [88, 90], command: TreasurePotion.SuperHeroism },
    { range: [91, 93], command: TreasurePotion.SweetWater },
    { range: [94, 96], command: TreasurePotion.TreasureFinding },
    { range: [97], command: TreasurePotion.UndeadControl },
    { range: [98, 100], command: TreasurePotion.WaterBreathing },
  ],
};

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

export enum TreasurePotionDragonControl {
  White,
  Black,
  Green,
  Blue,
  Red,
  Brass,
  Copper,
  Bronze,
  Silver,
  Gold,
  Evil,
  Good,
}

export const treasurePotionDragonControl: Table<TreasurePotionDragonControl> = {
  sides: 20,
  entries: [
    { range: [1, 2], command: TreasurePotionDragonControl.White },
    { range: [3, 4], command: TreasurePotionDragonControl.Black },
    { range: [5, 7], command: TreasurePotionDragonControl.Green },
    { range: [8, 9], command: TreasurePotionDragonControl.Blue },
    { range: [10], command: TreasurePotionDragonControl.Red },
    { range: [11, 12], command: TreasurePotionDragonControl.Brass },
    { range: [13, 14], command: TreasurePotionDragonControl.Copper },
    { range: [15], command: TreasurePotionDragonControl.Bronze },
    { range: [16], command: TreasurePotionDragonControl.Silver },
    { range: [17], command: TreasurePotionDragonControl.Gold },
    { range: [18, 19], command: TreasurePotionDragonControl.Evil },
    { range: [20], command: TreasurePotionDragonControl.Good },
  ],
};

export enum TreasurePotionGiantControl {
  Hill,
  Stone,
  Frost,
  Fire,
  Cloud,
  Storm,
}

export const treasurePotionGiantControl: Table<TreasurePotionGiantControl> = {
  sides: 20,
  entries: [
    { range: [1, 5], command: TreasurePotionGiantControl.Hill },
    { range: [6, 9], command: TreasurePotionGiantControl.Stone },
    { range: [10, 13], command: TreasurePotionGiantControl.Frost },
    { range: [14, 17], command: TreasurePotionGiantControl.Fire },
    { range: [18, 19], command: TreasurePotionGiantControl.Cloud },
    { range: [20], command: TreasurePotionGiantControl.Storm },
  ],
};

export enum TreasurePotionGiantStrength {
  Hill,
  Stone,
  Frost,
  Fire,
  Cloud,
  Storm,
}

export const treasurePotionGiantStrength: Table<TreasurePotionGiantStrength> = {
  sides: 20,
  entries: [
    { range: [1, 6], command: TreasurePotionGiantStrength.Hill },
    { range: [7, 10], command: TreasurePotionGiantStrength.Stone },
    { range: [11, 14], command: TreasurePotionGiantStrength.Frost },
    { range: [15, 17], command: TreasurePotionGiantStrength.Fire },
    { range: [18, 19], command: TreasurePotionGiantStrength.Cloud },
    { range: [20], command: TreasurePotionGiantStrength.Storm },
  ],
};

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

export enum TreasurePotionUndeadControl {
  Ghasts,
  Ghosts,
  Ghouls,
  Shadows,
  Skeletons,
  Spectres,
  Wights,
  Wraiths,
  Vampires,
  Zombies,
}

export const treasurePotionUndeadControl: Table<TreasurePotionUndeadControl> = {
  sides: 10,
  entries: [
    { range: [1], command: TreasurePotionUndeadControl.Ghasts },
    { range: [2], command: TreasurePotionUndeadControl.Ghosts },
    { range: [3], command: TreasurePotionUndeadControl.Ghouls },
    { range: [4], command: TreasurePotionUndeadControl.Shadows },
    { range: [5], command: TreasurePotionUndeadControl.Skeletons },
    { range: [6], command: TreasurePotionUndeadControl.Spectres },
    { range: [7], command: TreasurePotionUndeadControl.Wights },
    { range: [8], command: TreasurePotionUndeadControl.Wraiths },
    { range: [9], command: TreasurePotionUndeadControl.Vampires },
    { range: [10], command: TreasurePotionUndeadControl.Zombies },
  ],
};
