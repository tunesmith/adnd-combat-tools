import { formatMonsterCount } from '../monsterCounts';
import { characterResult } from '../../../services/monster/characterResult';
import { DragonSix, MonsterSix } from './monsterSixTables';
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

const monsterSixEntries: Partial<Record<MonsterSix, MonsterTextEntry>> = {
  [MonsterSix.Basilisk]: countTextEntry(1, 1, 'basilisk', 'basilisks'),
  [MonsterSix.CarrionCrawler_1to2]: countTextEntry(
    1,
    2,
    'carrion crawler',
    'carrion crawlers'
  ),
  [MonsterSix.DevilErinyes_1to2]: countTextEntry(1, 2, 'erinyes', 'erinyes'),
  [MonsterSix.Djinni]: countTextEntry(1, 1, 'djinni', 'djinn'),
  [MonsterSix.GreenSlime]: countTextEntry(
    1,
    1,
    'patch of green slime',
    'patches of green slime'
  ),
  [MonsterSix.Hydra_8to9Heads]: computedCountTextEntry(
    1,
    2,
    (heads) =>
      formatMonsterCount(1, `${heads}-headed hydra`, `${heads}-headed hydrae`),
    7
  ),
  [MonsterSix.Jackalwere_1to2]: countTextEntry(
    1,
    2,
    'jackalwere',
    'jackalwere'
  ),
  [MonsterSix.Lammasu_1to3]: countTextEntry(1, 3, 'lammasu', 'lammasu'),
  [MonsterSix.LycanthropeWerebear]: countTextEntry(
    1,
    1,
    'werebear lycanthrope',
    'werebear lycanthropes'
  ),
  [MonsterSix.LycanthropeWeretiger_1to2]: countTextEntry(
    1,
    2,
    'weretiger lycanthrope',
    'weretiger lycanthropes'
  ),
  [MonsterSix.Manticore_1to2]: countTextEntry(1, 2, 'manticore', 'manticores'),
  [MonsterSix.Medusa]: countTextEntry(1, 1, 'medusa', 'medusae'),
  [MonsterSix.MoldBrown]: countTextEntry(
    1,
    1,
    'patch of brown mold',
    'patches of brown mold'
  ),
  [MonsterSix.MoldYellow]: countTextEntry(
    1,
    1,
    'patch of yellow mold',
    'patches of yellow mold'
  ),
  [MonsterSix.OgreMagi_1to2]: countTextEntry(1, 2, 'ogre mage', 'ogre magi'),
  [MonsterSix.Otyugh]: countTextEntry(1, 1, 'otyugh', 'otyugh'),
  [MonsterSix.Rakshasa]: countTextEntry(1, 1, 'rakshasa', 'rakshasas'),
  [MonsterSix.Salamander_1to2]: countTextEntry(
    1,
    2,
    'salamander',
    'salamanders'
  ),
  [MonsterSix.SpiderPhase_1to3]: countTextEntry(
    1,
    3,
    'phase spiders',
    'phase spiders'
  ),
  [MonsterSix.Troll_1to3]: countTextEntry(1, 3, 'troll', 'trolls'),
  [MonsterSix.Wight_1to4]: countTextEntry(1, 4, 'wight', 'wights'),
  [MonsterSix.WindWalker_1to2]: countTextEntry(
    1,
    2,
    'wind walker',
    'wind walkers'
  ),
  [MonsterSix.Wraith_1to2]: countTextEntry(1, 2, 'wraith', 'wraiths'),
  [MonsterSix.Wyvern]: countTextEntry(1, 1, 'wyvern', 'wyverns'),
};

const dragonSixEntries: Record<DragonSix, MonsterTextEntry> = {
  [DragonSix.Black_Old_6]: countTextEntry(
    1,
    1,
    'old black dragon with 6 hit points per die',
    'old black dragons with 6 hit points per die'
  ),
  [DragonSix.Blue_Adult_5]: countTextEntry(
    1,
    1,
    'adult blue dragon with 5 hit points per die',
    'adult blue dragons with 5 hit points per die'
  ),
  [DragonSix.Brass_Old_6]: countTextEntry(
    1,
    1,
    'old brass dragon with 6 hit points per die',
    'old brass dragons with 6 hit points per die'
  ),
  [DragonSix.Bronze_Adult_5]: countTextEntry(
    1,
    1,
    'adult bronze dragon with 5 hit points per die',
    'adult bronze dragons with 5 hit points per die'
  ),
  [DragonSix.Copper_Adult_5]: countTextEntry(
    1,
    1,
    'adult copper dragon with 5 hit points per die',
    'adult copper dragons with 5 hit points per die'
  ),
  [DragonSix.Gold_Adult_5]: countTextEntry(
    1,
    1,
    'adult gold dragon with 5 hit points per die',
    'adult gold dragons with 5 hit points per die'
  ),
  [DragonSix.Green_Adult_5]: countTextEntry(
    1,
    1,
    'adult green dragon with 5 hit points per die',
    'adult green dragons with 5 hit points per die'
  ),
  [DragonSix.Red_Adult_5]: countTextEntry(
    1,
    1,
    'adult red dragon with 5 hit points per die',
    'adult red dragons with 5 hit points per die'
  ),
  [DragonSix.Silver_Adult_5]: countTextEntry(
    1,
    1,
    'adult silver dragon with 5 hit points per die',
    'adult silver dragons with 5 hit points per die'
  ),
  [DragonSix.White_Old_6]: countTextEntry(
    1,
    1,
    'old white dragon with 6 hit points per die',
    'old white dragons with 6 hit points per die'
  ),
};

export const monsterSixTextForCommand = (
  dungeonLevel: number,
  command: MonsterSix
): MonsterTextResult => {
  switch (command) {
    case MonsterSix.Character:
      return partyTextResult(characterResult(6, dungeonLevel));
    case MonsterSix.Dragon:
      return { text: dragonSubtableReminder('A dragon is indicated') };
    default:
      return {
        text: resolveMonsterTextFromEntries(
          6,
          dungeonLevel,
          command,
          monsterSixEntries
        ),
      };
  }
};

export const dragonSixTextForCommand = (
  dungeonLevel: number,
  command: DragonSix
): string => {
  return resolveMonsterTextFromEntries(
    6,
    dungeonLevel,
    command,
    dragonSixEntries,
    {
      decorate: (text) => `${text}${DRAGON_HIT_DICE_NOTE}`,
    }
  );
};
