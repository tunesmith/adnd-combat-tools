import { formatMonsterCount, getNumberOfMonsters } from '../monsterCounts';
import { humanResult } from '../human/humanResult';
import { MonsterOne } from './monsterOneTables';
import {
  countTextEntry,
  resolveMonsterTextFromEntries,
  type MonsterTextEntry,
} from '../resultHelpers';

const monsterOneEntries: Partial<Record<MonsterOne, MonsterTextEntry>> = {
  [MonsterOne.AntGiant_1to4]: countTextEntry(1, 4, 'giant ant', 'giant ants'),
  [MonsterOne.BeetleFire_1to4]: countTextEntry(
    1,
    4,
    'fire beetle',
    'fire beetles'
  ),
  [MonsterOne.DemonManes_1to4]: countTextEntry(
    1,
    4,
    'manes demon',
    'manes demon'
  ),
  [MonsterOne.Dwarf_4to14]: countTextEntry(2, 6, 'dwarf', 'dwarves', 2),
  [MonsterOne.EarSeeker_1]: countTextEntry(1, 1, 'ear seeker', 'ear seekers'),
  [MonsterOne.Elf_4to11]: countTextEntry(1, 8, 'elf', 'elves', 3),
  [MonsterOne.Gnome_5to15]: countTextEntry(2, 6, 'gnome', 'gnomes', 3),
  [MonsterOne.Goblin_6to15]: countTextEntry(1, 10, 'goblin', 'goblins', 5),
  [MonsterOne.Hobgoblin_2to8]: countTextEntry(2, 4, 'hobgoblin', 'hobgoblins'),
  [MonsterOne.Kobold_6to18]: countTextEntry(3, 6, 'kobold', 'kobolds'),
  [MonsterOne.Orc_7to12]: countTextEntry(1, 6, 'orc', 'orcs', 6),
  [MonsterOne.Piercer_1to3]: countTextEntry(1, 3, 'piercer', 'piercers'),
  [MonsterOne.RatGiant_5to20]: countTextEntry(5, 4, 'giant rat', 'giant rats'),
  [MonsterOne.RotGrub_1to3]: countTextEntry(1, 3, 'rot grubs', 'rot grubs'),
  [MonsterOne.Shrieker_1to2]: countTextEntry(1, 2, 'shrieker', 'shriekers'),
  [MonsterOne.Skeleton_1to4]: countTextEntry(1, 4, 'skeleton', 'skeletons'),
  [MonsterOne.Zombie_1to3]: countTextEntry(1, 3, 'zombie', 'zombies'),
};

export const monsterOneTextForCommand = (
  dungeonLevel: number,
  command: MonsterOne
): string => {
  switch (command) {
    case MonsterOne.Badger_1to4_Hobgoblin_2to8: {
      if (dungeonLevel <= 2) {
        const badgers = getNumberOfMonsters(1, dungeonLevel, 1, 4);
        return formatMonsterCount(badgers, 'badger', 'badgers');
      } else {
        const hobgoblins = getNumberOfMonsters(1, dungeonLevel, 2, 4);
        return formatMonsterCount(hobgoblins, 'hobgoblin', 'hobgoblins');
      }
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
      return resolveMonsterTextFromEntries(
        1,
        dungeonLevel,
        command,
        monsterOneEntries
      );
    }
    case MonsterOne.Human:
      return humanResult(dungeonLevel);
    default:
      return resolveMonsterTextFromEntries(
        1,
        dungeonLevel,
        command,
        monsterOneEntries
      );
  }
};
