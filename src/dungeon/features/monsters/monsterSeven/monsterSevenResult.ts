import {
  formatMonsterCount,
  getNumberOfMonsters,
} from '../monsterCounts';
import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import { characterResult } from '../../../services/monster/characterResult';
import {
  MonsterSeven,
  DragonSeven,
  monsterSeven,
} from './monsterSevenTables';
import type { PartyResult } from '../../../models/character/characterSheet';
import { dragonSubtableReminder } from '../dragonSubtableReminder';

type MonsterTextResult = {
  text: string;
  party?: PartyResult;
};

export const monsterSevenTextForCommand = (
  dungeonLevel: number,
  command: MonsterSeven
): MonsterTextResult => {
  let text = '';
  let party: PartyResult | undefined;
  switch (command) {
    case MonsterSeven.BlackPudding:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 1),
        'black pudding',
        'black puddings'
      );
      break;
    case MonsterSeven.Character: {
      const characters = characterResult(7, dungeonLevel);
      text = '';
      party = characters;
      break;
    }
    case MonsterSeven.Chimera_1to2:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 2),
        'chimera',
        'chimerae'
      );
      break;
    case MonsterSeven.DemonSuccubus:
      text = 'A succubus demon stalks the area. ';
      break;
    case MonsterSeven.DemonTypeI:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 1),
        'type I demon',
        'type I demons'
      );
      break;
    case MonsterSeven.DemonTypeII:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 1),
        'type II demon',
        'type II demons'
      );
      break;
    case MonsterSeven.DemonTypeIII:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 1),
        'type III demon',
        'type III demons'
      );
      break;
    case MonsterSeven.DevilBarbed:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 1),
        'barbed devil',
        'barbed devils'
      );
      break;
    case MonsterSeven.DevilBone:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 1),
        'bone devil',
        'bone devils'
      );
      break;
    case MonsterSeven.DevilHorned:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 1),
        'horned devil',
        'horned devils'
      );
      break;
    case MonsterSeven.Dragon:
      text = dragonSubtableReminder('A dragon is indicated');
      break;
    case MonsterSeven.Efreeti:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 1),
        'efreeti',
        'efreet'
      );
      break;
    case MonsterSeven.Elemental:
      text = 'An elemental answers the call here. ';
      break;
    case MonsterSeven.Ettin_1to2:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 2),
        'ettin',
        'ettins'
      );
      break;
    case MonsterSeven.GiantHillOrStone_1to3:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 3),
        'hill/stone giant',
        'hill/stone giants'
      );
      break;
    case MonsterSeven.GiantFireOrFrost_1to2:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 2),
        'fire/frost giant',
        'fire/frost giants'
      );
      break;
    case MonsterSeven.GolemFlesh:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 1),
        'flesh golem',
        'flesh golems'
      );
      break;
    case MonsterSeven.Gorgon:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 1),
        'gorgon',
        'gorgons'
      );
      break;
    case MonsterSeven.GroaningSpirit: {
      const spirits = getNumberOfMonsters(7, dungeonLevel, 1, 1);
      text = formatMonsterCount(
        spirits,
        'groaning spirit (banshee)',
        'groaning spirits (banshee)'
      );
      break;
    }
    case MonsterSeven.Hydra_10to12Heads: {
      const heads = getNumberOfMonsters(7, dungeonLevel, 1, 3, 9);
      text = formatMonsterCount(
        1,
        `${heads}-headed hydra`,
        `${heads}-headed hydrae`
      );
      break;
    }
    case MonsterSeven.HydroPyro_7to9Heads: {
      const heads = getNumberOfMonsters(7, dungeonLevel, 1, 3, 6);
      text = formatMonsterCount(
        1,
        `${heads}-headed pyrohydra`,
        `${heads}-headed pyrohydrae`
      );
      break;
    }
    case MonsterSeven.IntellectDevourer:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 1),
        'intellect devourer',
        'intellect devourers'
      );
      break;
    case MonsterSeven.InvisibleStalker:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 1),
        'invisible stalker',
        'invisible stalkers'
      );
      break;
    case MonsterSeven.Lamia_1to2:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 2),
        'lamia',
        'lamias'
      );
      break;
    case MonsterSeven.LizardFire_1to3:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 3),
        'fire lizard',
        'fire lizards'
      );
      break;
    case MonsterSeven.LurkerAbove:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 1),
        'lurker above',
        'lurkers above'
      );
      break;
    case MonsterSeven.Mezzodaemon:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 1),
        'mezzodaemon',
        'mezzodaemons'
      );
      break;
    case MonsterSeven.Mimic:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 1),
        'mimic',
        'mimics'
      );
      break;
    case MonsterSeven.MindFlayer_1to2:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 2),
        'mind flayer',
        'mind flayers'
      );
      break;
    case MonsterSeven.Mummy_1to2:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 2),
        'mummy',
        'mummies'
      );
      break;
    case MonsterSeven.NagaSpirit_1to2:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 2),
        'spirit naga',
        'spirit nagas'
      );
      break;
    case MonsterSeven.NeoOtyugh:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 1),
        'neo-otyugh',
        'neo-otyughs'
      );
      break;
    case MonsterSeven.NightHag_1to2:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 2),
        'night hag',
        'night hags'
      );
      break;
    case MonsterSeven.Roper_1to2:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 2),
        'roper',
        'ropers'
      );
      break;
    case MonsterSeven.ShamblingMound_1to2:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 2),
        'shambling mound',
        'shambling mounds'
      );
      break;
    case MonsterSeven.Shedu_1to2:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 2),
        'shedu',
        'shedu'
      );
      break;
    case MonsterSeven.SlugGiant:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 1),
        'giant slug',
        'giant slugs'
      );
      break;
    case MonsterSeven.Spectre:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 2),
        'spectre',
        'spectres'
      );
      break;
    case MonsterSeven.Trapper:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 1),
        'trapper',
        'trappers'
      );
      break;
    case MonsterSeven.UmberHulk:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 1),
        'umber hulk',
        'umber hulks'
      );
      break;
    case MonsterSeven.WillOWisp_1to3:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 3),
        "will-o'-wisp",
        "will-o'-wisps"
      );
      break;
    case MonsterSeven.Xorn_1to3:
      text = formatMonsterCount(
        getNumberOfMonsters(7, dungeonLevel, 1, 3),
        'xorn',
        'xorn'
      );
      break;
  }

  return { text, party };
};

