import {
  formatMonsterCount,
  getNumberOfMonsters,
} from "../wanderingMonsterResult";
import { getTableEntry, rollDice } from "../../helpers/dungeonLookup";
import { characterResult } from "./characterResult";
import {
  DragonFourOlder,
  dragonFourOlder,
  DragonFourYounger,
  dragonFourYounger,
  MonsterFour,
  monsterFour,
} from "../../../tables/dungeon/monster/monsterFour";

export const monsterFourResult = (dungeonLevel: number): string => {
  const roll = rollDice(monsterFour.sides);
  const command = getTableEntry(roll, monsterFour);
  switch (command) {
    case MonsterFour.ApeCarnivorous_1to3: {
      const apes = getNumberOfMonsters(4, dungeonLevel, 1, 3);
      return formatMonsterCount(apes, "carnivorous ape", "carnivorous apes");
    }
    case MonsterFour.BlinkDog_2to5: {
      const blinkDogs = getNumberOfMonsters(4, dungeonLevel, 1, 4, 1);
      return formatMonsterCount(blinkDogs, "blink dog", "blink dogs");
    }
    case MonsterFour.Character:
      return characterResult(4, dungeonLevel);
    case MonsterFour.DragonYounger:
      return dragonFourYoungerResult(dungeonLevel);
    case MonsterFour.DragonOlder:
      return dragonFourOlderResult(dungeonLevel);
    case MonsterFour.Gargoyle_1to2: {
      const gargoyles = getNumberOfMonsters(4, dungeonLevel, 1, 2);
      return formatMonsterCount(gargoyles, "gargoyle", "gargoyles");
    }
    case MonsterFour.Ghast_1to4: {
      const ghasts = getNumberOfMonsters(4, dungeonLevel, 1, 4);
      return formatMonsterCount(ghasts, "ghast", "ghasts");
    }
    case MonsterFour.GrayOoze: {
      const oozes = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return formatMonsterCount(oozes, "gray ooze", "gray oozes");
    }
    case MonsterFour.Hellhound_1to2: {
      const hounds = getNumberOfMonsters(4, dungeonLevel, 1, 2);
      return formatMonsterCount(hounds, "hell hound", "hell hounds");
    }
    case MonsterFour.Hydra_5to6Heads: {
      const hydrae = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      const heads = rollDice(2) + 4;
      return formatMonsterCount(
        hydrae,
        `${heads}-headed hydra`,
        `${heads}-headed hydrae`
      );
    }
    case MonsterFour.HydroPyro_5Heads: {
      const hydrae = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return formatMonsterCount(
        hydrae,
        `5-headed pyrohydra`,
        `5-headed pyrohydrae`
      );
    }
    case MonsterFour.LycanthropeWerewolf_1to2: {
      const werewolves = getNumberOfMonsters(4, dungeonLevel, 1, 2);
      return formatMonsterCount(
        werewolves,
        "werewolf lycanthrope",
        "werewolf lycanthropes"
      );
    }
    case MonsterFour.MoldYellow: {
      const yellowMolds = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return formatMonsterCount(
        yellowMolds,
        "patch of yellow mold",
        "patches of yellow mold"
      );
    }
    case MonsterFour.Owlbear_1to2: {
      const owlbears = getNumberOfMonsters(4, dungeonLevel, 1, 2);
      return formatMonsterCount(owlbears, "owlbear", "owlbears");
    }
    case MonsterFour.RustMonster: {
      const rustMonsters = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return formatMonsterCount(rustMonsters, "rust monster", "rust monsters");
    }
    case MonsterFour.Shadow_1to3: {
      const shadows = getNumberOfMonsters(4, dungeonLevel, 1, 3);
      return formatMonsterCount(shadows, "shadow", "shadows");
    }
    case MonsterFour.SnakeGiantConstrictor: {
      const snakes = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return formatMonsterCount(
        snakes,
        "giant constrictor snake",
        "giant constrictor snakes"
      );
    }
    case MonsterFour.SuMonster_1to2: {
      const suMonsters = getNumberOfMonsters(4, dungeonLevel, 1, 2);
      return formatMonsterCount(suMonsters, "su-monster", "su-monsters");
    }
    case MonsterFour.ToadIce: {
      const iceToads = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return formatMonsterCount(iceToads, "ice toad", "ice toads");
    }
    case MonsterFour.ToadPoisonous_1to3: {
      const toads = getNumberOfMonsters(4, dungeonLevel, 1, 3);
      return formatMonsterCount(toads, "poisonous toad", "poisonous toads");
    }
  }
};

