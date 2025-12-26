import {
  formatMonsterCount,
  getNumberOfMonsters,
} from '../monsterCounts';
import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import { characterResult } from '../../../services/monster/characterResult';
import {
  monsterNine,
  MonsterNine,
  DragonNine,
} from './monsterNineTables';
import type { PartyResult } from '../../../models/character/characterSheet';
import { dragonSubtableReminder } from '../dragonSubtableReminder';

type MonsterTextResult = {
  text: string;
  party?: PartyResult;
};

export const monsterNineTextForCommand = (
  dungeonLevel: number,
  command: MonsterNine
): MonsterTextResult => {
  const attendantCount = Math.max(0, dungeonLevel - 9);
  const level = Math.min(dungeonLevel, 9);
  const attendantSuffix =
    attendantCount > 0
      ? ` (${attendantCount} attendant${
          attendantCount === 1 ? '' : 's'
        } may be indicated.)`
      : '';
  const withAttendants = (value: string): string =>
    attendantSuffix.length > 0 ? `${value.trim()}${attendantSuffix} ` : value;
  let text = '';
  let party: PartyResult | undefined;
  switch (command) {
    case MonsterNine.Character: {
      const characters = characterResult(9, dungeonLevel);
      text = '';
      party = characters;
      break;
    }
    case MonsterNine.DevilPitFiend:
      text = withAttendants(
        formatMonsterCount(
          getNumberOfMonsters(9, level, 1, 1),
          'pit fiend',
          'pit fiends'
        )
      );
      break;
    case MonsterNine.Dragon:
      text = withAttendants(dragonSubtableReminder('A dragon is indicated'));
      break;
    case MonsterNine.GiantStorm_1to2:
      text = withAttendants(
        formatMonsterCount(
          getNumberOfMonsters(9, level, 1, 2),
          'storm giant',
          'storm giants'
        )
      );
      break;
    case MonsterNine.GolemStone:
      text = withAttendants(
        formatMonsterCount(
          getNumberOfMonsters(9, level, 1, 1),
          'stone golem',
          'stone golems'
        )
      );
      break;
    case MonsterNine.Hydra_17to20Heads: {
      const heads = getNumberOfMonsters(9, level, 1, 4, 16);
      text = withAttendants(
        formatMonsterCount(1, `${heads}-headed hydra`, `${heads}-headed hydrae`)
      );
      break;
    }
    case MonsterNine.HydraPyro_12Heads: {
      const heads = getNumberOfMonsters(9, level, 1, 1, 11);
      text = withAttendants(
        formatMonsterCount(
          1,
          `${heads}-headed pyrohydra`,
          `${heads}-headed pyrohydrae`
        )
      );
      break;
    }
    case MonsterNine.MoldBrown:
      text = withAttendants(
        formatMonsterCount(
          getNumberOfMonsters(9, level, 1, 1),
          'patch of brown mold',
          'patches of brown mold'
        )
      );
      break;
    case MonsterNine.MoldYellow:
      text = withAttendants(
        formatMonsterCount(
          getNumberOfMonsters(9, level, 1, 1),
          'patch of yellow mold',
          'patches of yellow mold'
        )
      );
      break;
    case MonsterNine.Nycadaemon:
      text = withAttendants(
        formatMonsterCount(
          getNumberOfMonsters(9, level, 1, 1),
          'nycadaemon',
          'nycadaemons'
        )
      );
      break;
    case MonsterNine.PurpleWorm:
      text = withAttendants(
        formatMonsterCount(
          getNumberOfMonsters(9, level, 1, 1),
          'purple worm',
          'purple worms'
        )
      );
      break;
    case MonsterNine.RustMonster:
      text = withAttendants(
        formatMonsterCount(
          getNumberOfMonsters(9, level, 1, 1),
          'rust monster',
          'rust monsters'
        )
      );
      break;
    case MonsterNine.TitanLesser:
      text = withAttendants(
        formatMonsterCount(
          getNumberOfMonsters(9, level, 1, 1),
          'lesser titan',
          'lesser titans'
        )
      );
      break;
    case MonsterNine.TitanMinor:
      text = withAttendants(
        formatMonsterCount(
          getNumberOfMonsters(9, level, 1, 1),
          'minor titan',
          'minor titans'
        )
      );
      break;
    case MonsterNine.UmberHulk_1to4:
      text = withAttendants(
        formatMonsterCount(
          getNumberOfMonsters(9, level, 1, 4),
          'umber hulk',
          'umber hulks'
        )
      );
      break;
    case MonsterNine.Vampire: {
      const base = formatMonsterCount(
        getNumberOfMonsters(9, level, 1, 1),
        'vampire',
        'vampires'
      );
      const clericLevel = 6 + rollDice(4);
      const ordinal = `${clericLevel}th`;
      text = withAttendants(
        `${base}This vampire is a former cleric of full powers (${ordinal} level).`
      );
      break;
    }
    case MonsterNine.WillOWisp_2to5:
      text = withAttendants(
        formatMonsterCount(
          getNumberOfMonsters(9, level, 1, 4, 1),
          "will-o'-wisp",
          "will-o'-wisps"
        )
      );
      break;
    case MonsterNine.Xorn_2to9:
      text = withAttendants(
        formatMonsterCount(
          getNumberOfMonsters(9, level, 1, 8, 1),
          'xorn',
          'xorn'
        )
      );
      break;
  }
  return { text, party };
};

export const monsterNineResult = (dungeonLevel: number): string => {
  const roll = rollDice(monsterNine.sides);
  const command = getTableEntry(roll, monsterNine);
  return monsterNineTextForCommand(dungeonLevel, command).text;
};

export const dragonNineTextForCommand = (
  dungeonLevel: number,
  command: DragonNine
): string => {
  const level = Math.min(dungeonLevel, 9);
  const attendantCount = Math.max(0, dungeonLevel - 9);
  const attendantSuffix =
    attendantCount > 0
      ? ` (${attendantCount} attendant${
          attendantCount === 1 ? '' : 's'
        } may be indicated.)`
      : '';
  const withAttendants = (value: string): string =>
    attendantSuffix.length > 0 ? `${value.trim()}${attendantSuffix} ` : value;
  switch (command) {
    case DragonNine.Black_Ancient_8_Old_6:
      return withAttendants(
        'There are two black dragons: one ancient (8 hp/die) and one old (6 hp/die).'
      );
    case DragonNine.Brass_Ancient_8_Old_6:
      return withAttendants(
        'There are two brass dragons: one ancient (8 hp/die) and one old (6 hp/die).'
      );
    case DragonNine.White_Ancient_8_VeryOld_7:
      return withAttendants(
        'There are two white dragons: one ancient (8 hp/die) and one very old (7 hp/die).'
      );
    default: {
      const label = dragonNineSingleLabel(command);
      const count = getNumberOfMonsters(9, level, 1, 1);
      return withAttendants(formatMonsterCount(count, label, label));
    }
  }
};

function dragonNineSingleLabel(command: DragonNine): string {
  switch (command) {
    case DragonNine.Blue_Ancient_8:
      return 'ancient blue dragon';
    case DragonNine.Bronze_Ancient_8:
      return 'ancient bronze dragon';
    case DragonNine.Copper_Ancient_8:
      return 'ancient copper dragon';
    case DragonNine.Gold_Ancient_8:
      return 'ancient gold dragon';
    case DragonNine.Green_Ancient_8:
      return 'ancient green dragon';
    case DragonNine.Red_Ancient_8:
      return 'ancient red dragon';
    case DragonNine.Silver_Ancient_8:
      return 'ancient silver dragon';
    default:
      return 'ancient dragon';
  }
}