export const monsterSevenResult = (dungeonLevel: number): string => {
  const roll = rollDice(monsterSeven.sides);
  const command = getTableEntry(roll, monsterSeven);
  return monsterSevenTextForCommand(dungeonLevel, command).text;
};

export const dragonSevenTextForCommand = (
  dungeonLevel: number,
  command: DragonSeven
): string => {
  const label = dragonSevenLabel(command);
  const count = getNumberOfMonsters(7, dungeonLevel, 1, 1);
  return formatMonsterCount(count, label, label);
};

function dragonSevenLabel(command: DragonSeven): string {
  switch (command) {
    case DragonSeven.Black_VeryOld_7:
      return 'very old black dragon';
    case DragonSeven.Blue_Old_6:
      return 'old blue dragon';
    case DragonSeven.Brass_VeryOld_7:
      return 'very old brass dragon';
    case DragonSeven.Bronze_Old_6:
      return 'old bronze dragon';
    case DragonSeven.Copper_Old_6:
      return 'old copper dragon';
    case DragonSeven.Gold_Old_6:
      return 'old gold dragon';
    case DragonSeven.Green_Old_6:
      return 'old green dragon';
    case DragonSeven.Red_Old_6:
      return 'old red dragon';
    case DragonSeven.Silver_Old_6:
      return 'old silver dragon';
    case DragonSeven.White_VeryOld_7:
      return 'very old white dragon';
    default:
      return 'ancient dragon';
  }
}
