import { formatMonsterCount } from '../monsterCounts';
import { characterResult } from '../../../services/monster/characterResult';
import {
  DragonFiveOlder,
  DragonFiveYounger,
  MonsterFive,
} from './monsterFiveTables';
import { dragonSubtableReminder } from '../dragonSubtableReminder';
import {
  computedCountTextEntry,
  countTextEntry,
  partyTextResult,
  resolveMonsterTextFromEntries,
  type MonsterTextEntry,
  type MonsterTextResult,
} from '../resultHelpers';

const DRAGON_HIT_DICE_NOTE =
  '(Determine the number of hit dice for a dragon as normal.) ';

const monsterFiveEntries: Partial<Record<MonsterFive, MonsterTextEntry>> = {
  [MonsterFive.Cockatrice_1to2]: countTextEntry(
    1,
    2,
    'cockatrice',
    'cockatrices'
  ),
  [MonsterFive.DisplacerBeast_1to2]: countTextEntry(
    1,
    2,
    'displacer beast',
    'displacer beasts'
  ),
  [MonsterFive.Doppleganger_1to3]: countTextEntry(
    1,
    3,
    'doppleganger',
    'dopplegangers'
  ),
  [MonsterFive.Hydra_7Heads]: computedCountTextEntry(
    1,
    1,
    (heads) =>
      formatMonsterCount(1, `${heads}-headed hydra`, `${heads}-headed hydrae`),
    6
  ),
  [MonsterFive.HydraPyro_6Heads]: computedCountTextEntry(
    1,
    1,
    (heads) =>
      formatMonsterCount(
        1,
        `${heads}-headed pyrohydra`,
        `${heads}-headed pyrohydrae`
      ),
    5
  ),
  [MonsterFive.Imp_1to2]: countTextEntry(1, 2, 'imp', 'imps'),
  [MonsterFive.Leucrotta_1to2]: countTextEntry(1, 2, 'leucrotta', 'leucrottas'),
  [MonsterFive.LizardSubterranean_1to3]: countTextEntry(
    1,
    3,
    'subterranean lizard',
    'subterranean lizards'
  ),
  [MonsterFive.LycanthropeWereboar_1to3]: countTextEntry(
    1,
    3,
    'wereboar lycanthrope',
    'wereboar lycanthropes'
  ),
  [MonsterFive.Minotaur_1to3]: countTextEntry(1, 3, 'minotaur', 'minotaurs'),
  [MonsterFive.MoldYellow]: countTextEntry(
    1,
    1,
    'patch of yellow mold',
    'patches of yellow mold'
  ),
  [MonsterFive.Quasit]: countTextEntry(1, 1, 'quasit', 'quasits'),
  [MonsterFive.RustMonster]: countTextEntry(
    1,
    1,
    'rust monster',
    'rust monsters'
  ),
  [MonsterFive.Shrieker_2to5]: countTextEntry(1, 4, 'shrieker', 'shriekers', 1),
  [MonsterFive.SlitheringTracker]: countTextEntry(
    1,
    1,
    'slithering tracker',
    'slithering trackers'
  ),
  [MonsterFive.SnakeGiantAmphisbaena]: countTextEntry(
    1,
    1,
    'giant amphisbaena snake',
    'giant amphisbaena snakes'
  ),
  [MonsterFive.SnakeGiantPoisonous]: countTextEntry(
    1,
    1,
    'giant poisonous snake',
    'giant poisonous snakes'
  ),
  [MonsterFive.SnakeGiantSpitting]: countTextEntry(
    1,
    1,
    'giant spitting snake',
    'giant spitting snakes'
  ),
  [MonsterFive.SpiderGiant_1to2]: countTextEntry(
    1,
    2,
    'giant spider',
    'giant spiders'
  ),
};

const dragonFiveYoungerEntries: Record<DragonFiveYounger, MonsterTextEntry> = {
  [DragonFiveYounger.Black_YoungAdult_4]: countTextEntry(
    1,
    1,
    'young adult black dragon with 4 hit points per die',
    'young adult black dragons with 4 hit points per die'
  ),
  [DragonFiveYounger.Blue_SubAdult_3]: countTextEntry(
    1,
    1,
    'sub-adult blue dragon with 3 hit points per die',
    'sub-adult blue dragons with 3 hit points per die'
  ),
  [DragonFiveYounger.Brass_YoungAdult_4]: countTextEntry(
    1,
    1,
    'young adult brass dragon with 4 hit points per die',
    'young adult brass dragons with 4 hit points per die'
  ),
  [DragonFiveYounger.Bronze_SubAdult_3]: countTextEntry(
    1,
    1,
    'sub-adult bronze dragon with 3 hit points per die',
    'sub-adult bronze dragons with 3 hit points per die'
  ),
  [DragonFiveYounger.Copper_SubAdult_3]: countTextEntry(
    1,
    1,
    'sub-adult copper dragon with 3 hit points per die',
    'sub-adult copper dragons with 3 hit points per die'
  ),
  [DragonFiveYounger.Gold_SubAdult_3]: countTextEntry(
    1,
    1,
    'sub-adult gold dragon with 3 hit points per die',
    'sub-adult gold dragons with 3 hit points per die'
  ),
  [DragonFiveYounger.Green_SubAdult_3]: countTextEntry(
    1,
    1,
    'sub-adult green dragon with 3 hit points per die',
    'sub-adult green dragons with 3 hit points per die'
  ),
  [DragonFiveYounger.Red_SubAdult_3]: countTextEntry(
    1,
    1,
    'sub-adult red dragon with 3 hit points per die',
    'sub-adult red dragons with 3 hit points per die'
  ),
  [DragonFiveYounger.Silver_SubAdult_3]: countTextEntry(
    1,
    1,
    'sub-adult silver dragon with 3 hit points per die',
    'sub-adult silver dragons with 3 hit points per die'
  ),
  [DragonFiveYounger.White_YoungAdult_4]: countTextEntry(
    1,
    1,
    'young adult white dragon with 4 hit points per die',
    'young adult white dragons with 4 hit points per die'
  ),
};

