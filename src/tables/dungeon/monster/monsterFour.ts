import type { Table } from "../dungeonTypes";

export enum MonsterFour {
  ApeCarnivorous_1to3,
  BlinkDog_2to5,
  Character,
  DragonYounger,
  DragonOlder,
  Gargoyle_1to2,
  Ghast_1to4,
  GrayOoze,
  Hellhound_1to2,
  Hydra_5to6Heads,
  HydroPyro_5Heads,
  LycanthropeWerewolf_1to2,
  MoldYellow,
  Owlbear_1to2,
  RustMonster,
  Shadow_1to3,
  SnakeGiantConstrictor,
  SuMonster_1to2,
  ToadIce,
  ToadPoisonous_1to3,
}

export const monsterFour: Table<MonsterFour> = {
  sides: 100,
  entries: [
    { range: [1, 8], command: MonsterFour.ApeCarnivorous_1to3 },
    { range: [9, 14], command: MonsterFour.BlinkDog_2to5 },
    { range: [15, 22], command: MonsterFour.Character },
    { range: [23], command: MonsterFour.DragonYounger },
    { range: [24], command: MonsterFour.DragonOlder },
    { range: [25, 30], command: MonsterFour.Gargoyle_1to2 },
    { range: [31, 36], command: MonsterFour.Ghast_1to4 },
    { range: [37, 40], command: MonsterFour.GrayOoze },
    { range: [41, 44], command: MonsterFour.Hellhound_1to2 },
    { range: [45, 47], command: MonsterFour.Hydra_5to6Heads },
    { range: [48], command: MonsterFour.HydroPyro_5Heads },
    { range: [49, 62], command: MonsterFour.LycanthropeWerewolf_1to2 },
    { range: [63, 75], command: MonsterFour.MoldYellow },
    { range: [76, 78], command: MonsterFour.Owlbear_1to2 },
    { range: [79], command: MonsterFour.RustMonster },
    { range: [80, 82], command: MonsterFour.Shadow_1to3 },
    { range: [83, 90], command: MonsterFour.SnakeGiantConstrictor },
    { range: [91, 94], command: MonsterFour.SuMonster_1to2 },
    { range: [95, 96], command: MonsterFour.ToadIce },
    { range: [97, 100], command: MonsterFour.ToadPoisonous_1to3 },
  ],
};

export enum DragonFourYounger {
  Black_Young_2,
  Blue_VeryYoung_1,
  Brass_Young_2,
  Bronze_VeryYoung_1,
  Copper_VeryYoung_1,
  Gold_VeryYoung_1,
  Green_VeryYoung_1,
  Red_VeryYoung_1,
  Silver_VeryYoung_1,
  White_Young_2,
}

export const dragonFourYounger: Table<DragonFourYounger> = {
  sides: 100,
  entries: [
    { range: [1, 9], command: DragonFourYounger.Black_Young_2 },
    { range: [10, 20], command: DragonFourYounger.Blue_VeryYoung_1 },
    { range: [21, 30], command: DragonFourYounger.Brass_Young_2 },
    { range: [31, 37], command: DragonFourYounger.Bronze_VeryYoung_1 },
    { range: [38, 50], command: DragonFourYounger.Copper_VeryYoung_1 },
    { range: [51, 54], command: DragonFourYounger.Gold_VeryYoung_1 },
    { range: [55, 70], command: DragonFourYounger.Green_VeryYoung_1 },
    { range: [71, 80], command: DragonFourYounger.Red_VeryYoung_1 },
    { range: [81, 88], command: DragonFourYounger.Silver_VeryYoung_1 },
    { range: [89, 100], command: DragonFourYounger.White_Young_2 },
  ],
};

export enum DragonFourOlder {
  Black_SubAdult_3,
  Blue_Young_2,
  Brass_SubAdult_3,
  Bronze_Young_2,
  Copper_Young_2,
  Gold_Young_2,
  Green_Young_2,
  Red_Young_2,
  Silver_Young_2,
  White_SubAdult_3,
}

export const dragonFourOlder: Table<DragonFourOlder> = {
  sides: 100,
  entries: [
    { range: [1, 9], command: DragonFourOlder.Black_SubAdult_3 },
    { range: [10, 20], command: DragonFourOlder.Blue_Young_2 },
    { range: [21, 30], command: DragonFourOlder.Brass_SubAdult_3 },
    { range: [31, 37], command: DragonFourOlder.Bronze_Young_2 },
    { range: [38, 50], command: DragonFourOlder.Copper_Young_2 },
    { range: [51, 54], command: DragonFourOlder.Gold_Young_2 },
    { range: [55, 70], command: DragonFourOlder.Green_Young_2 },
    { range: [71, 80], command: DragonFourOlder.Red_Young_2 },
    { range: [81, 88], command: DragonFourOlder.Silver_Young_2 },
    { range: [89, 100], command: DragonFourOlder.White_SubAdult_3 },
  ],
};
