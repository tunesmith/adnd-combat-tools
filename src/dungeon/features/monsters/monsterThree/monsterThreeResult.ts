import { formatMonsterCount, getNumberOfMonsters } from '../monsterCounts';
import { DragonThree, MonsterThree } from './monsterThreeTables';
import { characterResult } from '../../../services/monster/characterResult';
import { dragonSubtableReminder } from '../dragonSubtableReminder';
import type { PartyResult } from '../../../models/character/characterSheet';

type MonsterTextResult = {
  text: string;
  party?: PartyResult;
};

export const monsterThreeTextForCommand = (
  dungeonLevel: number,
  command: MonsterThree
): MonsterTextResult => {
  let text = '';
  let party: PartyResult | undefined;
  switch (command) {
    case MonsterThree.BeetleBoring_1to3: {
      const beetles = getNumberOfMonsters(3, dungeonLevel, 1, 3);
      text = formatMonsterCount(beetles, 'boring beetle', 'boring beetles');
      break;
    }
    case MonsterThree.Bugbear_2to7: {
      const bugbears = getNumberOfMonsters(3, dungeonLevel, 1, 6, 1);
      text = formatMonsterCount(bugbears, 'bugbear', 'bugbears');
      break;
    }
    case MonsterThree.Character: {
      const characters = characterResult(2, dungeonLevel);
      text = '';
      party = characters;
      break;
    }
    case MonsterThree.Dragon:
      text = dragonSubtableReminder('A dragon is indicated');
      break;
    case MonsterThree.FungiViolet_1to3: {
      const fungi = getNumberOfMonsters(3, dungeonLevel, 1, 3);
      text = formatMonsterCount(fungi, 'violet fungus', 'violet fungi');
      break;
    }
    case MonsterThree.GelatinousCube: {
      const cubes = getNumberOfMonsters(3, dungeonLevel, 1, 1);
      text = formatMonsterCount(cubes, 'gelatinous cube', 'gelatinous cubes');
      break;
    }
    case MonsterThree.Ghoul_1to4: {
      const ghouls = getNumberOfMonsters(3, dungeonLevel, 1, 4);
      text = formatMonsterCount(ghouls, 'ghoul', 'ghouls');
      break;
    }
    case MonsterThree.LizardGiant_1to3: {
      const lizards = getNumberOfMonsters(3, dungeonLevel, 1, 3);
      text = formatMonsterCount(lizards, 'giant lizard', 'giant lizards');
      break;
    }
    case MonsterThree.LycanthropeWererat_2to5: {
      const wererats = getNumberOfMonsters(3, dungeonLevel, 1, 4, 1);
      text = formatMonsterCount(
        wererats,
        'wererat lycanthrope',
        'wererat lycanthropes'
      );
      break;
    }
    case MonsterThree.OchreJelly: {
      const jelly = getNumberOfMonsters(3, dungeonLevel, 1, 1);
      text = formatMonsterCount(jelly, 'jelly', 'jelly');
      break;
    }
    case MonsterThree.Ogre_1to3: {
      const ogres = getNumberOfMonsters(3, dungeonLevel, 1, 3);
      text = formatMonsterCount(ogres, 'ogre', 'ogres');
      break;
    }
    case MonsterThree.Piercer_2to5: {
      const piercers = getNumberOfMonsters(3, dungeonLevel, 1, 4, 1);
      text = formatMonsterCount(piercers, 'piercer', 'piercers');
      break;
    }
    case MonsterThree.RotGrub_1to4: {
      const rotGrubs = getNumberOfMonsters(3, dungeonLevel, 1, 4);
      text = formatMonsterCount(rotGrubs, 'rot grub', 'rot grubs');
      break;
    }
    case MonsterThree.Shrieker_2to5: {
      const shriekers = getNumberOfMonsters(3, dungeonLevel, 1, 4, 1);
      text = formatMonsterCount(shriekers, 'shrieker', 'shriekers');
      break;
    }
    case MonsterThree.SpiderHuge_1to3: {
      const spiders = getNumberOfMonsters(3, dungeonLevel, 1, 3);
      text = formatMonsterCount(spiders, 'huge spider', 'huge spiders');
      break;
    }
    case MonsterThree.SpiderLarge_2to5: {
      const spiders = getNumberOfMonsters(3, dungeonLevel, 1, 4, 1);
      text = formatMonsterCount(spiders, 'large spider', 'large spiders');
      break;
    }
    case MonsterThree.TickGiant_1to3: {
      const ticks = getNumberOfMonsters(3, dungeonLevel, 1, 3);
      text = formatMonsterCount(ticks, 'giant tick', 'giant ticks');
      break;
    }
    case MonsterThree.WeaselGiant_1to4: {
      const weasels = getNumberOfMonsters(3, dungeonLevel, 1, 4);
      text = formatMonsterCount(weasels, 'giant weasel', 'giant weasels');
      break;
    }
  }
  return { text, party };
};

export const dragonThreeTextForCommand = (
  dungeonLevel: number,
  command: DragonThree
): string => {
  const dragons = getNumberOfMonsters(3, dungeonLevel, 1, 1);
  const sharedSuffix =
    '(Determine the number of hit dice for a dragon as normal.) ';
  let text = '';
  switch (command) {
    case DragonThree.Black_VeryYoung_1:
      text =
        formatMonsterCount(
          dragons,
          'very young black dragon with 1 hit point per die',
          'very young black dragons with 1 hit point per die'
        ) + sharedSuffix;
      break;
    case DragonThree.Brass_VeryYoung_1:
      text =
        formatMonsterCount(
          dragons,
          'very young brass dragon with 1 hit point per die',
          'very young brass dragons with 1 hit point per die'
        ) + sharedSuffix;
      break;
    case DragonThree.White_VeryYoung_1:
      text =
        formatMonsterCount(
          dragons,
          'very young white dragon with 1 hit point per die',
          'very young white dragons with 1 hit point per die'
        ) + sharedSuffix;
      break;
  }
  return text;
};
