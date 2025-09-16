import {
  formatMonsterCount,
  getNumberOfMonsters,
} from '../wanderingMonsterResult';
import { getTableEntry, rollDice } from '../../helpers/dungeonLookup';
import { characterResult } from './characterResult';
import {
  DragonSix,
  dragonSix,
  MonsterSix,
  monsterSix,
} from '../../../tables/dungeon/monster/monsterSix';
import { formatPartyResult } from '../../helpers/party/formatPartyResult';

export const monsterSixTextForCommand = (
  dungeonLevel: number,
  command: MonsterSix
): string => {
  switch (command) {
    case MonsterSix.Basilisk: {
      const basilisks = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      return formatMonsterCount(basilisks, 'basilisk', 'basilisks');
    }
    case MonsterSix.CarrionCrawler_1to2: {
      const crawlers = getNumberOfMonsters(6, dungeonLevel, 1, 2);
      return formatMonsterCount(
        crawlers,
        'carrion crawler',
        'carrion crawlers'
      );
    }
    case MonsterSix.Character: {
      const characters = characterResult(6, dungeonLevel);
      return formatPartyResult(characters);
    }
    case MonsterSix.DevilErinyes_1to2: {
      const erinyes = getNumberOfMonsters(6, dungeonLevel, 1, 2);
      return formatMonsterCount(erinyes, 'erinyes', 'erinyes');
    }
    case MonsterSix.Djinni: {
      const djinni = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      return formatMonsterCount(djinni, 'djinni', 'djinn');
    }
    case MonsterSix.Dragon:
      return dragonSixResult(dungeonLevel);
    case MonsterSix.GreenSlime: {
      const slime = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      return formatMonsterCount(
        slime,
        'patch of green slime',
        'patches of green slime'
      );
    }
    case MonsterSix.Hydra_8to9Heads: {
      const heads = getNumberOfMonsters(6, dungeonLevel, 1, 2, 7);
      return formatMonsterCount(
        heads,
        `${heads}-headed hydra`,
        `${heads}-headed hydra`
      );
    }
    case MonsterSix.Jackalwere_1to2: {
      const jackalwere = getNumberOfMonsters(6, dungeonLevel, 1, 2);
      return formatMonsterCount(jackalwere, `jackalwere`, `jackalwere`);
    }
    case MonsterSix.Lammasu_1to3: {
      const lammasu = getNumberOfMonsters(6, dungeonLevel, 1, 3);
      return formatMonsterCount(lammasu, 'lammasu', 'lammasu');
    }
    case MonsterSix.LycanthropeWerebear: {
      const werebears = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      return formatMonsterCount(
        werebears,
        'werebear lycanthrope',
        'werebear lycanthropes'
      );
    }
    case MonsterSix.LycanthropeWeretiger_1to2: {
      const weretigers = getNumberOfMonsters(6, dungeonLevel, 1, 2);
      return formatMonsterCount(
        weretigers,
        'weretiger lycanthrope',
        'weretiger lycanthropes'
      );
    }
    case MonsterSix.Manticore_1to2: {
      const manticores = getNumberOfMonsters(6, dungeonLevel, 1, 2);
      return formatMonsterCount(manticores, 'manticore', 'manticores');
    }
    case MonsterSix.Medusa: {
      const medusae = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      return formatMonsterCount(medusae, 'medusa', 'medusae');
    }
    case MonsterSix.MoldBrown: {
      const yellowMolds = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      return formatMonsterCount(
        yellowMolds,
        'patch of brown mold',
        'patches of brown mold'
      );
    }
    case MonsterSix.MoldYellow: {
      const yellowMolds = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      return formatMonsterCount(
        yellowMolds,
        'patch of yellow mold',
        'patches of yellow mold'
      );
    }
    case MonsterSix.OgreMagi_1to2: {
      const ogreMagi = getNumberOfMonsters(6, dungeonLevel, 1, 2);
      return formatMonsterCount(ogreMagi, 'ogre mage', 'ogre magi');
    }
    case MonsterSix.Otyugh: {
      const otyugh = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      return formatMonsterCount(otyugh, 'otyugh', 'otyugh');
    }
    case MonsterSix.Rakshasa: {
      const rakshasas = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      return formatMonsterCount(rakshasas, 'rakshasa', 'rakshasas');
    }
    case MonsterSix.Salamander_1to2: {
      const salamanders = getNumberOfMonsters(6, dungeonLevel, 1, 2);
      return formatMonsterCount(salamanders, 'salamander', 'salamanders');
    }
    case MonsterSix.SpiderPhase_1to3: {
      const spiders = getNumberOfMonsters(6, dungeonLevel, 1, 3);
      return formatMonsterCount(spiders, 'phase spiders', 'phase spiders');
    }
    case MonsterSix.Troll_1to3: {
      const trolls = getNumberOfMonsters(6, dungeonLevel, 1, 3);
      return formatMonsterCount(trolls, 'troll', 'trolls');
    }
    case MonsterSix.Wight_1to4: {
      const wights = getNumberOfMonsters(6, dungeonLevel, 1, 4);
      return formatMonsterCount(wights, 'wight', 'wights');
    }
    case MonsterSix.WindWalker_1to2: {
      const windWalkers = getNumberOfMonsters(6, dungeonLevel, 1, 2);
      return formatMonsterCount(windWalkers, 'wind walker', 'wind walkers');
    }
    case MonsterSix.Wraith_1to2: {
      const wraiths = getNumberOfMonsters(6, dungeonLevel, 1, 2);
      return formatMonsterCount(wraiths, 'wraith', 'wraiths');
    }
    case MonsterSix.Wyvern: {
      const wyverns = getNumberOfMonsters(6, dungeonLevel, 1, 1);
      return formatMonsterCount(wyverns, 'wyvern', 'wyverns');
    }
  }
};

export const monsterSixResult = (dungeonLevel: number): string => {
  const roll = rollDice(monsterSix.sides);
  const command = getTableEntry(roll, monsterSix);
  return monsterSixTextForCommand(dungeonLevel, command);
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

const dragonSixResult = (dungeonLevel: number): string => {
  const dragonRoll = rollDice(dragonSix.sides);
  const dragonCommand = getTableEntry(dragonRoll, dragonSix);
  return dragonSixTextForCommand(dungeonLevel, dragonCommand);
};
