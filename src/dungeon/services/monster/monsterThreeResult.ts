import {
  formatMonsterCount,
  getNumberOfMonsters,
} from "../wanderingMonsterResult";
import { getTableEntry, rollDice } from "../../helpers/dungeonLookup";
import {
  DragonThree,
  dragonThree,
  MonsterThree,
  monsterThree,
} from "../../../tables/dungeon/monster/monsterThree";
import { characterResult } from "./characterResult";

export const monsterThreeResult = (dungeonLevel: number): string => {
  const roll = rollDice(monsterThree.sides);
  const command = getTableEntry(roll, monsterThree);
  switch (command) {
    case MonsterThree.BeetleBoring_1to3: {
      const beetles = getNumberOfMonsters(3, dungeonLevel, 1, 3);
      return formatMonsterCount(beetles, "boring beetle", "boring beetles");
    }
    case MonsterThree.Bugbear_2to7: {
      const bugbears = getNumberOfMonsters(3, dungeonLevel, 1, 6, 1);
      return formatMonsterCount(bugbears, "bugbear", "bugbears");
    }
    case MonsterThree.Character:
      return characterResult(3, dungeonLevel);
    case MonsterThree.Dragon:
      return dragonThreeResult();
    case MonsterThree.FungiViolet_1to3: {
      const fungi = getNumberOfMonsters(3, dungeonLevel, 1, 3);
      return formatMonsterCount(fungi, "violet fungus", "violet fungi");
    }
    case MonsterThree.GelatinousCube:
      return "There is a gelatinous cube. ";
    case MonsterThree.Ghoul_1to4: {
      const ghouls = getNumberOfMonsters(3, dungeonLevel, 1, 4);
      return formatMonsterCount(ghouls, "ghoul", "ghouls");
    }
    case MonsterThree.LizardGiant_1to3: {
      const lizards = getNumberOfMonsters(3, dungeonLevel, 1, 3);
      return formatMonsterCount(lizards, "giant lizard", "giant lizards");
    }
    case MonsterThree.LycanthropeWererat_2to5: {
      const wererats = getNumberOfMonsters(3, dungeonLevel, 1, 4, 1);
      return formatMonsterCount(
        wererats,
        "wererat lycanthrope",
        "wererat lycanthropes"
      );
    }
    case MonsterThree.OchreJelly:
      return "There is an ochre jelly. ";
    case MonsterThree.Ogre_1to3: {
      const ogres = getNumberOfMonsters(3, dungeonLevel, 1, 3);
      return formatMonsterCount(ogres, "ogre", "ogres");
    }
    case MonsterThree.Piercer_2to5: {
      const piercers = getNumberOfMonsters(3, dungeonLevel, 1, 4, 1);
      return formatMonsterCount(piercers, "piercer", "piercers");
    }
    case MonsterThree.RotGrub_1to4: {
      const rotGrubs = getNumberOfMonsters(3, dungeonLevel, 1, 4);
      return formatMonsterCount(rotGrubs, "rot grub", "rot grubs");
    }
    case MonsterThree.Shrieker_2to5: {
      const shriekers = getNumberOfMonsters(3, dungeonLevel, 1, 4, 1);
      return formatMonsterCount(shriekers, "shrieker", "shriekers");
    }
    case MonsterThree.SpiderHuge_1to3: {
      const spiders = getNumberOfMonsters(3, dungeonLevel, 1, 3);
      return formatMonsterCount(spiders, "huge spider", "huge spiders");
    }
    case MonsterThree.SpiderLarge_2to5: {
      const spiders = getNumberOfMonsters(3, dungeonLevel, 1, 4, 1);
      return formatMonsterCount(spiders, "large spider", "large spiders");
    }
    case MonsterThree.TickGiant_1to3: {
      const ticks = getNumberOfMonsters(3, dungeonLevel, 1, 3);
      return formatMonsterCount(ticks, "giant tick", "giant ticks");
    }
    case MonsterThree.WeaselGiant_1to4: {
      const weasels = getNumberOfMonsters(3, dungeonLevel, 1, 4);
      return formatMonsterCount(weasels, "giant weasel", "giant weasels");
    }
  }
};

const dragonThreeResult = (): string => {
  const dragonRoll = rollDice(dragonThree.sides);
  const dragonCommand = getTableEntry(dragonRoll, dragonThree);
  switch (dragonCommand) {
    case DragonThree.Black_VeryYoung_1:
      return (
        "There is a very young black dragon with 1 hit point per die. " +
        "(Determine the number of hit dice for a dragon as normal.) "
      );
    case DragonThree.Brass_VeryYoung_1:
      return (
        "There is a very young brass dragon with 1 hit point per die. " +
        "(Determine the number of hit dice for a dragon as normal.) "
      );
    case DragonThree.White_VeryYoung_1:
      return (
        "There is a very young white dragon with 1 hit point per die. " +
        "(Determine the number of hit dice for a dragon as normal.) "
      );
  }
};
