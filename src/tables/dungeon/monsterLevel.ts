import { Table } from "./dungeonTypes";

export enum MonsterDistributionLevel {
  One,
  TwoThree,
  Four,
  Five,
  Six,
  Seven,
  Eight,
  Nine,
  TenEleven,
  TwelveThirteen,
  FourteenFifteen,
  Sixteen,
}

export enum MonsterLevel {
  One,
  Two,
  Three,
  Four,
  Five,
  Six,
  Seven,
  Eight,
  Nine,
  Ten,
}

export const monsterDistribution: Table = {
  sides: 16,
  entries: [
    { range: [1], command: MonsterDistributionLevel.One },
    { range: [2, 3], command: MonsterDistributionLevel.TwoThree },
    { range: [4], command: MonsterDistributionLevel.Four },
    { range: [5], command: MonsterDistributionLevel.Five },
    { range: [6], command: MonsterDistributionLevel.Six },
    { range: [7], command: MonsterDistributionLevel.Seven },
    { range: [8], command: MonsterDistributionLevel.Eight },
    { range: [9], command: MonsterDistributionLevel.Nine },
    { range: [10, 11], command: MonsterDistributionLevel.TenEleven },
    { range: [12, 13], command: MonsterDistributionLevel.TwelveThirteen },
    { range: [14, 15], command: MonsterDistributionLevel.FourteenFifteen },
    { range: [16], command: MonsterDistributionLevel.Sixteen },
  ],
};

export const dungeonOne: Table = {
  sides: 20,
  entries: [
    { range: [1, 16], command: MonsterLevel.One },
    { range: [17, 19], command: MonsterLevel.Two },
    { range: [20], command: MonsterLevel.Three },
  ],
};

export const dungeonTwoThree: Table = {
  sides: 20,
  entries: [
    { range: [1, 12], command: MonsterLevel.One },
    { range: [13, 16], command: MonsterLevel.Two },
    { range: [17, 18], command: MonsterLevel.Three },
    { range: [19], command: MonsterLevel.Four },
    { range: [20], command: MonsterLevel.Five },
  ],
};

export const dungeonFour: Table = {
  sides: 20,
  entries: [
    { range: [1, 5], command: MonsterLevel.One },
    { range: [6, 10], command: MonsterLevel.Two },
    { range: [11, 16], command: MonsterLevel.Three },
    { range: [17, 18], command: MonsterLevel.Four },
    { range: [19], command: MonsterLevel.Five },
    { range: [20], command: MonsterLevel.Six },
  ],
};

export const dungeonFive: Table = {
  sides: 20,
  entries: [
    { range: [1, 3], command: MonsterLevel.One },
    { range: [4, 6], command: MonsterLevel.Two },
    { range: [7, 12], command: MonsterLevel.Three },
    { range: [13, 16], command: MonsterLevel.Four },
    { range: [17, 18], command: MonsterLevel.Five },
    { range: [19], command: MonsterLevel.Six },
    { range: [20], command: MonsterLevel.Seven },
  ],
};

export const dungeonSix: Table = {
  sides: 20,
  entries: [
    { range: [1, 2], command: MonsterLevel.One },
    { range: [3, 4], command: MonsterLevel.Two },
    { range: [5, 6], command: MonsterLevel.Three },
    { range: [7, 12], command: MonsterLevel.Four },
    { range: [13, 16], command: MonsterLevel.Five },
    { range: [17, 18], command: MonsterLevel.Six },
    { range: [19], command: MonsterLevel.Seven },
    { range: [20], command: MonsterLevel.Eight },
  ],
};

export const dungeonSeven: Table = {
  sides: 20,
  entries: [
    { range: [1], command: MonsterLevel.One },
    { range: [2, 3], command: MonsterLevel.Two },
    { range: [4, 5], command: MonsterLevel.Three },
    { range: [6, 10], command: MonsterLevel.Four },
    { range: [11, 14], command: MonsterLevel.Five },
    { range: [15, 16], command: MonsterLevel.Six },
    { range: [17, 18], command: MonsterLevel.Seven },
    { range: [19], command: MonsterLevel.Eight },
    { range: [20], command: MonsterLevel.Nine },
  ],
};

