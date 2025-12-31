import { formatMonsterCount, getNumberOfMonsters } from '../monsterCounts';
import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import { humanResult } from '../human/humanResult';
import { MonsterOne, monsterOne } from './monsterOneTables';

export const monsterOneTextForCommand = (
  dungeonLevel: number,
  command: MonsterOne
): string => {
  switch (command) {
    case MonsterOne.AntGiant_1to4: {
      const ants = getNumberOfMonsters(1, dungeonLevel, 1, 4);
      return formatMonsterCount(ants, 'giant ant', 'giant ants');
    }
    case MonsterOne.Badger_1to4_Hobgoblin_2to8: {
      if (dungeonLevel <= 2) {
        const badgers = getNumberOfMonsters(1, dungeonLevel, 1, 4);
        return formatMonsterCount(badgers, 'badger', 'badgers');
      } else {
        const hobgoblins = getNumberOfMonsters(1, dungeonLevel, 2, 4);
        return formatMonsterCount(hobgoblins, 'hobgoblin', 'hobgoblins');
      }
    }
    case MonsterOne.BeetleFire_1to4: {
      const fireBeetles = getNumberOfMonsters(1, dungeonLevel, 1, 4);
      return formatMonsterCount(fireBeetles, 'fire beetle', 'fire beetles');
    }
    case MonsterOne.DemonManes_1to4: {
      const manesDemon = getNumberOfMonsters(1, dungeonLevel, 1, 4);
      return formatMonsterCount(manesDemon, 'manes demon', 'manes demon');
    }
    case MonsterOne.Dwarf_4to14: {
      const dwarves = getNumberOfMonsters(1, dungeonLevel, 2, 6, 2);
      return formatMonsterCount(dwarves, 'dwarf', 'dwarves');
    }
    case MonsterOne.EarSeeker_1: {
      const earSeekers = getNumberOfMonsters(1, dungeonLevel, 1, 1);
      return formatMonsterCount(earSeekers, 'ear seeker', 'ear seekers');
    }
    case MonsterOne.Elf_4to11: {
      const elves = getNumberOfMonsters(1, dungeonLevel, 1, 8, 3);
      return formatMonsterCount(elves, 'elf', 'elves');
    }
    case MonsterOne.Gnome_5to15: {
      const gnomes = getNumberOfMonsters(1, dungeonLevel, 2, 6, 3);
      return formatMonsterCount(gnomes, 'gnome', 'gnomes');
    }
    case MonsterOne.Goblin_6to15: {
      const goblins = getNumberOfMonsters(1, dungeonLevel, 1, 10, 5);
      return formatMonsterCount(goblins, 'goblin', 'goblins');
    }
    case MonsterOne.Halfling_9to16_RatGiant_5to20: {
      if (dungeonLevel <= 4) {
        const halflings = getNumberOfMonsters(1, dungeonLevel, 1, 8, 8);
        return formatMonsterCount(halflings, 'halfling', 'halflings');
      } else {
        const giantRats = getNumberOfMonsters(1, dungeonLevel, 5, 4);
        return formatMonsterCount(giantRats, 'giant rat', 'giant rats');
      }
    }
    case MonsterOne.Hobgoblin_2to8: {
      const hobgoblins = getNumberOfMonsters(1, dungeonLevel, 2, 4);
      return formatMonsterCount(hobgoblins, 'hobgoblin', 'hobgoblins');
    }
    case MonsterOne.Human:
      return humanResult(dungeonLevel);
    case MonsterOne.Kobold_6to18: {
      const kobolds = getNumberOfMonsters(1, dungeonLevel, 3, 6);
      return formatMonsterCount(kobolds, 'kobold', 'kobolds');
    }
    case MonsterOne.Orc_7to12: {
      const orcs = getNumberOfMonsters(1, dungeonLevel, 1, 6, 6);
      return formatMonsterCount(orcs, 'orc', 'orcs');
    }
    case MonsterOne.Piercer_1to3: {
      const piercers = getNumberOfMonsters(1, dungeonLevel, 1, 3);
      return formatMonsterCount(piercers, 'piercer', 'piercers');
    }
    case MonsterOne.RatGiant_5to20: {
      const giantRats = getNumberOfMonsters(1, dungeonLevel, 5, 4);
      return formatMonsterCount(giantRats, 'giant rat', 'giant rats');
    }
    case MonsterOne.RotGrub_1to3: {
      const rotGrubs = getNumberOfMonsters(1, dungeonLevel, 1, 3);
      return formatMonsterCount(rotGrubs, 'rot grubs', 'rot grubs');
    }
    case MonsterOne.Shrieker_1to2: {
      const shriekers = getNumberOfMonsters(1, dungeonLevel, 1, 2);
      return formatMonsterCount(shriekers, 'shrieker', 'shriekers');
    }
    case MonsterOne.Skeleton_1to4: {
      const skeletons = getNumberOfMonsters(1, dungeonLevel, 1, 4);
      return formatMonsterCount(skeletons, 'skeleton', 'skeletons');
    }
    case MonsterOne.Zombie_1to3: {
      const zombies = getNumberOfMonsters(1, dungeonLevel, 1, 3);
      return formatMonsterCount(zombies, 'zombie', 'zombies');
    }
  }
};

export const monsterOneResult = (dungeonLevel: number): string => {
  const roll = rollDice(monsterOne.sides);
  const command = getTableEntry(roll, monsterOne);
  return monsterOneTextForCommand(dungeonLevel, command);
};
