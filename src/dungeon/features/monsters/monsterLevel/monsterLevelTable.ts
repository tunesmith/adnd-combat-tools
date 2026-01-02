import type { Table } from '../../../../tables/dungeon/dungeonTypes';

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

const dungeonOne: Table<MonsterLevel> = {
  sides: 20,
  entries: [
    { range: [1, 16], command: MonsterLevel.One },
    { range: [17, 19], command: MonsterLevel.Two },
    { range: [20], command: MonsterLevel.Three },
  ],
};

const dungeonTwoThree: Table<MonsterLevel> = {
  sides: 20,
  entries: [
    { range: [1, 12], command: MonsterLevel.One },
    { range: [13, 16], command: MonsterLevel.Two },
    { range: [17, 18], command: MonsterLevel.Three },
    { range: [19], command: MonsterLevel.Four },
    { range: [20], command: MonsterLevel.Five },
  ],
};

const dungeonFour: Table<MonsterLevel> = {
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

const dungeonFive: Table<MonsterLevel> = {
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

const dungeonSix: Table<MonsterLevel> = {
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

const dungeonSeven: Table<MonsterLevel> = {
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

const dungeonEight: Table<MonsterLevel> = {
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

const dungeonNine: Table<MonsterLevel> = {
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

const dungeonTenEleven: Table<MonsterLevel> = {
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

const dungeonTwelveThirteen: Table<MonsterLevel> = {
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

const dungeonFourteenFifteen: Table<MonsterLevel> = {
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

const dungeonSixteen: Table<MonsterLevel> = {
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

export function getMonsterLevelTable(
  dungeonLevel: number
): Table<MonsterLevel> {
  switch (dungeonLevel) {
    case 1:
      return dungeonOne;
    case 2:
    case 3:
      return dungeonTwoThree;
    case 4:
      return dungeonFour;
    case 5:
      return dungeonFive;
    case 6:
      return dungeonSix;
    case 7:
      return dungeonSeven;
    case 8:
      return dungeonEight;
    case 9:
      return dungeonNine;
    case 10:
    case 11:
      return dungeonTenEleven;
    case 12:
    case 13:
      return dungeonTwelveThirteen;
    case 14:
    case 15:
      return dungeonFourteenFifteen;
    default:
      return dungeonSixteen;
  }
}
