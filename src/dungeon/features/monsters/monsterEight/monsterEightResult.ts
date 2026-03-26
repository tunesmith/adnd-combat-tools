import { formatMonsterCount } from '../monsterCounts';
import { characterResult } from '../../../services/monster/characterResult';
import { MonsterEight, DragonEight } from './monsterEightTables';
import { dragonSubtableReminder } from '../dragonSubtableReminder';
import {
  computedCountTextEntry,
  countTextEntry,
  partyTextResult,
  resolveMonsterTextFromEntries,
  type MonsterTextEntry,
  type MonsterTextResult,
} from '../resultHelpers';

const monsterEightEntries: Partial<Record<MonsterEight, MonsterTextEntry>> = {
  [MonsterEight.AerialServant]: countTextEntry(
    1,
    1,
    'aerial servant',
    'aerial servants'
  ),
  [MonsterEight.DemonTypeIV]: countTextEntry(
    1,
    1,
    'type IV demon',
    'type IV demons'
  ),
  [MonsterEight.DemonTypeV]: countTextEntry(
    1,
    1,
    'type V demon',
    'type V demons'
  ),
  [MonsterEight.DemonTypeVI]: countTextEntry(
    1,
    1,
    'type VI demon',
    'type VI demons'
  ),
  [MonsterEight.DevilIce]: countTextEntry(1, 1, 'ice devil', 'ice devils'),
  [MonsterEight.Ghost]: countTextEntry(1, 1, 'ghost', 'ghosts'),
  [MonsterEight.GiantCloud_1to2]: countTextEntry(
    1,
    2,
    'cloud giant',
    'cloud giants'
  ),
  [MonsterEight.GolemClay]: countTextEntry(1, 1, 'clay golem', 'clay golems'),
  [MonsterEight.Hydra_13to16Heads]: computedCountTextEntry(
    1,
    4,
    (heads) =>
      formatMonsterCount(1, `${heads}-headed hydra`, `${heads}-headed hydrae`),
    12
  ),
  [MonsterEight.HydraPyro_12Heads]: computedCountTextEntry(
    1,
    1,
    (heads) =>
      formatMonsterCount(
        1,
        `${heads}-headed pyrohydra`,
        `${heads}-headed pyrohydrae`
      ),
    11
  ),
  [MonsterEight.IntellectDevourer_1to2]: countTextEntry(
    1,
    2,
    'intellect devourer',
    'intellect devourers'
  ),
  [MonsterEight.LurkerAbove]: countTextEntry(
    1,
    1,
    'lurker above',
    'lurkers above'
  ),
  [MonsterEight.MoldBrown]: countTextEntry(
    1,
    1,
    'patch of brown mold',
    'patches of brown mold'
  ),
  [MonsterEight.MoldYellow]: countTextEntry(
    1,
    1,
    'patch of yellow mold',
    'patches of yellow mold'
  ),
  [MonsterEight.MindFlayer_1to4]: countTextEntry(
    1,
    4,
    'mind flayer',
    'mind flayers'
  ),
  [MonsterEight.NagaGuardian_1to2]: countTextEntry(
    1,
    2,
    'guardian naga',
    'guardian nagas'
  ),
  [MonsterEight.NeoOtyugh]: countTextEntry(1, 1, 'neo-otyugh', 'neo-otyugh'),
  [MonsterEight.PurpleWorm]: countTextEntry(
    1,
    1,
    'purple worm',
    'purple worms'
  ),
  [MonsterEight.RustMonster]: countTextEntry(
    1,
    1,
    'rust monster',
    'rust monsters'
  ),
  [MonsterEight.SlugGiant]: countTextEntry(1, 1, 'giant slug', 'giant slugs'),
  [MonsterEight.Trapper]: countTextEntry(1, 1, 'trapper', 'trappers'),
  [MonsterEight.Vampire]: countTextEntry(1, 1, 'vampire', 'vampires'),
  [MonsterEight.WillOWisp_2to5]: countTextEntry(
    1,
    4,
    "will-o'-wisp",
    "will-o'-wisps",
    1
  ),
  [MonsterEight.Xorn_2to5]: countTextEntry(1, 4, 'xorn', 'xorn', 1),
};

const dragonEightEntries: Record<DragonEight, MonsterTextEntry> = {
  [DragonEight.Black_Ancient_8]: countTextEntry(
    1,
    1,
    'ancient black dragon',
    'ancient black dragons'
  ),
  [DragonEight.Blue_VeryOld_7]: countTextEntry(
    1,
    1,
    'very old blue dragon',
    'very old blue dragons'
  ),
  [DragonEight.Brass_Ancient_8]: countTextEntry(
    1,
    1,
    'ancient brass dragon',
    'ancient brass dragons'
  ),
  [DragonEight.Bronze_VeryOld_7]: countTextEntry(
    1,
    1,
    'very old bronze dragon',
    'very old bronze dragons'
  ),
  [DragonEight.Copper_VeryOld_7]: countTextEntry(
    1,
    1,
    'very old copper dragon',
    'very old copper dragons'
  ),
  [DragonEight.Gold_VeryOld_7]: countTextEntry(
    1,
    1,
    'very old gold dragon',
    'very old gold dragons'
  ),
  [DragonEight.Green_VeryOld_7]: countTextEntry(
    1,
    1,
    'very old green dragon',
    'very old green dragons'
  ),
  [DragonEight.Red_VeryOld_7]: countTextEntry(
    1,
    1,
    'very old red dragon',
    'very old red dragons'
  ),
  [DragonEight.Silver_VeryOld_7]: countTextEntry(
    1,
    1,
    'very old silver dragon',
    'very old silver dragons'
  ),
  [DragonEight.White_Ancient_8]: countTextEntry(
    1,
    1,
    'ancient white dragon',
    'ancient white dragons'
  ),
};

export const monsterEightTextForCommand = (
  dungeonLevel: number,
  command: MonsterEight
): MonsterTextResult => {
  switch (command) {
    case MonsterEight.Character:
      return partyTextResult(characterResult(8, dungeonLevel));
    case MonsterEight.Dragon:
      return { text: dragonSubtableReminder('A dragon is indicated') };
    default:
      return {
        text: resolveMonsterTextFromEntries(
          8,
          dungeonLevel,
          command,
          monsterEightEntries
        ),
      };
  }
};

export const dragonEightTextForCommand = (
  dungeonLevel: number,
  command: DragonEight
): string => {
  return resolveMonsterTextFromEntries(
    8,
    dungeonLevel,
    command,
    dragonEightEntries
  );
};
