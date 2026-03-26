import { formatMonsterCount } from '../monsterCounts';
import { characterResult } from '../../../services/monster/characterResult';
import { MonsterSeven, DragonSeven } from './monsterSevenTables';
import { dragonSubtableReminder } from '../dragonSubtableReminder';
import {
  computedCountTextEntry,
  countTextEntry,
  fixedTextEntry,
  partyTextResult,
  resolveMonsterTextFromEntries,
  type MonsterTextEntry,
  type MonsterTextResult,
} from '../resultHelpers';

const monsterSevenEntries: Partial<Record<MonsterSeven, MonsterTextEntry>> = {
  [MonsterSeven.BlackPudding]: countTextEntry(
    1,
    1,
    'black pudding',
    'black puddings'
  ),
  [MonsterSeven.Chimera_1to2]: countTextEntry(1, 2, 'chimera', 'chimerae'),
  [MonsterSeven.DemonSuccubus]: fixedTextEntry(
    'A succubus demon stalks the area. '
  ),
  [MonsterSeven.DemonTypeI]: countTextEntry(
    1,
    1,
    'type I demon',
    'type I demons'
  ),
  [MonsterSeven.DemonTypeII]: countTextEntry(
    1,
    1,
    'type II demon',
    'type II demons'
  ),
  [MonsterSeven.DemonTypeIII]: countTextEntry(
    1,
    1,
    'type III demon',
    'type III demons'
  ),
  [MonsterSeven.DevilBarbed]: countTextEntry(
    1,
    1,
    'barbed devil',
    'barbed devils'
  ),
  [MonsterSeven.DevilBone]: countTextEntry(1, 1, 'bone devil', 'bone devils'),
  [MonsterSeven.DevilHorned]: countTextEntry(
    1,
    1,
    'horned devil',
    'horned devils'
  ),
  [MonsterSeven.Efreeti]: countTextEntry(1, 1, 'efreeti', 'efreet'),
  [MonsterSeven.Elemental]: fixedTextEntry(
    'An elemental answers the call here. '
  ),
  [MonsterSeven.Ettin_1to2]: countTextEntry(1, 2, 'ettin', 'ettins'),
  [MonsterSeven.GiantHillOrStone_1to3]: countTextEntry(
    1,
    3,
    'hill/stone giant',
    'hill/stone giants'
  ),
  [MonsterSeven.GiantFireOrFrost_1to2]: countTextEntry(
    1,
    2,
    'fire/frost giant',
    'fire/frost giants'
  ),
  [MonsterSeven.GolemFlesh]: countTextEntry(
    1,
    1,
    'flesh golem',
    'flesh golems'
  ),
  [MonsterSeven.Gorgon]: countTextEntry(1, 1, 'gorgon', 'gorgons'),
  [MonsterSeven.GroaningSpirit]: countTextEntry(
    1,
    1,
    'groaning spirit (banshee)',
    'groaning spirits (banshee)'
  ),
  [MonsterSeven.Hydra_10to12Heads]: computedCountTextEntry(
    1,
    3,
    (heads) =>
      formatMonsterCount(1, `${heads}-headed hydra`, `${heads}-headed hydrae`),
    9
  ),
  [MonsterSeven.HydroPyro_7to9Heads]: computedCountTextEntry(
    1,
    3,
    (heads) =>
      formatMonsterCount(
        1,
        `${heads}-headed pyrohydra`,
        `${heads}-headed pyrohydrae`
      ),
    6
  ),
  [MonsterSeven.IntellectDevourer]: countTextEntry(
    1,
    1,
    'intellect devourer',
    'intellect devourers'
  ),
  [MonsterSeven.InvisibleStalker]: countTextEntry(
    1,
    1,
    'invisible stalker',
    'invisible stalkers'
  ),
  [MonsterSeven.Lamia_1to2]: countTextEntry(1, 2, 'lamia', 'lamias'),
  [MonsterSeven.LizardFire_1to3]: countTextEntry(
    1,
    3,
    'fire lizard',
    'fire lizards'
  ),
  [MonsterSeven.LurkerAbove]: countTextEntry(
    1,
    1,
    'lurker above',
    'lurkers above'
  ),
  [MonsterSeven.Mezzodaemon]: countTextEntry(
    1,
    1,
    'mezzodaemon',
    'mezzodaemons'
  ),
  [MonsterSeven.Mimic]: countTextEntry(1, 1, 'mimic', 'mimics'),
  [MonsterSeven.MindFlayer_1to2]: countTextEntry(
    1,
    2,
    'mind flayer',
    'mind flayers'
  ),
  [MonsterSeven.Mummy_1to2]: countTextEntry(1, 2, 'mummy', 'mummies'),
  [MonsterSeven.NagaSpirit_1to2]: countTextEntry(
    1,
    2,
    'spirit naga',
    'spirit nagas'
  ),
  [MonsterSeven.NeoOtyugh]: countTextEntry(1, 1, 'neo-otyugh', 'neo-otyughs'),
  [MonsterSeven.NightHag_1to2]: countTextEntry(1, 2, 'night hag', 'night hags'),
  [MonsterSeven.Roper_1to2]: countTextEntry(1, 2, 'roper', 'ropers'),
  [MonsterSeven.ShamblingMound_1to2]: countTextEntry(
    1,
    2,
    'shambling mound',
    'shambling mounds'
  ),
  [MonsterSeven.Shedu_1to2]: countTextEntry(1, 2, 'shedu', 'shedu'),
  [MonsterSeven.SlugGiant]: countTextEntry(1, 1, 'giant slug', 'giant slugs'),
  [MonsterSeven.Spectre]: countTextEntry(1, 2, 'spectre', 'spectres'),
  [MonsterSeven.Trapper]: countTextEntry(1, 1, 'trapper', 'trappers'),
  [MonsterSeven.UmberHulk]: countTextEntry(1, 1, 'umber hulk', 'umber hulks'),
  [MonsterSeven.WillOWisp_1to3]: countTextEntry(
    1,
    3,
    "will-o'-wisp",
    "will-o'-wisps"
  ),
  [MonsterSeven.Xorn_1to3]: countTextEntry(1, 3, 'xorn', 'xorn'),
};

