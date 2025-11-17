import {
  formatMonsterCount,
  getNumberOfMonsters,
} from '../wanderingMonsterResult';
import { getTableEntry, rollDice } from '../../helpers/dungeonLookup';
import { characterResult } from './characterResult';
import {
  DragonFourOlder,
  DragonFourYounger,
  MonsterFour,
  monsterFour,
} from '../../../tables/dungeon/monster/monsterFour';
import type { PartyResult } from '../../models/character/characterSheet';
import { dragonSubtableReminder } from './dragonSubtableReminder';

type MonsterTextResult = {
  text: string;
  party?: PartyResult;
};

export const monsterFourTextForCommand = (
  dungeonLevel: number,
  command: MonsterFour
): MonsterTextResult => {
  let text = '';
  let party: PartyResult | undefined;
  switch (command) {
    case MonsterFour.ApeCarnivorous_1to3: {
      const apes = getNumberOfMonsters(4, dungeonLevel, 1, 3);
      text = formatMonsterCount(apes, 'carnivorous ape', 'carnivorous apes');
      break;
    }
    case MonsterFour.BlinkDog_2to5: {
      const blinkDogs = getNumberOfMonsters(4, dungeonLevel, 1, 4, 1);
      text = formatMonsterCount(blinkDogs, 'blink dog', 'blink dogs');
      break;
    }
    case MonsterFour.Character: {
      const characters = characterResult(4, dungeonLevel);
      text = '';
      party = characters;
      break;
    }
    case MonsterFour.DragonYounger:
      text = dragonSubtableReminder('A younger dragon is indicated', {
        tableLabel: 'younger dragon subtable',
      });
      break;
    case MonsterFour.DragonOlder:
      text = dragonSubtableReminder('An older dragon is indicated', {
        tableLabel: 'older dragon subtable',
      });
      break;
    case MonsterFour.Gargoyle_1to2: {
      const gargoyles = getNumberOfMonsters(4, dungeonLevel, 1, 2);
      text = formatMonsterCount(gargoyles, 'gargoyle', 'gargoyles');
      break;
    }
    case MonsterFour.Ghast_1to4: {
      const ghasts = getNumberOfMonsters(4, dungeonLevel, 1, 4);
      text = formatMonsterCount(ghasts, 'ghast', 'ghasts');
      break;
    }
    case MonsterFour.GrayOoze: {
      const oozes = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      text = formatMonsterCount(oozes, 'gray ooze', 'gray oozes');
      break;
    }
    case MonsterFour.Hellhound_1to2: {
      const hounds = getNumberOfMonsters(4, dungeonLevel, 1, 2);
      text = formatMonsterCount(hounds, 'hell hound', 'hell hounds');
      break;
    }
    case MonsterFour.Hydra_5to6Heads: {
      const heads = getNumberOfMonsters(4, dungeonLevel, 1, 2, 4);
      text = formatMonsterCount(
        1,
        `${heads}-headed hydra`,
        `${heads}-headed hydrae`
      );
      break;
    }
    case MonsterFour.HydroPyro_5Heads: {
      const heads = getNumberOfMonsters(4, dungeonLevel, 1, 1, 5);
      text = formatMonsterCount(
        1,
        `${heads}-headed pyrohydra`,
        `${heads}-headed pyrohydrae`
      );
      break;
    }
    case MonsterFour.LycanthropeWerewolf_1to2: {
      const werewolves = getNumberOfMonsters(4, dungeonLevel, 1, 2);
      text = formatMonsterCount(
        werewolves,
        'werewolf lycanthrope',
        'werewolf lycanthropes'
      );
      break;
    }
    case MonsterFour.MoldYellow: {
      const yellowMolds = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      text = formatMonsterCount(
        yellowMolds,
        'patch of yellow mold',
        'patches of yellow mold'
      );
      break;
    }
    case MonsterFour.Owlbear_1to2: {
      const owlbears = getNumberOfMonsters(4, dungeonLevel, 1, 2);
      text = formatMonsterCount(owlbears, 'owlbear', 'owlbears');
      break;
    }
    case MonsterFour.RustMonster: {
      const rustMonsters = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      text = formatMonsterCount(rustMonsters, 'rust monster', 'rust monsters');
      break;
    }
    case MonsterFour.Shadow_1to3: {
      const shadows = getNumberOfMonsters(4, dungeonLevel, 1, 3);
      text = formatMonsterCount(shadows, 'shadow', 'shadows');
      break;
    }
    case MonsterFour.SnakeGiantConstrictor: {
      const snakes = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      text = formatMonsterCount(
        snakes,
        'giant constrictor snake',
        'giant constrictor snakes'
      );
      break;
    }
    case MonsterFour.SuMonster_1to2: {
      const suMonsters = getNumberOfMonsters(4, dungeonLevel, 1, 2);
      text = formatMonsterCount(suMonsters, 'su-monster', 'su-monsters');
      break;
    }
    case MonsterFour.ToadIce: {
      const iceToads = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      text = formatMonsterCount(iceToads, 'ice toad', 'ice toads');
      break;
    }
    case MonsterFour.ToadPoisonous_1to3: {
      const toads = getNumberOfMonsters(4, dungeonLevel, 1, 3);
      text = formatMonsterCount(toads, 'poisonous toad', 'poisonous toads');
      break;
    }
  }
  return { text, party };
};

