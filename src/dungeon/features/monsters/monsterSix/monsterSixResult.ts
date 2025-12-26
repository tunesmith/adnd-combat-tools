import { formatMonsterCount, getNumberOfMonsters } from '../monsterCounts';
import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import { characterResult } from '../../../services/monster/characterResult';
import { DragonSix, MonsterSix, monsterSix } from './monsterSixTables';
import type { PartyResult } from '../../../models/character/characterSheet';
import { dragonSubtableReminder } from '../dragonSubtableReminder';

type MonsterTextResult = {
  text: string;
  party?: PartyResult;
};

export const monsterSixTextForCommand = (
  dungeonLevel: number,
  command: MonsterSix
): MonsterTextResult => {
  let text = '';
  let party: PartyResult | undefined;
  switch (command) {
    case MonsterSix.Basilisk: {
      const basilisks = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      text = formatMonsterCount(basilisks, 'basilisk', 'basilisks');
      break;
    }
    case MonsterSix.CarrionCrawler_1to2: {
      const crawlers = getNumberOfMonsters(6, dungeonLevel, 1, 2);
      text = formatMonsterCount(
        crawlers,
        'carrion crawler',
        'carrion crawlers'
      );
      break;
    }
    case MonsterSix.Character: {
      const characters = characterResult(6, dungeonLevel);
      text = '';
      party = characters;
      break;
    }
    case MonsterSix.DevilErinyes_1to2: {
      const erinyes = getNumberOfMonsters(6, dungeonLevel, 1, 2);
      text = formatMonsterCount(erinyes, 'erinyes', 'erinyes');
      break;
    }
    case MonsterSix.Djinni: {
      const djinni = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      text = formatMonsterCount(djinni, 'djinni', 'djinn');
      break;
    }
    case MonsterSix.Dragon:
      text = dragonSubtableReminder('A dragon is indicated');
      break;
    case MonsterSix.GreenSlime: {
      const slime = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      text = formatMonsterCount(
        slime,
        'patch of green slime',
        'patches of green slime'
      );
      break;
    }
    case MonsterSix.Hydra_8to9Heads: {
      const heads = getNumberOfMonsters(6, dungeonLevel, 1, 2, 7);
      text = formatMonsterCount(
        1,
        `${heads}-headed hydra`,
        `${heads}-headed hydrae`
      );
      break;
    }
    case MonsterSix.Jackalwere_1to2: {
      const jackalwere = getNumberOfMonsters(6, dungeonLevel, 1, 2);
      text = formatMonsterCount(jackalwere, 'jackalwere', 'jackalwere');
      break;
    }
    case MonsterSix.Lammasu_1to3: {
      const lammasu = getNumberOfMonsters(6, dungeonLevel, 1, 3);
      text = formatMonsterCount(lammasu, 'lammasu', 'lammasu');
      break;
    }
    case MonsterSix.LycanthropeWerebear: {
      const werebears = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      text = formatMonsterCount(
        werebears,
        'werebear lycanthrope',
        'werebear lycanthropes'
      );
      break;
    }
    case MonsterSix.LycanthropeWeretiger_1to2: {
      const weretigers = getNumberOfMonsters(6, dungeonLevel, 1, 2);
      text = formatMonsterCount(
        weretigers,
        'weretiger lycanthrope',
        'weretiger lycanthropes'
      );
      break;
    }
    case MonsterSix.Manticore_1to2: {
      const manticores = getNumberOfMonsters(6, dungeonLevel, 1, 2);
      text = formatMonsterCount(manticores, 'manticore', 'manticores');
      break;
    }
    case MonsterSix.Medusa: {
      const medusae = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      text = formatMonsterCount(medusae, 'medusa', 'medusae');
      break;
    }
    case MonsterSix.MoldBrown: {
      const yellowMolds = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      text = formatMonsterCount(
        yellowMolds,
        'patch of brown mold',
        'patches of brown mold'
      );
      break;
    }
    case MonsterSix.MoldYellow: {
      const yellowMolds = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      text = formatMonsterCount(
        yellowMolds,
        'patch of yellow mold',
        'patches of yellow mold'
      );
      break;
    }
    case MonsterSix.OgreMagi_1to2: {
      const ogreMagi = getNumberOfMonsters(6, dungeonLevel, 1, 2);
      text = formatMonsterCount(ogreMagi, 'ogre mage', 'ogre magi');
      break;
    }
    case MonsterSix.Otyugh: {
      const otyugh = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      text = formatMonsterCount(otyugh, 'otyugh', 'otyugh');
      break;
    }
    case MonsterSix.Rakshasa: {
      const rakshasas = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      text = formatMonsterCount(rakshasas, 'rakshasa', 'rakshasas');
      break;
    }
    case MonsterSix.Salamander_1to2: {
      const salamanders = getNumberOfMonsters(6, dungeonLevel, 1, 2);
      text = formatMonsterCount(salamanders, 'salamander', 'salamanders');
      break;
    }
    case MonsterSix.SpiderPhase_1to3: {
      const spiders = getNumberOfMonsters(6, dungeonLevel, 1, 3);
      text = formatMonsterCount(spiders, 'phase spiders', 'phase spiders');
      break;
    }
    case MonsterSix.Troll_1to3: {
      const trolls = getNumberOfMonsters(6, dungeonLevel, 1, 3);
      text = formatMonsterCount(trolls, 'troll', 'trolls');
      break;
    }
    case MonsterSix.Wight_1to4: {
      const wights = getNumberOfMonsters(6, dungeonLevel, 1, 4);
      text = formatMonsterCount(wights, 'wight', 'wights');
      break;
    }
    case MonsterSix.WindWalker_1to2: {
      const windWalkers = getNumberOfMonsters(6, dungeonLevel, 1, 2);
      text = formatMonsterCount(windWalkers, 'wind walker', 'wind walkers');
      break;
    }
    case MonsterSix.Wraith_1to2: {
      const wraiths = getNumberOfMonsters(6, dungeonLevel, 1, 2);
      text = formatMonsterCount(wraiths, 'wraith', 'wraiths');
      break;
    }
    case MonsterSix.Wyvern: {
      const wyverns = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      text = formatMonsterCount(wyverns, 'wyvern', 'wyverns');
      break;
    }
  }
  return { text, party };
};

