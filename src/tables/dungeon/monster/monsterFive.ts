import type { Table } from '../dungeonTypes';

export enum MonsterFive {
  Character,
  Cockatrice_1to2,
  DisplacerBeast_1to2,
  Doppleganger_1to3,
  DragonYounger,
  DragonOlder,
  Hydra_7Heads,
  HydraPyro_6Heads,
  Imp_1to2,
  Leucrotta_1to2,
  LizardSubterranean_1to3,
  LycanthropeWereboar_1to3,
  Minotaur_1to3,
  MoldYellow,
  Quasit,
  RustMonster,
  Shrieker_2to5,
  SlitheringTracker,
  SnakeGiantAmphisbaena,
  SnakeGiantPoisonous,
  SnakeGiantSpitting,
  SpiderGiant_1to2,
}

export const monsterFive: Table<MonsterFive> = {
  sides: 100,
  entries: [
    { range: [1, 8], command: MonsterFive.Character },
    { range: [9, 15], command: MonsterFive.Cockatrice_1to2 },
    { range: [16, 18], command: MonsterFive.DisplacerBeast_1to2 },
    { range: [19, 22], command: MonsterFive.Doppleganger_1to3 },
    { range: [23], command: MonsterFive.DragonYounger },
    { range: [24], command: MonsterFive.DragonOlder },
    { range: [25, 26], command: MonsterFive.Hydra_7Heads },
    { range: [27], command: MonsterFive.HydraPyro_6Heads },
    { range: [28], command: MonsterFive.Imp_1to2 },
    { range: [29, 31], command: MonsterFive.Leucrotta_1to2 },
    { range: [32, 50], command: MonsterFive.LizardSubterranean_1to3 },
    { range: [51, 52], command: MonsterFive.LycanthropeWereboar_1to3 },
    { range: [53, 60], command: MonsterFive.Minotaur_1to3 },
    { range: [61, 64], command: MonsterFive.MoldYellow },
    { range: [65], command: MonsterFive.Quasit },
    { range: [66, 67], command: MonsterFive.RustMonster },
    { range: [68, 70], command: MonsterFive.Shrieker_2to5 },
    { range: [71, 72], command: MonsterFive.SlitheringTracker },
    { range: [73, 74], command: MonsterFive.SnakeGiantAmphisbaena },
    { range: [75, 82], command: MonsterFive.SnakeGiantPoisonous },
    { range: [83, 86], command: MonsterFive.SnakeGiantSpitting },
    { range: [87, 100], command: MonsterFive.SpiderGiant_1to2 },
  ],
};

export enum DragonFiveYounger {
  Black_YoungAdult_4,
  Blue_SubAdult_3,
  Brass_YoungAdult_4,
  Bronze_SubAdult_3,
  Copper_SubAdult_3,
  Gold_SubAdult_3,
  Green_SubAdult_3,
  Red_SubAdult_3,
  Silver_SubAdult_3,
  White_YoungAdult_4,
}

export const dragonFiveYounger: Table<DragonFiveYounger> = {
  sides: 100,
  entries: [
    { range: [1, 8], command: DragonFiveYounger.Black_YoungAdult_4 },
    { range: [9, 20], command: DragonFiveYounger.Blue_SubAdult_3 },
    { range: [21, 30], command: DragonFiveYounger.Brass_YoungAdult_4 },
    { range: [31, 37], command: DragonFiveYounger.Bronze_SubAdult_3 },
    { range: [38, 50], command: DragonFiveYounger.Copper_SubAdult_3 },
    { range: [51, 54], command: DragonFiveYounger.Gold_SubAdult_3 },
    { range: [55, 70], command: DragonFiveYounger.Green_SubAdult_3 },
    { range: [71, 80], command: DragonFiveYounger.Red_SubAdult_3 },
    { range: [81, 88], command: DragonFiveYounger.Silver_SubAdult_3 },
    { range: [89, 100], command: DragonFiveYounger.White_YoungAdult_4 },
  ],
};

export enum DragonFiveOlder {
  Black_Adult_5,
  Blue_YoungAdult_4,
  Brass_Adult_5,
  Bronze_YoungAdult_4,
  Copper_YoungAdult_4,
  Gold_YoungAdult_4,
  Green_YoungAdult_4,
  Red_YoungAdult_4,
  Silver_YoungAdult_4,
  White_Adult_5,
}

export const dragonFiveOlder: Table<DragonFiveOlder> = {
  sides: 100,
  entries: [
    { range: [1, 8], command: DragonFiveOlder.Black_Adult_5 },
    { range: [9, 20], command: DragonFiveOlder.Blue_YoungAdult_4 },
    { range: [21, 30], command: DragonFiveOlder.Brass_Adult_5 },
    { range: [31, 37], command: DragonFiveOlder.Bronze_YoungAdult_4 },
    { range: [38, 50], command: DragonFiveOlder.Copper_YoungAdult_4 },
    { range: [51, 54], command: DragonFiveOlder.Gold_YoungAdult_4 },
    { range: [55, 70], command: DragonFiveOlder.Green_YoungAdult_4 },
    { range: [71, 80], command: DragonFiveOlder.Red_YoungAdult_4 },
    { range: [81, 88], command: DragonFiveOlder.Silver_YoungAdult_4 },
    { range: [89, 100], command: DragonFiveOlder.White_Adult_5 },
  ],
};
