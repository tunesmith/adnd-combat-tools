import { Table } from "../dungeonTypes";

export enum MonsterTwo {
  Badger_1to4_Gnoll_4to10,
  CentipedeGiant_3to13,
  Character,
  DevilLemure_2to5,
  GasSpore_1to2,
  Gnoll_4to10,
  Piercer_1to4,
  RatGiant_6to24,
  RotGrub_1to4,
  Shrieker_1to3,
  Stirge_5to15,
  ToadGiant_1to4,
  Troglodyte_2to8,
}

export const monsterTwo: Table<MonsterTwo> = {
  sides: 100,
  entries: [
    { range: [1], command: MonsterTwo.Badger_1to4_Gnoll_4to10 },
    { range: [2, 16], command: MonsterTwo.CentipedeGiant_3to13 },
    { range: [17, 27], command: MonsterTwo.Character },
    { range: [28, 29], command: MonsterTwo.DevilLemure_2to5 },
    { range: [30, 31], command: MonsterTwo.GasSpore_1to2 },
    { range: [32, 38], command: MonsterTwo.Gnoll_4to10 },
    { range: [39, 46], command: MonsterTwo.Piercer_1to4 },
    { range: [47, 58], command: MonsterTwo.RatGiant_6to24 },
    { range: [59, 60], command: MonsterTwo.RotGrub_1to4 },
    { range: [61, 72], command: MonsterTwo.Shrieker_1to3 },
    { range: [73, 77], command: MonsterTwo.Stirge_5to15 },
    { range: [78, 87], command: MonsterTwo.ToadGiant_1to4 },
    { range: [88, 100], command: MonsterTwo.Troglodyte_2to8 },
  ],
};