export const monsterSixResult = (dungeonLevel: number): string => {
  const roll = rollDice(monsterSix.sides);
  const command = getTableEntry(roll, monsterSix);
  return monsterSixTextForCommand(dungeonLevel, command).text;
};

export const dragonSixTextForCommand = (
  dungeonLevel: number,
  command: DragonSix
): string => {
  const dragons = getNumberOfMonsters(6, dungeonLevel, 1, 1);
  const make = (age: string, color: string, hp: number) =>
    formatMonsterCount(
      dragons,
      `${age} ${color} dragon with ${hp} hit points per die`,
      `${age} ${color} dragons with ${hp} hit points per die`
    ) + '(Determine the number of hit dice for a dragon as normal.) ';
  let text = '';
  switch (command) {
    case DragonSix.Black_Old_6:
      text = make('old', 'black', 6);
      break;
    case DragonSix.Blue_Adult_5:
      text = make('adult', 'blue', 5);
      break;
    case DragonSix.Brass_Old_6:
      text = make('old', 'brass', 6);
      break;
    case DragonSix.Bronze_Adult_5:
      text = make('adult', 'bronze', 5);
      break;
    case DragonSix.Copper_Adult_5:
      text = make('adult', 'copper', 5);
      break;
    case DragonSix.Gold_Adult_5:
      text = make('adult', 'gold', 5);
      break;
    case DragonSix.Green_Adult_5:
      text = make('adult', 'green', 5);
      break;
    case DragonSix.Red_Adult_5:
      text = make('adult', 'red', 5);
      break;
    case DragonSix.Silver_Adult_5:
      text = make('adult', 'silver', 5);
      break;
    case DragonSix.White_Old_6:
      text = make('old', 'white', 6);
      break;
  }
  return text;
};
