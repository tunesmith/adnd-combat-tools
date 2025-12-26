import { formatMonsterCount, getNumberOfMonsters } from '../monsterCounts';
import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import { MonsterTwo, monsterTwo } from './monsterTwoTable';
import { characterResult } from '../../../services/monster/characterResult';
import type { PartyResult } from '../../../models/character/characterSheet';

type MonsterTextResult = {
  text: string;
  party?: PartyResult;
};

export const monsterTwoTextForCommand = (
  dungeonLevel: number,
  command: MonsterTwo
): MonsterTextResult => {
  let text = '';
  let party: PartyResult | undefined;
  switch (command) {
    case MonsterTwo.Badger_1to4_Gnoll_4to10: {
      if (dungeonLevel <= 3) {
        const badgers = getNumberOfMonsters(2, dungeonLevel, 1, 4);
        text = formatMonsterCount(badgers, 'badger', 'badgers');
      } else {
        const gnolls = getNumberOfMonsters(2, dungeonLevel, 2, 4, 2);
        text = formatMonsterCount(gnolls, 'gnoll', 'gnolls');
      }
      break;
    }
    case MonsterTwo.CentipedeGiant_3to13: {
      const centipedes = getNumberOfMonsters(2, dungeonLevel, 2, 6, 1);
      text = formatMonsterCount(
        centipedes,
        'giant centipede',
        'giant centipedes'
      );
      break;
    }
    case MonsterTwo.Character: {
      const characters = characterResult(2, dungeonLevel);
      text = '';
      party = characters;
      break;
    }
    case MonsterTwo.DevilLemure_2to5: {
      const devils = getNumberOfMonsters(2, dungeonLevel, 1, 4, 1);
      text = formatMonsterCount(devils, 'lemure devil', 'lemure devils');
      break;
    }
    case MonsterTwo.GasSpore_1to2: {
      const gasSpores = getNumberOfMonsters(2, dungeonLevel, 1, 2);
      text = formatMonsterCount(gasSpores, 'gas spore', 'gas spores');
      break;
    }
    case MonsterTwo.Gnoll_4to10: {
      const gnolls = getNumberOfMonsters(2, dungeonLevel, 2, 4, 2);
      text = formatMonsterCount(gnolls, 'gnoll', 'gnolls');
      break;
    }
    case MonsterTwo.Piercer_1to4: {
      const piercers = getNumberOfMonsters(2, dungeonLevel, 1, 4);
      text = formatMonsterCount(piercers, 'piercer', 'piercers');
      break;
    }
    case MonsterTwo.RatGiant_6to24: {
      const giantRats = getNumberOfMonsters(2, dungeonLevel, 6, 4);
      text = formatMonsterCount(giantRats, 'giant rat', 'giant rats');
      break;
    }
    case MonsterTwo.RotGrub_1to4: {
      const rotGrubs = getNumberOfMonsters(2, dungeonLevel, 1, 4);
      text = formatMonsterCount(rotGrubs, 'rot grubs', 'rot grubs');
      break;
    }
    case MonsterTwo.Shrieker_1to3: {
      const shriekers = getNumberOfMonsters(2, dungeonLevel, 1, 3);
      text = formatMonsterCount(shriekers, 'shrieker', 'shriekers');
      break;
    }
    case MonsterTwo.Stirge_5to15: {
      const stirges = getNumberOfMonsters(2, dungeonLevel, 2, 6, 3);
      text = formatMonsterCount(stirges, 'stirge', 'stirges');
      break;
    }
    case MonsterTwo.ToadGiant_1to4: {
      const toads = getNumberOfMonsters(2, dungeonLevel, 1, 4);
      text = formatMonsterCount(toads, 'giant toad', 'giant toads');
      break;
    }
    case MonsterTwo.Troglodyte_2to8: {
      const troglodytes = getNumberOfMonsters(2, dungeonLevel, 2, 4);
      text = formatMonsterCount(troglodytes, 'troglodyte', 'troglodytes');
      break;
    }
  }
  return { text, party };
};

export const monsterTwoResult = (dungeonLevel: number): string => {
  const roll = rollDice(monsterTwo.sides);
  const command = getTableEntry(roll, monsterTwo);
  return monsterTwoTextForCommand(dungeonLevel, command).text;
};