export const dungeonEight: Table = {
  sides: 20,
  entries: [
    { range: [1], command: MonsterLevel.One },
    { range: [2], command: MonsterLevel.Two },
    { range: [3, 4], command: MonsterLevel.Three },
    { range: [5, 7], command: MonsterLevel.Four },
    { range: [8, 10], command: MonsterLevel.Five },
    { range: [11, 14], command: MonsterLevel.Six },
    { range: [15, 16], command: MonsterLevel.Seven },
    { range: [17, 18], command: MonsterLevel.Eight },
    { range: [19], command: MonsterLevel.Nine },
    { range: [20], command: MonsterLevel.Ten },
  ],
};

export const dungeonNine: Table = {
  sides: 20,
  entries: [
    { range: [1], command: MonsterLevel.One },
    { range: [2], command: MonsterLevel.Two },
    { range: [3], command: MonsterLevel.Three },
    { range: [4, 5], command: MonsterLevel.Four },
    { range: [6, 8], command: MonsterLevel.Five },
    { range: [9, 12], command: MonsterLevel.Six },
    { range: [13, 15], command: MonsterLevel.Seven },
    { range: [16, 17], command: MonsterLevel.Eight },
    { range: [18, 19], command: MonsterLevel.Nine },
    { range: [20], command: MonsterLevel.Ten },
  ],
};

export const dungeonTenEleven: Table = {
  sides: 20,
  entries: [
    { range: [1], command: MonsterLevel.One },
    { range: [2], command: MonsterLevel.Two },
    { range: [3], command: MonsterLevel.Three },
    { range: [4], command: MonsterLevel.Four },
    { range: [5, 6], command: MonsterLevel.Five },
    { range: [7, 9], command: MonsterLevel.Six },
    { range: [10, 12], command: MonsterLevel.Seven },
    { range: [13, 16], command: MonsterLevel.Eight },
    { range: [17, 19], command: MonsterLevel.Nine },
    { range: [20], command: MonsterLevel.Ten },
  ],
};

export const dungeonTwelveThirteen: Table = {
  sides: 20,
  entries: [
    { range: [1], command: MonsterLevel.One },
    { range: [2], command: MonsterLevel.Two },
    { range: [3], command: MonsterLevel.Three },
    { range: [4], command: MonsterLevel.Four },
    { range: [5], command: MonsterLevel.Five },
    { range: [6, 7], command: MonsterLevel.Six },
    { range: [8, 9], command: MonsterLevel.Seven },
    { range: [10, 12], command: MonsterLevel.Eight },
    { range: [13, 18], command: MonsterLevel.Nine },
    { range: [19, 20], command: MonsterLevel.Ten },
  ],
};

export const dungeonFourteenFifteen: Table = {
  sides: 20,
  entries: [
    { range: [1], command: MonsterLevel.One },
    { range: [2], command: MonsterLevel.Two },
    { range: [3], command: MonsterLevel.Three },
    { range: [4], command: MonsterLevel.Four },
    { range: [5], command: MonsterLevel.Five },
    { range: [6], command: MonsterLevel.Six },
    { range: [7, 8], command: MonsterLevel.Seven },
    { range: [9, 11], command: MonsterLevel.Eight },
    { range: [12, 17], command: MonsterLevel.Nine },
    { range: [18, 20], command: MonsterLevel.Ten },
  ],
};

export const dungeonSixteen: Table = {
  sides: 20,
  entries: [
    { range: [1], command: MonsterLevel.One },
    { range: [2], command: MonsterLevel.Two },
    { range: [3], command: MonsterLevel.Three },
    { range: [4], command: MonsterLevel.Four },
    { range: [5], command: MonsterLevel.Five },
    { range: [6], command: MonsterLevel.Six },
    { range: [7], command: MonsterLevel.Seven },
    { range: [8, 10], command: MonsterLevel.Eight },
    { range: [11, 16], command: MonsterLevel.Nine },
    { range: [17, 20], command: MonsterLevel.Ten },
  ],
};