const dragonFiveOlderEntries: Record<DragonFiveOlder, MonsterTextEntry> = {
  [DragonFiveOlder.Black_Adult_5]: countTextEntry(
    1,
    1,
    'adult black dragon with 5 hit points per die',
    'adult black dragons with 5 hit points per die'
  ),
  [DragonFiveOlder.Blue_YoungAdult_4]: countTextEntry(
    1,
    1,
    'young adult blue dragon with 4 hit points per die',
    'young adult blue dragons with 4 hit points per die'
  ),
  [DragonFiveOlder.Brass_Adult_5]: countTextEntry(
    1,
    1,
    'adult brass dragon with 5 hit points per die',
    'adult brass dragons with 5 hit points per die'
  ),
  [DragonFiveOlder.Bronze_YoungAdult_4]: countTextEntry(
    1,
    1,
    'young adult bronze dragon with 4 hit points per die',
    'young adult bronze dragons with 4 hit points per die'
  ),
  [DragonFiveOlder.Copper_YoungAdult_4]: countTextEntry(
    1,
    1,
    'young adult copper dragon with 4 hit points per die',
    'young adult copper dragons with 4 hit points per die'
  ),
  [DragonFiveOlder.Gold_YoungAdult_4]: countTextEntry(
    1,
    1,
    'young adult gold dragon with 4 hit points per die',
    'young adult gold dragons with 4 hit points per die'
  ),
  [DragonFiveOlder.Green_YoungAdult_4]: countTextEntry(
    1,
    1,
    'young adult green dragon with 4 hit points per die',
    'young adult green dragons with 4 hit points per die'
  ),
  [DragonFiveOlder.Red_YoungAdult_4]: countTextEntry(
    1,
    1,
    'young adult red dragon with 4 hit points per die',
    'young adult red dragons with 4 hit points per die'
  ),
  [DragonFiveOlder.Silver_YoungAdult_4]: countTextEntry(
    1,
    1,
    'young adult silver dragon with 4 hit points per die',
    'young adult silver dragons with 4 hit points per die'
  ),
  [DragonFiveOlder.White_Adult_5]: countTextEntry(
    1,
    1,
    'adult white dragon with 5 hit points per die',
    'adult white dragons with 5 hit points per die'
  ),
};

export const monsterFiveTextForCommand = (
  dungeonLevel: number,
  command: MonsterFive
): MonsterTextResult => {
  switch (command) {
    case MonsterFive.Character:
      return partyTextResult(characterResult(5, dungeonLevel));
    case MonsterFive.DragonYounger:
      return {
        text: dragonSubtableReminder('A younger dragon is indicated', {
          tableLabel: 'younger dragon subtable',
        }),
      };
    case MonsterFive.DragonOlder:
      return {
        text: dragonSubtableReminder('An older dragon is indicated', {
          tableLabel: 'older dragon subtable',
        }),
      };
    default:
      return {
        text: resolveMonsterTextFromEntries(
          5,
          dungeonLevel,
          command,
          monsterFiveEntries
        ),
      };
  }
};

export const dragonFiveYoungerTextForCommand = (
  dungeonLevel: number,
  command: DragonFiveYounger
): string => {
  return resolveMonsterTextFromEntries(
    5,
    dungeonLevel,
    command,
    dragonFiveYoungerEntries,
    {
      decorate: (text) => `${text}${DRAGON_HIT_DICE_NOTE}`,
    }
  );
};

export const dragonFiveOlderTextForCommand = (
  dungeonLevel: number,
  command: DragonFiveOlder
): string => {
  return resolveMonsterTextFromEntries(
    5,
    dungeonLevel,
    command,
    dragonFiveOlderEntries,
    {
      decorate: (text) => `${text}${DRAGON_HIT_DICE_NOTE}`,
    }
  );
};
