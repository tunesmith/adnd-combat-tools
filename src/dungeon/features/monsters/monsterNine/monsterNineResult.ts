import { formatMonsterCount } from '../monsterCounts';
import { rollDice } from '../../../helpers/dungeonLookup';
import { characterResult } from '../../../services/monster/characterResult';
import { MonsterNine, DragonNine } from './monsterNineTables';
import { dragonSubtableReminder } from '../dragonSubtableReminder';
import {
  computedCountTextEntry,
  countTextEntry,
  createAttendantDecorator,
  fixedTextEntry,
  partyTextResult,
  resolveMonsterTextFromEntries,
  type MonsterTextEntry,
  type MonsterTextResult,
} from '../resultHelpers';

const monsterNineEntries: Partial<Record<MonsterNine, MonsterTextEntry>> = {
  [MonsterNine.DevilPitFiend]: countTextEntry(1, 1, 'pit fiend', 'pit fiends'),
  [MonsterNine.GiantStorm_1to2]: countTextEntry(
    1,
    2,
    'storm giant',
    'storm giants'
  ),
  [MonsterNine.GolemStone]: countTextEntry(1, 1, 'stone golem', 'stone golems'),
  [MonsterNine.Hydra_17to20Heads]: computedCountTextEntry(
    1,
    4,
    (heads) =>
      formatMonsterCount(1, `${heads}-headed hydra`, `${heads}-headed hydrae`),
    16
  ),
  [MonsterNine.HydraPyro_12Heads]: computedCountTextEntry(
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
  [MonsterNine.MoldBrown]: countTextEntry(
    1,
    1,
    'patch of brown mold',
    'patches of brown mold'
  ),
  [MonsterNine.MoldYellow]: countTextEntry(
    1,
    1,
    'patch of yellow mold',
    'patches of yellow mold'
  ),
  [MonsterNine.Nycadaemon]: countTextEntry(1, 1, 'nycadaemon', 'nycadaemons'),
  [MonsterNine.PurpleWorm]: countTextEntry(1, 1, 'purple worm', 'purple worms'),
  [MonsterNine.RustMonster]: countTextEntry(
    1,
    1,
    'rust monster',
    'rust monsters'
  ),
  [MonsterNine.TitanLesser]: countTextEntry(
    1,
    1,
    'lesser titan',
    'lesser titans'
  ),
  [MonsterNine.TitanMinor]: countTextEntry(1, 1, 'minor titan', 'minor titans'),
  [MonsterNine.UmberHulk_1to4]: countTextEntry(
    1,
    4,
    'umber hulk',
    'umber hulks'
  ),
  [MonsterNine.Vampire]: countTextEntry(1, 1, 'vampire', 'vampires'),
  [MonsterNine.WillOWisp_2to5]: countTextEntry(
    1,
    4,
    "will-o'-wisp",
    "will-o'-wisps",
    1
  ),
  [MonsterNine.Xorn_2to9]: countTextEntry(1, 8, 'xorn', 'xorn', 1),
};

const dragonNineEntries: Record<DragonNine, MonsterTextEntry> = {
  [DragonNine.Black_Ancient_8_Old_6]: fixedTextEntry(
    'There are two black dragons: one ancient (8 hp/die) and one old (6 hp/die).'
  ),
  [DragonNine.Blue_Ancient_8]: countTextEntry(
    1,
    1,
    'ancient blue dragon',
    'ancient blue dragons'
  ),
  [DragonNine.Brass_Ancient_8_Old_6]: fixedTextEntry(
    'There are two brass dragons: one ancient (8 hp/die) and one old (6 hp/die).'
  ),
  [DragonNine.Bronze_Ancient_8]: countTextEntry(
    1,
    1,
    'ancient bronze dragon',
    'ancient bronze dragons'
  ),
  [DragonNine.Copper_Ancient_8]: countTextEntry(
    1,
    1,
    'ancient copper dragon',
    'ancient copper dragons'
  ),
  [DragonNine.Gold_Ancient_8]: countTextEntry(
    1,
    1,
    'ancient gold dragon',
    'ancient gold dragons'
  ),
  [DragonNine.Green_Ancient_8]: countTextEntry(
    1,
    1,
    'ancient green dragon',
    'ancient green dragons'
  ),
  [DragonNine.Red_Ancient_8]: countTextEntry(
    1,
    1,
    'ancient red dragon',
    'ancient red dragons'
  ),
  [DragonNine.Silver_Ancient_8]: countTextEntry(
    1,
    1,
    'ancient silver dragon',
    'ancient silver dragons'
  ),
  [DragonNine.White_Ancient_8_VeryOld_7]: fixedTextEntry(
    'There are two white dragons: one ancient (8 hp/die) and one very old (7 hp/die).'
  ),
};

export const monsterNineTextForCommand = (
  dungeonLevel: number,
  command: MonsterNine
): MonsterTextResult => {
  const { effectiveDungeonLevel, decorate } = createAttendantDecorator(
    9,
    dungeonLevel
  );
  switch (command) {
    case MonsterNine.Character:
      return partyTextResult(characterResult(9, dungeonLevel));
    case MonsterNine.Dragon:
      return {
        text: decorate(dragonSubtableReminder('A dragon is indicated')),
      };
    case MonsterNine.Vampire: {
      const base = resolveMonsterTextFromEntries(
        9,
        effectiveDungeonLevel,
        command,
        monsterNineEntries
      );
      const clericLevel = 6 + rollDice(4);
      const ordinal = `${clericLevel}th`;
      return {
        text: decorate(
          `${base}This vampire is a former cleric of full powers (${ordinal} level).`
        ),
      };
    }
    default:
      return {
        text: resolveMonsterTextFromEntries(
          9,
          effectiveDungeonLevel,
          command,
          monsterNineEntries,
          { decorate }
        ),
      };
  }
};

export const dragonNineTextForCommand = (
  dungeonLevel: number,
  command: DragonNine
): string => {
  const { effectiveDungeonLevel, decorate } = createAttendantDecorator(
    9,
    dungeonLevel
  );
  return resolveMonsterTextFromEntries(
    9,
    effectiveDungeonLevel,
    command,
    dragonNineEntries,
    { decorate }
  );
};
