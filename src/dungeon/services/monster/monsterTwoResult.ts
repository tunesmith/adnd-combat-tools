import { getTableEntry, rollDice } from "../passage";
import { MonsterTwo, monsterTwo } from "../../../tables/dungeon/monsterLevel";
import {
  formatMonsterCount,
  getNumberOfMonsters,
} from "../wanderingMonsterResult";

export const monsterTwoResult = (dungeonLevel: number): string => {
  const roll = rollDice(monsterTwo.sides);
  const command = getTableEntry(roll, monsterTwo) as MonsterTwo;
  switch (command) {
    case MonsterTwo.Badger_1to4_Gnoll_4to10: {
      if (dungeonLevel <= 3) {
        const badgers = getNumberOfMonsters(2, dungeonLevel, 1, 4);
        return formatMonsterCount(badgers, "badger", "badgers");
      } else {
        const gnolls = getNumberOfMonsters(2, dungeonLevel, 2, 4, 2);
        return formatMonsterCount(gnolls, "gnoll", "gnolls");
      }
    }
    case MonsterTwo.CentipedeGiant_3to13: {
      const centipedes = getNumberOfMonsters(2, dungeonLevel, 2, 6, 1);
      return formatMonsterCount(
        centipedes,
        "giant centipede",
        "giant centipedes"
      );
    }
    case MonsterTwo.Character:
      return `(TODO: Roll Character Subtable for monsterLevel 2 and dungeonLevel ${dungeonLevel}.)`;
    case MonsterTwo.DevilLemure_2to5: {
      const devils = getNumberOfMonsters(2, dungeonLevel, 1, 4, 1);
      return formatMonsterCount(devils, "lemure devil", "lemure devils");
    }
    case MonsterTwo.GasSpore_1to2: {
      const gasSpores = getNumberOfMonsters(2, dungeonLevel, 1, 2);
      return formatMonsterCount(gasSpores, "gas spore", "gas spores");
    }
    case MonsterTwo.Gnoll_4to10: {
      const gnolls = getNumberOfMonsters(2, dungeonLevel, 2, 4, 2);
      return formatMonsterCount(gnolls, "gnoll", "gnolls");
    }
    case MonsterTwo.Piercer_1to4: {
      const piercers = getNumberOfMonsters(2, dungeonLevel, 1, 4);
      return formatMonsterCount(piercers, "piercer", "piercers");
    }
    case MonsterTwo.RatGiant_6to24: {
      const giantRats = getNumberOfMonsters(2, dungeonLevel, 6, 4);
      return formatMonsterCount(giantRats, "giant rat", "giant rats");
    }
    case MonsterTwo.RotGrub_1to4: {
      const rotGrubs = getNumberOfMonsters(2, dungeonLevel, 1, 4);
      return formatMonsterCount(rotGrubs, "rot grubs", "rot grubs");
    }
    case MonsterTwo.Shrieker_1to3: {
      const shriekers = getNumberOfMonsters(2, dungeonLevel, 1, 3);
      return formatMonsterCount(shriekers, "shrieker", "shriekers");
    }
    case MonsterTwo.Stirge_5to15: {
      const stirges = getNumberOfMonsters(2, dungeonLevel, 2, 6, 3);
      return formatMonsterCount(stirges, "stirge", "stirges");
    }
    case MonsterTwo.ToadGiant_1to4: {
      const toads = getNumberOfMonsters(2, dungeonLevel, 1, 4);
      return formatMonsterCount(toads, "giant toad", "giant toads");
    }
    case MonsterTwo.Troglodyte_2to8: {
      const troglodytes = getNumberOfMonsters(2, dungeonLevel, 2, 4);
      return formatMonsterCount(troglodytes, "troglodyte", "troglodytes");
    }
  }
};
