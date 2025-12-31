import { formatMonsterCount, getNumberOfMonsters } from '../monsterCounts';
import { characterResult } from '../../../services/monster/characterResult';
import {
  DragonFiveOlder,
  DragonFiveYounger,
  MonsterFive,
} from './monsterFiveTables';
import type { PartyResult } from '../../../models/character/characterSheet';
import { dragonSubtableReminder } from '../dragonSubtableReminder';

type MonsterTextResult = {
  text: string;
  party?: PartyResult;
};

export const monsterFiveTextForCommand = (
  dungeonLevel: number,
  command: MonsterFive
): MonsterTextResult => {
  let text = '';
  let party: PartyResult | undefined;
  switch (command) {
    case MonsterFive.Character: {
      const characters = characterResult(5, dungeonLevel);
      text = '';
      party = characters;
      break;
    }
    case MonsterFive.Cockatrice_1to2: {
      const cockatrices = getNumberOfMonsters(5, dungeonLevel, 1, 2);
      text = formatMonsterCount(cockatrices, 'cockatrice', 'cockatrices');
      break;
    }
    case MonsterFive.DisplacerBeast_1to2: {
      const beasts = getNumberOfMonsters(5, dungeonLevel, 1, 2);
      text = formatMonsterCount(beasts, 'displacer beast', 'displacer beasts');
      break;
    }
    case MonsterFive.Doppleganger_1to3: {
      const dopplegangers = getNumberOfMonsters(5, dungeonLevel, 1, 3);
      text = formatMonsterCount(dopplegangers, 'doppleganger', 'dopplegangers');
      break;
    }
    case MonsterFive.DragonYounger:
      text = dragonSubtableReminder('A younger dragon is indicated', {
        tableLabel: 'younger dragon subtable',
      });
      break;
    case MonsterFive.DragonOlder:
      text = dragonSubtableReminder('An older dragon is indicated', {
        tableLabel: 'older dragon subtable',
      });
      break;
    case MonsterFive.Hydra_7Heads: {
      const heads = getNumberOfMonsters(5, dungeonLevel, 1, 1, 6);
      text = formatMonsterCount(
        1,
        `${heads}-headed hydra`,
        `${heads}-headed hydrae`
      );
      break;
    }
    case MonsterFive.HydraPyro_6Heads: {
      const heads = getNumberOfMonsters(5, dungeonLevel, 1, 1, 5);
      text = formatMonsterCount(
        1,
        `${heads}-headed pyrohydra`,
        `${heads}-headed pyrohydrae`
      );
      break;
    }
    case MonsterFive.Imp_1to2: {
      const imps = getNumberOfMonsters(5, dungeonLevel, 1, 2);
      text = formatMonsterCount(imps, 'imp', 'imps');
      break;
    }
    case MonsterFive.Leucrotta_1to2: {
      const leucrottas = getNumberOfMonsters(5, dungeonLevel, 1, 2);
      text = formatMonsterCount(leucrottas, 'leucrotta', 'leucrottas');
      break;
    }
    case MonsterFive.LizardSubterranean_1to3: {
      const lizards = getNumberOfMonsters(5, dungeonLevel, 1, 3);
      text = formatMonsterCount(
        lizards,
        'subterranean lizard',
        'subterranean lizards'
      );
      break;
    }
    case MonsterFive.LycanthropeWereboar_1to3: {
      const wereboars = getNumberOfMonsters(5, dungeonLevel, 1, 3);
      text = formatMonsterCount(
        wereboars,
        'wereboar lycanthrope',
        'wereboar lycanthropes'
      );
      break;
    }
    case MonsterFive.Minotaur_1to3: {
      const minotaurs = getNumberOfMonsters(5, dungeonLevel, 1, 3);
      text = formatMonsterCount(minotaurs, 'minotaur', 'minotaurs');
      break;
    }
    case MonsterFive.MoldYellow: {
      const yellowMolds = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      text = formatMonsterCount(
        yellowMolds,
        'patch of yellow mold',
        'patches of yellow mold'
      );
      break;
    }
    case MonsterFive.Quasit: {
      const quasits = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      text = formatMonsterCount(quasits, 'quasit', 'quasits');
      break;
    }
    case MonsterFive.RustMonster: {
      const rustMonsters = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      text = formatMonsterCount(rustMonsters, 'rust monster', 'rust monsters');
      break;
    }
    case MonsterFive.Shrieker_2to5: {
      const shriekers = getNumberOfMonsters(5, dungeonLevel, 1, 4, 1);
      text = formatMonsterCount(shriekers, 'shrieker', 'shriekers');
      break;
    }
    case MonsterFive.SlitheringTracker: {
      const trackers = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      text = formatMonsterCount(
        trackers,
        'slithering tracker',
        'slithering trackers'
      );
      break;
    }
    case MonsterFive.SnakeGiantAmphisbaena: {
      const snakes = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      text = formatMonsterCount(
        snakes,
        'giant amphisbaena snake',
        'giant amphisbaena snakes'
      );
      break;
    }
    case MonsterFive.SnakeGiantPoisonous: {
      const snakes = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      text = formatMonsterCount(
        snakes,
        'giant poisonous snake',
        'giant poisonous snakes'
      );
      break;
    }
    case MonsterFive.SnakeGiantSpitting: {
      const snakes = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      text = formatMonsterCount(
        snakes,
        'giant spitting snake',
        'giant spitting snakes'
      );
      break;
    }
    case MonsterFive.SpiderGiant_1to2: {
      const spiders = getNumberOfMonsters(5, dungeonLevel, 1, 2);
      text = formatMonsterCount(spiders, 'giant spider', 'giant spiders');
      break;
    }
  }
  return { text, party };
};

