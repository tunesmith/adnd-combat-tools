import {
  formatMonsterCount,
  getNumberOfMonsters,
} from '../wanderingMonsterResult';
import { getTableEntry, rollDice } from '../../helpers/dungeonLookup';
import { characterResult } from './characterResult';
import {
  DragonFiveOlder,
  dragonFiveOlder,
  DragonFiveYounger,
  dragonFiveYounger,
  MonsterFive,
  monsterFive,
} from '../../../tables/dungeon/monster/monsterFive';
import { formatPartyResult } from '../../helpers/party/formatPartyResult';

export const monsterFiveTextForCommand = (
  dungeonLevel: number,
  command: MonsterFive
): string => {
  switch (command) {
    case MonsterFive.Character: {
      const characters = characterResult(5, dungeonLevel);
      return formatPartyResult(characters);
    }
    case MonsterFive.Cockatrice_1to2: {
      const cockatrices = getNumberOfMonsters(5, dungeonLevel, 1, 2);
      return formatMonsterCount(cockatrices, 'cockatrice', 'cockatrices');
    }
    case MonsterFive.DisplacerBeast_1to2: {
      const beasts = getNumberOfMonsters(5, dungeonLevel, 1, 2);
      return formatMonsterCount(beasts, 'displacer beast', 'displacer beasts');
    }
    case MonsterFive.Doppleganger_1to3: {
      const dopplegangers = getNumberOfMonsters(5, dungeonLevel, 1, 3);
      return formatMonsterCount(dopplegangers, 'doppleganger', 'dopplegangers');
    }
    case MonsterFive.DragonYounger:
      return dragonFiveYoungerResult(dungeonLevel);
    case MonsterFive.DragonOlder:
      return dragonFiveOlderResult(dungeonLevel);
    case MonsterFive.Hydra_7Heads: {
      const heads = getNumberOfMonsters(5, dungeonLevel, 1, 1, 6);
      return formatMonsterCount(
        heads,
        `${heads}-headed hydra`,
        `${heads}-headed hydra`
      );
    }
    case MonsterFive.HydraPyro_6Heads: {
      const heads = getNumberOfMonsters(5, dungeonLevel, 1, 1, 5);
      return formatMonsterCount(
        heads,
        `${heads}-headed pyrohydra`,
        `${heads}-headed pyrohydra`
      );
    }
    case MonsterFive.Imp_1to2: {
      const imps = getNumberOfMonsters(5, dungeonLevel, 1, 2);
      return formatMonsterCount(imps, 'imp', 'imps');
    }
    case MonsterFive.Leucrotta_1to2: {
      const leucrottas = getNumberOfMonsters(5, dungeonLevel, 1, 2);
      return formatMonsterCount(leucrottas, 'leucrotta', 'leucrottas');
    }
    case MonsterFive.LizardSubterranean_1to3: {
      const lizards = getNumberOfMonsters(5, dungeonLevel, 1, 3);
      return formatMonsterCount(
        lizards,
        'subterranean lizard',
        `subterranean lizards`
      );
    }
    case MonsterFive.LycanthropeWereboar_1to3: {
      const wereboars = getNumberOfMonsters(5, dungeonLevel, 1, 3);
      return formatMonsterCount(
        wereboars,
        'wereboar lycanthrope',
        'wereboar lycanthropes'
      );
    }
    case MonsterFive.Minotaur_1to3: {
      const minotaurs = getNumberOfMonsters(5, dungeonLevel, 1, 3);
      return formatMonsterCount(minotaurs, 'minotaur', 'minotaurs');
    }
    case MonsterFive.MoldYellow: {
      const yellowMolds = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return formatMonsterCount(
        yellowMolds,
        'patch of yellow mold',
        'patches of yellow mold'
      );
    }
    case MonsterFive.Quasit: {
      const quasits = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return formatMonsterCount(quasits, 'quasit', 'quasits');
    }
    case MonsterFive.RustMonster: {
      const rustMonsters = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return formatMonsterCount(rustMonsters, 'rust monster', 'rust monsters');
    }
    case MonsterFive.Shrieker_2to5: {
      const shriekers = getNumberOfMonsters(5, dungeonLevel, 1, 4, 1);
      return formatMonsterCount(shriekers, 'shrieker', 'shriekers');
    }
    case MonsterFive.SlitheringTracker: {
      const trackers = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return formatMonsterCount(
        trackers,
        'slithering tracker',
        'slithering trackers'
      );
    }
    case MonsterFive.SnakeGiantAmphisbaena: {
      const snakes = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return formatMonsterCount(
        snakes,
        'giant amphisbaena snake',
        'giant amphisbaena snakes'
      );
    }
    case MonsterFive.SnakeGiantPoisonous: {
      const snakes = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return formatMonsterCount(
        snakes,
        'giant poisonous snake',
        'giant poisonous snakes'
      );
    }
    case MonsterFive.SnakeGiantSpitting: {
      const snakes = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return formatMonsterCount(
        snakes,
        'giant spitting snake',
        'giant spitting snakes'
      );
    }
    case MonsterFive.SpiderGiant_1to2: {
      const spiders = getNumberOfMonsters(5, dungeonLevel, 1, 2);
      return formatMonsterCount(spiders, 'giant spider', 'giant spiders');
    }
  }
};

