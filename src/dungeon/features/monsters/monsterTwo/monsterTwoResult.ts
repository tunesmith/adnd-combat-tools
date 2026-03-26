import { formatMonsterCount, getNumberOfMonsters } from '../monsterCounts';
import { MonsterTwo } from './monsterTwoTable';
import { characterResult } from '../../../services/monster/characterResult';
import {
  countTextEntry,
  partyTextResult,
  resolveMonsterTextFromEntries,
  type MonsterTextEntry,
  type MonsterTextResult,
} from '../resultHelpers';

const monsterTwoEntries: Partial<Record<MonsterTwo, MonsterTextEntry>> = {
  [MonsterTwo.CentipedeGiant_3to13]: countTextEntry(
    2,
    6,
    'giant centipede',
    'giant centipedes',
    1
  ),
  [MonsterTwo.DevilLemure_2to5]: countTextEntry(
    1,
    4,
    'lemure devil',
    'lemure devils',
    1
  ),
  [MonsterTwo.GasSpore_1to2]: countTextEntry(1, 2, 'gas spore', 'gas spores'),
  [MonsterTwo.Gnoll_4to10]: countTextEntry(2, 4, 'gnoll', 'gnolls', 2),
  [MonsterTwo.Piercer_1to4]: countTextEntry(1, 4, 'piercer', 'piercers'),
  [MonsterTwo.RatGiant_6to24]: countTextEntry(6, 4, 'giant rat', 'giant rats'),
  [MonsterTwo.RotGrub_1to4]: countTextEntry(1, 4, 'rot grubs', 'rot grubs'),
  [MonsterTwo.Shrieker_1to3]: countTextEntry(1, 3, 'shrieker', 'shriekers'),
  [MonsterTwo.Stirge_5to15]: countTextEntry(2, 6, 'stirge', 'stirges', 3),
  [MonsterTwo.ToadGiant_1to4]: countTextEntry(
    1,
    4,
    'giant toad',
    'giant toads'
  ),
  [MonsterTwo.Troglodyte_2to8]: countTextEntry(
    2,
    4,
    'troglodyte',
    'troglodytes'
  ),
};

export const monsterTwoTextForCommand = (
  dungeonLevel: number,
  command: MonsterTwo
): MonsterTextResult => {
  switch (command) {
    case MonsterTwo.Badger_1to4_Gnoll_4to10: {
      if (dungeonLevel <= 3) {
        const badgers = getNumberOfMonsters(2, dungeonLevel, 1, 4);
        return { text: formatMonsterCount(badgers, 'badger', 'badgers') };
      } else {
        const gnolls = getNumberOfMonsters(2, dungeonLevel, 2, 4, 2);
        return { text: formatMonsterCount(gnolls, 'gnoll', 'gnolls') };
      }
    }
    case MonsterTwo.Character:
      return partyTextResult(characterResult(2, dungeonLevel));
    default:
      return {
        text: resolveMonsterTextFromEntries(
          2,
          dungeonLevel,
          command,
          monsterTwoEntries
        ),
      };
  }
};
