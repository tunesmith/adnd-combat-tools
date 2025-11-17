import {
  formatMonsterCount,
  getNumberOfMonsters,
} from '../wanderingMonsterResult';
import { getTableEntry, rollDice } from '../../helpers/dungeonLookup';
import { characterResult } from './characterResult';
import {
  monsterEight,
  MonsterEight,
  DragonEight,
} from '../../../tables/dungeon/monster/monsterEight';
import { formatPartyResult } from '../../helpers/party/formatPartyResult';
import type { PartyResult } from '../../models/character/characterSheet';
import { dragonSubtableReminder } from './dragonSubtableReminder';

type MonsterTextResult = {
  text: string;
  party?: PartyResult;
};

export const monsterEightTextForCommand = (
  dungeonLevel: number,
  command: MonsterEight
): MonsterTextResult => {
  let text = '';
  let party: PartyResult | undefined;
  switch (command) {
    case MonsterEight.AerialServant:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 1),
        'aerial servant',
        'aerial servants'
      );
      break;
    case MonsterEight.Character: {
      const characters = characterResult(8, dungeonLevel);
      text = formatPartyResult(characters);
      party = characters;
      break;
    }
    case MonsterEight.DemonTypeIV:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 1),
        'type IV demon',
        'type IV demons'
      );
      break;
    case MonsterEight.DemonTypeV:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 1),
        'type V demon',
        'type V demons'
      );
      break;
    case MonsterEight.DemonTypeVI:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 1),
        'type VI demon',
        'type VI demons'
      );
      break;
    case MonsterEight.DevilIce:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 1),
        'ice devil',
        'ice devils'
      );
      break;
    case MonsterEight.Dragon:
      text = dragonSubtableReminder('A dragon is indicated');
      break;
    case MonsterEight.Ghost:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 1),
        'ghost',
        'ghosts'
      );
      break;
    case MonsterEight.GiantCloud_1to2:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 2),
        'cloud giant',
        'cloud giants'
      );
      break;
    case MonsterEight.GolemClay:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 1),
        'clay golem',
        'clay golems'
      );
      break;
    case MonsterEight.Hydra_13to16Heads: {
      const heads = getNumberOfMonsters(8, dungeonLevel, 1, 4, 12);
      text = formatMonsterCount(
        1,
        `${heads}-headed hydra`,
        `${heads}-headed hydrae`
      );
      break;
    }
    case MonsterEight.HydraPyro_12Heads: {
      const heads = getNumberOfMonsters(8, dungeonLevel, 1, 1, 11);
      text = formatMonsterCount(
        1,
        `${heads}-headed pyrohydra`,
        `${heads}-headed pyrohydrae`
      );
      break;
    }
    case MonsterEight.IntellectDevourer_1to2:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 2),
        'intellect devourer',
        'intellect devourers'
      );
      break;
    case MonsterEight.LurkerAbove:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 1),
        'lurker above',
        'lurkers above'
      );
      break;
    case MonsterEight.MoldBrown:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 1),
        'patch of brown mold',
        'patches of brown mold'
      );
      break;
    case MonsterEight.MoldYellow:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 1),
        'patch of yellow mold',
        'patches of yellow mold'
      );
      break;
    case MonsterEight.MindFlayer_1to4:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 4),
        'mind flayer',
        'mind flayers'
      );
      break;
    case MonsterEight.NagaGuardian_1to2:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 2),
        'guardian naga',
        'guardian nagas'
      );
      break;
    case MonsterEight.NeoOtyugh:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 1),
        'neo-otyugh',
        'neo-otyugh'
      );
      break;
    case MonsterEight.PurpleWorm:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 1),
        'purple worm',
        'purple worms'
      );
      break;
    case MonsterEight.RustMonster:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 1),
        'rust monster',
        'rust monsters'
      );
      break;
    case MonsterEight.SlugGiant:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 1),
        'giant slug',
        'giant slugs'
      );
      break;
    case MonsterEight.Trapper:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 1),
        'trapper',
        'trappers'
      );
      break;
    case MonsterEight.Vampire:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 1),
        'vampire',
        'vampires'
      );
      break;
    case MonsterEight.WillOWisp_2to5:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 4, 1),
        "will-o'-wisp",
        "will-o'-wisps"
      );
      break;
    case MonsterEight.Xorn_2to5:
      text = formatMonsterCount(
        getNumberOfMonsters(8, dungeonLevel, 1, 4, 1),
        'xorn',
        'xorn'
      );
      break;
  }
  return { text, party };
};

export const monsterEightResult = (dungeonLevel: number): string => {
  const roll = rollDice(monsterEight.sides);
  const command = getTableEntry(roll, monsterEight);
  return monsterEightTextForCommand(dungeonLevel, command).text;
};

export const dragonEightTextForCommand = (
  dungeonLevel: number,
  command: DragonEight
): string => {
  const label = dragonEightLabel(command);
  const count = getNumberOfMonsters(8, dungeonLevel, 1, 1);
  return formatMonsterCount(count, label, label);
};

function dragonEightLabel(command: DragonEight): string {
  switch (command) {
    case DragonEight.Black_Ancient_8:
      return 'ancient black dragon';
    case DragonEight.Blue_VeryOld_7:
      return 'very old blue dragon';
    case DragonEight.Brass_Ancient_8:
      return 'ancient brass dragon';
    case DragonEight.Bronze_VeryOld_7:
      return 'very old bronze dragon';
    case DragonEight.Copper_VeryOld_7:
      return 'very old copper dragon';
    case DragonEight.Gold_VeryOld_7:
      return 'very old gold dragon';
    case DragonEight.Green_VeryOld_7:
      return 'very old green dragon';
    case DragonEight.Red_VeryOld_7:
      return 'very old red dragon';
    case DragonEight.Silver_VeryOld_7:
      return 'very old silver dragon';
    case DragonEight.White_Ancient_8:
      return 'ancient white dragon';
    default:
      return 'ancient dragon';
  }
}