const dragonSevenEntries: Record<DragonSeven, MonsterTextEntry> = {
  [DragonSeven.Black_VeryOld_7]: countTextEntry(
    1,
    1,
    'very old black dragon',
    'very old black dragons'
  ),
  [DragonSeven.Blue_Old_6]: countTextEntry(
    1,
    1,
    'old blue dragon',
    'old blue dragons'
  ),
  [DragonSeven.Brass_VeryOld_7]: countTextEntry(
    1,
    1,
    'very old brass dragon',
    'very old brass dragons'
  ),
  [DragonSeven.Bronze_Old_6]: countTextEntry(
    1,
    1,
    'old bronze dragon',
    'old bronze dragons'
  ),
  [DragonSeven.Copper_Old_6]: countTextEntry(
    1,
    1,
    'old copper dragon',
    'old copper dragons'
  ),
  [DragonSeven.Gold_Old_6]: countTextEntry(
    1,
    1,
    'old gold dragon',
    'old gold dragons'
  ),
  [DragonSeven.Green_Old_6]: countTextEntry(
    1,
    1,
    'old green dragon',
    'old green dragons'
  ),
  [DragonSeven.Red_Old_6]: countTextEntry(
    1,
    1,
    'old red dragon',
    'old red dragons'
  ),
  [DragonSeven.Silver_Old_6]: countTextEntry(
    1,
    1,
    'old silver dragon',
    'old silver dragons'
  ),
  [DragonSeven.White_VeryOld_7]: countTextEntry(
    1,
    1,
    'very old white dragon',
    'very old white dragons'
  ),
};

export const monsterSevenTextForCommand = (
  dungeonLevel: number,
  command: MonsterSeven
): MonsterTextResult => {
  switch (command) {
    case MonsterSeven.Character:
      return partyTextResult(characterResult(7, dungeonLevel));
    case MonsterSeven.Dragon:
      return { text: dragonSubtableReminder('A dragon is indicated') };
    default:
      return {
        text: resolveMonsterTextFromEntries(
          7,
          dungeonLevel,
          command,
          monsterSevenEntries
        ),
      };
  }
};

export const dragonSevenTextForCommand = (
  dungeonLevel: number,
  command: DragonSeven
): string => {
  return resolveMonsterTextFromEntries(
    7,
    dungeonLevel,
    command,
    dragonSevenEntries
  );
};
