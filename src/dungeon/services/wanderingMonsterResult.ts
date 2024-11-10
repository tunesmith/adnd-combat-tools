import {
  dungeonEight,
  dungeonFive,
  dungeonFour,
  dungeonFourteenFifteen,
  dungeonNine,
  dungeonOne,
  dungeonSeven,
  dungeonSix,
  dungeonSixteen,
  dungeonTenEleven,
  dungeonTwelveThirteen,
  dungeonTwoThree,
  MonsterLevel,
} from "../../tables/dungeon/monsterLevel";
import { getTableEntry, rollDice } from "./passage";
import { Table } from "../../tables/dungeon/dungeonTypes";
import { monsterOneResult } from "./monster/monsterOneResult";
import { monsterTwoResult } from "./monster/monsterTwoResult";

export const wanderingMonsterResult = (level: number): string => {
  const table = getMonsterTable(level);
  const roll = rollDice(table.sides);
  const command = getTableEntry(roll, table) as MonsterLevel;
  switch (command) {
    case MonsterLevel.One:
      return monsterOneResult(level);
    case MonsterLevel.Two:
      return monsterTwoResult(level);
    case MonsterLevel.Three:
      return "(TODO: Roll Monster for Level Three)";
    case MonsterLevel.Four:
      return "(TODO: Roll Monster for Level Four)";
    case MonsterLevel.Five:
      return "(TODO: Roll Monster for Level Five)";
    case MonsterLevel.Six:
      return "(TODO: Roll Monster for Level Six)";
    case MonsterLevel.Seven:
      return "(TODO: Roll Monster for Level Seven)";
    case MonsterLevel.Eight:
      return "(TODO: Roll Monster for Level Eight)";
    case MonsterLevel.Nine:
      return "(TODO: Roll Monster for Level Nine)";
    case MonsterLevel.Ten:
      return "(TODO: Roll Monster for Level Ten)";
  }
};

// I could use MonsterDistribution instead of the case fall-through
// gets complained about.
export const getMonsterTable = (level: number): Table<MonsterLevel> => {
  switch (level) {
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
};

export const formatMonsterCount = (
  count: number,
  singular: string,
  plural: string
): string => {
  return count === 1
    ? `There is ${count} ${singular} here. `
    : `There are ${count} ${plural} here. `;
};

export const getNumberOfMonsters = (
  monsterLevel: number,
  dungeonLevel: number,
  rolls: number,
  sides: number,
  plus: number = 0
): number => {
  if (dungeonLevel < monsterLevel) {
    // e.g. monster level 5, dungeon level 1: subtract monsters
    const levelDifference = monsterLevel - dungeonLevel;
    const monsters = rollDice(sides, rolls) + plus - levelDifference;
    return monsters < 1 ? 1 : monsters;
  } else if (monsterLevel === dungeonLevel) {
    return rollDice(sides, rolls) + plus;
  } else {
    // e.g. dungeon level 5, monster level 1: increase monsters
    const levelDifference = dungeonLevel - monsterLevel;
    return rollDice(sides, rolls * levelDifference) + plus * levelDifference;
  }
};