export const dragonFiveYoungerTextForCommand = (
  dungeonLevel: number,
  command: DragonFiveYounger
): string => {
  const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
  const sharedSuffix =
    '(Determine the number of hit dice for a dragon as normal.) ';
  let text = '';
  switch (command) {
    case DragonFiveYounger.Black_YoungAdult_4:
      text =
        formatMonsterCount(
          dragons,
          'young adult black dragon with 4 hit points per die',
          'young adult black dragons with 4 hit points per die'
        ) + sharedSuffix;
      break;
    case DragonFiveYounger.Blue_SubAdult_3:
      text =
        formatMonsterCount(
          dragons,
          'sub-adult blue dragon with 3 hit points per die',
          'sub-adult blue dragons with 3 hit points per die'
        ) + sharedSuffix;
      break;
    case DragonFiveYounger.Brass_YoungAdult_4:
      text =
        formatMonsterCount(
          dragons,
          'young adult brass dragon with 4 hit points per die',
          'young adult brass dragons with 4 hit points per die'
        ) + sharedSuffix;
      break;
    case DragonFiveYounger.Bronze_SubAdult_3:
      text =
        formatMonsterCount(
          dragons,
          'sub-adult bronze dragon with 3 hit points per die',
          'sub-adult bronze dragons with 3 hit points per die'
        ) + sharedSuffix;
      break;
    case DragonFiveYounger.Copper_SubAdult_3:
      text =
        formatMonsterCount(
          dragons,
          'sub-adult copper dragon with 3 hit points per die',
          'sub-adult copper dragons with 3 hit points per die'
        ) + sharedSuffix;
      break;
    case DragonFiveYounger.Gold_SubAdult_3:
      text =
        formatMonsterCount(
          dragons,
          'sub-adult gold dragon with 3 hit points per die',
          'sub-adult gold dragons with 3 hit points per die'
        ) + sharedSuffix;
      break;
    case DragonFiveYounger.Green_SubAdult_3:
      text =
        formatMonsterCount(
          dragons,
          'sub-adult green dragon with 3 hit points per die',
          'sub-adult green dragons with 3 hit points per die'
        ) + sharedSuffix;
      break;
    case DragonFiveYounger.Red_SubAdult_3:
      text =
        formatMonsterCount(
          dragons,
          'sub-adult red dragon with 3 hit points per die',
          'sub-adult red dragons with 3 hit points per die'
        ) + sharedSuffix;
      break;
    case DragonFiveYounger.Silver_SubAdult_3:
      text =
        formatMonsterCount(
          dragons,
          'sub-adult silver dragon with 3 hit points per die',
          'sub-adult silver dragons with 3 hit points per die'
        ) + sharedSuffix;
      break;
    case DragonFiveYounger.White_YoungAdult_4:
      text =
        formatMonsterCount(
          dragons,
          'young adult white dragon with 4 hit points per die',
          'young adult white dragons with 4 hit points per die'
        ) + sharedSuffix;
      break;
  }
  return text;
};

export const dragonFiveOlderTextForCommand = (
  dungeonLevel: number,
  command: DragonFiveOlder
): string => {
  const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
  const suffix = '(Determine the number of hit dice for a dragon as normal.) ';
  const make = (color: string, age: string, hp: number) =>
    formatMonsterCount(
      dragons,
      `${age} ${color} dragon with ${hp} hit points per die`,
      `${age} ${color} dragons with ${hp} hit points per die`
    ) + suffix;
  let text = '';
  switch (command) {
    case DragonFiveOlder.Black_Adult_5:
      text = make('black', 'adult', 5);
      break;
    case DragonFiveOlder.Blue_YoungAdult_4:
      text = make('blue', 'young adult', 4);
      break;
    case DragonFiveOlder.Brass_Adult_5:
      text = make('brass', 'adult', 5);
      break;
    case DragonFiveOlder.Bronze_YoungAdult_4:
      text = make('bronze', 'young adult', 4);
      break;
    case DragonFiveOlder.Copper_YoungAdult_4:
      text = make('copper', 'young adult', 4);
      break;
    case DragonFiveOlder.Gold_YoungAdult_4:
      text = make('gold', 'young adult', 4);
      break;
    case DragonFiveOlder.Green_YoungAdult_4:
      text = make('green', 'young adult', 4);
      break;
    case DragonFiveOlder.Red_YoungAdult_4:
      text = make('red', 'young adult', 4);
      break;
    case DragonFiveOlder.Silver_YoungAdult_4:
      text = make('silver', 'young adult', 4);
      break;
    case DragonFiveOlder.White_Adult_5:
      text = make('white', 'adult', 5);
      break;
  }
  return text;
};