export const monsterFourResult = (dungeonLevel: number): string => {
  const roll = rollDice(monsterFour.sides);
  const command = getTableEntry(roll, monsterFour);
  return monsterFourTextForCommand(dungeonLevel, command).text;
};

export const dragonFourYoungerTextForCommand = (
  dungeonLevel: number,
  command: DragonFourYounger
): string => {
  const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
  const sharedSuffix =
    '(Determine the number of hit dice for a dragon as normal.) ';
  let text = '';
  switch (command) {
    case DragonFourYounger.Black_Young_2:
      text =
        formatMonsterCount(
          dragons,
          'young black dragon with 2 hit points per die',
          'young black dragons with 2 hit points per die'
        ) + sharedSuffix;
      break;
    case DragonFourYounger.Blue_VeryYoung_1:
      text =
        formatMonsterCount(
          dragons,
          'very young blue dragon with 1 hit point per die',
          'very young blue dragons with 1 hit point per die'
        ) + sharedSuffix;
      break;
    case DragonFourYounger.Brass_Young_2:
      text =
        formatMonsterCount(
          dragons,
          'young brass dragon with 2 hit points per die',
          'young brass dragons with 2 hit points per die'
        ) + sharedSuffix;
      break;
    case DragonFourYounger.Bronze_VeryYoung_1:
      text =
        formatMonsterCount(
          dragons,
          'very young bronze dragon with 1 hit point per die',
          'very young bronze dragons with 1 hit point per die'
        ) + sharedSuffix;
      break;
    case DragonFourYounger.Copper_VeryYoung_1:
      text =
        formatMonsterCount(
          dragons,
          'very young copper dragon with 1 hit point per die',
          'very young copper dragons with 1 hit point per die'
        ) + sharedSuffix;
      break;
    case DragonFourYounger.Gold_VeryYoung_1:
      text =
        formatMonsterCount(
          dragons,
          'very young gold dragon with 1 hit point per die',
          'very young gold dragons with 1 hit point per die'
        ) + sharedSuffix;
      break;
    case DragonFourYounger.Green_VeryYoung_1:
      text =
        formatMonsterCount(
          dragons,
          'very young green dragon with 1 hit point per die',
          'very young green dragons with 1 hit point per die'
        ) + sharedSuffix;
      break;
    case DragonFourYounger.Red_VeryYoung_1:
      text =
        formatMonsterCount(
          dragons,
          'very young red dragon with 1 hit point per die',
          'very young red dragons with 1 hit point per die'
        ) + sharedSuffix;
      break;
    case DragonFourYounger.Silver_VeryYoung_1:
      text =
        formatMonsterCount(
          dragons,
          'very young silver dragon with 1 hit point per die',
          'very young silver dragons with 1 hit point per die'
        ) + sharedSuffix;
      break;
    case DragonFourYounger.White_Young_2:
      text =
        formatMonsterCount(
          dragons,
          'young white dragon with 2 hit points per die',
          'young white dragons with 2 hit points per die'
        ) + sharedSuffix;
      break;
  }
  return text;
};

export const dragonFourOlderTextForCommand = (
  dungeonLevel: number,
  command: DragonFourOlder
): string => {
  const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
  const make = (color: string, age: string, hp: number) =>
    formatMonsterCount(
      dragons,
      `${age} ${color} dragon with ${hp} hit point per die`,
      `${age} ${color} dragons with ${hp} hit points per die`
    ) + '(Determine the number of hit dice for a dragon as normal.) ';
  let text = '';
  switch (command) {
    case DragonFourOlder.Black_SubAdult_3:
      text = make('black', 'sub-adult', 3);
      break;
    case DragonFourOlder.Blue_Young_2:
      text = make('blue', 'young', 2);
      break;
    case DragonFourOlder.Brass_SubAdult_3:
      text = make('brass', 'sub-adult', 3);
      break;
    case DragonFourOlder.Bronze_Young_2:
      text = make('bronze', 'young', 2);
      break;
    case DragonFourOlder.Copper_Young_2:
      text = make('copper', 'young', 2);
      break;
    case DragonFourOlder.Gold_Young_2:
      text = make('gold', 'young', 2);
      break;
    case DragonFourOlder.Green_Young_2:
      text = make('green', 'young', 2);
      break;
    case DragonFourOlder.Red_Young_2:
      text = make('red', 'young', 2);
      break;
    case DragonFourOlder.Silver_Young_2:
      text = make('silver', 'young', 2);
      break;
    case DragonFourOlder.White_SubAdult_3:
      text = make('white', 'sub-adult', 3);
      break;
  }
  return text;
};
