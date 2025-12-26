import type { Table } from '../../../../tables/dungeon/dungeonTypes';

export enum MonsterNine {
  Character,
  DevilPitFiend,
  Dragon,
  GiantStorm_1to2,
  GolemStone,
  Hydra_17to20Heads,
  HydraPyro_12Heads,
  MoldBrown,
  MoldYellow,
  Nycadaemon,
  PurpleWorm,
  RustMonster,
  TitanLesser,
  TitanMinor,
  UmberHulk_1to4,
  Vampire,
  WillOWisp_2to5,
  Xorn_2to9,
}

export const monsterNine: Table<MonsterNine> = {
  sides: 100,
  entries: [
    { range: [1, 9], command: MonsterNine.Character },
    { range: [10, 12], command: MonsterNine.DevilPitFiend },
    { range: [13, 15], command: MonsterNine.Dragon },
    { range: [16, 21], command: MonsterNine.GiantStorm_1to2 },
    { range: [22, 23], command: MonsterNine.GolemStone },
    { range: [24, 30], command: MonsterNine.Hydra_17to20Heads },
    { range: [31, 33], command: MonsterNine.HydraPyro_12Heads },
    { range: [34, 40], command: MonsterNine.MoldBrown },
    { range: [41, 50], command: MonsterNine.MoldYellow },
    { range: [51, 52], command: MonsterNine.Nycadaemon },
    { range: [53, 64], command: MonsterNine.PurpleWorm },
    { range: [65, 67], command: MonsterNine.RustMonster },
    { range: [68, 69], command: MonsterNine.TitanLesser },
    { range: [70, 73], command: MonsterNine.TitanMinor },
    { range: [74, 80], command: MonsterNine.UmberHulk_1to4 },
    { range: [81, 83], command: MonsterNine.Vampire },
    { range: [84, 93], command: MonsterNine.WillOWisp_2to5 },
    { range: [94, 100], command: MonsterNine.Xorn_2to9 },
  ],
};

export enum DragonNine {
  Black_Ancient_8_Old_6,
  Blue_Ancient_8,
  Brass_Ancient_8_Old_6,
  Bronze_Ancient_8,
  Copper_Ancient_8,
  Gold_Ancient_8,
  Green_Ancient_8,
  Red_Ancient_8,
  Silver_Ancient_8,
  White_Ancient_8_VeryOld_7,
}

export const dragonNine: Table<DragonNine> = {
  sides: 100,
  entries: [
    { range: [1, 10], command: DragonNine.Black_Ancient_8_Old_6 },
    { range: [11, 22], command: DragonNine.Blue_Ancient_8 },
    { range: [23, 31], command: DragonNine.Brass_Ancient_8_Old_6 },
    { range: [32, 34], command: DragonNine.Bronze_Ancient_8 },
    { range: [35, 42], command: DragonNine.Copper_Ancient_8 },
    { range: [43, 46], command: DragonNine.Gold_Ancient_8 },
    { range: [47, 62], command: DragonNine.Green_Ancient_8 },
    { range: [63, 78], command: DragonNine.Red_Ancient_8 },
    { range: [79, 82], command: DragonNine.Silver_Ancient_8 },
    { range: [83, 100], command: DragonNine.White_Ancient_8_VeryOld_7 },
  ],
};