export const monsterFiveResult = (dungeonLevel: number): string => {
  const roll = rollDice(monsterFive.sides);
  const command = getTableEntry(roll, monsterFive);
  return monsterFiveTextForCommand(dungeonLevel, command);
};

const dragonFiveYoungerResult = (dungeonLevel: number): string => {
  const dragonRoll = rollDice(dragonFiveYounger.sides);
  const dragonCommand = getTableEntry(dragonRoll, dragonFiveYounger);
  switch (dragonCommand) {
    case DragonFiveYounger.Black_YoungAdult_4: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'young adult black dragon with 4 hit points per die',
          'young adult black dragons with 4 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
    case DragonFiveYounger.Blue_SubAdult_3: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'sub-adult blue dragon with 3 hit points per die',
          'sub-adult blue dragons with 3 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
    case DragonFiveYounger.Brass_YoungAdult_4: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'young adult brass dragon with 4 hit points per die',
          'young adult brass dragons with 4 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
    case DragonFiveYounger.Bronze_SubAdult_3: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'sub-adult bronze dragon with 3 hit points per die',
          'sub-adult bronze dragons with 3 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
    case DragonFiveYounger.Copper_SubAdult_3: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'sub-adult copper dragon with 3 hit points per die',
          'sub-adult copper dragons with 3 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
    case DragonFiveYounger.Gold_SubAdult_3: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'sub-adult gold dragon with 3 hit points per die',
          'sub-adult gold dragons with 3 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
    case DragonFiveYounger.Green_SubAdult_3: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'sub-adult green dragon with 3 hit points per die',
          'sub-adult green dragons with 3 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
    case DragonFiveYounger.Red_SubAdult_3: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'sub-adult red dragon with 3 hit points per die',
          'sub-adult red dragons with 3 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
    case DragonFiveYounger.Silver_SubAdult_3: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'sub-adult silver dragon with 3 hit points per die',
          'sub-adult silver dragons with 3 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
    case DragonFiveYounger.White_YoungAdult_4: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'young adult white dragon with 4 hit points per die',
          'young adult white dragons with 4 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
  }
};

const dragonFiveOlderResult = (dungeonLevel: number): string => {
  const dragonRoll = rollDice(dragonFiveOlder.sides);
  const dragonCommand = getTableEntry(dragonRoll, dragonFiveOlder);
  switch (dragonCommand) {
    case DragonFiveOlder.Black_Adult_5: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'adult black dragon with 5 hit points per die',
          'adult black dragons with 5 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
    case DragonFiveOlder.Blue_YoungAdult_4: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'young adult blue dragon with 4 hit points per die',
          'young adult blue dragons with 4 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
    case DragonFiveOlder.Brass_Adult_5: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'adult brass dragon with 5 hit points per die',
          'adult brass dragons with 5 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
    case DragonFiveOlder.Bronze_YoungAdult_4: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'young adult bronze dragon with 4 hit points per die',
          'young adult bronze dragons with 4 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
    case DragonFiveOlder.Copper_YoungAdult_4: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'young adult copper dragon with 4 hit points per die',
          'young adult copper dragons with 4 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
    case DragonFiveOlder.Gold_YoungAdult_4: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'young adult gold dragon with 4 hit points per die',
          'young adult gold dragons with 4 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
    case DragonFiveOlder.Green_YoungAdult_4: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'young adult green dragon with 4 hit points per die',
          'young adult green dragons with 4 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
    case DragonFiveOlder.Red_YoungAdult_4: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'young adult red dragon with 4 hit points per die',
          'young adult red dragons with 4 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
    case DragonFiveOlder.Silver_YoungAdult_4: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'young adult silver dragon with 4 hit points per die',
          'young adult silver dragons with 4 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
    case DragonFiveOlder.White_Adult_5: {
      const dragons = getNumberOfMonsters(5, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          'adult white dragon with 5 hit points per die',
          'adult white dragons with 5 hit points per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) '
      );
    }
  }
};
