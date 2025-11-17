import {
  formatMonsterCount,
  getNumberOfMonsters,
} from '../wanderingMonsterResult';
import { getTableEntry, rollDice } from '../../helpers/dungeonLookup';
import { characterResult } from './characterResult';
import {
  monsterNine,
  MonsterNine,
  DragonNine,
} from '../../../tables/dungeon/monster/monsterNine';
import { formatPartyResult } from '../../helpers/party/formatPartyResult';
import type { PartyResult } from '../../models/character/characterSheet';
import { dragonSubtableReminder } from './dragonSubtableReminder';

type MonsterTextResult = {
  text: string;
  party?: PartyResult;
};

export const monsterNineTextForCommand = (
  dungeonLevel: number,
  command: MonsterNine
): MonsterTextResult => {
  let text = '';
  let party: PartyResult | undefined;
  switch (command) {
    case MonsterNine.Character: {
      const characters = characterResult(9, dungeonLevel);
      text = formatPartyResult(characters);
      party = characters;
      break;
    }
    case MonsterNine.DevilPitFiend:
      text = formatMonsterCount(
        getNumberOfMonsters(9, dungeonLevel, 1, 1),
        'pit fiend',
        'pit fiends'
      );
      break;
    case MonsterNine.Dragon:
      text = dragonSubtableReminder('A dragon is indicated');
      break;
    case MonsterNine.GiantStorm_1to2:
      text = formatMonsterCount(
        getNumberOfMonsters(9, dungeonLevel, 1, 2),
        'storm giant',
        'storm giants'
      );
      break;
    case MonsterNine.GolemStone:
      text = formatMonsterCount(
        getNumberOfMonsters(9, dungeonLevel, 1, 1),
        'stone golem',
        'stone golems'
      );
      break;
    case MonsterNine.Hydra_17to20Heads: {
      const heads = getNumberOfMonsters(9, dungeonLevel, 1, 4, 16);
      text = formatMonsterCount(
        1,
        `${heads}-headed hydra`,
        `${heads}-headed hydrae`
      );
      break;
    }
    case MonsterNine.HydraPyro_12Heads: {
      const heads = getNumberOfMonsters(9, dungeonLevel, 1, 1, 11);
      text = formatMonsterCount(
        1,
        `${heads}-headed pyrohydra`,
        `${heads}-headed pyrohydrae`
      );
      break;
    }
    case MonsterNine.MoldBrown:
      text = formatMonsterCount(
        getNumberOfMonsters(9, dungeonLevel, 1, 1),
        'patch of brown mold',
        'patches of brown mold'
      );
      break;
    case MonsterNine.MoldYellow:
      text = formatMonsterCount(
        getNumberOfMonsters(9, dungeonLevel, 1, 1),
        'patch of yellow mold',
        'patches of yellow mold'
      );
      break;
    case MonsterNine.Nycadaemon:
      text = formatMonsterCount(
        getNumberOfMonsters(9, dungeonLevel, 1, 1),
        'nycadaemon',
        'nycadaemons'
      );
      break;
    case MonsterNine.PurpleWorm:
      text = formatMonsterCount(
        getNumberOfMonsters(9, dungeonLevel, 1, 1),
        'purple worm',
        'purple worms'
      );
      break;
    case MonsterNine.RustMonster:
      text = formatMonsterCount(
        getNumberOfMonsters(9, dungeonLevel, 1, 1),
        'rust monster',
        'rust monsters'
      );
      break;
    case MonsterNine.TitanLesser:
      text = formatMonsterCount(
        getNumberOfMonsters(9, dungeonLevel, 1, 1),
        'lesser titan',
        'lesser titans'
      );
      break;
    case MonsterNine.TitanMinor:
      text = formatMonsterCount(
        getNumberOfMonsters(9, dungeonLevel, 1, 1),
        'minor titan',
        'minor titans'
      );
      break;
    case MonsterNine.UmberHulk_1to4:
      text = formatMonsterCount(
        getNumberOfMonsters(9, dungeonLevel, 1, 4),
        'umber hulk',
        'umber hulks'
      );
      break;
    case MonsterNine.Vampire: {
      const base = formatMonsterCount(
        getNumberOfMonsters(9, dungeonLevel, 1, 1),
        'vampire',
        'vampires'
      );
      const clericLevel = 6 + rollDice(4);
      const ordinal = `${clericLevel}th`;
      text = `${base}This vampire is a former cleric of full powers (${ordinal} level). `;
      break;
    }
    case MonsterNine.WillOWisp_2to5:
      text = formatMonsterCount(
        getNumberOfMonsters(9, dungeonLevel, 1, 4, 1),
        "will-o'-wisp",
        "will-o'-wisps"
      );
      break;
    case MonsterNine.Xorn_2to9:
      text = formatMonsterCount(
        getNumberOfMonsters(9, dungeonLevel, 1, 8, 1),
        'xorn',
        'xorn'
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
  switch (command) {
    case DragonNine.Black_Ancient_8_Old_6:
      return 'There are two black dragons: one ancient (8 hp/die) and one old (6 hp/die). ';
    case DragonNine.Brass_Ancient_8_Old_6:
      return 'There are two brass dragons: one ancient (8 hp/die) and one old (6 hp/die). ';
    case DragonNine.White_Ancient_8_VeryOld_7:
      return 'There are two white dragons: one ancient (8 hp/die) and one very old (7 hp/die). ';
    default: {
      const label = dragonNineSingleLabel(command);
      const count = getNumberOfMonsters(9, dungeonLevel, 1, 1);
      return formatMonsterCount(count, label, label);
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
