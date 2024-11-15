import { Table } from "../dungeonTypes";

export enum MonsterTen {
  Beholder,
  Character,
  DemonPrince,
  DevilArch,
  Dragon,
  GolemIron,
  Lich,
  TitanElder,
  Vampire,
  NoEncounter,
}

export const monsterTen: Table<MonsterTen> = {
  sides: 100,
  entries: [
    { range: [1, 12], command: MonsterTen.Beholder },
    { range: [13, 20], command: MonsterTen.Character },
    { range: [21, 28], command: MonsterTen.DemonPrince },
    { range: [29, 30], command: MonsterTen.DevilArch },
    { range: [31, 40], command: MonsterTen.Dragon },
    { range: [41, 50], command: MonsterTen.GolemIron },
    { range: [51, 60], command: MonsterTen.Lich },
    { range: [61, 70], command: MonsterTen.TitanElder },
    { range: [71, 80], command: MonsterTen.Vampire },
    { range: [81, 100], command: MonsterTen.NoEncounter },
  ],
};

export enum DragonTen {
  Blue_Ancient_8_VeryOld_7,
  Bronze_Ancient_8_VeryOld_7,
  Copper_Ancient_8_VeryOld_7,
  Chromatic_Tiamat,
  Gold_Ancient_8_Old_6,
  Green_Ancient_8_VeryOld_7,
  Platinum_Bahamut,
  Red_Ancient_8_Old_6,
  Silver_Ancient_8_Old_6,
}

export const dragonTen: Table<DragonTen> = {
  sides: 100,
  entries: [
    { range: [1, 20], command: DragonTen.Blue_Ancient_8_VeryOld_7 },
    { range: [21, 26], command: DragonTen.Bronze_Ancient_8_VeryOld_7 },
    { range: [27, 33], command: DragonTen.Copper_Ancient_8_VeryOld_7 },
    { range: [34, 35], command: DragonTen.Chromatic_Tiamat },
    { range: [36, 40], command: DragonTen.Gold_Ancient_8_Old_6 },
    { range: [41, 60], command: DragonTen.Green_Ancient_8_VeryOld_7 },
    { range: [61, 63], command: DragonTen.Platinum_Bahamut },
    { range: [63, 94], command: DragonTen.Red_Ancient_8_Old_6 },
    { range: [95, 100], command: DragonTen.Silver_Ancient_8_Old_6 },
  ],
};
