import type { Table } from '../../../../tables/dungeon/dungeonTypes';

export enum MonsterThree {
  BeetleBoring_1to3,
  Bugbear_2to7,
  Character,
  Dragon,
  FungiViolet_1to3,
  GelatinousCube,
  Ghoul_1to4,
  LizardGiant_1to3,
  LycanthropeWererat_2to5,
  OchreJelly,
  Ogre_1to3,
  Piercer_2to5,
  RotGrub_1to4,
  Shrieker_2to5,
  SpiderHuge_1to3,
  SpiderLarge_2to5,
  TickGiant_1to3,
  WeaselGiant_1to4,
}

export const monsterThree: Table<MonsterThree> = {
  sides: 100,
  entries: [
    { range: [1, 10], command: MonsterThree.BeetleBoring_1to3 },
    { range: [11, 20], command: MonsterThree.Bugbear_2to7 },
    { range: [21, 30], command: MonsterThree.Character },
    { range: [31, 32], command: MonsterThree.Dragon },
    { range: [33, 34], command: MonsterThree.FungiViolet_1to3 },
    { range: [35, 40], command: MonsterThree.GelatinousCube },
    { range: [41, 45], command: MonsterThree.Ghoul_1to4 },
    { range: [46, 50], command: MonsterThree.LizardGiant_1to3 },
    { range: [51, 54], command: MonsterThree.LycanthropeWererat_2to5 },
    { range: [55, 60], command: MonsterThree.OchreJelly },
    { range: [61, 72], command: MonsterThree.Ogre_1to3 },
    { range: [73, 74], command: MonsterThree.Piercer_2to5 },
    { range: [75], command: MonsterThree.RotGrub_1to4 },
    { range: [76, 77], command: MonsterThree.Shrieker_2to5 },
    { range: [78, 84], command: MonsterThree.SpiderHuge_1to3 },
    { range: [85, 93], command: MonsterThree.SpiderLarge_2to5 },
    { range: [94, 95], command: MonsterThree.TickGiant_1to3 },
    { range: [96, 100], command: MonsterThree.WeaselGiant_1to4 },
  ],
};

export enum DragonThree {
  Black_VeryYoung_1,
  Brass_VeryYoung_1,
  White_VeryYoung_1,
}

export const dragonThree: Table<DragonThree> = {
  sides: 100,
  entries: [
    { range: [1, 28], command: DragonThree.Black_VeryYoung_1 },
    { range: [29, 62], command: DragonThree.Brass_VeryYoung_1 },
    { range: [63, 100], command: DragonThree.White_VeryYoung_1 },
  ],
};