const dragonFourYoungerResult = (dungeonLevel: number): string => {
  const dragonRoll = rollDice(dragonFourYounger.sides);
  const dragonCommand = getTableEntry(dragonRoll, dragonFourYounger);
  switch (dragonCommand) {
    case DragonFourYounger.Black_Young_2: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "young black dragon with 2 hit points per die",
          "young black dragons with 2 hit points per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
    case DragonFourYounger.Blue_VeryYoung_1: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "very young blue dragon with 1 hit point per die",
          "very young blue dragons with 1 hit point per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
    case DragonFourYounger.Brass_Young_2: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "young brass dragon with 2 hit points per die",
          "young brass dragons with 2 hit points per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
    case DragonFourYounger.Bronze_VeryYoung_1: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "very young bronze dragon with 1 hit point per die",
          "very young bronze dragons with 1 hit point per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
    case DragonFourYounger.Copper_VeryYoung_1: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "very young copper dragon with 1 hit point per die",
          "very young copper dragons with 1 hit point per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
    case DragonFourYounger.Gold_VeryYoung_1: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "very young gold dragon with 1 hit point per die",
          "very young gold dragons with 1 hit point per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
    case DragonFourYounger.Green_VeryYoung_1: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "very young green dragon with 1 hit point per die",
          "very young green dragons with 1 hit point per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
    case DragonFourYounger.Red_VeryYoung_1: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "very young red dragon with 1 hit point per die",
          "very young red dragons with 1 hit point per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
    case DragonFourYounger.Silver_VeryYoung_1: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "very young silver dragon with 1 hit point per die",
          "very young silver dragons with 1 hit point per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
    case DragonFourYounger.White_Young_2: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "young white dragon with 2 hit points per die",
          "young white dragons with 2 hit points per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
  }
};

const dragonFourOlderResult = (dungeonLevel: number): string => {
  const dragonRoll = rollDice(dragonFourOlder.sides);
  const dragonCommand = getTableEntry(dragonRoll, dragonFourOlder);
  switch (dragonCommand) {
    case DragonFourOlder.Black_SubAdult_3: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "sub-adult black dragon with 3 hit points per die",
          "sub-adult black dragons with 3 hit points per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
    case DragonFourOlder.Blue_Young_2: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "young blue dragon with 2 hit point per die",
          "young blue dragons with 2 hit point per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
    case DragonFourOlder.Brass_SubAdult_3: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "sub-adult brass dragon with 3 hit points per die",
          "sub-adult brass dragons with 3 hit points per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
    case DragonFourOlder.Bronze_Young_2: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "young bronze dragon with 2 hit point per die",
          "young bronze dragons with 2 hit point per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
    case DragonFourOlder.Copper_Young_2: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "young copper dragon with 2 hit point per die",
          "young copper dragons with 2 hit point per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
    case DragonFourOlder.Gold_Young_2: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "young gold dragon with 2 hit point per die",
          "young gold dragons with 2 hit point per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
    case DragonFourOlder.Green_Young_2: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "young green dragon with 2 hit point per die",
          "young green dragons with 2 hit point per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
    case DragonFourOlder.Red_Young_2: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "young red dragon with 2 hit point per die",
          "young red dragons with 2 hit point per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
    case DragonFourOlder.Silver_Young_2: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "young silver dragon with 2 hit point per die",
          "young silver dragons with 2 hit point per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
    case DragonFourOlder.White_SubAdult_3: {
      const dragons = getNumberOfMonsters(4, dungeonLevel, 1, 1);
      return (
        formatMonsterCount(
          dragons,
          "sub-adult white dragon with 3 hit points per die",
          "sub-adult white dragons with 3 hit points per die"
        ) + "(Determine the number of hit dice for a dragon as normal.) "
      );
    }
  }
};
