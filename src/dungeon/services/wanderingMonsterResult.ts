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
  MonsterOne,
  monsterOne,
} from "../../tables/dungeon/monsterLevel";
import { getTableEntry, rollDice } from "./passage";
import { Table } from "../../tables/dungeon/dungeonTypes";

export const wanderingMonsterResult = (level: number): string => {
  const table = getMonsterTable(level);
  const roll = rollDice(table.sides);
  const command = getTableEntry(roll, table) as MonsterLevel;
  switch (command) {
    case MonsterLevel.One:
      return monsterLevelOne(level);
    case MonsterLevel.Two:
      return "(TODO: Roll Monster for Level Two)";
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
export const getMonsterTable = (level: number): Table => {
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

const formatMonsterCount = (
  count: number,
  singular: string,
  plural: string
): string => {
  return count === 1
    ? `There is ${count} ${singular} here.`
    : `There are ${count} ${plural} here.`;
};

export const monsterLevelOne = (dungeonLevel: number): string => {
  const roll = rollDice(monsterOne.sides);
  const command = getTableEntry(roll, monsterOne) as MonsterOne;
  switch (command) {
    case MonsterOne.AntGiant_1to4: {
      const ants = rollDice(4, dungeonLevel);
      return formatMonsterCount(ants, "giant ant", "giant ants");
    }
    case MonsterOne.Badger_1to4_Hobgoblin_2to8: {
      if (dungeonLevel <= 2) {
        const badgers = rollDice(4, dungeonLevel);
        return formatMonsterCount(badgers, "badger", "badgers");
      } else {
        const hobgoblins = rollDice(4, dungeonLevel * 2); // 2 means 2d4 (2--8)
        return formatMonsterCount(hobgoblins, "hobgoblin", "hobgoblins");
      }
    }
    case MonsterOne.BeetleFire_1to4: {
      const fireBeetles = rollDice(4, dungeonLevel);
      return formatMonsterCount(fireBeetles, "fire beetle", "fire beetles");
    }
    case MonsterOne.DemonManes_1to4: {
      const manesDemon = rollDice(4, dungeonLevel);
      return formatMonsterCount(manesDemon, "manes demon", "manes demon");
    }
    case MonsterOne.Dwarf_4to14: {
      const dwarves = rollDice(6, dungeonLevel * 2) + 2 * dungeonLevel; // 2 to 12 + 2, per level
      return formatMonsterCount(dwarves, "dwarf", "dwarves");
    }
    case MonsterOne.EarSeeker_1:
      return formatMonsterCount(dungeonLevel, "ear seeker", "ear seekers");
    case MonsterOne.Elf_4to11: {
      const elves = rollDice(8, dungeonLevel) + 3 * dungeonLevel; // 1--8 + 3, per level
      return formatMonsterCount(elves, "elf", "elves");
    }
    case MonsterOne.Gnome_5to15: {
      const gnomes = rollDice(6, dungeonLevel * 2) + 3 * dungeonLevel; // 2 to 12 + 3, per level
      return formatMonsterCount(gnomes, "gnome", "gnomes");
    }
    case MonsterOne.Goblin_6to15: {
      const goblins = rollDice(10, dungeonLevel) + 5 * dungeonLevel; // 1 to 10 + 5, per level
      return formatMonsterCount(goblins, "goblin", "goblins");
    }
    case MonsterOne.Halfling_9to16_RatGiant_5to20: {
      if (dungeonLevel <= 4) {
        const halflings = rollDice(8, dungeonLevel) + 8 * dungeonLevel;
        return formatMonsterCount(halflings, "halfling", "halflings");
      } else {
        const giantRats = rollDice(4, dungeonLevel * 5);
        return formatMonsterCount(giantRats, "giant rat", "giant rats");
      }
    }
    case MonsterOne.Hobgoblin_2to8: {
      const hobgoblins = rollDice(4, dungeonLevel * 2); // 2 means 2d4 (2--8)
      return formatMonsterCount(hobgoblins, "hobgoblin", "hobgoblins");
    }
    case MonsterOne.Human:
      return `(TODO: Roll Human Subtable for monsterLevel 1 and dungeonLevel ${dungeonLevel}.)`;
    case MonsterOne.Kobold_6to18: {
      const kobolds = rollDice(6, dungeonLevel * 3);
      return formatMonsterCount(kobolds, "kobold", "kobolds");
    }
    case MonsterOne.Orc_7to12: {
      const orcs = rollDice(6, dungeonLevel) + 6 * dungeonLevel;
      return formatMonsterCount(orcs, "orc", "orcs");
    }
    case MonsterOne.Piercer_1to3: {
      const piercers = rollDice(3, dungeonLevel);
      return formatMonsterCount(piercers, "piercer", "piercers");
    }
    case MonsterOne.RatGiant_5to20: {
      const giantRats = rollDice(4, dungeonLevel * 5);
      return formatMonsterCount(giantRats, "giant rat", "giant rats");
    }
    case MonsterOne.RotGrub_1to3: {
      const rotGrubs = rollDice(3, dungeonLevel);
      return formatMonsterCount(rotGrubs, "rot grubs", "rot grubs");
    }
    case MonsterOne.Shrieker_1to2: {
      const shriekers = rollDice(2, dungeonLevel);
      return formatMonsterCount(shriekers, "shrieker", "shriekers");
    }
    case MonsterOne.Skeleton_1to4: {
      const skeletons = rollDice(4, dungeonLevel);
      return formatMonsterCount(skeletons, "skeleton", "skeletons");
    }
    case MonsterOne.Zombie_1to3: {
      const zombies = rollDice(3, dungeonLevel);
      return formatMonsterCount(zombies, "zombie", "zombies");
    }
  }
};