export enum MonsterOne {
  AntGiant_1to4,
  Badger_1to4_Hobgoblin_2to8,
  BeetleFire_1to4,
  DemonManes_1to4,
  Dwarf_4to14,
  EarSeeker_1,
  Elf_4to11, // corrected from 3-11 to 4-11, per Fiend Folio, and since 3-11 doesn't make sense
  Gnome_5to15,
  Goblin_6to15,
  Halfling_9to16_RatGiant_5to20,
  Hobgoblin_2to8,
  Human,
  Kobold_6to18,
  Orc_7to12,
  Piercer_1to3,
  RatGiant_5to20,
  RotGrub_1to3,
  Shrieker_1to2,
  Skeleton_1to4,
  Zombie_1to3,
}
export const monsterOne: Table = {
  sides: 100,
  entries: [
    { range: [1, 2], command: MonsterOne.AntGiant_1to4 },
    { range: [3, 4], command: MonsterOne.Badger_1to4_Hobgoblin_2to8 },
    { range: [5, 14], command: MonsterOne.BeetleFire_1to4 },
    { range: [15], command: MonsterOne.DemonManes_1to4 },
    { range: [16, 17], command: MonsterOne.Dwarf_4to14 },
    { range: [18], command: MonsterOne.EarSeeker_1 },
    { range: [19], command: MonsterOne.Elf_4to11 },
    { range: [20, 21], command: MonsterOne.Gnome_5to15 },
    { range: [22, 26], command: MonsterOne.Goblin_6to15 },
    { range: [27, 28], command: MonsterOne.Halfling_9to16_RatGiant_5to20 },
    { range: [29, 33], command: MonsterOne.Hobgoblin_2to8 },
    { range: [34, 48], command: MonsterOne.Human },
    { range: [49, 54], command: MonsterOne.Kobold_6to18 },
    { range: [55, 66], command: MonsterOne.Orc_7to12 },
    { range: [67, 70], command: MonsterOne.Piercer_1to3 },
    { range: [71, 83], command: MonsterOne.RatGiant_5to20 },
    { range: [84, 85], command: MonsterOne.RotGrub_1to3 },
    { range: [86, 96], command: MonsterOne.Shrieker_1to2 },
    { range: [97, 98], command: MonsterOne.Skeleton_1to4 },
    { range: [99, 100], command: MonsterOne.Zombie_1to3 },
  ],
};

export enum MonsterTwo {
  Badger_1to4_Gnoll_4to10,
  CentipedeGiant_3to13,
  Character,
  DevilLemure_2to5,
  GasSpore_1to2,
  Gnoll_4to10,
  Piercer_1to4,
  RatGiant_6to24,
  RotGrub_1to4,
  Shrieker_1to3,
  Stirge_5to15,
  ToadGiant_1to4,
  Troglodyte_2to8,
}

export const monsterTwo: Table = {
  sides: 100,
  entries: [
    { range: [1], command: MonsterTwo.Badger_1to4_Gnoll_4to10 },
    { range: [2, 16], command: MonsterTwo.CentipedeGiant_3to13 },
    { range: [17, 27], command: MonsterTwo.Character },
    { range: [28, 29], command: MonsterTwo.DevilLemure_2to5 },
    { range: [30, 31], command: MonsterTwo.GasSpore_1to2 },
    { range: [32, 38], command: MonsterTwo.Gnoll_4to10 },
    { range: [39, 46], command: MonsterTwo.Piercer_1to4 },
    { range: [47, 58], command: MonsterTwo.RatGiant_6to24 },
    { range: [59, 60], command: MonsterTwo.RotGrub_1to4 },
    { range: [61, 72], command: MonsterTwo.Shrieker_1to3 },
    { range: [73, 77], command: MonsterTwo.Stirge_5to15 },
    { range: [78, 87], command: MonsterTwo.ToadGiant_1to4 },
    { range: [88, 100], command: MonsterTwo.Troglodyte_2to8 },
  ],
};
