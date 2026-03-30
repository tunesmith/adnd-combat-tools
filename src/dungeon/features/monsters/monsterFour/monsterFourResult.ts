import { formatMonsterCount } from '../monsterCounts';
import { characterResult } from '../../../services/monster/characterResult';
import {
  DragonFourOlder,
  DragonFourYounger,
  MonsterFour,
} from './monsterFourTables';
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

const monsterFourEntries: Partial<Record<MonsterFour, MonsterTextEntry>> = {
  [MonsterFour.ApeCarnivorous_1to3]: countTextEntry(
    1,
    3,
    'carnivorous ape',
    'carnivorous apes'
  ),
  [MonsterFour.BlinkDog_2to5]: countTextEntry(
    1,
    4,
    'blink dog',
    'blink dogs',
    1
  ),
  [MonsterFour.Gargoyle_1to2]: countTextEntry(1, 2, 'gargoyle', 'gargoyles'),
  [MonsterFour.Ghast_1to4]: countTextEntry(1, 4, 'ghast', 'ghasts'),
  [MonsterFour.GrayOoze]: countTextEntry(1, 1, 'gray ooze', 'gray oozes'),
  [MonsterFour.Hellhound_1to2]: countTextEntry(
    1,
    2,
    'hell hound',
    'hell hounds'
  ),
  [MonsterFour.Hydra_5to6Heads]: computedCountTextEntry(
    1,
    2,
    (heads) =>
      formatMonsterCount(1, `${heads}-headed hydra`, `${heads}-headed hydrae`),
    4
  ),
  [MonsterFour.HydroPyro_5Heads]: computedCountTextEntry(
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
  [MonsterFour.LycanthropeWerewolf_1to2]: countTextEntry(
    1,
    2,
    'werewolf lycanthrope',
    'werewolf lycanthropes'
  ),
  [MonsterFour.MoldYellow]: countTextEntry(
    1,
    1,
    'patch of yellow mold',
    'patches of yellow mold'
  ),
  [MonsterFour.Owlbear_1to2]: countTextEntry(1, 2, 'owlbear', 'owlbears'),
  [MonsterFour.RustMonster]: countTextEntry(
    1,
    1,
    'rust monster',
    'rust monsters'
  ),
  [MonsterFour.Shadow_1to3]: countTextEntry(1, 3, 'shadow', 'shadows'),
  [MonsterFour.SnakeGiantConstrictor]: countTextEntry(
    1,
    1,
    'giant constrictor snake',
    'giant constrictor snakes'
  ),
  [MonsterFour.SuMonster_1to2]: countTextEntry(
    1,
    2,
    'su-monster',
    'su-monsters'
  ),
  [MonsterFour.ToadIce]: countTextEntry(1, 1, 'ice toad', 'ice toads'),
  [MonsterFour.ToadPoisonous_1to3]: countTextEntry(
    1,
    3,
    'poisonous toad',
    'poisonous toads'
  ),
};

const dragonFourYoungerEntries: Record<DragonFourYounger, MonsterTextEntry> = {
  [DragonFourYounger.Black_Young_2]: countTextEntry(
    1,
    1,
    'young black dragon with 2 hit points per die',
    'young black dragons with 2 hit points per die'
  ),
  [DragonFourYounger.Blue_VeryYoung_1]: countTextEntry(
    1,
    1,
    'very young blue dragon with 1 hit point per die',
    'very young blue dragons with 1 hit point per die'
  ),
  [DragonFourYounger.Brass_Young_2]: countTextEntry(
    1,
    1,
    'young brass dragon with 2 hit points per die',
    'young brass dragons with 2 hit points per die'
  ),
  [DragonFourYounger.Bronze_VeryYoung_1]: countTextEntry(
    1,
    1,
    'very young bronze dragon with 1 hit point per die',
    'very young bronze dragons with 1 hit point per die'
  ),
  [DragonFourYounger.Copper_VeryYoung_1]: countTextEntry(
    1,
    1,
    'very young copper dragon with 1 hit point per die',
    'very young copper dragons with 1 hit point per die'
  ),
  [DragonFourYounger.Gold_VeryYoung_1]: countTextEntry(
    1,
    1,
    'very young gold dragon with 1 hit point per die',
    'very young gold dragons with 1 hit point per die'
  ),
  [DragonFourYounger.Green_VeryYoung_1]: countTextEntry(
    1,
    1,
    'very young green dragon with 1 hit point per die',
    'very young green dragons with 1 hit point per die'
  ),
  [DragonFourYounger.Red_VeryYoung_1]: countTextEntry(
    1,
    1,
    'very young red dragon with 1 hit point per die',
    'very young red dragons with 1 hit point per die'
  ),
  [DragonFourYounger.Silver_VeryYoung_1]: countTextEntry(
    1,
    1,
    'very young silver dragon with 1 hit point per die',
    'very young silver dragons with 1 hit point per die'
  ),
  [DragonFourYounger.White_Young_2]: countTextEntry(
    1,
    1,
    'young white dragon with 2 hit points per die',
    'young white dragons with 2 hit points per die'
  ),
};

const dragonFourOlderEntries: Record<DragonFourOlder, MonsterTextEntry> = {
  [DragonFourOlder.Black_SubAdult_3]: countTextEntry(
    1,
    1,
    'sub-adult black dragon with 3 hit point per die',
    'sub-adult black dragons with 3 hit points per die'
  ),
  [DragonFourOlder.Blue_Young_2]: countTextEntry(
    1,
    1,
    'young blue dragon with 2 hit point per die',
    'young blue dragons with 2 hit points per die'
  ),
  [DragonFourOlder.Brass_SubAdult_3]: countTextEntry(
    1,
    1,
    'sub-adult brass dragon with 3 hit point per die',
    'sub-adult brass dragons with 3 hit points per die'
  ),
  [DragonFourOlder.Bronze_Young_2]: countTextEntry(
    1,
    1,
    'young bronze dragon with 2 hit point per die',
    'young bronze dragons with 2 hit points per die'
  ),
  [DragonFourOlder.Copper_Young_2]: countTextEntry(
    1,
    1,
    'young copper dragon with 2 hit point per die',
    'young copper dragons with 2 hit points per die'
  ),
  [DragonFourOlder.Gold_Young_2]: countTextEntry(
    1,
    1,
    'young gold dragon with 2 hit point per die',
    'young gold dragons with 2 hit points per die'
  ),
  [DragonFourOlder.Green_Young_2]: countTextEntry(
    1,
    1,
    'young green dragon with 2 hit point per die',
    'young green dragons with 2 hit points per die'
  ),
  [DragonFourOlder.Red_Young_2]: countTextEntry(
    1,
    1,
    'young red dragon with 2 hit point per die',
    'young red dragons with 2 hit points per die'
  ),
  [DragonFourOlder.Silver_Young_2]: countTextEntry(
    1,
    1,
    'young silver dragon with 2 hit point per die',
    'young silver dragons with 2 hit points per die'
  ),
  [DragonFourOlder.White_SubAdult_3]: countTextEntry(
    1,
    1,
    'sub-adult white dragon with 3 hit point per die',
    'sub-adult white dragons with 3 hit points per die'
  ),
};

export const monsterFourTextForCommand = (
  dungeonLevel: number,
  command: MonsterFour
): MonsterTextResult => {
  switch (command) {
    case MonsterFour.Character:
      return partyTextResult(characterResult(4, dungeonLevel));
    case MonsterFour.DragonYounger:
      return {
        text: dragonSubtableReminder('A younger dragon is indicated', {
          tableLabel: 'younger dragon subtable',
        }),
      };
    case MonsterFour.DragonOlder:
      return {
        text: dragonSubtableReminder('An older dragon is indicated', {
          tableLabel: 'older dragon subtable',
        }),
      };
    default:
      return {
        text: resolveMonsterTextFromEntries(
          4,
          dungeonLevel,
          command,
          monsterFourEntries
        ),
      };
  }
};

export const dragonFourYoungerTextForCommand = (
  dungeonLevel: number,
  command: DragonFourYounger
): string => {
  return resolveMonsterTextFromEntries(
    4,
    dungeonLevel,
    command,
    dragonFourYoungerEntries,
    {
      decorate: (text) => `${text}${DRAGON_HIT_DICE_NOTE}`,
    }
  );
};

export const dragonFourOlderTextForCommand = (
  dungeonLevel: number,
  command: DragonFourOlder
): string => {
  return resolveMonsterTextFromEntries(
    4,
    dungeonLevel,
    command,
    dragonFourOlderEntries,
    {
      decorate: (text) => `${text}${DRAGON_HIT_DICE_NOTE}`,
    }
  );
};
