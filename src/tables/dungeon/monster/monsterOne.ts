import type { Table } from "../dungeonTypes";

export enum MonsterOne {
  AntGiant_1to4,
  Badger_1to4_Hobgoblin_2to8,
  BeetleFire_1to4,
  DemonManes_1to4,
  Dwarf_4to14,
  EarSeeker_1,
  Elf_4to11, // corrected from 3-11 to 4-11, per Fiend Folio, and since 3-11 doesn't make sense
  Gnome_5to15,
  Goblin_6to15,
  Halfling_9to16_RatGiant_5to20,
  Hobgoblin_2to8,
  Human,
  Kobold_6to18,
  Orc_7to12,
  Piercer_1to3,
  RatGiant_5to20,
  RotGrub_1to3,
  Shrieker_1to2,
  Skeleton_1to4,
  Zombie_1to3,
}

export const monsterOne: Table<MonsterOne> = {
  sides: 100,
  entries: [
    { range: [1, 2], command: MonsterOne.AntGiant_1to4 },
    { range: [3, 4], command: MonsterOne.Badger_1to4_Hobgoblin_2to8 },
    { range: [5, 14], command: MonsterOne.BeetleFire_1to4 },
    { range: [15], command: MonsterOne.DemonManes_1to4 },
    { range: [16, 17], command: MonsterOne.Dwarf_4to14 },
    { range: [18], command: MonsterOne.EarSeeker_1 },
    { range: [19], command: MonsterOne.Elf_4to11 },
    { range: [20, 21], command: MonsterOne.Gnome_5to15 },
    { range: [22, 26], command: MonsterOne.Goblin_6to15 },
    { range: [27, 28], command: MonsterOne.Halfling_9to16_RatGiant_5to20 },
    { range: [29, 33], command: MonsterOne.Hobgoblin_2to8 },
    { range: [34, 48], command: MonsterOne.Human },
    { range: [49, 54], command: MonsterOne.Kobold_6to18 },
    { range: [55, 66], command: MonsterOne.Orc_7to12 },
    { range: [67, 70], command: MonsterOne.Piercer_1to3 },
    { range: [71, 83], command: MonsterOne.RatGiant_5to20 },
    { range: [84, 85], command: MonsterOne.RotGrub_1to3 },
    { range: [86, 96], command: MonsterOne.Shrieker_1to2 },
    { range: [97, 98], command: MonsterOne.Skeleton_1to4 },
    { range: [99, 100], command: MonsterOne.Zombie_1to3 },
  ],
};

export enum Human {
  Bandit_5to15,
  Berserker_3to9,
  Brigand_5to15,
  Character,
}

export const human: Table<Human> = {
  sides: 100,
  entries: [
    { range: [1, 25], command: Human.Bandit_5to15 },
    { range: [26, 30], command: Human.Berserker_3to9 },
    { range: [31, 45], command: Human.Brigand_5to15 },
    { range: [46, 100], command: Human.Character },
  ],
};
