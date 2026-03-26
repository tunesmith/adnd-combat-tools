import { DragonThree, MonsterThree } from './monsterThreeTables';
import { characterResult } from '../../../services/monster/characterResult';
import { dragonSubtableReminder } from '../dragonSubtableReminder';
import {
  countTextEntry,
  partyTextResult,
  resolveMonsterTextFromEntries,
  type MonsterTextEntry,
  type MonsterTextResult,
} from '../resultHelpers';

const DRAGON_HIT_DICE_NOTE =
  '(Determine the number of hit dice for a dragon as normal.) ';

const monsterThreeEntries: Partial<Record<MonsterThree, MonsterTextEntry>> = {
  [MonsterThree.BeetleBoring_1to3]: countTextEntry(
    1,
    3,
    'boring beetle',
    'boring beetles'
  ),
  [MonsterThree.Bugbear_2to7]: countTextEntry(1, 6, 'bugbear', 'bugbears', 1),
  [MonsterThree.FungiViolet_1to3]: countTextEntry(
    1,
    3,
    'violet fungus',
    'violet fungi'
  ),
  [MonsterThree.GelatinousCube]: countTextEntry(
    1,
    1,
    'gelatinous cube',
    'gelatinous cubes'
  ),
  [MonsterThree.Ghoul_1to4]: countTextEntry(1, 4, 'ghoul', 'ghouls'),
  [MonsterThree.LizardGiant_1to3]: countTextEntry(
    1,
    3,
    'giant lizard',
    'giant lizards'
  ),
  [MonsterThree.LycanthropeWererat_2to5]: countTextEntry(
    1,
    4,
    'wererat lycanthrope',
    'wererat lycanthropes',
    1
  ),
  [MonsterThree.OchreJelly]: countTextEntry(1, 1, 'jelly', 'jelly'),
  [MonsterThree.Ogre_1to3]: countTextEntry(1, 3, 'ogre', 'ogres'),
  [MonsterThree.Piercer_2to5]: countTextEntry(1, 4, 'piercer', 'piercers', 1),
  [MonsterThree.RotGrub_1to4]: countTextEntry(1, 4, 'rot grub', 'rot grubs'),
  [MonsterThree.Shrieker_2to5]: countTextEntry(
    1,
    4,
    'shrieker',
    'shriekers',
    1
  ),
  [MonsterThree.SpiderHuge_1to3]: countTextEntry(
    1,
    3,
    'huge spider',
    'huge spiders'
  ),
  [MonsterThree.SpiderLarge_2to5]: countTextEntry(
    1,
    4,
    'large spider',
    'large spiders',
    1
  ),
  [MonsterThree.TickGiant_1to3]: countTextEntry(
    1,
    3,
    'giant tick',
    'giant ticks'
  ),
  [MonsterThree.WeaselGiant_1to4]: countTextEntry(
    1,
    4,
    'giant weasel',
    'giant weasels'
  ),
};

const dragonThreeEntries: Record<DragonThree, MonsterTextEntry> = {
  [DragonThree.Black_VeryYoung_1]: countTextEntry(
    1,
    1,
    'very young black dragon with 1 hit point per die',
    'very young black dragons with 1 hit point per die'
  ),
  [DragonThree.Brass_VeryYoung_1]: countTextEntry(
    1,
    1,
    'very young brass dragon with 1 hit point per die',
    'very young brass dragons with 1 hit point per die'
  ),
  [DragonThree.White_VeryYoung_1]: countTextEntry(
    1,
    1,
    'very young white dragon with 1 hit point per die',
    'very young white dragons with 1 hit point per die'
  ),
};

export const monsterThreeTextForCommand = (
  dungeonLevel: number,
  command: MonsterThree
): MonsterTextResult => {
  switch (command) {
    case MonsterThree.Character:
      return partyTextResult(characterResult(2, dungeonLevel));
    case MonsterThree.Dragon:
      return { text: dragonSubtableReminder('A dragon is indicated') };
    default:
      return {
        text: resolveMonsterTextFromEntries(
          3,
          dungeonLevel,
          command,
          monsterThreeEntries
        ),
      };
  }
};

export const dragonThreeTextForCommand = (
  dungeonLevel: number,
  command: DragonThree
): string => {
  return resolveMonsterTextFromEntries(
    3,
    dungeonLevel,
    command,
    dragonThreeEntries,
    {
      decorate: (text) => `${text}${DRAGON_HIT_DICE_NOTE}`,
    }
  );
};
